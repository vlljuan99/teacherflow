import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Plus, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const t = await getTranslations("materials");
  const tCommon = await getTranslations("common");
  const materials = await prisma.material.findMany({
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <PageHeader
        title={t("title")}
        description="Visibles para todos los alumnos. Para asignar ejercicios a un alumno concreto, usa Fichas."
        actions={
          <Link href="/materials/new">
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
              <TH>{tCommon("name")}</TH>
              <TH>{t("fileType")}</TH>
              <TH>{tCommon("date")}</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {materials.length === 0 && (
              <TR>
                <TD colSpan={4} className="py-6 text-center text-muted-foreground">
                  {tCommon("noResults")}
                </TD>
              </TR>
            )}
            {materials.map((m) => (
              <TR key={m.id}>
                <TD>
                  <Link className="font-medium hover:underline" href={`/materials/${m.id}`}>
                    {m.title}
                  </Link>
                </TD>
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
    </div>
  );
}
