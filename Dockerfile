# syntax=docker/dockerfile:1.7

# 1. Dependencias
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl tzdata
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# 2. Build
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# 3. Runtime
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl tzdata
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=Europe/Madrid
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# App standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma: schema + cliente generado + binarios + CLI (para `db push`)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Storage para fotos de alumnos y otros uploads
RUN mkdir -p /app/storage/uploads && chown -R nextjs:nodejs /app/storage
VOLUME ["/app/storage/uploads"]

# Entrypoint que sincroniza schema y arranca el server
COPY --chown=nextjs:nodejs <<'EOF' /app/entrypoint.sh
#!/bin/sh
set -e
echo "==> Aplicando schema en la BD..."
node node_modules/prisma/build/index.js db push --accept-data-loss --skip-generate
echo "==> Arrancando servidor..."
exec node server.js
EOF
RUN chmod +x /app/entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["/app/entrypoint.sh"]
