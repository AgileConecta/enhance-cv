import type {
  JsonResume,
  JsonResumeEducation,
  JsonResumeLanguage,
  JsonResumeSkill,
  JsonResumeWork,
} from "@/types/json-resume";
import {
  normalizeDate,
  normalizeDateRange,
} from "@/lib/resume/pipeline/normalizers/date";

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i;
const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,3}\)?[\s.-]?)?\d{4,5}[\s.-]?\d{4}/;
const URL_RE = /https?:\/\/[^\s]+/i;
const LINKEDIN_RE = /linkedin\.com\/in\/[\w-]+/i;
const PIPE_WORK_LINE_RE = /^.+\s*\|\s*.+\s*[-–]\s*(?:20\d{2}|19\d{2})/;

const SECTION_HEADERS: Record<string, string[]> = {
  summary: [
    "resumo profissional",
    "resumo",
    "summary",
    "objetivo profissional",
    "objetivo",
    "perfil profissional",
    "perfil",
    "sobre mim",
    "about me",
  ],
  work: [
    "experiencia profissional",
    "experiencia",
    "atuacao profissional",
    "historico profissional",
    "experience",
    "work history",
    "employment",
    "career",
  ],
  education: [
    "formacao academica e certificacoes",
    "formacao academica",
    "formacao escolar",
    "formacao",
    "educacao",
    "education",
    "academic background",
    "qualifications",
    "escolaridade",
    "graduacao",
  ],
  skills: [
    "habilidades e competencias",
    "competencias tecnicas",
    "habilidades tecnicas",
    "habilidades",
    "competencias",
    "conhecimentos tecnicos",
    "conhecimentos",
    "skills",
    "tech stack",
    "technologies",
  ],
  languages: ["idiomas", "languages", "linguas", "proficiencia em idiomas"],
  certificates: [
    "cursos e certificacoes",
    "certificacoes",
    "certificacao",
    "cursos complementares",
    "cursos",
    "certificates",
    "courses",
    "treinamentos",
  ],
  projects: ["projetos profissionais", "projetos", "projects"],
};

function firstMatch(text: string, re: RegExp): string | undefined {
  return text.match(re)?.[0];
}

function normalizeForMatching(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s/|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function extractPhone(text: string): string | undefined {
  const match = firstMatch(text, PHONE_RE);
  if (!match) return undefined;

  const digits = match.replace(/\D/g, "");
  if (digits.length < 10) return undefined;
  if (/^(19|20)\d{2}[-.](19|20)\d{2}$/.test(match)) return undefined;

  return match;
}

function matchSectionHeader(line: string): string | undefined {
  const normalizedLine = normalizeForMatching(line);

  for (const [key, aliases] of Object.entries(SECTION_HEADERS)) {
    if (aliases.some((alias) => normalizedLine.startsWith(alias))) {
      return key;
    }
  }

  return undefined;
}

function splitIntoSections(text: string): Record<string, string> {
  const lines = text.split("\n");
  const sections: Record<string, string> = { header: "" };
  let currentSection = "header";

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      sections[currentSection] = (sections[currentSection] ?? "") + "\n";
      continue;
    }

    const matchedSection = matchSectionHeader(trimmed);
    const matched = Boolean(matchedSection);
    if (matchedSection) {
      currentSection = matchedSection;
      if (!sections[matchedSection]) sections[matchedSection] = "";
    }

    if (!matched) {
      sections[currentSection] = (sections[currentSection] ?? "") + line + "\n";
    }
  }

  return sections;
}

function parsePipeLine(line: string): Partial<JsonResumeWork> {
  const parts = line.split(/\s*\|\s*/);
  const company = parts[0].trim();
  let position: string | undefined;
  let startDate: string | undefined;
  let endDate: string | undefined;

  if (parts[1]) {
    const dateMatch = parts[1].match(/[-–]\s*((?:20|19)\d{2}.*)/);
    if (dateMatch) {
      position = parts[1].slice(0, parts[1].indexOf(dateMatch[0])).trim();
      const dateStr = dateMatch[1];
      const years = normalizeDateRange(dateStr);
      startDate = years.startDate;
      endDate = /atual|present|current|hoje/i.test(dateStr)
        ? "Present"
        : years.endDate;
    } else {
      position = parts[1].trim();
    }
  }

  return { name: company, position, startDate, endDate };
}

function parseWork(text: string): JsonResumeWork[] {
  if (!text.trim()) return [];

  const lines = text.split("\n").map((line) => line.trim());
  const works: JsonResumeWork[] = [];
  let current: Partial<JsonResumeWork> | null = null;
  let descriptionLines: string[] = [];

  const flush = () => {
    if (!current) return;
    const summary = descriptionLines.filter(Boolean).join("\n").slice(0, 1000);
    works.push({
      name: current.name ?? "Empresa não identificada",
      position: current.position,
      startDate: current.startDate,
      endDate: current.endDate,
      summary: summary || undefined,
      highlights: [],
    });
    current = null;
    descriptionLines = [];
  };

  for (const line of lines) {
    if (!line) continue;

    if (PIPE_WORK_LINE_RE.test(line)) {
      flush();
      current = parsePipeLine(line);
      continue;
    }

    if (current) {
      const isBareYear = /^\d{4}$/.test(line) || /^(atual|present)$/i.test(line);
      if (!isBareYear) descriptionLines.push(line);
    }
  }

  flush();
  return works;
}

