#!/usr/bin/env node
/**
 * apply-migrations.mjs
 *
 * Infrastructure tooling — NOT application domain.
 *
 * Applies SQL migrations from supabase/migrations/ to Supabase Local
 * running inside the Proxmox LXC (preyo-dev) via SSH + docker compose exec.
 *
 * Features:
 *  - Reads migrations in lexicographic order.
 *  - Creates preyo_meta.migration_history if it doesn't exist.
 *  - Skips already-applied migrations (same checksum).
 *  - Fails if a migration's checksum changed (never mutate applied migrations).
 *  - Copies files to the LXC via scp before applying.
 *  - Prints a summary at the end.
 *
 * Configuration (env vars, all optional — defaults shown):
 *  PREYO_REMOTE_HOST           100.69.204.118
 *  PREYO_REMOTE_USER           yisus
 *  PREYO_REMOTE_SUPABASE_PATH  /opt/supabase/docker
 *  PREYO_REMOTE_TMP_DIR        /tmp/preyo-migrations
 *  PREYO_DB_SERVICE            db
 *  PREYO_DB_USER               postgres
 *  PREYO_DB_NAME               postgres
 *
 * SSH authentication relies on your local SSH agent / key (~/.ssh/id_ed25519).
 * No passwords are stored anywhere. See scripts/db/README.md for setup.
 *
 * Usage:
 *   pnpm db:migrate:remote
 */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// ─── Config (from env, no secrets hardcoded) ─────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const MIGRATIONS_DIR = join(PROJECT_ROOT, 'supabase', 'migrations');

const REMOTE_HOST = process.env.PREYO_REMOTE_HOST ?? '100.69.204.118';
const REMOTE_USER = process.env.PREYO_REMOTE_USER ?? 'yisus';
const DOCKER_COMPOSE_DIR =
    process.env.PREYO_REMOTE_SUPABASE_PATH ?? '/opt/supabase/docker';
const REMOTE_TMP = process.env.PREYO_REMOTE_TMP_DIR ?? '/tmp/preyo-migrations';
const DB_SERVICE = process.env.PREYO_DB_SERVICE ?? 'db';
const DB_USER = process.env.PREYO_DB_USER ?? 'postgres';
const DB_NAME = process.env.PREYO_DB_NAME ?? 'postgres';

const SSH_TARGET = `${REMOTE_USER}@${REMOTE_HOST}`;

