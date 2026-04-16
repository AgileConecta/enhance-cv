import Link from "next/link";
import { notFound } from "next/navigation";
import { ResumeDetailShell } from "@/app/resumes/_components/resume-detail-shell";
import { getAuthenticatedUser } from "@/lib/auth/current-user";
import { compareResumeVersions } from "@/lib/resume/version-comparison";
import { getResumeByIdForUser } from "@/lib/resume/storage";
import { JsonResumeSchema } from "@/lib/schemas/json-resume.schema";
import type { JsonResume } from "@/types/json-resume";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ResumeDetailPage({ params }: PageProps) {
  const user = await getAuthenticatedUser();
  const { id } = await params;

  if (!user) {
    return (
      <section className="rounded-[1.8rem] border border-dashed border-stone-900/15 bg-white/60 p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
          Autenticacao necessaria
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-stone-950">
          Entre para abrir este curriculo
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone-600">
          Esta pagina mostra o snapshot atual, historico de versoes e acoes de
          derivacao da identidade do curriculo.
        </p>
      </section>
    );
  }

  const resume = await getResumeByIdForUser(user.id, id);
  if (!resume) {
    notFound();
  }

  const latestVersion = resume.versions[0]?.normalizedData;
  const latestResumeValidation = JsonResumeSchema.safeParse(latestVersion as unknown);
  if (!latestResumeValidation.success) {
    notFound();
  }

  const previousVersion = resume.versions[1];
  const previousResumeValidation = previousVersion
    ? JsonResumeSchema.safeParse(previousVersion.normalizedData as unknown)
    : null;

  const comparison =
    previousVersion && previousResumeValidation?.success
      ? compareResumeVersions({
          currentVersionNumber: resume.versions[0]?.versionNumber ?? 1,
          previousVersionNumber: previousVersion.versionNumber,
          current: latestResumeValidation.data as JsonResume,
          previous: previousResumeValidation.data as JsonResume,
        })
      : null;

  const auditComparisons = Object.fromEntries(
    resume.versions
      .map((version, index) => {
        const olderVersion = resume.versions[index + 1];
        if (!olderVersion) {
          return null;
        }

        const currentValidation = JsonResumeSchema.safeParse(
          version.normalizedData as unknown
        );
        const olderValidation = JsonResumeSchema.safeParse(
          olderVersion.normalizedData as unknown
        );

        if (!currentValidation.success || !olderValidation.success) {
          return null;
        }

        return [
          version.id,
          compareResumeVersions({
            currentVersionNumber: version.versionNumber,
            previousVersionNumber: olderVersion.versionNumber,
            current: currentValidation.data as JsonResume,
            previous: olderValidation.data as JsonResume,
          }),
        ] as const;
      })
      .filter((entry): entry is readonly [string, ReturnType<typeof compareResumeVersions>] =>
        Boolean(entry)
      )
  );

  return (
    <div className="space-y-6">
      <Link
        href="/resumes"
        className="inline-flex items-center rounded-full border border-stone-900/10 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-900/5"
      >
        Voltar para biblioteca
      </Link>

      <ResumeDetailShell
        resume={resume}
        latestResume={latestResumeValidation.data as JsonResume}
        comparison={comparison}
        auditComparisons={auditComparisons}
      />
    </div>
  );
}
