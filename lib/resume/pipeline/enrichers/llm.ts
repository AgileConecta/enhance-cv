import {
  LlmEnrichmentSchema,
  type LlmEnrichment,
} from "@/lib/schemas/json-resume.schema";
import {
  redactResumeTextForLlm,
  type RedactionSummary,
} from "@/lib/resume/pipeline/enrichers/pii-redaction";
import type { JsonResume } from "@/types/json-resume";

const SYSTEM_PROMPT = `Você é um parser especializado em currículos brasileiros.
Dado o texto bruto de um currículo e o resultado parcial já extraído por regex,
sua tarefa é extrair e enriquecer os campos que o parser genérico não conseguiu capturar.

Regras:
- Datas: sempre em formato YYYY-MM ou YYYY. Use "Present" para cargos atuais.
- highlights: siga o padrão "Ação + Tecnologia + Resultado mensurável"
- skills: agrupe por categoria
- languages: inclua apenas idiomas com fluência mencionada no texto
- certificates: inclua certificações com nome, emissor e ano se disponível
- Responda APENAS com JSON válido, sem texto adicional.`;

function buildUserPrompt(rawText: string): string {
  const textToUse = rawText.length > 24000 ? rawText.slice(0, 24000) : rawText;

  return `Extraia do texto bruto abaixo os seguintes campos estruturados em JSON:
1. work[]
2. skills[]
3. languages[]
4. certificates[]

IMPORTANTE:
- Se não houver dados para uma seção, retorne []
- Datas sempre em formato YYYY-MM, YYYY ou "Present"
- Não invente dados

Texto bruto:
${textToUse}`;
}

function mergeEnrichment(base: JsonResume, enriched: LlmEnrichment): JsonResume {
  const useWork =
    enriched.work.length > 0 &&
    enriched.work.length >= (base.work?.length ?? 0);
  const useSkills =
    enriched.skills.length > 0 &&
    enriched.skills.length >= (base.skills?.length ?? 0);

  return {
    ...base,
    work: useWork
      ? enriched.work.map((item) => ({
          ...item,
          highlights: item.highlights ?? [],
        }))
      : base.work,
    skills: useSkills
      ? enriched.skills.map((item) => ({
          ...item,
          keywords: item.keywords ?? [],
        }))
      : base.skills,
    languages:
      enriched.languages.length > 0 ? enriched.languages : base.languages,
    certificates:
      enriched.certificates.length > 0
        ? enriched.certificates
        : base.certificates,
  };
}

export interface ResumeLlmEnrichmentResult {
  resume: JsonResume;
  redactionApplied: boolean;
  redactionSummary: RedactionSummary;
}

export async function enrichResumeWithLLM(
  rawText: string,
  partial: JsonResume
): Promise<ResumeLlmEnrichmentResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const redacted = redactResumeTextForLlm(rawText);

  if (!apiKey) {
    return {
      resume: partial,
      redactionApplied: false,
      redactionSummary: redacted.summary,
    };
  }

  try {
    const { ChatOpenAI } = await import("@langchain/openai");

    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0,
      maxTokens: 2000,
      apiKey,
    });

    const structuredModel = model.withStructuredOutput(LlmEnrichmentSchema, {
      name: "cv_enrichment",
    });

    const enrichment = await structuredModel.invoke([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(redacted.text) },
    ]);

    const safeEnrichment = LlmEnrichmentSchema.parse(enrichment);
    return {
      resume: mergeEnrichment(partial, safeEnrichment),
      redactionApplied: true,
      redactionSummary: redacted.summary,
    };
  } catch (error) {
    console.error("[resume-enricher]", error);
    return {
      resume: partial,
      redactionApplied: true,
      redactionSummary: redacted.summary,
    };
  }
}
