import { useMemo } from 'react';
import { Category, DailyPlan, countsTowardAllocated, isCap } from '../../domain/types';
import { formatHM } from '../../domain/time';
import { MACROBOX_LABEL } from '../../domain/defaults';

interface Props {
  categories: Category[];
  plan: DailyPlan;
  onSetAwake: (min: number) => void;
  onSetAllocation: (categoryId: string, min: number) => void;
}

export function PlanEditor({ categories, plan, onSetAwake, onSetAllocation }: Props) {
  // Total alocado: SOMA APENAS metas reais (target/protected/flexible).
  // Caps são limites tolerados, não cabem no orçamento positivo do dia.
  const allocated = useMemo(() => {
    let sum = 0;
    for (const c of categories) {
      if (!countsTowardAllocated(c)) continue;
      sum += plan.allocations[c.id] ?? 0;
    }
    return sum;
  }, [categories, plan.allocations]);

  const overflow = allocated - plan.awakeMinutes;
  const slack    = Math.max(0, plan.awakeMinutes - allocated);

  // Separa visualmente metas e caps.
  const targets = categories.filter(c => !isCap(c));
  const caps    = categories.filter(c =>  isCap(c));

  return (
    <div className="rounded-2xl bg-ink-800 border border-ink-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm uppercase tracking-wide text-ink-400">Plano de hoje</h3>
        <div className="text-sm tabular-nums">
          <span className="text-ink-300">Alocado:</span>{' '}
          <span className={overflow > 0 ? 'text-overflow' : 'text-ink-100'}>
            {formatHM(allocated)} / {formatHM(plan.awakeMinutes)}
          </span>
          {overflow > 0 && (
            <span className="ml-2 text-overflow">+{formatHM(overflow)}</span>
          )}
          {overflow <= 0 && slack > 0 && (
            <span className="ml-2 text-ink-500">· livre {formatHM(slack)}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-ink-300">Acordado:</label>
        <input
          type="number"
          min={1}
          max={20}
          step={0.5}
          value={(plan.awakeMinutes / 60).toString()}
          onChange={e => onSetAwake(Math.round(parseFloat(e.target.value || '0') * 60))}
          className="w-20 bg-ink-700 border border-ink-600 rounded-lg px-2 py-1 text-sm tabular-nums"
        />
        <span className="text-sm text-ink-400">horas</span>
      </div>

      {/* Metas — entram no alocado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {targets.map(c => {
          const min = plan.allocations[c.id] ?? 0;
          return (
            <div key={c.id} className="flex items-center gap-2 bg-ink-900/50 rounded-lg px-2 py-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
              <span className="text-sm flex-1">{c.name}</span>
              <span className="text-[10px] text-ink-500 uppercase">
                {MACROBOX_LABEL[c.macrobox]}
              </span>
              <input
                type="number"
                min={0}
                step={5}
                value={min}
                onChange={e => onSetAllocation(c.id, parseInt(e.target.value || '0', 10))}
                className="w-16 bg-ink-700 border border-ink-600 rounded px-1 py-0.5 text-sm tabular-nums text-right"
              />
              <span className="text-xs text-ink-400 w-6">min</span>
            </div>
          );
        })}
      </div>

      {/* Caps — orçamento NEGATIVO. Limite tolerado, não meta. */}
      {caps.length > 0 && (
        <div className="mt-5 pt-4 border-t border-ink-700/80">
          <div className="text-[10px] uppercase tracking-[0.25em] text-ink-400 mb-2">
            limites tolerados
          </div>
          <div className="text-[11px] text-ink-500 italic mb-3">
            Não somam ao alocado. Zero é ótimo. Acima do limite vira vazamento.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {caps.map(c => {
              const min = plan.allocations[c.id] ?? 0;
              return (
                <div key={c.id} className="flex items-center gap-2 bg-ink-900/30 border border-dashed border-ink-700/60 rounded-lg px-2 py-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  <span className="text-sm flex-1">{c.name}</span>
                  <span className="text-[10px] text-ink-500">até</span>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={min}
                    onChange={e => onSetAllocation(c.id, parseInt(e.target.value || '0', 10))}
                    className="w-16 bg-ink-700 border border-ink-600 rounded px-1 py-0.5 text-sm tabular-nums text-right"
                  />
                  <span className="text-xs text-ink-400 w-6">min</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
