import { prisma } from "@/lib/db";
import { refreshAccessToken } from "./oauth";

const DOCS_API = "https://docs.googleapis.com/v1/documents";

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

/**
 * Append plain text to the end of a Google Doc.
 * Uses the Docs API batchUpdate endpoint.
 */
export async function appendToDoc(
  teacherUserId: string,
  docId: string,
  text: string,
): Promise<void> {
  const accessToken = await getValidAccessToken(teacherUserId);
  const res = await fetch(`${DOCS_API}/${encodeURIComponent(docId)}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            endOfSegmentLocation: {},
            text,
          },
        },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Docs append failed: ${res.status} ${body}`);
  }
}
