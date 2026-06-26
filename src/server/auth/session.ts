import { redirect } from "next/navigation";
import { auth } from "./config";
import { Role } from "@/lib/enums";

export async function getSession() {
  return auth();
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireRole(role: Role | Role[]) {
  const session = await requireSession();
  const allowed = Array.isArray(role) ? [...role] : [role];
  // Admins can access anything teachers can (full back-office access).
  if (allowed.includes(Role.TEACHER) && !allowed.includes(Role.ADMIN)) {
    allowed.push(Role.ADMIN);
  }
  if (!allowed.includes(session.user.role)) {
    redirect("/login");
  }
  return session;
}

export function assertCanAccessStudent(
  session: { user: { role: Role; studentId?: string | null } },
  studentId: string,
) {
  if (session.user.role === Role.TEACHER || session.user.role === Role.ADMIN) return;
  if (session.user.role === Role.STUDENT && session.user.studentId === studentId) return;
  throw new Error("Forbidden");
}
