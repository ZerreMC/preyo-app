#!/usr/bin/env node
/**
 * apply-migrations.mjs — Preyo migration runner
 *
 * Infrastructure tooling — NOT backend, NOT domain. The backend lives
 * declaratively under `supabase/` (migrations, seed, policies). This script
 * only EXECUTES those .sql files against the LXC Postgres (preyo-dev) over
 * SSH + docker compose exec. It contains no business logic.
 *
 * Principles:
 *  - `supabase/migrations/` is the immutable, historical source of truth.
 *  - Applied state is tracked in `preyo_meta.migration_history`
 *    (filename + checksum). Applied files are never re-applied, and "drift"
 *    is detected when a recorded file is edited.
 *  - Checksums are computed over NORMALIZED SQL (see normalizeSql): comments,
 *    whitespace and keyword case are ignored, so reformatting an applied
 *    migration does NOT cause false drift. Only semantic changes do.
 *  - A single-row lock (preyo_meta.migration_lock) prevents two people from
 *    applying migrations concurrently in a shared workspace.
 *
 * ── Usage ──────────────────────────────────────────────────────────────────
 *   node scripts/db/apply-migrations.mjs [options]
 *
 *   (no options)        Apply PENDING migrations. On a TTY, prompts
 *                       run/skip/mark for each file.
 *   --file <name>       Process only this file (e.g. 0003_shopping_lists.sql).
 *   --from <name>       Process from this file onward (inclusive).
 *   --all               Walk ALL files (not just pending); applied ones are
 *                       reported as SKIP unless you choose otherwise.
 *   --status            Print state (applied / pending / drift) and exit.
 *   --dry-run           Show the plan without touching the database.
 *   --seed              Seed the database (see seed resolution below).
 *   --seed-file <path>  Seed from a single .sql file.
 *   --seed-dir <path>   Seed from every .sql file in a directory (sorted).
 *   --rebaseline        Re-record normalized checksums (no SQL run).
 *   --force-unlock      Release a stale/orphaned migration lock.
 *   -y, --yes           Non-interactive: apply all pending (CI).
 *   -h, --help          This help.
 *
 * ── Per-file interactive report ─────────────────────────────────────────────
 *   [r]un   → apply the SQL and record it in history.
 *   [s]kip  → do nothing, leave it pending.
 *   [m]ark  → record it as applied WITHOUT running it (out-of-band apply, or
 *             baseline of a pre-existing backend).
 *   [q]uit  → stop and print the summary.
 *
 * ── Seed resolution (for --seed) ────────────────────────────────────────────
 *   1. supabase/seed/*.sql  (sorted) if the directory exists and is non-empty.
 *   2. supabase/seed.sql    as a fallback.
 *
 * ── Config (env vars, defaults shown) ───────────────────────────────────────
 *   PREYO_REMOTE_HOST           100.69.204.118
 *   PREYO_REMOTE_USER           yisus
 *   PREYO_REMOTE_SUPABASE_PATH  /opt/supabase/docker
 *   PREYO_REMOTE_TMP_DIR        /tmp/preyo-migrations
 *   PREYO_DB_SERVICE            db
 *   PREYO_DB_USER               postgres
 *   PREYO_DB_NAME               postgres
 *
 * SSH auth via agent/key (~/.ssh/id_ed25519). No passwords stored.
 */

import {createHash} from 'node:crypto';
import {readdirSync, readFileSync, existsSync} from 'node:fs';
import {join, resolve, dirname, basename} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {createInterface} from 'node:readline/promises';

// ─── Config ──────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const SUPABASE_DIR = join(PROJECT_ROOT, 'supabase');
const MIGRATIONS_DIR = join(SUPABASE_DIR, 'migrations');
const SEED_DIR = join(SUPABASE_DIR, 'seed');
const SEED_FILE = join(SUPABASE_DIR, 'seed.sql');

const REMOTE_HOST = process.env.PREYO_REMOTE_HOST ?? '100.69.204.118';
const REMOTE_USER = process.env.PREYO_REMOTE_USER ?? 'yisus';
const DOCKER_COMPOSE_DIR = process.env.PREYO_REMOTE_SUPABASE_PATH ?? '/opt/supabase/docker';
const REMOTE_TMP = process.env.PREYO_REMOTE_TMP_DIR ?? '/tmp/preyo-migrations';
const DB_SERVICE = process.env.PREYO_DB_SERVICE ?? 'db';
const DB_USER = process.env.PREYO_DB_USER ?? 'postgres';
const DB_NAME = process.env.PREYO_DB_NAME ?? 'postgres';

