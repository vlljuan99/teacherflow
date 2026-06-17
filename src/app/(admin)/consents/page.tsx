import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ConsentsPage() {
  const t = await getTranslations("consents");
  const tCommon = await getTranslations("common");
  const consents = await prisma.consent.findMany({
    orderBy: { acceptedAt: "desc" },
    include: { student: true, guardian: true },
  });
  return (
    <div>
      <PageHeader
        title={t("title")}
        actions={
          <Link href="/consents/new">
            <Button>
              <Plus className="h-4 w-4" /> {t("new")}
            </Button>
          </Link>
        }
      />
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>{t("type")}</TH>
              <TH>{t("acceptedBy")}</TH>
              <TH>{t("version")}</TH>
              <TH>{t("status")}</TH>
              <TH>{t("acceptedAt")}</TH>
            </TR>
          </THead>
          <TBody>
            {consents.length === 0 && (
              <TR>
                <TD colSpan={5} className="py-6 text-center text-muted-foreground">
                  {tCommon("noResults")}
                </TD>
              </TR>
            )}
            {consents.map((c) => (
              <TR key={c.id}>
                <TD>
                  <Link className="font-medium hover:underline" href={`/consents/${c.id}`}>
                    {t(`typeOptions.${c.type}`)}
                  </Link>
                </TD>
                <TD>{c.acceptedByName}</TD>
                <TD>{c.version}</TD>
                <TD>
                  <Badge tone={c.status === "ACCEPTED" ? "success" : "muted"}>
                    {t(`statusOptions.${c.status}`)}
                  </Badge>
                </TD>
                <TD className="text-muted-foreground">{formatDate(c.acceptedAt)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
