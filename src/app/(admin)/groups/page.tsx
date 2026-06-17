import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const t = await getTranslations("groups");
  const tCommon = await getTranslations("common");
  const groups = await prisma.group.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { students: true } } },
  });
  return (
    <div>
      <PageHeader
        title={t("title")}
        actions={
          <Link href="/groups/new">
            <Button>
              <Plus className="h-4 w-4" /> {t("new")}
            </Button>
          </Link>
        }
      />
      {groups.length === 0 ? (
        <EmptyState title={tCommon("noResults")} />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>{t("name")}</TH>
                <TH>{t("level")}</TH>
                <TH>{t("schedule")}</TH>
                <TH>{t("students")}</TH>
              </TR>
            </THead>
            <TBody>
              {groups.map((g) => (
                <TR key={g.id}>
                  <TD>
                    <Link className="font-medium hover:underline" href={`/groups/${g.id}`}>
                      {g.name}
                    </Link>
                  </TD>
                  <TD>{g.level}</TD>
                  <TD>{g.schedule ?? "—"}</TD>
                  <TD>{g._count.students}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