const SSH_TARGET = `${REMOTE_USER}@${REMOTE_HOST}`;
const SSH_OPTS = ['-o', 'StrictHostKeyChecking=no'];

// ─── CLI ─────────────────────────────────────────────────────────────────────

const {values} = parseArgs({
    options: {
        file: {type: 'string'},
        from: {type: 'string'},
        all: {type: 'boolean', default: false},
        status: {type: 'boolean', default: false},
        'dry-run': {type: 'boolean', default: false},
        seed: {type: 'boolean', default: false},
        'seed-file': {type: 'string'},
        'seed-dir': {type: 'string'},
        rebaseline: {type: 'boolean', default: false},
        'force-unlock': {type: 'boolean', default: false},
        yes: {type: 'boolean', short: 'y', default: false},
        help: {type: 'boolean', short: 'h', default: false},
    },
    allowPositionals: false,
});

// Who is applying (traceability for team work).
const ACTOR = resolveActor();

// ─── Local / remote execution helpers ────────────────────────────────────────

/** Run a local command. Throws (Spanish message) on failure. */
function run(file, args, extra = {}) {
    const result = spawnSync(file, args, {stdio: 'pipe', encoding: 'utf8', ...extra});
    if (result.error) throw result.error;
    if (result.status !== 0) {
        const detail = ((result.stderr ?? '') || (result.stdout ?? '')).trim();
        throw new Error(`El comando falló: ${file} ${args.join(' ')}\n${detail}`);
    }
    return (result.stdout ?? '').trim();
}

const ssh = (cmd) => run('ssh', [...SSH_OPTS, SSH_TARGET, cmd]);
const scp = (localPath, remotePath) => run('scp', [...SSH_OPTS, localPath, `${SSH_TARGET}:${remotePath}`]);

const shellQuote = (v) => `'${String(v).replace(/'/g, "'\\''")}'`;
const sqlLiteral = (v) => `'${String(v).replace(/'/g, "''")}'`;

function remotePsqlPrefix() {
    return (
        `cd ${shellQuote(DOCKER_COMPOSE_DIR)} && ` +
        `docker compose exec -T ${shellQuote(DB_SERVICE)} ` +
        `psql -h 127.0.0.1 -U ${shellQuote(DB_USER)} -d ${shellQuote(DB_NAME)} ` +
        '-v ON_ERROR_STOP=1'
    );
}

const remoteDockerComposePrefix = () => `cd ${shellQuote(DOCKER_COMPOSE_DIR)} && docker compose`;

/** Single-line SQL, returns stdout. */
const remoteSql = (sql) => ssh(`${remotePsqlPrefix()} -tAc ${shellQuote(sql)}`);

/** Multi-row SELECT, returns an array of rows (each row an array of columns). */
function remoteQuery(sql) {
    const out = ssh(`${remotePsqlPrefix()} -tAF '|' -c ${shellQuote(sql)}`);
    if (!out) return [];
    return out.split('\n').filter(Boolean).map((line) => line.split('|'));
}

function resolveActor() {
    try {
        const email = run('git', ['config', 'user.email']);
        if (email) return email;
    } catch {
        // git not available: fall back to the system user.
    }
    return process.env.USER ?? process.env.USERNAME ?? 'unknown';
}

/**
 * Normalize SQL so that pure formatting changes do NOT change the checksum.
 * Drift then only fires on a real semantic change.
 *
 * Rules (applied outside string literals and quoted identifiers):
 *  - strip line (`--`) and block (`/* *\/`, nestable) comments,
 *  - collapse every whitespace run to a single space,
 *  - lowercase (safe: PostgreSQL folds unquoted identifiers/keywords to lower).
 * Preserved verbatim: single-quoted strings ('') and double-quoted identifiers ("").
 * Dollar-quoted bodies are treated as normal SQL, which is correct: inside them
 * `'...'` are strings, `--` are comments, and whitespace is insignificant.
 *
 * Known limitation: `E'...'` backslash-escaped strings are not special-cased
 * (this codebase does not use them).
 */
