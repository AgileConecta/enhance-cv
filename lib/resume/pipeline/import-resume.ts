import {
  MAX_UPLOAD_SIZE,
  SUPPORTED_FILE_TYPES,
  type ResumeImportInput,
  type ResumeImportResult,
  type ResumeImportSourceDescriptor,
} from "@/lib/resume/domain";
import { extractTextFromPdf } from "@/lib/resume/pipeline/extractors/pdf";
import { extractTextFromDocx } from "@/lib/resume/pipeline/extractors/docx";
import { textToResume } from "@/lib/resume/pipeline/parsers/generic-text-to-resume";
import { enrichResumeWithLLM } from "@/lib/resume/pipeline/enrichers/llm";
import { JsonResumeSchema } from "@/lib/schemas/json-resume.schema";
import {
  detectProfileUrlSource,
  profileUrlToSeedResume,
} from "@/lib/resume/pipeline/connectors/profile-url";

function buildTitle(
  input: ResumeImportInput,
  source: ResumeImportSourceDescriptor
): string {
  if (input.title?.trim()) return input.title.trim();
  if (source.originalFilename) return source.originalFilename.replace(/\.[^.]+$/, "");
  if (source.sourceUrl) return source.sourceUrl;
  return "Novo currículo";
}

function fileSourceDescriptor(file: File): ResumeImportSourceDescriptor {
  switch (file.type) {
    case "application/pdf":
      return {
        kind: "file_import",
        format: "pdf",
        label: "PDF import",
        originalFilename: file.name,
        mimeType: file.type,
      };
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return {
        kind: "file_import",
        format: "docx",
        label: "DOCX import",
        originalFilename: file.name,
        mimeType: file.type,
      };
    case "application/msword":
      return {
        kind: "file_import",
        format: "doc",
        label: "DOC import",
        originalFilename: file.name,
        mimeType: file.type,
      };
    case "text/plain":
      return {
        kind: "file_import",
        format: "plain_text",
        label: "Plain text import",
        originalFilename: file.name,
        mimeType: file.type,
      };
    default:
      return {
        kind: "file_import",
        format: "unknown",
        label: "File import",
        originalFilename: file.name,
        mimeType: file.type,
      };
  }
}

async function fileToText(
  file: File,
  source: ResumeImportSourceDescriptor
): Promise<string> {
  if (!SUPPORTED_FILE_TYPES.has(file.type)) {
    throw new Error("Formato inválido. Envie PDF, DOCX ou texto puro.");
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error("Arquivo muito grande. Máximo: 10 MB.");
  }

  if (source.format === "doc") {
    throw new Error("Arquivos DOC binários ainda não são suportados nesta etapa.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (source.format === "pdf") return extractTextFromPdf(buffer);
  if (source.format === "docx") return extractTextFromDocx(buffer);

  return buffer.toString("utf8").trim();
}

export async function importResume(
  input: ResumeImportInput
): Promise<ResumeImportResult> {
  let source: ResumeImportSourceDescriptor;
  let rawText = "";
  let resume = textToResume("");
  let connectorReady = true;

  if (input.file) {
    source = fileSourceDescriptor(input.file);
    rawText = await fileToText(input.file, source);
    if (!rawText || rawText.trim().length < 50) {
      throw new Error(
        "Não foi possível extrair texto útil. PDFs escaneados ou exportações muito visuais ainda não são suportados."
      );
    }
    resume = textToResume(rawText);
  } else if (input.rawText?.trim()) {
    source = {
      kind: "pasted_text",
      format: "plain_text",
      label: "Pasted text",
    };
    rawText = input.rawText.trim();
    resume = textToResume(rawText);
  } else if (input.sourceUrl?.trim()) {
    source = detectProfileUrlSource(input.sourceUrl);
    rawText = input.sourceUrl.trim();
    resume = profileUrlToSeedResume(input.sourceUrl);
    connectorReady = source.format === "linkedin_url";
  } else {
    throw new Error("Nenhuma origem enviada para importação.");
  }

  const llmEnriched = Boolean(input.enrich && process.env.OPENAI_API_KEY && rawText);
  const llmConsentProvided = Boolean(input.llmConsent);
  const shouldUseLlm = Boolean(
    input.enrich && input.llmConsent && process.env.OPENAI_API_KEY && rawText
  );
  const llmResult = shouldUseLlm
    ? await enrichResumeWithLLM(rawText, resume)
    : {
        resume,
        redactionApplied: false,
        redactionSummary: {
          emails: 0,
          phones: 0,
          urls: 0,
          documents: 0,
        },
      };
  const enrichedResume = llmResult.resume;

  const validation = JsonResumeSchema.safeParse(enrichedResume);
  const validatedResume = validation.success ? validation.data : enrichedResume;
  const validationIssues = validation.success
    ? []
    : validation.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`
      );

  return {
    resume: validatedResume,
    rawText,
    meta: {
      title: buildTitle(input, source),
      extractedChars: rawText.length,
      llmEnriched: shouldUseLlm,
      llmConsentProvided,
      llmRedactionApplied: llmResult.redactionApplied,
      llmRedactionSummary: llmResult.redactionSummary,
      validationOk: validation.success,
      validationIssues,
      source,
      connectorReady,
    },
  };
}
