import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { Role } from "@/lib/enums";

export default async function RootPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === Role.TEACHER) redirect("/dashboard");
  if (session.user.role === Role.STUDENT) redirect("/portal/dashboard");
  redirect("/login");
}
