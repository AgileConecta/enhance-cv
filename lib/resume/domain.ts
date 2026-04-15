import type { JsonResume } from "@/types/json-resume";

export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

export const SUPPORTED_FILE_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
]);

export type ResumeImportSourceKind =
  | "manual"
  | "file_import"
  | "profile_link"
  | "portal_export"
  | "pasted_text";

export type ResumeImportSourceFormat =
  | "pdf"
  | "doc"
  | "docx"
  | "linkedin_url"
  | "workday_export"
  | "catho_export"
  | "plain_text"
  | "unknown";

export interface ResumeImportInput {
  file?: File | null;
  rawText?: string | null;
  sourceUrl?: string | null;
  title?: string | null;
  enrich?: boolean;
  llmConsent?: boolean;
}

export interface ResumeImportSourceDescriptor {
  kind: ResumeImportSourceKind;
  format: ResumeImportSourceFormat;
  label: string;
  sourceUrl?: string;
  originalFilename?: string;
  mimeType?: string;
}

export interface ResumeImportMeta {
  title: string;
  extractedChars: number;
  llmEnriched: boolean;
  llmConsentProvided: boolean;
  llmRedactionApplied: boolean;
  llmRedactionSummary?: {
    emails: number;
    phones: number;
    urls: number;
    documents: number;
  };
  validationOk: boolean;
  validationIssues: string[];
  source: ResumeImportSourceDescriptor;
  connectorReady: boolean;
}

export interface ResumeImportResult {
  resume: JsonResume;
  rawText: string;
  meta: ResumeImportMeta;
}

export interface JobTargetInput {
  title: string;
  description: string;
  company?: string;
}

export interface CurationGuidance {
  targetRole?: string;
  seniority?: string;
  preferredKeywords?: string[];
  weakPhrases?: string[];
  focusAreas?: string[];
}

export interface ResumeAnalysisResult {
  atsScore: number;
  fitScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}
