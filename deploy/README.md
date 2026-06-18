# Despliegue de TeacherFlow en Hetzner

Stack: **Caddy** (reverse proxy + TLS automático) + **Postgres 17** + **app**
(Next.js standalone). Mismo patrón que `tilestudio` pero single-tenant.

```
Internet ──► Caddy ──► app:3000
   (80/443)       └─► postgres:5432 (privada)
```

Layout en el servidor (`/opt/teacherflow/`):

```
/opt/teacherflow/
├── docker-compose.yml      caddy + postgres + app
├── Caddyfile               importa sites/*.caddy
├── sites/teacherflow.caddy lo crea bootstrap.sh
├── .env                    POSTGRES_PASSWORD, PUBLIC_HOST
├── app.env                 AUTH_SECRET, Google OAuth, OpenAI, Gemini
├── storage/uploads/        fotos, materiales (volumen persistente)
├── backups/                cron diario lo llena
├── bootstrap.sh
├── build-on-server.sh
├── backup.sh
└── server-ip.txt           IP del servidor (lo lee deploy.ps1)
```

---

## 1. Crear el servidor

1. **Generar clave SSH** en Windows (si no tienes):

   ```powershell
   ssh-keygen -t ed25519 -f $HOME\.ssh\teacherflow_hetzner -N '""'
   ```

   Sube la pública (`teacherflow_hetzner.pub`) a Hetzner Cloud → **Security → SSH Keys**.

2. **Crear el VPS** (Hetzner Cloud):
   - Imagen: **Ubuntu 24.04**
   - Tipo: **CX22** (€4.5/mes, 4 GB RAM — suficiente para una profesora con N alumnos)
   - Localización: Falkenstein o Helsinki (UE)
   - SSH Key: la que acabas de subir
   - **User data**: pega el contenido de `deploy/cloud-init.yaml`

3. Apunta la IP en `deploy/server-ip.txt` (un solo `1.2.3.4`).

## 2. Subir configuración base

Desde tu Windows, con `<IP>` siendo la IP del servidor:

```powershell
$ip = (Get-Content .\deploy\server-ip.txt).Trim()
$key = "$HOME\.ssh\teacherflow_hetzner"

# Copia config + scripts
scp -i $key `
    .\deploy\docker-compose.yml `
    .\deploy\Caddyfile `
    .\deploy\bootstrap.sh `
    .\deploy\build-on-server.sh `
    .\deploy\backup.sh `
    "root@${ip}:/opt/teacherflow/"

ssh -i $key "root@$ip" "cd /opt/teacherflow; sed -i 's/\r$//' *.sh; chmod +x *.sh"
```

## 3. Crear `.env` y `app.env` en el servidor

```powershell
ssh -i $key "root@$ip"
```

Ya dentro del servidor:

```bash
cd /opt/teacherflow

# Stack base
cat > .env <<'EOF'
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=')
PUBLIC_HOST=teacherflow.<TU_IP>.sslip.io
EOF
# (Si tienes dominio real, ignora PUBLIC_HOST y pasa el dominio a bootstrap.sh)

# App
cat > app.env <<'EOF'
AUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" 2>/dev/null || openssl rand -base64 32)
NEXTAUTH_URL=https://teacherflow.tudominio.es
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
MAX_UPLOAD_MB=20
OPENAI_API_KEY=
GOOGLE_API_KEY=
AI_EMBED_MODEL=text-embedding-3-small
AI_EXTRACT_MODEL=gemini-2.5-flash
DEFAULT_TEACHER_EMAIL=profesora@tudominio.es
DEFAULT_TEACHER_PASSWORD=cambia-esto-fuerte
DEFAULT_TEACHER_NAME=Profesora
EOF
```

> **Rellena las claves**: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`,
> `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `NEXTAUTH_URL` y `POSTGRES_PASSWORD`.
> Las plantillas con todas las vars están en `deploy/.env.example` y
> `deploy/app.env.example`.

## 4. Bootstrap (caddy + postgres)

Aún en el servidor:

```bash
./bootstrap.sh                          # usa PUBLIC_HOST (HTTP)
# o, si tienes dominio:
./bootstrap.sh teacherflow.tudominio.es  # HTTPS automático
```

Esto crea `sites/teacherflow.caddy`, levanta Caddy y Postgres, y dice que aún
no hay imagen de la app.

## 5. Primer deploy desde Windows

Vuelve a tu Windows y lanza:

```powershell
.\deploy\deploy.ps1
```

Esto:
- empaqueta el HEAD del repo con `git archive`
- lo sube por SCP
- ejecuta `build-on-server.sh` (build de la imagen + `up -d app`)
- el entrypoint del contenedor hace `prisma db push` antes de arrancar Node →
  schema sincronizado de forma idempotente.

Tarda 3-6 min la primera vez.

## 6. Configurar Google OAuth para producción

En [console.cloud.google.com → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials),
edita tu OAuth Client y añade:

- **Authorized JavaScript origins**: `https://teacherflow.tudominio.es`
- **Authorized redirect URIs**:
  - `https://teacherflow.tudominio.es/api/auth/callback/google`
  - `https://teacherflow.tudominio.es/api/google/calendar/callback`

Y activa estas APIs en **APIs & Services → Library**:
- Google Calendar API
- Google Drive API
- Google Docs API
- Google Meet API

## 7. Crear la primera profesora

Conéctate por SSH y abre psql:

```bash
docker compose exec postgres psql -U teacherflow teacherflow
```

Y crea el usuario manualmente (o lanza el seed):

```bash
docker compose exec app node -e "
  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  const p = new PrismaClient();
  (async () => {
    await p.user.create({
      data: {
        email: 'profesora@tudominio.es',
        name: 'Profesora',
        passwordHash: await bcrypt.hash('cambia-esto-fuerte', 12),
        role: 'TEACHER',
        locale: 'es',
      },
    });
  })();
"
```

Entra en `https://teacherflow.tudominio.es/login`.

---

## Operaciones frecuentes

| Qué | Cómo |
|---|---|
| Deploy de cambios | `.\deploy\deploy.ps1` |
| Ver logs en vivo | `ssh -i $key root@$ip 'cd /opt/teacherflow && docker compose logs -f app'` |
| Reiniciar app | `docker compose restart app` |
| Conectar a la BD | `docker compose exec postgres psql -U teacherflow teacherflow` |
| Backup manual | `./backup.sh` |
| Listar backups | `ls -lh /opt/teacherflow/backups` |
| Estado general | `docker compose ps` |

## Solución de problemas

**Caddy no emite TLS**: comprueba que el DNS del dominio apunta a la IP del
servidor (los registros A propagan unos minutos). Mira logs: `docker compose
logs -f caddy`.

**App no arranca, dice `prisma db push` falló**: revisa `docker compose logs
app`. Suele ser `DATABASE_URL` mal formada (revisa `.env`).

**Subir foto da 413 (request too large)**: Caddy tiene `body_size` por defecto
amplio, pero si lo configuras debe ser ≥ MAX_UPLOAD_MB. Mira `Caddyfile`.

**Las fotos desaparecen tras deploy**: significa que el volumen
`./storage/uploads` no está mapeado. Verifica en `docker-compose.yml`.
