import { useMemo } from 'react';
import { Category, DailyPlan, countsTowardAllocated, isCap } from '../../domain/types';
import { formatHM } from '../../domain/time';
import { MACROBOX_LABEL } from '../../domain/defaults';
import { MinuteInput } from './MinuteInput';

interface Props {
  categories: Category[];
  plan: DailyPlan;
  hasDefault: boolean;
  onSetAwake: (min: number) => void;
  onSetAllocation: (categoryId: string, min: number) => void;
  onSaveAsDefault: () => void;
  onApplyDefault: () => void;
}

export function PlanEditor({
  categories, plan,
  hasDefault,
  onSetAwake, onSetAllocation,
  onSaveAsDefault, onApplyDefault,
}: Props) {
  // Total alocado: SOMA APENAS metas reais (target/protected/flexible).
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

      {/* Horas acordado */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-ink-300 flex-shrink-0">Acordado:</label>
        <MinuteInput
          value={plan.awakeMinutes}
          onChange={onSetAwake}
          min={60}
          max={24 * 60}
          step={30}
        />
      </div>

      {/* Metas — entram no alocado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {targets.map(c => {
          const min = plan.allocations[c.id] ?? 0;
          return (
            <div key={c.id} className="flex items-center gap-2 bg-ink-900/50 rounded-lg px-2 py-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
              <span className="text-sm flex-1 truncate">{c.name}</span>
              <span className="text-[10px] text-ink-500 uppercase flex-shrink-0">
                {MACROBOX_LABEL[c.macrobox]}
              </span>
              <MinuteInput
                value={min}
                onChange={v => onSetAllocation(c.id, v)}
                step={5}
              />
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
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-sm flex-1 truncate">{c.name}</span>
                  <span className="text-[10px] text-ink-500 flex-shrink-0">até</span>
                  <MinuteInput
                    value={min}
                    onChange={v => onSetAllocation(c.id, v)}
                    step={5}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plano padrão */}
      <div className="mt-4 pt-3 border-t border-ink-700/60 flex flex-wrap items-center gap-2">
        <button
          onClick={onSaveAsDefault}
          className="text-[11px] px-3 py-1.5 rounded-lg bg-ink-700 hover:bg-ink-600 text-ink-300 transition min-h-[32px]"
          title="Salva este plano como modelo para novos dias"
        >
          salvar como padrão
        </button>
        {hasDefault && (
          <button
            onClick={onApplyDefault}
            className="text-[11px] px-3 py-1.5 rounded-lg bg-ink-700 hover:bg-ink-600 text-ink-300 transition min-h-[32px]"
            title="Restaura o plano padrão para hoje"
          >
            aplicar padrão
          </button>
        )}
        <span className="text-[11px] text-ink-600 italic ml-1">
          {hasDefault ? 'plano padrão salvo' : 'nenhum padrão definido'}
        </span>
      </div>
    </div>
  );
}
