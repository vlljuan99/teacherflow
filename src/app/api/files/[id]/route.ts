import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { auth } from "@/server/auth/config";
import { prisma } from "@/lib/db";
import { azureReadUrl, resolveLocalPath } from "@/lib/storage";
import { StorageBackend } from "@/lib/enums";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const material = await prisma.material.findUnique({ where: { id } });
  if (!material) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Materials are global: any authenticated user (teacher, student, guardian) can read.

  if (material.storage === StorageBackend.AZURE && material.blobName) {
    const url = azureReadUrl(material.blobName, 15);
    return NextResponse.redirect(url, 302);
  }

  const filePath = resolveLocalPath(material.filePath);
  try {
    await stat(filePath);
  } catch {
    return NextResponse.json({ error: "Missing file" }, { status: 410 });
  }
  const nodeStream = createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;
  return new NextResponse(webStream, {
    headers: {
      "Content-Type": material.mime,
      "Content-Length": String(material.size),
      "Content-Disposition": `inline; filename="${material.title}"`,
    },
  });
}
