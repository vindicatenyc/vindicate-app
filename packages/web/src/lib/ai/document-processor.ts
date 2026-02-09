/**
 * Document processing engine — classification and structured extraction via OpenAI.
 *
 * Pipeline: fetch file → convert to images/text → classify → extract → save results
 */

import OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocumentType } from "@vindicate/shared";
import {
  bankStatementSchema,
  creditReportSchema,
  payStubSchema,
  medicalBillSchema,
  taxDocumentSchema,
  classificationSchema,
  type ClassificationResult,
} from "./schemas";
import { pdfToPageContents, imageToBase64, type PdfPageContent } from "./pdf-to-images";

// ---------------------------------------------------------------------------
// OpenAI client
// ---------------------------------------------------------------------------

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured. Set OPENAI_API_KEY in your environment.");
  }
  return new OpenAI({ apiKey, timeout: 60_000 });
}

// ---------------------------------------------------------------------------
// Token cost calculation (GPT-4.1 mini pricing)
// ---------------------------------------------------------------------------

const COST_PER_INPUT_TOKEN_MINI = 0.0000004;
const COST_PER_OUTPUT_TOKEN_MINI = 0.0000016;
const COST_PER_INPUT_TOKEN_FULL = 0.000002;
const COST_PER_OUTPUT_TOKEN_FULL = 0.000008;

function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): number {
  if (model.includes("gpt-4.1-mini")) {
    return inputTokens * COST_PER_INPUT_TOKEN_MINI + outputTokens * COST_PER_OUTPUT_TOKEN_MINI;
  }
  return inputTokens * COST_PER_INPUT_TOKEN_FULL + outputTokens * COST_PER_OUTPUT_TOKEN_FULL;
}

// ---------------------------------------------------------------------------
// Build content array from page contents
// ---------------------------------------------------------------------------

type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail: "low" | "high" } };

function buildContentParts(
  pages: PdfPageContent[],
  systemPrompt: string
): ChatContentPart[] {
  const parts: ChatContentPart[] = [{ type: "text", text: systemPrompt }];

  for (const page of pages) {
    if (page.imageBase64) {
      parts.push({
        type: "image_url",
        image_url: {
          url: `data:image/png;base64,${page.imageBase64}`,
          detail: "low",
        },
      });
    } else if (page.text) {
      parts.push({
        type: "text",
        text: `--- Page ${page.pageNumber} ---\n${page.text}`,
      });
    }
  }

  return parts;
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

export interface ClassifyResult {
  documentType: DocumentType;
  confidence: number;
  reasoning: string;
  model: string;
  tokensUsed: number;
  cost: number;
}

export async function classifyDocument(
  pages: PdfPageContent[],
  model = "gpt-4.1-mini"
): Promise<ClassifyResult> {
  const openai = getOpenAIClient();

  // Only send the first page for classification
  const firstPage = pages.slice(0, 1);

  const content = buildContentParts(
    firstPage,
    "Analyze this document and classify its type. This is a financial/legal document uploaded by a consumer managing debt. Classify it as one of the allowed types."
  );

  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: "user", content }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "document_classification",
        strict: true,
        schema: classificationSchema,
      },
    },
    max_tokens: 500,
  });

  const result = JSON.parse(
    response.choices[0].message.content ?? "{}"
  ) as ClassificationResult;

  const inputTokens = response.usage?.prompt_tokens ?? 0;
  const outputTokens = response.usage?.completion_tokens ?? 0;

  return {
    documentType: result.document_type as DocumentType,
    confidence: result.confidence,
    reasoning: result.reasoning,
    model,
    tokensUsed: inputTokens + outputTokens,
    cost: calculateCost(inputTokens, outputTokens, model),
  };
}

