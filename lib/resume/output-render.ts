import { OutputKind } from "@/app/generated/prisma";
import type { JsonResume } from "@/types/json-resume";

type OutputRenderPayload = {
  content: Record<string, unknown>;
  html: string;
};

export function renderResumeOutput(params: {
  kind: OutputKind;
  resume: JsonResume;
  resumeTitle: string;
  versionNumber: number;
}): OutputRenderPayload {
  const { kind, resume, resumeTitle, versionNumber } = params;

  if (kind === OutputKind.ATS) {
    return buildAtsOutput({ resume, resumeTitle, versionNumber });
  }

  return buildVisualOutput({ resume, resumeTitle, versionNumber });
}

function buildAtsOutput(params: {
  resume: JsonResume;
  resumeTitle: string;
  versionNumber: number;
}): OutputRenderPayload {
  const { resume, resumeTitle, versionNumber } = params;
  const skills = resume.skills?.map((item) => item.name) ?? [];
  const workItems =
    resume.work?.map((item) => ({
      company: item.name,
      role: item.position ?? null,
      summary: item.summary ?? null,
      highlights: item.highlights ?? [],
    })) ?? [];
  const educationItems =
    resume.education?.map((item) => ({
      institution: item.institution,
      studyType: item.studyType ?? null,
      area: item.area ?? null,
    })) ?? [];

  const content = {
    kind: OutputKind.ATS,
    resumeTitle,
    versionNumber,
    basics: {
      name: resume.basics.name,
      label: resume.basics.label ?? null,
      email: resume.basics.email ?? null,
      phone: resume.basics.phone ?? null,
      summary: resume.basics.summary ?? null,
    },
    skills,
    work: workItems,
    education: educationItems,
    projects:
      resume.projects?.map((item) => ({
        name: item.name,
        description: item.description ?? null,
      })) ?? [],
  } satisfies Record<string, unknown>;

  const html = `
    <article style="font-family: Arial, sans-serif; color: #1c1917; line-height: 1.6;">
      <header>
        <h1 style="font-size: 28px; margin-bottom: 4px;">${escapeHtml(
          resume.basics.name || resumeTitle
        )}</h1>
        <p style="margin: 0 0 12px; font-size: 16px;">${escapeHtml(
          resume.basics.label || resumeTitle
        )}</p>
        <p style="margin: 0 0 16px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">
          ATS Output - v${versionNumber}
        </p>
      </header>
      ${
        resume.basics.summary
          ? `<section><h2 style="font-size: 16px;">Resumo</h2><p>${escapeHtml(
              resume.basics.summary
            )}</p></section>`
          : ""
      }
      ${
        workItems.length > 0
          ? `<section><h2 style="font-size: 16px;">Experiencia</h2>${workItems
              .map(
                (item) => `
                  <div style="margin-bottom: 12px;">
                    <p style="margin: 0; font-weight: 700;">${escapeHtml(item.company)}</p>
                    ${
                      item.role
                        ? `<p style="margin: 0;">${escapeHtml(item.role)}</p>`
                        : ""
                    }
                    ${
                      item.summary
                        ? `<p style="margin: 4px 0 0;">${escapeHtml(item.summary)}</p>`
                        : ""
                    }
                  </div>
                `
              )
              .join("")}</section>`
          : ""
      }
      ${
        skills.length > 0
          ? `<section><h2 style="font-size: 16px;">Skills</h2><p>${escapeHtml(
              skills.join(", ")
            )}</p></section>`
          : ""
      }
      ${
        educationItems.length > 0
          ? `<section><h2 style="font-size: 16px;">Formacao</h2>${educationItems
              .map(
                (item) => `
                  <p style="margin: 0 0 8px;">
                    <strong>${escapeHtml(item.institution)}</strong>${
                      item.studyType ? ` - ${escapeHtml(item.studyType)}` : ""
                    }${item.area ? ` - ${escapeHtml(item.area)}` : ""}
                  </p>
                `
              )
              .join("")}</section>`
          : ""
      }
    </article>
  `.trim();

  return { content, html };
}