function normalizeSql(sql) {
    const isWs = (ch) => ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f' || ch === '\v';
    let out = '';
    let i = 0;
    const n = sql.length;
    const pushSpace = () => {
        if (out.length && out[out.length - 1] !== ' ') out += ' ';
    };
    while (i < n) {
        const c = sql[i];
        const c2 = sql[i + 1];

        if (c === '-' && c2 === '-') {
            i += 2;
            while (i < n && sql[i] !== '\n') i++;
            pushSpace();
            continue;
        }
        if (c === '/' && c2 === '*') {
            let depth = 1;
            i += 2;
            while (i < n && depth > 0) {
                if (sql[i] === '/' && sql[i + 1] === '*') {
                    depth++;
                    i += 2;
                } else if (sql[i] === '*' && sql[i + 1] === '/') {
                    depth--;
                    i += 2;
                } else {
                    i++;
                }
            }
            pushSpace();
            continue;
        }
        if (c === "'") {
            out += "'";
            i++;
            while (i < n) {
                if (sql[i] === "'" && sql[i + 1] === "'") {
                    out += "''";
                    i += 2;
                    continue;
                }
                if (sql[i] === "'") {
                    out += "'";
                    i++;
                    break;
                }
                out += sql[i++];
            }
            continue;
        }
        if (c === '"') {
            out += '"';
            i++;
            while (i < n) {
                if (sql[i] === '"' && sql[i + 1] === '"') {
                    out += '""';
                    i += 2;
                    continue;
                }
                if (sql[i] === '"') {
                    out += '"';
                    i++;
                    break;
                }
                out += sql[i++];
            }
            continue;
        }
        if (isWs(c)) {
            pushSpace();
            i++;
            continue;
        }
        out += c.toLowerCase();
        i++;
    }
    return out.trim();
}

/** SHA-256 of the NORMALIZED contents of a .sql file. */
function checksumOf(filePath) {
    return createHash('sha256').update(normalizeSql(readFileSync(filePath, 'utf8'))).digest('hex');
}

// ─── History bootstrap ────────────────────────────────────────────────────────

/**
 * Create preyo_meta.migration_history if absent and ensure newer columns.
 * Idempotent: safe to run every time. ALTER ... IF NOT EXISTS keeps backward
 * compatibility with older installs.
 */
function bootstrapMetaTable() {
    const sql = [
        'create schema if not exists preyo_meta;',
        'create table if not exists preyo_meta.migration_history (',
        '  id         bigserial   primary key,',
        '  filename   text        not null unique,',
        '  checksum   text        not null,',
        '  applied_at timestamptz not null default now()',
        ');',
        'alter table preyo_meta.migration_history add column if not exists applied_by text;',
        "alter table preyo_meta.migration_history add column if not exists mode text not null default 'run';",
        // Single-row advisory lock so two runners never apply concurrently.
        'create table if not exists preyo_meta.migration_lock (',
        '  id        integer     primary key default 1 check (id = 1),',
        '  locked_by text        not null,',
        '  locked_at timestamptz not null default now()',
        ');',
    ].join(' ');
    ssh(`${remotePsqlPrefix()} -c ${shellQuote(sql)}`);
}

// ─── Concurrency lock ─────────────────────────────────────────────────────────

const LOCK_STALE_MINUTES = 15;

/**
 * Acquire the migration lock. Atomic: only one runner wins the row. A lock
 * older than LOCK_STALE_MINUTES is considered orphaned and is taken over.
 */
function acquireLock() {
    // Atomic upsert: take the lock if the row is free or stale. (Return value is
    // ignored to avoid parsing psql command tags — we verify with a SELECT.)
    remoteSql(
        'insert into preyo_meta.migration_lock (id, locked_by, locked_at) ' +
        `values (1, ${sqlLiteral(ACTOR)}, now()) ` +
        'on conflict (id) do update set locked_by = excluded.locked_by, locked_at = now() ' +
        `where preyo_meta.migration_lock.locked_at < now() - interval '${LOCK_STALE_MINUTES} minutes';`,
    );
    // Verify we actually hold a fresh lock.
    const held = remoteSql(
        "select locked_by || '|' || (locked_at > now() - interval '1 minute')::text " +
        'from preyo_meta.migration_lock where id = 1;',
    );
    const [who, fresh] = held.split('|');
    if (who !== ACTOR || fresh !== 'true') {
        const holder = remoteSql(
            "select locked_by || ' @ ' || to_char(locked_at, 'YYYY-MM-DD HH24:MI') " +
            'from preyo_meta.migration_lock where id = 1;',
        );
        throw new Error(
            `Hay otra migración en curso (lock de ${holder}). ` +
            'Si crees que es un lock huérfano, libéralo con --force-unlock.',
        );
    }
}

