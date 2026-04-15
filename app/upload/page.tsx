"use client";

import { useState, useCallback } from "react";
import type { JsonResume } from "@/types/json-resume";

type ParseResult = {
  success: boolean;
  resume?: JsonResume;
  savedId?: string | null;
  meta?: {
    filename: string;
    size: number;
    type: string;
    extractedChars: number;
    llmEnriched: boolean;
    validationOk: boolean;
    validationIssues: string[];
  };
  error?: string;
};

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enrich, setEnrich] = useState(false);
  const [llmConsent, setLlmConsent] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name.replace(/\.[^.]+$/, ""));
    formData.append("enrich", enrich ? "true" : "false");
    formData.append("llmConsent", llmConsent ? "true" : "false");

    try {
      const res = await fetch("/api/parse-cv", {
        method: "POST",
        body: formData,
      });
      const data: ParseResult = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, error: "Erro de conexão com o servidor." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ENHANCE_CV — Parsing
        </h1>
        <p className="text-gray-500 mb-8">
          Faça upload de um PDF ou DOCX para extrair os dados do currículo.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              dragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400 bg-white"
            }`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={onInputChange}
            />
            <div className="text-4xl mb-3">📄</div>
            {file ? (
              <div>
                <p className="font-medium text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 font-medium">
                  Arraste o currículo aqui ou clique para selecionar
                </p>
                <p className="text-sm text-gray-400 mt-1">PDF ou DOCX — máx. 10 MB</p>
              </div>
            )}
          </div>

          {/* Toggle LLM */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setEnrich((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${enrich ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enrich ? "translate-x-5" : ""}`} />
            </div>
            <span className="text-sm text-gray-700">
              Enriquecer com IA (OpenAI){" "}
              <span className="text-gray-400 text-xs">— requer OPENAI_API_KEY</span>
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={llmConsent}
              onChange={(e) => setLlmConsent(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">
              Autorizo enviar uma versao redigida do curriculo para enriquecimento com IA
            </span>
          </label>

          <button
            type="submit"
            disabled={!file || loading || (enrich && !llmConsent)}
            className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Processando..." : "Extrair dados do currículo"}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className="mt-8">
            {result.error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                ❌ {result.error}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Meta */}
                {result.meta && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700 space-y-1">
                    <div>✅ Processado com sucesso — {result.meta.extractedChars.toLocaleString()} caracteres extraídos</div>
                    <div className="flex gap-4 text-xs text-green-600">
                      <span>🤖 IA: {result.meta.llmEnriched ? "Ativa" : "Desligada"}</span>
                      <span>🛡️ Schema: {result.meta.validationOk ? "Válido" : `${result.meta.validationIssues.length} avisos`}</span>
                    </div>
                    {!result.meta.validationOk && result.meta.validationIssues.length > 0 && (
                      <ul className="text-xs text-yellow-700 mt-1 list-disc list-inside">
                        {result.meta.validationIssues.slice(0, 5).map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Basics */}
                {result.resume?.basics && (
                  <Section title="Dados pessoais">
                    <Field label="Nome" value={result.resume.basics.name} />
                    <Field label="Email" value={result.resume.basics.email} />
                    <Field label="Telefone" value={result.resume.basics.phone} />
                    <Field label="Resumo" value={result.resume.basics.summary} />
                  </Section>
                )}

                {/* Work */}
                {(result.resume?.work?.length ?? 0) > 0 && (
                  <Section title={`Experiência (${result.resume!.work!.length})`}>
                    {result.resume!.work!.map((w, i) => (
                      <div key={i} className="mb-3 pb-3 border-b border-gray-100 last:border-0">
                        <p className="font-medium">{w.name}</p>
                        {w.position && <p className="text-gray-600 text-sm">{w.position}</p>}
                        {(w.startDate || w.endDate) && (
                          <p className="text-gray-400 text-xs mt-0.5">
                            {w.startDate} {w.endDate ? `→ ${w.endDate}` : ""}
                          </p>
                        )}
                      </div>
                    ))}
                  </Section>
                )}

                {/* Education */}
                {(result.resume?.education?.length ?? 0) > 0 && (
                  <Section title={`Formação (${result.resume!.education!.length})`}>
                    {result.resume!.education!.map((e, i) => (
                      <div key={i} className="mb-2">
                        <p className="font-medium">{e.institution}</p>
                        {e.studyType && <p className="text-sm text-gray-600">{e.studyType}</p>}
                        {e.area && <p className="text-sm text-gray-500">{e.area}</p>}
                      </div>
                    ))}
                  </Section>
                )}

                {/* Skills */}
                {(result.resume?.skills?.length ?? 0) > 0 && (
                  <Section title="Habilidades">
                    {result.resume!.skills!.map((s, i) => (
                      <div key={i} className="mb-2">
                        <span className="text-sm font-medium">{s.name}: </span>
                        <span className="text-sm text-gray-600">
                          {s.keywords?.join(", ")}
                        </span>
                      </div>
                    ))}
                  </Section>
                )}

                {/* Languages */}
                {(result.resume?.languages?.length ?? 0) > 0 && (
                  <Section title="Idiomas">
                    <div className="flex flex-wrap gap-2">
                      {result.resume!.languages!.map((l, i) => (
                        <span key={i} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                          {l.language}{l.fluency ? ` · ${l.fluency}` : ""}
                        </span>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Raw JSON */}
                <details className="bg-gray-900 rounded-lg overflow-hidden">
                  <summary className="px-4 py-3 text-gray-300 text-sm cursor-pointer hover:text-white">
                    Ver JSON Resume completo
                  </summary>
                  <pre className="px-4 pb-4 text-xs text-green-400 overflow-auto max-h-96">
                    {JSON.stringify(result.resume, null, 2)}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
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
      <span className="text-xs text-gray-400 uppercase">{label}: </span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}
