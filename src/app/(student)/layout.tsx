import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { Sidebar, STUDENT_NAV } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Header } from "@/components/layout/header";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(Role.STUDENT);
  return (
    <div className="flex min-h-screen">
      <Sidebar items={STUDENT_NAV} />
      <div className="flex flex-1 flex-col">
        <Header userName={session.user.name ?? ""} userRole="Alumno" />
        <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 md:pb-6">
          <div className="animate-fade-in-up">{children}</div>
        </main>
      </div>
      <MobileNav items={STUDENT_NAV} />
    </div>
  );
}
