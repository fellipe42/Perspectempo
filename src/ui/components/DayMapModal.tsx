import { Category, CategoryBalance, DayScore, TheftReport } from '../../domain/types';
import { formatHM } from '../../domain/time';
import { CLASSIFICATION_COLOR, CLASSIFICATION_LABEL, dayNarrative } from '../../domain/scoring';

interface Props {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  balances: CategoryBalance[];
  thefts: TheftReport[];
  score: DayScore;
}

export function DayMapModal({ open, onClose, categories, balances, thefts, score }: Props) {
  if (!open) return null;
  const catById = new Map(categories.map(c => [c.id, c]));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-4"
      onClick={onClose}
    >
      <div
        className="bg-ink-800 border border-ink-700 rounded-2xl p-6 max-w-2xl w-full mt-8 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Mapa do Dia</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-100 text-sm">
            Fechar ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <Stat label="Tempo registrado" value={formatHM(score.totalMinutes)} />
          <Stat
            label="Classificação"
            value={CLASSIFICATION_LABEL[score.classification]}
            valueColor={CLASSIFICATION_COLOR[score.classification]}
          />
          <Stat label="Enjoyment" value={`${score.enjoyment100}/100`} bar={score.enjoyment100} />
          <Stat label="Future / Construção" value={`${score.future100}/100`} bar={score.future100} />
        </div>

        <p className="text-ink-300 text-sm mb-5 italic">{dayNarrative(score)}</p>

        <h3 className="text-xs uppercase tracking-wide text-ink-400 mb-2">Planejado vs realizado</h3>
        <div className="space-y-1 mb-5">
          {balances
            .slice()
            .sort((a, b) => b.spentMinutes - a.spentMinutes)
            .map(b => {
              const c = catById.get(b.categoryId);
              if (!c) return null;
              const planned = Math.max(b.plannedMinutes, 1);
              const pct = Math.min(100, (b.spentMinutes / planned) * 100);
              return (
                <div key={b.categoryId} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  <span className="flex-1">{c.name}</span>
                  <div className="w-32 h-1.5 rounded-full bg-ink-700 overflow-hidden">
                    <div className="h-full" style={{ width: `${pct}%`, background: c.color }} />
                  </div>
                  <span className="text-ink-300 tabular-nums w-24 text-right">
                    {formatHM(b.spentMinutes)} / {formatHM(b.plannedMinutes)}
                  </span>
                </div>
              );
            })}
        </div>

        {thefts.length > 0 && (
          <>
            <h3 className="text-xs uppercase tracking-wide text-ink-400 mb-2">Tempo roubado</h3>
            <ul className="text-sm space-y-1">
              {thefts.map((t, i) => {
                const from = catById.get(t.fromCategoryId);
                const to = t.toCategoryId ? catById.get(t.toCategoryId) : null;
                return (
                  <li key={i}>
                    <span style={{ color: from?.color }}>{from?.name}</span>
                    <span className="text-ink-400"> roubou </span>
                    <span className="tabular-nums">{formatHM(t.minutes)}</span>
                    <span className="text-ink-400"> de </span>
                    <span style={{ color: to?.color ?? '#9aa1b2' }}>
                      {to ? to.name : 'nenhuma (excesso perdido)'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({
  label, value, bar, valueColor,
}: { label: string; value: string; bar?: number; valueColor?: string }) {
  return (
    <div className="bg-ink-900/60 border border-ink-700 rounded-xl p-3">
      <div className="text-xs text-ink-400 uppercase tracking-wide">{label}</div>
      <div className="text-lg font-semibold mt-1" style={valueColor ? { color: valueColor } : {}}>
        {value}
      </div>
      {bar !== undefined && (
        <div className="h-1 mt-2 bg-ink-700 rounded-full overflow-hidden">
          <div className="h-full bg-ink-300" style={{ width: `${bar}%` }} />
        </div>
      )}
    </div>
  );
}
