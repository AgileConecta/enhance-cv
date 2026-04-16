import Link from "next/link";
import type { ResumeKind, ResumeStatus } from "@/app/generated/prisma";

type ResumeRow = {
  id: string;
  title: string;
  kind: ResumeKind;
  status: ResumeStatus;
  summary: string | null;
  updatedAt: Date;
  sourceResumeId: string | null;
  jobTargetId: string | null;
  versions: { versionNumber: number }[];
  _count: {
    versions: number;
    analyses: number;
    suggestionSets: number;
  };
};

const kindLabel: Record<ResumeKind, string> = {
  BASE: "Base",
  TEMPLATE: "Template",
  JOB_TAILORED: "Variante por vaga",
};

const statusLabel: Record<ResumeStatus, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativo",
  ARCHIVED: "Arquivado",
};

export function ResumeLibraryOverview({ resumes }: { resumes: ResumeRow[] }) {
  if (resumes.length === 0) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-stone-900/15 bg-white/60 p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
          Biblioteca vazia
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-stone-950">
          Seu primeiro curriculo comeca aqui
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone-600">
          Crie um curriculo base manualmente ou importe um arquivo, texto colado
          ou link de perfil para iniciar a biblioteca.
        </p>
        <Link
          href="/resumes/new"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
        >
          Novo curriculo
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {resumes.map((resume) => (
        <article
          key={resume.id}
          className="rounded-[1.6rem] border border-stone-900/10 bg-white/80 p-6 shadow-[0_14px_42px_rgba(58,42,26,0.07)]"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                <span>{kindLabel[resume.kind]}</span>
                <span className="rounded-full border border-stone-900/10 px-3 py-1 tracking-[0.18em] text-stone-600">
                  {statusLabel[resume.status]}
                </span>
                <span>v{resume.versions[0]?.versionNumber ?? 1}</span>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-stone-950">{resume.title}</h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                  {resume.summary ||
                    "Sem resumo salvo ainda. Use a proxima iteracao para enriquecer este curriculo."}
                </p>
              </div>
            </div>

            <div className="rounded-[1.2rem] border border-stone-900/10 bg-stone-50/80 px-4 py-3 text-sm text-stone-600">
              Atualizado em{" "}
              {new Intl.DateTimeFormat("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }).format(new Date(resume.updatedAt))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.15rem] bg-stone-50/80 px-4 py-3 text-sm text-stone-700">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                Versoes
              </span>
              <p className="mt-2 text-2xl font-semibold text-stone-950">
                {resume._count.versions}
              </p>
            </div>
            <div className="rounded-[1.15rem] bg-stone-50/80 px-4 py-3 text-sm text-stone-700">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                Analises
              </span>
              <p className="mt-2 text-2xl font-semibold text-stone-950">
                {resume._count.analyses}
              </p>
            </div>
            <div className="rounded-[1.15rem] bg-stone-50/80 px-4 py-3 text-sm text-stone-700">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                Sugestoes
              </span>
              <p className="mt-2 text-2xl font-semibold text-stone-950">
                {resume._count.suggestionSets}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-stone-500">
            {resume.sourceResumeId ? (
              <span>Derivado de outro curriculo</span>
            ) : (
              <span>Curriculo de origem</span>
            )}
            {resume.jobTargetId ? (
              <span>Vinculado a job target</span>
            ) : (
              <span>Sem vaga vinculada</span>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/resumes/${resume.id}`}
              className="inline-flex items-center justify-center rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
            >
              Abrir curriculo
            </Link>
            <Link
              href={`/resumes/${resume.id}/tailor`}
              className="inline-flex items-center justify-center rounded-full border border-stone-900/10 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-900/5"
            >
              Adaptar por vaga
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}
