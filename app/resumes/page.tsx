import Link from "next/link";
import { ResumeLibraryOverview } from "@/app/resumes/_components/resume-library-overview";
import { getAuthenticatedUser } from "@/lib/auth/current-user";
import { listResumesForUser } from "@/lib/resume/storage";

const resumeKinds = [
  {
    kind: "Base",
    title: "Curriculo principal",
    description:
      "Sua fonte de verdade, com experiencia completa, formacao e skills amplas.",
  },
  {
    kind: "Template",
    title: "Modelo reutilizavel",
    description:
      "Uma derivacao para uma familia de vagas, como dados, fiscal ou produto.",
  },
  {
    kind: "Job tailored",
    title: "Variante por vaga",
    description:
      "Uma versao vinculada a um job target especifico, com score e sugestoes.",
  },
];

export default async function ResumesPage() {
  const user = await getAuthenticatedUser();
  const resumes = user ? await listResumesForUser(user.id) : [];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-stone-900/10 bg-white/75 p-8 shadow-[0_18px_60px_rgba(58,42,26,0.09)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-700">
              Biblioteca de curriculos
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">
              Estrutura de trabalho para resumes, modelos e variantes
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">
              Esta tela representa a proxima camada do produto: listar identidades
              de curriculo, acompanhar a versao atual e abrir o fluxo de derivacao
              por vaga sem misturar tudo em um unico documento.
            </p>
          </div>

          <Link
            href="/resumes/new"
            className="inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
          >
            Novo curriculo
          </Link>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {resumeKinds.map((item) => (
          <article
            key={item.kind}
            className="rounded-[1.6rem] border border-stone-900/10 bg-stone-50/80 p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
              {item.kind}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-stone-950">
              {item.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              {item.description}
            </p>
          </article>
        ))}
      </section>

      {user ? (
        <ResumeLibraryOverview resumes={resumes} />
      ) : (
        <section className="rounded-[1.75rem] border border-dashed border-stone-900/15 bg-white/60 p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            Autenticacao necessaria
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-stone-950">
            Entre com sua conta para carregar a biblioteca
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone-600">
            A UI ja esta conectada ao backend autenticado. Quando houver sessao,
            esta tela passa a listar curriculos reais e suas versoes.
          </p>
        </section>
      )}

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.75rem] border border-dashed border-stone-900/15 bg-white/55 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            Estado atual
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-stone-950">
            A base de dados e o versionamento ja suportam este modelo
          </h3>
          <p className="mt-3 text-sm leading-7 text-stone-600">
            O proximo passo da UI e transformar essa semantica em uma experiencia
            clara: curriculo como identidade estavel, versao como snapshot
            historico e derivacao como um novo artefato de candidatura.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-stone-900/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(244,238,226,0.95))] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            Primeiros componentes da UI
          </p>
          <div className="mt-4 space-y-3">
            {[
              "Lista de curriculos com kind, status e ultima versao",
              "Acao clara para duplicar como template ou variante por vaga",
              "Entrada para score ATS e job fit por snapshot",
              "Historico cronologico de versoes por curriculo",
            ].map((line) => (
              <div
                key={line}
                className="rounded-[1.2rem] border border-stone-900/8 bg-white/70 px-4 py-3 text-sm text-stone-700"
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
