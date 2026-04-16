import type { ResumeVersionComparison } from "@/lib/resume/version-comparison";

export type GranularSelections = {
  summarySegments: string[];
  skillAdds: string[];
  skillRemovals: string[];
  workAdds: string[];
  workRemovals: string[];
  educationAdds: string[];
  educationRemovals: string[];
  projectAdds: string[];
  projectRemovals: string[];
};

export type GranularReviewAudit = {
  summarySegments: string[];
  skills: {
    approvedAdds: string[];
    rejectedAdds: string[];
    approvedRemovals: string[];
    rejectedRemovals: string[];
  };
  work: {
    approvedAdds: string[];
    rejectedAdds: string[];
    approvedRemovals: string[];
    rejectedRemovals: string[];
  };
  education: {
    approvedAdds: string[];
    rejectedAdds: string[];
    approvedRemovals: string[];
    rejectedRemovals: string[];
  };
  projects: {
    approvedAdds: string[];
    rejectedAdds: string[];
    approvedRemovals: string[];
    rejectedRemovals: string[];
  };
};

const emptyGranularSelections: GranularSelections = {
  summarySegments: [],
  skillAdds: [],
  skillRemovals: [],
  workAdds: [],
  workRemovals: [],
  educationAdds: [],
  educationRemovals: [],
  projectAdds: [],
  projectRemovals: [],
};

export function extractGranularSelections(editorState: unknown): GranularSelections {
  if (!editorState || typeof editorState !== "object" || Array.isArray(editorState)) {
    return emptyGranularSelections;
  }

  const granularSelections = "granularSelections" in editorState ? editorState.granularSelections : null;
  if (
    !granularSelections ||
    typeof granularSelections !== "object" ||
    Array.isArray(granularSelections)
  ) {
    return emptyGranularSelections;
  }

  return {
    summarySegments: readStringArray(granularSelections, "summarySegments"),
    skillAdds: readStringArray(granularSelections, "skillAdds"),
    skillRemovals: readStringArray(granularSelections, "skillRemovals"),
    workAdds: readStringArray(granularSelections, "workAdds"),
    workRemovals: readStringArray(granularSelections, "workRemovals"),
    educationAdds: readStringArray(granularSelections, "educationAdds"),
    educationRemovals: readStringArray(granularSelections, "educationRemovals"),
    projectAdds: readStringArray(granularSelections, "projectAdds"),
    projectRemovals: readStringArray(granularSelections, "projectRemovals"),
  };
}

export function buildGranularReviewAudit(params: {
  editorState: unknown;
  comparison?: ResumeVersionComparison | null;
}): GranularReviewAudit {
  const selections = extractGranularSelections(params.editorState);
  const comparison = params.comparison ?? null;

  return {
    summarySegments: selections.summarySegments,
    skills: {
      approvedAdds: selections.skillAdds,
      rejectedAdds: comparison
        ? comparison.skills.added.filter((item) => !selections.skillAdds.includes(item))
        : [],
      approvedRemovals: selections.skillRemovals,
      rejectedRemovals: comparison
        ? comparison.skills.removed.filter(
            (item) => !selections.skillRemovals.includes(item)
          )
        : [],
    },
    work: {
      approvedAdds: selections.workAdds,
      rejectedAdds: comparison
        ? comparison.work.added.filter((item) => !selections.workAdds.includes(item))
        : [],
      approvedRemovals: selections.workRemovals,
      rejectedRemovals: comparison
        ? comparison.work.removed.filter((item) => !selections.workRemovals.includes(item))
        : [],
    },
    education: {
      approvedAdds: selections.educationAdds,
      rejectedAdds: comparison
        ? comparison.education.added.filter(
            (item) => !selections.educationAdds.includes(item)
          )
        : [],
      approvedRemovals: selections.educationRemovals,
      rejectedRemovals: comparison
        ? comparison.education.removed.filter(
            (item) => !selections.educationRemovals.includes(item)
          )
        : [],
    },
    projects: {
      approvedAdds: selections.projectAdds,
      rejectedAdds: comparison
        ? comparison.projects.added.filter((item) => !selections.projectAdds.includes(item))
        : [],
      approvedRemovals: selections.projectRemovals,
      rejectedRemovals: comparison
        ? comparison.projects.removed.filter(
            (item) => !selections.projectRemovals.includes(item)
          )
        : [],
    },
  };
}

export function hasGranularReviewAudit(audit: GranularReviewAudit | null) {
  if (!audit) {
    return false;
  }

  return (
    audit.summarySegments.length > 0 ||
    audit.skills.approvedAdds.length > 0 ||
    audit.skills.rejectedAdds.length > 0 ||
    audit.skills.approvedRemovals.length > 0 ||
    audit.skills.rejectedRemovals.length > 0 ||
    audit.work.approvedAdds.length > 0 ||
    audit.work.rejectedAdds.length > 0 ||
    audit.work.approvedRemovals.length > 0 ||
    audit.work.rejectedRemovals.length > 0 ||
    audit.education.approvedAdds.length > 0 ||
    audit.education.rejectedAdds.length > 0 ||
    audit.education.approvedRemovals.length > 0 ||
    audit.education.rejectedRemovals.length > 0 ||
    audit.projects.approvedAdds.length > 0 ||
    audit.projects.rejectedAdds.length > 0 ||
    audit.projects.approvedRemovals.length > 0 ||
    audit.projects.rejectedRemovals.length > 0
  );
}

function readStringArray(value: object, key: string) {
  const candidate = key in value ? (value as Record<string, unknown>)[key] : null;
  if (!Array.isArray(candidate)) {
    return [];
  }

  return candidate.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );
}
