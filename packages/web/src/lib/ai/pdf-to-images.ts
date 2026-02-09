/**
 * PDF-to-image/text conversion for document processing.
 *
 * Strategy:
 * 1. Try to render pages as PNG images via pdfjs-dist + @napi-rs/canvas
 * 2. If canvas rendering fails, fall back to text extraction via getTextContent()
 *
 * Both approaches work well for financial documents. Image-based is more reliable
 * for scanned docs; text-based is cheaper in tokens and works great for digital PDFs.
 */

import type { TextItem } from "pdfjs-dist/types/src/display/api";

const MAX_PAGES = 30;
const RENDER_SCALE = 2.0; // ~150 DPI for a standard 8.5x11 page

export interface PdfPageContent {
  /** Page number (1-indexed) */
  pageNumber: number;
  /** Base64-encoded PNG image, if rendering succeeded */
  imageBase64?: string;
  /** Extracted text, if image rendering was unavailable */
  text?: string;
}

/**
 * Convert a PDF buffer to an array of page contents (images or text).
 * Returns up to MAX_PAGES pages.
 */
export async function pdfToPageContents(
  pdfBuffer: Uint8Array
): Promise<PdfPageContent[]> {
  // Dynamic import — pdfjs-dist is ESM-only in v5
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const loadingTask = pdfjsLib.getDocument({
    data: pdfBuffer,
    useSystemFonts: true,
    // Disable worker in Node.js API route context
    isEvalSupported: false,
  });

  const pdf = await loadingTask.promise;
  const pageCount = Math.min(pdf.numPages, MAX_PAGES);
  const results: PdfPageContent[] = [];

  // Try canvas rendering first
  const canvasModule = await loadCanvasModule();

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);

    if (canvasModule) {
      try {
        const imageBase64 = await renderPageToImage(page, canvasModule);
        results.push({ pageNumber: i, imageBase64 });
        continue;
      } catch {
        // Fall through to text extraction
      }
    }

    // Text extraction fallback
    const text = await extractPageText(page);
    results.push({ pageNumber: i, text });
  }

  return results;
}

/**
 * Try to load @napi-rs/canvas. Returns null if not available.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadCanvasModule(): Promise<{ createCanvas: (...args: any[]) => any } | null> {
  try {
    // Dynamic require to avoid static analysis / TypeScript module resolution
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@napi-rs/canvas");
    if (mod && typeof mod.createCanvas === "function") {
      return mod;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Render a PDF page to a base64-encoded PNG using @napi-rs/canvas.
 */
async function renderPageToImage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvasModule: { createCanvas: (...args: any[]) => any }
): Promise<string> {
  const viewport = page.getViewport({ scale: RENDER_SCALE });
  const canvas = canvasModule.createCanvas(
    Math.floor(viewport.width),
    Math.floor(viewport.height)
  );
  const context = canvas.getContext("2d");

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  const pngBuffer = canvas.toBuffer("image/png");
  return Buffer.from(pngBuffer).toString("base64");
}

/**
 * Extract text content from a PDF page as a fallback.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function extractPageText(page: any): Promise<string> {
  const textContent = await page.getTextContent();
  const lines: string[] = [];
  let lastY: number | null = null;

  for (const item of textContent.items) {
    const textItem = item as TextItem;
    if (!textItem.str) continue;

    // Detect line breaks by Y position change
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const y = (textItem as any).transform?.[5];
    if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 2) {
      lines.push("\n");
    }
    lines.push(textItem.str);
    if (y !== undefined) lastY = y;
  }

  return lines.join(" ").replace(/ \n /g, "\n").trim();
}

/**
 * Convert a single image file buffer to base64.
 * Uses sharp to normalize format/size if needed.
 */
export async function imageToBase64(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  // For very large images, resize to reduce token usage
  const sharp = (await import("sharp")).default;
  const metadata = await sharp(buffer).metadata();

  let processedBuffer: Buffer;
  if (metadata.width && metadata.width > 2000) {
    processedBuffer = await sharp(buffer)
      .resize(2000, undefined, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
  } else if (mimeType !== "image/png") {
    processedBuffer = await sharp(buffer).png().toBuffer();
  } else {
    processedBuffer = buffer;
  }

  return processedBuffer.toString("base64");
}
