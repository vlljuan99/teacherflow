import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  GraduationCap,
  School,
  Award,
  Globe2,
  Users,
  FolderOpen,
  ChevronLeft,
  Download,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import {
  Role,
  MaterialTrack,
  TRACK_ORDER,
  TRACK_SUBSECTIONS,
  ExamType,
} from "@/lib/enums";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TRACK_VISUAL: Record<
  MaterialTrack,
  { icon: LucideIcon; gradient: string }
> = {
  ESO: { icon: GraduationCap, gradient: "from-violet-500 to-fuchsia-500" },
  BACHILLERATO: { icon: School, gradient: "from-sky-500 to-cyan-500" },
  CAMBRIDGE_B1: { icon: Award, gradient: "from-emerald-500 to-teal-500" },
  CAMBRIDGE_B2: { icon: Award, gradient: "from-amber-500 to-orange-500" },
  CAMBRIDGE_C1: { icon: Award, gradient: "from-rose-500 to-pink-500" },
  APTIS: { icon: Globe2, gradient: "from-indigo-500 to-blue-500" },
  ADULTS: { icon: Users, gradient: "from-slate-600 to-slate-800" },
};

type Search = { track?: string; section?: string };

function isTrack(v: string | undefined): v is MaterialTrack {
  return !!v && (TRACK_ORDER as string[]).includes(v);
}

export default async function StudentMaterialsPage({
  searchParams,
}: {
  searchParams?: Promise<Search>;
}) {
  await requireRole(Role.STUDENT);
  const t = await getTranslations("materials");
  const tCommon = await getTranslations("common");
  const tDash = await getTranslations("dashboard");
  const sp = (await searchParams) ?? {};
  const track = isTrack(sp.track) ? sp.track : null;
  const section = sp.section?.trim() || null;

  if (!track) {
    const trackCounts = await prisma.material.groupBy({
      by: ["track"],
      _count: { _all: true },
      where: { track: { not: null } },
    });
    const countByTrack = new Map<string, number>();
    for (const r of trackCounts) {
      if (r.track) countByTrack.set(r.track, r._count._all);
    }
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{tDash("yourFolders")}</p>
        </header>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {TRACK_ORDER.map((tr) => {
            const visual = TRACK_VISUAL[tr];
            const Icon = visual.icon;
            const count = countByTrack.get(tr) ?? 0;
            return (
              <Link key={tr} href={`/portal/materials?track=${tr}`} className="group block">
                <div className="flex h-full flex-col items-start gap-3 rounded-2xl border bg-card p-4 shadow-sm transition active:scale-[0.98] sm:p-5 sm:hover:-translate-y-0.5 sm:hover:shadow-md">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${visual.gradient}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold leading-tight sm:text-base">
                      {t(`trackOptions.${tr}`)}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {tDash("materialsCount", { count })}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // ---------- Track view ----------
  const visual = TRACK_VISUAL[track];
  const Icon = visual.icon;
  const trackLabel = t(`trackOptions.${track}`);

  if (!section) {
    const materials = await prisma.material.findMany({
      where: { track },
      orderBy: [{ subSection: "asc" }, { createdAt: "desc" }],
      select: { id: true, subSection: true },
    });
    const sectionCounts = new Map<string, number>();
    let untaggedCount = 0;
    for (const m of materials) {
      if (m.subSection) {
        sectionCounts.set(m.subSection, (sectionCounts.get(m.subSection) ?? 0) + 1);
      } else {
        untaggedCount++;
      }
    }
    const suggested = TRACK_SUBSECTIONS[track];
    const sectionsToShow = Array.from(
      new Set([...suggested, ...sectionCounts.keys()]),
    ).filter((s) => (sectionCounts.get(s) ?? 0) > 0);

    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <Link
          href="/portal/materials"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          {tCommon("back")}
        </Link>
        <header className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${visual.gradient}`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {trackLabel}
          </h1>
        </header>

        {sectionsToShow.length === 0 && untaggedCount === 0 ? (
          <EmptyState title={tCommon("noResults")} />
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
            {sectionsToShow.map((s) => (
              <Link
                key={s}
                href={`/portal/materials?track=${track}&section=${encodeURIComponent(s)}`}
                className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm transition active:scale-[0.99] sm:hover:-translate-y-0.5 sm:hover:shadow-md"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FolderOpen className="h-5 w-5 shrink-0 text-primary" />
                  <span className="truncate font-medium">{s}</span>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {sectionCounts.get(s) ?? 0}
                </span>
              </Link>
            ))}
            {untaggedCount > 0 && (
              <Link
                href={`/portal/materials?track=${track}&section=__none__`}
                className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm transition active:scale-[0.99] sm:hover:-translate-y-0.5 sm:hover:shadow-md"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FolderOpen className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">{tCommon("none")}</span>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {untaggedCount}
                </span>
              </Link>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---------- Section view (flat list) ----------
  const sectionFilter = section === "__none__" ? null : section;
  const materials = await prisma.material.findMany({
    where: { track, subSection: sectionFilter },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link
        href={`/portal/materials?track=${track}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {trackLabel}
      </Link>
      <header className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${visual.gradient}`}
        >
          <FolderOpen className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {sectionFilter ?? tCommon("none")}
        </h1>
      </header>

      {materials.length === 0 ? (
        <EmptyState title={tCommon("noResults")} />
      ) : (
        <Card>
          <CardContent className="p-2 sm:p-3">
            <ul className="divide-y">
              {materials.map((m) => (
                <li key={m.id}>
                  <a
                    href={`/api/files/${m.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 px-2 py-3 transition active:bg-muted/60 sm:rounded-md sm:px-3 sm:hover:bg-muted/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Download className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {m.title}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <Badge tone="info">
                          {t(`typeOptions.${m.type as "PDF" | "IMAGE" | "AUDIO" | "DOCUMENT"}`)}
                        </Badge>
                        {m.level && <Badge tone="muted">{m.level}</Badge>}
                        {m.examType && (
                          <Badge tone="default">
                            {t(`examOptions.${m.examType as ExamType}`)}
                          </Badge>
                        )}
                        <span>{formatDate(m.createdAt)}</span>
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
