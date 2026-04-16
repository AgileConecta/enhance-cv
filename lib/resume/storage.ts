import {
  OutputKind,
  ResumeKind,
  SuggestionStatus,
  ResumeSourceFormat,
  ResumeSourceKind,
  type Prisma,
} from "@/app/generated/prisma";
import type { AuthenticatedUser } from "@/lib/auth/current-user";
import type {
  CurationGuidance,
  JobTargetInput,
  ResumeAnalysisResult,
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

export async function listResumesForUser(userId: string) {
  return prisma.resume.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
      _count: {
        select: {
          versions: true,
          analyses: true,
          suggestionSets: true,
        },
      },
    },
  });
}

export async function getResumeByIdForUser(userId: string, resumeId: string) {
  return prisma.resume.findFirst({
    where: {
      id: resumeId,
      userId,
    },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 12,
      },
      sources: {
        orderBy: { createdAt: "desc" },
      },
      derivedResumes: {
        orderBy: { updatedAt: "desc" },
        take: 6,
        include: {
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
          },
        },
      },
      analyses: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          jobTarget: true,
        },
      },
      suggestionSets: {
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          jobTarget: true,
        },
      },
      outputRenders: {
        orderBy: { createdAt: "desc" },
        take: 24,
        include: {
          resumeVersion: {
            select: {
              id: true,
              versionNumber: true,
            },
          },
        },
      },
      _count: {
        select: {
          versions: true,
          analyses: true,
          suggestionSets: true,
          derivedResumes: true,
        },
      },
    },
  });
}

export async function getResumeVersionReviewForUser(
  userId: string,
  resumeId: string,
  versionId: string
) {
  const version = await prisma.resumeVersion.findFirst({
    where: {
      id: versionId,
      resumeId,
      resume: {
        userId,
      },
    },
    include: {
      resume: {
        select: {
          id: true,
          title: true,
          kind: true,
          status: true,
          summary: true,
        },
      },
    },
  });

  if (!version) {
    return null;
  }

  const previousVersion =
    version.versionNumber > 1
      ? await prisma.resumeVersion.findFirst({
          where: {
            resumeId,
            versionNumber: version.versionNumber - 1,
          },
        })
      : null;

  const provenance = getEditorStateLinks(version.editorState);

  const linkedAnalysis =
    (provenance.analysisId
      ? await prisma.resumeAnalysis.findFirst({
          where: {
            id: provenance.analysisId,
            resumeId,
          },
          include: {
            jobTarget: true,
          },
        })
      : null) ??
    (provenance.jobTargetId
      ? await prisma.resumeAnalysis.findFirst({
          where: {
            resumeId,
            jobTargetId: provenance.jobTargetId,
          },
          orderBy: { createdAt: "desc" },
          include: {
            jobTarget: true,
          },
        })
      : null);

  const linkedSuggestionSet =
    (provenance.suggestionSetId
      ? await prisma.suggestionSet.findFirst({
          where: {
            id: provenance.suggestionSetId,
            resumeId,
          },
          include: {
            jobTarget: true,
          },
        })
      : null) ??
    (provenance.jobTargetId
      ? await prisma.suggestionSet.findFirst({
          where: {
            resumeId,
            jobTargetId: provenance.jobTargetId,
          },
          orderBy: { createdAt: "desc" },
          include: {
            jobTarget: true,
          },
        })
      : null);

  const siblingVersions = await prisma.resumeVersion.findMany({
    where: {
      resumeId,
    },
    orderBy: { versionNumber: "desc" },
    select: {
      id: true,
      versionNumber: true,
      createdAt: true,
      notes: true,
      editorState: true,
    },
  });

  const reviewOutputs = siblingVersions
    .filter((candidate) => getEditorStateLinks(candidate.editorState).reviewVersionId === version.id)
    .map((candidate) => ({
      id: candidate.id,
      versionNumber: candidate.versionNumber,
      createdAt: candidate.createdAt,
      notes: candidate.notes,
    }));

  return {
    version,
    previousVersion,
    linkedAnalysis,
    linkedSuggestionSet,
    provenance,
    reviewOutputs,
  };
}

