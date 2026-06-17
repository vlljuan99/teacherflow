import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createStudent } from "@/server/actions/students";
import { StudentForm } from "../_form";
import { getTranslations } from "next-intl/server";

export default async function NewStudentPage() {
  const t = await getTranslations("students");
  const groups = await prisma.group.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <PageHeader title={t("new")} />
      <Card>
        <CardContent className="pt-6">
          <StudentForm action={createStudent} groups={groups} />
        </CardContent>
      </Card>
    </div>
  );
}
