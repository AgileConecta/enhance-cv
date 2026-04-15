import type { JsonResume } from "@/types/json-resume";
import type { ResumeImportSourceDescriptor } from "@/lib/resume/domain";

function normalizeLinkedinUrl(sourceUrl: string): string {
  const clean = sourceUrl.trim();
  return clean.startsWith("http") ? clean : `https://${clean}`;
}

export function detectProfileUrlSource(
  sourceUrl: string
): ResumeImportSourceDescriptor {
  const normalized = normalizeLinkedinUrl(sourceUrl);

  if (/linkedin\.com\/in\//i.test(normalized)) {
    return {
      kind: "profile_link",
      format: "linkedin_url",
      label: "LinkedIn profile URL",
      sourceUrl: normalized,
    };
  }

  return {
    kind: "profile_link",
    format: "unknown",
    label: "Profile URL",
    sourceUrl: normalized,
  };
}

export function profileUrlToSeedResume(sourceUrl: string): JsonResume {
  const normalized = normalizeLinkedinUrl(sourceUrl);

  return {
    basics: {
      name: "Perfil importado",
      url: normalized,
      profiles: /linkedin\.com\/in\//i.test(normalized)
        ? [
            {
              network: "LinkedIn",
              url: normalized,
            },
          ]
        : [],
    },
    work: [],
    education: [],
    skills: [],
    languages: [],
    certificates: [],
    projects: [],
  };
}
