# enhance-cv

`enhance-cv` is a candidate-first resume workspace built with Next.js, TypeScript, Prisma, and Supabase.

The product direction is:
- create a resume from scratch
- import resumes from files, pasted text, and profile links
- maintain a library of base resumes, templates, and job-tailored variants
- analyze ATS readiness and job fit
- generate future ATS and visual outputs

## Current backend status

The project already includes:
- modular resume import pipeline
- Prisma domain for resumes, versions, sources, analyses, suggestions, and outputs
- authenticated write APIs
- Prisma migrations committed to the repository
- Supabase RLS SQL applied as defense in depth
- LLM enrichment behind explicit consent with PII redaction

## Main routes

- `POST /api/resumes`
  - create a manual resume from structured JSON Resume data
- `POST /api/resumes/import`
  - import a resume from file, pasted text, or source URL
- `POST /api/parse-cv`
  - compatibility route for the current upload flow
- `POST /api/job-targets/analyze`
  - compute ATS and fit analysis for a resume and job target

## Local development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Database workflow

Generate Prisma client:

```bash
npm run db:generate
```

Check migration status:

```bash
npm run db:status
```

Apply migrations in a deployment environment:

```bash
npm run db:deploy
```

## Environment

Do not commit `.env`, `.env.local`, or any secret-bearing file.

Recommended next operational steps:
- rotate any exposed secrets before publishing the repository
- validate migrations on a clean database
- validate RLS with real authenticated test users
- add structured logging and standardized API error envelopes

## Git remote

This repository is initialized locally and ready to be connected to GitHub.

Typical next commands:

```bash
git remote add origin <your-github-url>
git push -u origin main
```