export async function persistTailoringArtifacts(params: {
  user: AuthenticatedUser;
  resumeId: string;
  jobTarget: JobTargetInput;
  analysis: ResumeAnalysisResult;
  curation?: CurationGuidance;
}) {
  const { user, resumeId, jobTarget, analysis, curation } = params;
  await ensureUserRecord(user);

  const resume = await prisma.resume.findFirst({
    where: {
      id: resumeId,
      userId: user.id,
    },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!resume || resume.versions.length === 0) {
    throw new Error("Curriculo nao encontrado para adaptacao.");
  }

  const latestVersion = resume.versions[0];

  return prisma.$transaction(async (tx) => {
    const createdJobTarget = await tx.jobTarget.create({
      data: {
        userId: user.id,
        title: jobTarget.title,
        company: jobTarget.company,
        description: jobTarget.description,
        parsedKeywords: {
          matchedKeywords: analysis.matchedKeywords,
          missingKeywords: analysis.missingKeywords,
          preferredKeywords: curation?.preferredKeywords ?? [],
          focusAreas: curation?.focusAreas ?? [],
        },
      },
    });

    const createdAnalysis = await tx.resumeAnalysis.create({
      data: {
        resumeId: resume.id,
        resumeVersionId: latestVersion.id,
        jobTargetId: createdJobTarget.id,
        atsScore: analysis.atsScore,
        fitScore: analysis.fitScore,
        strengths: analysis.strengths as unknown as Prisma.InputJsonValue,
        gaps: analysis.gaps as unknown as Prisma.InputJsonValue,
        recommendations: analysis.recommendations as unknown as Prisma.InputJsonValue,
        modelName: "heuristic-v1",
      },
    });

    const createdSuggestionSet = await tx.suggestionSet.create({
      data: {
        resumeId: resume.id,
        resumeVersionId: latestVersion.id,
        jobTargetId: createdJobTarget.id,
        status: SuggestionStatus.GENERATED,
        items: analysis.recommendations.map((recommendation) => ({
          type: "recommendation",
          text: recommendation,
        })) as unknown as Prisma.InputJsonValue,
      },
    });

    if (resume.kind === ResumeKind.JOB_TAILORED) {
      await tx.resume.update({
        where: { id: resume.id },
        data: {
          jobTargetId: createdJobTarget.id,
        },
      });
    }

    return {
      jobTarget: createdJobTarget,
      analysis: createdAnalysis,
      suggestionSet: createdSuggestionSet,
    };
  });
}

export async function createResumeVersion(params: {
  user: AuthenticatedUser;
  resumeId: string;
  normalizedData: Prisma.InputJsonValue;
  notes?: string;
  editorState?: Prisma.InputJsonValue;
}) {
  const { user, resumeId, normalizedData, notes, editorState } = params;
  await ensureUserRecord(user);

  const resume = await prisma.resume.findFirst({
    where: {
      id: resumeId,
      userId: user.id,
    },
    select: { id: true },
  });

  if (!resume) {
    throw new Error("Curriculo nao encontrado para criar nova versao.");
  }

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

export async function createOutputRender(params: {
  user: AuthenticatedUser;
  resumeId: string;
  resumeVersionId: string;
  kind: OutputKind;
  content: Prisma.InputJsonValue;
  html: string;
}) {
  const { user, resumeId, resumeVersionId, kind, content, html } = params;
  await ensureUserRecord(user);

  const version = await prisma.resumeVersion.findFirst({
    where: {
      id: resumeVersionId,
      resumeId,
      resume: {
        userId: user.id,
      },
    },
    select: {
      id: true,
      versionNumber: true,
    },
  });

  if (!version) {
    throw new Error("Versao do curriculo nao encontrada para gerar saida.");
  }

  return prisma.outputRender.create({
    data: {
      resumeId,
      resumeVersionId: version.id,
      kind,
      content,
      html,
    },
    include: {
      resumeVersion: {
        select: {
          id: true,
          versionNumber: true,
        },
      },
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

function getEditorStateLinks(editorState: Prisma.JsonValue | null) {
  if (!editorState || typeof editorState !== "object" || Array.isArray(editorState)) {
    return {
      source: null,
      jobTitle: null,
      company: null,
      analysisId: null,
      jobTargetId: null,
      suggestionSetId: null,
      reviewVersionId: null,
    };
  }

  const value = editorState as Prisma.JsonObject;

  return {
    source: getEditorStateString(value, "source"),
    jobTitle: getEditorStateString(value, "jobTitle"),
    company: getEditorStateString(value, "company"),
    analysisId: getEditorStateString(value, "analysisId"),
    jobTargetId: getEditorStateString(value, "jobTargetId"),
    suggestionSetId: getEditorStateString(value, "suggestionSetId"),
    reviewVersionId: getEditorStateString(value, "reviewVersionId"),
  };
}

function getEditorStateString(value: Prisma.JsonObject, key: string) {
  const candidate = value[key];
  return typeof candidate === "string" && candidate.trim() ? candidate : null;
}
