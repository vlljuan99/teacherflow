// Variables de entorno mínimas para que `env()` (src/lib/env.ts) valide sin DB.
// Solo se usan en los tests unitarios de lógica pura.
process.env.DATABASE_URL ??=
  "postgresql://test:test@localhost:5432/test?schema=public";
process.env.AUTH_SECRET ??= "test-secret-at-least-16-chars-long";
// Prefijo por defecto para los tests de normalización de WhatsApp.
process.env.WHATSAPP_DEFAULT_COUNTRY_CODE ??= "34";
