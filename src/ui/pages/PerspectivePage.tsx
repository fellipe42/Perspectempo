import { useMemo } from 'react';
import { useStore } from '../../state/useStore';
import { currentWeekDates, formatHM, todayISO } from '../../domain/time';
import {
  computeDayScore, spentByCategory,
  CLASSIFICATION_COLOR, CLASSIFICATION_LABEL,
} from '../../domain/scoring';
import { Category, DayClassification } from '../../domain/types';

const WEEKDAY = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

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

  // Densidade de dados → escolhe hierarquia visual.
  //   sparse  : 0–1 dia com dado → LifeWeeks vira herói; resto sumido/colapsado.
  //   partial : 2–3 dias        → Narrador + Colunas; projeção só se houver positivo/leak.
  //   rich    : 4+ dias         → layout completo, narrador em cima.
  const daysWithData = daysData.filter(d => d.score.totalMinutes > 30).length;
  const density: 'sparse' | 'partial' | 'rich' =
    daysWithData <= 1 ? 'sparse' : daysWithData <= 3 ? 'partial' : 'rich';

  if (density === 'sparse') {
    return (
      <div className="space-y-16 pb-12">
        <SparseIntro daysWithData={daysWithData} />
        <LifeWeeks />
        <WeekColumns daysData={daysData} categories={categories} today={today} />
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-12">
      <WeekNarrator daysData={daysData} categories={categories} weekGrand={weekTotals.grand} />

      <WeekColumns daysData={daysData} categories={categories} today={today} />

      {density === 'rich' && (
        <Projection weekTotals={weekTotals.totals} categories={categories} />
      )}

      <LifeWeeks />
    </div>
  );
}

function SparseIntro({ daysWithData }: { daysWithData: number }) {
  return (
    <section>
      <div className="text-[11px] uppercase tracking-[0.3em] text-ink-400 mb-3">perspectiva</div>
      <h2 className="font-serif text-3xl md:text-4xl leading-tight text-ink-100 max-w-2xl">
        {daysWithData === 0
          ? 'Ainda não há semana — mas há vida.'
          : 'Um dia já é um começo.'}
      </h2>
      <p className="mt-4 text-ink-400 text-sm max-w-xl leading-relaxed">
        Os números chegam com o uso. Por enquanto, a tela mais sincera é a de baixo:
        as semanas que você já viveu e as que ainda restam.
      </p>
    </section>
  );
}

// ===================================================================
// Narrador da semana — uma frase, em serif, no topo.
// ===================================================================
function WeekNarrator({
  daysData, categories, weekGrand,
}: {
  daysData: { date: string; spent: Record<string, number>; score: any }[];
  categories: Category[];
  weekGrand: number;
}) {
  const catById = new Map(categories.map(c => [c.id, c]));
  const totalsByMacro: Record<string, number> = {};
  for (const d of daysData) {
    for (const [id, m] of Object.entries(d.spent)) {
      const c = catById.get(id);
      if (!c) continue;
      totalsByMacro[c.macrobox] = (totalsByMacro[c.macrobox] ?? 0) + m;
    }
  }

  const sorted = Object.entries(totalsByMacro).sort((a, b) => b[1] - a[1]);
  const top = sorted[0]?.[0];

  const classified = daysData.filter(d => d.score.totalMinutes > 30);
  const dominantClass: DayClassification | null = dominantClassification(classified.map(d => d.score.classification));

  let sentence: string;
  if (weekGrand < 60) {
    sentence = 'Sua semana ainda é uma página em branco.';
  } else if (top === 'construcao') {
    sentence = 'Sua semana foi, sobretudo, de construção.';
  } else if (top === 'vazamento') {
    sentence = 'Sua semana teve mais vazamento do que você esperava.';
  } else if (top === 'nutricao') {
    sentence = 'Sua semana foi generosa em nutrição.';
  } else if (top === 'manutencao') {
    sentence = 'Sua semana foi de manutenção — o básico, em ordem.';
  } else {
    sentence = 'Sua semana está em movimento.';
  }

  return (
    <section>
      <div className="text-[11px] uppercase tracking-[0.3em] text-ink-400 mb-3">esta semana</div>
      <h2 className="font-serif text-3xl md:text-4xl leading-tight text-ink-100 max-w-2xl">
        {sentence}
      </h2>
      {dominantClass && (
        <p className="mt-4 text-ink-300 text-sm">
          Dias predominaram como{' '}
          <span
            className="font-medium"
            style={{ color: CLASSIFICATION_COLOR[dominantClass] }}
          >
            {CLASSIFICATION_LABEL[dominantClass].toLowerCase()}
          </span>
          .
        </p>
      )}
    </section>
  );
}

