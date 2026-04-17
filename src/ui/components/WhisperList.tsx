// =====================================================================
// WhisperList — hábitos em sussurro.
//
// Princípio: o hábito só pede atenção quando ainda não foi cumprido.
//   - Satisfeito → some (ou aparece como linha finíssima, arquivada).
//   - Perto de cumprir (>= 70%) → ganha contraste discreto.
//   - Longe → mora no fundo, cinza discreto, sem cobrar.
//
// Anti-padrão evitado: checkbox gigante, barra colorida pesada, card
// de app de hábito. Aqui é texto + um tracinho de progresso muito fino.
// =====================================================================

import { Category, Habit, HabitStatus } from '../../domain/types';
import { formatHM } from '../../domain/time';

interface Props {
  habits: Habit[];
  statuses: HabitStatus[];
  categories: Category[];
}

export function WhisperList({ habits, statuses, categories }: Props) {
  const statusById = new Map(statuses.map(s => [s.habitId, s]));
  const catById    = new Map(categories.map(c => [c.id, c]));

  // Particiona: pendentes (em ordem de proximidade decrescente) e cumpridos.
  const pending = habits
    .filter(h => !(statusById.get(h.id)?.satisfied))
    .sort((a, b) => {
      const pa = statusById.get(a.id)?.progress ?? 0;
      const pb = statusById.get(b.id)?.progress ?? 0;
      return pb - pa;
    });
  const done = habits.filter(h => statusById.get(h.id)?.satisfied);

  if (habits.length === 0) return null;

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-[10px] uppercase tracking-[0.3em] text-ink-400">
          sussurros do dia
        </div>
        {done.length > 0 && (
          <div className="text-[10px] text-ink-500 tabular-nums">
            {done.length}/{habits.length} cumpridos
          </div>
        )}
      </div>

      {pending.length === 0 && (
        <div className="text-[13px] text-ink-400 italic">
          tudo que você pediu pra lembrar, você cumpriu.
        </div>
      )}

      <ul className="space-y-2.5">
        {pending.map(h => {
          const s    = statusById.get(h.id);
          const pct  = Math.round((s?.progress ?? 0) * 100);
          const near = (s?.progress ?? 0) >= 0.7;
          const cat  = catById.get(h.categoryId);
          const accent = cat?.color ?? '#6a7080';

          return (
            <li key={h.id} className="group">
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className={`text-[13px] transition-colors ${
                    near ? 'text-ink-200' : 'text-ink-400'
                  }`}
                >
                  {h.name}
                </span>
                <span
                  className={`text-[11px] tabular-nums ${
                    near ? 'text-ink-300' : 'text-ink-500'
                  }`}
                >
                  {formatHM(s?.spentMinutes ?? 0)}
                  <span className="text-ink-600"> / </span>
                  {formatHM(h.thresholdMinutes)}
                </span>
              </div>
              {/* trilho finíssimo; só respira com cor da categoria quando está perto */}
              <div className="mt-1 h-[2px] rounded-full bg-ink-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: near ? accent : '#3a3f4a',
                    opacity: near ? 0.9 : 0.7,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {/* cumpridos: linha arquivada, discreta, sem volume */}
      {done.length > 0 && (
        <ul className="mt-4 pt-3 border-t border-ink-800/80 space-y-1.5">
          {done.map(h => (
            <li
              key={h.id}
              className="flex items-baseline justify-between text-[11px] text-ink-500"
            >
              <span className="line-through decoration-ink-700 decoration-[0.5px]">
                {h.name}
              </span>
              <span className="text-ink-600">✓</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
