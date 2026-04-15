import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/app/generated/prisma";
import { AuthenticationError, requireAuthenticatedUser } from "@/lib/auth/current-user";
import { createManualResume } from "@/lib/resume/storage";
import { JsonResumeSchema } from "@/lib/schemas/json-resume.schema";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser();
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const summary = typeof body.summary === "string" ? body.summary.trim() : undefined;
    const validation = JsonResumeSchema.safeParse(body.resume);

    if (!title) {
      return NextResponse.json({ error: "title e obrigatorio." }, { status: 400 });
    }

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "resume invalido.",
          issues: validation.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const saved = await createManualResume({
      user,
      title,
      summary,
      normalizedData: validation.data as Prisma.InputJsonValue,
    });

    return NextResponse.json({
      success: true,
      resumeId: saved.id,
      versionId: saved.versions[0]?.id ?? null,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("[resumes]", error);
    return NextResponse.json({ error: "Erro interno ao criar curriculo." }, { status: 500 });
  }
}
