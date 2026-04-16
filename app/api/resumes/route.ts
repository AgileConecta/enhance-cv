import { NextRequest } from "next/server";
import type { Prisma } from "@/app/generated/prisma";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { AuthenticationError, requireAuthenticatedUser } from "@/lib/auth/current-user";
import { logError, logInfo } from "@/lib/observability/logger";
import { getRequestId } from "@/lib/observability/request-id";
import { createManualResume, listResumesForUser } from "@/lib/resume/storage";
import { JsonResumeSchema } from "@/lib/schemas/json-resume.schema";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    const user = await requireAuthenticatedUser();
    const resumes = await listResumesForUser(user.id);

    logInfo("resume library fetched", {
      requestId,
      route: "/api/resumes",
      userId: user.id,
      status: 200,
    });

    return apiSuccess(requestId, {
      resumes: resumes.map((resume) => ({
        id: resume.id,
        title: resume.title,
        kind: resume.kind,
        status: resume.status,
        summary: resume.summary,
        updatedAt: resume.updatedAt,
        sourceResumeId: resume.sourceResumeId,
        jobTargetId: resume.jobTargetId,
        currentVersion: resume.versions[0]?.versionNumber ?? 1,
        counts: resume._count,
      })),
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return apiError(requestId, 401, "UNAUTHORIZED", error.message);
    }

    logError("resume library fetch failed", {
      requestId,
      route: "/api/resumes",
      status: 500,
      error,
    });
    return apiError(requestId, 500, "INTERNAL_ERROR", "Erro interno ao listar curriculos.");
  }
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    const user = await requireAuthenticatedUser();
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const summary = typeof body.summary === "string" ? body.summary.trim() : undefined;
    const validation = JsonResumeSchema.safeParse(body.resume);

    if (!title) {
      return apiError(requestId, 400, "VALIDATION_ERROR", "title e obrigatorio.");
    }

    if (!validation.success) {
      return apiError(requestId, 400, "VALIDATION_ERROR", "resume invalido.", {
        issues: validation.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const saved = await createManualResume({
      user,
      title,
      summary,
      normalizedData: validation.data as Prisma.InputJsonValue,
    });

    logInfo("manual resume created", {
      requestId,
      route: "/api/resumes",
      userId: user.id,
      status: 200,
    });

    return apiSuccess(requestId, {
      resumeId: saved.id,
      versionId: saved.versions[0]?.id ?? null,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return apiError(requestId, 401, "UNAUTHORIZED", error.message);
    }

    logError("manual resume creation failed", {
      requestId,
      route: "/api/resumes",
      status: 500,
      error,
    });
    return apiError(requestId, 500, "INTERNAL_ERROR", "Erro interno ao criar curriculo.");
  }
}
