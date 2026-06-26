/**
 * Create (or update) a local user with email + password and a given role.
 *
 * Env vars: USER_EMAIL, USER_NAME, USER_PASSWORD, USER_ROLE (ADMIN | TEACHER, default TEACHER).
 *
 * Usage (PowerShell):
 *   $env:USER_EMAIL="admin@example.com"; $env:USER_NAME="Nombre Admin"; $env:USER_PASSWORD="claveSegura123"; $env:USER_ROLE="ADMIN"; npm run create:user
 *
 * Usage (bash):
 *   USER_EMAIL=admin@example.com USER_NAME="Nombre Admin" USER_PASSWORD=claveSegura123 USER_ROLE=ADMIN npx tsx scripts/create-user.mts
 */
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";

const email = process.env.USER_EMAIL?.trim().toLowerCase();
const name = process.env.USER_NAME?.trim();
const password = process.env.USER_PASSWORD;
const role = (process.env.USER_ROLE?.trim().toUpperCase() || "TEACHER") as
  | "ADMIN"
  | "TEACHER";

if (!email || !name || !password) {
  console.error("Faltan datos. Define USER_EMAIL, USER_NAME y USER_PASSWORD.");
  process.exit(1);
}
if (!["ADMIN", "TEACHER"].includes(role)) {
  console.error(`USER_ROLE inválido: ${role}. Usa ADMIN o TEACHER.`);
  process.exit(1);
}
if (password.length < 8) {
  console.error("La contraseña debe tener al menos 8 caracteres.");
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 12);
const user = await prisma.user.upsert({
  where: { email },
  update: { name, role, passwordHash, isActive: true },
  create: { email, name, role, passwordHash, locale: "es" },
});

console.log("✓ Usuario listo:", {
  email: user.email,
  name: user.name,
  role: user.role,
});
await prisma.$disconnect();
