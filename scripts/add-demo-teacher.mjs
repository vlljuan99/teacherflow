// Add velascom469@gmail.com as a TEACHER so she can log in via Google for the demo.
// Run: node --env-file=.env scripts/add-demo-teacher.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = "velascom469@gmail.com";

const user = await prisma.user.upsert({
  where: { email },
  update: { role: "TEACHER", isActive: true },
  create: {
    email,
    name: "Profesora Victoria",
    role: "TEACHER",
    locale: "es",
    passwordHash: null, // Google login only
  },
});
console.log("OK", user);
await prisma.$disconnect();
