import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { processDocument } from "@/lib/ai/document-processor";

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

    // Verify document belongs to user
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, user_id")
      .eq("id", body.documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (doc.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Process document
    const result = await processDocument(body.documentId, supabase);

    return NextResponse.json({
      success: result.processingStatus !== "failed",
      extractedData: result.extractedData,
      confidence: result.confidence,
      processingStatus: result.processingStatus,
      model: result.model,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      classifiedType: result.classifiedType,
      error: result.error,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
