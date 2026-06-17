import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StudentForm } from "../../_form";
import { updateStudent } from "@/server/actions/students";
import { getTranslations } from "next-intl/server";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("common");
  const [student, groups] = await Promise.all([
    prisma.student.findUnique({ where: { id } }),
    prisma.group.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!student) notFound();
  const action = async (formData: FormData) => {
    "use server";
    await updateStudent(student.id, formData);
  };
  return (
    <div>
      <PageHeader title={`${t("edit")} — ${student.firstName} ${student.lastName}`} />
      <Card>
        <CardContent className="pt-6">
          <StudentForm action={action} groups={groups} student={student} />
        </CardContent>
      </Card>
    </div>
  );
}
