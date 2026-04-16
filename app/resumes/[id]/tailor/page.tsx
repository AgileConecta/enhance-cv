import Link from "next/link";
import { notFound } from "next/navigation";
import { ResumeTailorWorkbench } from "@/app/resumes/_components/resume-tailor-workbench";
import { getAuthenticatedUser } from "@/lib/auth/current-user";
import { getResumeByIdForUser } from "@/lib/resume/storage";
import { JsonResumeSchema } from "@/lib/schemas/json-resume.schema";
import type { JsonResume } from "@/types/json-resume";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ResumeTailorPage({ params }: PageProps) {
  const user = await getAuthenticatedUser();
  const { id } = await params;

  if (!user) {
    return (
      <section className="rounded-[1.8rem] border border-dashed border-stone-900/15 bg-white/60 p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
          Autenticacao necessaria
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-stone-950">
          Entre para adaptar este curriculo por vaga
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone-600">
          O fluxo de adaptacao usa o snapshot mais recente do curriculo para
          gerar score ATS e recomendacoes.
        </p>
      </section>
    );
  }

  const resume = await getResumeByIdForUser(user.id, id);
  if (!resume) {
    notFound();
  }

  const latestVersion = resume.versions[0]?.normalizedData;
  const latestResumeValidation = JsonResumeSchema.safeParse(latestVersion as unknown);
  if (!latestResumeValidation.success) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/resumes/${resume.id}`}
        className="inline-flex items-center rounded-full border border-stone-900/10 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-900/5"
      >
        Voltar para detalhe do curriculo
      </Link>

      <ResumeTailorWorkbench
        resumeId={resume.id}
        resumeTitle={resume.title}
        resume={latestResumeValidation.data as JsonResume}
      />
    </div>
  );
}
