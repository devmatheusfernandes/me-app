export default function FinancialLoading() {
  return (
    <div className="p-5 pb-6 space-y-5 animate-pulse">
      {/* Title skeleton */}
      <div className="pt-2 space-y-2">
        <div className="h-3 w-20 bg-slate-800 rounded" />
        <div className="h-8 w-36 bg-slate-800 rounded-xl" />
      </div>

      {/* Tabs skeleton */}
      <div className="grid grid-cols-4 gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80">
        <div className="h-9 bg-slate-800 rounded-xl" />
        <div className="h-9 bg-slate-800/40 rounded-xl" />
        <div className="h-9 bg-slate-800/40 rounded-xl" />
        <div className="h-9 bg-slate-800/40 rounded-xl" />
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        <div className="h-20 bg-slate-900 rounded-2xl border border-slate-800" />
        <div className="h-20 bg-slate-900 rounded-2xl border border-slate-800" />
        <div className="h-20 bg-slate-900 rounded-2xl border border-slate-800" />
        <div className="h-20 bg-slate-900 rounded-2xl border border-slate-800" />
      </div>
    </div>
  );
}
