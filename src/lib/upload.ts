import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { env } from "./env";

export interface SavedFile {
  filePath: string;
  size: number;
  mime: string;
  originalName: string;
}

export async function saveUploadedFile(file: File): Promise<SavedFile> {
  const { UPLOAD_DIR, MAX_UPLOAD_MB } = env();
  const maxBytes = MAX_UPLOAD_MB * 1024 * 1024;

  if (file.size > maxBytes) {
    throw new Error(`File exceeds ${MAX_UPLOAD_MB} MB`);
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = path.extname(file.name) || "";
  const safeBase = randomUUID();
  const finalName = `${safeBase}${ext}`;
  const fullPath = path.join(UPLOAD_DIR, finalName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer);

  return {
    filePath: finalName, // store relative name; resolve at read time
    size: file.size,
    mime: file.type || "application/octet-stream",
    originalName: file.name,
  };
}

export function resolveUploadPath(relativeName: string): string {
  const { UPLOAD_DIR } = env();
  return path.join(UPLOAD_DIR, path.basename(relativeName));
}
