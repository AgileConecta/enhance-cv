import Link from "next/link";

const pillars = [
  {
    title: "Importar de varias origens",
    text: "Suba PDF, DOCX, cole texto ou comece por um link de perfil para estruturar rapidamente seu curriculo.",
  },
  {
    title: "Versionar sem perder o original",
    text: "Mantenha um curriculo base, crie modelos reutilizaveis e gere variantes especificas para cada vaga.",
  },
  {
    title: "Ajustar com criterio",
    text: "Combine score ATS, fit da vaga e curadoria editorial para melhorar o conteudo sem perder controle.",
  },
];

const nextSteps = [
  "Biblioteca de curriculos com base, templates e variantes por vaga",
  "Adaptacao por job target com explicacao de score e gaps",
  "Saidas ATS e visual a partir da mesma estrutura normalizada",
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-stone-900/10 bg-stone-50/80 p-8 shadow-[0_20px_70px_rgba(70,54,37,0.10)] backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.34em] text-emerald-700">
            Fundacao pronta para UI
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[1.04] tracking-tight text-stone-950 sm:text-6xl">
            Crie, importe e adapte curriculos com contexto real de vaga.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-700">
            O ENHANCE_CV esta sendo estruturado como um workspace para candidatos:
            curriculo base, modelos reutilizaveis, variantes por vaga, analise
            ATS e suporte a conectores de origem.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/resumes/new"
              className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
            >
              Comecar um curriculo
            </Link>
            <Link
              href="/upload"
              className="inline-flex items-center justify-center rounded-full border border-stone-900/15 px-6 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-900/5"
            >
              Testar importacao atual
            </Link>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {pillars.map((pillar) => (
              <article
                key={pillar.title}
                className="rounded-[1.5rem] border border-stone-900/10 bg-white/85 p-5"
              >
                <h2 className="text-base font-semibold text-stone-950">
                  {pillar.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">{pillar.text}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-stone-900/10 bg-[linear-gradient(160deg,_rgba(34,52,39,0.98),_rgba(62,84,65,0.92))] p-8 text-stone-100 shadow-[0_20px_70px_rgba(32,42,28,0.18)]">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-emerald-200/80">
            Proxima fase
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            UI estrutural em cima do backend endurecido
          </h2>
          <p className="mt-4 text-sm leading-7 text-stone-200/80">
            O projeto ja tem autenticacao de escrita, pipeline modular, migrations,
            RLS de apoio e consentimento explicito para enrichment com redaction.
            Agora a interface pode nascer sobre contratos mais estaveis.
          </p>

          <div className="mt-8 space-y-3">
            {nextSteps.map((step, index) => (
              <div
                key={step}
                className="flex gap-4 rounded-[1.35rem] border border-white/10 bg-white/5 p-4"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-stone-100/90">{step}</p>
              </div>
            ))}
          </div>

          <Link
            href="/resumes"
            className="mt-8 inline-flex items-center rounded-full bg-stone-100 px-5 py-3 text-sm font-semibold text-stone-900 transition hover:bg-white"
          >
            Ver estrutura da biblioteca
          </Link>
        </aside>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Link
          href="/resumes"
          className="rounded-[1.75rem] border border-stone-900/10 bg-white/75 p-6 transition hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(54,42,28,0.10)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            Biblioteca
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-stone-950">
            Veja a organizacao dos curriculos
          </h3>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Estrutura pensada para curriculo base, templates e variantes por vaga.
          </p>
        </Link>

        <Link
          href="/resumes/new"
          className="rounded-[1.75rem] border border-stone-900/10 bg-white/75 p-6 transition hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(54,42,28,0.10)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            Criacao
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-stone-950">
            Escolha como o usuario entra no fluxo
          </h3>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Do zero, por arquivo, por texto colado ou por link de perfil.
          </p>
        </Link>

        <Link
          href="/upload"
          className="rounded-[1.75rem] border border-stone-900/10 bg-white/75 p-6 transition hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(54,42,28,0.10)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            Pipeline atual
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-stone-950">
            Teste a importacao ja implementada
          </h3>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Fluxo legado de upload continua util para validar parser, consentimento e enrichment.
          </p>
        </Link>
      </section>
    </div>
  );
}
