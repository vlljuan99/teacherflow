import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { MonthView } from "@/components/calendar/month-view";
import { startOfMonth, endOfMonth, parse, isValid, addMonths } from "date-fns";

export const dynamic = "force-dynamic";

export default async function StudentClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const session = await requireRole(Role.STUDENT);
  const t = await getTranslations("classes");
  if (!session.user.studentId) return null;
  const studentId = session.user.studentId;
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { groupId: true },
  });
  const groupId = student?.groupId ?? null;
  const { m } = await searchParams;
  let month = new Date();
  if (m) {
    const parsed = parse(m + "-01", "yyyy-MM-dd", new Date());
    if (isValid(parsed)) month = parsed;
  }
  const monthClasses = await prisma.class.findMany({
    where: {
      OR: [{ studentId }, ...(groupId ? [{ groupId }] : [])],
      startAt: {
        gte: addMonths(startOfMonth(month), -1),
        lte: addMonths(endOfMonth(month), 1),
      },
    },
    orderBy: { startAt: "asc" },
  });
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} />
      <Card>
        <CardContent className="pt-6">
          <MonthView
            month={month}
            events={monthClasses.map((c) => ({
              id: c.id,
              title: c.title,
              startAt: c.startAt,
              endAt: c.endAt,
              modality: c.modality as "ONLINE" | "IN_PERSON",
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
