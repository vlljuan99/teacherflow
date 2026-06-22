"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { audit } from "@/server/audit/log";

const Schema = z.object({
  expression: z.string().max(200).optional().default(""),
  meaning: z.string().max(800).optional().default(""),
});

async function upsertSetting(key: string, value: string) {
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function saveExpressionOfWeek(formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const data = Schema.parse({
    expression: formData.get("expression"),
    meaning: formData.get("meaning"),
  });
  await Promise.all([
    upsertSetting("expressionOfWeek", data.expression.trim()),
    upsertSetting("expressionOfWeekMeaning", data.meaning.trim()),
  ]);
  await audit({
    actorUserId: session.user.id,
    action: "site_setting.expression_of_week.update",
    entity: "SiteSetting",
    entityId: "expressionOfWeek",
  });
  revalidatePath("/portal/dashboard");
  revalidatePath("/settings/expression");
}
