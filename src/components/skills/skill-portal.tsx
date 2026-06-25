import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Upload, FileText, Download } from "lucide-react";
import { Skill } from "@/lib/enums";
import { formatDate } from "@/lib/utils";

export interface SkillSubmissionView {
  id: string;
  title: string;
  text: string | null;
  filePath: string | null;
  mime: string | null;
  status: string;
  score: number | null;
  maxScore: number | null;
  teacherComment: string | null;
  submittedAt: Date;
}

export async function SkillPortal({
  skill,
  submissions,
  action,
}: {
  skill: Skill;
  submissions: SkillSubmissionView[];
  action: (formData: FormData) => Promise<void>;
}) {
  const t = await getTranslations("skills");
  const tCommon = await getTranslations("common");
  const isSpeaking = skill === Skill.SPEAKING;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {isSpeaking ? t("uploadAudioTitle") : t("uploadFileTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} encType="multipart/form-data" className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">{t("titleField")}</Label>
              <Input id="title" name="title" required maxLength={200} placeholder={t("titlePlaceholder")} />
            </div>
            {!isSpeaking && (
              <div className="space-y-1.5">
                <Label htmlFor="text">{t("textField")}</Label>
                <Textarea id="text" name="text" rows={5} placeholder={t("textPlaceholder")} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="file">
                {isSpeaking ? t("audioFile") : t("attachFile")}
              </Label>
              <Input
                id="file"
                name="file"
                type="file"
                accept={isSpeaking ? "audio/*" : "application/pdf,image/*,.doc,.docx,.txt,.odt"}
                required={isSpeaking}
                className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
              />
              <p className="text-xs text-muted-foreground">
                {isSpeaking ? t("audioHint") : t("fileHint")}
              </p>
            </div>
            <Button type="submit">
              <Upload className="h-4 w-4" /> {t("submitBtn")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("yourSubmissions")}
        </h2>
        {submissions.length === 0 ? (
          <EmptyState title={t("noSubmissions")} description={t("noSubmissionsHint")} />
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => {
              const reviewed = s.status === "REVIEWED";
              return (
                <Card key={s.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{s.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(s.submittedAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {reviewed && s.score != null && (
                          <span className="text-sm font-semibold">
                            {s.score}
                            {s.maxScore != null ? `/${s.maxScore}` : ""}
                          </span>
                        )}
                        <Badge tone={reviewed ? "success" : "info"}>
                          {reviewed ? t("statusReviewed") : t("statusSubmitted")}
                        </Badge>
                      </div>
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
                    {reviewed && s.teacherComment && (
                      <div className="rounded-lg border-l-2 border-primary bg-primary/5 p-3 text-sm">
                        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                          {t("teacherFeedback")}
                        </div>
                        {s.teacherComment}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
