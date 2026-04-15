import { NextRequest, NextResponse } from "next/server";
import { AuthenticationError, requireAuthenticatedUser } from "@/lib/auth/current-user";
import { importResume } from "@/lib/resume/pipeline/import-resume";
import { createImportedResume } from "@/lib/resume/storage";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser();
    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title");
    const llmConsent = formData.get("llmConsent") === "true";
    const enrich =
      formData.get("enrich") === "true" ||
      request.nextUrl.searchParams.get("enrich") === "true";

    const result = await importResume({
      file: file instanceof File ? file : null,
      title: typeof title === "string" ? title : null,
      enrich,
      llmConsent,
    });

    const saved = await createImportedResume({ user, result });

    return NextResponse.json({
      success: true,
      resume: result.resume,
      savedId: saved.id,
      meta: {
        filename: result.meta.source.originalFilename ?? result.meta.title,
        size: file instanceof File ? file.size : 0,
        type: file instanceof File ? file.type : result.meta.source.format,
        extractedChars: result.meta.extractedChars,
        llmEnriched: result.meta.llmEnriched,
        validationOk: result.meta.validationOk,
        validationIssues: result.meta.validationIssues,
        source: result.meta.source,
        connectorReady: result.meta.connectorReady,
      },
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("[parse-cv]", error);
    const message =
      error instanceof Error ? error.message : "Erro interno ao processar o arquivo.";

    return NextResponse.json({ error: message }, { status: 422 });
  }
}
