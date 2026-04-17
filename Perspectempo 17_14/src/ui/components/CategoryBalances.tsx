import { Category, CategoryBalance, TheftReport, isCap } from '../../domain/types';
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
        const planned = b.plannedMinutes || 1;
        const pct = Math.min(100, (b.spentMinutes / planned) * 100);
        const overrunPct = b.plannedMinutes > 0
          ? Math.min(100, (b.overrunMinutes / b.plannedMinutes) * 100)
          : (b.overrunMinutes > 0 ? 100 : 0);

        const isCategoryCap = isCap(cat);
        const stolenInto = thefts.filter(t => t.fromCategoryId === b.categoryId);

        return (
          <div key={b.categoryId} className="rounded-xl bg-ink-800 border border-ink-700 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                <span className="font-medium">{cat.name}</span>
                {cat.budgetType === 'protected' && (
                  <span className="text-[10px] text-ink-400 uppercase">protegida</span>
                )}
                {cat.budgetType === 'flexible' && (
                  <span className="text-[10px] text-ink-400 uppercase">flexível</span>
                )}
                {isCategoryCap && (
                  <span className="text-[10px] text-ink-400 uppercase">limite</span>
                )}
              </div>
              <div className="text-sm text-ink-300 tabular-nums">
                {isCategoryCap ? (
                  <>
                    {formatHM(b.spentMinutes)}
                    <span className="text-ink-500"> / até {formatHM(b.plannedMinutes)}</span>
                  </>
                ) : (
                  <>
                    {formatHM(b.spentMinutes)} / {formatHM(b.plannedMinutes)}
                    {b.stolenFromMinutes > 0 && (
                      <span className="ml-2 text-ink-400">(−{formatHM(b.stolenFromMinutes)} cedido)</span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* barra base */}
            <div className="h-2 rounded-full bg-ink-700 overflow-hidden relative">
              {/* preenchimento normal — para cap, opacidade menor quando dentro do limite */}
              <div
                className="h-full"
                style={{
                  width: `${pct}%`,
                  background: cat.color,
                  opacity: isCategoryCap && b.overrunMinutes === 0 ? 0.55 : 0.85,
                }}
              />
              {b.overrunMinutes > 0 && (
                <div
                  className="absolute top-0 right-0 h-full"
                  style={{
                    width: `${overrunPct}%`,
                    background: '#c97e5e', // overflow ocre
                    opacity: 0.8,
                  }}
                  title="Acima do limite"
                />
              )}
            </div>

            {/* Mensagens de status */}
            {isCategoryCap ? (
              <>
                {b.overrunMinutes > 0 && (
                  <div className="mt-2 text-xs text-overflow">
                    Passou do limite em <strong>{formatHM(b.overrunMinutes)}</strong>{' '}
                    — vazamento puro, sem destino.
                  </div>
                )}
                {b.spentMinutes === 0 && b.plannedMinutes > 0 && (
                  <div className="mt-2 text-xs text-ink-500 italic">
                    Em zero hoje. Bom assim.
                  </div>
                )}
              </>
            ) : (
              b.overrunMinutes > 0 && (
                <div className="mt-2 text-xs text-overflow">
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
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
