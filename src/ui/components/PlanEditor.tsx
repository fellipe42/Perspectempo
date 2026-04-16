import { useMemo } from 'react';
import { Category, DailyPlan } from '../../domain/types';
import { formatHM } from '../../domain/time';
import { MACROBOX_LABEL } from '../../domain/defaults';

interface Props {
  categories: Category[];
  plan: DailyPlan;
  onSetAwake: (min: number) => void;
  onSetAllocation: (categoryId: string, min: number) => void;
}

export function PlanEditor({ categories, plan, onSetAwake, onSetAllocation }: Props) {
  const allocated = useMemo(
    () => Object.values(plan.allocations).reduce((a, b) => a + (b || 0), 0),
    [plan.allocations],
  );
  const overflow = allocated - plan.awakeMinutes;

  return (
    <div className="rounded-2xl bg-ink-800 border border-ink-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm uppercase tracking-wide text-ink-400">Plano de hoje</h3>
        <div className="text-sm tabular-nums">
          <span className="text-ink-300">Alocado:</span>{' '}
          <span className={overflow > 0 ? 'text-red-300' : 'text-ink-100'}>
            {formatHM(allocated)} / {formatHM(plan.awakeMinutes)}
          </span>
          {overflow > 0 && (
            <span className="ml-2 text-red-300">+{formatHM(overflow)}</span>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {categories.map(c => {
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
    </div>
  );
}
