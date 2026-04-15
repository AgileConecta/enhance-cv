-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ResumeKind" AS ENUM ('BASE', 'TEMPLATE', 'JOB_TAILORED');

-- CreateEnum
CREATE TYPE "ResumeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ResumeSourceKind" AS ENUM ('MANUAL', 'FILE_IMPORT', 'PROFILE_LINK', 'PORTAL_EXPORT', 'PASTED_TEXT');

-- CreateEnum
CREATE TYPE "ResumeSourceFormat" AS ENUM ('PDF', 'DOC', 'DOCX', 'LINKEDIN_URL', 'WORKDAY_EXPORT', 'CATHO_EXPORT', 'PLAIN_TEXT', 'JSON_RESUME', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "OutputKind" AS ENUM ('ATS', 'VISUAL');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('GENERATED', 'APPLIED', 'DISMISSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "ResumeKind" NOT NULL DEFAULT 'BASE',
    "status" "ResumeStatus" NOT NULL DEFAULT 'DRAFT',
    "summary" TEXT,
    "sourceResumeId" TEXT,
    "jobTargetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeVersion" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "normalizedData" JSONB NOT NULL,
    "editorState" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeSource" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "kind" "ResumeSourceKind" NOT NULL,
    "format" "ResumeSourceFormat" NOT NULL DEFAULT 'UNKNOWN',
    "label" TEXT,
    "sourceUrl" TEXT,
    "originalFilename" TEXT,
    "mimeType" TEXT,
    "rawText" TEXT,
    "extractedText" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobTarget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "description" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "parsedKeywords" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeAnalysis" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "resumeVersionId" TEXT,
    "jobTargetId" TEXT,
    "atsScore" DOUBLE PRECISION,
    "fitScore" DOUBLE PRECISION,
    "strengths" JSONB,
    "gaps" JSONB,
    "recommendations" JSONB,
    "modelName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuggestionSet" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "resumeVersionId" TEXT,
    "jobTargetId" TEXT,
    "curationProfileId" TEXT,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'GENERATED',
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuggestionSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurationProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "seniority" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'pt-BR',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "rules" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutputRender" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "resumeVersionId" TEXT,
    "kind" "OutputKind" NOT NULL,
    "content" JSONB,
    "html" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutputRender_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Resume_userId_kind_status_idx" ON "Resume"("userId", "kind", "status");

-- CreateIndex
CREATE INDEX "Resume_jobTargetId_idx" ON "Resume"("jobTargetId");

-- CreateIndex
CREATE INDEX "ResumeVersion_resumeId_createdAt_idx" ON "ResumeVersion"("resumeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeVersion_resumeId_versionNumber_key" ON "ResumeVersion"("resumeId", "versionNumber");

-- CreateIndex
CREATE INDEX "ResumeSource_resumeId_kind_format_idx" ON "ResumeSource"("resumeId", "kind", "format");

-- CreateIndex
CREATE INDEX "JobTarget_userId_createdAt_idx" ON "JobTarget"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ResumeAnalysis_resumeId_jobTargetId_createdAt_idx" ON "ResumeAnalysis"("resumeId", "jobTargetId", "createdAt");

-- CreateIndex
CREATE INDEX "SuggestionSet_resumeId_jobTargetId_createdAt_idx" ON "SuggestionSet"("resumeId", "jobTargetId", "createdAt");

-- CreateIndex
CREATE INDEX "CurationProfile_userId_targetRole_idx" ON "CurationProfile"("userId", "targetRole");

-- CreateIndex
CREATE INDEX "OutputRender_resumeId_kind_createdAt_idx" ON "OutputRender"("resumeId", "kind", "createdAt");

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_sourceResumeId_fkey" FOREIGN KEY ("sourceResumeId") REFERENCES "Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_jobTargetId_fkey" FOREIGN KEY ("jobTargetId") REFERENCES "JobTarget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeVersion" ADD CONSTRAINT "ResumeVersion_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeSource" ADD CONSTRAINT "ResumeSource_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTarget" ADD CONSTRAINT "JobTarget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeAnalysis" ADD CONSTRAINT "ResumeAnalysis_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeAnalysis" ADD CONSTRAINT "ResumeAnalysis_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "ResumeVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeAnalysis" ADD CONSTRAINT "ResumeAnalysis_jobTargetId_fkey" FOREIGN KEY ("jobTargetId") REFERENCES "JobTarget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionSet" ADD CONSTRAINT "SuggestionSet_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionSet" ADD CONSTRAINT "SuggestionSet_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "ResumeVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionSet" ADD CONSTRAINT "SuggestionSet_jobTargetId_fkey" FOREIGN KEY ("jobTargetId") REFERENCES "JobTarget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionSet" ADD CONSTRAINT "SuggestionSet_curationProfileId_fkey" FOREIGN KEY ("curationProfileId") REFERENCES "CurationProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurationProfile" ADD CONSTRAINT "CurationProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutputRender" ADD CONSTRAINT "OutputRender_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutputRender" ADD CONSTRAINT "OutputRender_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "ResumeVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
