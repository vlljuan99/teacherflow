import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role, Skill } from "@/lib/enums";
import { PageHeader } from "@/components/layout/page-header";
import { SkillPortal } from "@/components/skills/skill-portal";
import { submitSkill } from "@/server/actions/skills";

export const dynamic = "force-dynamic";

export default async function StudentWritingPage() {
  const session = await requireRole(Role.STUDENT);
  const t = await getTranslations("skills");
  const studentId = session.user.studentId;
  if (!studentId) return null;

  const submissions = await prisma.skillSubmission.findMany({
    where: { studentId, skill: Skill.WRITING },
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
  });

  const action = async (formData: FormData) => {
    "use server";
    await submitSkill(Skill.WRITING, formData);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("writingTitle")} description={t("writingIntro")} />
      <SkillPortal skill={Skill.WRITING} submissions={submissions} action={action} />
    </div>
  );
}
