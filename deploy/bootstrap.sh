#!/usr/bin/env bash
# ----------------------------------------------------------------------------
# Bootstrap de TeacherFlow en el servidor — se ejecuta UNA vez después de
# subir los archivos por SCP y de crear /opt/teacherflow/.env + app.env.
#
#   ./bootstrap.sh [dominio]
#
# Si pasas un dominio (ej. teacherflow.tudominio.es), Caddy emite TLS solo.
# Si no, intenta usar PUBLIC_HOST de .env (sslip.io o similar) en HTTP.
# ----------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")"

DOMAIN="${1:-}"

[[ -f .env ]] || { echo "Falta /opt/teacherflow/.env (POSTGRES_PASSWORD, PUBLIC_HOST)"; exit 1; }
[[ -f app.env ]] || { echo "Falta /opt/teacherflow/app.env (AUTH_SECRET, Google, IA…)"; exit 1; }

source .env

# 1. Archivo del sitio para Caddy
mkdir -p sites
if [[ -n "$DOMAIN" ]]; then
  cat > sites/teacherflow.caddy <<EOF
$DOMAIN {
	encode gzip
	reverse_proxy app:3000
}
EOF
  echo "✔ Caddy configurado para https://$DOMAIN"
else
  [[ -n "${PUBLIC_HOST:-}" ]] || { echo "Pon PUBLIC_HOST en .env o pasa un dominio: ./bootstrap.sh <dominio>"; exit 1; }
  cat > sites/teacherflow.caddy <<EOF
http://$PUBLIC_HOST {
	encode gzip
	reverse_proxy app:3000
}
EOF
  echo "✔ Caddy configurado para http://$PUBLIC_HOST"
fi

# 2. Arrancar caddy + postgres
docker compose up -d caddy postgres

# 3. Build/run de la app si ya hay imagen
if docker image inspect teacherflow:latest >/dev/null 2>&1; then
  docker compose up -d app
  echo ""
  echo "→ App arrancada. Abre la URL en el navegador."
else
  echo ""
  echo "ℹ La imagen teacherflow:latest todavía no existe."
  echo "  Lanza el primer deploy desde Windows con: .\\deploy\\deploy.ps1"
fi
