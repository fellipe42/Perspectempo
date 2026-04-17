// =====================================================================
// DayRibbon — régua horizontal do dia, por macrocaixa.
//
// Eixo X = awakeMinutes (default 16h).
//   - Passado: blocos contíguos rastreados, cor = macrocaixa
//   - "Agora": linha vertical em ouro
//   - Futuro: traço fantasma hachurado
//
// Auto-explicação:
//   - Cabeçalho mostra "rastreado / acordado"
//   - Eixo inferior tem horas reais (06h, 12h, 18h)
//   - Legenda compacta na primeira renderização (cores + labels)
//   - Princípio: honesto, não inventa o que não foi rastreado.
// =====================================================================

import { Category, Macrobox, Session } from '../../domain/types';
import { MACROBOX_COLOR, MACROBOX_LABEL } from '../../domain/defaults';
import { formatHM, minutesBetween, todayISO } from '../../domain/time';

interface Props {
  sessions: Session[];
  categories: Category[];
  awakeMinutes: number;
  /** Horário de acordar em minutos desde meia-noite. Default 06:00. */
  wakeAtMin?: number;
  now?: number;
}

export function DayRibbon({
  sessions, categories, awakeMinutes,
  wakeAtMin = 6 * 60,
  now = Date.now(),
}: Props) {
  const date = todayISO();
  const catById = new Map(categories.map(c => [c.id, c]));

  // Sessões de hoje, em ordem cronológica.
  const todays = sessions
    .filter(s => new Date(s.startedAt).toISOString().slice(0, 10) === date)
    .sort((a, b) => a.startedAt - b.startedAt);

  // Agrupa em "runs" cronológicos por macrocaixa.
  type Run = { macro: Macrobox; minutes: number };
  const runs: Run[] = [];
  const macrosUsed = new Set<Macrobox>();
  let trackedMin = 0;
  for (const s of todays) {
    const cat = catById.get(s.categoryId);
    if (!cat) continue;
    const dur = minutesBetween(s.startedAt, s.endedAt ?? now);
    if (dur <= 0) continue;
    trackedMin += dur;
    macrosUsed.add(cat.macrobox);
    const last = runs[runs.length - 1];
    if (last && last.macro === cat.macrobox) {
      last.minutes += dur;
    } else {
      runs.push({ macro: cat.macrobox, minutes: dur });
    }
  }

  const axisMinutes = Math.max(awakeMinutes, trackedMin);
  const trackedPct  = (trackedMin / axisMinutes) * 100;
  const overPct     = Math.max(0, (trackedMin - awakeMinutes) / axisMinutes) * 100;

  // Marcadores de hora reais (06h, 09h, 12h, 15h, 18h, 21h, …).
  const sleepAtMin = wakeAtMin + awakeMinutes;
  const hourTicks: { label: string; pct: number }[] = [];
  // tick a cada 3h, sempre alinhado em hora cheia
  const startHour = Math.ceil(wakeAtMin / 60);
  const endHour   = Math.floor(sleepAtMin / 60);
  for (let h = startHour; h <= endHour; h += 3) {
    if (h === startHour && h * 60 === wakeAtMin) continue; // evita duplicar com "acordar"
    if (h === endHour && h * 60 === sleepAtMin) continue;
    const minSinceWake = h * 60 - wakeAtMin;
    const pct = (minSinceWake / axisMinutes) * 100;
    if (pct > 4 && pct < 96) {
      hourTicks.push({
        label: `${String(h).padStart(2, '0')}h`,
        pct,
      });
    }
  }

  return (
    <section aria-label="Trajeto do dia">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-[10px] uppercase tracking-[0.3em] text-ink-400">
          trajeto do dia
        </div>
        <div className="text-[11px] text-ink-400 tabular-nums">
          <span className="text-ink-100">{formatHM(trackedMin)}</span>
          <span className="text-ink-500"> rastreado · </span>
          <span className="text-ink-300">{formatHM(awakeMinutes)}</span>
          <span className="text-ink-500"> acordado</span>
        </div>
      </div>

      {/* régua */}
      <div className="relative w-full h-8 rounded-md overflow-hidden bg-ink-800/60 border border-ink-700/80">
        {/* blocos passados */}
        <div className="absolute inset-0 flex">
          {runs.map((r, i) => (
            <div
              key={i}
              style={{
                width: `${(r.minutes / axisMinutes) * 100}%`,
                background: MACROBOX_COLOR[r.macro],
                opacity: 0.92,
              }}
              title={`${MACROBOX_LABEL[r.macro]}: ${formatHM(r.minutes)}`}
            />
          ))}
        </div>

        {/* traço fantasma do futuro */}
        {trackedPct < 100 && (
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: `${trackedPct}%`,
              right: 0,
              backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 4px, #2a2f3a 4px 5px)',
              opacity: 0.6,
            }}
            aria-label="ainda por viver"
          />
        )}

        {/* marcador AGORA — mais óbvio: linha em ouro com bolinha no topo */}
        {trackedPct > 0 && trackedPct <= 100 && (
          <>
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-gold"
              style={{ left: `calc(${trackedPct}% - 1px)` }}
              aria-label="agora"
            />
            <div
              className="absolute -top-[3px] w-2 h-2 rounded-full bg-gold ring-2 ring-ink-900"
              style={{ left: `calc(${trackedPct}% - 4px)` }}
            />
          </>
        )}

        {/* transbordou awake */}
        {overPct > 0 && (
          <div
            className="absolute top-0 bottom-0 border-l border-overflow/60"
            style={{
              left: `${100 - overPct}%`,
              right: 0,
              background: 'repeating-linear-gradient(90deg, transparent 0 3px, #c97e5e22 3px 4px)',
            }}
            title="Passou do tempo acordado planejado"
          />
        )}
      </div>

      {/* eixo: horas reais + ancoragem (acordar / dormir) */}
      <div className="relative h-4 mt-1">
        {/* ticks de hora */}
        {hourTicks.map((t, i) => (
          <div
            key={i}
            className="absolute top-0"
            style={{ left: `calc(${t.pct}% - 8px)` }}
          >
            <div className="h-1.5 w-px bg-ink-700 mx-auto" />
            <div className="text-[9px] tabular-nums text-ink-500 mt-px text-center w-4">
              {t.label}
            </div>
          </div>
        ))}
        {/* "agora" no eixo */}
        {trackedPct > 0 && trackedPct <= 100 && (
          <div
            className="absolute top-0 text-[9px] uppercase tracking-widest text-gold"
            style={{
              left: trackedPct > 90 ? 'auto' : `calc(${trackedPct}% + 4px)`,
              right: trackedPct > 90 ? '0' : 'auto',
              top: '4px',
            }}
          >
            agora
          </div>
        )}
        <div className="absolute left-0 top-1 text-[9px] uppercase tracking-widest text-ink-500">
          {fmtHourFromMin(wakeAtMin)}
        </div>
        <div className="absolute right-0 top-1 text-[9px] uppercase tracking-widest text-ink-500">
          {fmtHourFromMin(sleepAtMin)}
        </div>
      </div>

      {/* legenda compacta — só mostra macrocaixas que apareceram hoje */}
      {macrosUsed.size > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
          {[...macrosUsed].map(m => (
            <span key={m} className="inline-flex items-center gap-1.5 text-[10px] text-ink-400">
              <span
                className="inline-block w-2 h-2 rounded-sm"
                style={{ background: MACROBOX_COLOR[m] }}
              />
              {MACROBOX_LABEL[m].toLowerCase()}
            </span>
          ))}
        </div>
      )}

      {/* mensagem para dia em branco */}
      {trackedMin === 0 && (
        <div className="mt-2 text-[11px] text-ink-500 italic">
          Nada rastreado ainda hoje. Comece uma atividade pra ver o trajeto desenhar.
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
