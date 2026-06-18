// Smoke test: upload a tiny blob to verify Azure credentials and container access.
// Run: node --env-file=.env scripts/test-azure.mjs
import {
  BlobSASPermissions,
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";

const {
  AZURE_ACCOUNT_NAME: name,
  AZURE_ACCOUNT_KEY: key,
  AZURE_CONTAINER: container,
} = process.env;

if (!name || !key || !container) {
  console.error("Missing AZURE_ACCOUNT_NAME / AZURE_ACCOUNT_KEY / AZURE_CONTAINER");
  process.exit(1);
}

const credential = new StorageSharedKeyCredential(name, key);
const client = new BlobServiceClient(
  `https://${name}.blob.core.windows.net`,
  credential,
);
const cClient = client.getContainerClient(container);

const blobName = `_healthcheck/${Date.now()}.txt`;
const blob = cClient.getBlockBlobClient(blobName);
const body = `teacherflow azure connectivity check ${new Date().toISOString()}`;

console.log(`-> uploading ${blobName} (${body.length} bytes)…`);
await blob.uploadData(Buffer.from(body), {
  blobHTTPHeaders: { blobContentType: "text/plain; charset=utf-8" },
});

const sas = generateBlobSASQueryParameters(
  {
    containerName: container,
    blobName,
    permissions: BlobSASPermissions.parse("r"),
    startsOn: new Date(Date.now() - 60_000),
    expiresOn: new Date(Date.now() + 5 * 60_000),
  },
  credential,
).toString();
const readUrl = `https://${name}.blob.core.windows.net/${container}/${encodeURIComponent(blobName)}?${sas}`;

console.log("-> reading back through SAS…");
const res = await fetch(readUrl);
const got = await res.text();
if (got !== body) {
  console.error("MISMATCH read body did not equal uploaded body");
  console.error({ expected: body, got });
  process.exit(2);
}
console.log("-> deleting test blob…");
await blob.deleteIfExists();

console.log("\nOK Azure connectivity verified.");
console.log(`Account:   ${name}`);
console.log(`Container: ${container}`);
