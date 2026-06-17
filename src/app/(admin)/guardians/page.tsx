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

export default async function GuardiansPage() {
  const t = await getTranslations("guardians");
  const tCommon = await getTranslations("common");
  const guardians = await prisma.guardian.findMany({
    orderBy: { lastName: "asc" },
    include: { _count: { select: { students: true } } },
  });
  return (
    <div>
      <PageHeader
        title={t("title")}
        actions={
          <Link href="/guardians/new">
            <Button>
              <Plus className="h-4 w-4" /> {t("new")}
            </Button>
          </Link>
        }
      />
      {guardians.length === 0 ? (
        <EmptyState title={tCommon("noResults")} />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>{t("firstName")}</TH>
                <TH>{t("relationship")}</TH>
                <TH>{t("email")}</TH>
                <TH>{t("phone")}</TH>
                <TH>{t("linkedStudents")}</TH>
              </TR>
            </THead>
            <TBody>
              {guardians.map((g) => (
                <TR key={g.id}>
                  <TD>
                    <Link className="font-medium hover:underline" href={`/guardians/${g.id}`}>
                      {g.firstName} {g.lastName}
                    </Link>
                  </TD>
                  <TD>{g.relationship ?? "—"}</TD>
                  <TD>{g.email ?? "—"}</TD>
                  <TD>{g.phone ?? "—"}</TD>
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
