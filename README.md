# TeacherFlow

Aplicación web para profesoras individuales de inglés: alumnos, tutores legales,
grupos, calendario de clases, fichas interactivas (9 tipos de ejercicios) con
corrección mixta, pagos manuales, consentimientos RGPD, materiales y dashboards.

Stack: Next.js 15 (App Router) + TypeScript + Tailwind + Prisma + PostgreSQL +
Auth.js + next-intl (es/en).

## Desarrollo local

```bash
cp .env.example .env
npm install
docker compose up -d db
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Abre http://localhost:3000 y entra con las credenciales que el seed imprime.

## Deploy en Hetzner (Docker Compose)

1. Crea un VPS (CX11/CX21 es suficiente para un único docente). Apunta tu
   dominio al servidor.
2. Instala Docker y docker-compose:

```bash
curl -fsSL https://get.docker.com | sh
```

3. Clona el repo y crea el `.env`:

```bash
git clone <tu-repo> teacherflow
cd teacherflow
cp .env.example .env
# Edita .env: genera AUTH_SECRET con `openssl rand -base64 32`
# y elige una contraseña fuerte para POSTGRES_PASSWORD / DEFAULT_TEACHER_PASSWORD.
```

Variables relevantes en `.env`:

```
POSTGRES_USER=teacherflow
POSTGRES_PASSWORD=<contraseña-fuerte>
POSTGRES_DB=teacherflow
AUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://tu-dominio
DEFAULT_TEACHER_EMAIL=profesora@tudominio.es
DEFAULT_TEACHER_PASSWORD=<contraseña-inicial>
```

4. Levanta el stack y aplica migraciones + seed:

```bash
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
docker compose exec app node prisma/seed.js || docker compose exec app npx tsx prisma/seed.ts
```

5. Reverse proxy con HTTPS. Recomendado Caddy:

```caddy
tu-dominio {
  reverse_proxy app:3000
}
```

(Pon Caddy en su propio contenedor o en el host.)

## Estructura

- `src/app/(admin)` — panel de la profesora.
- `src/app/(student)/portal` — portal del alumno.
- `src/app/login` — login común.
- `src/app/api/files/[id]` — descarga de uploads con control de acceso.
- `src/server/actions` — server actions por dominio.
- `src/server/auth` — configuración Auth.js + helpers de sesión.
- `src/server/grading/auto-grade.ts` — corrección automática.
- `src/server/audit/log.ts` — auditoría.
- `src/components/worksheet` — editor y solver de ejercicios.
- `prisma/schema.prisma` — modelo de datos.

## Idioma

`es` por defecto. Switcher en el header escribe la cookie `NEXT_LOCALE` y
refresca la página. Los diccionarios están en `src/messages/{es,en}.json`.

## Google login + Meet

Login con Google y enlaces de Google Meet automáticos para clases online.

### 1. Crear credenciales OAuth en Google Cloud

1. Entra en https://console.cloud.google.com/apis/credentials → "Create credentials" → "OAuth client ID" → tipo "Web application".
2. **Authorized JavaScript origins**: `http://localhost:3000` (y tu dominio en prod).
3. **Authorized redirect URIs** (añade los dos):
   - `http://localhost:3000/api/auth/callback/google` (login)
   - `http://localhost:3000/api/google/calendar/callback` (Calendar/Meet)
4. Activa la **Google Calendar API** en "APIs & Services" → "Library".

### 2. Variables de entorno

```
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

Aplica el cambio de schema:

```bash
npx prisma generate
npx prisma db push
```

### 3. Cómo funciona

- **Login con Google**: el botón "Iniciar sesión con Google" aparece en `/login`
  cuando las credenciales están configuradas. El login *solo* funciona si el
  email de Google coincide con un `User` ya existente, o con `Student.email` /
  `Guardian.email` registrado por la profesora (en ese caso se crea el `User`
  automáticamente y se enlaza). Si no hay registro previo, la app responde
  "Este correo no está registrado".
  - Pasos para que tu alumna Irene entre con Google: en su ficha de `Student`,
    asegúrate de que su `email` es exactamente su email de Google.
- **Google Calendar / Meet**: en el dashboard de la profesora aparece una
  tarjeta "Google Calendar". Pulsa "Conectar" para autorizar el scope
  `calendar.events` (se pide consentimiento aparte, los alumnos no lo ven). El
  refresh token se guarda en la tabla `GoogleAccount`.
- **Generar Meet por clase**: en `/classes/[id]`, si la modalidad es ONLINE y
  tienes Calendar conectado, aparece "Generar enlace Meet". Crea un evento en
  tu Calendar primario con los alumnos invitados, guarda el enlace en
  `Class.meetLink` y lo deja visible para alumnos (en su dashboard y en el de
  la profesora). "Quitar Meet" borra el evento y limpia el enlace.

### 4. Limitaciones conocidas

- El enlace Meet se crea con la zona horaria `Europe/Madrid` por defecto.
- Si reprogramas la hora de la clase, el evento en Google no se actualiza
  automáticamente — bórralo y vuelve a generarlo (mejora futura: PATCH al
  evento).
- Solo la profesora puede tener Calendar conectado.

## Puntos de extensión

- **PDF extractor**: `src/server/pdf/extractor.ts` define la interfaz. La
  implementación actual (`StubPdfExtractor`) no extrae nada. Sustituir por una
  basada en `pdfjs-dist` no requiere cambios en el resto del código.
- **Bizum / pasarela de pago**: `Payment.method` ya incluye `BIZUM` y
  `Payment.providerMeta` (JSONB) está reservado para la metadata de la pasarela.
- **Login de tutor legal**: `User.role` incluye `GUARDIAN`. Hoy no hay UI de
  login para ellos, pero `Guardian.userId` permite añadirlo creando un `User`
  con ese rol.
- **Exportar / borrar datos por usuario** (derecho RGPD): añadir endpoints
  basados en `prisma.user.findUnique` + cascada manual.
- **Notificaciones email**: integrar Resend / SES desde
  `src/server/auth/config.ts` (recuperación de contraseña) y desde
  `assignments.ts` (avisos de nueva ficha).
- **Calendario más rico**: `MonthView` puede sustituirse por FullCalendar
  manteniendo la misma forma de `events`.

## Seguridad

- Contraseñas con bcrypt (12 rounds).
- Sesiones JWT con cookie `httpOnly`, `sameSite=lax`, `secure` en prod.
- `/api/files/[id]` valida que el usuario tiene acceso al material (alumno solo
  ve los suyos o de su grupo).
- Server actions revalidan rol con `requireRole`.
- `AuditLog` registra: login, creación / edición / borrado de alumnos, pagos,
  consentimientos, asignaciones y envíos.
