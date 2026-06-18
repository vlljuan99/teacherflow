# Deploy pipeline

`deploy.yml` se dispara con cualquier push a `main` (o manualmente desde la
pestaña *Actions* → *Deploy to Hetzner* → *Run workflow*). Hace:

1. **typecheck** — `npm ci` + `prisma generate` + `tsc --noEmit`. Si esto falla,
   el deploy no se ejecuta.
2. **deploy** — empaqueta el código, lo sube por SCP al servidor y ejecuta
   `build-on-server.sh` (que reconstruye la imagen Docker y recrea el
   contenedor `teacherflow-app`).
3. **smoke test** — hace 10 intentos a `https://teacherflow.../login` para
   confirmar que la app responde tras el deploy.

## Secrets que tiene que tener el repo

En **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Valor |
|---|---|
| `HETZNER_HOST` | `167.233.99.156` |
| `HETZNER_SSH_KEY` | Contenido COMPLETO de `~/.ssh/tilestudio_hetzner` (clave privada con header `-----BEGIN OPENSSH PRIVATE KEY-----`) |

> 💡 La forma rápida (PowerShell):
> ```powershell
> gh secret set HETZNER_HOST --body "167.233.99.156"
> gh secret set HETZNER_SSH_KEY < $HOME\.ssh\tilestudio_hetzner
> ```
> (requiere `gh auth login` previo)

## Saltarse el typecheck

Si necesitas desplegar en caliente sin pasar typecheck (no recomendado):
elimina la dependencia `needs: typecheck` del job `deploy`. Mejor: arregla los
tipos.

## Rollback

Cada deploy rebuilds la imagen. Si necesitas volver a una versión anterior:

```powershell
git revert <commit-malo>
git push origin main
```

El workflow corre solo y revierte la app.
