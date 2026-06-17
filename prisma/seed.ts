import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const teacherEmail =
    process.env.DEFAULT_TEACHER_EMAIL ?? "profesora@teacherflow.local";
  const teacherPassword =
    process.env.DEFAULT_TEACHER_PASSWORD ?? "changeme123";
  const teacherName = process.env.DEFAULT_TEACHER_NAME ?? "Profesora";

  const studentEmail =
    process.env.DEFAULT_STUDENT_EMAIL ?? "alumno@teacherflow.local";
  const studentPassword =
    process.env.DEFAULT_STUDENT_PASSWORD ?? "changeme123";

  const teacherHash = await bcrypt.hash(teacherPassword, 12);
  const teacher = await prisma.user.upsert({
    where: { email: teacherEmail },
    update: {},
    create: {
      email: teacherEmail,
      passwordHash: teacherHash,
      role: "TEACHER",
      name: teacherName,
      locale: "es",
    },
  });

  const studentHash = await bcrypt.hash(studentPassword, 12);
  const studentUser = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {},
    create: {
      email: studentEmail,
      passwordHash: studentHash,
      role: "STUDENT",
      name: "Alumno Demo",
      locale: "es",
    },
  });

  const group = await prisma.group.upsert({
    where: { id: "seed-group-a2" },
    update: {},
    create: {
      id: "seed-group-a2",
      name: "Grupo A2 — Tardes",
      level: "A2",
      description: "Grupo de adultos nivel A2",
      schedule: "Mar/Jue 18:00–19:30",
    },
  });

  await prisma.student.upsert({
    where: { id: "seed-student-demo" },
    update: {},
    create: {
      id: "seed-student-demo",
      userId: studentUser.id,
      firstName: "Alumno",
      lastName: "Demo",
      email: studentEmail,
      level: "A2",
      status: "ACTIVE",
      isMinor: false,
      groupId: group.id,
    },
  });

  console.log("Seed completado.");
  console.log(`  Profesora: ${teacherEmail} / ${teacherPassword}`);
  console.log(`  Alumno:    ${studentEmail} / ${studentPassword}`);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void teacher;
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
