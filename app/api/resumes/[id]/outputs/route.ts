import { NextRequest } from "next/server";
import { OutputKind, type Prisma } from "@/app/generated/prisma";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { AuthenticationError, requireAuthenticatedUser } from "@/lib/auth/current-user";
import { logError, logInfo } from "@/lib/observability/logger";
import { getRequestId } from "@/lib/observability/request-id";
import { renderResumeOutput } from "@/lib/resume/output-render";
import { createOutputRender, getResumeByIdForUser } from "@/lib/resume/storage";
import { JsonResumeSchema } from "@/lib/schemas/json-resume.schema";
import type { JsonResume } from "@/types/json-resume";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const requestId = getRequestId(request);

  try {
    const user = await requireAuthenticatedUser();
    const { id } = await context.params;
    const body = await request.json();
    const kindValue = typeof body.kind === "string" ? body.kind.trim() : "";
    const versionId = typeof body.resumeVersionId === "string" ? body.resumeVersionId.trim() : "";

    if (kindValue !== OutputKind.ATS && kindValue !== OutputKind.VISUAL) {
      return apiError(
        requestId,
        400,
        "VALIDATION_ERROR",
        "kind deve ser ATS ou VISUAL."
      );
    }

    const resume = await getResumeByIdForUser(user.id, id);
    if (!resume) {
      return apiError(requestId, 404, "NOT_FOUND", "Curriculo nao encontrado.");
    }

    const targetVersion =
      (versionId
        ? resume.versions.find((version) => version.id === versionId)
        : null) ?? resume.versions[0];

    if (!targetVersion) {
      return apiError(requestId, 404, "NOT_FOUND", "Versao do curriculo nao encontrada.");
    }

    const validation = JsonResumeSchema.safeParse(targetVersion.normalizedData as unknown);
    if (!validation.success) {
      return apiError(
        requestId,
        400,
        "VALIDATION_ERROR",
        "snapshot atual do curriculo invalido para gerar a saida."
      );
    }

    const rendered = renderResumeOutput({
      kind: kindValue,
      resume: validation.data as JsonResume,
      resumeTitle: resume.title,
      versionNumber: targetVersion.versionNumber,
    });

    const output = await createOutputRender({
      user,
      resumeId: id,
      resumeVersionId: targetVersion.id,
      kind: kindValue,
      content: rendered.content as Prisma.InputJsonValue,
      html: rendered.html,
    });

    logInfo("resume output generated", {
      requestId,
      route: "/api/resumes/[id]/outputs",
      userId: user.id,
      resumeId: id,
      outputKind: kindValue,
      versionNumber: output.resumeVersion?.versionNumber ?? targetVersion.versionNumber,
      status: 200,
    });

    return apiSuccess(requestId, {
      outputId: output.id,
      kind: output.kind,
      resumeId: id,
      resumeVersionId: output.resumeVersionId,
      versionNumber: output.resumeVersion?.versionNumber ?? targetVersion.versionNumber,
      createdAt: output.createdAt,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return apiError(requestId, 401, "UNAUTHORIZED", error.message);
    }

    logError("resume output generation failed", {
      requestId,
      route: "/api/resumes/[id]/outputs",
      status: 500,
      error,
    });
    return apiError(
      requestId,
      500,
      "INTERNAL_ERROR",
      "Erro interno ao gerar a saida do curriculo."
    );
  }
}
