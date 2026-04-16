"use client";

import { useCallback, useState } from "react";
import type { JsonResume } from "@/types/json-resume";

type ParseSuccess = {
  success: true;
  requestId: string;
  data: {
    resume: JsonResume;
    savedId: string | null;
    meta: {
      filename: string;
      size: number;
      type: string;
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
      connectorReady: boolean;
      source: {
        kind: string;
        format: string;
        label: string;
        sourceUrl?: string;
        originalFilename?: string;
        mimeType?: string;
      };
    };
  };
};

type ParseFailure = {
  success: false;
  requestId: string;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

type ParseResult = ParseSuccess | ParseFailure;

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enrich, setEnrich] = useState(false);
  const [llmConsent, setLlmConsent] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);

  const handleFile = (nextFile: File) => {
    setFile(nextFile);
    setResult(null);
  };

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name.replace(/\.[^.]+$/, ""));
    formData.append("enrich", enrich ? "true" : "false");
    formData.append("llmConsent", llmConsent ? "true" : "false");

    try {
      const response = await fetch("/api/parse-cv", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as ParseResult;
      setResult(payload);
    } catch {
      setResult({
        success: false,
        requestId: "client",
        error: {
          code: "NETWORK_ERROR",
          message: "Erro de conexao com o servidor.",
        },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-3xl font-bold text-stone-950">ENHANCE_CV - Upload</h1>
        <p className="mb-8 text-stone-600">
          Teste o pipeline legado de importacao com o contrato novo da API.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`cursor-pointer rounded-[1.6rem] border-2 border-dashed p-10 text-center transition-colors ${
              dragging
                ? "border-emerald-600 bg-emerald-50"
                : "border-stone-300 bg-white/85 hover:border-stone-400"
            }`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(event) => {
                const nextFile = event.target.files?.[0];
                if (nextFile) handleFile(nextFile);
              }}
            />
            <div className="mb-3 text-4xl">Arquivo</div>
            {file ? (
              <div>
                <p className="font-medium text-stone-800">{file.name}</p>
                <p className="mt-1 text-sm text-stone-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-stone-700">
                  Arraste o curriculo aqui ou clique para selecionar
                </p>
                <p className="mt-1 text-sm text-stone-500">PDF, DOCX, DOC ou TXT - max. 10 MB</p>
              </div>
            )}
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-stone-900/10 bg-white/75 px-4 py-3 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={enrich}
              onChange={(event) => setEnrich(event.target.checked)}
              className="h-4 w-4 rounded border-stone-300"
            />
            <span>Enriquecer com IA quando houver consentimento.</span>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-stone-900/10 bg-white/75 px-4 py-3 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={llmConsent}
              onChange={(event) => setLlmConsent(event.target.checked)}
              className="h-4 w-4 rounded border-stone-300"
            />
            <span>Autorizo o envio de uma versao redigida do curriculo para enrichment.</span>
          </label>

          <button
            type="submit"
            disabled={!file || loading || (enrich && !llmConsent)}
            className="w-full rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Processando..." : "Extrair dados do curriculo"}
          </button>
        </form>

        {result && (
          <div className="mt-8">
            {!result.success ? (
              <div className="rounded-[1.2rem] border border-red-200 bg-red-50 p-4 text-red-700">
                {result.error.message}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  <div>
                    Processado com sucesso - {result.data.meta.extractedChars.toLocaleString()} caracteres extraidos
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-emerald-700">
                    <span>IA: {result.data.meta.llmEnriched ? "Ativa" : "Desligada"}</span>
                    <span>Consentimento: {result.data.meta.llmConsentProvided ? "Sim" : "Nao"}</span>
                    <span>Redaction: {result.data.meta.llmRedactionApplied ? "Aplicada" : "Nao"}</span>
                    <span>
                      Schema: {result.data.meta.validationOk ? "Valido" : `${result.data.meta.validationIssues.length} avisos`}
                    </span>
                  </div>
                </div>

                {result.data.resume.basics && (
                  <Section title="Dados pessoais">
                    <Field label="Nome" value={result.data.resume.basics.name} />
                    <Field label="Email" value={result.data.resume.basics.email} />
                    <Field label="Telefone" value={result.data.resume.basics.phone} />
                    <Field label="Resumo" value={result.data.resume.basics.summary} />
                  </Section>
                )}

                {(result.data.resume.work?.length ?? 0) > 0 && (
                  <Section title={`Experiencia (${result.data.resume.work!.length})`}>
                    {result.data.resume.work!.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="mb-3 border-b border-stone-100 pb-3 last:border-0"
                      >
                        <p className="font-medium text-stone-900">{item.name}</p>
                        {item.position ? <p className="text-sm text-stone-600">{item.position}</p> : null}
                        {(item.startDate || item.endDate) && (
                          <p className="mt-1 text-xs text-stone-500">
                            {item.startDate} {item.endDate ? `-> ${item.endDate}` : ""}
                          </p>
                        )}
                      </div>
                    ))}
                  </Section>
                )}

                {(result.data.resume.education?.length ?? 0) > 0 && (
                  <Section title={`Formacao (${result.data.resume.education!.length})`}>
                    {result.data.resume.education!.map((item, index) => (
                      <div key={`${item.institution}-${index}`} className="mb-2">
                        <p className="font-medium text-stone-900">{item.institution}</p>
                        {item.studyType ? <p className="text-sm text-stone-600">{item.studyType}</p> : null}
                        {item.area ? <p className="text-sm text-stone-500">{item.area}</p> : null}
                      </div>
                    ))}
                  </Section>
                )}

                {(result.data.resume.skills?.length ?? 0) > 0 && (
                  <Section title="Habilidades">
                    {result.data.resume.skills!.map((item, index) => (
                      <div key={`${item.name}-${index}`} className="mb-2">
                        <span className="text-sm font-medium text-stone-900">{item.name}: </span>
                        <span className="text-sm text-stone-600">{item.keywords?.join(", ")}</span>
                      </div>
                    ))}
                  </Section>
                )}

                {(result.data.resume.languages?.length ?? 0) > 0 && (
                  <Section title="Idiomas">
                    <div className="flex flex-wrap gap-2">
                      {result.data.resume.languages!.map((item, index) => (
                        <span
                          key={`${item.language}-${index}`}
                          className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-700"
                        >
                          {item.language}
                          {item.fluency ? ` - ${item.fluency}` : ""}
                        </span>
                      ))}
                    </div>
                  </Section>
                )}

                <details className="overflow-hidden rounded-[1.2rem] bg-stone-950">
                  <summary className="cursor-pointer px-4 py-3 text-sm text-stone-300 hover:text-white">
                    Ver JSON Resume completo
                  </summary>
                  <pre className="max-h-96 overflow-auto px-4 pb-4 text-xs text-emerald-300">
                    {JSON.stringify(result.data.resume, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.2rem] border border-stone-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div className="mb-2">
      <span className="text-xs uppercase text-stone-400">{label}: </span>
      <span className="text-sm text-stone-800">{value}</span>
    </div>
  );
}
