import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { AuthenticationError, requireAuthenticatedUser } from "@/lib/auth/current-user";
import { logError, logInfo } from "@/lib/observability/logger";
import { getRequestId } from "@/lib/observability/request-id";
import { importResume } from "@/lib/resume/pipeline/import-resume";
import { createImportedResume } from "@/lib/resume/storage";

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);

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

    logInfo("legacy parse-cv import completed", {
      requestId,
      route: "/api/parse-cv",
      userId: user.id,
      sourceType: result.meta.source.format,
      status: 200,
    });

    return apiSuccess(requestId, {
      resume: result.resume,
      savedId: saved.id,
      meta: {
        filename: result.meta.source.originalFilename ?? result.meta.title,
        size: file instanceof File ? file.size : 0,
        type: file instanceof File ? file.type : result.meta.source.format,
        extractedChars: result.meta.extractedChars,
        llmEnriched: result.meta.llmEnriched,
        llmConsentProvided: result.meta.llmConsentProvided,
        llmRedactionApplied: result.meta.llmRedactionApplied,
        llmRedactionSummary: result.meta.llmRedactionSummary,
        validationOk: result.meta.validationOk,
        validationIssues: result.meta.validationIssues,
        source: result.meta.source,
        connectorReady: result.meta.connectorReady,
      },
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return apiError(requestId, 401, "UNAUTHORIZED", error.message);
    }

    logError("legacy parse-cv import failed", {
      requestId,
      route: "/api/parse-cv",
      status: 422,
      error,
    });
    const message =
      error instanceof Error ? error.message : "Erro interno ao processar o arquivo.";

    return apiError(requestId, 422, "IMPORT_ERROR", message);
  }
}
