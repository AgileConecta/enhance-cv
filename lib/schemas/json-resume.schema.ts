import { z } from "zod";

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

export const LocationSchema = z.object({
  address:     z.string().optional(),
  postalCode:  z.string().optional(),
  city:        z.string().optional(),
  countryCode: z.string().optional(),
  region:      z.string().optional(),
});

export const ProfileSchema = z.object({
  network:  z.string(),
  username: z.string().optional(),
  url:      z.string().optional(),
});

export const BasicsSchema = z.object({
  name:     z.string().min(1),
  label:    z.string().optional(),
  image:    z.string().optional(),
  email:    z.string().optional(),
  phone:    z.string().optional(),
  url:      z.string().optional(),
  summary:  z.string().optional(),
  location: LocationSchema.optional(),
  profiles: z.array(ProfileSchema).optional().default([]),
});

export const WorkSchema = z.object({
  name:       z.string().min(1),
  position:   z.string().optional(),
  url:        z.string().optional(),
  // YYYY-MM ou YYYY ou "Present"
  startDate:  z.string().optional(),
  endDate:    z.string().optional(),
  summary:    z.string().optional(),
  highlights: z.array(z.string()).optional().default([]),
});

export const EducationSchema = z.object({
  institution: z.string().min(1),
  url:         z.string().optional(),
  area:        z.string().optional(),
  studyType:   z.string().optional(),
  startDate:   z.string().optional(),
  endDate:     z.string().optional(),
  score:       z.string().optional(),
  courses:     z.array(z.string()).optional().default([]),
});

export const SkillSchema = z.object({
  name:     z.string().min(1),
  level:    z.string().optional(),
  keywords: z.array(z.string()).optional().default([]),
});

export const LanguageSchema = z.object({
  language: z.string().min(1),
  fluency:  z.string().optional(),
});

export const CertificateSchema = z.object({
  name:   z.string().min(1),
  date:   z.string().optional(),
  issuer: z.string().optional(),
  url:    z.string().optional(),
});

export const ProjectSchema = z.object({
  name:        z.string().min(1),
  description: z.string().optional(),
  highlights:  z.array(z.string()).optional().default([]),
  keywords:    z.array(z.string()).optional().default([]),
  startDate:   z.string().optional(),
  endDate:     z.string().optional(),
  url:         z.string().optional(),
  roles:       z.array(z.string()).optional().default([]),
});

// ─── Root schema ──────────────────────────────────────────────────────────────

export const JsonResumeSchema = z.object({
  basics:       BasicsSchema,
  work:         z.array(WorkSchema).optional().default([]),
  education:    z.array(EducationSchema).optional().default([]),
  skills:       z.array(SkillSchema).optional().default([]),
  languages:    z.array(LanguageSchema).optional().default([]),
  certificates: z.array(CertificateSchema).optional().default([]),
  projects:     z.array(ProjectSchema).optional().default([]),
});

export type JsonResumeValidated = z.infer<typeof JsonResumeSchema>;

// ─── LLM output schema (subconjunto — só o que o LLM enriquece) ───────────────

export const LlmEnrichmentSchema = z.object({
  work: z.array(
    z.object({
      name:       z.string(),
      position:   z.string().optional(),
      startDate:  z.string().optional(),
      endDate:    z.string().optional(),
      summary:    z.string().optional(),
      highlights: z.array(z.string()).optional().default([]),
    })
  ).optional().default([]),

  skills: z.array(
    z.object({
      name:     z.string(),
      keywords: z.array(z.string()).optional().default([]),
    })
  ).optional().default([]),

  languages: z.array(
    z.object({
      language: z.string(),
      fluency:  z.string().optional(),
    })
  ).optional().default([]),

  certificates: z.array(
    z.object({
      name:   z.string(),
      issuer: z.string().optional(),
      date:   z.string().optional(),
    })
  ).optional().default([]),
});

export type LlmEnrichment = z.infer<typeof LlmEnrichmentSchema>;