function releaseLock() {
    remoteSql('delete from preyo_meta.migration_lock where id = 1;');
}

function forceUnlock() {
    releaseLock();
    console.log('🔓  Lock liberado.');
}

/** @returns {Map<string,{checksum:string,mode:string,appliedAt:string,appliedBy:string}>} */
function loadHistory() {
    const rows = remoteQuery(
        "select filename, checksum, mode, applied_at, coalesce(applied_by, '') " +
        'from preyo_meta.migration_history order by filename;',
    );
    const map = new Map();
    for (const [filename, checksum, mode, appliedAt, appliedBy] of rows) {
        map.set(filename, {checksum, mode, appliedAt, appliedBy});
    }
    return map;
}

// ─── State model ──────────────────────────────────────────────────────────────

const STATE = {
    PENDING: 'PENDING',   // on disk, not in history
    APPLIED: 'APPLIED',   // in history with matching checksum
    MARKED: 'MARKED',     // recorded without running (mode = mark)
    DRIFT: 'DRIFT',       // in history but local checksum changed
    MISSING: 'MISSING',   // in history but file no longer on disk
};

function classify(filename, history) {
    const localPath = join(MIGRATIONS_DIR, filename);
    const checksum = checksumOf(localPath);
    const record = history.get(filename);
    if (!record) return {filename, checksum, state: STATE.PENDING};
    if (record.checksum !== checksum) return {filename, checksum, state: STATE.DRIFT, record};
    return {filename, checksum, state: record.mode === 'mark' ? STATE.MARKED : STATE.APPLIED, record};
}

// ─── Actions on a migration ─────────────────────────────────────────────────

/** Copy a local .sql to the LXC + db container and run it via psql. */
function runSqlFile(localPath, label) {
    const filename = basename(localPath);
    const remotePath = `${REMOTE_TMP}/${filename}`;
    scp(localPath, remotePath);
    ssh(`${remoteDockerComposePrefix()} cp ${shellQuote(remotePath)} ${shellQuote(`${DB_SERVICE}:${remotePath}`)}`);
    ssh(`${remotePsqlPrefix()} -f ${shellQuote(remotePath)}`);
    if (label) console.log(`    ✅  ${label}`);
}

function applyMigration(filename) {
    const localPath = join(MIGRATIONS_DIR, filename);
    runSqlFile(localPath);
    recordHistory(filename, checksumOf(localPath), 'run');
}

function recordHistory(filename, checksum, mode) {
    remoteSql(
        'insert into preyo_meta.migration_history (filename, checksum, mode, applied_by) ' +
        `values (${sqlLiteral(filename)}, ${sqlLiteral(checksum)}, ${sqlLiteral(mode)}, ${sqlLiteral(ACTOR)}) ` +
        'on conflict (filename) do update set ' +
        'checksum = excluded.checksum, mode = excluded.mode, applied_by = excluded.applied_by, applied_at = now();',
    );
}

function ensureRemoteTmpDir() {
    ssh(`mkdir -p ${shellQuote(REMOTE_TMP)}`);
    ssh(`${remoteDockerComposePrefix()} exec -T ${shellQuote(DB_SERVICE)} mkdir -p ${shellQuote(REMOTE_TMP)}`);
}

// ─── Seed ────────────────────────────────────────────────────────────────────

/** Resolve the seed files to run, honoring --seed-file / --seed-dir. */
function resolveSeedFiles() {
    if (values['seed-file']) {
        const path = resolve(values['seed-file']);
        if (!existsSync(path)) throw new Error(`No se encontró el seed: ${path}`);
        return [path];
    }
    const dir = values['seed-dir'] ? resolve(values['seed-dir']) : SEED_DIR;
    if (existsSync(dir)) {
        const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
        if (files.length > 0) return files.map((f) => join(dir, f));
        if (values['seed-dir']) throw new Error(`El directorio de seed no contiene .sql: ${dir}`);
    } else if (values['seed-dir']) {
        throw new Error(`No se encontró el directorio de seed: ${dir}`);
    }
    if (existsSync(SEED_FILE)) return [SEED_FILE];
    throw new Error(`No hay datos de seed: ni supabase/seed/*.sql ni supabase/seed.sql`);
}

function seed() {
    const files = resolveSeedFiles();
    console.log(`🌱  Seeding ${files.length} file(s):`);
    files.forEach((f) => console.log(`    • ${basename(f)}`));
    if (values['dry-run']) {
        console.log('    (dry-run: nothing applied)');
        return;
    }
    ensureRemoteTmpDir();
    for (const path of files) runSqlFile(path, `seeded ${basename(path)}`);
    console.log('✅  Seed complete.');
}

