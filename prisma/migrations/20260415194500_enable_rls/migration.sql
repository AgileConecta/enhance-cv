GRANT USAGE ON SCHEMA "public" TO authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE "User" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "Resume" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "ResumeVersion" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "ResumeSource" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "JobTarget" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "ResumeAnalysis" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "SuggestionSet" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "CurationProfile" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "OutputRender" TO authenticated;

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Resume" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ResumeVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ResumeSource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "JobTarget" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ResumeAnalysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SuggestionSet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CurationProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OutputRender" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
ON "User"
FOR SELECT
TO authenticated
USING ("id" = auth.uid()::text);

CREATE POLICY "Users can create own profile"
ON "User"
FOR INSERT
TO authenticated
WITH CHECK ("id" = auth.uid()::text);

CREATE POLICY "Users can update own profile"
ON "User"
FOR UPDATE
TO authenticated
USING ("id" = auth.uid()::text)
WITH CHECK ("id" = auth.uid()::text);

CREATE POLICY "Users can read own resumes"
ON "Resume"
FOR SELECT
TO authenticated
USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can create own resumes"
ON "Resume"
FOR INSERT
TO authenticated
WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Users can update own resumes"
ON "Resume"
FOR UPDATE
TO authenticated
USING ("userId" = auth.uid()::text)
WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Users can delete own resumes"
ON "Resume"
FOR DELETE
TO authenticated
USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can read own resume versions"
ON "ResumeVersion"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "ResumeVersion"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can create own resume versions"
ON "ResumeVersion"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "ResumeVersion"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can update own resume versions"
ON "ResumeVersion"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "ResumeVersion"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "ResumeVersion"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can delete own resume versions"
ON "ResumeVersion"
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "ResumeVersion"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can read own resume sources"
ON "ResumeSource"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "ResumeSource"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can create own resume sources"
ON "ResumeSource"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "ResumeSource"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can update own resume sources"
ON "ResumeSource"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "ResumeSource"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "ResumeSource"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can delete own resume sources"
ON "ResumeSource"
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "ResumeSource"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can read own job targets"
ON "JobTarget"
FOR SELECT
TO authenticated
USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can create own job targets"
ON "JobTarget"
FOR INSERT
TO authenticated
WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Users can update own job targets"
ON "JobTarget"
FOR UPDATE
TO authenticated
USING ("userId" = auth.uid()::text)
WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Users can delete own job targets"
ON "JobTarget"
FOR DELETE
TO authenticated
USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can read own resume analyses"
ON "ResumeAnalysis"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "ResumeAnalysis"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can create own resume analyses"
ON "ResumeAnalysis"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "ResumeAnalysis"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can update own resume analyses"
ON "ResumeAnalysis"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "ResumeAnalysis"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "ResumeAnalysis"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can delete own resume analyses"
ON "ResumeAnalysis"
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "ResumeAnalysis"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can read own suggestion sets"
ON "SuggestionSet"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "SuggestionSet"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can create own suggestion sets"
ON "SuggestionSet"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "SuggestionSet"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can update own suggestion sets"
ON "SuggestionSet"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "SuggestionSet"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "SuggestionSet"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can delete own suggestion sets"
ON "SuggestionSet"
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "SuggestionSet"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can read own or system curation profiles"
ON "CurationProfile"
FOR SELECT
TO authenticated
USING ("isSystem" = true OR "userId" = auth.uid()::text);

CREATE POLICY "Users can create own curation profiles"
ON "CurationProfile"
FOR INSERT
TO authenticated
WITH CHECK ("userId" = auth.uid()::text AND "isSystem" = false);

CREATE POLICY "Users can update own curation profiles"
ON "CurationProfile"
FOR UPDATE
TO authenticated
USING ("userId" = auth.uid()::text AND "isSystem" = false)
WITH CHECK ("userId" = auth.uid()::text AND "isSystem" = false);

CREATE POLICY "Users can delete own curation profiles"
ON "CurationProfile"
FOR DELETE
TO authenticated
USING ("userId" = auth.uid()::text AND "isSystem" = false);

CREATE POLICY "Users can read own output renders"
ON "OutputRender"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "OutputRender"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can create own output renders"
ON "OutputRender"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "OutputRender"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can update own output renders"
ON "OutputRender"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "OutputRender"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "OutputRender"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can delete own output renders"
ON "OutputRender"
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "Resume"
    WHERE "Resume"."id" = "OutputRender"."resumeId"
      AND "Resume"."userId" = auth.uid()::text
  )
);
