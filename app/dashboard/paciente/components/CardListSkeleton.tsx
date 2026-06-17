/** Loading skeleton shared by the historial / recetas / certificados tab bodies. */
export default function CardListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-3 w-56 rounded" />
          <div className="skeleton h-16 w-full rounded-lg mt-2" />
        </div>
      ))}
    </div>
  );
}