// ─── File selection ───────────────────────────────────────────────────────────

function listMigrationFiles() {
    if (!existsSync(MIGRATIONS_DIR)) return [];
    return readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
}

function selectTargets(allFiles) {
    if (values.file) {
        const name = basename(values.file);
        if (!allFiles.includes(name)) throw new Error(`No existe la migración: ${name}`);
        return [name];
    }
    if (values.from) {
        const name = basename(values.from);
        const idx = allFiles.indexOf(name);
        if (idx < 0) throw new Error(`No existe la migración: ${name}`);
        return allFiles.slice(idx);
    }
    return allFiles; // --all or default: classification decides what to skip
}

// ─── Commands ──────────────────────────────────────────────────────────────────

const icon = {
    [STATE.PENDING]: '🟡',
    [STATE.APPLIED]: '✅',
    [STATE.MARKED]: '📌',
    [STATE.DRIFT]: '⚠️ ',
    [STATE.MISSING]: '❓',
};

function printStatus(allFiles, history) {
    console.log('📊  Backend state (LXC)');
    console.log(`📡  ${SSH_TARGET}  •  DB ${DB_NAME}\n`);

    const seen = new Set();
    for (const filename of allFiles) {
        const {state, checksum} = classify(filename, history);
        seen.add(filename);
        const rec = history.get(filename);
        const meta = rec ? `  ${rec.appliedAt?.slice(0, 19) ?? ''}  ${rec.appliedBy ?? ''}` : '';
        console.log(`  ${icon[state]} ${state.padEnd(8)} ${filename}  ${checksum.slice(0, 8)}${meta}`);
    }
    for (const [filename, rec] of history) {
        if (seen.has(filename)) continue;
        console.log(`  ${icon[STATE.MISSING]} ${STATE.MISSING.padEnd(8)} ${filename}  (in history, absent on disk)  ${rec.appliedBy ?? ''}`);
    }
    console.log('');
}

const ask = async (rl, label) => (await rl.question(label)).trim().toLowerCase();

async function migrate(allFiles, history) {
    const targets = selectTargets(allFiles);
    const interactive = process.stdin.isTTY && !values.yes && !values['dry-run'];

    console.log('🚀  preyo-app — migration runner');
    console.log(`📡  ${SSH_TARGET}  •  DB ${DB_NAME}  •  actor: ${ACTOR}`);
    console.log(`📂  ${targets.length} file(s) in scope${values.file ? ' (--file)' : values.from ? ' (--from)' : ''}\n`);

    ensureRemoteTmpDir();

    const writing = !values['dry-run'];
    if (writing) acquireLock();

    const summary = {applied: [], marked: [], skipped: [], pending: [], failed: []};
    const rl = interactive ? createInterface({input: process.stdin, output: process.stdout}) : null;

    try {
        for (const filename of targets) {
            const {state, checksum} = classify(filename, history);
            console.log(`📖  ${filename}  →  ${icon[state]} ${state}  (checksum ${checksum.slice(0, 8)})`);

            if ((state === STATE.APPLIED || state === STATE.MARKED) && !values.all) {
                summary.skipped.push(filename);
                console.log('    ⏭️   already applied, skipping\n');
                continue;
            }

            if (state === STATE.DRIFT) {
                const rec = history.get(filename);
                // Error message in Spanish.
                console.error(
                    `    ⚠️   DRIFT: el fichero cambió tras aplicarse.\n` +
                    `        registrado : ${rec.checksum}\n` +
                    `        actual     : ${checksum}\n` +
                    `        → El checksum es semántico (ignora formato/comentarios), así que esto es un cambio real.\n` +
                    `        → Nunca modifiques una migración aplicada: crea una nueva. (Si solo resincronizas tras cambiar el algoritmo, usa --rebaseline.)`,
                );
                summary.failed.push(filename);
                if (!interactive) break;
                if ((await ask(rl, '    [s]kip / [q]uit: ')) === 'q') break;
                continue;
            }

            const action = interactive ? await ask(rl, '    [r]un / [s]kip / [m]ark / [q]uit: ') : 'r';

            if (action === 'q') break;
            if (action === 's') {
                summary.pending.push(filename);
                console.log('    ⏭️   skipped (still pending)\n');
                continue;
            }
            if (action === 'm') {
                if (values['dry-run']) {
                    console.log('    📌  (dry-run) would mark as applied\n');
                } else {
                    recordHistory(filename, checksum, 'mark');
                    console.log('    📌  marked as applied (not executed)\n');
                }
                summary.marked.push(filename);
                continue;
            }

            // run (default)
            if (values['dry-run']) {
                console.log('    ▶️   (dry-run) would apply this migration\n');
                summary.applied.push(filename);
                continue;
            }
            try {
                applyMigration(filename);
                summary.applied.push(filename);
                console.log('    ✅  applied\n');
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                summary.failed.push(filename);
                // Error message in Spanish.
                console.error(`    ❌  error al aplicar ${filename}\n        ${message}\n`);
                break; // ordered migrations: stop at the first failure
            }
        }
    } finally {
        rl?.close();
        if (writing) releaseLock();
    }

    printSummary(summary);
    if (summary.failed.length > 0) process.exitCode = 1;
}

