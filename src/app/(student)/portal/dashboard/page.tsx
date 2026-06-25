import Link from "next/link";
import { startOfDay } from "date-fns";
import { getTranslations } from "next-intl/server";
import {
  GraduationCap,
  School,
  Award,
  Globe2,
  Users,
  Sparkles,
  ChevronRight,
  Calendar,
  ClipboardList,
  BellRing,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role, MaterialTrack, TRACK_ORDER } from "@/lib/enums";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TRACK_VISUAL: Record<
  MaterialTrack,
  { icon: LucideIcon; gradient: string; ring: string }
> = {
  ESO: {
    icon: GraduationCap,
    gradient: "from-violet-500 to-fuchsia-500",
    ring: "ring-violet-200",
  },
  BACHILLERATO: {
    icon: School,
    gradient: "from-sky-500 to-cyan-500",
    ring: "ring-sky-200",
  },
  CAMBRIDGE_B1: {
    icon: Award,
    gradient: "from-emerald-500 to-teal-500",
    ring: "ring-emerald-200",
  },
  CAMBRIDGE_B2: {
    icon: Award,
    gradient: "from-amber-500 to-orange-500",
    ring: "ring-amber-200",
  },
  CAMBRIDGE_C1: {
    icon: Award,
    gradient: "from-rose-500 to-pink-500",
    ring: "ring-rose-200",
  },
  APTIS: {
    icon: Globe2,
    gradient: "from-indigo-500 to-blue-500",
    ring: "ring-indigo-200",
  },
  ADULTS: {
    icon: Users,
    gradient: "from-slate-600 to-slate-800",
    ring: "ring-slate-200",
  },
};

export default async function StudentDashboardPage() {
  const session = await requireRole(Role.STUDENT);
  const t = await getTranslations("dashboard");
  const tMaterials = await getTranslations("materials");
  if (!session.user.studentId) return null;
  const studentId = session.user.studentId;
  const today = startOfDay(new Date());

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { groupId: true, firstName: true, allowedTracks: true },
  });
  const groupId = student?.groupId ?? null;
  const allowed = (student?.allowedTracks ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is MaterialTrack => (TRACK_ORDER as string[]).includes(s));
  const visibleTracks: MaterialTrack[] =
    allowed.length > 0 ? TRACK_ORDER.filter((tr) => allowed.includes(tr)) : [...TRACK_ORDER];

  const pendingWhere = {
    OR: [{ studentId }, ...(groupId ? [{ groupId }] : [])],
    submissions: {
      none: {
        studentId,
        correctionStatus: { in: ["SUBMITTED", "CORRECTED"] },
      },
    },
  };

  const [
    upcoming,
    pending,
    pendingCount,
    trackCounts,
    expressionSetting,
    meaningSetting,
  ] = await Promise.all([
    prisma.class.findMany({
      where: {
        OR: [{ studentId }, ...(groupId ? [{ groupId }] : [])],
        startAt: { gte: today },
      },
      orderBy: { startAt: "asc" },
      take: 3,
    }),
    prisma.assignment.findMany({
      where: pendingWhere,
      include: { worksheet: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.assignment.count({ where: pendingWhere }),
    prisma.material.groupBy({
      by: ["track"],
      _count: { _all: true },
      where: { track: { not: null } },
    }),
    prisma.siteSetting.findUnique({ where: { key: "expressionOfWeek" } }),
    prisma.siteSetting.findUnique({
      where: { key: "expressionOfWeekMeaning" },
    }),
  ]);

  const countByTrack = new Map<string, number>();
  for (const row of trackCounts) {
    if (row.track) countByTrack.set(row.track, row._count._all);
  }

  const expression = expressionSetting?.value?.trim() ?? "";
  const meaning = meaningSetting?.value?.trim() ?? "";
  const firstName = student?.firstName ?? "";

  return (
    <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {firstName ? `Hi ${firstName} 👋` : "Hi 👋"}
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          {t("welcomeNote")}
        </p>
      </section>

      {pendingCount > 0 && (
        <Link
          href="/portal/worksheets"
          className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-sm transition active:scale-[0.99] sm:hover:-translate-y-0.5 sm:hover:shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400/20">
            <BellRing className="h-5 w-5 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold sm:text-base">
              {t("pendingHomeworkTitle", { count: pendingCount })}
            </div>
            <div className="text-xs text-amber-800/80">
              {t("pendingHomeworkSubtitle")}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-amber-600" />
        </Link>
      )}

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-accent text-white shadow-lg">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium uppercase tracking-wider text-white/80">
                {t("expressionOfWeek")}
              </div>
              {expression ? (
                <>
                  <div className="mt-1 text-xl font-semibold leading-tight sm:text-2xl">
                    “{expression}”
                  </div>
                  {meaning && (
                    <p className="mt-2 text-sm leading-relaxed text-white/90 sm:text-base">
                      {meaning}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-1 text-sm text-white/90">
                  {t("expressionOfWeekEmpty")}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("yourFolders")}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {visibleTracks.map((track) => {
            const visual = TRACK_VISUAL[track];
            const Icon = visual.icon;
            const count = countByTrack.get(track) ?? 0;
            return (
              <Link
                key={track}
                href={`/portal/materials?track=${track}`}
                className="group block"
              >
                <div className="flex h-full flex-col items-start gap-3 rounded-2xl border bg-card p-4 shadow-sm transition active:scale-[0.98] sm:p-5 sm:hover:-translate-y-0.5 sm:hover:shadow-md">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${visual.gradient}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold leading-tight sm:text-base">
                      {tMaterials(`trackOptions.${track}`)}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {t("materialsCount", { count })}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Calendar className="h-4 w-4 text-primary" />
              {t("upcomingClasses")}
            </div>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <ul className="space-y-2.5">
                {upcoming.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start justify-between gap-2 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{c.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateTime(c.startAt)}
                      </div>
                    </div>
                    {c.meetLink && (
                      <a
                        href={c.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-500/20"
                      >
                        Meet ↗
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <ClipboardList className="h-4 w-4 text-primary" />
              {t("pendingWorksheets")}
            </div>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <ul className="space-y-2.5">
                {pending.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/portal/worksheets/${a.id}/solve`}
                      className="flex items-center justify-between gap-2 text-sm hover:underline"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {a.worksheet.title}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        {formatDate(a.dueAt) || ""}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
