import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../state/useStore';
import { todayISO } from '../../domain/time';
import { CLASSIFICATION_COLOR, CLASSIFICATION_LABEL, computeDayScore, spentByCategory } from '../../domain/scoring';
import { computeBalances } from '../../domain/timeTheft';
import { computeHabitStatus } from '../../domain/habits';
import { DayScore } from '../../domain/types';
import { Timer } from '../components/Timer';
import { CategoryChip } from '../components/CategoryChip';
import { CategoryBalances } from '../components/CategoryBalances';
import { PlanEditor } from '../components/PlanEditor';
import { HabitsPanel } from '../components/HabitsPanel';
import { DayMapModal } from '../components/DayMapModal';

function useTickEveryMs(ms: number) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
  return tick;
}

export function TodayPage() {
  const {
    categories, habits, plans, sessions, activeSessionId,
    startActivity, switchActivity, stopActivity,
    setAwakeMinutes, setAllocation,
  } = useStore();

  const [mapOpen, setMapOpen] = useState(false);
  const [showPlan, setShowPlan] = useState(false);

  const date = todayISO();
  const plan = plans[date];

  const activeSession = useMemo(
    () => sessions.find(s => s.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );
  const activeCategory = activeSession
    ? categories.find(c => c.id === activeSession.categoryId) ?? null
    : null;

  // Mantém o painel "fresco" mesmo com sessão ativa rodando.
  const tickKey = useTickEveryMs(activeSession ? 30_000 : 600_000);

  const spent = useMemo(
    () => spentByCategory(sessions, date),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessions, date, tickKey],
  );

  const { balances, thefts } = useMemo(
    () => plan ? computeBalances(plan, spent, categories) : { balances: [], thefts: [] },
    [plan, spent, categories],
  );

  const score = useMemo(
    () => computeDayScore(spent, categories, date),
    [spent, categories, date],
  );

  const habitStatus = useMemo(
    () => computeHabitStatus(habits, spent),
    [habits, spent],
  );

  const orderedCats = useMemo(() => {
    const order: Record<string, number> = {
      construcao: 0, manutencao: 1, sobrevivencia: 2, nutricao: 3, vazamento: 4,
    };
    return [...categories].sort((a, b) => (order[a.macrobox] ?? 99) - (order[b.macrobox] ?? 99));
  }, [categories]);

  if (!plan) return null;

  const totalOverrun = balances.reduce((a, b) => a + b.overrunMinutes, 0);
  const totalStolen  = thefts.filter(t => t.toCategoryId).reduce((a, t) => a + t.minutes, 0);

  return (
    <div className="space-y-4">
      <Timer
        category={activeCategory}
        startedAt={activeSession?.startedAt ?? null}
        onStop={stopActivity}
      />

      <div className="rounded-2xl bg-ink-800 border border-ink-700 p-4">
        <div className="text-xs uppercase tracking-wide text-ink-400 mb-3">Trocar atividade</div>
        <div className="flex flex-wrap gap-2">
          {orderedCats.map(c => (
            <CategoryChip
              key={c.id}
              category={c}
              active={activeSession?.categoryId === c.id}
              onClick={() => activeSession?.categoryId === c.id
                ? stopActivity()
                : (activeSession ? switchActivity(c.id) : startActivity(c.id))
              }
            />
          ))}
        </div>
      </div>

      {totalOverrun > 0 && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/40 px-4 py-3 text-sm flex items-center justify-between">
          <span>
            <strong className="text-red-300">Excesso de tempo:</strong> {Math.round(totalOverrun)} min,
            {' '}<span className="text-ink-300">roubando ~{Math.round(totalStolen)} min de outras categorias.</span>
          </span>
          <button
            onClick={() => setMapOpen(true)}
            className="text-xs text-red-200 hover:text-white underline"
          >
            ver mapa do dia
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Saldo por categoria</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPlan(s => !s)}
                className="text-xs px-3 py-1.5 rounded-lg bg-ink-700 hover:bg-ink-600"
              >
                {showPlan ? 'Esconder plano' : 'Editar plano'}
              </button>
              <button
                onClick={() => setMapOpen(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-ink-100 text-ink-900 hover:bg-white"
              >
                Mapa do dia
              </button>
            </div>
          </div>

          {showPlan && (
            <PlanEditor
              categories={categories}
              plan={plan}
              onSetAwake={setAwakeMinutes}
              onSetAllocation={setAllocation}
            />
          )}

          <CategoryBalances categories={categories} balances={balances} thefts={thefts} />
        </div>

        <div className="space-y-4">
          <HabitsPanel habits={habits} statuses={habitStatus} />
          <ScoreSummary score={score} />
        </div>
      </div>

      <DayMapModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        categories={categories}
        balances={balances}
        thefts={thefts}
        score={score}
      />
    </div>
  );
}

function ScoreSummary({ score }: { score: DayScore }) {
  return (
    <div className="rounded-2xl bg-ink-800 border border-ink-700 p-4">
      <h3 className="text-sm uppercase tracking-wide text-ink-400 mb-3">Como está o dia</h3>
      <div
        className="text-2xl font-semibold mb-3"
        style={{ color: CLASSIFICATION_COLOR[score.classification] }}
      >
        {CLASSIFICATION_LABEL[score.classification]}
      </div>
      <Bar label="Enjoyment" value={score.enjoyment100} />
      <Bar label="Future" value={score.future100} />
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex justify-between text-xs text-ink-400 mb-1">
        <span>{label}</span>
        <span className="tabular-nums">{value}/100</span>
      </div>
      <div className="h-1.5 bg-ink-700 rounded-full overflow-hidden">
        <div className="h-full bg-ink-100" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