// ---------------------------------------------------------------------------
// Schema selection
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSchemaForType(docType: string): { name: string; schema: Record<string, any> } | null {
  switch (docType) {
    case "bank-statement":
      return { name: "bank_statement_extraction", schema: bankStatementSchema };
    case "credit-report":
      return { name: "credit_report_extraction", schema: creditReportSchema };
    case "income-verification":
      return { name: "pay_stub_extraction", schema: payStubSchema };
    case "medical-bill":
      return { name: "medical_bill_extraction", schema: medicalBillSchema };
    case "tax-document":
      return { name: "tax_document_extraction", schema: taxDocumentSchema };
    default:
      return null;
  }
}

function getExtractionPrompt(docType: string): string {
  switch (docType) {
    case "bank-statement":
      return "Extract all data from this bank statement. Include every transaction you can find. Use ISO date format (YYYY-MM-DD). Amounts should be positive numbers. Classify each transaction as debit or credit.";
    case "credit-report":
      return "Extract all data from this credit report. Include every account, collection, and inquiry. Use ISO date format (YYYY-MM-DD). For amounts, use numbers (not strings).";
    case "income-verification":
      return "Extract pay stub data including employer, pay period, gross/net pay, all deductions, and year-to-date totals. Use ISO date format (YYYY-MM-DD).";
    case "medical-bill":
      return "Extract medical bill data including provider, patient, all charges, insurance payments, and patient responsibility. Use ISO date format (YYYY-MM-DD).";
    case "tax-document":
      return "Extract tax document data. Determine the subtype (W-2, 1099, 1040, etc.) and extract all relevant fields. Use ISO date format (YYYY-MM-DD).";
    default:
      return "Extract all structured data you can find from this document. Use ISO date format (YYYY-MM-DD).";
  }
}

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

export interface ExtractResult {
  data: Record<string, unknown>;
  model: string;
  tokensUsed: number;
  cost: number;
  confidence: number;
}

export async function extractDocument(
  pages: PdfPageContent[],
  documentType: string,
  model = "gpt-4.1-mini"
): Promise<ExtractResult> {
  const openai = getOpenAIClient();
  const schemaInfo = getSchemaForType(documentType);

  // For multi-page documents (>10 pages), process in chunks
  const CHUNK_SIZE = 5;
  if (pages.length > 10 && schemaInfo) {
    return extractInChunks(pages, documentType, model, CHUNK_SIZE);
  }

  const prompt = getExtractionPrompt(documentType);
  const content = buildContentParts(pages, prompt);

  // Build request with or without structured schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requestParams: any = {
    model,
    messages: [{ role: "user", content }],
    max_tokens: 4096,
  };

  if (schemaInfo) {
    requestParams.response_format = {
      type: "json_schema",
      json_schema: {
        name: schemaInfo.name,
        strict: true,
        schema: schemaInfo.schema,
      },
    };
  } else {
    requestParams.response_format = { type: "json_object" };
  }

  const response = await openai.chat.completions.create(requestParams);

  const data = JSON.parse(
    response.choices[0].message.content ?? "{}"
  ) as Record<string, unknown>;

  const inputTokens = response.usage?.prompt_tokens ?? 0;
  const outputTokens = response.usage?.completion_tokens ?? 0;
  const cost = calculateCost(inputTokens, outputTokens, model);

  // Estimate confidence based on how much data was extracted
  const confidence = estimateConfidence(data, documentType);

  return {
    data,
    model,
    tokensUsed: inputTokens + outputTokens,
    cost,
    confidence,
  };
}

/**
 * Process multi-page documents in chunks to stay within context limits.
 * Merges extracted data from all chunks.
 */
