import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { Sidebar, STUDENT_NAV } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Header } from "@/components/layout/header";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(Role.STUDENT);
  const studentId = session.user.studentId;

  const student = studentId
    ? await prisma.student.findUnique({
        where: { id: studentId },
        select: { photoUrl: true },
      })
    : null;

  // Pending homework badge: assignments without a submitted/corrected submission.
  const pendingCount = studentId
    ? await prisma.assignment.count({
        where: {
          OR: [
            { studentId },
            { group: { students: { some: { id: studentId } } } },
          ],
          submissions: {
            none: {
              studentId,
              correctionStatus: { in: ["SUBMITTED", "CORRECTED"] },
            },
          },
        },
      })
    : 0;
  const badges = { "/portal/worksheets": pendingCount };

  return (
    <div className="flex min-h-screen">
      <Sidebar items={STUDENT_NAV} badges={badges} />
      <div className="flex flex-1 flex-col">
        <Header
          userName={session.user.name ?? ""}
          userRole="Alumno"
          avatarUrl={student?.photoUrl}
        />
        <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 md:pb-6">
          <div className="animate-fade-in-up">{children}</div>
        </main>
      </div>
      <MobileNav items={STUDENT_NAV} badges={badges} />
    </div>
  );
}
