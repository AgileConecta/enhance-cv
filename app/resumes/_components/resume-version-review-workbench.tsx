"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ResumeVersionComparison } from "@/lib/resume/version-comparison";
import type {
  JsonResume,
  JsonResumeEducation,
  JsonResumeProject,
  JsonResumeWork,
} from "@/types/json-resume";

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

type ReviewSectionKey =
  | "label"
  | "summary"
  | "skills"
  | "work"
  | "education"
  | "projects";

const sectionLabel: Record<ReviewSectionKey, string> = {
  label: "Cargo alvo",
  summary: "Resumo",
  skills: "Skills",
  work: "Experiencias",
  education: "Formacao",
  projects: "Projetos",
};

export function ResumeVersionReviewWorkbench({
  resumeId,
  sourceVersionId,
  currentResume,
  previousResume,
  comparison,
}: {
  resumeId: string;
  sourceVersionId: string;
  currentResume: JsonResume;
  previousResume: JsonResume | null;
  comparison: ResumeVersionComparison | null;
}) {
  const router = useRouter();
  const availableSections = useMemo(
    () => getAvailableSections(comparison),
    [comparison]
  );
  const currentSummarySegments = useMemo(
    () => splitSummarySegments(currentResume.basics.summary),
    [currentResume.basics.summary]
  );
  const currentWorkByLabel = useMemo(
    () => new Map((currentResume.work ?? []).map((item) => [getWorkLabel(item), item])),
    [currentResume.work]
  );
  const currentEducationByLabel = useMemo(
    () =>
      new Map(
        (currentResume.education ?? []).map((item) => [getEducationLabel(item), item])
      ),
    [currentResume.education]
  );
  const currentProjectsByLabel = useMemo(
    () =>
      new Map((currentResume.projects ?? []).map((item) => [getProjectLabel(item), item])),
    [currentResume.projects]
  );
  const [selectedSections, setSelectedSections] = useState<ReviewSectionKey[]>(
    availableSections
  );
  const [selectedSummarySegments, setSelectedSummarySegments] = useState<string[]>(
    currentSummarySegments
  );
  const [selectedSkillAdds, setSelectedSkillAdds] = useState<string[]>(
    comparison?.skills.added ?? []
  );
  const [selectedSkillRemovals, setSelectedSkillRemovals] = useState<string[]>(
    comparison?.skills.removed ?? []
  );
  const [selectedWorkAdds, setSelectedWorkAdds] = useState<string[]>(
    comparison?.work.added ?? []
  );
  const [selectedWorkRemovals, setSelectedWorkRemovals] = useState<string[]>(
    comparison?.work.removed ?? []
  );
  const [selectedEducationAdds, setSelectedEducationAdds] = useState<string[]>(
    comparison?.education.added ?? []
  );
  const [selectedEducationRemovals, setSelectedEducationRemovals] = useState<string[]>(
    comparison?.education.removed ?? []
  );
  const [selectedProjectAdds, setSelectedProjectAdds] = useState<string[]>(
    comparison?.projects.added ?? []
  );
  const [selectedProjectRemovals, setSelectedProjectRemovals] = useState<string[]>(
    comparison?.projects.removed ?? []
  );
  const [notes, setNotes] = useState(
    availableSections.length > 0
      ? `Versao seletiva criada a partir da revisao de diff (${availableSections
          .map((section) => sectionLabel[section])
          .join(", ")})`
      : "Versao seletiva criada a partir da revisao de diff"
  );
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!comparison || !previousResume) {
    return (
      <section className="rounded-[1.8rem] border border-dashed border-stone-900/15 bg-white/70 p-6 text-sm text-stone-500">
        A aplicacao seletiva fica disponivel quando existe uma versao anterior valida
        para compor o proximo snapshot.
      </section>
    );
  }

  const previousResumeSnapshot = previousResume;

  function toggleSection(section: ReviewSectionKey) {
    setSelectedSections((current) =>
      current.includes(section)
        ? current.filter((item) => item !== section)
        : [...current, section]
    );
  }

  function toggleSummarySegment(segment: string) {
    setSelectedSummarySegments((current) =>
      current.includes(segment)
        ? current.filter((item) => item !== segment)
        : [...current, segment]
    );
  }

  function toggleSkillAdd(skill: string) {
    setSelectedSkillAdds((current) =>
      current.includes(skill)
        ? current.filter((item) => item !== skill)
        : [...current, skill]
    );
  }

  function toggleSkillRemoval(skill: string) {
    setSelectedSkillRemovals((current) =>
      current.includes(skill)
        ? current.filter((item) => item !== skill)
        : [...current, skill]
    );
  }

  function toggleWorkAdd(item: string) {
    setSelectedWorkAdds((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item]
    );
  }

  function toggleWorkRemoval(item: string) {
    setSelectedWorkRemovals((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item]
    );
  }

  function toggleEducationAdd(item: string) {
    setSelectedEducationAdds((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item]
    );
  }

  function toggleEducationRemoval(item: string) {
    setSelectedEducationRemovals((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item]
    );
  }

  function toggleProjectAdd(item: string) {
    setSelectedProjectAdds((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item]
    );
  }

  function toggleProjectRemoval(item: string) {
    setSelectedProjectRemovals((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item]
    );
  }

  async function handleApplySelectedChanges() {
    if (selectedSections.length === 0) {
      setError("Selecione pelo menos um bloco para compor a nova versao.");
      return;
    }

    setPending(true);
    setError(null);
    setFeedback(null);

    const nextResume = applySelectedSections({
      currentResume,
      previousResume: previousResumeSnapshot,
        selectedSections,
        selectedSummarySegments,
        selectedSkillAdds,
        selectedSkillRemovals,
        selectedWorkAdds,
        selectedWorkRemovals,
        selectedEducationAdds,
        selectedEducationRemovals,
        selectedProjectAdds,
        selectedProjectRemovals,
        currentWorkByLabel,
        currentEducationByLabel,
        currentProjectsByLabel,
      });

    try {
      const response = await fetch(`/api/resumes/${resumeId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: nextResume,
          notes: notes.trim() || "Versao seletiva criada no modo diff",
          editorState: {
            source: "version-review",
            reviewVersionId: sourceVersionId,
            appliedSections: selectedSections,
            granularSelections: {
              summarySegments: selectedSummarySegments,
              skillAdds: selectedSkillAdds,
              skillRemovals: selectedSkillRemovals,
              workAdds: selectedWorkAdds,
              workRemovals: selectedWorkRemovals,
              educationAdds: selectedEducationAdds,
              educationRemovals: selectedEducationRemovals,
              projectAdds: selectedProjectAdds,
              projectRemovals: selectedProjectRemovals,
            },
          },
        }),
      });

      const payload = (await response.json()) as VersionResponse;
      if (!payload.success) {
        setError(payload.error.message);
        return;
      }

      setFeedback(`Nova versao seletiva salva com sucesso: v${payload.data.versionNumber}.`);
      router.push(`/resumes/${resumeId}/versions/${payload.data.versionId}`);
      router.refresh();
    } catch {
      setError("Nao foi possivel salvar a revisao seletiva agora.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-[1.8rem] border border-stone-900/10 bg-white/85 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
        Revisao acionavel
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-stone-950">
        Aprovar blocos e gerar nova versao
      </h2>
      <p className="mt-3 text-sm leading-7 text-stone-600">
        Escolha quais mudancas desta versao devem seguir para a proxima iteracao. A
        nova versao parte do snapshot anterior e aplica apenas os blocos aprovados.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {availableSections.map((section) => {
          const selected = selectedSections.includes(section);

          return (
            <button
              key={section}
              type="button"
              onClick={() => toggleSection(section)}
              className={`rounded-[1.3rem] border px-4 py-4 text-left transition ${
                selected
                  ? "border-stone-900 bg-stone-900 text-stone-50"
                  : "border-stone-900/10 bg-stone-50/80 text-stone-700 hover:bg-stone-100"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                {selected ? "Aprovado" : "Pendente"}
              </p>
              <p className="mt-2 text-base font-semibold">{sectionLabel[section]}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">
            Notas da nova versao
          </span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="min-h-28 w-full rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
            placeholder="Explique quais blocos foram aprovados nesta revisao"
          />
        </label>
      </div>

      {selectedSections.includes("summary") && currentSummarySegments.length > 0 ? (
        <div className="mt-6 rounded-[1.6rem] border border-stone-900/10 bg-stone-50/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
            Resumo em granularidade fina
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Escolha exatamente quais trechos do resumo atual devem seguir para a
            nova versao.
          </p>
          <div className="mt-4 space-y-3">
            {currentSummarySegments.map((segment) => {
              const selected = selectedSummarySegments.includes(segment);

              return (
                <button
                  key={`summary-${segment}`}
                  type="button"
                  onClick={() => toggleSummarySegment(segment)}
                  className={`block w-full rounded-[1.2rem] border px-4 py-3 text-left text-sm leading-6 transition ${
                    selected
                      ? "border-stone-900 bg-white text-stone-900"
                      : "border-stone-900/10 bg-stone-100/70 text-stone-500"
                  }`}
                >
                  {segment}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {selectedSections.includes("skills") ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <GranularListCard
            title="Skills para adicionar"
            description="Aprove apenas as novas skills que devem entrar no snapshot seguinte."
            items={comparison.skills.added}
            selectedItems={selectedSkillAdds}
            onToggle={toggleSkillAdd}
            emptyMessage="Nenhuma skill nova encontrada neste diff."
          />
          <GranularListCard
            title="Skills para remover"
            description="Remova apenas as skills que realmente devem sair da proxima versao."
            items={comparison.skills.removed}
            selectedItems={selectedSkillRemovals}
            onToggle={toggleSkillRemoval}
            emptyMessage="Nenhuma skill removida detectada neste diff."
          />
        </div>
      ) : null}

      {selectedSections.includes("work") ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <GranularListCard
            title="Experiencias para adicionar"
            description="Aprove apenas as experiencias novas que devem entrar na proxima versao."
            items={comparison.work.added}
            selectedItems={selectedWorkAdds}
            onToggle={toggleWorkAdd}
            emptyMessage="Nenhuma experiencia nova encontrada neste diff."
          />
          <GranularListCard
            title="Experiencias para remover"
            description="Remova apenas as experiencias que realmente devem sair do snapshot seguinte."
            items={comparison.work.removed}
            selectedItems={selectedWorkRemovals}
            onToggle={toggleWorkRemoval}
            emptyMessage="Nenhuma experiencia removida detectada neste diff."
          />
        </div>
      ) : null}

      {selectedSections.includes("education") ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <GranularListCard
            title="Formacoes para adicionar"
            description="Aprove apenas os itens de formacao que devem seguir para a proxima versao."
            items={comparison.education.added}
            selectedItems={selectedEducationAdds}
            onToggle={toggleEducationAdd}
            emptyMessage="Nenhum item de formacao novo encontrado neste diff."
          />
          <GranularListCard
            title="Formacoes para remover"
            description="Remova apenas os itens de formacao que realmente devem sair."
            items={comparison.education.removed}
            selectedItems={selectedEducationRemovals}
            onToggle={toggleEducationRemoval}
            emptyMessage="Nenhum item de formacao removido detectado neste diff."
          />
        </div>
      ) : null}

      {selectedSections.includes("projects") ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <GranularListCard
            title="Projetos para adicionar"
            description="Aprove apenas os projetos novos que devem entrar no snapshot seguinte."
            items={comparison.projects.added}
            selectedItems={selectedProjectAdds}
            onToggle={toggleProjectAdd}
            emptyMessage="Nenhum projeto novo encontrado neste diff."
          />
          <GranularListCard
            title="Projetos para remover"
            description="Remova apenas os projetos que realmente devem sair da proxima versao."
            items={comparison.projects.removed}
            selectedItems={selectedProjectRemovals}
            onToggle={toggleProjectRemoval}
            emptyMessage="Nenhum projeto removido detectado neste diff."
          />
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleApplySelectedChanges}
          disabled={pending}
          className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Salvando..." : "Salvar nova versao seletiva"}
        </button>
      </div>

      {feedback ? (
        <div className="mt-4 rounded-[1.1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {feedback}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-[1.1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </section>
  );
}

function getAvailableSections(comparison: ResumeVersionComparison | null) {
  if (!comparison) {
    return [] as ReviewSectionKey[];
  }

  return [
    comparison.label.changed ? "label" : null,
    comparison.summary.changed ? "summary" : null,
    comparison.skills.added.length > 0 || comparison.skills.removed.length > 0
      ? "skills"
      : null,
    comparison.work.added.length > 0 || comparison.work.removed.length > 0 ? "work" : null,
    comparison.education.added.length > 0 || comparison.education.removed.length > 0
      ? "education"
      : null,
    comparison.projects.added.length > 0 || comparison.projects.removed.length > 0
      ? "projects"
      : null,
  ].filter((item): item is ReviewSectionKey => Boolean(item));
}

function applySelectedSections(params: {
  currentResume: JsonResume;
  previousResume: JsonResume;
  selectedSections: ReviewSectionKey[];
  selectedSummarySegments: string[];
  selectedSkillAdds: string[];
  selectedSkillRemovals: string[];
  selectedWorkAdds: string[];
  selectedWorkRemovals: string[];
  selectedEducationAdds: string[];
  selectedEducationRemovals: string[];
  selectedProjectAdds: string[];
  selectedProjectRemovals: string[];
  currentWorkByLabel: Map<string, JsonResumeWork>;
  currentEducationByLabel: Map<string, JsonResumeEducation>;
  currentProjectsByLabel: Map<string, JsonResumeProject>;
}) {
  const {
    currentResume,
    previousResume,
    selectedSections,
    selectedSummarySegments,
    selectedSkillAdds,
    selectedSkillRemovals,
    selectedWorkAdds,
    selectedWorkRemovals,
    selectedEducationAdds,
    selectedEducationRemovals,
    selectedProjectAdds,
    selectedProjectRemovals,
    currentWorkByLabel,
    currentEducationByLabel,
    currentProjectsByLabel,
  } = params;
  const selected = new Set(selectedSections);
  const previousSkillNames = new Set(
    (previousResume.skills ?? []).map((item) => item.name.toLowerCase())
  );

  const mergedSkills = [
    ...(previousResume.skills ?? []).filter(
      (item) => !selectedSkillRemovals.some((skill) => skill.toLowerCase() === item.name.toLowerCase())
    ),
    ...selectedSkillAdds
      .filter((skill) => !previousSkillNames.has(skill.toLowerCase()))
      .map((skill) => ({ name: skill, keywords: [] })),
  ];
  const mergedWork = mergeCollectionSelection({
    previousItems: previousResume.work ?? [],
    removalLabels: selectedWorkRemovals,
    additionLabels: selectedWorkAdds,
    currentItemsByLabel: currentWorkByLabel,
    getLabel: getWorkLabel,
  });
  const mergedEducation = mergeCollectionSelection({
    previousItems: previousResume.education ?? [],
    removalLabels: selectedEducationRemovals,
    additionLabels: selectedEducationAdds,
    currentItemsByLabel: currentEducationByLabel,
    getLabel: getEducationLabel,
  });
  const mergedProjects = mergeCollectionSelection({
    previousItems: previousResume.projects ?? [],
    removalLabels: selectedProjectRemovals,
    additionLabels: selectedProjectAdds,
    currentItemsByLabel: currentProjectsByLabel,
    getLabel: getProjectLabel,
  });

  return {
    ...previousResume,
    basics: {
      ...previousResume.basics,
      label: selected.has("label")
        ? currentResume.basics.label
        : previousResume.basics.label,
      summary: selected.has("summary")
          ? joinSummarySegments(selectedSummarySegments) || previousResume.basics.summary
          : previousResume.basics.summary,
    },
    skills: selected.has("skills") ? mergedSkills : previousResume.skills,
    work: selected.has("work") ? mergedWork : previousResume.work,
    education: selected.has("education") ? mergedEducation : previousResume.education,
    projects: selected.has("projects") ? mergedProjects : previousResume.projects,
  } satisfies JsonResume;
}

function GranularListCard({
  title,
  description,
  items,
  selectedItems,
  onToggle,
  emptyMessage,
}: {
  title: string;
  description: string;
  items: string[];
  selectedItems: string[];
  onToggle: (item: string) => void;
  emptyMessage: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-stone-900/10 bg-stone-50/80 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
      {items.length > 0 ? (
        <div className="mt-4 space-y-3">
          {items.map((item) => {
            const selected = selectedItems.includes(item);

            return (
              <button
                key={`${title}-${item}`}
                type="button"
                onClick={() => onToggle(item)}
                className={`block w-full rounded-[1.2rem] border px-4 py-3 text-left text-sm leading-6 transition ${
                  selected
                    ? "border-stone-900 bg-white text-stone-900"
                    : "border-stone-900/10 bg-stone-100/70 text-stone-500"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-sm text-stone-500">{emptyMessage}</p>
      )}
    </div>
  );
}

function splitSummarySegments(summary?: string) {
  return (summary ?? "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinSummarySegments(segments: string[]) {
  return segments.join(" ").trim();
}

function mergeCollectionSelection<T>({
  previousItems,
  removalLabels,
  additionLabels,
  currentItemsByLabel,
  getLabel,
}: {
  previousItems: T[];
  removalLabels: string[];
  additionLabels: string[];
  currentItemsByLabel: Map<string, T>;
  getLabel: (item: T) => string;
}) {
  const removalSet = new Set(removalLabels);
  const keptPrevious = previousItems.filter((item) => !removalSet.has(getLabel(item)));
  const keptLabels = new Set(keptPrevious.map((item) => getLabel(item)));
  const additions = additionLabels
    .map((label) => currentItemsByLabel.get(label))
    .filter((item): item is T => Boolean(item))
    .filter((item) => !keptLabels.has(getLabel(item)));

  return [...keptPrevious, ...additions];
}

function getWorkLabel(item: JsonResumeWork) {
  return `${item.name}${item.position ? ` | ${item.position}` : ""}`;
}

function getEducationLabel(item: JsonResumeEducation) {
  return `${item.institution}${item.studyType ? ` | ${item.studyType}` : ""}${
    item.area ? ` | ${item.area}` : ""
  }`;
}

function getProjectLabel(item: JsonResumeProject) {
  return item.name;
}