async function extractInChunks(
  pages: PdfPageContent[],
  documentType: string,
  model: string,
  chunkSize: number
): Promise<ExtractResult> {
  let totalTokens = 0;
  let totalCost = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allResults: Record<string, any>[] = [];

  for (let i = 0; i < pages.length; i += chunkSize) {
    const chunk = pages.slice(i, i + chunkSize);
    const chunkNum = Math.floor(i / chunkSize) + 1;
    const totalChunks = Math.ceil(pages.length / chunkSize);

    const prompt = `${getExtractionPrompt(documentType)}\n\nThis is chunk ${chunkNum} of ${totalChunks} from the document. Extract any data visible on these pages.`;
    const content = buildContentParts(chunk, prompt);

    const openai = getOpenAIClient();
    const schemaInfo = getSchemaForType(documentType);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestParams: any = {
      model,
      messages: [{ role: "user", content }],
      max_tokens: 4096,
    };

    if (schemaInfo) {
      requestParams.response_format = {
        type: "json_schema",
        json_schema: {
          name: schemaInfo.name,
          strict: true,
          schema: schemaInfo.schema,
        },
      };
    } else {
      requestParams.response_format = { type: "json_object" };
    }

    const response = await openai.chat.completions.create(requestParams);
    const data = JSON.parse(
      response.choices[0].message.content ?? "{}"
    ) as Record<string, unknown>;

    totalTokens += (response.usage?.prompt_tokens ?? 0) + (response.usage?.completion_tokens ?? 0);
    totalCost += calculateCost(
      response.usage?.prompt_tokens ?? 0,
      response.usage?.completion_tokens ?? 0,
      model
    );

    allResults.push(data);
  }

  // Merge results: combine arrays, take first non-empty scalar values
  const merged = mergeExtractionResults(allResults);
  const confidence = estimateConfidence(merged, documentType);

  return {
    data: merged,
    model,
    tokensUsed: totalTokens,
    cost: totalCost,
    confidence,
  };
}

/**
 * Merge multiple extraction results from chunked processing.
 */
function mergeExtractionResults(
  results: Record<string, unknown>[]
): Record<string, unknown> {
  if (results.length === 0) return {};
  if (results.length === 1) return results[0];

  const merged: Record<string, unknown> = { ...results[0] };

  for (let i = 1; i < results.length; i++) {
    const result = results[i];
    for (const [key, value] of Object.entries(result)) {
      if (Array.isArray(value) && Array.isArray(merged[key])) {
        // Concatenate arrays (transactions, accounts, etc.)
        merged[key] = [...(merged[key] as unknown[]), ...value];
      } else if (
        (merged[key] === undefined || merged[key] === null) &&
        value !== undefined &&
        value !== null
      ) {
        // Fill in missing scalar values from later chunks
        merged[key] = value;
      }
    }
  }

  return merged;
}

/**
 * Estimate extraction confidence based on how complete the data looks.
 */
function estimateConfidence(
  data: Record<string, unknown>,
  documentType: string
): number {
  const keys = Object.keys(data).filter(
    (k) => data[k] !== undefined && data[k] !== null
  );

  if (keys.length === 0) return 0;

  // Required fields per type for a "good" extraction
  const requiredFields: Record<string, string[]> = {
    "bank-statement": ["bank_name", "transactions"],
    "credit-report": ["accounts"],
    "income-verification": ["employer_name", "gross_pay", "net_pay"],
    "medical-bill": ["provider_name", "total_amount"],
    "tax-document": ["document_subtype", "tax_year"],
  };

  const required = requiredFields[documentType] ?? [];
  if (required.length === 0) return 0.6; // Unknown type, modest confidence

  const foundRequired = required.filter((f) => {
    const val = data[f];
    if (val === undefined || val === null) return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  });

  return Math.min(1, foundRequired.length / required.length);
}

// ---------------------------------------------------------------------------
// Full processing pipeline
// ---------------------------------------------------------------------------

export interface ProcessResult {
  processingStatus: "completed" | "failed" | "needs_review";
  extractedData: Record<string, unknown> | null;
  confidence: number;
  model: string;
  tokensUsed: number;
  cost: number;
  classifiedType?: string;
  error?: string;
}

