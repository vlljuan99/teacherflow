import { prisma } from "@/lib/db";
import { refreshAccessToken } from "./oauth";

const DRIVE_FILES = "https://www.googleapis.com/drive/v3/files";

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

export async function createDriveFolder(
  teacherUserId: string,
  name: string,
  parentId?: string,
): Promise<string> {
  const accessToken = await getValidAccessToken(teacherUserId);
  const body: Record<string, unknown> = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) body.parents = [parentId];
  const res = await fetch(DRIVE_FILES, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive create folder failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

export async function getDocMeta(
  teacherUserId: string,
  fileId: string,
): Promise<{ modifiedTime: string; name: string } | null> {
  const accessToken = await getValidAccessToken(teacherUserId);
  const url = `${DRIVE_FILES}/${encodeURIComponent(fileId)}?fields=modifiedTime,name`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Drive meta failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as { modifiedTime: string; name: string };
}

export async function exportDocAsPlainText(
  teacherUserId: string,
  fileId: string,
): Promise<string> {
  const accessToken = await getValidAccessToken(teacherUserId);
  const url = `${DRIVE_FILES}/${encodeURIComponent(fileId)}/export?mimeType=text/plain`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Drive export failed: ${res.status} ${await res.text()}`);
  }
  return res.text();
}

export async function createDriveDoc(
  teacherUserId: string,
  name: string,
  parentId?: string,
): Promise<{ id: string; webViewLink: string }> {
  const accessToken = await getValidAccessToken(teacherUserId);
  const body: Record<string, unknown> = {
    name,
    mimeType: "application/vnd.google-apps.document",
  };
  if (parentId) body.parents = [parentId];
  const res = await fetch(`${DRIVE_FILES}?fields=id,webViewLink`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive create doc failed: ${res.status} ${text}`);
  }
  return (await res.json()) as { id: string; webViewLink: string };
}
