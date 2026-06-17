import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentMaterialsPage() {
  await requireRole(Role.STUDENT);
  const t = await getTranslations("materials");
  const tCommon = await getTranslations("common");
  const materials = await prisma.material.findMany({
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <PageHeader title={t("title")} />
      {materials.length === 0 ? (
        <EmptyState title={tCommon("noResults")} />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>{tCommon("name")}</TH>
                <TH>{t("fileType")}</TH>
                <TH>{tCommon("date")}</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {materials.map((m) => (
                <TR key={m.id}>
                  <TD>{m.title}</TD>
                  <TD>
                    <Badge tone="info">{t(`typeOptions.${m.type}`)}</Badge>
                  </TD>
                  <TD className="text-muted-foreground">{formatDate(m.createdAt)}</TD>
                  <TD>
                    <a
                      href={`/api/files/${m.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      <Download className="inline h-3.5 w-3.5" /> {tCommon("open")}
                    </a>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
