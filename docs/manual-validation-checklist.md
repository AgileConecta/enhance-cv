# Manual validation checklist

This is the minimum validation gate before moving into connected UI work.

## 1. Authentication and authorization

- access `POST /api/resumes` without session
  - expected: `401`
- access `POST /api/resumes/import` without session
  - expected: `401`
- access `POST /api/parse-cv` without session
  - expected: `401`
- authenticate as user A and create/import a resume
  - expected: resume is persisted for user A
- authenticate as user B and attempt to access user A data
  - expected: blocked by API ownership checks and RLS-backed access paths

## 2. Import battery

- PDF with selectable text
- DOCX exported from Word
- pasted plain text
- LinkedIn profile URL seed

For each case, validate:
- extraction succeeds or fails with a clear message
- source metadata is coherent
- parser returns structurally valid resume JSON
- no raw secret or credential leaks into logs

## 3. LLM consent and redaction

- enrichment requested without `llmConsent`
  - expected: no enrichment
- enrichment requested with `llmConsent=true`
  - expected: enrichment allowed
- confirm redaction summary is present in metadata when enrichment runs

## 4. API contract

For each main route:
- response includes `success`
- response includes `requestId`
- failures include `error.code`
- failures include human-readable `error.message`
