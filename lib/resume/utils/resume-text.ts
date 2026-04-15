import type { JsonResume } from "@/types/json-resume";

export function resumeToPlainText(resume: JsonResume): string {
  const parts: string[] = [];

  if (resume.basics.name) parts.push(resume.basics.name);
  if (resume.basics.label) parts.push(resume.basics.label);
  if (resume.basics.summary) parts.push(resume.basics.summary);

  for (const work of resume.work ?? []) {
    parts.push(work.name);
    if (work.position) parts.push(work.position);
    if (work.summary) parts.push(work.summary);
    if (work.highlights?.length) parts.push(work.highlights.join(" "));
  }

  for (const education of resume.education ?? []) {
    parts.push(education.institution);
    if (education.studyType) parts.push(education.studyType);
    if (education.area) parts.push(education.area);
  }

  for (const skill of resume.skills ?? []) {
    parts.push(skill.name);
    if (skill.keywords?.length) parts.push(skill.keywords.join(" "));
  }

  for (const language of resume.languages ?? []) {
    parts.push(language.language);
    if (language.fluency) parts.push(language.fluency);
  }

  for (const certificate of resume.certificates ?? []) {
    parts.push(certificate.name);
    if (certificate.issuer) parts.push(certificate.issuer);
  }

  return parts.filter(Boolean).join(" ").trim();
}
