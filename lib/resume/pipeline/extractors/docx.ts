import mammoth from "mammoth";

/**
 * Extrai texto puro de um buffer DOCX usando mammoth.
 */
export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });

  if (result.messages.length > 0) {
    const warnings = result.messages.filter((message) => message.type === "warning");
    if (warnings.length > 0) {
      console.warn("[extract-docx] warnings:", warnings);
    }
  }

  return result.value.replace(/\s{3,}/g, "\n").trim();
}
