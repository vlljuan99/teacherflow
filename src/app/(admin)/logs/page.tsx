import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { Role } from "@/lib/enums";
import { requireRole } from "@/server/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ROLE_FILTERS = ["ALL", "TEACHER", "STUDENT", "GUARDIAN"] as const;
type RoleFilter = (typeof ROLE_FILTERS)[number];

const ROLE_TONE: Record<string, "default" | "success" | "muted" | "warning"> = {
  ADMIN: "warning",
  TEACHER: "default",
  STUDENT: "success",
  GUARDIAN: "muted",
};

export default async function LogsPage({
  searchParams,
}: {
  searchParams?: Promise<{ role?: string }>;
}) {
  await requireRole(Role.ADMIN);
  const t = await getTranslations("logs");
  const { role } = (await searchParams) ?? {};
  const filter: RoleFilter = ROLE_FILTERS.includes(role as RoleFilter)
    ? (role as RoleFilter)
    : "ALL";

  const logs = await prisma.auditLog.findMany({
    where: filter === "ALL" ? {} : { actor: { role: filter } },
    orderBy: { createdAt: "desc" },
    take: 150,
    include: { actor: { select: { name: true, email: true, role: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="flex flex-wrap gap-2">
        {ROLE_FILTERS.map((r) => (
          <Link
            key={r}
            href={r === "ALL" ? "/logs" : `/logs?role=${r}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition",
              filter === r
                ? "border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary",
            )}
          >
            {t(`filter.${r}`)}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <ul className="divide-y">
              {logs.map((log) => {
                const actorName = log.actor?.name ?? t("system");
                const actorRole = log.actor?.role ?? null;
                return (
                  <li
                    key={log.id}
                    className="flex items-center gap-3 px-4 py-3 text-sm"
                  >
                    <Avatar src={null} name={actorName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{actorName}</span>
                        {actorRole && (
                          <Badge tone={ROLE_TONE[actorRole] ?? "muted"}>
                            {actorRole}
                          </Badge>
                        )}
                        <Badge tone="muted">{log.action}</Badge>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {log.entity}
                        {log.actor?.email ? ` · ${log.actor.email}` : ""}
                        {log.ip ? ` · ${log.ip}` : ""}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
