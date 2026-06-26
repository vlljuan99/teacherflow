import { Mail, Phone, MessageCircle, UserX } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { Role } from "@/lib/enums";
import { requireRole } from "@/server/auth/session";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ContactTeacherPage() {
  const session = await requireRole(Role.STUDENT);
  const t = await getTranslations("contactTeacher");
  const studentId = session.user.studentId;

  const student = studentId
    ? await prisma.student.findUnique({
        where: { id: studentId },
        select: {
          teacher: {
            select: {
              name: true,
              photoUrl: true,
              contactEmail: true,
              contactPhone: true,
              contactWhatsapp: true,
              contactNote: true,
            },
          },
        },
      })
    : null;
  const teacher = student?.teacher ?? null;

  if (!teacher) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <UserX className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("noTeacher")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const waNumber = teacher.contactWhatsapp?.replace(/[^\d]/g, "") || null;
  const channels = [
    teacher.contactEmail && {
      icon: Mail,
      label: t("email"),
      value: teacher.contactEmail,
      href: `mailto:${teacher.contactEmail}`,
    },
    waNumber && {
      icon: MessageCircle,
      label: t("whatsapp"),
      value: teacher.contactWhatsapp,
      href: `https://wa.me/${waNumber}`,
    },
    teacher.contactPhone && {
      icon: Phone,
      label: t("phone"),
      value: teacher.contactPhone,
      href: `tel:${teacher.contactPhone.replace(/\s+/g, "")}`,
    },
  ].filter(Boolean) as {
    icon: typeof Mail;
    label: string;
    value: string;
    href: string;
  }[];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <Card>
        <CardContent className="space-y-5 py-6">
          <div className="flex items-center gap-4">
            <Avatar src={teacher.photoUrl} name={teacher.name} size="xl" />
            <div>
              <div className="text-lg font-semibold">{teacher.name}</div>
              <div className="text-sm text-muted-foreground">{t("yourTeacher")}</div>
            </div>
          </div>

          {teacher.contactNote && (
            <p className="rounded-xl bg-muted/50 p-3 text-sm leading-relaxed">
              {teacher.contactNote}
            </p>
          )}

          {channels.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noChannels")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {channels.map((c) => {
                const Icon = c.icon;
                const external = c.href.startsWith("http");
                return (
                  <a
                    key={c.label}
                    href={c.href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer" : undefined}
                    className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm transition active:scale-[0.98] sm:hover:-translate-y-0.5 sm:hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">{c.label}</div>
                      <div className="truncate text-sm font-medium">{c.value}</div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
