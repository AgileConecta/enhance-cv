import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { analyzeJobTarget } from "@/lib/job-targets/analyze-job-target";
import { logError, logInfo } from "@/lib/observability/logger";
import { getRequestId } from "@/lib/observability/request-id";
import { JsonResumeSchema } from "@/lib/schemas/json-resume.schema";

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const validation = JsonResumeSchema.safeParse(body.resume);
    const title = typeof body.jobTarget?.title === "string" ? body.jobTarget.title.trim() : "";
    const description =
      typeof body.jobTarget?.description === "string"
        ? body.jobTarget.description.trim()
        : "";

    if (!validation.success) {
      return apiError(requestId, 400, "VALIDATION_ERROR", "resume invalido.");
    }

    if (!title || !description) {
      return apiError(
        requestId,
        400,
        "VALIDATION_ERROR",
        "jobTarget.title e jobTarget.description sao obrigatorios."
      );
    }

    const analysis = analyzeJobTarget({
      resume: validation.data,
      jobTarget: {
        title,
        description,
        company:
          typeof body.jobTarget?.company === "string"
            ? body.jobTarget.company.trim()
            : undefined,
      },
      curation:
        body.curation && typeof body.curation === "object" ? body.curation : undefined,
    });

    logInfo("job target analyzed", {
      requestId,
      route: "/api/job-targets/analyze",
      status: 200,
    });

    return apiSuccess(requestId, { analysis });
  } catch (error) {
    logError("job target analysis failed", {
      requestId,
      route: "/api/job-targets/analyze",
      status: 500,
      error,
    });
    return apiError(requestId, 500, "INTERNAL_ERROR", "Erro interno ao analisar a vaga.");
  }
}
