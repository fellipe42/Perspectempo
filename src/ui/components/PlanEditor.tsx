import { useMemo } from 'react';
import { Category, DailyPlan, countsTowardAllocated, isCap } from '../../domain/types';
import { formatHM } from '../../domain/time';
import { MinuteInput } from './MinuteInput';

interface Props {
  categories: Category[];
  plan: DailyPlan;
  hasDefault: boolean;
  autoRebalanceEnabled: boolean;
  onSetAwake: (min: number) => void;
  onSetAllocation: (categoryId: string, min: number) => void;
  onAllocateSlack: () => void;
  onSaveAsDefault: () => void;
  onApplyDefault: () => void;
  onToggleAutoRebalance: () => void;
}

export function PlanEditor({
  categories, plan,
  hasDefault,
  autoRebalanceEnabled,
  onSetAwake, onSetAllocation, onAllocateSlack,
  onSaveAsDefault, onApplyDefault,
  onToggleAutoRebalance,
}: Props) {
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
      {/* Cabeçalho com totais */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-ink-200">Plano de hoje</h3>
        <div className="text-sm tabular-nums">
          <span className={overflow > 0 ? 'text-overflow' : 'text-ink-100'}>
            {formatHM(allocated)}
          </span>
          <span className="text-ink-500"> / </span>
          <span className="text-ink-300">{formatHM(plan.awakeMinutes)}</span>
          {overflow > 0 && (
            <span className="ml-2 text-overflow text-xs">+{formatHM(overflow)}</span>
          )}
        </div>
      </div>

      {/* Horas acordado */}
      <div className="flex flex-col gap-2 mb-4 pb-4 border-b border-ink-700/60">
        <div className="flex items-center gap-3">
          <label className="text-sm text-ink-300 flex-shrink-0">Acordado:</label>
          <MinuteInput
            value={plan.awakeMinutes}
            onChange={onSetAwake}
            min={60}
            max={24 * 60}
            step={30}
          />
        </div>
        {slack > 0 && (
          <button
            onClick={onAllocateSlack}
            className="self-start text-[11px] px-2.5 py-1 rounded-lg bg-ink-700/70 hover:bg-ink-600 text-ink-300 transition"
            title="Distribui o tempo livre proporcionalmente entre as atividades"
          >
            preencher {formatHM(slack)} livres
          </button>
        )}
      </div>

      {/* Remanejamento automático */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] text-ink-400">
          Remanejar automaticamente ao mudar horas
        </span>
        <button
          onClick={onToggleAutoRebalance}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            autoRebalanceEnabled ? 'bg-ink-400' : 'bg-ink-700'
          }`}
          role="switch"
          aria-checked={autoRebalanceEnabled}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
              autoRebalanceEnabled ? 'translate-x-4' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Atividades — lista de alocações */}
      <div className="space-y-1.5">
        {targets.map(c => {
          const min = plan.allocations[c.id] ?? 0;
          return (
            <div key={c.id} className="flex items-center gap-2 bg-ink-900/50 rounded-lg px-3 py-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: c.color }}
              />
              <span className="text-sm flex-1 min-w-0 truncate text-ink-200">{c.name}</span>
              <MinuteInput
                value={min}
                onChange={v => onSetAllocation(c.id, v)}
                step={5}
              />
            </div>
          );
        })}
      </div>

      {/* Limites tolerados — caps */}
      {caps.length > 0 && (
        <div className="mt-5 pt-4 border-t border-ink-700/80">
          <div className="flex items-baseline justify-between mb-1">
            <div className="text-[10px] uppercase tracking-[0.25em] text-ink-400">
              Limites tolerados
            </div>
            <div className="text-[10px] text-ink-600 italic">
              acima do limite = vazamento
            </div>
          </div>
          <p className="text-[11px] text-ink-500 mb-3">
            Defina até quanto aceitar. Zero é ótimo. Não somam ao plano.
          </p>
          <div className="space-y-1.5">
            {caps.map(c => {
              const min = plan.allocations[c.id] ?? 0;
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-2 bg-ink-900/30 border border-dashed border-ink-700/50 rounded-lg px-3 py-2"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: c.color }}
                  />
                  <span className="text-sm flex-1 min-w-0 truncate text-ink-300">{c.name}</span>
                  <span className="text-[10px] text-ink-600 flex-shrink-0 mr-1">limite</span>
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
          {hasDefault ? 'padrão salvo' : 'sem padrão definido'}
        </span>
      </div>
    </div>
  );
}
