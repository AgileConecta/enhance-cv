import Link from "next/link";
import type {
  Prisma,
  ResumeAnalysis,
  ResumeKind,
  ResumeStatus,
  ResumeVersion,
  SuggestionSet,
} from "@/app/generated/prisma";
import type { GranularReviewAudit } from "@/lib/resume/granular-review";
import { hasGranularReviewAudit } from "@/lib/resume/granular-review";
import type { ResumeVersionComparison } from "@/lib/resume/version-comparison";
import type { JsonResume } from "@/types/json-resume";

type ResumeVersionReviewProps = {
  resume: {
    id: string;
    title: string;
    kind: ResumeKind;
    status: ResumeStatus;
    summary: string | null;
  };
  version: ResumeVersion;
  previousVersion: ResumeVersion | null;
  currentResume: JsonResume;
  previousResume: JsonResume | null;
  comparison: ResumeVersionComparison | null;
  linkedAnalysis: (ResumeAnalysis & {
    jobTarget?: {
      id: string;
      title: string;
      company: string | null;
    } | null;
  }) | null;
  linkedSuggestionSet: (SuggestionSet & {
    jobTarget?: {
      id: string;
      title: string;
      company: string | null;
    } | null;
  }) | null;
  provenance: {
    source: string | null;
    jobTitle: string | null;
    company: string | null;
    analysisId: string | null;
    jobTargetId: string | null;
    suggestionSetId: string | null;
    reviewVersionId?: string | null;
  };
  granularAudit: GranularReviewAudit;
  reviewOutputs: Array<{
    id: string;
    versionNumber: number;
    createdAt: Date;
    notes: string | null;
  }>;
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

export function ResumeVersionReview(props: ResumeVersionReviewProps) {
  const {
    resume,
    version,
    previousVersion,
    currentResume,
    previousResume,
    comparison,
    linkedAnalysis,
    linkedSuggestionSet,
    provenance,
    granularAudit,
    reviewOutputs,
  } = props;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <article className="rounded-[1.8rem] border border-stone-900/10 bg-white/85 p-6 shadow-[0_16px_48px_rgba(58,42,26,0.07)]">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
            <span>{kindLabel[resume.kind]}</span>
            <span className="rounded-full border border-stone-900/10 px-3 py-1 text-stone-600">
              {statusLabel[resume.status]}
            </span>
            <span>v{version.versionNumber}</span>
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950">
            Revisao da versao {version.versionNumber}
          </h1>
          <p className="mt-3 text-sm leading-7 text-stone-600">
            {resume.title}
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <MetricCard
              label="Versao atual"
              value={`v${version.versionNumber}`}
            />
            <MetricCard
              label="Comparada com"
              value={previousVersion ? `v${previousVersion.versionNumber}` : "N/A"}
            />
            <MetricCard
              label="Secoes alteradas"
              value={String(comparison?.changedSections.length ?? 0)}
            />
          </div>
        </article>

        <aside className="rounded-[1.8rem] border border-stone-900/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(243,237,226,0.95))] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            Origem da iteracao
          </p>
          <div className="mt-4 space-y-4">
            <InfoCard
              title="Vaga de origem"
              lines={[
                linkedAnalysis?.jobTarget?.title || provenance.jobTitle || "Sem vaga vinculada",
                linkedAnalysis?.jobTarget?.company || provenance.company || null,
              ]}
            />
            <InfoCard
              title="Analise"
              lines={[
                linkedAnalysis
                  ? `ATS ${Math.round(linkedAnalysis.atsScore ?? 0)} | Fit ${Math.round(
                      linkedAnalysis.fitScore ?? 0
                    )}`
                  : "Nenhuma analise vinculada",
              ]}
            />
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/resumes/${resume.id}`}
                className="rounded-full border border-stone-900/10 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-900/5"
              >
                Voltar ao detalhe
              </Link>
              {provenance.reviewVersionId ? (
                <Link
                  href={`/resumes/${resume.id}/versions/${provenance.reviewVersionId}`}
                  className="rounded-full border border-stone-900/10 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-900/5"
                >
                  Abrir revisao base
                </Link>
              ) : null}
              <Link
                href={`/resumes/${resume.id}/tailor`}
                className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
              >
                Nova adaptacao
              </Link>
            </div>
            {reviewOutputs.length > 0 ? (
              <div className="rounded-[1.2rem] border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
                <p className="font-medium">
                  Esta revisao base ja gerou {reviewOutputs.length}{" "}
                  {reviewOutputs.length === 1 ? "versao derivada" : "versoes derivadas"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {reviewOutputs.map((outputVersion) => (
                    <Link
                      key={`review-output-${outputVersion.id}`}
                      href={`/resumes/${resume.id}/versions/${outputVersion.id}`}
                      className="rounded-full border border-amber-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-900 transition hover:bg-amber-100/70"
                    >
                      Abrir v{outputVersion.versionNumber}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </section>

      <section className="rounded-[1.8rem] border border-stone-900/10 bg-white/85 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
          Trilha auditavel
        </p>
        {comparison ? (
          <div className="mt-4 space-y-5">
            <div className="flex flex-wrap gap-2">
              {comparison.changedSections.length > 0 ? (
                comparison.changedSections.map((section) => (
                  <span
                    key={section}
                    className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700"
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

            <div className="grid gap-4 lg:grid-cols-2">
              <AuditChangeCard
                title="Campos editados"
                rows={[
                  formatAuditRow("Cargo alvo", comparison.label.changed, comparison.label.current),
                  formatAuditRow("Resumo", comparison.summary.changed, comparison.summary.current),
                ]}
                emptyMessage="Nao houve alteracoes em campos escalares."
              />
              <AuditChangeCard
                title="Colecoes alteradas"
                rows={[
                  formatAuditCollection("Skills adicionadas", comparison.skills.added),
                  formatAuditCollection("Skills removidas", comparison.skills.removed),
                  formatAuditCollection("Experiencias adicionadas", comparison.work.added),
                  formatAuditCollection("Formacao adicionada", comparison.education.added),
                  formatAuditCollection("Projetos adicionados", comparison.projects.added),
                ]}
                emptyMessage="Nao houve alteracoes relevantes nas colecoes."
              />
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-500">
            Esta versao ainda nao possui uma versao anterior valida para comparacao.
          </p>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SnapshotCard
          title={`Versao atual (${version.versionNumber})`}
          resume={currentResume}
        />
        <SnapshotCard
          title={
            previousVersion ? `Versao anterior (${previousVersion.versionNumber})` : "Versao anterior"
          }
          resume={previousResume}
          emptyMessage="Nao existe snapshot anterior para esta versao."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SuggestionsCard suggestionSet={linkedSuggestionSet} />
        <VersionNotesCard notes={version.notes} createdAt={version.createdAt} />
      </section>

      {hasGranularReviewAudit(granularAudit) ? (
        <section className="rounded-[1.8rem] border border-stone-900/10 bg-white/85 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            Aprovacoes granulares
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <AuditChangeCard
              title="Itens aprovados"
              rows={[
                formatAuditCollection("Resumo aprovado", granularAudit.summarySegments),
                formatAuditCollection("Skills aprovadas", granularAudit.skills.approvedAdds),
                formatAuditCollection(
                  "Remocoes de skills aprovadas",
                  granularAudit.skills.approvedRemovals
                ),
                formatAuditCollection(
                  "Experiencias aprovadas",
                  granularAudit.work.approvedAdds
                ),
                formatAuditCollection(
                  "Remocoes de experiencias aprovadas",
                  granularAudit.work.approvedRemovals
                ),
                formatAuditCollection(
                  "Formacoes aprovadas",
                  granularAudit.education.approvedAdds
                ),
                formatAuditCollection(
                  "Remocoes de formacao aprovadas",
                  granularAudit.education.approvedRemovals
                ),
                formatAuditCollection(
                  "Projetos aprovados",
                  granularAudit.projects.approvedAdds
                ),
                formatAuditCollection(
                  "Remocoes de projetos aprovadas",
                  granularAudit.projects.approvedRemovals
                ),
              ]}
              emptyMessage="Nenhuma aprovacao granular foi registrada nesta revisao."
            />
            <AuditChangeCard
              title="Itens deixados de fora"
              rows={[
                formatAuditCollection("Skills rejeitadas", granularAudit.skills.rejectedAdds),
                formatAuditCollection(
                  "Remocoes de skills rejeitadas",
                  granularAudit.skills.rejectedRemovals
                ),
                formatAuditCollection(
                  "Experiencias rejeitadas",
                  granularAudit.work.rejectedAdds
                ),
                formatAuditCollection(
                  "Remocoes de experiencias rejeitadas",
                  granularAudit.work.rejectedRemovals
                ),
                formatAuditCollection(
                  "Formacoes rejeitadas",
                  granularAudit.education.rejectedAdds
                ),
                formatAuditCollection(
                  "Remocoes de formacao rejeitadas",
                  granularAudit.education.rejectedRemovals
                ),
                formatAuditCollection(
                  "Projetos rejeitados",
                  granularAudit.projects.rejectedAdds
                ),
                formatAuditCollection(
                  "Remocoes de projetos rejeitadas",
                  granularAudit.projects.rejectedRemovals
                ),
              ]}
              emptyMessage="Nenhum item foi explicitamente deixado de fora nesta revisao."
            />
          </div>
        </section>
      ) : null}
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

function InfoCard({ title, lines }: { title: string; lines: Array<string | null> }) {
  return (
    <div className="rounded-[1.2rem] bg-white/80 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
        {title}
      </p>
      <div className="mt-2 space-y-1 text-sm text-stone-700">
        {lines.filter(Boolean).map((line) => (
          <p key={`${title}-${line}`}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function AuditChangeCard({
  title,
  rows,
  emptyMessage,
}: {
  title: string;
  rows: Array<{ label: string; value: string } | null>;
  emptyMessage: string;
}) {
  const filteredRows = rows.filter((row): row is { label: string; value: string } => Boolean(row));

  return (
    <div className="rounded-[1.6rem] border border-stone-900/10 bg-stone-50/80 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
        {title}
      </p>
      {filteredRows.length > 0 ? (
        <div className="mt-4 space-y-3">
          {filteredRows.map((row) => (
            <div key={`${title}-${row.label}`} className="rounded-xl bg-white/85 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                {row.label}
              </p>
              <p className="mt-1 text-sm leading-6 text-stone-700">{row.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-stone-500">{emptyMessage}</p>
      )}
    </div>
  );
}

function SnapshotCard({
  title,
  resume,
  emptyMessage,
}: {
  title: string;
  resume: JsonResume | null;
  emptyMessage?: string;
}) {
  return (
    <article className="rounded-[1.8rem] border border-stone-900/10 bg-white/85 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
        {title}
      </p>
      {resume ? (
        <div className="mt-4 space-y-5">
          <div className="rounded-[1.2rem] bg-stone-50/80 px-4 py-3">
            <p className="font-medium text-stone-900">
              {resume.basics.name || "Sem nome preenchido"}
            </p>
            {resume.basics.label ? (
              <p className="mt-1 text-sm text-stone-600">{resume.basics.label}</p>
            ) : null}
            {resume.basics.summary ? (
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {resume.basics.summary}
              </p>
            ) : null}
          </div>

          <SnapshotList
            title="Skills"
            items={resume.skills?.map((item) => item.name) ?? []}
            emptyMessage="Nenhuma skill estruturada."
          />
          <SnapshotList
            title="Experiencias"
            items={
              resume.work?.map((item) =>
                `${item.name}${item.position ? ` | ${item.position}` : ""}`
              ) ?? []
            }
            emptyMessage="Nenhuma experiencia estruturada."
          />
        </div>
      ) : (
        <p className="mt-4 text-sm text-stone-500">{emptyMessage || "Snapshot indisponivel."}</p>
      )}
    </article>
  );
}

function SnapshotList({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: string[];
  emptyMessage: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
        {title}
      </h2>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-700">
          {items.slice(0, 6).map((item) => (
            <li key={`${title}-${item}`} className="rounded-xl bg-stone-50 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-stone-500">{emptyMessage}</p>
      )}
    </div>
  );
}

function SuggestionsCard({
  suggestionSet,
}: {
  suggestionSet: (SuggestionSet & {
    jobTarget?: {
      id: string;
      title: string;
      company: string | null;
    } | null;
  }) | null;
}) {
  const suggestions = suggestionSet ? extractSuggestionTexts(suggestionSet.items) : [];

  return (
    <article className="rounded-[1.8rem] border border-stone-900/10 bg-white/85 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
        Sugestoes de origem
      </p>
      {suggestions.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm leading-6 text-stone-700">
          {suggestions.slice(0, 6).map((item) => (
            <li key={`suggestion-${item}`} className="rounded-xl bg-stone-50 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-stone-500">
          Nenhuma sugestao persistida encontrada para esta versao.
        </p>
      )}
    </article>
  );
}

function VersionNotesCard({
  notes,
  createdAt,
}: {
  notes: string | null;
  createdAt: Date;
}) {
  return (
    <article className="rounded-[1.8rem] border border-stone-900/10 bg-white/85 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
        Notas e contexto
      </p>
      <p className="mt-4 text-sm text-stone-500">
        Criada em{" "}
        {new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(createdAt))}
      </p>
      <div className="mt-4 rounded-[1.2rem] bg-stone-50/80 px-4 py-3 text-sm leading-6 text-stone-700">
        {notes || "Sem notas registradas para esta versao."}
      </div>
    </article>
  );
}

function formatAuditRow(label: string, changed: boolean, value: string | null) {
  if (!changed) {
    return null;
  }

  return {
    label,
    value: value || "Campo atualizado",
  };
}

function formatAuditCollection(label: string, items: string[]) {
  if (items.length === 0) {
    return null;
  }

  return {
    label,
    value: `${items.slice(0, 4).join(", ")}${items.length > 4 ? ` +${items.length - 4}` : ""}`,
  };
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
