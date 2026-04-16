import type { JsonResume } from "@/types/json-resume";

export type ResumeVersionComparison = {
  currentVersionNumber: number;
  previousVersionNumber: number;
  changedSections: string[];
  label: {
    changed: boolean;
    previous: string | null;
    current: string | null;
  };
  summary: {
    changed: boolean;
    previous: string | null;
    current: string | null;
  };
  skills: {
    previousCount: number;
    currentCount: number;
    added: string[];
    removed: string[];
  };
  work: {
    previousCount: number;
    currentCount: number;
    added: string[];
    removed: string[];
  };
  education: {
    previousCount: number;
    currentCount: number;
    added: string[];
    removed: string[];
  };
  projects: {
    previousCount: number;
    currentCount: number;
    added: string[];
    removed: string[];
  };
};

export function compareResumeVersions(params: {
  currentVersionNumber: number;
  previousVersionNumber: number;
  current: JsonResume;
  previous: JsonResume;
}): ResumeVersionComparison {
  const { currentVersionNumber, previousVersionNumber, current, previous } = params;

  const label = compareScalar(current.basics.label, previous.basics.label);
  const summary = compareScalar(current.basics.summary, previous.basics.summary);
  const skills = compareNamedCollections(
    current.skills?.map((item) => item.name),
    previous.skills?.map((item) => item.name)
  );
  const work = compareNamedCollections(
    current.work?.map((item) => `${item.name}${item.position ? ` | ${item.position}` : ""}`),
    previous.work?.map((item) => `${item.name}${item.position ? ` | ${item.position}` : ""}`)
  );
  const education = compareNamedCollections(
    current.education?.map(
      (item) =>
        `${item.institution}${item.studyType ? ` | ${item.studyType}` : ""}${
          item.area ? ` | ${item.area}` : ""
        }`
    ),
    previous.education?.map(
      (item) =>
        `${item.institution}${item.studyType ? ` | ${item.studyType}` : ""}${
          item.area ? ` | ${item.area}` : ""
        }`
    )
  );
  const projects = compareNamedCollections(
    current.projects?.map((item) => item.name),
    previous.projects?.map((item) => item.name)
  );

  const changedSections = [
    label.changed ? "cargo alvo" : null,
    summary.changed ? "resumo" : null,
    skills.added.length > 0 || skills.removed.length > 0 ? "skills" : null,
    work.added.length > 0 || work.removed.length > 0 ? "experiencias" : null,
    education.added.length > 0 || education.removed.length > 0 ? "formacao" : null,
    projects.added.length > 0 || projects.removed.length > 0 ? "projetos" : null,
  ].filter((item): item is string => Boolean(item));

  return {
    currentVersionNumber,
    previousVersionNumber,
    changedSections,
    label,
    summary,
    skills,
    work,
    education,
    projects,
  };
}

function compareScalar(currentValue?: string, previousValue?: string) {
  const current = normalizeScalar(currentValue);
  const previous = normalizeScalar(previousValue);

  return {
    changed: current !== previous,
    current,
    previous,
  };
}

function compareNamedCollections(currentValues?: string[], previousValues?: string[]) {
  const current = normalizeCollection(currentValues);
  const previous = normalizeCollection(previousValues);

  return {
    previousCount: previous.length,
    currentCount: current.length,
    added: current.filter((item) => !previous.includes(item)),
    removed: previous.filter((item) => !current.includes(item)),
  };
}

function normalizeCollection(values?: string[]) {
  return Array.from(
    new Set(
      (values ?? [])
        .map((value) => normalizeToken(value))
        .filter((value): value is string => Boolean(value))
    )
  );
}

function normalizeScalar(value?: string) {
  return normalizeToken(value) ?? null;
}

function normalizeToken(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\s+/g, " ") : null;
}
