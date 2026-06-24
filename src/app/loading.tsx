export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-10 w-56 rounded-lg bg-slate-200/80 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white border border-slate-200 p-4">
              <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
              <div className="mt-4 h-8 w-32 rounded bg-slate-200 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 h-[420px] rounded-2xl bg-white border border-slate-200 p-6">
            <div className="h-5 w-40 rounded bg-slate-200 animate-pulse" />
            <div className="mt-6 h-[320px] rounded-xl bg-slate-100 animate-pulse" />
          </div>
          <div className="h-[420px] rounded-2xl bg-white border border-slate-200 p-6">
            <div className="h-5 w-32 rounded bg-slate-200 animate-pulse" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
