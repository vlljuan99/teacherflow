#!/usr/bin/env bash
# ----------------------------------------------------------------------------
# Reconstruye teacherflow:latest desde src.tar.gz (subido por deploy.ps1) y
# recrea el contenedor de la app con la imagen nueva. Se ejecuta EN el servidor.
# ----------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")"

[[ -f src.tar.gz ]] || { echo "Falta src.tar.gz — súbelo con deploy.ps1"; exit 1; }

rm -rf src && mkdir src
tar -xzf src.tar.gz -C src

docker build -t teacherflow:latest src

# `up -d` recrea solo el contenedor de la app porque su imagen cambió.
# El entrypoint del contenedor hace `prisma db push` antes de arrancar Node,
# así que cualquier cambio de schema se aplica de forma idempotente.
docker compose up -d --remove-orphans app
docker image prune -f >/dev/null

echo "✔ Imagen reconstruida y app actualizada"
