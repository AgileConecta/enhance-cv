"use client";

import { useState } from "react";
import type { JsonResume } from "@/types/json-resume";

type ApiEnvelope<T> =
  | { success: true; requestId: string; data: T }
  | {
      success: false;
      requestId: string;
      error: { code: string; message: string; details?: unknown };
    };

type ManualCreateResponse = {
  resumeId: string;
  versionId: string | null;
};

type ImportResponse = {
  resume: JsonResume;
  savedId: string;
  meta: {
    title: string;
    extractedChars: number;
    llmEnriched: boolean;
    llmConsentProvided: boolean;
    llmRedactionApplied: boolean;
    validationOk: boolean;
    validationIssues: string[];
    source: {
      kind: string;
      format: string;
      label: string;
      sourceUrl?: string;
      originalFilename?: string;
      mimeType?: string;
    };
    connectorReady: boolean;
  };
};

const blankResume: JsonResume = {
  basics: {
    name: "",
    label: "",
    email: "",
    phone: "",
    summary: "",
    profiles: [],
  },
  work: [],
  education: [],
  skills: [],
  languages: [],
  certificates: [],
  projects: [],
};

export function NewResumeWorkbench() {
  const [mode, setMode] = useState<"manual" | "import">("manual");
  const [manualTitle, setManualTitle] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualLabel, setManualLabel] = useState("");
  const [manualSummary, setManualSummary] = useState("");
  const [manualSkills, setManualSkills] = useState("");
  const [manualResult, setManualResult] = useState<ApiEnvelope<ManualCreateResponse> | null>(
    null
  );
  const [manualLoading, setManualLoading] = useState(false);

  const [importTitle, setImportTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [enrich, setEnrich] = useState(false);
  const [llmConsent, setLlmConsent] = useState(false);
  const [importResult, setImportResult] = useState<ApiEnvelope<ImportResponse> | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  const manualResume: JsonResume = {
    ...blankResume,
    basics: {
      ...blankResume.basics,
      name: manualName.trim(),
      label: manualLabel.trim() || undefined,
      email: manualEmail.trim() || undefined,
      phone: manualPhone.trim() || undefined,
      summary: manualSummary.trim() || undefined,
    },
    skills: manualSkills
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((skill) => ({ name: skill, keywords: [] })),
  };

  async function handleManualSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setManualLoading(true);
    setManualResult(null);

    try {
      const response = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: manualTitle.trim(),
          summary: manualSummary.trim() || undefined,
          resume: manualResume,
        }),
      });

      const payload = (await response.json()) as ApiEnvelope<ManualCreateResponse>;
      setManualResult(payload);
    } catch {
      setManualResult({
        success: false,
        requestId: "client",
        error: {
          code: "NETWORK_ERROR",
          message: "Nao foi possivel criar o curriculo agora.",
        },
      });
    } finally {
      setManualLoading(false);
    }
  }

  async function handleImportSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setImportLoading(true);
    setImportResult(null);

    const formData = new FormData();
    if (file) formData.append("file", file);
    if (rawText.trim()) formData.append("rawText", rawText.trim());
    if (sourceUrl.trim()) formData.append("sourceUrl", sourceUrl.trim());
    if (importTitle.trim()) formData.append("title", importTitle.trim());
    formData.append("enrich", enrich ? "true" : "false");
    formData.append("llmConsent", llmConsent ? "true" : "false");

    try {
      const response = await fetch("/api/resumes/import", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as ApiEnvelope<ImportResponse>;
      setImportResult(payload);
    } catch {
      setImportResult({
        success: false,
        requestId: "client",
        error: {
          code: "NETWORK_ERROR",
          message: "Nao foi possivel importar o curriculo agora.",
        },
      });
    } finally {
      setImportLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[1.8rem] border border-stone-900/10 bg-white/75 p-6">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === "manual"
                ? "bg-stone-900 text-stone-50"
                : "border border-stone-900/10 bg-white text-stone-700 hover:bg-stone-900/5"
            }`}
          >
            Criacao manual
          </button>
          <button
            type="button"
            onClick={() => setMode("import")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === "import"
                ? "bg-stone-900 text-stone-50"
                : "border border-stone-900/10 bg-white text-stone-700 hover:bg-stone-900/5"
            }`}
          >
            Importacao
          </button>
        </div>
      </section>

      {mode === "manual" ? (
        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <form
            onSubmit={handleManualSubmit}
            className="rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-6 shadow-[0_14px_48px_rgba(60,44,28,0.08)]"
          >
            <h2 className="text-2xl font-semibold text-stone-950">Criar curriculo base</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Comece com um curriculo base valido em JSON Resume e evolua para editor completo nas proximas iteracoes.
            </p>

            <div className="mt-6 space-y-4">
              <Field label="Titulo interno" required>
                <input
                  value={manualTitle}
                  onChange={(event) => setManualTitle(event.target.value)}
                  className="w-full rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
                  placeholder="Ex.: Curriculo base 2026"
                />
              </Field>
              <Field label="Nome completo" required>
                <input
                  value={manualName}
                  onChange={(event) => setManualName(event.target.value)}
                  className="w-full rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
                  placeholder="Seu nome"
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Email">
                  <input
                    value={manualEmail}
                    onChange={(event) => setManualEmail(event.target.value)}
                    className="w-full rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
                    placeholder="voce@email.com"
                  />
                </Field>
                <Field label="Telefone">
                  <input
                    value={manualPhone}
                    onChange={(event) => setManualPhone(event.target.value)}
                    className="w-full rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
                    placeholder="(11) 99999-9999"
                  />
                </Field>
              </div>
              <Field label="Cargo alvo">
                <input
                  value={manualLabel}
                  onChange={(event) => setManualLabel(event.target.value)}
                  className="w-full rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
                  placeholder="Ex.: Analista de Dados Senior"
                />
              </Field>
              <Field label="Resumo profissional">
                <textarea
                  value={manualSummary}
                  onChange={(event) => setManualSummary(event.target.value)}
                  className="min-h-32 w-full rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
                  placeholder="Resumo curto para o curriculo base"
                />
              </Field>
              <Field label="Skills principais">
                <input
                  value={manualSkills}
                  onChange={(event) => setManualSkills(event.target.value)}
                  className="w-full rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
                  placeholder="SQL, Python, Power BI"
                />
              </Field>
            </div>

            <button
              type="submit"
              disabled={manualLoading || !manualTitle.trim() || !manualName.trim()}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {manualLoading ? "Criando..." : "Salvar curriculo base"}
            </button>

            {manualResult && (
              <FeedbackCard
                success={manualResult.success}
                message={
                  manualResult.success
                    ? `Curriculo criado com sucesso. Resume ${manualResult.data.resumeId}.`
                    : manualResult.error.message
                }
              />
            )}
          </form>

          <PreviewCard
            eyebrow="Preview estruturado"
            title="JSON Resume inicial"
            description="Este payload inicial ja respeita o schema do backend e serve como base para a proxima camada de edicao."
            content={JSON.stringify(manualResume, null, 2)}
          />
        </section>
      ) : (
        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <form
            onSubmit={handleImportSubmit}
            className="rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-6 shadow-[0_14px_48px_rgba(60,44,28,0.08)]"
          >
            <h2 className="text-2xl font-semibold text-stone-950">Importar curriculo existente</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Arquivo, texto colado ou link de perfil entram na mesma pipeline de importacao e normalizacao.
            </p>

            <div className="mt-6 space-y-4">
              <Field label="Titulo interno">
                <input
                  value={importTitle}
                  onChange={(event) => setImportTitle(event.target.value)}
                  className="w-full rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
                  placeholder="Opcional. Se vazio, o backend gera pelo arquivo ou origem."
                />
              </Field>
              <Field label="Arquivo">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  className="w-full rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 text-sm outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-stone-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-stone-50"
                />
              </Field>
              <Field label="Texto colado">
                <textarea
                  value={rawText}
                  onChange={(event) => setRawText(event.target.value)}
                  className="min-h-32 w-full rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
                  placeholder="Cole aqui o texto do curriculo se preferir importar sem arquivo."
                />
              </Field>
              <Field label="Link de perfil">
                <input
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  className="w-full rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-900/30"
                  placeholder="https://www.linkedin.com/in/seu-perfil"
                />
              </Field>
              <label className="flex items-start gap-3 rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={enrich}
                  onChange={(event) => setEnrich(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-stone-300"
                />
                <span>
                  Enriquecer com IA quando disponivel.
                  <span className="block text-xs text-stone-500">
                    Requer consentimento explicito e redaction antes do envio.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={llmConsent}
                  onChange={(event) => setLlmConsent(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-stone-300"
                />
                <span>
                  Autorizo o envio de uma versao redigida do texto para enrichment.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={
                importLoading ||
                (!file && !rawText.trim() && !sourceUrl.trim()) ||
                (enrich && !llmConsent)
              }
              className="mt-6 inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importLoading ? "Importando..." : "Importar curriculo"}
            </button>

            {importResult && (
              <FeedbackCard
                success={importResult.success}
                message={
                  importResult.success
                    ? `Importacao concluida via ${importResult.data.meta.source.label}.`
                    : importResult.error.message
                }
              />
            )}
          </form>

          <PreviewCard
            eyebrow="Resultado da pipeline"
            title="Saida normalizada"
            description="Ao importar, voce ja enxerga a estrutura normalizada e os metadados da origem para validar o comportamento da pipeline."
            content={
              importResult?.success
                ? JSON.stringify(importResult.data, null, 2)
                : JSON.stringify(
                    {
                      expectedSources: ["file", "rawText", "sourceUrl"],
                      accepts: ["pdf", "docx", "doc", "txt", "linkedin_url"],
                      nextStep: "Conectar a biblioteca e depois abrir fluxo de adaptacao por vaga.",
                    },
                    null,
                    2
                  )
            }
          />
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-stone-700">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}

function FeedbackCard({ success, message }: { success: boolean; message: string }) {
  return (
    <div
      className={`mt-6 rounded-[1.2rem] border px-4 py-3 text-sm ${
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {message}
    </div>
  );
}

function PreviewCard({
  eyebrow,
  title,
  description,
  content,
}: {
  eyebrow: string;
  title: string;
  description: string;
  content: string;
}) {
  return (
    <aside className="rounded-[1.8rem] border border-stone-900/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(243,237,226,0.95))] p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
        {eyebrow}
      </p>
      <h3 className="mt-3 text-2xl font-semibold text-stone-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-stone-600">{description}</p>
      <pre className="mt-6 max-h-[36rem] overflow-auto rounded-[1.3rem] bg-stone-950 p-4 text-xs leading-6 text-emerald-300">
        {content}
      </pre>
    </aside>
  );
}
