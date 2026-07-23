export default function DashboardLoading() {
  return (
    <div className="p-3 sm:p-5 pb-6 space-y-6 animate-pulse">
      {/* Title skeleton */}
      <div className="pt-2 space-y-2">
        <div className="h-3 w-24 bg-slate-800 rounded" />
        <div className="h-8 w-40 bg-slate-800 rounded-xl" />
      </div>

      {/* Grid Row 1: Summary & Thermometer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 h-64 space-y-4">
          <div className="h-4 w-32 bg-slate-800 rounded" />
          <div className="h-10 w-full bg-slate-800/60 rounded-xl" />
          <div className="h-px bg-slate-800" />
          <div className="h-10 w-full bg-slate-800/60 rounded-xl" />
          <div className="h-px bg-slate-800" />
          <div className="h-8 w-1/2 bg-slate-800/60 rounded-xl" />
        </div>

        <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/60 h-64 space-y-4">
          <div className="flex justify-between">
            <div className="h-4 w-36 bg-slate-800 rounded" />
            <div className="h-6 w-24 bg-slate-800 rounded-lg" />
          </div>
          <div className="h-8 w-full bg-slate-800/60 rounded-xl" />
          <div className="h-4 w-full bg-slate-800/60 rounded-full" />
          <div className="flex justify-between pt-2">
            <div className="h-4 w-20 bg-slate-800 rounded" />
            <div className="h-4 w-20 bg-slate-800 rounded" />
          </div>
        </div>
      </div>

      {/* Grid Row 2: Bills & Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 h-56 space-y-3">
          <div className="h-4 w-32 bg-slate-800 rounded" />
          <div className="h-12 w-full bg-slate-800/60 rounded-xl" />
          <div className="h-12 w-full bg-slate-800/60 rounded-xl" />
        </div>
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 h-56 space-y-3">
          <div className="h-4 w-32 bg-slate-800 rounded" />
          <div className="h-12 w-full bg-slate-800/60 rounded-xl" />
          <div className="h-12 w-full bg-slate-800/60 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
