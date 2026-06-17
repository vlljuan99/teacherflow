import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
try {
  const s = await p.student.findUnique({
    where: { id: "cmqgs6vqn0004116tdjznid2m" },
    include: {
      group: true,
      guardians: { include: { guardian: true } },
      classes: true,
      payments: true,
      submissions: true,
      consents: true,
    },
  });
  console.log(JSON.stringify(s, null, 2));
} catch (e) {
  console.error("ERROR:", e?.stack ?? e);
} finally {
  await p.$disconnect();
}
