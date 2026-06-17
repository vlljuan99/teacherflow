import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { GuardianForm } from "../_form";
import { createGuardian } from "@/server/actions/guardians";
import { getTranslations } from "next-intl/server";

export default async function NewGuardianPage() {
  const t = await getTranslations("guardians");
  return (
    <div>
      <PageHeader title={t("new")} />
      <Card>
        <CardContent className="pt-6">
          <GuardianForm action={createGuardian} />
        </CardContent>
      </Card>
    </div>
  );
}
