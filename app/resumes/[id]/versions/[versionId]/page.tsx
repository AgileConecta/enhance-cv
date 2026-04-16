import Link from "next/link";
import { notFound } from "next/navigation";
import { ResumeVersionReviewWorkbench } from "@/app/resumes/_components/resume-version-review-workbench";
import { ResumeVersionReview } from "@/app/resumes/_components/resume-version-review";
import { getAuthenticatedUser } from "@/lib/auth/current-user";
import { buildGranularReviewAudit } from "@/lib/resume/granular-review";
import { getResumeVersionReviewForUser } from "@/lib/resume/storage";
import { compareResumeVersions } from "@/lib/resume/version-comparison";
import { JsonResumeSchema } from "@/lib/schemas/json-resume.schema";
import type { JsonResume } from "@/types/json-resume";

type PageProps = {
  params: Promise<{ id: string; versionId: string }>;
};

export default async function ResumeVersionReviewPage({ params }: PageProps) {
  const user = await getAuthenticatedUser();
  const { id, versionId } = await params;

  if (!user) {
    return (
      <section className="rounded-[1.8rem] border border-dashed border-stone-900/15 bg-white/60 p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
          Autenticacao necessaria
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-stone-950">
          Entre para revisar esta versao
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone-600">
          O modo diff mostra a origem da iteracao e o que mudou em relacao a
          versao anterior.
        </p>
      </section>
    );
  }

  const review = await getResumeVersionReviewForUser(user.id, id, versionId);
  if (!review) {
    notFound();
  }

  const currentResumeValidation = JsonResumeSchema.safeParse(
    review.version.normalizedData as unknown
  );
  if (!currentResumeValidation.success) {
    notFound();
  }

  const previousResumeValidation = review.previousVersion
    ? JsonResumeSchema.safeParse(review.previousVersion.normalizedData as unknown)
    : null;

  const comparison =
    review.previousVersion && previousResumeValidation?.success
      ? compareResumeVersions({
          currentVersionNumber: review.version.versionNumber,
          previousVersionNumber: review.previousVersion.versionNumber,
          current: currentResumeValidation.data as JsonResume,
          previous: previousResumeValidation.data as JsonResume,
        })
      : null;
  const sourceReview =
    review.provenance.source === "version-review" && review.provenance.reviewVersionId
      ? await getResumeVersionReviewForUser(user.id, id, review.provenance.reviewVersionId)
      : null;
  const sourceReviewPreviousValidation = sourceReview?.previousVersion
    ? JsonResumeSchema.safeParse(sourceReview.previousVersion.normalizedData as unknown)
    : null;
  const sourceReviewCurrentValidation = sourceReview
    ? JsonResumeSchema.safeParse(sourceReview.version.normalizedData as unknown)
    : null;
  const sourceReviewComparison =
    sourceReview &&
    sourceReview.previousVersion &&
    sourceReviewCurrentValidation?.success &&
    sourceReviewPreviousValidation?.success
      ? compareResumeVersions({
          currentVersionNumber: sourceReview.version.versionNumber,
          previousVersionNumber: sourceReview.previousVersion.versionNumber,
          current: sourceReviewCurrentValidation.data as JsonResume,
          previous: sourceReviewPreviousValidation.data as JsonResume,
        })
      : null;
  const granularAudit = buildGranularReviewAudit({
    editorState: review.version.editorState,
    comparison: sourceReviewComparison,
  });

  return (
    <div className="space-y-6">
      <Link
        href={`/resumes/${id}`}
        className="inline-flex items-center rounded-full border border-stone-900/10 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-900/5"
      >
        Voltar para detalhe do curriculo
      </Link>

      <ResumeVersionReview
        resume={review.version.resume}
        version={review.version}
        previousVersion={review.previousVersion}
        currentResume={currentResumeValidation.data as JsonResume}
        previousResume={
          previousResumeValidation?.success
            ? (previousResumeValidation.data as JsonResume)
            : null
        }
        comparison={comparison}
        linkedAnalysis={review.linkedAnalysis}
        linkedSuggestionSet={review.linkedSuggestionSet}
        provenance={review.provenance}
        granularAudit={granularAudit}
        reviewOutputs={review.reviewOutputs}
      />

      <ResumeVersionReviewWorkbench
        resumeId={id}
        sourceVersionId={review.version.id}
        currentResume={currentResumeValidation.data as JsonResume}
        previousResume={
          previousResumeValidation?.success
            ? (previousResumeValidation.data as JsonResume)
            : null
        }
        comparison={comparison}
      />
    </div>
  );
}
