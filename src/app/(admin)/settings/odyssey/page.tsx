import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowUp, ArrowDown, Trash2, Plus, Compass } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role, EnglishLevel } from "@/lib/enums";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  createMilestone,
  updateMilestone,
  deleteMilestone,
  moveMilestone,
} from "@/server/actions/milestones";

export const dynamic = "force-dynamic";

const LEVELS = Object.values(EnglishLevel);

export default async function OdysseySettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  await requireRole(Role.TEACHER);
  const t = await getTranslations("odyssey");
  const tCommon = await getTranslations("common");
  const { level: levelParam } = await searchParams;
  const level = LEVELS.includes(levelParam as EnglishLevel)
    ? (levelParam as EnglishLevel)
    : EnglishLevel.B2;

  const [milestones, counts] = await Promise.all([
    prisma.levelMilestone.findMany({
      where: { level },
      orderBy: { order: "asc" },
    }),
    prisma.levelMilestone.groupBy({
      by: ["level"],
      _count: { _all: true },
    }),
  ]);
  const countByLevel = new Map(counts.map((c) => [c.level, c._count._all]));

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("intro")} />

      {/* Level selector */}
      <div className="flex flex-wrap gap-2">
        {LEVELS.map((lvl) => {
          const active = lvl === level;
          const n = countByLevel.get(lvl) ?? 0;
          return (
            <Link
              key={lvl}
              href={`/settings/odyssey?level=${lvl}`}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary",
              )}
            >
              {lvl}
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px]",
                  active ? "bg-primary/20" : "bg-muted",
                )}
              >
                {n}
              </span>
            </Link>
          );
        })}
      </div>

      <Card className="max-w-3xl">
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Compass className="h-4 w-4 text-primary" />
            {t("voyageOf", { level })}
          </div>

          {milestones.length === 0 ? (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("empty")}
            </p>
          ) : (
            <ol className="space-y-2">
              {milestones.map((m, i) => (
                <li
                  key={m.id}
                  className="rounded-xl border bg-card p-3 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <form
                      action={updateMilestone.bind(null, m.id)}
                      className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center"
                    >
                      <Input
                        name="title"
                        defaultValue={m.title}
                        required
                        maxLength={120}
                        className="flex-1"
                        placeholder={t("titlePlaceholder")}
                      />
                      <Input
                        name="description"
                        defaultValue={m.description ?? ""}
                        maxLength={500}
                        className="flex-1"
                        placeholder={t("descPlaceholder")}
                      />
                      <Button type="submit" variant="outline" size="sm">
                        {tCommon("save")}
                      </Button>
                    </form>
                    <div className="flex shrink-0 items-center gap-1">
                      <form action={moveMilestone.bind(null, m.id, "up")}>
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          disabled={i === 0}
                          aria-label={t("moveUp")}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                      </form>
                      <form action={moveMilestone.bind(null, m.id, "down")}>
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          disabled={i === milestones.length - 1}
                          aria-label={t("moveDown")}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </form>
                      <form action={deleteMilestone.bind(null, m.id)}>
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          aria-label={tCommon("delete")}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {/* Add new milestone */}
          <form
            action={createMilestone}
            className="mt-2 flex flex-col gap-2 rounded-xl border border-dashed p-3 sm:flex-row sm:items-center"
          >
            <input type="hidden" name="level" value={level} />
            <Input
              name="title"
              required
              maxLength={120}
              className="flex-1"
              placeholder={t("titlePlaceholder")}
            />
            <Input
              name="description"
              maxLength={500}
              className="flex-1"
              placeholder={t("descPlaceholder")}
            />
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" /> {t("add")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
