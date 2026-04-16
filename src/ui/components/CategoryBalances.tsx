import { Category, CategoryBalance, TheftReport } from '../../domain/types';
import { formatHM } from '../../domain/time';

interface Props {
  categories: Category[];
  balances: CategoryBalance[];
  thefts: TheftReport[];
}

export function CategoryBalances({ categories, balances, thefts }: Props) {
  const catById = new Map(categories.map(c => [c.id, c]));

  // ordena: excedidos primeiro, depois por planejado desc
  const sorted = [...balances].sort((a, b) => {
    if (a.overrunMinutes !== b.overrunMinutes) return b.overrunMinutes - a.overrunMinutes;
    return b.plannedMinutes - a.plannedMinutes;
  });

  return (
    <div className="space-y-2">
      {sorted.map(b => {
        const cat = catById.get(b.categoryId);
        if (!cat) return null;
        const planned = b.plannedMinutes || 1; // evita divisão por zero
        const pct = Math.min(100, (b.spentMinutes / planned) * 100);
        const overrunPct = b.plannedMinutes > 0
          ? Math.min(100, (b.overrunMinutes / b.plannedMinutes) * 100)
          : (b.overrunMinutes > 0 ? 100 : 0);

        const stolenInto = thefts.filter(t => t.fromCategoryId === b.categoryId);

        return (
          <div key={b.categoryId} className="rounded-xl bg-ink-800 border border-ink-700 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                <span className="font-medium">{cat.name}</span>
                {cat.protected && <span className="text-[10px] text-ink-400 uppercase">protegida</span>}
              </div>
              <div className="text-sm text-ink-300 tabular-nums">
                {formatHM(b.spentMinutes)} / {formatHM(b.plannedMinutes)}
                {b.stolenFromMinutes > 0 && (
                  <span className="ml-2 text-ink-400">(−{formatHM(b.stolenFromMinutes)} cedido)</span>
                )}
              </div>
            </div>

            {/* barra base */}
            <div className="h-2 rounded-full bg-ink-700 overflow-hidden relative">
              <div
                className="h-full"
                style={{ width: `${pct}%`, background: cat.color, opacity: 0.85 }}
              />
              {b.overrunMinutes > 0 && (
                <div
                  className="absolute top-0 right-0 h-full bg-red-500/70"
                  style={{ width: `${overrunPct}%` }}
                  title="Excesso"
                />
              )}
            </div>

            {b.overrunMinutes > 0 && (
              <div className="mt-2 text-xs text-red-300">
                Excedeu em <strong>{formatHM(b.overrunMinutes)}</strong>
                {stolenInto.length > 0 && (
                  <>
                    {' '}— roubando de:{' '}
                    {stolenInto.map((t, i) => {
                      const v = t.toCategoryId ? catById.get(t.toCategoryId) : null;
                      return (
                        <span key={i}>
                          {i > 0 && ', '}
                          <span style={{ color: v?.color ?? '#9aa1b2' }}>
                            {v ? v.name : 'sem destino'}
                          </span>
                          <span className="text-ink-400"> {formatHM(t.minutes)}</span>
                        </span>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
