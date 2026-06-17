import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { WorksheetForm } from "../_form";
import { createWorksheet } from "@/server/actions/worksheets";
import { getTranslations } from "next-intl/server";

export default async function NewWorksheetPage() {
  const t = await getTranslations("worksheets");
  return (
    <div>
      <PageHeader title={t("new")} />
      <Card>
        <CardContent className="pt-6">
          <WorksheetForm action={createWorksheet} />
        </CardContent>
      </Card>
    </div>
  );
}
