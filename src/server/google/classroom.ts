import { prisma } from "@/lib/db";
import { refreshAccessToken } from "./oauth";

const CLASSROOM = "https://classroom.googleapis.com/v1";

async function getValidAccessToken(userId: string): Promise<string> {
  const acc = await prisma.googleAccount.findUnique({ where: { userId } });
  if (!acc) throw new Error("Google not connected");
  if (!acc.refreshToken) throw new Error("No refresh token stored");
  const stillValid =
    acc.accessToken && acc.expiresAt && acc.expiresAt.getTime() > Date.now() + 60_000;
  if (stillValid) return acc.accessToken!;
  const refreshed = await refreshAccessToken(acc.refreshToken);
  const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
  await prisma.googleAccount.update({
    where: { userId },
    data: {
      accessToken: refreshed.access_token,
      expiresAt,
      ...(refreshed.refresh_token ? { refreshToken: refreshed.refresh_token } : {}),
    },
  });
  return refreshed.access_token;
}

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  courseState?: string;
}

export interface ClassroomTopic {
  topicId: string;
  name: string;
}

export interface DriveFileRef {
  id: string;
  title?: string;
  alternateLink?: string;
  thumbnailUrl?: string;
}

export interface ClassroomMaterial {
  id: string;
  title?: string;
  description?: string;
  topicId?: string;
  alternateLink?: string;
  materials?: Array<{
    driveFile?: { driveFile?: DriveFileRef };
    youtubeVideo?: { id: string; title?: string; alternateLink?: string };
    link?: { url: string; title?: string };
    form?: { formUrl?: string; title?: string };
  }>;
  updateTime?: string;
}

async function api<T>(token: string, path: string, query?: Record<string, string>): Promise<T> {
  const url = new URL(`${CLASSROOM}${path}`);
  if (query) Object.entries(query).forEach(([k, v]) => v && url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Classroom ${path} ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function listCourses(userId: string): Promise<ClassroomCourse[]> {
  const token = await getValidAccessToken(userId);
  const out: ClassroomCourse[] = [];
  let pageToken: string | undefined;
  do {
    const data = await api<{ courses?: ClassroomCourse[]; nextPageToken?: string }>(
      token,
      "/courses",
      { pageSize: "50", pageToken: pageToken ?? "", teacherId: "me" },
    );
    if (data.courses) out.push(...data.courses);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return out;
}

export async function listTopics(userId: string, courseId: string): Promise<ClassroomTopic[]> {
  const token = await getValidAccessToken(userId);
  const out: ClassroomTopic[] = [];
  let pageToken: string | undefined;
  do {
    const data = await api<{ topic?: ClassroomTopic[]; nextPageToken?: string }>(
      token,
      `/courses/${encodeURIComponent(courseId)}/topics`,
      { pageSize: "100", pageToken: pageToken ?? "" },
    );
    if (data.topic) out.push(...data.topic);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return out;
}

export async function listCourseWorkMaterial(
  userId: string,
  courseId: string,
): Promise<ClassroomMaterial[]> {
  const token = await getValidAccessToken(userId);
  const out: ClassroomMaterial[] = [];
  let pageToken: string | undefined;
  do {
    const data = await api<{ courseWorkMaterial?: ClassroomMaterial[]; nextPageToken?: string }>(
      token,
      `/courses/${encodeURIComponent(courseId)}/courseWorkMaterials`,
      { pageSize: "50", pageToken: pageToken ?? "" },
    );
    if (data.courseWorkMaterial) out.push(...data.courseWorkMaterial);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return out;
}
