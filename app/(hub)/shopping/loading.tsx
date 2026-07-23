export default function ShoppingLoading() {
  return (
    <div className="p-4 pb-[160px] space-y-4 animate-pulse">
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 h-40 space-y-3">
        <div className="h-4 w-32 bg-slate-800 rounded" />
        <div className="h-8 w-48 bg-slate-800 rounded-xl" />
        <div className="h-3 w-full bg-slate-800 rounded-full" />
      </div>

      <div className="h-14 w-full bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl" />

      <div className="space-y-3 pt-2">
        <div className="h-4 w-28 bg-slate-800 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="h-16 bg-slate-900 rounded-2xl border border-slate-800" />
          <div className="h-16 bg-slate-900 rounded-2xl border border-slate-800" />
        </div>
      </div>
    </div>
  );
}
