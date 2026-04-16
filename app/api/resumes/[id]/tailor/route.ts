import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { AuthenticationError, requireAuthenticatedUser } from "@/lib/auth/current-user";
import { analyzeJobTarget } from "@/lib/job-targets/analyze-job-target";
import { logError, logInfo } from "@/lib/observability/logger";
import { getRequestId } from "@/lib/observability/request-id";
import { getResumeByIdForUser, persistTailoringArtifacts } from "@/lib/resume/storage";
import { JsonResumeSchema } from "@/lib/schemas/json-resume.schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const requestId = getRequestId(request);

  try {
    const user = await requireAuthenticatedUser();
    const { id } = await context.params;
    const body = await request.json();

    const title = typeof body.jobTarget?.title === "string" ? body.jobTarget.title.trim() : "";
    const description =
      typeof body.jobTarget?.description === "string"
        ? body.jobTarget.description.trim()
        : "";

    if (!title || !description) {
      return apiError(
        requestId,
        400,
        "VALIDATION_ERROR",
        "jobTarget.title e jobTarget.description sao obrigatorios."
      );
    }

    const resume = await getResumeByIdForUser(user.id, id);
    if (!resume) {
      return apiError(requestId, 404, "NOT_FOUND", "Curriculo nao encontrado.");
    }

    const latestNormalizedData = resume.versions[0]?.normalizedData;
    const resumeValidation = JsonResumeSchema.safeParse(latestNormalizedData as unknown);
    if (!resumeValidation.success) {
      return apiError(
        requestId,
        400,
        "VALIDATION_ERROR",
        "snapshot atual do curriculo invalido para analise."
      );
    }

    const jobTarget = {
      title,
      description,
      company:
        typeof body.jobTarget?.company === "string"
          ? body.jobTarget.company.trim() || undefined
          : undefined,
    };

    const curation =
      body.curation && typeof body.curation === "object" ? body.curation : undefined;

    const analysis = analyzeJobTarget({
      resume: resumeValidation.data,
      jobTarget,
      curation,
    });

    const persisted = await persistTailoringArtifacts({
      user,
      resumeId: resume.id,
      jobTarget,
      analysis,
      curation,
    });

    logInfo("resume tailoring persisted", {
      requestId,
      route: "/api/resumes/[id]/tailor",
      userId: user.id,
      resumeId: resume.id,
      jobTargetId: persisted.jobTarget.id,
      status: 200,
    });

    return apiSuccess(requestId, {
      analysis,
      persisted: {
        resumeId: resume.id,
        jobTargetId: persisted.jobTarget.id,
        analysisId: persisted.analysis.id,
        suggestionSetId: persisted.suggestionSet.id,
      },
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return apiError(requestId, 401, "UNAUTHORIZED", error.message);
    }

    logError("resume tailoring failed", {
      requestId,
      route: "/api/resumes/[id]/tailor",
      status: 500,
      error,
    });
    return apiError(
      requestId,
      500,
      "INTERNAL_ERROR",
      "Erro interno ao persistir a adaptacao por vaga."
    );
  }
}
