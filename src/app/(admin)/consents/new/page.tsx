import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createConsent } from "@/server/actions/consents";
import { ConsentType } from "@/lib/enums";
import { getTranslations } from "next-intl/server";

export default async function NewConsentPage() {
  const t = await getTranslations("consents");
  const tCommon = await getTranslations("common");
  const [students, guardians] = await Promise.all([
    prisma.student.findMany({
      orderBy: { lastName: "asc" },
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.guardian.findMany({
      orderBy: { lastName: "asc" },
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);
  return (
    <div>
      <PageHeader title={t("new")} />
      <Card>
        <CardContent className="pt-6">
          <form action={createConsent} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="studentId">Alumno (opcional)</Label>
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
              <Label htmlFor="guardianId">Tutor (opcional)</Label>
              <Select id="guardianId" name="guardianId">
                <option value="">—</option>
                {guardians.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.firstName} {g.lastName}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">{t("type")}</Label>
              <Select id="type" name="type" required defaultValue={ConsentType.DATA_PROCESSING}>
                {Object.values(ConsentType).map((c) => (
                  <option key={c} value={c}>
                    {t(`typeOptions.${c}`)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="version">{t("version")}</Label>
              <Input id="version" name="version" required defaultValue="1.0" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="text">{t("text")}</Label>
              <Textarea id="text" name="text" rows={6} required />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="acceptedByName">{t("acceptedBy")}</Label>
              <Input id="acceptedByName" name="acceptedByName" required />
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
