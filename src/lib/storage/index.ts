import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { env } from "@/lib/env";
import { StorageBackend } from "@/lib/enums";
import { uploadBlob, generateReadSasUrl, deleteBlob } from "./azure";

export interface StoredFile {
  storage: StorageBackend;
  blobName: string | null;   // azure only
  filePath: string;          // legacy local relative name OR blob name
  size: number;
  mime: string;
  originalName: string;
}

function safeExt(name: string): string {
  const ext = path.extname(name).toLowerCase();
  return /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : "";
}

export async function storeUploadedFile(
  file: File,
  opts?: { prefix?: string },
): Promise<StoredFile> {
  const { STORAGE_BACKEND, UPLOAD_DIR, MAX_UPLOAD_MB } = env();
  const maxBytes = MAX_UPLOAD_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`File exceeds ${MAX_UPLOAD_MB} MB`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = safeExt(file.name);
  const prefix = opts?.prefix ? `${opts.prefix.replace(/^\/+|\/+$/g, "")}/` : "";
  const name = `${prefix}${randomUUID()}${ext}`;
  const mime = file.type || "application/octet-stream";

  if (STORAGE_BACKEND === StorageBackend.AZURE) {
    await uploadBlob(buffer, name, mime);
    return {
      storage: StorageBackend.AZURE,
      blobName: name,
      filePath: name,
      size: buffer.byteLength,
      mime,
      originalName: file.name,
    };
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const localName = path.basename(name);
  await writeFile(path.join(UPLOAD_DIR, localName), buffer);
  return {
    storage: StorageBackend.LOCAL,
    blobName: null,
    filePath: localName,
    size: buffer.byteLength,
    mime,
    originalName: file.name,
  };
}

export async function storeBuffer({
  buffer,
  filename,
  mime,
  prefix,
}: {
  buffer: Buffer;
  filename: string;
  mime: string;
  prefix?: string;
}): Promise<StoredFile> {
  const { STORAGE_BACKEND, UPLOAD_DIR } = env();
  const ext = safeExt(filename);
  const folder = prefix ? `${prefix.replace(/^\/+|\/+$/g, "")}/` : "";
  const name = `${folder}${randomUUID()}${ext}`;

  if (STORAGE_BACKEND === StorageBackend.AZURE) {
    await uploadBlob(buffer, name, mime);
    return {
      storage: StorageBackend.AZURE,
      blobName: name,
      filePath: name,
      size: buffer.byteLength,
      mime,
      originalName: filename,
    };
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const localName = path.basename(name);
  await writeFile(path.join(UPLOAD_DIR, localName), buffer);
  return {
    storage: StorageBackend.LOCAL,
    blobName: null,
    filePath: localName,
    size: buffer.byteLength,
    mime,
    originalName: filename,
  };
}

export function resolveLocalPath(relativeName: string): string {
  const { UPLOAD_DIR } = env();
  return path.join(UPLOAD_DIR, path.basename(relativeName));
}

export function azureReadUrl(blobName: string, expiryMinutes = 15): string {
  return generateReadSasUrl(blobName, expiryMinutes);
}

export async function readStoredBytes(file: {
  storage: string;
  blobName: string | null;
  filePath: string;
}): Promise<Buffer> {
  if (file.storage === StorageBackend.AZURE && file.blobName) {
    const url = generateReadSasUrl(file.blobName, 10);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Azure blob download failed: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  const { readFile } = await import("node:fs/promises");
  return readFile(resolveLocalPath(file.filePath));
}

export async function removeStored(file: {
  storage: string;
  blobName: string | null;
  filePath: string;
}): Promise<void> {
  if (file.storage === StorageBackend.AZURE && file.blobName) {
    await deleteBlob(file.blobName);
    return;
  }
  try {
    await unlink(resolveLocalPath(file.filePath));
  } catch {
    /* ignore missing files */
  }
}
