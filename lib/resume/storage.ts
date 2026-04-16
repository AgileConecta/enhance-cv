import {
  OutputKind,
  ResumeKind,
  ResumeSourceFormat,
  ResumeSourceKind,
  type Prisma,
} from "@/app/generated/prisma";
import type { AuthenticatedUser } from "@/lib/auth/current-user";
import type {
  ResumeImportResult,
  ResumeImportSourceFormat,
  ResumeImportSourceKind,
} from "@/lib/resume/domain";
import { prisma } from "@/lib/prisma";

async function ensureUserRecord(user: AuthenticatedUser) {
  return prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email,
      name: user.name,
    },
    create: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    select: { id: true },
  });
}

function mapSourceKind(value: ResumeImportSourceKind): ResumeSourceKind {
  switch (value) {
    case "manual":
      return ResumeSourceKind.MANUAL;
    case "profile_link":
      return ResumeSourceKind.PROFILE_LINK;
    case "portal_export":
      return ResumeSourceKind.PORTAL_EXPORT;
    case "pasted_text":
      return ResumeSourceKind.PASTED_TEXT;
    default:
      return ResumeSourceKind.FILE_IMPORT;
  }
}

function mapSourceFormat(value: ResumeImportSourceFormat): ResumeSourceFormat {
  switch (value) {
    case "pdf":
      return ResumeSourceFormat.PDF;
    case "doc":
      return ResumeSourceFormat.DOC;
    case "docx":
      return ResumeSourceFormat.DOCX;
    case "linkedin_url":
      return ResumeSourceFormat.LINKEDIN_URL;
    case "workday_export":
      return ResumeSourceFormat.WORKDAY_EXPORT;
    case "catho_export":
      return ResumeSourceFormat.CATHO_EXPORT;
    case "plain_text":
      return ResumeSourceFormat.PLAIN_TEXT;
    default:
      return ResumeSourceFormat.UNKNOWN;
  }
}

export async function createImportedResume(params: {
  user: AuthenticatedUser;
  result: ResumeImportResult;
  kind?: ResumeKind;
}) {
  const { user, result, kind = ResumeKind.BASE } = params;
  await ensureUserRecord(user);

  return prisma.resume.create({
    data: {
      userId: user.id,
      title: result.meta.title,
      kind,
      summary: result.resume.basics.summary,
      versions: {
        create: {
          versionNumber: 1,
          normalizedData: result.resume as unknown as Prisma.InputJsonValue,
          notes: "Versao inicial importada",
        },
      },
      sources: {
        create: {
          kind: mapSourceKind(result.meta.source.kind),
          format: mapSourceFormat(result.meta.source.format),
          label: result.meta.source.label,
          sourceUrl: result.meta.source.sourceUrl,
          originalFilename: result.meta.source.originalFilename,
          mimeType: result.meta.source.mimeType,
          rawText: result.rawText,
          extractedText: result.rawText,
          metadata: {
            connectorReady: result.meta.connectorReady,
            llmEnriched: result.meta.llmEnriched,
            validationOk: result.meta.validationOk,
            validationIssues: result.meta.validationIssues,
          },
        },
      },
      outputRenders: {
        create: [{ kind: OutputKind.ATS }, { kind: OutputKind.VISUAL }],
      },
    },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
      sources: true,
    },
  });
}

export async function createManualResume(params: {
  user: AuthenticatedUser;
  title: string;
  normalizedData: Prisma.InputJsonValue;
  summary?: string;
}) {
  const { user, title, normalizedData, summary } = params;
  await ensureUserRecord(user);

  return prisma.resume.create({
    data: {
      userId: user.id,
      title,
      kind: ResumeKind.BASE,
      summary,
      versions: {
        create: {
          versionNumber: 1,
          normalizedData,
          notes: "Versao inicial criada manualmente",
        },
      },
      sources: {
        create: {
          kind: ResumeSourceKind.MANUAL,
          format: ResumeSourceFormat.JSON_RESUME,
          label: "Manual authoring",
          metadata: {
            createdFrom: "manual",
          },
        },
      },
      outputRenders: {
        create: [{ kind: OutputKind.ATS }, { kind: OutputKind.VISUAL }],
      },
    },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
      sources: true,
    },
  });
}

export async function createResumeVersion(params: {
  resumeId: string;
  normalizedData: Prisma.InputJsonValue;
  notes?: string;
  editorState?: Prisma.InputJsonValue;
}) {
  const { resumeId, normalizedData, notes, editorState } = params;

  const latestVersion = await prisma.resumeVersion.findFirst({
    where: { resumeId },
    orderBy: { versionNumber: "desc" },
    select: { versionNumber: true },
  });

  const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;

  return prisma.resumeVersion.create({
    data: {
      resumeId,
      versionNumber: nextVersionNumber,
      normalizedData,
      notes,
      editorState,
    },
  });
}

export async function createDerivedResumeVariant(params: {
  user: AuthenticatedUser;
  sourceResumeId: string;
  title: string;
  kind: "TEMPLATE" | "JOB_TAILORED";
  jobTargetId?: string;
  summary?: string;
  notes?: string;
}) {
  const { user, sourceResumeId, title, kind, jobTargetId, summary, notes } = params;
  await ensureUserRecord(user);

  const sourceResume = await prisma.resume.findFirst({
    where: {
      id: sourceResumeId,
      userId: user.id,
    },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!sourceResume || sourceResume.versions.length === 0) {
    throw new Error("Curriculo de origem nao encontrado para derivacao.");
  }

  const latestVersion = sourceResume.versions[0];

  return prisma.resume.create({
    data: {
      userId: user.id,
      title,
      kind,
      status: sourceResume.status,
      summary: summary ?? sourceResume.summary,
      sourceResumeId,
      jobTargetId,
      versions: {
        create: {
          versionNumber: 1,
          normalizedData: latestVersion.normalizedData as unknown as Prisma.InputJsonValue,
          editorState: latestVersion.editorState as Prisma.InputJsonValue | undefined,
          notes: notes ?? "Versao inicial derivada",
        },
      },
      outputRenders: {
        create: [{ kind: OutputKind.ATS }, { kind: OutputKind.VISUAL }],
      },
    },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });
}
