import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role, MaterialTrack, TRACK_ORDER, EnglishLevel, Skill } from "@/lib/enums";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SpeakingGame } from "@/components/speaking/game";
import { SkillPortal } from "@/components/skills/skill-portal";
import { submitSkill } from "@/server/actions/skills";

export const dynamic = "force-dynamic";

type Search = { track?: string; level?: string };

function isTrack(v: string | undefined): v is MaterialTrack {
  return !!v && (TRACK_ORDER as string[]).includes(v);
}
function isLevel(v: string | undefined): v is EnglishLevel {
  return !!v && (Object.values(EnglishLevel) as string[]).includes(v);
}

export default async function SpeakingCornerPage({
  searchParams,
}: {
  searchParams?: Promise<Search>;
}) {
  const session = await requireRole(Role.STUDENT);
  const t = await getTranslations("speaking");
  const tCommon = await getTranslations("common");
  const tSkills = await getTranslations("skills");
  const sp = (await searchParams) ?? {};

  const where: Record<string, unknown> = { isActive: true };
  if (isTrack(sp.track)) where.track = sp.track;
  if (isLevel(sp.level)) where.level = sp.level;

  const studentId = session.user.studentId;
  const [questions, mySubmissions] = await Promise.all([
    prisma.speakingQuestion.findMany({
      where,
      orderBy: { createdAt: "desc" },
    }),
    studentId
      ? prisma.skillSubmission.findMany({
          where: { studentId, skill: Skill.SPEAKING },
          orderBy: { submittedAt: "desc" },
          select: {
            id: true,
            title: true,
            text: true,
            filePath: true,
            mime: true,
            status: true,
            score: true,
            maxScore: true,
            teacherComment: true,
            submittedAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const submitAudio = async (formData: FormData) => {
    "use server";
    await submitSkill(Skill.SPEAKING, formData);
  };

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} description={t("intro")} />

      <SkillPortal skill={Skill.SPEAKING} submissions={mySubmissions} action={submitAudio} />

      <section className="space-y-3">
        <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {tSkills("speakingGameSection")}
        </h2>
        {questions.length === 0 ? (
          <EmptyState title={tCommon("noResults")} description={t("emptyHelp")} />
        ) : (
          <SpeakingGame
          questions={questions.map((q) => ({
            id: q.id,
            prompt: q.prompt,
            level: q.level,
            track: q.track,
            category: q.category,
            points: q.points,
            twist: q.twist,
          }))}
          labels={{
            team1: t("team1"),
            team2: t("team2"),
            currentTurn: t("currentTurn"),
            correct: t("correct"),
            wrong: t("wrong"),
            skip: t("skip"),
            next: t("next"),
            reset: t("reset"),
            startOver: t("startOver"),
            points: t("pointsAbbr"),
            twistOptions: {
              DOUBLE: t("twistOptions.DOUBLE"),
              STEAL: t("twistOptions.STEAL"),
              SWAP: t("twistOptions.SWAP"),
              LOSE: t("twistOptions.LOSE"),
            },
            winner: t("winner"),
            tie: t("tie"),
            finalScore: t("finalScore"),
            questionsLeft: t("questionsLeft"),
          }}
          />
        )}
      </section>
    </div>
  );
}
