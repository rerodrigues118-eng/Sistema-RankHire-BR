export default function Loading() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="h-8 w-52 rounded bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-white border border-slate-200 p-4">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="mt-4 h-8 w-28 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="h-[480px] rounded-xl bg-white border border-slate-200 p-6">
        <div className="h-5 w-40 rounded bg-slate-200" />
        <div className="mt-6 h-[380px] rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}
