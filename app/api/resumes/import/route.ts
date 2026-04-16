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

    logInfo("resume imported", {
      requestId,
      route: "/api/resumes/import",
      userId: user.id,
      sourceType: result.meta.source.format,
      status: 200,
    });

    return apiSuccess(requestId, {
      resume: result.resume,
      savedId: saved.id,
      meta: result.meta,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return apiError(requestId, 401, "UNAUTHORIZED", error.message);
    }

    logError("resume import failed", {
      requestId,
      route: "/api/resumes/import",
      status: 422,
      error,
    });
    const message =
      error instanceof Error ? error.message : "Erro interno ao importar curriculo.";

    return apiError(requestId, 422, "IMPORT_ERROR", message);
  }
}
