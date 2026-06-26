/**
 * Create (or update) a local TEACHER account with email + password.
 *
 * Usage (PowerShell):
 *   $env:TEACHER_EMAIL="profe@example.com"; $env:TEACHER_NAME="Nombre Profe"; $env:TEACHER_PASSWORD="unaClaveSegura"; npx tsx scripts/create-teacher.mts
 *
 * Usage (bash):
 *   TEACHER_EMAIL=profe@example.com TEACHER_NAME="Nombre Profe" TEACHER_PASSWORD=unaClaveSegura npx tsx scripts/create-teacher.mts
 */
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";

const email = process.env.TEACHER_EMAIL?.trim().toLowerCase();
const name = process.env.TEACHER_NAME?.trim();
const password = process.env.TEACHER_PASSWORD;

if (!email || !name || !password) {
  console.error(
    "Faltan datos. Define TEACHER_EMAIL, TEACHER_NAME y TEACHER_PASSWORD.",
  );
  process.exit(1);
}
if (password.length < 8) {
  console.error("La contraseña debe tener al menos 8 caracteres.");
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 12);
const user = await prisma.user.upsert({
  where: { email },
  update: { name, role: "TEACHER", passwordHash, isActive: true },
  create: { email, name, role: "TEACHER", passwordHash, locale: "es" },
});

console.log("✓ Profe lista:", {
  email: user.email,
  name: user.name,
  role: user.role,
});
await prisma.$disconnect();
