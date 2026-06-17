import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import path from "node:path";
import { auth } from "@/server/auth/config";
import { resolveUploadPath } from "@/lib/upload";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name } = await params;
  const safeName = path.basename(name);
  const fullPath = resolveUploadPath(safeName);
  try {
    const stats = await stat(fullPath);
    const nodeStream = createReadStream(fullPath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;
    const contentType = MIME_BY_EXT[path.extname(safeName).toLowerCase()] ?? "application/octet-stream";
    return new NextResponse(webStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(stats.size),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
