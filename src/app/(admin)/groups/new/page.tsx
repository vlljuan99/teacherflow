import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { GroupForm } from "../_form";
import { createGroup } from "@/server/actions/groups";
import { getTranslations } from "next-intl/server";

export default async function NewGroupPage() {
  const t = await getTranslations("groups");
  return (
    <div>
      <PageHeader title={t("new")} />
      <Card>
        <CardContent className="pt-6">
          <GroupForm action={createGroup} />
        </CardContent>
      </Card>
    </div>
  );
}
