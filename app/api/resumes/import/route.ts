import { NextRequest, NextResponse } from "next/server";
import { AuthenticationError, requireAuthenticatedUser } from "@/lib/auth/current-user";
import { importResume } from "@/lib/resume/pipeline/import-resume";
import { createImportedResume } from "@/lib/resume/storage";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser();
    const formData = await request.formData();
    const file = formData.get("file");
    const rawText = formData.get("rawText");
    const sourceUrl = formData.get("sourceUrl");
    const title = formData.get("title");
    const enrich = formData.get("enrich") === "true";
    const llmConsent = formData.get("llmConsent") === "true";

    const result = await importResume({
      file: file instanceof File ? file : null,
      rawText: typeof rawText === "string" ? rawText : null,
      sourceUrl: typeof sourceUrl === "string" ? sourceUrl : null,
      title: typeof title === "string" ? title : null,
      enrich,
      llmConsent,
    });

    const saved = await createImportedResume({ user, result });

    return NextResponse.json({
      success: true,
      resume: result.resume,
      savedId: saved.id,
      meta: result.meta,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }

    console.error("[resumes/import]", error);
    const message =
      error instanceof Error ? error.message : "Erro interno ao importar curriculo.";

    return NextResponse.json({ success: false, error: message }, { status: 422 });
  }
}
