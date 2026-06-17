import Link from "next/link";
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
} from "date-fns";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MeetButton } from "@/components/ui/meet-button";
import { Video, Unplug, Users, ClipboardCheck, Wallet, AlertCircle, TrendingUp } from "lucide-react";
import { disconnectGoogleCalendar } from "@/server/actions/google";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ googleError?: string }>;
}) {
  const session = await requireRole(Role.TEACHER);
  const t = await getTranslations("dashboard");
  const tNav = await getTranslations("nav");
  const today = startOfDay(new Date());
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const { googleError } = (await searchParams) ?? {};
  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  const [
    activeStudents,
    pendingCorrections,
    pendingPayments,
    overduePayments,
    monthRevenue,
    upcoming,
    activity,
    googleAccount,
  ] = await Promise.all([
    prisma.student.count({ where: { status: "ACTIVE" } }),
    prisma.submission.count({ where: { correctionStatus: "SUBMITTED" } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.payment.count({ where: { status: "OVERDUE" } }),
    prisma.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: monthStart, lte: monthEnd } },
      _sum: { amountCents: true },
    }),
    prisma.class.findMany({
      where: { startAt: { gte: today } },
      orderBy: { startAt: "asc" },
      take: 5,
      include: { student: true, group: true },
    }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.googleAccount.findUnique({ where: { userId: session.user.id } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={tNav("dashboard")} />
      {googleEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-4 w-4" /> Google Calendar / Meet
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            {googleAccount ? (
              <>
                <div className="text-sm">
                  <Badge tone="success">Conectada</Badge>{" "}
                  <span className="text-muted-foreground">
                    {googleAccount.email ?? ""}
                  </span>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await disconnectGoogleCalendar();
                  }}
                >
                  <Button variant="outline" type="submit" size="sm">
                    <Unplug className="h-4 w-4" /> Desconectar
                  </Button>
                </form>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Conecta tu cuenta de Google para crear enlaces de Meet
                  automáticamente al programar clases online.
                </p>
                <Link href="/api/google/calendar/start">
                  <Button size="sm">
                    <Video className="h-4 w-4" /> Conectar Google Calendar
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
          {googleError && (
            <CardContent className="pt-0">
              <p className="text-sm text-destructive">
                Error al conectar con Google: {googleError}
              </p>
            </CardContent>
          )}
        </Card>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label={t("activeStudents")} value={activeStudents} href="/students" icon={Users} tone="primary" />
        <Stat label={t("pendingCorrections")} value={pendingCorrections} href="/assignments" icon={ClipboardCheck} tone="warning" />
        <Stat
          label={t("monthRevenue")}
          value={formatMoney(monthRevenue._sum.amountCents ?? 0)}
          href="/payments"
          icon={TrendingUp}
          tone="success"
        />
        <Stat label={t("pendingPayments")} value={pendingPayments} href="/payments" icon={Wallet} tone="accent" />
        <Stat label={t("overduePayments")} value={overduePayments} href="/payments?status=OVERDUE" icon={AlertCircle} tone="destructive" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("upcomingClasses")}</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {upcoming.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <Link href={`/classes/${c.id}`} className="hover:underline">
                        {c.title}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {c.student
                          ? `${c.student.firstName}`
                          : c.group?.name ?? ""}
                      </span>
                      {c.meetLink && <MeetButton href={c.meetLink} size="xs" />}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(c.startAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("recentActivity")}</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2">
                    <span>
                      <Badge tone="muted" className="mr-2">
                        {a.action}
                      </Badge>
                      <span className="text-muted-foreground">{a.entity}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(a.createdAt)}
                    </span>
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

const STAT_TONES = {
  primary: "from-primary/15 to-primary/5 text-primary",
  accent: "from-accent/15 to-accent/5 text-accent",
  success: "from-success/15 to-success/5 text-success",
  warning: "from-warning/15 to-warning/5 text-warning",
  destructive: "from-destructive/15 to-destructive/5 text-destructive",
} as const;

function Stat({
  label,
  value,
  href,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: React.ReactNode;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: keyof typeof STAT_TONES;
}) {
  const content = (
    <Card className="group overflow-hidden transition hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="relative pt-6">
        <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", STAT_TONES[tone])} />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          </div>
          {Icon && (
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br", STAT_TONES[tone])}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
