// =====================================================================
// DayRibbon — régua horizontal do dia, por macrocaixa.
//
// Dois modos:
//   'awake' — eixo = janela de tempo acordado (wakeAtMin … wakeAtMin+awakeMinutes).
//             Pode cruzar meia-noite. Filtra sessões dentro dessa janela.
//   '24h'   — eixo fixo 0h–24h (um dia de calendário inteiro).
//             Filtra sessões pelo dia local (não UTC), trunca na meia-noite.
// =====================================================================

import { Category, Macrobox, Session } from '../../domain/types';
import { MACROBOX_COLOR, MACROBOX_LABEL } from '../../domain/defaults';
import { formatHM, minutesBetween } from '../../domain/time';

interface Props {
  sessions: Session[];
  categories: Category[];
  awakeMinutes: number;
  wakeAtMin?: number;
  mode?: 'awake' | '24h';
  now?: number;
}

/** Data local no formato YYYY-MM-DD */
function localISO(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function DayRibbon({
  sessions, categories, awakeMinutes,
  wakeAtMin = 6 * 60,
  mode = 'awake',
  now = Date.now(),
}: Props) {
  const today = localISO(now);
  const catById = new Map(categories.map(c => [c.id, c]));

  // ── Definição do eixo X ──
  const axisStartMin: number = mode === '24h' ? 0 : wakeAtMin;
  const axisEndMin: number   = mode === '24h' ? 24 * 60 : wakeAtMin + awakeMinutes;
  const axisDurationMin      = axisEndMin - axisStartMin;

  // Minutos desde meia-noite para o instante "now"
  const nowMinSinceMidnight = (new Date(now).getHours() * 60 + new Date(now).getMinutes());

  /** Converte ms epoch → minutos dentro do eixo (pode ficar fora de [0, axisDuration]) */
  function toAxisMin(ms: number): number {
    const d = new Date(ms);
    // minutos desde meia-noite do dia local em que ms cai
    const msLocalMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const minLocal = (ms - msLocalMidnight) / 60_000;
    // Se mode='awake' e a sessão é do dia SEGUINTE (cruza meia-noite), soma 24h
    if (mode === 'awake' && localISO(ms) > today) {
      return minLocal + 24 * 60 - axisStartMin;
    }
    return minLocal - axisStartMin;
  }

  // ── Filtragem de sessões ──
  function sessionIsVisible(s: Session): boolean {
    const endMs = s.endedAt ?? now;
    if (mode === '24h') {
      // Qualquer sessão cujo início OU fim é no dia local de hoje
      return localISO(s.startedAt) === today || localISO(endMs) === today;
    }
    // Modo awake: sessões cujo início OU fim cai dentro da janela [axisStart, axisEnd)
    const startMin = toAxisMin(s.startedAt);
    const endMin   = toAxisMin(endMs);
    return endMin > 0 && startMin < axisDurationMin;
  }

  const todays = sessions
    .filter(sessionIsVisible)
    .sort((a, b) => a.startedAt - b.startedAt);

  // ── Runs por macrocaixa ──
  type Run = { macro: Macrobox; startPct: number; widthPct: number };
  const runs: Run[] = [];
  const macrosUsed = new Set<Macrobox>();
  let trackedMin = 0;

  for (const s of todays) {
    const cat = catById.get(s.categoryId);
    if (!cat) continue;

    const rawStart = toAxisMin(s.startedAt);
    const rawEnd   = toAxisMin(s.endedAt ?? now);

    // Clamp ao eixo
    const clampedStart = Math.max(0, rawStart);
    const clampedEnd   = Math.min(axisDurationMin, rawEnd);
    const dur = clampedEnd - clampedStart;
    if (dur <= 0) continue;

    trackedMin += dur;
    macrosUsed.add(cat.macrobox);

    const startPct = (clampedStart / axisDurationMin) * 100;
    const widthPct = (dur / axisDurationMin) * 100;

    // Funde runs adjacentes da mesma macrocaixa
    const last = runs[runs.length - 1];
    if (last && last.macro === cat.macrobox && Math.abs((last.startPct + last.widthPct) - startPct) < 0.5) {
      last.widthPct += widthPct;
    } else {
      runs.push({ macro: cat.macrobox, startPct, widthPct });
    }
  }

  // ── "Agora" em % do eixo ──
  const nowAxisMin = mode === '24h' ? nowMinSinceMidnight : nowMinSinceMidnight - axisStartMin;
  const nowPct = Math.max(0, Math.min(100, (nowAxisMin / axisDurationMin) * 100));
  const hasNowMarker = nowPct > 0 && nowPct < 100;

  // ── Ticks de hora ──
  const ticks: { label: string; pct: number }[] = [];
  const step = axisDurationMin <= 8 * 60 ? 1 : axisDurationMin <= 14 * 60 ? 2 : 3;
  const startHour = Math.ceil(axisStartMin / 60);
  const endHour   = Math.floor(axisEndMin / 60);
  for (let h = startHour; h <= endHour; h += step) {
    const minOnAxis = h * 60 - axisStartMin;
    const pct = (minOnAxis / axisDurationMin) * 100;
    // Margem maior nas bordas para não colidir com labels extremas
    if (pct > 4 && pct < 91) {
      ticks.push({ label: `${String(h % 24).padStart(2, '0')}h`, pct });
    }
  }

  const startLabel = fmtHourFromMin(axisStartMin);
  const endLabel   = mode === '24h' ? '24h' : fmtHourFromMin(axisEndMin);

  // Overflow além das horas acordado (só relevante no modo awake)
  const overPct = mode === 'awake'
    ? Math.max(0, ((trackedMin - awakeMinutes) / axisDurationMin) * 100)
    : 0;

  return (
    <section aria-label="Trajeto do dia">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-[10px] uppercase tracking-[0.3em] text-ink-400">
          trajeto do dia
        </div>
        <div className="text-[11px] text-ink-400 tabular-nums">
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

      {/* régua */}
      <div className="relative w-full h-8 rounded-md overflow-hidden bg-ink-800/60 border border-ink-700/80">
        {/* blocos rastreados — posicionados absolutamente no eixo */}
        {runs.map((r, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0"
            style={{
              left: `${r.startPct}%`,
              width: `${r.widthPct}%`,
              background: MACROBOX_COLOR[r.macro],
              opacity: 0.92,
            }}
            title={`${MACROBOX_LABEL[r.macro]}: ${formatHM(Math.round((r.widthPct / 100) * axisDurationMin))}`}
          />
        ))}

        {/* futuro — hachura do nowPct até o fim */}
        {hasNowMarker && (
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: `${nowPct}%`,
              right: 0,
              backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 4px, #2a2f3a 4px 5px)',
              opacity: 0.6,
            }}
          />
        )}

        {/* linha AGORA */}
        {hasNowMarker && (
          <>
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-gold"
              style={{ left: `calc(${nowPct}% - 1px)` }}
            />
            <div
              className="absolute -top-[3px] w-2 h-2 rounded-full bg-gold ring-2 ring-ink-900"
              style={{ left: `calc(${nowPct}% - 4px)` }}
            />
          </>
        )}

        {/* overflow do plano (modo awake) */}
        {overPct > 0 && (
          <div
            className="absolute top-0 bottom-0 border-l border-overflow/60"
            style={{
              left: `${Math.min(100, (awakeMinutes / axisDurationMin) * 100)}%`,
              right: 0,
              background: 'repeating-linear-gradient(90deg, transparent 0 3px, #c97e5e22 3px 4px)',
            }}
          />
        )}
      </div>

      {/* eixo de horas */}
      <div className="relative h-4 mt-1">
        {ticks.map((t, i) => (
          <div key={i} className="absolute top-0" style={{ left: `calc(${t.pct}% - 8px)` }}>
            <div className="h-1.5 w-px bg-ink-700 mx-auto" />
            <div className="text-[9px] tabular-nums text-ink-500 mt-px text-center w-4">
              {t.label}
            </div>
          </div>
        ))}
        {/* label AGORA */}
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
        {/* bordas */}
        <div className="absolute left-0 top-1 text-[9px] uppercase tracking-widest text-ink-500">
          {startLabel}
        </div>
        <div className="absolute right-0 top-1 text-[9px] uppercase tracking-widest text-ink-500">
          {endLabel}
        </div>
      </div>

      {/* legenda */}
      {macrosUsed.size > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
          {[...macrosUsed].map(m => (
            <span key={m} className="inline-flex items-center gap-1.5 text-[10px] text-ink-400">
              <span className="inline-block w-2 h-2 rounded-sm" style={{ background: MACROBOX_COLOR[m] }} />
              {MACROBOX_LABEL[m].toLowerCase()}
            </span>
          ))}
        </div>
      )}

      {trackedMin === 0 && (
        <div className="mt-2 text-[11px] text-ink-500 italic">
          Nada rastreado ainda hoje. Comece uma atividade pra ver o trajeto.
        </div>
      )}
    </section>
  );
}

function fmtHourFromMin(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return m === 0
    ? `${String(h).padStart(2, '0')}h`
    : `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
}
