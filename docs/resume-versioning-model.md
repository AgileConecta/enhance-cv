# Resume versioning model

This document defines the intended semantics of `Resume` and `ResumeVersion`.

## Core concepts

### `Resume`

`Resume` is the stable identity of a resume artifact owned by a user.

It answers:
- what is this resume for?
- is this a base resume, a reusable template, or a job-tailored variant?
- which resume did it derive from?
- which job target is it linked to, when applicable?

### `ResumeVersion`

`ResumeVersion` is an immutable content snapshot inside a single `Resume`.

It answers:
- what did this resume contain at a specific moment?
- what was the editor state at that moment?
- what analyses, suggestions, and outputs were generated against that snapshot?

## Operational rules

1. A newly created `Resume` always starts with `versionNumber = 1`.
2. Edits to the same logical resume create a new `ResumeVersion`.
3. Reusing a resume for a materially different purpose creates a new `Resume`.
4. `ResumeKind.BASE`
   - the user's main source-of-truth resume
5. `ResumeKind.TEMPLATE`
   - a reusable derivative meant for a family of applications
6. `ResumeKind.JOB_TAILORED`
   - a derivative linked to a specific `JobTarget`

## Derivation model

- `sourceResumeId`
  - points to the parent `Resume` when a template or job-tailored variant is created from another resume
- the new derived resume starts its own version history at `1`
- future edits on the derived resume increment only its own `ResumeVersion` sequence

## UI guidance

- editing within the same resume should call "create version"
- duplicating for reuse should call "create derived resume variant"
- the UI should treat the latest `ResumeVersion` as the current editable snapshot
- historical versions should be shown as a timeline, not as separate resumes

## Why this matters

This keeps two concerns separate:
- content history within one logical resume
- branching into a new resume identity for a new application context
