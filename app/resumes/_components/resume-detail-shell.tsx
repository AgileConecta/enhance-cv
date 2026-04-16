"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  OutputKind,
  OutputRender,
  Prisma,
  ResumeAnalysis,
  ResumeKind,
  ResumeSource,
  ResumeStatus,
  ResumeVersion,
  SuggestionSet,
} from "@/app/generated/prisma";
import {
  buildGranularReviewAudit,
  hasGranularReviewAudit,
} from "@/lib/resume/granular-review";
import type { ResumeVersionComparison } from "@/lib/resume/version-comparison";
import type { JsonResume } from "@/types/json-resume";

type DerivedResume = {
  id: string;
  title: string;
  kind: ResumeKind;
  status: ResumeStatus;
  updatedAt: Date;
  versions: { versionNumber: number }[];
};

type ResumeDetail = {
  id: string;
  title: string;
  kind: ResumeKind;
  status: ResumeStatus;
  summary: string | null;
  sourceResumeId: string | null;
  jobTargetId: string | null;
  updatedAt: Date;
  versions: ResumeVersion[];
  sources: ResumeSource[];
  analyses: (ResumeAnalysis & {
    jobTarget?: {
      id: string;
      title: string;
      company: string | null;
    } | null;
  })[];
  suggestionSets: (SuggestionSet & {
    jobTarget?: {
      id: string;
      title: string;
      company: string | null;
    } | null;
  })[];
  outputRenders: (OutputRender & {
    resumeVersion?: {
      id: string;
      versionNumber: number;
    } | null;
  })[];
  derivedResumes: DerivedResume[];
  _count: {
    versions: number;
    analyses: number;
    suggestionSets: number;
    derivedResumes: number;
  };
};

type VersionProvenance = {
  source: string | null;
  jobTitle: string | null;
  company: string | null;
  analysisId: string | null;
  jobTargetId: string | null;
  suggestionSetId: string | null;
  reviewVersionId: string | null;
};

