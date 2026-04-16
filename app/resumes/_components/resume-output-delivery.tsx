"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  OutputKind,
  OutputRender,
  ResumeKind,
  ResumeStatus,
  ResumeVersion,
} from "@/app/generated/prisma";

type ResumeOutputDeliveryProps = {
  resume: {
    id: string;
    title: string;
    kind: ResumeKind;
    status: ResumeStatus;
    versions: ResumeVersion[];
    outputRenders: (OutputRender & {
      resumeVersion?: {
        id: string;
        versionNumber: number;
      } | null;
    })[];
  };
};

type OutputResponse =
  | {
      success: true;
      requestId: string;
      data: {
        outputId: string;
        kind: OutputKind;
        resumeId: string;
        resumeVersionId: string | null;
        versionNumber: number;
        createdAt: string;
      };
    }
  | {
      success: false;
      requestId: string;
      error: {
        code: string;
        message: string;
      };
    };

export function ResumeOutputDelivery({ resume }: ResumeOutputDeliveryProps) {
  const router = useRouter();
  const [selectedVersionId, setSelectedVersionId] = useState(resume.versions[0]?.id ?? "");
  const [pendingKind, setPendingKind] = useState<OutputKind | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedVersion =
    resume.versions.find((version) => version.id === selectedVersionId) ?? resume.versions[0] ?? null;

  const atsOutput =
    resume.outputRenders.find(
      (item) =>
        item.kind === "ATS" &&
        item.resumeVersionId === selectedVersion?.id &&
        (item.html || item.content)
    ) ?? null;

  const visualOutput =
    resume.outputRenders.find(
      (item) =>
        item.kind === "VISUAL" &&
        item.resumeVersionId === selectedVersion?.id &&
        (item.html || item.content)
    ) ?? null;

  async function generateOutput(kind: OutputKind) {
    if (!selectedVersion) {
      setError("Selecione uma versao valida antes de gerar a saida.");
      return;
    }

    setPendingKind(kind);
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch(`/api/resumes/${resume.id}/outputs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          resumeVersionId: selectedVersion.id,
        }),
      });

      const payload = (await response.json()) as OutputResponse;
      if (!payload.success) {
        setError(payload.error.message);
        return;
      }

      setFeedback(
        kind === "ATS"
          ? `Saida ATS publicada para a versao v${payload.data.versionNumber}.`
          : `Saida visual publicada para a versao v${payload.data.versionNumber}.`
      );
      router.refresh();
    } catch {
      setError("Nao foi possivel publicar a saida agora.");
    } finally {
      setPendingKind(null);
    }
  }

  function downloadHtml(kind: OutputKind, output: OutputRender & { resumeVersion?: { versionNumber: number } | null }) {
    if (!output.html) {
      return;
    }

    const documentHtml = [
      "<!DOCTYPE html>",
      '<html lang="pt-BR">',
      "<head>",
      '<meta charset="utf-8" />',
      '<meta name="viewport" content="width=device-width, initial-scale=1" />',
      `<title>${escapeHtml(`${resume.title} - ${kind}`)}</title>`,
      "<style>body{margin:24px;background:#f7f3eb;}article{max-width:920px;margin:0 auto;}</style>",
      "</head>",
      "<body>",
      output.html,
      "</body>",
      "</html>",
    ].join("");

    const blob = new Blob([documentHtml], { type: "text/html;charset=utf-8" });
    triggerDownload(blob, buildFilename(resume.title, kind, output.resumeVersion?.versionNumber, "html"));
  }

  function downloadJson(kind: OutputKind, output: OutputRender & { resumeVersion?: { versionNumber: number } | null }) {
    if (!output.content) {
      return;
    }

    const blob = new Blob([JSON.stringify(output.content, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    triggerDownload(blob, buildFilename(resume.title, kind, output.resumeVersion?.versionNumber, "json"));
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-6 shadow-[0_16px_48px_rgba(58,42,26,0.07)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
              Fluxo de entrega
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-stone-950">
              Publicar saidas ATS e Visual
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">
              Escolha a versao de origem, gere a saida persistida e baixe o artefato
              em HTML ou JSON para validar o fluxo final antes do teste ponta a ponta.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/resumes/${resume.id}`}
              className="inline-flex items-center rounded-full border border-stone-900/10 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-900/5"
            >
              Voltar ao curriculo
            </Link>
            <Link
              href="/resumes"
              className="inline-flex items-center rounded-full border border-stone-900/10 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-900/5"
            >
              Biblioteca
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.4rem] border border-stone-900/10 bg-stone-50/80 p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              Versao de origem
            </label>
            <select
              value={selectedVersionId}
              onChange={(event) => setSelectedVersionId(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-stone-900/10 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-900/30"
            >
              {resume.versions.map((version) => (
                <option key={version.id} value={version.id}>
                  {`v${version.versionNumber} - ${formatTimestamp(version.createdAt)}`}
                </option>
              ))}
            </select>
            <div className="mt-4 space-y-2 text-sm text-stone-600">
              <p>
                <span className="font-medium text-stone-900">Curriculo:</span> {resume.title}
              </p>
              <p>
                <span className="font-medium text-stone-900">Versao ativa:</span>{" "}
                {selectedVersion ? `v${selectedVersion.versionNumber}` : "Nao definida"}
              </p>
              {selectedVersion?.notes ? (
                <p>
                  <span className="font-medium text-stone-900">Notas:</span> {selectedVersion.notes}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            {feedback ? (
              <div className="rounded-[1.1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {feedback}
              </div>
            ) : null}
            {error ? (
              <div className="rounded-[1.1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            <div className="rounded-[1.4rem] border border-stone-900/10 bg-white p-4 text-sm leading-7 text-stone-600">
              <p className="font-medium text-stone-900">Passos restantes para teste efetivo</p>
              <p className="mt-2">
                Depois desta tela, faltam basicamente dois passos: validar a sessao real
                do usuario com geracao ponta a ponta e conferir o download/exportacao dos
                artefatos finais em uma rodada manual.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <OutputDeliveryCard
          title="ATS"
          description="Saida otimizada para ATS, validacao automatizada e subida em plataformas."
          output={atsOutput}
          pending={pendingKind === "ATS"}
          onGenerate={() => generateOutput("ATS")}
          onDownloadHtml={atsOutput ? () => downloadHtml("ATS", atsOutput) : null}
          onDownloadJson={atsOutput ? () => downloadJson("ATS", atsOutput) : null}
        />

        <OutputDeliveryCard
          title="Visual"
          description="Saida pensada para compartilhamento direto, envio manual e leitura humana."
          output={visualOutput}
          pending={pendingKind === "VISUAL"}
          onGenerate={() => generateOutput("VISUAL")}
          onDownloadHtml={visualOutput ? () => downloadHtml("VISUAL", visualOutput) : null}
          onDownloadJson={visualOutput?.content ? () => downloadJson("VISUAL", visualOutput) : null}
        />
      </section>
    </div>
  );
}

function OutputDeliveryCard({
  title,
  description,
  output,
  pending,
  onGenerate,
  onDownloadHtml,
  onDownloadJson,
}: {
  title: string;
  description: string;
  output: (OutputRender & {
    resumeVersion?: {
      id: string;
      versionNumber: number;
    } | null;
  }) | null;
  pending: boolean;
  onGenerate: () => void;
  onDownloadHtml: (() => void) | null;
  onDownloadJson: (() => void) | null;
}) {
  return (
    <article className="rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-6 shadow-[0_16px_48px_rgba(58,42,26,0.07)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            Saida {title}
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-stone-950">{title}</h2>
        </div>
        <span className="rounded-full border border-stone-900/10 bg-stone-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700">
          {output ? "Publicada" : "Pendente"}
        </span>
      </div>

      <p className="mt-3 text-sm leading-7 text-stone-600">{description}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onGenerate}
          disabled={pending}
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-50 transition hover:bg-stone-800 disabled:opacity-50"
        >
          {pending ? "Publicando..." : output ? "Gerar novamente" : "Gerar saida"}
        </button>
        {onDownloadHtml ? (
          <button
            type="button"
            onClick={onDownloadHtml}
            className="rounded-full border border-stone-900/10 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-900/5"
          >
            Baixar HTML
          </button>
        ) : null}
        {onDownloadJson ? (
          <button
            type="button"
            onClick={onDownloadJson}
            className="rounded-full border border-stone-900/10 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-900/5"
          >
            Baixar JSON
          </button>
        ) : null}
      </div>

      {output ? (
        <div className="mt-4 grid gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
          <p>{`Versao de origem: v${output.resumeVersion?.versionNumber ?? "?"}`}</p>
          <p>{`Ultima publicacao: ${formatTimestamp(output.createdAt)}`}</p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-stone-500">
          Ainda nao existe uma saida publicada para a versao selecionada.
        </p>
      )}

      <div className="mt-5 rounded-[1.4rem] border border-stone-900/10 bg-stone-50/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
          Preview completo
        </p>
        {output?.html ? (
          <div
            className="mt-4 rounded-[1.2rem] border border-stone-900/10 bg-white p-4"
            dangerouslySetInnerHTML={{ __html: output.html }}
          />
        ) : (
          <div className="mt-4 rounded-[1.2rem] border border-dashed border-stone-900/15 bg-white/70 p-6 text-sm leading-7 text-stone-500">
            Gere esta saida para visualizar o artefato completo da versao selecionada.
          </div>
        )}
      </div>
    </article>
  );
}

function buildFilename(
  resumeTitle: string,
  kind: OutputKind,
  versionNumber: number | undefined,
  extension: "html" | "json"
) {
  const safeTitle = resumeTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeTitle || "resume"}-${kind.toLowerCase()}-v${versionNumber ?? 0}.${extension}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatTimestamp(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
