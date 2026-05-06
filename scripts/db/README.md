# scripts/db — Remote Migration Runner

## Qué es esto

`apply-migrations.mjs` es **infrastructure tooling**, no código de dominio.  
Aplica los archivos SQL de `supabase/migrations/` sobre Supabase Local que corre
dentro del LXC Proxmox (`preyo-dev`), usando SSH + `docker compose exec`.  
No se conecta directamente a Postgres desde WSL.

## Por qué vive en `scripts/db/`

El frontend Next.js vive en `src/`. El tooling de infraestructura no es dominio
de la aplicación y nunca debe importarse desde `src/`. Colocarlo en `scripts/db/`
lo mantiene separado y reconocible para cualquier revisor del TFG.

## Cómo se ejecuta

```bash
pnpm db:migrate:remote
```

Requiere:
- Tailscale activo (conexión al LXC).
- Clave SSH configurada (ver **Autenticación** más abajo).
- `ssh` y `scp` disponibles en WSL (ya incluidos en Ubuntu).

## Variables de entorno

Todas opcionales. Los valores por defecto son los del entorno de desarrollo.

| Variable | Default | Descripción |
|---|---|---|
| `PREYO_REMOTE_HOST` | `100.69.204.118` | IP Tailscale del LXC |
| `PREYO_REMOTE_USER` | `yisus` | Usuario SSH en el LXC |
| `PREYO_REMOTE_SUPABASE_PATH` | `/opt/supabase/docker` | Directorio docker compose |
| `PREYO_REMOTE_TMP_DIR` | `/tmp/preyo-migrations` | Directorio temporal en el LXC |
| `PREYO_DB_SERVICE` | `db` | Nombre del servicio docker de Postgres |
| `PREYO_DB_USER` | `postgres` | Usuario de Postgres |
| `PREYO_DB_NAME` | `postgres` | Nombre de la base de datos |

Copia `.env.example` a `.env` y ajusta si tu entorno difiere:

```bash
cp .env.example .env
```

**No guardes contraseñas en `.env` si tienes SSH configurado correctamente.**

## Autenticación SSH (recomendado: clave SSH, sin contraseña)

```bash
# Generar clave (solo la primera vez)
ssh-keygen -t ed25519 -C "preyo-wsl"

# Copiar al LXC (introduce la contraseña de yisus una sola vez)
ssh-copy-id yisus@100.69.204.118

# Verificar (no debe pedir contraseña)
ssh yisus@100.69.204.118 "echo OK"
```

A partir de ahí, `pnpm db:migrate:remote` nunca pedirá contraseña.

## Qué hace el script paso a paso

1. Lee `supabase/migrations/*.sql` en orden lexicográfico.
2. Crea en el LXC el esquema `preyo_meta` y la tabla `preyo_meta.migration_history`.
3. Para cada migración:
   - Calcula su checksum SHA-256.
   - Si ya está en `migration_history` con el mismo checksum → la **salta**.
   - Si está registrada pero el checksum cambió → **falla** con error claro.
   - Si es nueva → la copia via `scp` y la aplica.
4. Registra nombre y checksum de cada migración aplicada.
5. Muestra un resumen final.

## Regla de integridad

> **Nunca modifiques un `.sql` ya aplicado.**  
> Si necesitas corregir algo, crea un nuevo archivo: `0005_fix_xxx.sql`.  
> El script detectará el cambio de checksum y fallará si intentas reaplicar
> un archivo modificado.

## Verificar migraciones aplicadas

```bash
ssh yisus@100.69.204.118 \
  "cd /opt/supabase/docker && docker compose exec -T db \
   psql -h 127.0.0.1 -U postgres -d postgres \
   -c 'select id, filename, applied_at from preyo_meta.migration_history order by applied_at;'"
```

## Archivos que NO deben commitearse

- `.env` (variables locales con posibles secretos)
- `.env.local`
- Claves SSH (`id_ed25519`, `id_rsa`, `*.pem`)
- `supabase/.temp/`
- `supabase/.branches/`
- `supabase/snippets/*.sql` (queries manuales de Supabase Studio)

## Archivos que SÍ deben commitearse

- `scripts/db/apply-migrations.mjs`
- `scripts/db/README.md`
- `supabase/migrations/*.sql`
- `package.json`

## Aplicar migraciones a producción (Supabase Cloud)

Requiere `SUPABASE_ACCESS_TOKEN` en `.env` y haber ejecutado `supabase login`:

```bash
pnpm db:migrate:prod
```

**Flujo recomendado:** primero `pnpm db:migrate:remote` (local), validar, luego `pnpm db:migrate:prod`.