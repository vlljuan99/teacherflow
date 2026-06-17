import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ClassForm } from "../_form";
import { createClass } from "@/server/actions/classes";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function NewClassPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; groupId?: string }>;
}) {
  const t = await getTranslations("classes");
  const { studentId, groupId } = await searchParams;
  const [groups, students, worksheets, materials] = await Promise.all([
    prisma.group.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.student.findMany({
      orderBy: { lastName: "asc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        meetLink: true,
        level: true,
      },
    }),
    prisma.worksheet.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    }),
    prisma.material.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    }),
  ]);
  return (
    <div>
      <PageHeader title={t("new")} />
      <Card>
        <CardContent className="pt-6">
          <ClassForm
            action={createClass}
            groups={groups}
            students={students}
            worksheets={worksheets.map((w) => ({ id: w.id, title: w.title, type: "worksheet" as const }))}
            materials={materials.map((m) => ({ id: m.id, title: m.title, type: "material" as const }))}
            klass={
              studentId || groupId
                ? { studentId: studentId ?? null, groupId: groupId ?? null }
                : null
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
