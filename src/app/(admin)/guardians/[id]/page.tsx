import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GuardianForm } from "../_form";
import {
  updateGuardian,
  deleteGuardian,
  linkGuardianStudents,
} from "@/server/actions/guardians";
import { getTranslations } from "next-intl/server";
import { Trash2 } from "lucide-react";

export default async function GuardianDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("guardians");
  const tCommon = await getTranslations("common");
  const tStudents = await getTranslations("students");

  const [guardian, students] = await Promise.all([
    prisma.guardian.findUnique({
      where: { id },
      include: { students: { include: { student: true } } },
    }),
    prisma.student.findMany({
      orderBy: { lastName: "asc" },
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);
  if (!guardian) notFound();
  const linkedIds = new Set(guardian.students.map((s) => s.studentId));
  const action = async (formData: FormData) => {
    "use server";
    await updateGuardian(guardian.id, formData);
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title={`${guardian.firstName} ${guardian.lastName}`}
        actions={
          <form
            action={async () => {
              "use server";
              await deleteGuardian(guardian.id);
            }}
          >
            <Button variant="destructive" type="submit">
              <Trash2 className="h-4 w-4" /> {tCommon("delete")}
            </Button>
          </form>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{tCommon("edit")}</CardTitle>
        </CardHeader>
        <CardContent>
          <GuardianForm action={action} guardian={guardian} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("linkedStudents")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={linkGuardianStudents} className="space-y-3">
            <input type="hidden" name="guardianId" value={guardian.id} />
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {students.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    name="studentIds"
                    value={s.id}
                    defaultChecked={linkedIds.has(s.id)}
                    className="h-4 w-4"
                  />
                  <Link href={`/students/${s.id}`} className="hover:underline">
                    {s.firstName} {s.lastName}
                  </Link>
                </label>
              ))}
              {students.length === 0 && (
                <p className="text-sm text-muted-foreground">{tStudents("title")} —</p>
              )}
            </div>
            <Button type="submit">{tCommon("save")}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
