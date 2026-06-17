import { prisma } from "@/lib/db";
import { refreshAccessToken } from "./oauth";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const DEFAULT_TZ = "Europe/Madrid";

export interface MeetEvent {
  id: string;
  hangoutLink: string | null;
  htmlLink: string | null;
}

async function getValidAccessToken(userId: string): Promise<string> {
  const acc = await prisma.googleAccount.findUnique({ where: { userId } });
  if (!acc) throw new Error("Google Calendar not connected");
  if (!acc.refreshToken) throw new Error("No refresh token stored");
  const stillValid =
    acc.accessToken &&
    acc.expiresAt &&
    acc.expiresAt.getTime() > Date.now() + 60_000;
  if (stillValid) return acc.accessToken!;
  const refreshed = await refreshAccessToken(acc.refreshToken);
  const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
  await prisma.googleAccount.update({
    where: { userId },
    data: {
      accessToken: refreshed.access_token,
      expiresAt,
      // refresh_token usually NOT returned on refresh; keep the old one
      ...(refreshed.refresh_token ? { refreshToken: refreshed.refresh_token } : {}),
    },
  });
  return refreshed.access_token;
}

export async function createMeetEvent({
  teacherUserId,
  title,
  description,
  startAt,
  endAt,
  attendees = [],
  timeZone = DEFAULT_TZ,
}: {
  teacherUserId: string;
  title: string;
  description?: string;
  startAt: Date;
  endAt: Date;
  attendees?: string[];
  timeZone?: string;
}): Promise<MeetEvent> {
  const accessToken = await getValidAccessToken(teacherUserId);
  const requestId = `tf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const body = {
    summary: title,
    description,
    start: { dateTime: startAt.toISOString(), timeZone },
    end: { dateTime: endAt.toISOString(), timeZone },
    attendees: attendees.map((email) => ({ email })),
    conferenceData: {
      createRequest: {
        requestId,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };
  const res = await fetch(`${CALENDAR_API}?conferenceDataVersion=1`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Calendar create event failed: ${res.status} ${text}`);
  }
  const ev = (await res.json()) as {
    id: string;
    hangoutLink?: string;
    htmlLink?: string;
    conferenceData?: {
      entryPoints?: { entryPointType: string; uri: string }[];
    };
  };
  const meet =
    ev.hangoutLink ??
    ev.conferenceData?.entryPoints?.find((p) => p.entryPointType === "video")?.uri ??
    null;
  return { id: ev.id, hangoutLink: meet, htmlLink: ev.htmlLink ?? null };
}

export async function deleteMeetEvent(teacherUserId: string, eventId: string) {
  const accessToken = await getValidAccessToken(teacherUserId);
  const res = await fetch(`${CALENDAR_API}/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 410 && res.status !== 404) {
    throw new Error(`Calendar delete event failed: ${res.status}`);
  }
}
