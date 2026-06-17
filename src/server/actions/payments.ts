"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role, PaymentMethod, PaymentStatus } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/audit/log";

const PaymentSchema = z.object({
  studentId: z.string().min(1),
  concept: z.string().min(1).max(200),
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).default("EUR"),
  dueDate: z.string().transform((v) => new Date(v)),
  paidAt: z.string().optional().transform((v) => (v ? new Date(v) : null)),
  method: z.nativeEnum(PaymentMethod),
  status: z.nativeEnum(PaymentStatus),
  notes: z.string().max(500).optional().transform((v) => v || null),
});

function fd(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function toCents(amount: number) {
  return Math.round(amount * 100);
}

export async function createPayment(formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const d = PaymentSchema.parse(fd(formData));
  const p = await prisma.payment.create({
    data: {
      studentId: d.studentId,
      concept: d.concept,
      amountCents: toCents(d.amount),
      currency: d.currency,
      dueDate: d.dueDate,
      paidAt: d.paidAt,
      method: d.method,
      status: d.status,
      notes: d.notes,
    },
  });
  await audit({
    actorUserId: session.user.id,
    action: "payment.create",
    entity: "Payment",
    entityId: p.id,
  });
  revalidatePath("/payments");
  redirect(`/payments/${p.id}`);
}

export async function updatePayment(id: string, formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const d = PaymentSchema.parse(fd(formData));
  await prisma.payment.update({
    where: { id },
    data: {
      studentId: d.studentId,
      concept: d.concept,
      amountCents: toCents(d.amount),
      currency: d.currency,
      dueDate: d.dueDate,
      paidAt: d.paidAt,
      method: d.method,
      status: d.status,
      notes: d.notes,
    },
  });
  await audit({
    actorUserId: session.user.id,
    action: "payment.update",
    entity: "Payment",
    entityId: id,
  });
  revalidatePath(`/payments/${id}`);
  revalidatePath("/payments");
  redirect(`/payments/${id}`);
}

export async function deletePayment(id: string) {
  const session = await requireRole(Role.TEACHER);
  await prisma.payment.delete({ where: { id } });
  await audit({
    actorUserId: session.user.id,
    action: "payment.delete",
    entity: "Payment",
    entityId: id,
  });
  revalidatePath("/payments");
  redirect("/payments");
}
