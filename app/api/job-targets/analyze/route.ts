import { NextRequest, NextResponse } from "next/server";
import { analyzeJobTarget } from "@/lib/job-targets/analyze-job-target";
import { JsonResumeSchema } from "@/lib/schemas/json-resume.schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = JsonResumeSchema.safeParse(body.resume);
    const title = typeof body.jobTarget?.title === "string" ? body.jobTarget.title.trim() : "";
    const description =
      typeof body.jobTarget?.description === "string"
        ? body.jobTarget.description.trim()
        : "";

    if (!validation.success) {
      return NextResponse.json({ error: "resume inválido." }, { status: 400 });
    }

    if (!title || !description) {
      return NextResponse.json(
        { error: "jobTarget.title e jobTarget.description são obrigatórios." },
        { status: 400 }
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

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("[job-targets/analyze]", error);
    return NextResponse.json(
      { error: "Erro interno ao analisar a vaga." },
      { status: 500 }
    );
  }
}
