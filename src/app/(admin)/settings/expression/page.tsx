import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { saveExpressionOfWeek } from "@/server/actions/site-settings";

export const dynamic = "force-dynamic";

export default async function ExpressionOfWeekPage() {
  await requireRole(Role.TEACHER);
  const t = await getTranslations("settings.expression");
  const tCommon = await getTranslations("common");

  const [expression, meaning] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: "expressionOfWeek" } }),
    prisma.siteSetting.findUnique({ where: { key: "expressionOfWeekMeaning" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("intro")} />
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <form action={saveExpressionOfWeek} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="expression">{t("expression")}</Label>
              <Input
                id="expression"
                name="expression"
                defaultValue={expression?.value ?? ""}
                placeholder={t("expressionPlaceholder")}
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meaning">{t("meaning")}</Label>
              <Textarea
                id="meaning"
                name="meaning"
                defaultValue={meaning?.value ?? ""}
                placeholder={t("meaningPlaceholder")}
                rows={4}
                maxLength={800}
              />
            </div>
            <Button type="submit">{tCommon("save")}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
