import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WorksheetsPage() {
  const t = await getTranslations("worksheets");
  const tCommon = await getTranslations("common");
  const worksheets = await prisma.worksheet.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { exercises: true, assignments: true } } },
  });
  return (
    <div>
      <PageHeader
        title={t("title")}
        actions={
          <Link href="/worksheets/new">
            <Button>
              <Plus className="h-4 w-4" /> {t("new")}
            </Button>
          </Link>
        }
      />
      {worksheets.length === 0 ? (
        <EmptyState title={tCommon("noResults")} />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>{t("titleField")}</TH>
                <TH>{t("level")}</TH>
                <TH>{t("language")}</TH>
                <TH>{t("status")}</TH>
                <TH>{t("exercises")}</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {worksheets.map((w) => (
                <TR key={w.id}>
                  <TD>
                    <Link className="font-medium hover:underline" href={`/worksheets/${w.id}/edit`}>
                      {w.title}
                    </Link>
                  </TD>
                  <TD>{w.level}</TD>
                  <TD>{w.language}</TD>
                  <TD>
                    <Badge
                      tone={
                        w.status === "PUBLISHED"
                          ? "success"
                          : w.status === "DRAFT"
                            ? "warning"
                            : "muted"
                      }
                    >
                      {tCommon(w.status.toLowerCase() as "draft" | "published" | "archived")}
                    </Badge>
                  </TD>
                  <TD>{w._count.exercises}</TD>
                  <TD>
                    <Link
                      className="text-sm text-primary hover:underline"
                      href={`/worksheets/${w.id}/edit`}
                    >
                      {tCommon("edit")}
                    </Link>
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
