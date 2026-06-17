import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createAssignment } from "@/server/actions/assignments";
import { getTranslations } from "next-intl/server";

export default async function NewAssignmentPage({
  searchParams,
}: {
  searchParams: Promise<{ worksheetId?: string }>;
}) {
  const t = await getTranslations("assignments");
  const tCommon = await getTranslations("common");
  const { worksheetId } = await searchParams;
  const [worksheets, students, groups] = await Promise.all([
    prisma.worksheet.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { title: "asc" },
    }),
    prisma.student.findMany({
      orderBy: { lastName: "asc" },
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.group.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div>
      <PageHeader title={t("new")} />
      <Card>
        <CardContent className="pt-6">
          <form action={createAssignment} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="worksheetId">{t("worksheet")}</Label>
              <Select id="worksheetId" name="worksheetId" required defaultValue={worksheetId ?? ""}>
                <option value="">—</option>
                {worksheets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.title} · {w.level}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="studentId">{t("student")}</Label>
              <Select id="studentId" name="studentId">
                <option value="">—</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="groupId">{t("group")}</Label>
              <Select id="groupId" name="groupId">
                <option value="">—</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="dueAt">{t("dueAt")}</Label>
              <Input id="dueAt" name="dueAt" type="datetime-local" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">{tCommon("save")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
