import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { sendWhatsAppTemplate, isWhatsAppConfigured } from "@/lib/whatsapp";
import { APP_TIME_ZONE } from "@/lib/timezone";

export interface ReminderResult {
  sent: number;
  skipped: number;
  errors: number;
  classes: number;
  emailSent: number;
  whatsappSent: number;
}

type Channel = "EMAIL" | "WHATSAPP";

// Target window: classes whose startAt falls between (now + WINDOW_MIN_MIN)
// and (now + WINDOW_MAX_MIN). The window is sized so a 15-min cron cadence
// can't miss anything; idempotency is enforced by ClassReminderSent.
const WINDOW_MIN_MIN = 25;
const WINDOW_MAX_MIN = 45;
const REMINDER_KIND = "T_MINUS_30";

function formatMadridTime(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildEmail(
  studentName: string,
  classes: { title: string; startAt: Date; meetLink: string | null; location: string | null }[],
  now: Date,
): { subject: string; html: string; text: string } {
  const e = env();
  const portalUrl = e.APP_URL ? `${e.APP_URL}/portal/dashboard` : "";
  const greeting = `Hola ${studentName.split(" ")[0] ?? ""}`.trim();
  const first = classes[0];
  const minutesUntil = Math.max(
    1,
    Math.round((first.startAt.getTime() - now.getTime()) / 60000),
  );

  const subject =
    classes.length === 1
      ? `Tu clase de inglés empieza en ${minutesUntil} min (${formatMadridTime(first.startAt)})`
      : `Tus próximas clases de inglés empiezan pronto`;

  const itemsHtml = classes
    .map((c) => {
      const time = formatMadridTime(c.startAt);
      const mins = Math.max(
        1,
        Math.round((c.startAt.getTime() - now.getTime()) / 60000),
      );
      const linkHtml = c.meetLink
        ? `<a href="${c.meetLink}" style="color:#7c3aed;text-decoration:none;font-weight:600">Entrar a Meet</a>`
        : c.location
          ? `<span>${c.location}</span>`
          : "";
      return `
        <tr>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb">
            <div style="font-weight:600;font-size:15px;color:#111827">${c.title}</div>
            <div style="margin-top:4px;font-size:14px;color:#374151">${time} · en ~${mins} min</div>
            ${linkHtml ? `<div style="margin-top:6px;font-size:14px">${linkHtml}</div>` : ""}
          </td>
        </tr>
      `;
    })
    .join('<tr><td style="height:8px"></td></tr>');

  const intro =
    classes.length === 1
      ? `Tu clase de inglés empieza en unos <strong>${minutesUntil} minutos</strong>:`
      : `Tus próximas clases de inglés empiezan pronto:`;

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px 16px;color:#111827">
      <h1 style="margin:0 0 4px;font-size:20px">${greeting} 👋</h1>
      <p style="margin:0 0 20px;color:#4b5563;font-size:14px">${intro}</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0">
        ${itemsHtml}
      </table>
      ${
        portalUrl
          ? `<p style="margin:24px 0 0;font-size:14px"><a href="${portalUrl}" style="color:#7c3aed;font-weight:600">Abrir el portal →</a></p>`
          : ""
      }
      <p style="margin-top:32px;font-size:12px;color:#9ca3af">Si no esperabas este correo, ignóralo. — English Odyssey</p>
    </div>
  `;

  const text =
    `${greeting}\n\n` +
    (classes.length === 1
      ? `Tu clase de inglés empieza en ~${minutesUntil} minutos:\n\n`
      : `Tus próximas clases de inglés empiezan pronto:\n\n`) +
    classes
      .map((c) => {
        const time = formatMadridTime(c.startAt);
        const mins = Math.max(
          1,
          Math.round((c.startAt.getTime() - now.getTime()) / 60000),
        );
        return `• ${c.title} — ${time} (en ~${mins} min)${c.meetLink ? `\n  Meet: ${c.meetLink}` : ""}${c.location ? `\n  Lugar: ${c.location}` : ""}`;
      })
      .join("\n\n") +
    (portalUrl ? `\n\nPortal: ${portalUrl}` : "");

  return { subject, html, text };
}

/**
 * Body parameters for the approved WhatsApp template ("class_reminder").
 * Positional, mapped to {{1}} {{2}} {{3}}. The template only announces the
 * soonest class (templates can't iterate), so one message covers the batch.
 *
 * Recommended template text (submit this in the Meta dashboard):
 *   Hi {{1}}! Your English class "{{2}}" starts at {{3}}. See you soon! 👋
 */
function buildWhatsAppParams(
  studentName: string,
  next: { title: string; startAt: Date },
): string[] {
  const firstName = studentName.split(" ")[0] || "there";
  return [firstName, next.title, formatMadridTime(next.startAt)];
}

/**
 * Sends a reminder ~30 min before each class through every channel the student
 * has opted into (email and/or WhatsApp). Idempotent per channel via
 * ClassReminderSent (kind = "T_MINUS_30", channel = "EMAIL" | "WHATSAPP").
 * Designed to be triggered by an external cron running every 5–15 minutes.
 */
export async function runClassReminders(): Promise<ReminderResult> {
  const result: ReminderResult = {
    sent: 0,
    skipped: 0,
    errors: 0,
    classes: 0,
    emailSent: 0,
    whatsappSent: 0,
  };
  const emailOn = isEmailConfigured();
  const whatsappOn = isWhatsAppConfigured();
  if (!emailOn && !whatsappOn) {
    console.warn("[reminders] no channel configured (SMTP/WhatsApp) — skipping.");
    return result;
  }
  const now = new Date();
  const windowStart = new Date(now.getTime() + WINDOW_MIN_MIN * 60_000);
  const windowEnd = new Date(now.getTime() + WINDOW_MAX_MIN * 60_000);

  const studentSelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    notifyEmail: true,
    notifyWhatsapp: true,
  } as const;

  const classes = await prisma.class.findMany({
    where: { startAt: { gte: windowStart, lte: windowEnd } },
    include: {
      student: { select: studentSelect },
      group: { include: { students: { select: studentSelect } } },
    },
    orderBy: { startAt: "asc" },
  });
  result.classes = classes.length;

  type StudentInfo = {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    notifyEmail: boolean;
    notifyWhatsapp: boolean;
  };

  // group by studentId (classes stay sorted asc since the source is sorted)
  const byStudent = new Map<
    string,
    { student: StudentInfo; classes: typeof classes }
  >();
  for (const c of classes) {
    const studs = c.student ? [c.student] : c.group ? c.group.students : [];
    for (const s of studs) {
      let bucket = byStudent.get(s.id);
      if (!bucket) {
        bucket = { student: s, classes: [] };
        byStudent.set(s.id, bucket);
      }
      bucket.classes.push(c);
    }
  }

  for (const { student, classes: studentClasses } of byStudent.values()) {
    // Which channels are enabled, configured and have a destination?
    const channels: Channel[] = [];
    if (emailOn && student.notifyEmail && student.email) channels.push("EMAIL");
    if (whatsappOn && student.notifyWhatsapp && student.phone)
      channels.push("WHATSAPP");
    if (channels.length === 0) {
      result.skipped++;
      continue;
    }

    for (const channel of channels) {
      // Per-channel idempotency: skip classes already reminded on this channel.
      const alreadySent = await prisma.classReminderSent.findMany({
        where: {
          studentId: student.id,
          kind: REMINDER_KIND,
          channel,
          classId: { in: studentClasses.map((c) => c.id) },
        },
        select: { classId: true },
      });
      const sentSet = new Set(alreadySent.map((r) => r.classId));
      const fresh = studentClasses.filter((c) => !sentSet.has(c.id));
      if (fresh.length === 0) {
        result.skipped++;
        continue;
      }

      try {
        let ok = false;
        if (channel === "EMAIL") {
          const { subject, html, text } = buildEmail(
            `${student.firstName} ${student.lastName}`.trim(),
            fresh.map((c) => ({
              title: c.title,
              startAt: c.startAt,
              meetLink: c.meetLink,
              location: c.location,
            })),
            now,
          );
          ok = await sendEmail({ to: student.email!, subject, html, text });
        } else {
          ok = await sendWhatsAppTemplate({
            to: student.phone!,
            bodyParams: buildWhatsAppParams(
              `${student.firstName} ${student.lastName}`.trim(),
              fresh[0],
            ),
          });
        }

        if (!ok) {
          result.skipped++;
          continue;
        }
        await prisma.classReminderSent.createMany({
          data: fresh.map((c) => ({
            classId: c.id,
            studentId: student.id,
            kind: REMINDER_KIND,
            channel,
          })),
          skipDuplicates: true,
        });
        result.sent++;
        if (channel === "EMAIL") result.emailSent++;
        else result.whatsappSent++;
      } catch (err) {
        console.error(
          `[reminders] ${channel} failed for student`,
          student.id,
          err,
        );
        result.errors++;
      }
    }
  }

  return result;
}
