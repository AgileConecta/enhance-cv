export interface RedactionSummary {
  emails: number;
  phones: number;
  urls: number;
  documents: number;
}

export interface RedactionResult {
  text: string;
  summary: RedactionSummary;
}

const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_REGEX =
  /(?:(?:\+|00)\d{1,3}[\s.-]*)?(?:\(?\d{2,3}\)?[\s.-]*)?(?:\d[\s.-]*){8,13}\d/g;
const URL_REGEX = /\b(?:https?:\/\/|www\.)[^\s]+/gi;
const DOCUMENT_REGEX =
  /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b|\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g;

function replaceAndCount(
  input: string,
  pattern: RegExp,
  replacement: string
): { value: string; count: number } {
  let count = 0;
  const value = input.replace(pattern, () => {
    count += 1;
    return replacement;
  });

  return { value, count };
}

export function redactResumeTextForLlm(rawText: string): RedactionResult {
  const emailStep = replaceAndCount(rawText, EMAIL_REGEX, "[REDACTED_EMAIL]");
  const phoneStep = replaceAndCount(emailStep.value, PHONE_REGEX, "[REDACTED_PHONE]");
  const urlStep = replaceAndCount(phoneStep.value, URL_REGEX, "[REDACTED_URL]");
  const documentStep = replaceAndCount(
    urlStep.value,
    DOCUMENT_REGEX,
    "[REDACTED_DOCUMENT]"
  );

  return {
    text: documentStep.value,
    summary: {
      emails: emailStep.count,
      phones: phoneStep.count,
      urls: urlStep.count,
      documents: documentStep.count,
    },
  };
}
