import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { normalizeExtraction } from "@/lib/ai/normalize-extraction";

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
    const body = (await request.json()) as {
      documentId?: string;
      selections?: Record<string, unknown>;
    };

    if (!body.documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }

    // Run normalization
    const summary = await normalizeExtraction(
      body.documentId,
      user.id,
      supabase,
      body.selections
    );

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";

    // Map known errors to appropriate status codes
    if (message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes("No normalization available") || message.includes("No extracted data")) {
      return NextResponse.json({ error: message }, { status: 422 });
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
