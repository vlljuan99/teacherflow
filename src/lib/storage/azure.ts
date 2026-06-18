import {
  BlobSASPermissions,
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";
import { env } from "@/lib/env";

let cachedClient: BlobServiceClient | null = null;
let cachedCredential: StorageSharedKeyCredential | null = null;

function getCredential(): StorageSharedKeyCredential {
  if (cachedCredential) return cachedCredential;
  const { AZURE_ACCOUNT_NAME, AZURE_ACCOUNT_KEY } = env();
  if (!AZURE_ACCOUNT_NAME || !AZURE_ACCOUNT_KEY) {
    throw new Error("Azure storage not configured (AZURE_ACCOUNT_NAME / AZURE_ACCOUNT_KEY)");
  }
  cachedCredential = new StorageSharedKeyCredential(AZURE_ACCOUNT_NAME, AZURE_ACCOUNT_KEY);
  return cachedCredential;
}

function getServiceClient(): BlobServiceClient {
  if (cachedClient) return cachedClient;
  const { AZURE_ACCOUNT_NAME } = env();
  const credential = getCredential();
  const url = `https://${AZURE_ACCOUNT_NAME}.blob.core.windows.net`;
  cachedClient = new BlobServiceClient(url, credential);
  return cachedClient;
}

function getContainerName(): string {
  const { AZURE_CONTAINER } = env();
  if (!AZURE_CONTAINER) throw new Error("AZURE_CONTAINER not set");
  return AZURE_CONTAINER;
}

export interface AzureUploadResult {
  blobName: string;
  size: number;
  mime: string;
}

export async function uploadBlob(
  buffer: Buffer,
  blobName: string,
  mime: string,
): Promise<AzureUploadResult> {
  const container = getServiceClient().getContainerClient(getContainerName());
  const blob = container.getBlockBlobClient(blobName);
  await blob.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: mime },
  });
  return { blobName, size: buffer.byteLength, mime };
}

export function generateReadSasUrl(blobName: string, expiryMinutes = 15): string {
  const { AZURE_ACCOUNT_NAME } = env();
  const containerName = getContainerName();
  const credential = getCredential();
  const startsOn = new Date(Date.now() - 60_000);
  const expiresOn = new Date(Date.now() + expiryMinutes * 60_000);
  const sas = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("r"),
      startsOn,
      expiresOn,
      protocol: undefined,
    },
    credential,
  ).toString();
  return `https://${AZURE_ACCOUNT_NAME}.blob.core.windows.net/${containerName}/${encodeURIComponent(blobName)}?${sas}`;
}

export async function deleteBlob(blobName: string): Promise<void> {
  const container = getServiceClient().getContainerClient(getContainerName());
  await container.getBlockBlobClient(blobName).deleteIfExists();
}
