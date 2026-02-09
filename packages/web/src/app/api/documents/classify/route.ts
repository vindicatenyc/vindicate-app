import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { classifyDocument } from "@/lib/ai/document-processor";
import { pdfToPageContents, imageToBase64 } from "@/lib/ai/pdf-to-images";

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();

    // Verify auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse body
    const body = (await request.json()) as { documentId?: string };
    if (!body.documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }

    // Fetch document
    const { data: docRow, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", body.documentId)
      .single();

    if (docError || !docRow) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (docRow.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Download file
    const storagePath: string = docRow.url;
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(storagePath);

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: "Failed to download file" },
        { status: 500 }
      );
    }

    // Convert to pages
    const mimeType: string = docRow.mime_type ?? "application/octet-stream";
    let pages;

    if (mimeType === "application/pdf") {
      const buffer = new Uint8Array(await fileData.arrayBuffer());
      pages = await pdfToPageContents(buffer);
    } else if (mimeType.startsWith("image/")) {
      const buffer = Buffer.from(await fileData.arrayBuffer());
      const base64 = await imageToBase64(buffer, mimeType);
      pages = [{ pageNumber: 1, imageBase64: base64 }];
    } else {
      const text = await fileData.text();
      pages = [{ pageNumber: 1, text }];
    }

    // Classify
    const result = await classifyDocument(pages);

    // Update document with classification
    await supabase
      .from("documents")
      .update({ auto_classified_type: result.documentType })
      .eq("id", body.documentId);

    return NextResponse.json({
      documentType: result.documentType,
      confidence: result.confidence,
      reasoning: result.reasoning,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