export async function processDocument(
  documentId: string,
  supabase: SupabaseClient,
  overrideModel?: string
): Promise<ProcessResult> {
  // Mark as processing
  await supabase
    .from("documents")
    .update({ processing_status: "processing" })
    .eq("id", documentId);

  try {
    // 1. Fetch document metadata
    const { data: docRow, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (fetchError || !docRow) {
      throw new Error(`Document not found: ${fetchError?.message ?? "unknown"}`);
    }

    // 2. Download file from Supabase Storage
    const storagePath: string = docRow.url;
    if (!storagePath || storagePath === "#") {
      throw new Error("Document has no storage path");
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(storagePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message ?? "unknown"}`);
    }

    // 3. Convert to page contents
    const mimeType: string = docRow.mime_type ?? "application/octet-stream";
    let pages: PdfPageContent[];

    if (mimeType === "application/pdf") {
      const buffer = new Uint8Array(await fileData.arrayBuffer());
      pages = await pdfToPageContents(buffer);
    } else if (mimeType.startsWith("image/")) {
      const buffer = Buffer.from(await fileData.arrayBuffer());
      const base64 = await imageToBase64(buffer, mimeType);
      pages = [{ pageNumber: 1, imageBase64: base64 }];
    } else {
      // For text files, read as text
      const text = await fileData.text();
      pages = [{ pageNumber: 1, text }];
    }

    if (pages.length === 0) {
      throw new Error("No content could be extracted from document");
    }

    // 4. Classify if type is "other" or not a recognized extraction type
    let documentType: string = docRow.type;
    let classifiedType: string | undefined;
    const extractableTypes = [
      "bank-statement",
      "credit-report",
      "income-verification",
      "medical-bill",
      "tax-document",
    ];

    if (!extractableTypes.includes(documentType)) {
      const classification = await classifyDocument(
        pages,
        overrideModel ?? "gpt-4.1-mini"
      );
      classifiedType = classification.documentType;

      if (
        extractableTypes.includes(classification.documentType) &&
        classification.confidence >= 0.5
      ) {
        documentType = classification.documentType;
      }
    }

    // 5. Extract structured data
    const model = overrideModel ?? "gpt-4.1-mini";
    let extraction = await extractDocument(pages, documentType, model);

    // 6. If confidence is low and we used mini, retry with full model
    if (extraction.confidence < 0.7 && model === "gpt-4.1-mini" && !overrideModel) {
      const retryExtraction = await extractDocument(
        pages,
        documentType,
        "gpt-4.1"
      );
      // Use retry if it's better
      if (retryExtraction.confidence > extraction.confidence) {
        extraction = {
          ...retryExtraction,
          tokensUsed: extraction.tokensUsed + retryExtraction.tokensUsed,
          cost: extraction.cost + retryExtraction.cost,
        };
      }
    }

    // 7. Determine processing status
    const processingStatus =
      extraction.confidence >= 0.7 ? "completed" : "needs_review";

    // 8. Update document row
    await supabase
      .from("documents")
      .update({
        processing_status: processingStatus,
        extracted_data: extraction.data,
        extraction_confidence: extraction.confidence,
        extraction_model: extraction.model,
        extraction_tokens_used: extraction.tokensUsed,
        extraction_cost: extraction.cost,
        auto_classified_type: classifiedType ?? null,
      })
      .eq("id", documentId);

    return {
      processingStatus: processingStatus as "completed" | "needs_review",
      extractedData: extraction.data,
      confidence: extraction.confidence,
      model: extraction.model,
      tokensUsed: extraction.tokensUsed,
      cost: extraction.cost,
      classifiedType,
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown processing error";

    // Update document with failure
    await supabase
      .from("documents")
      .update({
        processing_status: "failed",
        extracted_data: { error: errorMessage },
      })
      .eq("id", documentId);

    return {
      processingStatus: "failed",
      extractedData: null,
      confidence: 0,
      model: overrideModel ?? "gpt-4.1-mini",
      tokensUsed: 0,
      cost: 0,
      error: errorMessage,
    };
  }
}