type VariantResponse =
  | {
      success: true;
      requestId: string;
      data: {
        resumeId: string;
        sourceResumeId: string;
        kind: ResumeKind;
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

type OutputResponse =
  | {
      success: true;
      requestId: string;
      data: {
        outputId: string;
        kind: OutputKind;
        resumeId: string;
        resumeVersionId: string | null;
        versionNumber: number;
        createdAt: string;
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

export function ResumeDetailShell({
  resume,
  latestResume,
  comparison,
  auditComparisons,
}: {
  resume: ResumeDetail;
  latestResume: JsonResume;
  comparison: ResumeVersionComparison | null;
  auditComparisons: Record<string, ResumeVersionComparison>;
}) {
  const router = useRouter();
  const [templateTitle, setTemplateTitle] = useState(`${resume.title} - Template`);
  const [variantTitle, setVariantTitle] = useState(`${resume.title} - Variante`);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingKind, setPendingKind] = useState<ResumeKind | null>(null);
  const [pendingOutputKind, setPendingOutputKind] = useState<OutputKind | null>(null);
  const versionLinks = new Map(
    resume.versions.map((version) => [version.id, getVersionProvenance(version.editorState)])
  );
  const latestPublishedOutputs = {
    ATS:
      resume.outputRenders.find((item) => item.kind === "ATS" && (item.html || item.content)) ??
      null,
    VISUAL:
      resume.outputRenders.find(
        (item) => item.kind === "VISUAL" && (item.html || item.content)
      ) ?? null,
  } as const;

  async function createVariant(kind: ResumeKind) {
    const title = kind === "TEMPLATE" ? templateTitle.trim() : variantTitle.trim();
    if (!title) {
      setError("Defina um titulo antes de derivar o curriculo.");
      return;
    }

    setPendingKind(kind);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`/api/resumes/${resume.id}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          kind,
          summary: resume.summary ?? undefined,
          notes:
            kind === "TEMPLATE"
              ? "Derivado pela UI como template reutilizavel"
              : "Derivado pela UI como variante inicial por vaga",
        }),
      });

      const payload = (await response.json()) as VariantResponse;
      if (!payload.success) {
        setError(payload.error.message);
        return;
      }

      setFeedback(
        kind === "TEMPLATE"
          ? "Template criado com sucesso."
          : "Variante por vaga criada com sucesso."
      );
      router.push(
        kind === "TEMPLATE"
          ? `/resumes/${payload.data.resumeId}`
          : `/resumes/${payload.data.resumeId}/tailor`
      );
      router.refresh();
    } catch {
      setError("Nao foi possivel derivar o curriculo agora.");
    } finally {
      setPendingKind(null);
    }
  }

  async function generateOutput(kind: OutputKind) {
    setPendingOutputKind(kind);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`/api/resumes/${resume.id}/outputs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          resumeVersionId: resume.versions[0]?.id,
        }),
      });

      const payload = (await response.json()) as OutputResponse;
      if (!payload.success) {
        setError(payload.error.message);
        return;
      }

      setFeedback(
        kind === "ATS"
          ? `Saida ATS gerada com sucesso na versao v${payload.data.versionNumber}.`
          : `Saida visual gerada com sucesso na versao v${payload.data.versionNumber}.`
      );
      router.refresh();
    } catch {
      setError("Nao foi possivel gerar a saida do curriculo agora.");
    } finally {
      setPendingOutputKind(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-6 shadow-[0_16px_48px_rgba(58,42,26,0.07)]">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
            <span>{kindLabel[resume.kind]}</span>
            <span className="rounded-full border border-stone-900/10 px-3 py-1 text-stone-600">
              {statusLabel[resume.status]}
            </span>
            <span>v{resume.versions[0]?.versionNumber ?? 1}</span>
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950">
            {resume.title}
          </h1>
          <p className="mt-4 text-sm leading-7 text-stone-600">
            {resume.summary ||
              "Este curriculo ainda nao possui resumo consolidado. Use o fluxo de adaptacao para enriquecer a narrativa por vaga."}
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <MetricCard label="Versoes" value={String(resume._count.versions)} />
            <MetricCard label="Analises" value={String(resume._count.analyses)} />
            <MetricCard label="Sugestoes" value={String(resume._count.suggestionSets)} />
            <MetricCard label="Derivacoes" value={String(resume._count.derivedResumes)} />
          </div>
        </article>

        <aside className="rounded-[1.8rem] border border-stone-900/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(243,237,226,0.95))] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            Proximas acoes
          </p>
          <div className="mt-5 space-y-5">
            <div className="space-y-3 rounded-[1.4rem] border border-stone-900/10 bg-white/80 p-4">
              <label className="block text-sm font-medium text-stone-700">
                Duplicar como template
              </label>
              <input
                value={templateTitle}
                onChange={(event) => setTemplateTitle(event.target.value)}
                className="w-full rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
              />
              <button
                type="button"
                onClick={() => createVariant("TEMPLATE")}
                disabled={pendingKind !== null}
                className="w-full rounded-full bg-stone-900 px-4 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800 disabled:opacity-50"
              >
                {pendingKind === "TEMPLATE" ? "Criando..." : "Criar template"}
              </button>
            </div>

            <div className="space-y-3 rounded-[1.4rem] border border-stone-900/10 bg-white/80 p-4">
              <label className="block text-sm font-medium text-stone-700">
                Duplicar como variante por vaga
              </label>
              <input
                value={variantTitle}
                onChange={(event) => setVariantTitle(event.target.value)}
                className="w-full rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
              />
              <button
                type="button"
                onClick={() => createVariant("JOB_TAILORED")}
                disabled={pendingKind !== null}
                className="w-full rounded-full bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
              >
                {pendingKind === "JOB_TAILORED"
                  ? "Criando..."
                  : "Criar variante e abrir adaptacao"}
              </button>
            </div>

            <Link
              href={`/resumes/${resume.id}/tailor`}
              className="inline-flex w-full items-center justify-center rounded-full border border-stone-900/10 px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-900/5"
            >
              Adaptar este curriculo para uma vaga
            </Link>

            {feedback ? (
              <div className="rounded-[1.1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {feedback}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-[1.1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </div>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
              Publicacao e saidas
            </p>
            <Link
              href={`/resumes/${resume.id}/outputs`}
              className="inline-flex items-center rounded-full border border-stone-900/10 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-900/5"
            >
              Abrir central de saidas
            </Link>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <OutputCard
              title="ATS"
              tone="ats"
              output={latestPublishedOutputs.ATS}
              onGenerate={() => generateOutput("ATS")}
              pending={pendingOutputKind === "ATS"}
            />
            <OutputCard
              title="Visual"
              tone="visual"
              output={latestPublishedOutputs.VISUAL}
              onGenerate={() => generateOutput("VISUAL")}
              pending={pendingOutputKind === "VISUAL"}
            />
          </div>
        </article>

        <article className="rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            Snapshot atual
          </p>
          <div className="mt-4 space-y-5">
            <SummaryBlock title="Dados principais">
              <p className="font-medium text-stone-900">
                {latestResume.basics.name || "Sem nome preenchido"}
              </p>
              {latestResume.basics.label ? (
                <p className="text-sm text-stone-600">{latestResume.basics.label}</p>
              ) : null}
              {latestResume.basics.summary ? (
                <p className="text-sm leading-6 text-stone-600">
                  {latestResume.basics.summary}
                </p>
              ) : null}
            </SummaryBlock>

            <SummaryBlock title={`Experiencias (${latestResume.work?.length ?? 0})`}>
              {(latestResume.work?.length ?? 0) > 0 ? (
                latestResume.work!.slice(0, 4).map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    className="rounded-2xl bg-stone-50/90 px-4 py-3"
                  >
                    <p className="font-medium text-stone-900">{item.name}</p>
                    {item.position ? (
                      <p className="text-sm text-stone-600">{item.position}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-stone-500">Nenhuma experiencia estruturada ainda.</p>
              )}
            </SummaryBlock>

            <SummaryBlock title={`Skills (${latestResume.skills?.length ?? 0})`}>
              {(latestResume.skills?.length ?? 0) > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {latestResume.skills!.slice(0, 12).map((item, index) => (
                    <span
                      key={`${item.name}-${index}`}
                      className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-700"
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500">Nenhuma skill estruturada ainda.</p>
              )}
            </SummaryBlock>
          </div>
        </article>

        <article className="rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            Comparativo entre versoes
          </p>

          {comparison ? (
            <div className="mt-4 space-y-5">
              <div className="rounded-[1.3rem] border border-stone-900/10 bg-stone-50/85 px-4 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold text-stone-950">
                    v{comparison.currentVersionNumber} versus v
                    {comparison.previousVersionNumber}
                  </h2>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    {comparison.changedSections.length} secoes alteradas
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {comparison.changedSections.length > 0 ? (
                    comparison.changedSections.map((section) => (
                      <span
                        key={section}
                        className="rounded-full bg-white px-3 py-1 text-sm text-stone-700"
                      >
                        {section}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-stone-500">
                      Nenhuma alteracao estrutural relevante foi detectada.
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <ComparisonCard
                  title="Cargo alvo"
                  changed={comparison.label.changed}
                  previousValue={comparison.label.previous}
                  currentValue={comparison.label.current}
                  emptyLabel="Sem cargo definido"
                />
                <ComparisonCard
                  title="Resumo"
                  changed={comparison.summary.changed}
                  previousValue={comparison.summary.previous}
                  currentValue={comparison.summary.current}
                  emptyLabel="Sem resumo definido"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <CollectionComparisonCard
                  title="Skills"
                  previousCount={comparison.skills.previousCount}
                  currentCount={comparison.skills.currentCount}
                  added={comparison.skills.added}
                  removed={comparison.skills.removed}
                  emptyLabel="Nenhuma mudanca relevante nas skills."
                />
                <CollectionComparisonCard
                  title="Experiencias"
                  previousCount={comparison.work.previousCount}
                  currentCount={comparison.work.currentCount}
                  added={comparison.work.added}
                  removed={comparison.work.removed}
                  emptyLabel="Nenhuma mudanca relevante nas experiencias."
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <CollectionComparisonCard
                  title="Formacao"
                  previousCount={comparison.education.previousCount}
                  currentCount={comparison.education.currentCount}
                  added={comparison.education.added}
                  removed={comparison.education.removed}
                  emptyLabel="Nenhuma mudanca relevante na formacao."
                />
                <CollectionComparisonCard
                  title="Projetos"
                  previousCount={comparison.projects.previousCount}
                  currentCount={comparison.projects.currentCount}
                  added={comparison.projects.added}
                  removed={comparison.projects.removed}
                  emptyLabel="Nenhuma mudanca relevante nos projetos."
                />
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-[1.3rem] border border-dashed border-stone-900/15 bg-stone-50/65 px-4 py-6 text-sm text-stone-500">
              Assim que este curriculo tiver pelo menos duas versoes validas,
              mostramos aqui o que mudou de uma para outra.
            </div>
          )}
        </article>
      </section>

      <section className="rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
          Historico e derivacoes
        </p>

        <div className="mt-4 grid gap-5 xl:grid-cols-3">
          <div>
            <h2 className="text-lg font-semibold text-stone-950">Versoes recentes</h2>
            <div className="mt-3 space-y-3">
              {resume.versions.map((version) => (
                <div
                  key={version.id}
                  id={`version-${version.id}`}
                  className="rounded-[1.2rem] border border-stone-900/10 bg-stone-50/80 px-4 py-3"
                >
                  {(() => {
                    const provenance = versionLinks.get(version.id) ?? emptyVersionProvenance();
                    const linkedAnalysis = findLinkedAnalysis({
                      analysisId: provenance.analysisId,
                      jobTargetId: provenance.jobTargetId,
                      analyses: resume.analyses,
                    });
                    const linkedSuggestionSet = findLinkedSuggestionSet({
                      suggestionSetId: provenance.suggestionSetId,
                      jobTargetId: provenance.jobTargetId,
                      suggestionSets: resume.suggestionSets,
                    });
                    const auditComparison = auditComparisons[version.id] ?? null;
                    const granularAudit =
                      provenance.source === "version-review"
                        ? buildGranularReviewAudit({
                            editorState: version.editorState,
                            comparison:
                              provenance.reviewVersionId !== null
                                ? auditComparisons[provenance.reviewVersionId] ?? null
                                : null,
                          })
                        : null;
                    const reviewOutputs = findReviewOutputs({
                      reviewVersionId: version.id,
                      versions: resume.versions,
                    });

                    return (
                      <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-stone-900">
                      v{version.versionNumber}
                    </span>
                    <span className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      {new Intl.DateTimeFormat("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      }).format(new Date(version.createdAt))}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-stone-600">
                    {version.notes || "Sem notas para esta versao."}
                  </p>
                  <Link
                    href={`/resumes/${resume.id}/versions/${version.id}`}
                    className="mt-3 inline-flex rounded-full border border-stone-900/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-900/5"
                  >
                    Abrir modo diff
                  </Link>
                  {provenance.reviewVersionId ? (
                    <Link
                      href={`/resumes/${resume.id}/versions/${provenance.reviewVersionId}`}
                      className="mt-2 inline-flex rounded-full border border-stone-900/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-900/5"
                    >
                      Abrir revisao base
                    </Link>
                  ) : null}
                  {versionLinks.get(version.id)?.jobTargetId ? (
                    <div className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-sm text-stone-600">
                      <p className="font-medium text-stone-900">
                        Esta versao nasceu de uma adaptacao por vaga
                      </p>
                      <p className="mt-1">
                        {provenance.jobTitle || "Vaga vinculada"}
                        {provenance.company
                          ? ` | ${provenance.company}`
                          : ""}
                      </p>
                    </div>
                  ) : null}
                  {linkedAnalysis ? (
                    <div className="mt-3 rounded-xl border border-stone-900/10 bg-white/85 px-3 py-3 text-sm text-stone-600">
                      <p className="font-medium text-stone-900">
                        Analise de origem
                      </p>
                      <p className="mt-1">
                        ATS {Math.round(linkedAnalysis.atsScore ?? 0)} | Fit{" "}
                        {Math.round(linkedAnalysis.fitScore ?? 0)}
                      </p>
                      <p className="mt-1 text-stone-500">
                        {linkedAnalysis.jobTarget?.title || provenance.jobTitle || "Vaga salva"}
                        {linkedAnalysis.jobTarget?.company
                          ? ` | ${linkedAnalysis.jobTarget.company}`
                          : provenance.company
                            ? ` | ${provenance.company}`
                            : ""}
                      </p>
                    </div>
                  ) : null}
                  {linkedSuggestionSet ? (
                    <div className="mt-3 rounded-xl border border-stone-900/10 bg-white/85 px-3 py-3 text-sm text-stone-600">
                      <p className="font-medium text-stone-900">
                        Sugestoes que originaram esta versao
                      </p>
                      <ul className="mt-2 space-y-2">
                        {extractSuggestionTexts(linkedSuggestionSet.items)
                          .slice(0, 3)
                          .map((item) => (
                            <li
                              key={`${linkedSuggestionSet.id}-${item}`}
                              className="rounded-lg bg-stone-50 px-3 py-2"
                            >
                              {item}
                            </li>
                          ))}
                      </ul>
                    </div>
                  ) : null}
                  {granularAudit && hasGranularReviewAudit(granularAudit) ? (
                    <div className="mt-3 rounded-xl border border-stone-900/10 bg-white/85 px-3 py-3 text-sm text-stone-600">
                      <p className="font-medium text-stone-900">
                        Revisao granular aplicada
                      </p>
                      <div className="mt-3 grid gap-2">
                        {renderGranularAuditLine("Resumo aprovado", granularAudit.summarySegments)}
                        {renderGranularAuditLine(
                          "Skills aprovadas",
                          granularAudit.skills.approvedAdds
                        )}
                        {renderGranularAuditLine(
                          "Skills rejeitadas",
                          granularAudit.skills.rejectedAdds
                        )}
                        {renderGranularAuditLine(
                          "Remocoes de skills aprovadas",
                          granularAudit.skills.approvedRemovals
                        )}
                        {renderGranularAuditLine(
                          "Experiencias aprovadas",
                          granularAudit.work.approvedAdds
                        )}
                        {renderGranularAuditLine(
                          "Experiencias rejeitadas",
                          granularAudit.work.rejectedAdds
                        )}
                        {renderGranularAuditLine(
                          "Formacoes aprovadas",
                          granularAudit.education.approvedAdds
                        )}
                        {renderGranularAuditLine(
                          "Formacoes rejeitadas",
                          granularAudit.education.rejectedAdds
                        )}
                        {renderGranularAuditLine(
                          "Projetos aprovados",
                          granularAudit.projects.approvedAdds
                        )}
                        {renderGranularAuditLine(
                          "Projetos rejeitados",
                          granularAudit.projects.rejectedAdds
                        )}
                      </div>
                    </div>
                  ) : null}
                  {reviewOutputs.length > 0 ? (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-3 text-sm text-amber-900">
                      <p className="font-medium">
                        Esta revisao base ja gerou {reviewOutputs.length}{" "}
                        {reviewOutputs.length === 1 ? "versao derivada" : "versoes derivadas"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {reviewOutputs.map((outputVersion) => (
                          <Link
                            key={`${version.id}-output-${outputVersion.id}`}
                            href={`/resumes/${resume.id}/versions/${outputVersion.id}`}
                            className="rounded-full border border-amber-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-900 transition hover:bg-amber-100/70"
                          >
                            Abrir v{outputVersion.versionNumber}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {auditComparison ? (
                    <div className="mt-3 rounded-xl border border-stone-900/10 bg-white/85 px-3 py-3 text-sm text-stone-600">
                      <p className="font-medium text-stone-900">
                        Mudancas efetivas nesta versao
                      </p>
                      <p className="mt-1 text-stone-500">
                        v{auditComparison.currentVersionNumber} versus v
                        {auditComparison.previousVersionNumber}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {auditComparison.changedSections.length > 0 ? (
                          auditComparison.changedSections.map((section) => (
                            <span
                              key={`${version.id}-${section}`}
                              className="rounded-full bg-stone-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700"
                            >
                              {section}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-stone-500">
                            Nenhuma mudanca estrutural relevante detectada.
                          </span>
                        )}
                      </div>
                      <div className="mt-3 grid gap-2">
                        {renderAuditLine(
                          "Cargo alvo",
                          auditComparison.label.changed,
                          auditComparison.label.current
                        )}
                        {renderAuditLine(
                          "Resumo",
                          auditComparison.summary.changed,
                          auditComparison.summary.current
                        )}
                        {renderCollectionAuditLine("Skills adicionadas", auditComparison.skills.added)}
                        {renderCollectionAuditLine(
                          "Skills removidas",
                          auditComparison.skills.removed
                        )}
                        {renderCollectionAuditLine(
                          "Experiencias adicionadas",
                          auditComparison.work.added
                        )}
                        {renderCollectionAuditLine(
                          "Projetos adicionados",
                          auditComparison.projects.added
                        )}
                      </div>
                    </div>
                  ) : null}
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-stone-950">Analises recentes</h2>
            <div className="mt-3 space-y-3">
              {resume.analyses.length > 0 ? (
                resume.analyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="rounded-[1.2rem] border border-stone-900/10 bg-stone-50/80 px-4 py-3"
                  >
                    {(() => {
                      const linkedVersionId = findLinkedVersionId({
                        analysisId: analysis.id,
                        jobTargetId: analysis.jobTargetId,
                        versions: resume.versions,
                      });

                      return (
                        <>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-stone-900">
                        {analysis.jobTarget?.title || "Vaga salva"}
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] text-stone-500">
                        {new Intl.DateTimeFormat("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        }).format(new Date(analysis.createdAt))}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-stone-600">
                      ATS {Math.round(analysis.atsScore ?? 0)} | Fit{" "}
                      {Math.round(analysis.fitScore ?? 0)}
                    </p>
                    {analysis.jobTarget?.company ? (
                      <p className="mt-1 text-sm text-stone-500">{analysis.jobTarget.company}</p>
                    ) : null}
                    {linkedVersionId ? (
                      <a
                        href={`#version-${linkedVersionId}`}
                        className="mt-3 inline-flex rounded-full border border-stone-900/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-900/5"
                      >
                        Ver versao gerada
                      </a>
                    ) : (
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                        Nenhuma versao nova vinculada ainda
                      </p>
                    )}
                        </>
                      );
                    })()}
                  </div>
                ))
              ) : (
                <div className="rounded-[1.2rem] border border-dashed border-stone-900/15 bg-white/70 px-4 py-6 text-sm text-stone-500">
                  Nenhuma analise persistida ainda.
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-stone-950">Curriculos derivados</h2>
            <div className="mt-3 space-y-3">
              {resume.derivedResumes.length > 0 ? (
                resume.derivedResumes.map((item) => (
                  <Link
                    key={item.id}
                    href={`/resumes/${item.id}`}
                    className="block rounded-[1.2rem] border border-stone-900/10 bg-stone-50/80 px-4 py-3 transition hover:bg-stone-100/80"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-stone-900">{item.title}</span>
                      <span className="text-xs uppercase tracking-[0.18em] text-stone-500">
                        {kindLabel[item.kind]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-stone-600">
                      Status {statusLabel[item.status]} | v
                      {item.versions[0]?.versionNumber ?? 1}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="rounded-[1.2rem] border border-dashed border-stone-900/15 bg-white/70 px-4 py-6 text-sm text-stone-500">
                  Este curriculo ainda nao gerou templates ou variantes.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] bg-stone-50/85 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-stone-950">{value}</p>
    </div>
  );
}

function SummaryBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
        {title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function ComparisonCard({
  title,
  changed,
  previousValue,
  currentValue,
  emptyLabel,
}: {
  title: string;
  changed: boolean;
  previousValue: string | null;
  currentValue: string | null;
  emptyLabel: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-stone-900/10 bg-stone-50/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
          {title}
        </h3>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
            changed
              ? "bg-emerald-100 text-emerald-800"
              : "bg-white text-stone-500"
          }`}
        >
          {changed ? "Alterado" : "Sem mudanca"}
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <ComparisonValue
          label="Versao anterior"
          value={previousValue}
          emptyLabel={emptyLabel}
        />
        <ComparisonValue
          label="Versao atual"
          value={currentValue}
          emptyLabel={emptyLabel}
        />
      </div>
    </div>
  );
}

function ComparisonValue({
  label,
  value,
  emptyLabel,
}: {
  label: string;
  value: string | null;
  emptyLabel: string;
}) {
  return (
    <div className="rounded-[1.1rem] bg-white/80 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-stone-700">
        {value || emptyLabel}
      </p>
    </div>
  );
}

function CollectionComparisonCard({
  title,
  previousCount,
  currentCount,
  added,
  removed,
  emptyLabel,
}: {
  title: string;
  previousCount: number;
  currentCount: number;
  added: string[];
  removed: string[];
  emptyLabel: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-stone-900/10 bg-stone-50/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
          {title}
        </h3>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          {previousCount} {"->"} {currentCount}
        </span>
      </div>

      {added.length === 0 && removed.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">{emptyLabel}</p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <ChangeList title="Entrou" items={added} tone="positive" />
          <ChangeList title="Saiu" items={removed} tone="neutral" />
        </div>
      )}
    </div>
  );
}

function ChangeList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "positive" | "neutral";
}) {
  const toneClasses =
    tone === "positive"
      ? "bg-emerald-50 text-emerald-900"
      : "bg-stone-100 text-stone-700";

  return (
    <div className="rounded-[1.1rem] bg-white/80 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        {title}
      </p>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6">
          {items.map((item) => (
            <li key={`${title}-${item}`} className={`rounded-xl px-3 py-2 ${toneClasses}`}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-stone-500">Nenhum item nesta coluna.</p>
      )}
    </div>
  );
}

function getVersionProvenance(editorState: Prisma.JsonValue | null): VersionProvenance {
  if (!editorState || typeof editorState !== "object" || Array.isArray(editorState)) {
    return emptyVersionProvenance();
  }

  return {
    source: getStringValue(editorState, "source"),
    jobTitle: getStringValue(editorState, "jobTitle"),
    company: getStringValue(editorState, "company"),
    analysisId: getStringValue(editorState, "analysisId"),
    jobTargetId: getStringValue(editorState, "jobTargetId"),
    suggestionSetId: getStringValue(editorState, "suggestionSetId"),
    reviewVersionId: getStringValue(editorState, "reviewVersionId"),
  };
}

function emptyVersionProvenance(): VersionProvenance {
  return {
    source: null,
    jobTitle: null,
    company: null,
    analysisId: null,
    jobTargetId: null,
    suggestionSetId: null,
    reviewVersionId: null,
  };
}

function getStringValue(value: Prisma.JsonObject, key: string) {
  const candidate = value[key];
  return typeof candidate === "string" && candidate.trim() ? candidate : null;
}

function findLinkedVersionId(params: {
  analysisId: string;
  jobTargetId: string | null;
  versions: ResumeVersion[];
}) {
  const { analysisId, jobTargetId, versions } = params;

  const linkedVersion = versions.find((version) => {
    const provenance = getVersionProvenance(version.editorState);
    return (
      provenance.analysisId === analysisId ||
      (jobTargetId !== null && provenance.jobTargetId === jobTargetId)
    );
  });

  return linkedVersion?.id ?? null;
}

function findReviewOutputs(params: {
  reviewVersionId: string;
  versions: ResumeVersion[];
}) {
  const { reviewVersionId, versions } = params;

  return versions.filter((version) => {
    const provenance = getVersionProvenance(version.editorState);
    return provenance.reviewVersionId === reviewVersionId;
  });
}

function findLinkedAnalysis(params: {
  analysisId: string | null;
  jobTargetId: string | null;
  analyses: ResumeDetail["analyses"];
}) {
  const { analysisId, jobTargetId, analyses } = params;

  return (
    analyses.find((analysis) => analysisId !== null && analysis.id === analysisId) ??
    analyses.find(
      (analysis) => jobTargetId !== null && analysis.jobTargetId === jobTargetId
    ) ??
    null
  );
}

function findLinkedSuggestionSet(params: {
  suggestionSetId: string | null;
  jobTargetId: string | null;
  suggestionSets: ResumeDetail["suggestionSets"];
}) {
  const { suggestionSetId, jobTargetId, suggestionSets } = params;

  return (
    suggestionSets.find(
      (suggestionSet) => suggestionSetId !== null && suggestionSet.id === suggestionSetId
    ) ??
    suggestionSets.find(
      (suggestionSet) =>
        jobTargetId !== null && suggestionSet.jobTargetId === jobTargetId
    ) ??
    null
  );
}

function extractSuggestionTexts(items: Prisma.JsonValue) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const text = item.text;
      return typeof text === "string" && text.trim() ? text : null;
    })
    .filter((item): item is string => Boolean(item));
}

function renderAuditLine(label: string, changed: boolean, value: string | null) {
  if (!changed) {
    return null;
  }

  return (
    <p key={`${label}-${value}`} className="rounded-lg bg-stone-50 px-3 py-2">
      <span className="font-medium text-stone-900">{label}:</span>{" "}
      {value || "campo atualizado"}
    </p>
  );
}

function renderCollectionAuditLine(label: string, items: string[]) {
  if (items.length === 0) {
    return null;
  }

  return (
    <p key={`${label}-${items.join("|")}`} className="rounded-lg bg-stone-50 px-3 py-2">
      <span className="font-medium text-stone-900">{label}:</span>{" "}
      {items.slice(0, 3).join(", ")}
      {items.length > 3 ? ` +${items.length - 3}` : ""}
    </p>
  );
}

function renderGranularAuditLine(label: string, items: string[]) {
  if (items.length === 0) {
    return null;
  }

  return (
    <p key={`${label}-${items.join("|")}`} className="rounded-lg bg-stone-50 px-3 py-2">
      <span className="font-medium text-stone-900">{label}:</span>{" "}
      {items.slice(0, 3).join(", ")}
      {items.length > 3 ? ` +${items.length - 3}` : ""}
    </p>
  );
}

function OutputCard({
  title,
  tone,
  output,
  onGenerate,
  pending,
}: {
  title: string;
  tone: "ats" | "visual";
  output: (OutputRender & {
    resumeVersion?: {
      id: string;
      versionNumber: number;
    } | null;
  }) | null;
  onGenerate: () => void;
  pending: boolean;
}) {
  const toneClasses =
    tone === "ats"
      ? "border-stone-900/10 bg-stone-50/80"
      : "border-emerald-200 bg-emerald-50/70";
  const previewHtml =
    typeof output?.html === "string" && output.html.trim()
      ? output.html.slice(0, 520)
      : null;

  return (
    <div className={`rounded-[1.5rem] border p-4 ${toneClasses}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-600">
          {title}
        </h3>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700">
          {output ? "Pronto" : "Nao gerado"}
        </span>
      </div>
      <p className="mt-3 text-sm text-stone-600">
        {output
          ? `Ultima geracao na versao v${output.resumeVersion?.versionNumber ?? "?"}.`
          : "Gere esta saida para transformar a versao atual em um artefato reutilizavel."}
      </p>
      {output ? (
        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-stone-500">
          {new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(output.createdAt))}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onGenerate}
        disabled={pending}
        className="mt-4 rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-50 transition hover:bg-stone-800 disabled:opacity-50"
      >
        {pending ? "Gerando..." : output ? "Gerar novamente" : "Gerar saida"}
      </button>
      {previewHtml ? (
        <div className="mt-4 rounded-[1.2rem] bg-white/85 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Preview
          </p>
          <div
            className="mt-3 max-h-48 overflow-hidden rounded-xl border border-stone-900/10 bg-white p-3 text-sm text-stone-700"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      ) : null}
    </div>
  );
}
