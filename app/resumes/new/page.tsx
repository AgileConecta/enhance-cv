import Link from "next/link";
import { NewResumeWorkbench } from "@/app/resumes/_components/new-resume-workbench";
import { getAuthenticatedUser } from "@/lib/auth/current-user";

export default async function NewResumePage() {
  const user = await getAuthenticatedUser();

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-stone-900/10 bg-white/80 p-8 shadow-[0_16px_52px_rgba(54,40,25,0.08)]">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-700">
          Entrada no produto
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950">
          Escolha como o candidato comeca a construir seu curriculo
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600">
          A UI desta fase ja conecta criacao manual e importacao pela mesma base
          de dominio. O proximo passo sera levar essa estrutura para o editor e
          para a adaptacao por vaga.
        </p>
      </section>

      {user ? (
        <NewResumeWorkbench />
      ) : (
        <section className="rounded-[1.75rem] border border-dashed border-stone-900/15 bg-white/60 p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            Autenticacao necessaria
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-stone-950">
            Entre para criar ou importar seus curriculos
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone-600">
            O workbench ja fala com as rotas autenticadas de criacao manual e
            importacao. Sem sessao, mantemos somente a explicacao do fluxo.
          </p>
          <Link
            href="/upload"
            className="mt-6 inline-flex items-center justify-center rounded-full border border-stone-900/10 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-900/5"
          >
            Testar pipeline legado de upload
          </Link>
        </section>
      )}
    </div>
  );
}
