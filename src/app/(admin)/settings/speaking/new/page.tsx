import { getTranslations } from "next-intl/server";
import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SpeakingQuestionForm } from "@/components/speaking/question-form";
import { createSpeakingQuestion } from "@/server/actions/speaking";

export default async function NewSpeakingQuestionPage() {
  await requireRole(Role.TEACHER);
  const t = await getTranslations("speaking");
  return (
    <div className="space-y-6">
      <PageHeader title={t("newQuestion")} />
      <Card className="max-w-3xl">
        <CardContent className="pt-6">
          <SpeakingQuestionForm
            initial={{
              prompt: "",
              level: "",
              track: "",
              category: "",
              points: 1,
              twist: "",
              isActive: true,
            }}
            action={createSpeakingQuestion}
          />
        </CardContent>
      </Card>
    </div>
  );
}
