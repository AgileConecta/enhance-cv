# Architecture status

## Executive summary

The project has moved from a parsing prototype into a backend foundation for a candidate-focused resume platform.

## What is already stable

- domain model aligned to the product vision
- authenticated write endpoints
- modular import pipeline
- versioned Prisma migrations
- baseline RLS policy set
- consent and PII redaction before LLM enrichment

## What still needs attention before connected UI expands

- rotate exposed secrets
- add structured logging and request ids
- standardize API response and error envelopes
- improve parser robustness for real-world resume formats
- define stronger version lifecycle semantics

## Recommended next product-facing phase

1. Resume library UI
2. Manual create/import flows
3. Job tailoring flow
4. ATS and fit explanation views

## Architectural guidance for UI

- treat `Resume` as the stable identity
- treat `ResumeVersion` as the editable historical snapshot
- keep source ingestion and editing concerns separate
- avoid coupling UI directly to raw parser assumptions
- preserve explicit consent for any LLM-assisted action
