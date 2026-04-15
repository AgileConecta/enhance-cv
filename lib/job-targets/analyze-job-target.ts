import type {
  CurationGuidance,
  JobTargetInput,
  ResumeAnalysisResult,
} from "@/lib/resume/domain";
import { resumeToPlainText } from "@/lib/resume/utils/resume-text";
import type { JsonResume } from "@/types/json-resume";

const STOPWORDS = new Set([
  "para",
  "com",
  "uma",
  "das",
  "dos",
  "que",
  "por",
  "and",
  "the",
  "this",
  "that",
  "from",
  "your",
  "you",
  "will",
  "have",
  "em",
  "ser",
  "como",
  "mais",
  "anos",
  "year",
  "years",
]);

function normalizeToken(token: string): string {
  return token
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function extractKeywords(text: string): string[] {
  const seen = new Set<string>();

  return text
    .split(/[^a-zA-Z0-9+#./-]+/)
    .map(normalizeToken)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token))
    .filter((token) => {
      if (seen.has(token)) return false;
      seen.add(token);
      return true;
    })
    .slice(0, 40);
}

function score(found: number, total: number, base: number): number {
  if (total === 0) return base;
  return Math.min(100, Math.round(base + (found / total) * (100 - base)));
}

export function analyzeJobTarget(params: {
  resume: JsonResume;
  jobTarget: JobTargetInput;
  curation?: CurationGuidance;
}): ResumeAnalysisResult {
  const { resume, jobTarget, curation } = params;
  const resumeText = normalizeToken(resumeToPlainText(resume));
  const jobKeywords = extractKeywords(
    `${jobTarget.title} ${jobTarget.description} ${(curation?.preferredKeywords ?? []).join(" ")}`
  );

  const matchedKeywords = jobKeywords.filter((keyword) => resumeText.includes(keyword));
  const missingKeywords = jobKeywords.filter((keyword) => !resumeText.includes(keyword));
  const atsScore = score(matchedKeywords.length, jobKeywords.length, 45);
  const fitScore = score(matchedKeywords.length, jobKeywords.length, 35);

  const strengths = [
    matchedKeywords.length > 0
      ? `O currículo já conversa com ${matchedKeywords.length} palavras-chave da vaga.`
      : "Há espaço para aproximar melhor a linguagem do currículo da vaga.",
    resume.basics.summary
      ? "O currículo já possui resumo profissional para otimização."
      : "Adicionar um resumo profissional vai ajudar no ranqueamento ATS.",
  ];

  const gaps = [
    missingKeywords.length > 0
      ? `Faltam termos importantes da vaga como: ${missingKeywords.slice(0, 6).join(", ")}.`
      : "Os termos principais da vaga já aparecem no currículo.",
  ];

  const recommendations = [
    `Adapte o resumo para o cargo "${jobTarget.title}".`,
    missingKeywords.length > 0
      ? `Distribua palavras-chave da vaga nas experiências e competências: ${missingKeywords
          .slice(0, 6)
          .join(", ")}.`
      : "Refine os bullets para destacar resultado e contexto da vaga.",
  ];

  if (curation?.focusAreas?.length) {
    recommendations.push(
      `A curadoria sugere reforçar: ${curation.focusAreas.join(", ")}.`
    );
  }

  if (curation?.weakPhrases?.length) {
    recommendations.push(
      `Evite linguagem fraca como: ${curation.weakPhrases.join(", ")}.`
    );
  }

  return {
    atsScore,
    fitScore,
    matchedKeywords,
    missingKeywords,
    strengths,
    gaps,
    recommendations,
  };
}
