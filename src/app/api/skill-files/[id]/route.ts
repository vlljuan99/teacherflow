import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { auth } from "@/server/auth/config";
import { prisma } from "@/lib/db";
import { azureReadUrl, resolveLocalPath } from "@/lib/storage";
import { StorageBackend, Role } from "@/lib/enums";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const sub = await prisma.skillSubmission.findUnique({
    where: { id },
    select: {
      studentId: true,
      storage: true,
      blobName: true,
      filePath: true,
      mime: true,
      size: true,
      title: true,
    },
  });
  if (!sub || !sub.filePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Access: the teacher, or the student who owns the submission.
  const isTeacher = session.user.role === Role.TEACHER;
  const isOwner =
    !!session.user.studentId && session.user.studentId === sub.studentId;
  if (!isTeacher && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (sub.storage === StorageBackend.AZURE && sub.blobName) {
    return NextResponse.redirect(azureReadUrl(sub.blobName, 15), 302);
  }

  const filePath = resolveLocalPath(sub.filePath);
  try {
    await stat(filePath);
  } catch {
    return NextResponse.json({ error: "Missing file" }, { status: 410 });
  }
  const nodeStream = createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;
  return new NextResponse(webStream, {
    headers: {
      "Content-Type": sub.mime ?? "application/octet-stream",
      ...(sub.size ? { "Content-Length": String(sub.size) } : {}),
      "Content-Disposition": `inline; filename="${sub.title}"`,
    },
  });
}
