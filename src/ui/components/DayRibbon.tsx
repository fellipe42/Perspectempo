import { Category, Macrobox, Session } from '../../domain/types';
import { MACROBOX_COLOR, MACROBOX_LABEL } from '../../domain/defaults';
import { formatHM } from '../../domain/time';

interface Props {
  sessions: Session[];
  categories: Category[];
  awakeMinutes: number;
  wakeAtMin?: number;
  mode?: 'awake' | '24h';
  now?: number;
}

const DAY_MINUTES = 24 * 60;
const DAY_MS = DAY_MINUTES * 60_000;

export function DayRibbon({
  sessions, categories, awakeMinutes,
  wakeAtMin = 6 * 60,
  mode = 'awake',
  now = Date.now(),
}: Props) {
  const catById = new Map(categories.map(c => [c.id, c]));
  const nowDate = new Date(now);
  const todayStartMs = new Date(
    nowDate.getFullYear(),
    nowDate.getMonth(),
    nowDate.getDate(),
  ).getTime();
  const nowMinSinceMidnight = nowDate.getHours() * 60 + nowDate.getMinutes();
  const awakeWrapsMidnight = wakeAtMin + awakeMinutes > DAY_MINUTES;

  const axisStartMs = mode === '24h'
    ? todayStartMs
    : (() => {
        const baseStartMs = todayStartMs + wakeAtMin * 60_000;
        const wrapTailMin = wakeAtMin + awakeMinutes - DAY_MINUTES;
        if (awakeWrapsMidnight && nowMinSinceMidnight < wrapTailMin) {
          return baseStartMs - DAY_MS;
        }
        return baseStartMs;
      })();
  const axisDurationMin = mode === '24h' ? DAY_MINUTES : awakeMinutes;
  const axisEndMs = axisStartMs + axisDurationMin * 60_000;

  type Run = { macro: Macrobox; startPct: number; widthPct: number };
  const runs: Run[] = [];
  const macrosUsed = new Set<Macrobox>();
  let trackedMin = 0;

  const visibleSessions = sessions
    .map((session) => {
      const endMs = session.endedAt ?? now;
      const visibleStartMs = Math.max(session.startedAt, axisStartMs);
      const visibleEndMs = Math.min(endMs, axisEndMs);
      if (visibleEndMs <= visibleStartMs) return null;
      return { session, visibleStartMs, visibleEndMs };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => a.visibleStartMs - b.visibleStartMs);

  for (const { session, visibleStartMs, visibleEndMs } of visibleSessions) {
    const cat = catById.get(session.categoryId);
    if (!cat) continue;

    const startMin = (visibleStartMs - axisStartMs) / 60_000;
    const durMin = (visibleEndMs - visibleStartMs) / 60_000;
    if (durMin <= 0) continue;

    trackedMin += durMin;
    macrosUsed.add(cat.macrobox);

    const startPct = (startMin / axisDurationMin) * 100;
    const widthPct = (durMin / axisDurationMin) * 100;
    const last = runs[runs.length - 1];

    if (last && last.macro === cat.macrobox && Math.abs((last.startPct + last.widthPct) - startPct) < 0.5) {
      last.widthPct += widthPct;
    } else {
      runs.push({ macro: cat.macrobox, startPct, widthPct });
    }
  }

  const nowMinOnAxis = (now - axisStartMs) / 60_000;
  const hasNowMarker = nowMinOnAxis > 0 && nowMinOnAxis < axisDurationMin;
  const nowPct = hasNowMarker ? (nowMinOnAxis / axisDurationMin) * 100 : 0;

  const ticks: { label: string; pct: number }[] = [];
  const minTickGapPct = mode === '24h' ? 10 : axisDurationMin <= 8 * 60 ? 14 : 12;
  let lastTickPct = -Infinity;
  const firstWholeHourMin = Math.ceil((axisStartMs / 60_000) / 60) * 60;
  const lastWholeHourMin = Math.floor((axisEndMs / 60_000) / 60) * 60;

  for (let absoluteHourMin = firstWholeHourMin; absoluteHourMin <= lastWholeHourMin; absoluteHourMin += 60) {
    const minOnAxis = absoluteHourMin - axisStartMs / 60_000;
    const pct = (minOnAxis / axisDurationMin) * 100;
    if (pct <= 6 || pct >= 94 || pct - lastTickPct < minTickGapPct) continue;
    ticks.push({ label: `${String((Math.floor(absoluteHourMin / 60) % 24 + 24) % 24).padStart(2, '0')}h`, pct });
    lastTickPct = pct;
  }

  const startLabel = fmtHourFromDate(axisStartMs);
  const endLabel = mode === '24h' ? '24h' : fmtHourFromDate(axisEndMs);

  return (
    <section aria-label="Trajeto do dia">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div className="text-[10px] uppercase tracking-[0.3em] text-ink-400">
          trajeto do dia
        </div>
        <div className="text-right text-[11px] text-ink-400 tabular-nums">
          <span className="text-ink-100">{formatHM(trackedMin)}</span>
          <span className="text-ink-500"> rastreado</span>
          {mode === 'awake' && (
            <>
              <span className="text-ink-500"> · </span>
              <span className="text-ink-300">{formatHM(awakeMinutes)}</span>
              <span className="text-ink-500"> acordado</span>
            </>
          )}
        </div>
      </div>

      <div className="relative h-8 w-full overflow-hidden rounded-md border border-ink-700/80 bg-ink-800/60">
        {runs.map((r, i) => (
          <div
            key={i}
            className="absolute inset-y-0"
            style={{
              left: `${r.startPct}%`,
              width: `${r.widthPct}%`,
              background: MACROBOX_COLOR[r.macro],
              opacity: 0.92,
            }}
            title={`${MACROBOX_LABEL[r.macro]}: ${formatHM(Math.round((r.widthPct / 100) * axisDurationMin))}`}
          />
        ))}

        {hasNowMarker && (
          <div
            className="absolute inset-y-0"
            style={{
              left: `${nowPct}%`,
              right: 0,
              backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 4px, #2a2f3a 4px 5px)',
              opacity: 0.6,
            }}
          />
        )}

        {hasNowMarker && (
          <>
            <div
              className="absolute inset-y-0 w-[2px] bg-gold"
              style={{ left: `calc(${nowPct}% - 1px)` }}
            />
            <div
              className="absolute -top-[3px] h-2 w-2 rounded-full bg-gold ring-2 ring-ink-900"
              style={{ left: `calc(${nowPct}% - 4px)` }}
            />
          </>
        )}
      </div>

      <div className="relative mt-1 h-4">
        {ticks.map((t, i) => (
          <div key={i} className="absolute top-0 -translate-x-1/2" style={{ left: `${t.pct}%` }}>
            <div className="mx-auto h-1.5 w-px bg-ink-700" />
            <div className="mt-px whitespace-nowrap text-center text-[9px] tabular-nums text-ink-500">
              {t.label}
            </div>
          </div>
        ))}
        {hasNowMarker && (
          <div
            className="absolute top-1 text-[9px] uppercase tracking-widest text-gold"
            style={{
              left: nowPct > 88 ? 'auto' : `calc(${nowPct}% + 4px)`,
              right: nowPct > 88 ? 0 : 'auto',
            }}
          >
            agora
          </div>
        )}
        <div className="absolute left-0 top-1 text-[9px] uppercase tracking-widest text-ink-500">
          {startLabel}
        </div>
        <div className="absolute right-0 top-1 text-[9px] uppercase tracking-widest text-ink-500">
          {endLabel}
        </div>
      </div>

      {macrosUsed.size > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
          {[...macrosUsed].map(m => (
            <span key={m} className="inline-flex items-center gap-1.5 text-[10px] text-ink-400">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ background: MACROBOX_COLOR[m] }} />
              {MACROBOX_LABEL[m].toLowerCase()}
            </span>
          ))}
        </div>
      )}

      {trackedMin === 0 && (
        <div className="mt-2 text-[11px] italic text-ink-500">
          Nada rastreado ainda hoje. Comece uma atividade pra ver o trajeto.
        </div>
      )}
    </section>
  );
}

function fmtHourFromDate(ms: number): string {
  const d = new Date(ms);
  const h = d.getHours();
  const m = d.getMinutes();
  return m === 0
    ? `${String(h).padStart(2, '0')}h`
    : `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
}
