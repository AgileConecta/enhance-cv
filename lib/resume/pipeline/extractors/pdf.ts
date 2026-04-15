/**
 * Extrai texto de um buffer PDF usando pdfjs-dist (server-side, sem worker).
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs" as string);

  pdfjs.GlobalWorkerOptions.workerSrc = "";

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    type TextItem = { str: string; hasEOL?: boolean };
    const pageText = (textContent.items as Array<TextItem | unknown>)
      .filter(
        (item): item is TextItem =>
          typeof item === "object" && item !== null && "str" in item
      )
      .map((item) => item.str + (item.hasEOL ? "\n" : " "))
      .join("");

    pageTexts.push(pageText);
  }

  return pageTexts.join("\n").replace(/\s{3,}/g, "\n").trim();
}
