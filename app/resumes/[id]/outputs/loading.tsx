export default function ResumeOutputsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-52 animate-pulse rounded-full bg-stone-200/70" />
      <section className="rounded-[1.8rem] border border-stone-900/10 bg-white/70 p-6">
        <div className="h-4 w-40 animate-pulse rounded bg-stone-200/70" />
        <div className="mt-4 h-10 w-80 animate-pulse rounded bg-stone-200/70" />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="h-40 animate-pulse rounded-[1.4rem] bg-stone-100" />
          <div className="h-40 animate-pulse rounded-[1.4rem] bg-stone-100" />
        </div>
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="h-[32rem] animate-pulse rounded-[1.8rem] bg-stone-100" />
        <div className="h-[32rem] animate-pulse rounded-[1.8rem] bg-stone-100" />
      </section>
    </div>
  );
}
