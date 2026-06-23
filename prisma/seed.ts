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

  const speakingSeeds: {
    id: string;
    prompt: string;
    level: string | null;
    category: string;
    points: number;
    twist: string | null;
  }[] = [
    { id: "sp-001", prompt: "What's your favourite season and why?", level: "A2", category: "Daily life", points: 1, twist: null },
    { id: "sp-002", prompt: "Describe your perfect weekend.", level: "B1", category: "Daily life", points: 2, twist: null },
    { id: "sp-003", prompt: "Tell us about a place you'd love to visit.", level: "B1", category: "Travel", points: 2, twist: null },
    { id: "sp-004", prompt: "If you could have any superpower, which one and why?", level: "B2", category: "Imagination", points: 3, twist: "DOUBLE" },
    { id: "sp-005", prompt: "What makes a good friend?", level: "B2", category: "People", points: 2, twist: null },
    { id: "sp-006", prompt: "Compare studying online vs. studying in person.", level: "B2", category: "Education", points: 3, twist: "STEAL" },
    { id: "sp-007", prompt: "Should phones be banned in schools? Justify.", level: "C1", category: "Opinion", points: 3, twist: null },
    { id: "sp-008", prompt: "Tell us a story using these three words: rain, key, smile.", level: "B1", category: "Storytelling", points: 3, twist: "SWAP" },
    { id: "sp-009", prompt: "What is the most useful invention of the last 100 years?", level: "B2", category: "Society", points: 2, twist: null },
    { id: "sp-010", prompt: "Describe a teacher who influenced you.", level: "B1", category: "People", points: 2, twist: null },
    { id: "sp-011", prompt: "Risky talker: pick this and answer in 10 seconds!", level: "B2", category: "Challenge", points: 2, twist: "LOSE" },
    { id: "sp-012", prompt: "How do you usually spend Sunday afternoons?", level: "A2", category: "Daily life", points: 1, twist: null },
  ];
  for (const s of speakingSeeds) {
    await prisma.speakingQuestion.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s },
    });
  }

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
