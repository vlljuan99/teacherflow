import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus } from "lucide-react";
import { StudentsList } from "./_list";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const t = await getTranslations("students");
  const tCommon = await getTranslations("common");
  const students = await prisma.student.findMany({
    orderBy: [{ status: "asc" }, { lastName: "asc" }],
    include: { group: { select: { id: true, name: true } } },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("title")}
        actions={
          <Link href="/students/new">
            <Button>
              <Plus className="h-4 w-4" /> {t("new")}
            </Button>
          </Link>
        }
      />
      {students.length === 0 ? (
        <EmptyState
          title={tCommon("noResults")}
          action={
            <Link href="/students/new">
              <Button>{t("new")}</Button>
            </Link>
          }
        />
      ) : (
        <StudentsList
          students={students.map((s) => ({
            id: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.email,
            level: s.level,
            status: s.status,
            isMinor: s.isMinor,
            photoUrl: s.photoUrl,
            group: s.group ? { id: s.group.id, name: s.group.name } : null,
          }))}
        />
      )}
    </div>
  );
}