function parseEducation(text: string): JsonResumeEducation[] {
  if (!text.trim()) return [];

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const degreeRe =
    /\b(bachelor|master|mba|msc|phd|doutorado|mestrado|gradua[cç][aã]o|p[óo]s[\s-]?gradua|técnico|technician|licenciatura|bacharelado|especiali[sz]a[cç][aã]o)\b/i;

  const entries: JsonResumeEducation[] = [];

  for (const line of lines) {
    const yearRangeMatch = line.match(/\((\d{4})\s*[-–]\s*(\d{4})\)/);
    const startDate = yearRangeMatch?.[1];
    const endDate = yearRangeMatch?.[2];
    const cleanLine = line.replace(/\s*\(\d{4}\s*[-–]\s*\d{4}\)/, "").trim();
    const dashSplit = cleanLine.split(/\s+[–\-|]\s+/);

    let institution = cleanLine;
    let studyType: string | undefined;

    if (dashSplit.length >= 2) {
      studyType = degreeRe.test(dashSplit[0]) ? dashSplit[0] : undefined;
      institution = studyType ? dashSplit[1] : dashSplit[0];
      if (!studyType && degreeRe.test(dashSplit[1])) {
        studyType = dashSplit[1];
        institution = dashSplit[0];
      }
    } else if (degreeRe.test(cleanLine)) {
      studyType = cleanLine;
      institution = "";
    }

    if (!institution && !studyType) continue;

    entries.push({
      institution,
      studyType,
      startDate: normalizeDate(startDate),
      endDate: normalizeDate(endDate),
    });
  }

  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.institution}|${entry.studyType ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseSkills(text: string): JsonResumeSkill[] {
  if (!text.trim()) return [];

  const groupRe = /^([^:\n]{3,50}):\s*(.{5,})$/gm;
  const groups: JsonResumeSkill[] = [];
  let match: RegExpExecArray | null;

  while ((match = groupRe.exec(text)) !== null) {
    const name = match[1].trim();
    const keywords = match[2]
      .split(/[,;|•·]/)
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 1 && keyword.length < 60);
    if (keywords.length > 0) groups.push({ name, keywords });
  }

  if (groups.length > 0) return groups;

  const keywords = text
    .split(/[\n,;|•·]/)
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 2 && keyword.length < 60);

  return keywords.length > 0 ? [{ name: "Skills", keywords }] : [];
}

function parseLanguages(text: string): JsonResumeLanguage[] {
  if (!text.trim()) return [];

  const fluencyPatterns: Array<[RegExp, string]> = [
    [/nativo|native/i, "Native"],
    [/fluente|fluent/i, "Fluent"],
    [/avan[cç]ado|advanced/i, "Advanced"],
    [/intermedi[áa]rio|intermediate/i, "Intermediate"],
    [/b[áa]sico|basic|elementary/i, "Elementary"],
  ];

  const knownLanguages =
    /\b(ingl[eê]s|english|portugu[eê]s|portuguese|espanhol|spanish|franc[eê]s|french|alem[ãa]o|german|italiano|italian|mandarim|mandarin|japon[eê]s|japanese)\b/i;

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(
      (line) =>
        knownLanguages.test(line) ||
        fluencyPatterns.some(([pattern]) => pattern.test(line))
    )
    .map((line) => {
      let fluency: string | undefined;
      for (const [pattern, value] of fluencyPatterns) {
        if (pattern.test(line)) {
          fluency = value;
          break;
        }
      }

      return {
        language: line
          .replace(
            /[-–—:,]?\s*(nativo|native|fluente|fluent|avan[cç]ado|advanced|intermedi[áa]rio|intermediate|b[áa]sico|basic|elementary)/gi,
            ""
          )
          .replace(/\(.*?\)/g, "")
          .trim(),
        fluency,
      };
    })
    .filter((language) => language.language.length > 1);
}

export function textToResume(rawText: string): JsonResume {
  const sections = splitIntoSections(rawText);
  const header = sections.header ?? rawText.slice(0, 600);
  const email = firstMatch(rawText, EMAIL_RE);
  const phone = extractPhone(rawText);
  const linkedinMatch = rawText.match(LINKEDIN_RE);
  const urlMatch = rawText.match(URL_RE);

  const nameLine = header
    .split("\n")
    .map((line) => line.trim())
    .find(
      (line) =>
        line.length > 2 &&
        line.length < 80 &&
        !EMAIL_RE.test(line) &&
        !PHONE_RE.test(line) &&
        !URL_RE.test(line)
    );

  const profiles = linkedinMatch
    ? [
        {
          network: "LinkedIn",
          url: `https://${linkedinMatch[0]}`,
          username: linkedinMatch[0].split("/in/")[1],
        },
      ]
    : [];

  return {
    basics: {
      name: nameLine ?? "Nome não identificado",
      email,
      phone,
      url:
        urlMatch?.[0] && !LINKEDIN_RE.test(urlMatch[0])
          ? urlMatch[0]
          : undefined,
      summary: sections.summary?.trim() || undefined,
      profiles,
    },
    work: parseWork(sections.work ?? ""),
    education: parseEducation(sections.education ?? ""),
    skills: parseSkills(sections.skills ?? ""),
    languages: parseLanguages(sections.languages ?? ""),
    certificates: [],
    projects: [],
  };
}
