#!/usr/bin/env bash
# ----------------------------------------------------------------------------
# Backup diario (cron a las 04:00): dump de la BD + uploads.
# Conserva 7 días en /opt/teacherflow/backups.
# ----------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p backups

STAMP=$(date +%F)
docker compose exec -T postgres pg_dump -U teacherflow -d teacherflow | gzip > "backups/db-$STAMP.sql.gz"
tar -czf "backups/uploads-$STAMP.tar.gz" -C storage uploads 2>/dev/null || true
find backups -name '*.gz' -mtime +7 -delete