// Shared SSH options (no BatchMode=yes so interactive auth still works)
const SSH_OPTS = ['-o', 'StrictHostKeyChecking=no'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Run a local command synchronously. Throws with the stderr/stdout on failure.
 * @param {string} file
 * @param {string[]} args
 * @param {import('node:child_process').SpawnSyncOptions} [extra]
 * @returns {string} trimmed stdout
 */
function run(file, args, extra = {}) {
    const result = spawnSync(file, args, {
        stdio: 'pipe',
        encoding: 'utf8',
        ...extra,
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        const detail = ((result.stderr ?? '') || (result.stdout ?? '')).trim();
        throw new Error(`Command failed: ${file} ${args.join(' ')}\n${detail}`);
    }
    return (result.stdout ?? '').trim();
}

/**
 * Execute a shell command on the remote LXC via SSH.
 * @param {string} remoteCmd
 * @returns {string} trimmed stdout
 */
function ssh(remoteCmd) {
    return run('ssh', [...SSH_OPTS, SSH_TARGET, remoteCmd]);
}

/**
 * Copy a local file to the remote LXC via SCP.
 * @param {string} localPath
 * @param {string} remotePath
 */
function scp(localPath, remotePath) {
    run('scp', [...SSH_OPTS, localPath, `${SSH_TARGET}:${remotePath}`]);
}

/**
 * Quote a value for safe POSIX shell usage.
 * @param {string} value
 * @returns {string}
 */
function shellQuote(value) {
    return `'${value.replace(/'/g, "'\\''")}'`;
}

/**
 * Quote a value as a SQL string literal.
 * @param {string} value
 * @returns {string}
 */
function sqlLiteral(value) {
    return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Build the docker compose + psql command prefix for remote execution.
 * @returns {string}
 */
function remotePsqlPrefix() {
    return (
        `cd ${shellQuote(DOCKER_COMPOSE_DIR)} && ` +
        `docker compose exec -T ${shellQuote(DB_SERVICE)} ` +
        `psql -h 127.0.0.1 -U ${shellQuote(DB_USER)} -d ${shellQuote(DB_NAME)} ` +
        '-v ON_ERROR_STOP=1'
    );
}

/**
 * Build the docker compose command prefix for remote execution.
 * @returns {string}
 */
function remoteDockerComposePrefix() {
    return `cd ${shellQuote(DOCKER_COMPOSE_DIR)} && docker compose`;
}

/**
 * Run a single-line SQL statement remotely via docker compose exec.
 * @param {string} sql
 * @returns {string} trimmed stdout
 */
function remoteSql(sql) {
    return ssh(`${remotePsqlPrefix()} -tAc ${shellQuote(sql)}`);
}

/**
 * Bootstrap the preyo_meta schema and migration_history table.
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
    ].join(' ');

    ssh(`${remotePsqlPrefix()} -c ${shellQuote(sql)}`);
}

/**
 * Apply a migration file that was already scp'd to REMOTE_TMP.
 * @param {string} filename
 */
function applyMigration(filename) {
    ssh(
        `${remotePsqlPrefix()} -f ${shellQuote(`${REMOTE_TMP}/${filename}`)}`,
    );
}

/**
 * Ensure the migration temp directory exists on the LXC host and inside the db container.
 */
function ensureRemoteTmpDirs() {
    ssh(`mkdir -p ${shellQuote(REMOTE_TMP)}`);
    ssh(
        `${remoteDockerComposePrefix()} exec -T ${shellQuote(DB_SERVICE)} ` +
        `mkdir -p ${shellQuote(REMOTE_TMP)}`,
    );
}

/**
 * Copy a migration from the LXC host temp dir into the db container temp dir.
 * @param {string} filename
 */
function copyMigrationIntoContainer(filename) {
    const migrationPath = `${REMOTE_TMP}/${filename}`;

    ssh(
        `${remoteDockerComposePrefix()} cp ` +
        `${shellQuote(migrationPath)} ` +
        `${shellQuote(`${DB_SERVICE}:${migrationPath}`)}`,
    );
}

/**
 * Compute a SHA-256 hex checksum of a file's raw bytes.
 * @param {string} filePath
 * @returns {string}
 */
function sha256(filePath) {
    return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('🚀  preyo-app — Remote migration runner');
    console.log(`📡  Target : ${SSH_TARGET}`);
    console.log(`📁  Compose: ${DOCKER_COMPOSE_DIR}`);
    console.log(`🗄️   DB     : ${DB_NAME} (service: ${DB_SERVICE}, user: ${DB_USER})\n`);

    // 1. Collect .sql files, sorted lexicographically
    const allFiles = readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort();

    if (allFiles.length === 0) {
        console.log('ℹ️   No migrations found in supabase/migrations/');
        process.exit(0);
    }

    console.log(`📂  Found ${allFiles.length} migration(s):`);
    allFiles.forEach((f) => console.log(`    • ${f}`));
    console.log('');

    // 2. Ensure remote tmp dir exists both on the LXC host and in the db container
    ensureRemoteTmpDirs();

    // 3. Ensure preyo_meta schema + migration_history table exist
    bootstrapMetaTable();

    // 4. Process each migration
    /** @type {{ applied: string[], skipped: string[], failed: string[] }} */
    const summary = { applied: [], skipped: [], failed: [] };

    for (const filename of allFiles) {
        const localPath = join(MIGRATIONS_DIR, filename);
        const checksum = sha256(localPath);

        // Query existing record — returns '' if not found
        const existingRow = remoteSql(
            `select checksum from preyo_meta.migration_history where filename = ${sqlLiteral(filename)};`,
        );

        if (existingRow !== '') {
            if (existingRow === checksum) {
                console.log(`⏭️   [SKIP]  ${filename} — already applied`);
                summary.skipped.push(filename);
                continue;
            }
            // Checksum mismatch — hard stop for this file
            console.error(
                `❌  [ERROR] Checksum changed: ${filename}\n` +
                `    recorded : ${existingRow}\n` +
                `    current  : ${checksum}\n` +
                `    → Never modify an applied migration. Create a new one instead.`,
            );
            summary.failed.push(filename);
            break;
        }

        // New migration — copy and apply
        try {
            process.stdout.write(`📤  Copying  ${filename} … `);
            scp(localPath, `${REMOTE_TMP}/${filename}`);
            copyMigrationIntoContainer(filename);
            process.stdout.write('done\n');

            process.stdout.write(`⚙️   Applying ${filename} … `);
            applyMigration(filename);
            process.stdout.write('done\n');

            // Register in history
            remoteSql(
                `insert into preyo_meta.migration_history (filename, checksum) ` +
                `values (${sqlLiteral(filename)}, ${sqlLiteral(checksum)});`,
            );

            console.log(`✅  [OK]    ${filename}`);
            summary.applied.push(filename);
        } catch (/** @type {unknown} */ err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`❌  [ERROR] ${filename}\n    ${message}`);
            summary.failed.push(filename);
            break;
        }

        console.log('');
    }

    // 5. Summary
    console.log('─────────────────────────────────────────');
    console.log('📊  Summary');
    console.log(`    ✅ Applied : ${summary.applied.length}`);
    summary.applied.forEach((f) => console.log(`       • ${f}`));
    console.log(`    ⏭️  Skipped : ${summary.skipped.length}`);
    summary.skipped.forEach((f) => console.log(`       • ${f}`));
    console.log(`    ❌ Errors  : ${summary.failed.length}`);
    summary.failed.forEach((f) => console.log(`       • ${f}`));
    console.log('─────────────────────────────────────────');

    if (summary.failed.length > 0) process.exit(1);
}

main().catch((err) => {
    console.error('Fatal:', err instanceof Error ? err.message : String(err));
    process.exit(1);
});
