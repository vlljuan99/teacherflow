import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role, Skill } from "@/lib/enums";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Mic, PenLine, Download, FileText } from "lucide-react";
import { reviewSkill } from "@/server/actions/skills";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function isSkill(v: string | undefined): v is Skill {
  return v === Skill.SPEAKING || v === Skill.WRITING;
}

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ skill?: string }>;
}) {
  await requireRole(Role.TEACHER);
  const t = await getTranslations("skills");
  const tCommon = await getTranslations("common");
  const sp = (await searchParams) ?? {};
  const skillFilter = isSkill(sp.skill) ? sp.skill : null;

  const submissions = await prisma.skillSubmission.findMany({
    where: { ...(skillFilter ? { skill: skillFilter } : {}) },
    include: {
      student: { select: { firstName: true, lastName: true } },
    },
    orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
  });

  const filters: { key: string | null; label: string; href: string }[] = [
    { key: null, label: tCommon("all"), href: "/submissions" },
    { key: Skill.SPEAKING, label: t("speaking"), href: "/submissions?skill=SPEAKING" },
    { key: Skill.WRITING, label: t("writing"), href: "/submissions?skill=WRITING" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("reviewTitle")} description={t("reviewIntro")} />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.href}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition",
              (skillFilter ?? null) === f.key
                ? "border-primary bg-primary/10 text-primary"
                : "bg-card hover:bg-secondary",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {submissions.length === 0 ? (
        <EmptyState title={t("noSubmissionsTeacher")} />
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => {
            const isSpeaking = s.skill === Skill.SPEAKING;
            const reviewed = s.status === "REVIEWED";
            const review = async (formData: FormData) => {
              "use server";
              await reviewSkill(s.id, formData);
            };
            return (
              <Card key={s.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {isSpeaking ? <Mic className="h-4 w-4" /> : <PenLine className="h-4 w-4" />}
                      </span>
                      <div>
                        <div className="font-medium">{s.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.student.firstName} {s.student.lastName} · {formatDateTime(s.submittedAt)}
                        </div>
                      </div>
                    </div>
                    <Badge tone={reviewed ? "success" : "warning"}>
                      {reviewed ? t("statusReviewed") : t("statusSubmitted")}
                    </Badge>
                  </div>

                  {s.filePath && isSpeaking && s.mime?.startsWith("audio/") && (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <audio controls src={`/api/skill-files/${s.id}`} className="w-full" />
                  )}
                  {s.filePath && (!isSpeaking || !s.mime?.startsWith("audio/")) && (
                    <a
                      href={`/api/skill-files/${s.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" /> {tCommon("open")}
                    </a>
                  )}
                  {s.text && (
                    <p className="flex items-start gap-2 whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      {s.text}
                    </p>
                  )}

                  <form action={review} className="flex flex-wrap items-end gap-3 border-t pt-3">
                    <div className="space-y-1">
                      <Label htmlFor={`score-${s.id}`} className="text-xs">{t("score")}</Label>
                      <Input
                        id={`score-${s.id}`}
                        name="score"
                        type="number"
                        step="0.5"
                        defaultValue={s.score ?? ""}
                        className="w-24"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`max-${s.id}`} className="text-xs">{t("maxScore")}</Label>
                      <Input
                        id={`max-${s.id}`}
                        name="maxScore"
                        type="number"
                        step="0.5"
                        defaultValue={s.maxScore ?? 10}
                        className="w-24"
                      />
                    </div>
                    <div className="min-w-[12rem] flex-1 space-y-1">
                      <Label htmlFor={`comment-${s.id}`} className="text-xs">{t("comment")}</Label>
                      <Textarea
                        id={`comment-${s.id}`}
                        name="teacherComment"
                        rows={1}
                        defaultValue={s.teacherComment ?? ""}
                      />
                    </div>
                    <Button type="submit" size="sm">{t("saveReview")}</Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
