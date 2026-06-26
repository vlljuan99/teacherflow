import { prisma } from "@/lib/db";
import { Role } from "@/lib/enums";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createStudent } from "@/server/actions/students";
import { StudentForm } from "../_form";
import { getTranslations } from "next-intl/server";

export default async function NewStudentPage() {
  const t = await getTranslations("students");
  const [groups, teachers] = await Promise.all([
    prisma.group.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: Role.TEACHER },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return (
    <div>
      <PageHeader title={t("new")} />
      <Card>
        <CardContent className="pt-6">
          <StudentForm action={createStudent} groups={groups} teachers={teachers} />
        </CardContent>
      </Card>
    </div>
  );
}
