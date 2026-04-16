import { NextRequest } from "next/server";
import { ResumeKind } from "@/app/generated/prisma";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { AuthenticationError, requireAuthenticatedUser } from "@/lib/auth/current-user";
import { logError, logInfo } from "@/lib/observability/logger";
import { getRequestId } from "@/lib/observability/request-id";
import {
  createDerivedResumeVariant,
  getResumeByIdForUser,
} from "@/lib/resume/storage";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const requestId = getRequestId(request);

  try {
    const user = await requireAuthenticatedUser();
    const { id } = await context.params;
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const summary = typeof body.summary === "string" ? body.summary.trim() : undefined;
    const kindValue = typeof body.kind === "string" ? body.kind.trim() : "";
    const notes = typeof body.notes === "string" ? body.notes.trim() : undefined;

    if (!title) {
      return apiError(requestId, 400, "VALIDATION_ERROR", "title e obrigatorio.");
    }

    if (kindValue !== ResumeKind.TEMPLATE && kindValue !== ResumeKind.JOB_TAILORED) {
      return apiError(
        requestId,
        400,
        "VALIDATION_ERROR",
        "kind deve ser TEMPLATE ou JOB_TAILORED."
      );
    }

    const sourceResume = await getResumeByIdForUser(user.id, id);
    if (!sourceResume) {
      return apiError(requestId, 404, "NOT_FOUND", "Curriculo nao encontrado.");
    }

    const created = await createDerivedResumeVariant({
      user,
      sourceResumeId: id,
      title,
      kind: kindValue,
      summary,
      notes,
    });

    logInfo("resume variant created", {
      requestId,
      route: "/api/resumes/[id]/variants",
      userId: user.id,
      resumeId: id,
      status: 200,
      variantKind: kindValue,
    });

    return apiSuccess(requestId, {
      resumeId: created.id,
      sourceResumeId: id,
      kind: created.kind,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return apiError(requestId, 401, "UNAUTHORIZED", error.message);
    }

    logError("resume variant creation failed", {
      requestId,
      route: "/api/resumes/[id]/variants",
      status: 500,
      error,
    });
    return apiError(
      requestId,
      500,
      "INTERNAL_ERROR",
      "Erro interno ao derivar curriculo."
    );
  }
}
