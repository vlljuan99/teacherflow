import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { Sidebar, ADMIN_NAV } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(Role.TEACHER);
  return (
    <div className="flex min-h-screen">
      <Sidebar items={ADMIN_NAV} />
      <div className="flex flex-1 flex-col">
        <Header userName={session.user.name ?? ""} userRole="Profesora" />
        <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
      </div>
    </div>
  );
}
