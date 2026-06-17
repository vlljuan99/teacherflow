import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
try {
  const users = await p.user.findMany({
    select: { id: true, email: true, role: true, name: true },
  });
  const students = await p.student.findMany({
    select: { id: true, firstName: true, lastName: true, email: true, userId: true },
  });
  console.log(JSON.stringify({ users, students }, null, 2));
} finally {
  await p.$disconnect();
}
