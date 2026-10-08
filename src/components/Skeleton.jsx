// Reusable skeleton primitives — use anywhere data is loading
export function SkeletonBox({ className = '' }) {
  return (
    <div className={`bg-slate-200 rounded animate-pulse ${className}`} />
  );
}

// Full customer-table skeleton (5 rows)
export function CustomerTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-gray-100">
          <tr>
            {['Name','Phone','Email','Service','Status','Actions'].map(h => (
              <th key={h} className="text-left px-6 py-3">
                <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="animate-pulse">
              <td className="px-6 py-4"><div className="h-4 w-28 bg-slate-100 rounded" /></td>
              <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
              <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
              <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
              <td className="px-6 py-4"><div className="h-5 w-20 bg-slate-100 rounded-full" /></td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <div className="h-7 w-7 bg-slate-100 rounded-lg" />
                  <div className="h-7 w-7 bg-slate-100 rounded-lg" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Single-card skeleton for stat cards
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-5 animate-pulse">
      <div className="w-14 h-14 rounded-xl bg-slate-200 flex-shrink-0" />
      <div className="flex-1">
        <div className="h-7 w-14 bg-slate-200 rounded-lg mb-2" />
        <div className="h-4 w-28 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

// Reviews list skeleton
export function ReviewRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 px-6 py-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex-shrink-0" />
        <div>
          <div className="h-4 w-24 bg-slate-100 rounded mb-1.5" />
          <div className="h-3 w-16 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="h-5 w-28 bg-slate-100 rounded-full" />
    </div>
  );
}
