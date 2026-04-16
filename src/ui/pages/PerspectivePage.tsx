import { useMemo } from 'react';
import { useStore } from '../../state/useStore';
import { currentWeekDates, formatHM, todayISO } from '../../domain/time';
import { computeDayScore, spentByCategory, CLASSIFICATION_COLOR, CLASSIFICATION_LABEL } from '../../domain/scoring';

const WEEKDAY = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];

export function PerspectivePage() {
  const { categories, sessions } = useStore();

  const week = useMemo(() => currentWeekDates(), []);
  const today = todayISO();

  const daysData = useMemo(() => {
    return week.map(date => {
      const spent = spentByCategory(sessions, date);
      const score = computeDayScore(spent, categories, date);
      return { date, spent, score };
    });
  }, [week, sessions, categories]);

  const weekTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    let grand = 0;
    for (const d of daysData) {
      for (const [id, m] of Object.entries(d.spent)) {
        totals[id] = (totals[id] ?? 0) + m;
        grand += m;
      }
    }
    return { totals, grand };
  }, [daysData]);

  const weekAvgEnjoy = avg(daysData.filter(d => d.score.totalMinutes > 0).map(d => d.score.enjoyment100));
  const weekAvgFuture = avg(daysData.filter(d => d.score.totalMinutes > 0).map(d => d.score.future100));

  // Life weeks ultra-simplificado: 90 anos × 52 semanas, marca semana atual.
  // Apenas para dar gosto da ideia. Tela mais elaborada pode vir depois.
  const totalWeeks = 90 * 52;
  const livedWeeks = Math.floor((Date.now() - new Date(2000, 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7));

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-semibold mb-3">Semana atual</h2>
        <div className="grid grid-cols-7 gap-2">
          {daysData.map((d, i) => {
            const isToday = d.date === today;
            const isFuture = d.date > today;
            const empty = d.score.totalMinutes < 5;
            return (
              <div
                key={d.date}
                className={`rounded-xl p-3 border ${isToday ? 'border-ink-300' : 'border-ink-700'} bg-ink-800`}
              >
                <div className="text-xs text-ink-400 uppercase tracking-wide">{WEEKDAY[i]}</div>
                <div className="text-sm tabular-nums text-ink-300">{d.date.slice(8)}</div>
                <div
                  className="mt-3 h-16 rounded-lg flex items-center justify-center text-xs font-medium"
                  style={{
                    background: isFuture
                      ? '#1a1e27'
                      : empty
                        ? '#262b37'
                        : `${CLASSIFICATION_COLOR[d.score.classification]}33`,
                    color: empty || isFuture ? '#6b7385' : CLASSIFICATION_COLOR[d.score.classification],
                  }}
                >
                  {isFuture ? '—' : empty ? 'sem dados' : CLASSIFICATION_LABEL[d.score.classification]}
                </div>
                <div className="mt-2 text-xs text-ink-400 tabular-nums">
                  {formatHM(d.score.totalMinutes)}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Stat title="Enjoyment médio" value={`${Math.round(weekAvgEnjoy)}/100`} />
        <Stat title="Future médio" value={`${Math.round(weekAvgFuture)}/100`} />
        <Stat title="Tempo registrado na semana" value={formatHM(weekTotals.grand)} />
      </section>

      <section>
        <h3 className="text-sm uppercase tracking-wide text-ink-400 mb-3">Distribuição da semana</h3>
        <div className="rounded-2xl bg-ink-800 border border-ink-700 p-4 space-y-2">
          {Object.entries(weekTotals.totals)
            .sort((a, b) => b[1] - a[1])
            .map(([id, min]) => {
              const c = categories.find(c => c.id === id);
              if (!c) return null;
              const pct = weekTotals.grand > 0 ? (min / weekTotals.grand) * 100 : 0;
              return (
                <div key={id} className="flex items-center gap-3 text-sm">
                  <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  <span className="flex-1">{c.name}</span>
                  <div className="w-48 h-1.5 bg-ink-700 rounded-full overflow-hidden">
                    <div className="h-full" style={{ width: `${pct}%`, background: c.color }} />
                  </div>
                  <span className="text-ink-300 tabular-nums w-20 text-right">{formatHM(min)}</span>
                  <span className="text-ink-400 tabular-nums w-12 text-right">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          {weekTotals.grand === 0 && (
            <div className="text-sm text-ink-400">Sem registros na semana ainda.</div>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-sm uppercase tracking-wide text-ink-400 mb-3">Projeção composta</h3>
        <CompositeProjection weekTotals={weekTotals.totals} categories={categories} />
      </section>

      <section>
        <h3 className="text-sm uppercase tracking-wide text-ink-400 mb-3">
          Life weeks (versão preliminar)
        </h3>
        <div className="rounded-2xl bg-ink-800 border border-ink-700 p-4">
          <div
            className="grid gap-[2px]"
            style={{ gridTemplateColumns: `repeat(52, minmax(0, 1fr))` }}
          >
            {Array.from({ length: totalWeeks }).map((_, i) => {
              const isCurrent = i === livedWeeks;
              const isPast = i < livedWeeks;
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-[1px] ${
                    isCurrent ? 'bg-emerald-400' : isPast ? 'bg-ink-500' : 'bg-ink-700'
                  }`}
                />
              );
            })}
          </div>
          <p className="text-xs text-ink-400 mt-3">
            Cada quadradinho = 1 semana de uma vida estimada de 90 anos.
            A semana em verde é a atual. A ideia: o que você está fazendo nesta semana específica?
          </p>
        </div>
      </section>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-ink-800 border border-ink-700 p-4">
      <div className="text-xs uppercase tracking-wide text-ink-400">{title}</div>
      <div className="text-2xl font-semibold mt-1 tabular-nums">{value}</div>
    </div>
  );
}

function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

import { Category } from '../../domain/types';

function CompositeProjection({
  weekTotals, categories,
}: { weekTotals: Record<string, number>; categories: Category[] }) {
  // Projeta o ritmo desta semana para 1 mês, 6 meses, 1 ano.
  const horizons = [
    { label: '1 mês',   weeks: 4 },
    { label: '6 meses', weeks: 26 },
    { label: '1 ano',   weeks: 52 },
  ];

  // Foco: categorias com future > 0 (construção) e vazamento.
  const positive = categories
    .filter(c => c.future > 0)
    .map(c => ({ c, weekMin: weekTotals[c.id] ?? 0 }))
    .filter(x => x.weekMin > 0)
    .sort((a, b) => b.weekMin - a.weekMin)
    .slice(0, 3);

  const leak = categories
    .filter(c => c.macrobox === 'vazamento')
    .map(c => ({ c, weekMin: weekTotals[c.id] ?? 0 }))
    .filter(x => x.weekMin > 0);

  return (
    <div className="rounded-2xl bg-ink-800 border border-ink-700 p-4 space-y-4">
      {positive.length === 0 && leak.length === 0 && (
        <div className="text-sm text-ink-400">Sem dados suficientes para projetar.</div>
      )}
      {positive.length > 0 && (
        <div>
          <div className="text-xs uppercase text-ink-400 mb-2">Se mantiver este ritmo, em…</div>
          <div className="space-y-1 text-sm">
            {positive.map(p => (
              <div key={p.c.id} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: p.c.color }} />
                <span className="font-medium" style={{ color: p.c.color }}>{p.c.name}:</span>
                <span className="text-ink-300">
                  {horizons.map((h, i) => (
                    <span key={h.label}>
                      {i > 0 && ' · '}
                      <span className="tabular-nums">{formatHM(p.weekMin * h.weeks)}</span>
                      <span className="text-ink-500"> em {h.label}</span>
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {leak.length > 0 && (
        <div>
          <div className="text-xs uppercase text-ink-400 mb-2">Vazamento composto</div>
          <div className="space-y-1 text-sm">
            {leak.map(p => (
              <div key={p.c.id} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: p.c.color }} />
                <span className="font-medium" style={{ color: p.c.color }}>{p.c.name}:</span>
                <span className="text-ink-300">
                  {horizons.map((h, i) => (
                    <span key={h.label}>
                      {i > 0 && ' · '}
                      <span className="tabular-nums">{formatHM(p.weekMin * h.weeks)}</span>
                      <span className="text-ink-500"> em {h.label}</span>
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
