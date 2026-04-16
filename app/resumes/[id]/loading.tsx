export default function ResumeDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 animate-pulse rounded-full bg-stone-200/80" />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="h-72 animate-pulse rounded-[1.8rem] bg-white/70" />
        <div className="h-72 animate-pulse rounded-[1.8rem] bg-white/70" />
      </div>
      <div className="h-96 animate-pulse rounded-[1.8rem] bg-white/70" />
    </div>
  );
}