function buildVisualOutput(params: {
  resume: JsonResume;
  resumeTitle: string;
  versionNumber: number;
}): OutputRenderPayload {
  const { resume, resumeTitle, versionNumber } = params;
  const skills = resume.skills?.map((item) => item.name) ?? [];
  const topWork = resume.work?.slice(0, 4) ?? [];
  const topProjects = resume.projects?.slice(0, 3) ?? [];

  const content = {
    kind: OutputKind.VISUAL,
    resumeTitle,
    versionNumber,
    headline: resume.basics.label ?? resumeTitle,
    summary: resume.basics.summary ?? null,
    highlightedSkills: skills.slice(0, 12),
    workCount: resume.work?.length ?? 0,
    projectCount: resume.projects?.length ?? 0,
  } satisfies Record<string, unknown>;

  const html = `
    <article style="font-family: Georgia, 'Times New Roman', serif; color: #1c1917; background: linear-gradient(180deg, #fffdf8, #f3ede2); padding: 32px; border-radius: 28px;">
      <header style="border-bottom: 1px solid rgba(28,25,23,0.12); padding-bottom: 20px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #78716c;">Visual Output - v${versionNumber}</p>
        <h1 style="margin: 12px 0 4px; font-size: 34px;">${escapeHtml(
          resume.basics.name || resumeTitle
        )}</h1>
        <p style="margin: 0; font-size: 18px; color: #57534e;">${escapeHtml(
          resume.basics.label || resumeTitle
        )}</p>
      </header>
      <section style="display: grid; gap: 18px;">
        ${
          resume.basics.summary
            ? `<div><h2 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: #78716c;">Narrativa</h2><p style="margin-top: 8px; font-size: 16px;">${escapeHtml(
                resume.basics.summary
              )}</p></div>`
            : ""
        }
        ${
          skills.length > 0
            ? `<div><h2 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: #78716c;">Destaques</h2><div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:10px;">${skills
                .slice(0, 10)
                .map(
                  (skill) =>
                    `<span style="padding:8px 12px; border-radius:999px; background:#ffffff; border:1px solid rgba(28,25,23,0.1); font-size:13px;">${escapeHtml(
                      skill
                    )}</span>`
                )
                .join("")}</div></div>`
            : ""
        }
        ${
          topWork.length > 0
            ? `<div><h2 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: #78716c;">Experiencia</h2><div style="display:grid; gap:12px; margin-top:10px;">${topWork
                .map(
                  (item) => `
                    <div style="padding:16px; background:#ffffff; border-radius:18px; border:1px solid rgba(28,25,23,0.08);">
                      <p style="margin:0; font-weight:700;">${escapeHtml(item.name)}</p>
                      ${
                        item.position
                          ? `<p style="margin:4px 0 0; color:#57534e;">${escapeHtml(
                              item.position
                            )}</p>`
                          : ""
                      }
                      ${
                        item.summary
                          ? `<p style="margin:8px 0 0;">${escapeHtml(item.summary)}</p>`
                          : ""
                      }
                    </div>
                  `
                )
                .join("")}</div></div>`
            : ""
        }
        ${
          topProjects.length > 0
            ? `<div><h2 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: #78716c;">Projetos</h2><div style="display:grid; gap:12px; margin-top:10px;">${topProjects
                .map(
                  (item) => `
                    <div style="padding:16px; background:#ffffff; border-radius:18px; border:1px solid rgba(28,25,23,0.08);">
                      <p style="margin:0; font-weight:700;">${escapeHtml(item.name)}</p>
                      ${
                        item.description
                          ? `<p style="margin:8px 0 0;">${escapeHtml(item.description)}</p>`
                          : ""
                      }
                    </div>
                  `
                )
                .join("")}</div></div>`
            : ""
        }
      </section>
    </article>
  `.trim();

  return { content, html };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
