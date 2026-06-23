import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SpeakingQuestionForm } from "@/components/speaking/question-form";
import { updateSpeakingQuestion } from "@/server/actions/speaking";

export const dynamic = "force-dynamic";

export default async function EditSpeakingQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(Role.TEACHER);
  const { id } = await params;
  const t = await getTranslations("speaking");
  const q = await prisma.speakingQuestion.findUnique({ where: { id } });
  if (!q) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={t("editQuestion")} />
      <Card className="max-w-3xl">
        <CardContent className="pt-6">
          <SpeakingQuestionForm
            initial={{
              prompt: q.prompt,
              level: q.level ?? "",
              track: q.track ?? "",
              category: q.category ?? "",
              points: q.points,
              twist: q.twist ?? "",
              isActive: q.isActive,
            }}
            action={async (fd: FormData) => {
              "use server";
              await updateSpeakingQuestion(q.id, fd);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