function dominantClassification(arr: DayClassification[]): DayClassification | null {
  if (arr.length === 0) return null;
  const count: Record<string, number> = {};
  for (const c of arr) count[c] = (count[c] ?? 0) + 1;
  let best: DayClassification = arr[0];
  let bestN = 0;
  for (const [k, v] of Object.entries(count)) {
    if (v > bestN) { best = k as DayClassification; bestN = v; }
  }
  return best;
}

// ===================================================================
// WeekColumns — "Tetris invertido": blocos coloridos empilhados do chão.
// Cada coluna é um dia. A altura total da coluna = tempo registrado naquele dia.
// ===================================================================
function WeekColumns({
  daysData, categories, today,
}: {
  daysData: { date: string; spent: Record<string, number>; score: any }[];
  categories: Category[];
  today: string;
}) {
  const catById = new Map(categories.map(c => [c.id, c]));

  // escala: altura máxima representa 16h; o resto é proporcional
  const MAX_MIN = 16 * 60;
  const COL_HEIGHT = 240; // px

  return (
    <section>
      <div className="text-[11px] uppercase tracking-[0.3em] text-ink-400 mb-4">a composição dos dias</div>
      <div className="grid grid-cols-7 gap-3">
        {daysData.map((d, i) => {
          const isToday = d.date === today;
          const isFuture = d.date > today;
          const total = d.score.totalMinutes;
          const ratio = Math.min(1, total / MAX_MIN);
          const stackHeight = ratio * COL_HEIGHT;

          // ordena categorias por tempo dentro do dia — maior na base
          const stackEntries = Object.entries(d.spent)
            .filter(([, m]) => m > 0)
            .sort((a, b) => b[1] - a[1]);

          return (
            <div key={d.date} className="flex flex-col items-center">
              <div className={`text-[10px] uppercase tracking-[0.2em] mb-2 ${isToday ? 'text-gold' : 'text-ink-400'}`}>
                {WEEKDAY[i]}
              </div>

              {/* coluna */}
              <div
                className={`relative w-full rounded-md ${isToday ? 'ring-1 ring-gold/40' : ''}`}
                style={{
                  height: COL_HEIGHT,
                  background: isFuture ? 'transparent' : '#161a21',
                  border: isFuture ? '1px dashed #2a2f3a' : '1px solid #1f232c',
                }}
              >
                {/* blocos empilhados a partir do chão */}
                {!isFuture && (
                  <div className="absolute bottom-0 left-0 right-0 flex flex-col-reverse">
                    {stackEntries.map(([id, m]) => {
                      const cat = catById.get(id);
                      if (!cat) return null;
                      const h = (m / MAX_MIN) * COL_HEIGHT;
                      return (
                        <div
                          key={id}
                          title={`${cat.name}: ${formatHM(m)}`}
                          style={{
                            height: Math.max(2, h),
                            background: cat.color,
                            opacity: 0.85,
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* data */}
              <div className="text-[10px] text-ink-500 tabular-nums mt-2">
                {d.date.slice(8)}
              </div>

              {/* ponto de classificação */}
              <div className="mt-1">
                {isFuture || total < 5 ? (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-ink-600" />
                ) : (
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: CLASSIFICATION_COLOR[d.score.classification as DayClassification] }}
                    title={CLASSIFICATION_LABEL[d.score.classification as DayClassification]}
                  />
                )}
              </div>

              {/* total */}
              <div className="text-[10px] text-ink-400 tabular-nums mt-1">
                {total > 0 ? formatHM(total) : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ===================================================================
// Projeção composta — frases comparativas em serif.
// "Se você manter este ritmo, em 6 meses..."
// ===================================================================
function Projection({
  weekTotals, categories,
}: { weekTotals: Record<string, number>; categories: Category[] }) {

  // top 2 categorias futuro-positivas (construção)
  const positive = categories
    .filter(c => c.future > 0)
    .map(c => ({ c, weekMin: weekTotals[c.id] ?? 0 }))
    .filter(x => x.weekMin > 0)
    .sort((a, b) => b.weekMin - a.weekMin)
    .slice(0, 2);

  // vazamentos
  const leaks = categories
    .filter(c => c.macrobox === 'vazamento')
    .map(c => ({ c, weekMin: weekTotals[c.id] ?? 0 }))
    .filter(x => x.weekMin > 0);

  if (positive.length === 0 && leaks.length === 0) {
    return (
      <section>
        <div className="text-[11px] uppercase tracking-[0.3em] text-ink-400 mb-4">se você manter este ritmo</div>
        <p className="text-ink-400 text-sm italic">
          Ainda é cedo — mais alguns dias de registro e a projeção começa a fazer sentido.
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="text-[11px] uppercase tracking-[0.3em] text-ink-400 mb-4">se você manter este ritmo</div>
      <div className="space-y-6 max-w-2xl">
        {positive.map(p => (
          <ProjectionSentence
            key={p.c.id}
            category={p.c}
            weekMin={p.weekMin}
            tone="positive"
          />
        ))}
        {leaks.map(p => (
          <ProjectionSentence
            key={p.c.id}
            category={p.c}
            weekMin={p.weekMin}
            tone="leak"
          />
        ))}
      </div>
    </section>
  );
}

function ProjectionSentence({
  category, weekMin, tone,
}: { category: Category; weekMin: number; tone: 'positive' | 'leak' }) {
  const sixMonths = weekMin * 26;
  const oneYear = weekMin * 52;

  const equiv = humanEquivalence(sixMonths);

  return (
    <div className="font-serif text-lg md:text-xl leading-relaxed text-ink-100">
      Em 6 meses você terá{' '}
      {tone === 'positive' ? 'dedicado a' : 'perdido em'}{' '}
      <span style={{ color: category.color }}>{category.name.toLowerCase()}</span>{' '}
      <span className="tabular-nums">{formatHM(sixMonths)}</span>{' '}
      <span className="text-ink-400 text-sm italic">— {equiv}.</span>
      <div className="text-sm text-ink-500 mt-1">
        Em 1 ano, <span className="tabular-nums">{formatHM(oneYear)}</span>.
      </div>
    </div>
  );
}

/** Converte minutos em uma comparação concreta e cotidiana. */
function humanEquivalence(minutes: number): string {
  const hours = minutes / 60;
  if (hours < 1)  return 'algumas conversas';
  if (hours < 10) return `${Math.round(hours)} sessões de cinema`;
  if (hours < 40) return `${Math.round(hours / 8)} dias de trabalho`;
  if (hours < 168) return `${Math.round(hours / 16)} dias acordados`;
  if (hours < 480) return `${Math.round(hours / 40)} semanas de trabalho`;
  return `${Math.round(hours / 16)} dias acordados — quase ${Math.round(hours / (16*7))} semanas`;
}

// ===================================================================
// LifeWeeks — a última coisa que você vê. Contemplativa.
// ===================================================================
function LifeWeeks() {
  const profile = useStore(s => s.profile);
  const totalWeeks = 90 * 52;

  // Usa a data de nascimento do perfil se disponível.
  // Fallback: 2000-01-01 (usuário sem onboarding).
  const birthMs = profile?.birthDate
    ? new Date(profile.birthDate).getTime()
    : new Date(2000, 0, 1).getTime();

  const livedWeeks = Math.floor(
    (Date.now() - birthMs) / (1000 * 60 * 60 * 24 * 7),
  );
  const remainingWeeks = Math.max(0, totalWeeks - livedWeeks);

  return (
    <section>
      <div className="text-[11px] uppercase tracking-[0.3em] text-ink-400 mb-6">sua vida em semanas</div>

      <div className="max-w-2xl">
        <p className="font-serif text-2xl md:text-3xl leading-tight text-ink-100">
          Você está na semana{' '}
          <span className="text-gold tabular-nums">{livedWeeks.toLocaleString('pt-BR')}</span>
          <span className="text-ink-400"> de uma vida estimada de </span>
          <span className="tabular-nums">{totalWeeks.toLocaleString('pt-BR')}</span>.
        </p>

        <p className="mt-4 text-sm text-ink-400 italic max-w-lg leading-relaxed">
          Esta semana, em particular, é única. As outras já foram
          ou ainda não foram.
        </p>
      </div>

      <div className="mt-10">
        <div
          className="grid gap-[2px] max-w-4xl"
          style={{ gridTemplateColumns: 'repeat(52, minmax(0, 1fr))' }}
        >
          {Array.from({ length: totalWeeks }).map((_, i) => {
            const isCurrent = i === livedWeeks;
            const isPast = i < livedWeeks;
            return (
              <div
                key={i}
                className={`aspect-square rounded-[1px] transition-colors ${
                  isCurrent
                    ? 'bg-gold'
                    : isPast
                      ? 'bg-ink-500/60'
                      : 'bg-ink-700/40'
                }`}
              />
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-6 text-[11px] uppercase tracking-[0.2em] text-ink-400">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-ink-500/60 rounded-sm" /> vividas
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-gold rounded-sm" /> esta semana
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-ink-700/60 rounded-sm" /> por viver
          </span>
          <span className="ml-auto text-ink-500 tabular-nums">
            restantes: {remainingWeeks.toLocaleString('pt-BR')}
          </span>
        </div>
      </div>
    </section>
  );
}
