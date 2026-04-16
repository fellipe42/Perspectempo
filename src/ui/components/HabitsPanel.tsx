import { Habit, HabitStatus } from '../../domain/types';
import { formatHM } from '../../domain/time';

interface Props {
  habits: Habit[];
  statuses: HabitStatus[];
}

export function HabitsPanel({ habits, statuses }: Props) {
  const statusById = new Map(statuses.map(s => [s.habitId, s]));
  return (
    <div className="rounded-2xl bg-ink-800 border border-ink-700 p-4">
      <h3 className="text-sm uppercase tracking-wide text-ink-400 mb-3">Hábitos do dia</h3>
      <div className="space-y-2">
        {habits.map(h => {
          const s = statusById.get(h.id);
          const pct = Math.round((s?.progress ?? 0) * 100);
          return (
            <div key={h.id} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${
                s?.satisfied ? 'bg-emerald-500 text-ink-900' : 'bg-ink-700 text-ink-400'
              }`}>
                {s?.satisfied ? '✓' : ''}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className={s?.satisfied ? 'text-ink-100' : 'text-ink-300'}>{h.name}</span>
                  <span className="text-ink-400 tabular-nums">
                    {formatHM(s?.spentMinutes ?? 0)} / {formatHM(h.thresholdMinutes)}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-ink-700 mt-1 overflow-hidden">
                  <div
                    className={`h-full ${s?.satisfied ? 'bg-emerald-500' : 'bg-ink-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
