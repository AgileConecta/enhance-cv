# Backend hardening baseline

This project now has a committed Prisma migration baseline and a dedicated SQL migration for Supabase RLS policies.

## What is covered

- `prisma/migrations/20260415193000_init_domain/migration.sql`
  - Canonical schema baseline for the candidate-focused resume domain.
- `prisma/migrations/20260415194500_enable_rls/migration.sql`
  - Grants and row-level security policies for authenticated Supabase users.

## Important security nuance

Supabase RLS does **not** replace application-level authorization in the current stack.

Reason:
- The app writes and reads through Prisma using `DATABASE_URL`.
- Prisma opens a direct Postgres connection and does not automatically carry the end-user Supabase JWT into Postgres.
- Because of that, RLS is currently a **defense-in-depth layer for Supabase-managed access paths**, not the primary ownership control for the Next.js API.

That is why the API layer was hardened first:
- the server resolves the authenticated Supabase user from cookies
- write endpoints no longer trust `userId` from the client
- persistence only writes with the authenticated user id

## Before connected UI

The following still need to be completed operationally:

1. Rotate exposed secrets.
2. Apply the committed migrations in a clean environment.
3. Validate the RLS migration in Supabase with authenticated test users.
4. Add consent and PII redaction before LLM enrichment.

## Suggested commands

```bash
npx prisma generate
npx prisma migrate status
npx prisma migrate deploy
```

## Notes about the current database

The local database was previously aligned with manual patching during the domain refactor. These migrations are the new source of truth for fresh environments and future changes.
