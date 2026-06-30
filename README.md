# preyo-app
Frontend de Preyo

## Desarrollo
Este proyecto usa **pnpm** obligatoriamente.

### Iniciar servidor
```bash
pnpm dev
```

### Comandos de validación
```bash
# Verificar conexión con Supabase (LXC via Tailscale)
curl http://100.69.204.118:8000

# QA
pnpm lint
pnpm typecheck
pnpm test
```

