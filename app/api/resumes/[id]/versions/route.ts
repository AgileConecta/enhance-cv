import { NextRequest } from "next/server";
import { type Prisma } from "@/app/generated/prisma";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { AuthenticationError, requireAuthenticatedUser } from "@/lib/auth/current-user";
import { logError, logInfo } from "@/lib/observability/logger";
import { getRequestId } from "@/lib/observability/request-id";
import { createResumeVersion, getResumeByIdForUser } from "@/lib/resume/storage";
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
    const notes = typeof body.notes === "string" ? body.notes.trim() : undefined;

    const existingResume = await getResumeByIdForUser(user.id, id);
    if (!existingResume) {
      return apiError(requestId, 404, "NOT_FOUND", "Curriculo nao encontrado.");
    }

    const validation = JsonResumeSchema.safeParse(body.resume);
    if (!validation.success) {
      return apiError(requestId, 400, "VALIDATION_ERROR", "resume invalido.", {
        issues: validation.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const version = await createResumeVersion({
      user,
      resumeId: id,
      normalizedData: validation.data as Prisma.InputJsonValue,
      notes,
      editorState:
        body.editorState && typeof body.editorState === "object"
          ? (body.editorState as Prisma.InputJsonValue)
          : undefined,
    });

    logInfo("resume version created", {
      requestId,
      route: "/api/resumes/[id]/versions",
      userId: user.id,
      resumeId: id,
      versionNumber: version.versionNumber,
      status: 200,
    });

    return apiSuccess(requestId, {
      resumeId: id,
      versionId: version.id,
      versionNumber: version.versionNumber,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return apiError(requestId, 401, "UNAUTHORIZED", error.message);
    }

    logError("resume version creation failed", {
      requestId,
      route: "/api/resumes/[id]/versions",
      status: 500,
      error,
    });
    return apiError(
      requestId,
      500,
      "INTERNAL_ERROR",
      "Erro interno ao criar nova versao do curriculo."
    );
  }
}
