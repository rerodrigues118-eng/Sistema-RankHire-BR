declare module "pdf-parse/lib/pdf-parse.js" {
  import { PDFParseOptions, PDFInfo, PDFMetadata, PDFPageInfo } from "pdf-parse";

  type PDFParseResult = {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: PDFMetadata;
    text: string;
    version: string;
    numpages?: number;
    numrender?: number;
    info?: PDFInfo;
    metadata?: PDFMetadata;
    text?: string;
  };

  export default function pdfParse(data: Buffer | Uint8Array | string, options?: PDFParseOptions): Promise<PDFParseResult>;
}
