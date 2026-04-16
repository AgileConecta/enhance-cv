"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { JsonResume } from "@/types/json-resume";

type AnalysisResponse =
  | {
      success: true;
      requestId: string;
      data: {
        analysis: {
          atsScore: number;
          fitScore: number;
          matchedKeywords: string[];
          missingKeywords: string[];
          strengths: string[];
          gaps: string[];
          recommendations: string[];
        };
        persisted: {
          resumeId: string;
          jobTargetId: string;
          analysisId: string;
          suggestionSetId: string;
        };
      };
    }
  | {
      success: false;
      requestId: string;
      error: {
        code: string;
        message: string;
      };
    };

type VersionResponse =
  | {
      success: true;
      requestId: string;
      data: {
        resumeId: string;
        versionId: string;
        versionNumber: number;
      };
    }
  | {
      success: false;
      requestId: string;
      error: {
        code: string;
        message: string;
      };
    };

export function ResumeTailorWorkbench({
  resumeId,
  resumeTitle,
  resume,
}: {
  resumeId: string;
  resumeTitle: string;
  resume: JsonResume;
}) {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [focusAreas, setFocusAreas] = useState("");
  const [weakPhrases, setWeakPhrases] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [savePending, setSavePending] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState(resume.basics.label ?? "");
  const [draftSummary, setDraftSummary] = useState(resume.basics.summary ?? "");
  const [draftSkills, setDraftSkills] = useState(
    resume.skills?.map((skill) => skill.name).join(", ") ?? ""
  );
  const [versionNotes, setVersionNotes] = useState("");
  const [appliedSkillKeywords, setAppliedSkillKeywords] = useState<string[]>([]);
  const [appliedNotes, setAppliedNotes] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (result?.success) {
      setVersionNotes((current) =>
        current.trim()
          ? current
          : result.data.analysis.recommendations.join("\n")
      );
    }
  }, [result]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResult(null);

    try {
      const response = await fetch(`/api/resumes/${resumeId}/tailor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTarget: {
            title: jobTitle.trim(),
            company: company.trim() || undefined,
            description: description.trim(),
          },
          curation: {
            preferredKeywords: splitCommaList(keywords),
            focusAreas: splitCommaList(focusAreas),
            weakPhrases: splitCommaList(weakPhrases),
          },
        }),
      });

      const payload = (await response.json()) as AnalysisResponse;
      setResult(payload);
    } catch {
      setResult({
        success: false,
        requestId: "client",
        error: {
          code: "NETWORK_ERROR",
          message: "Nao foi possivel analisar a vaga agora.",
        },
      });
    } finally {
      setPending(false);
    }
  }

  async function handleSaveVersion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavePending(true);
    setSaveFeedback(null);
    setSaveError(null);

    const normalizedSkills = draftSkills
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => ({ name: item, keywords: [] }));

    const nextResume: JsonResume = {
      ...resume,
      basics: {
        ...resume.basics,
        label: draftLabel.trim() || undefined,
        summary: draftSummary.trim() || undefined,
      },
      skills: normalizedSkills,
    };

    try {
      const response = await fetch(`/api/resumes/${resumeId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: nextResume,
          notes: versionNotes.trim() || "Versao criada a partir da adaptacao por vaga",
          editorState: {
            source: "tailor-workbench",
            jobTitle: jobTitle.trim(),
            company: company.trim() || undefined,
            analysisId: result?.success ? result.data.persisted.analysisId : undefined,
            jobTargetId: result?.success ? result.data.persisted.jobTargetId : undefined,
            suggestionSetId: result?.success
              ? result.data.persisted.suggestionSetId
              : undefined,
          },
        }),
      });

      const payload = (await response.json()) as VersionResponse;
      if (!payload.success) {
        setSaveError(payload.error.message);
        return;
      }

      setSaveFeedback(`Nova versao salva com sucesso: v${payload.data.versionNumber}.`);
      router.refresh();
    } catch {
      setSaveError("Nao foi possivel salvar a nova versao agora.");
    } finally {
      setSavePending(false);
    }
  }

  function applyKeywordToSkills(keyword: string) {
    setDraftSkills((current) => appendUniqueCommaValue(current, keyword));
    setAppliedSkillKeywords((current) =>
      current.includes(keyword) ? current : [...current, keyword]
    );
  }

  function appendInsightToNotes(insight: string) {
    setVersionNotes((current) => appendLine(current, `- ${insight}`));
    setAppliedNotes((current) => (current.includes(insight) ? current : [...current, insight]));
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-6 shadow-[0_16px_48px_rgba(58,42,26,0.07)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            Adaptacao por vaga
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">
            {resumeTitle}
          </h1>
          <p className="mt-3 text-sm leading-7 text-stone-600">
            Esta etapa usa o snapshot atual do curriculo para calcular score ATS,
            fit e recomendacoes orientadas por vaga.
          </p>

          <div className="mt-6 space-y-4">
            <Field label="Nome da vaga" required>
              <input
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
                className="w-full rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
                placeholder="Ex.: Analista Fiscal Senior"
              />
            </Field>
            <Field label="Empresa">
              <input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                className="w-full rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
                placeholder="Opcional"
              />
            </Field>
            <Field label="Descricao da vaga" required>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-40 w-full rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
                placeholder="Cole aqui o texto da vaga."
              />
            </Field>
            <Field label="Palavras-chave preferidas">
              <input
                value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
                className="w-full rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
                placeholder="Ex.: SPED, ICMS, Power BI"
              />
            </Field>
            <Field label="Focos da curadoria">
              <input
                value={focusAreas}
                onChange={(event) => setFocusAreas(event.target.value)}
                className="w-full rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
                placeholder="Ex.: resultados, compliance, analise"
              />
            </Field>
            <Field label="Termos fracos a evitar">
              <input
                value={weakPhrases}
                onChange={(event) => setWeakPhrases(event.target.value)}
                className="w-full rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
                placeholder='Ex.: "responsavel por", "atuava com"'
              />
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pending || !jobTitle.trim() || !description.trim()}
              className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Analisando..." : "Salvar adaptacao e gerar score"}
            </button>
            <Link
              href={`/resumes/${resumeId}`}
              className="rounded-full border border-stone-900/10 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-900/5"
            >
              Voltar ao curriculo
            </Link>
          </div>
        </form>

        <aside className="rounded-[1.8rem] border border-stone-900/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(243,237,226,0.95))] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            Snapshot usado na analise
          </p>
          <div className="mt-4 space-y-4">
            <div className="rounded-[1.2rem] bg-white/80 px-4 py-3">
              <p className="font-medium text-stone-900">{resume.basics.name}</p>
              {resume.basics.label ? (
                <p className="text-sm text-stone-600">{resume.basics.label}</p>
              ) : null}
            </div>
            <div className="rounded-[1.2rem] bg-white/80 px-4 py-3 text-sm text-stone-600">
              <p className="font-semibold text-stone-900">
                {resume.work?.length ?? 0} experiencias estruturadas
              </p>
              <p className="mt-1">{resume.skills?.length ?? 0} grupos de skills</p>
              <p className="mt-1">{resume.education?.length ?? 0} itens de formacao</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-6 shadow-[0_16px_48px_rgba(58,42,26,0.07)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
          Resultado
        </p>
        {!result ? (
          <p className="mt-4 text-sm leading-7 text-stone-600">
            Preencha a vaga e gere a primeira leitura comparativa para abrir o
            fluxo de score e melhorias individualizadas.
          </p>
        ) : !result.success ? (
          <div className="mt-4 rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {result.error.message}
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Analise persistida com sucesso. Job target {result.data.persisted.jobTargetId}.
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ScoreCard label="ATS score" value={result.data.analysis.atsScore} />
              <ScoreCard label="Fit score" value={result.data.analysis.fitScore} />
            </div>

            <DualList
              leftTitle="Palavras-chave encontradas"
              leftItems={result.data.analysis.matchedKeywords}
              rightTitle="Palavras-chave ausentes"
              rightItems={result.data.analysis.missingKeywords}
            />

            <TripleColumn
              columns={[
                { title: "Forcas", items: result.data.analysis.strengths },
                { title: "Gaps", items: result.data.analysis.gaps },
                { title: "Recomendacoes", items: result.data.analysis.recommendations },
              ]}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <ActionCard
                title="Aplicar palavras-chave ausentes"
                description="Adicione termos ausentes ao draft de skills sem reescrever o curriculo inteiro."
                items={result.data.analysis.missingKeywords}
                emptyMessage="Nenhuma palavra-chave ausente para aplicar."
                actionLabel="Adicionar em skills"
                onAction={applyKeywordToSkills}
                appliedItems={appliedSkillKeywords}
              />
              <ActionCard
                title="Levar recomendacoes para notas"
                description="Monte um checklist de mudancas versionadas antes de salvar a proxima iteracao."
                items={[...result.data.analysis.gaps, ...result.data.analysis.recommendations]}
                emptyMessage="Nenhuma recomendacao granular disponivel."
                actionLabel="Enviar para notas"
                onAction={appendInsightToNotes}
                appliedItems={appliedNotes}
              />
            </div>

            <form
              onSubmit={handleSaveVersion}
              className="rounded-[1.6rem] border border-stone-900/10 bg-stone-50/80 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                Aplicar ajustes e salvar nova versao
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Cargo alvo">
                  <input
                    value={draftLabel}
                    onChange={(event) => setDraftLabel(event.target.value)}
                    className="w-full rounded-2xl border border-stone-900/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
                    placeholder="Atualize o cargo alvo"
                  />
                </Field>
                <Field label="Skills priorizadas">
                  <input
                    value={draftSkills}
                    onChange={(event) => setDraftSkills(event.target.value)}
                    className="w-full rounded-2xl border border-stone-900/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
                    placeholder="SQL, Python, Power BI"
                  />
                </Field>
              </div>

              <div className="mt-4 space-y-4">
                <Field label="Resumo ajustado">
                  <textarea
                    value={draftSummary}
                    onChange={(event) => setDraftSummary(event.target.value)}
                    className="min-h-32 w-full rounded-2xl border border-stone-900/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
                    placeholder="Atualize o resumo com base nas recomendacoes"
                  />
                </Field>
                <Field label="Notas da versao">
                  <textarea
                    value={versionNotes}
                    onChange={(event) => setVersionNotes(event.target.value)}
                    className="min-h-28 w-full rounded-2xl border border-stone-900/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
                    placeholder="Explique o que mudou nesta versao"
                  />
                </Field>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={savePending}
                  className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savePending ? "Salvando..." : "Salvar como nova versao"}
                </button>
              </div>

              {saveFeedback ? (
                <div className="mt-4 rounded-[1.1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {saveFeedback}
                </div>
              ) : null}

              {saveError ? (
                <div className="mt-4 rounded-[1.1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {saveError}
                </div>
              ) : null}
            </form>
          </div>
        )}
      </section>
    </div>
  );
}

function splitCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-stone-700">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.4rem] border border-stone-900/10 bg-stone-50/90 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
        {label}
      </p>
      <p className="mt-3 text-4xl font-semibold text-stone-950">{value}</p>
    </div>
  );
}

function DualList({
  leftTitle,
  leftItems,
  rightTitle,
  rightItems,
}: {
  leftTitle: string;
  leftItems: string[];
  rightTitle: string;
  rightItems: string[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ListCard title={leftTitle} items={leftItems} emptyMessage="Nenhum termo encontrado." />
      <ListCard title={rightTitle} items={rightItems} emptyMessage="Nenhum gap critico encontrado." />
    </div>
  );
}

function TripleColumn({
  columns,
}: {
  columns: { title: string; items: string[] }[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {columns.map((column) => (
        <ListCard
          key={column.title}
          title={column.title}
          items={column.items}
          emptyMessage="Sem itens nesta leitura."
        />
      ))}
    </div>
  );
}

function ListCard({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: string[];
  emptyMessage: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-stone-900/10 bg-stone-50/80 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
        {title}
      </p>
      {items.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm leading-6 text-stone-700">
          {items.map((item) => (
            <li key={item} className="rounded-xl bg-white/75 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-stone-500">{emptyMessage}</p>
      )}
    </div>
  );
}

function ActionCard({
  title,
  description,
  items,
  emptyMessage,
  actionLabel,
  onAction,
  appliedItems,
}: {
  title: string;
  description: string;
  items: string[];
  emptyMessage: string;
  actionLabel: string;
  onAction: (item: string) => void;
  appliedItems: string[];
}) {
  return (
    <div className="rounded-[1.4rem] border border-stone-900/10 bg-stone-50/80 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
      {items.length > 0 ? (
        <div className="mt-4 space-y-3">
          {items.map((item) => {
            const applied = appliedItems.includes(item);

            return (
              <div
                key={`${title}-${item}`}
                className="rounded-[1.1rem] bg-white/85 px-4 py-3"
              >
                <p className="text-sm leading-6 text-stone-700">{item}</p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => onAction(item)}
                    disabled={applied}
                    className="rounded-full border border-stone-900/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-900/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {applied ? "Aplicado" : actionLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-sm text-stone-500">{emptyMessage}</p>
      )}
    </div>
  );
}

function appendUniqueCommaValue(current: string, value: string) {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return current;
  }

  const existing = current
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (existing.some((item) => item.toLowerCase() === normalizedValue.toLowerCase())) {
    return existing.join(", ");
  }

  return [...existing, normalizedValue].join(", ");
}

function appendLine(current: string, value: string) {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return current;
  }

  const lines = current
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  if (lines.includes(normalizedValue)) {
    return lines.join("\n");
  }

  return [...lines, normalizedValue].join("\n");
}
