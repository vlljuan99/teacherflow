// Extension point: PDF text/content extraction.
// MVP uses the stub extractor (no real extraction); the interface stays stable
// so a future implementation can swap in without touching callers.

export interface PdfExtractor {
  extractText(buffer: Buffer): Promise<string>;
}

export class StubPdfExtractor implements PdfExtractor {
  async extractText(_buffer: Buffer): Promise<string> {
    return "";
  }
}

export function createPdfExtractor(): PdfExtractor {
  return new StubPdfExtractor();
}
