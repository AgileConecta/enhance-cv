# Secret rotation checklist

Use this checklist before any broader sharing, deployment, or connected UI rollout.

## Rotate now

1. Supabase database credentials
   - rotate the password used by `DATABASE_URL`
   - rotate the password used by `DIRECT_URL`
2. OpenAI API key
   - revoke the current key
   - create a new scoped key
3. Any additional privileged Supabase key if it was ever exposed outside the local machine

## Update local environment

After rotating:

1. update `.env.local`
2. confirm `.env.local` is still ignored by Git
3. run:

```bash
npm run db:status
npm run build
```

## Validate application health

1. authenticated API writes still work
2. unauthenticated writes still return `401`
3. enrichment still works only with explicit consent
4. no secrets appear in logs, docs, or committed files

## Notes

- `NEXT_PUBLIC_SUPABASE_URL` and the publishable key are intended for client usage, but still should be handled carefully in screenshots and support material.
- `DATABASE_URL`, `DIRECT_URL`, and `OPENAI_API_KEY` must be treated as sensitive.
