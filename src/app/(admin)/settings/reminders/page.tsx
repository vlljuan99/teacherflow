import { addDays } from "date-fns";
import { getTranslations } from "next-intl/server";
import { Mail, MailX, Send, MessageSquare } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { isEmailConfigured } from "@/lib/email";
import { isWhatsAppConfigured } from "@/lib/whatsapp";
import { madridDayBounds } from "@/lib/timezone";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { triggerClassReminders } from "@/server/actions/reminders";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  await requireRole(Role.TEACHER);
  const t = await getTranslations("settings.reminders");
  const tCommon = await getTranslations("common");

  const configured = isEmailConfigured();
  const whatsappConfigured = isWhatsAppConfigured();
  const anyConfigured = configured || whatsappConfigured;
  const tomorrow = addDays(new Date(), 1);
  const { start, end } = madridDayBounds(tomorrow);
  const [tomorrowCount, sentToday] = await Promise.all([
    prisma.class.count({ where: { startAt: { gte: start, lte: end } } }),
    prisma.classReminderSent.count({
      where: { sentAt: { gte: madridDayBounds(new Date()).start } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("intro")} />

      <Card className="max-w-2xl">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-start gap-3">
            {configured ? (
              <Mail className="mt-0.5 h-5 w-5 text-emerald-600" />
            ) : (
              <MailX className="mt-0.5 h-5 w-5 text-amber-600" />
            )}
            <div>
              <div className="text-sm font-medium">
                {configured ? t("smtpConfigured") : t("smtpMissing")}
              </div>
              {!configured && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("smtpHelp")}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MessageSquare
              className={`mt-0.5 h-5 w-5 ${whatsappConfigured ? "text-emerald-600" : "text-amber-600"}`}
            />
            <div>
              <div className="text-sm font-medium">
                {whatsappConfigured
                  ? t("whatsappConfigured")
                  : t("whatsappMissing")}
              </div>
              {!whatsappConfigured && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("whatsappHelp")}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">
                {t("classesTomorrow")}
              </div>
              <div className="mt-1 text-2xl font-semibold">{tomorrowCount}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">{t("sentToday")}</div>
              <div className="mt-1 text-2xl font-semibold">{sentToday}</div>
            </div>
          </div>

          <form
            action={async () => {
              "use server";
              await triggerClassReminders();
            }}
          >
            <Button type="submit" disabled={!anyConfigured}>
              <Send className="h-4 w-4" /> {t("sendNow")}
            </Button>
          </form>

          <Badge tone="muted">{t("autoNote")}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