function printSummary(s) {
    console.log('─────────────────────────────────────────');
    console.log('📊  Summary');
    const line = (label, arr) => arr.length && console.log(`    ${label} (${arr.length}): ${arr.join(', ')}`);
    line('✅ Applied', s.applied);
    line('📌 Marked', s.marked);
    line('⏭️  Skipped', s.skipped);
    line('🟡 Pending', s.pending);
    line('❌ Errors', s.failed);
    if (!s.applied.length && !s.marked.length && !s.failed.length) {
        console.log('    Nothing to apply — the backend is up to date.');
    }
    console.log('─────────────────────────────────────────');
}

/**
 * Re-record the (normalized) checksum for migrations already in history.
 * Use after upgrading the checksum algorithm or to clear cosmetic drift,
 * WITHOUT re-running any SQL. Only touches files present both on disk and in
 * history; never inserts new rows.
 */
function rebaseline(allFiles, history) {
    console.log('♻️   Rebaselining checksums (normalized)…\n');
    let changed = 0;
    for (const filename of allFiles) {
        const rec = history.get(filename);
        if (!rec) continue;
        const checksum = checksumOf(join(MIGRATIONS_DIR, filename));
        if (rec.checksum === checksum) continue;
        if (values['dry-run']) {
            console.log(`    (dry-run) ${filename} → ${checksum.slice(0, 8)}`);
        } else {
            remoteSql(
                `update preyo_meta.migration_history set checksum = ${sqlLiteral(checksum)} ` +
                `where filename = ${sqlLiteral(filename)};`,
            );
            console.log(`    ♻️  ${filename} → ${checksum.slice(0, 8)}`);
        }
        changed++;
    }
    console.log(changed ? `\n✅  Rebaselined ${changed} file(s).` : '\nNada que rebaselinar — los checksums ya coinciden.');
}

function printHelp() {
    console.log(`Preyo migration runner

  node scripts/db/apply-migrations.mjs [options]

  (no options)        Apply pending migrations (interactive run/skip/mark on a TTY).
  --file <f>          Only that file.
  --from <f>          From that file onward.
  --all               Walk all files (includes already applied).
  --status            Show state and exit.
  --dry-run           Plan without touching the DB.
  --seed              Seed from supabase/seed/*.sql (fallback supabase/seed.sql).
  --seed-file <path>  Seed from a single file.
  --seed-dir <path>   Seed from a directory of .sql files.
  --rebaseline        Re-record normalized checksums for applied migrations (no SQL run).
  --force-unlock      Release a stale/orphaned migration lock.
  -y, --yes           Non-interactive (CI): apply all pending.
  -h, --help          This help.

Checksums are computed over NORMALIZED SQL (comments/whitespace/keyword-case
ignored), so reformatting an applied migration does not cause false drift.
`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
    if (values.help) return printHelp();

    bootstrapMetaTable();

    if (values['force-unlock']) return forceUnlock();

    if (values.seed || values['seed-file'] || values['seed-dir']) {
        return seed();
    }

    const allFiles = listMigrationFiles();
    const history = loadHistory();

    if (allFiles.length === 0 && history.size === 0) {
        console.log('ℹ️   No migrations in supabase/migrations/');
        return;
    }

    if (values.status) return printStatus(allFiles, history);
    if (values.rebaseline) return rebaseline(allFiles, history);

    await migrate(allFiles, history);
}

main().catch((err) => {
    // Fatal error message in Spanish.
    console.error('Error fatal:', err instanceof Error ? err.message : String(err));
    process.exit(1);
});
