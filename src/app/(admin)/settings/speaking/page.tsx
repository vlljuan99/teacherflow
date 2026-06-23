import Link from "next/link";
import { Trash2, Plus, Pencil } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteSpeakingQuestion } from "@/server/actions/speaking";

export const dynamic = "force-dynamic";

export default async function SpeakingAdminPage() {
  await requireRole(Role.TEACHER);
  const t = await getTranslations("speaking");
  const tCommon = await getTranslations("common");

  const questions = await prisma.speakingQuestion.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("adminTitle")}
        description={t("adminIntro")}
        actions={
          <Link href="/settings/speaking/new">
            <Button>
              <Plus className="h-4 w-4" /> {t("newQuestion")}
            </Button>
          </Link>
        }
      />
      {questions.length === 0 ? (
        <EmptyState title={tCommon("noResults")} />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <ul className="divide-y">
              {questions.map((q) => (
                <li key={q.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{q.prompt}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                      {!q.isActive && <Badge tone="muted">{tCommon("archived")}</Badge>}
                      {q.level && <Badge tone="default">{q.level}</Badge>}
                      {q.track && <Badge tone="info">{q.track}</Badge>}
                      {q.category && <Badge tone="muted">{q.category}</Badge>}
                      <Badge tone="success">{q.points} pt{q.points === 1 ? "" : "s"}</Badge>
                      {q.twist && <Badge tone="warning">{q.twist}</Badge>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Link href={`/settings/speaking/${q.id}`}>
                      <Button size="sm" variant="ghost">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteSpeakingQuestion(q.id);
                      }}
                    >
                      <Button size="sm" variant="ghost" type="submit">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
