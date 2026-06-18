import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createMaterial } from "@/server/actions/materials";
import { getTranslations } from "next-intl/server";
import { EnglishLevel, ExamType, MaterialCategory } from "@/lib/enums";

export default async function NewMaterialPage() {
  const t = await getTranslations("materials");
  const tCommon = await getTranslations("common");
  const worksheets = await prisma.worksheet.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });
  return (
    <div>
      <PageHeader
        title={t("new")}
        description="Los materiales son globales: cualquier alumno conectado podrá verlos."
      />
      <Card>
        <CardContent className="pt-6">
          <form
            action={createMaterial}
            encType="multipart/form-data"
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="title">{tCommon("name")}</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="file">Archivo</Label>
              <Input id="file" name="file" type="file" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">{t("category")}</Label>
              <Select id="category" name="category" defaultValue={MaterialCategory.OTHER}>
                {Object.values(MaterialCategory).map((c) => (
                  <option key={c} value={c}>
                    {t(`categoryOptions.${c}`)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="level">{t("level")}</Label>
              <Select id="level" name="level" defaultValue="">
                <option value="">{t("anyLevel")}</option>
                {Object.values(EnglishLevel).map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="examType">{t("examType")}</Label>
              <Select id="examType" name="examType" defaultValue="">
                <option value="">{t("anyExam")}</option>
                {Object.values(ExamType).map((e) => (
                  <option key={e} value={e}>
                    {t(`examOptions.${e}`)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="worksheetId">Vincular a una ficha (opcional)</Label>
              <Select id="worksheetId" name="worksheetId">
                <option value="">—</option>
                {worksheets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.title}
                  </option>
                ))}
              </Select>
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
