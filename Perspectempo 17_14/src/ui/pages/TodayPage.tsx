import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../state/useStore';
import { todayISO } from '../../domain/time';
import {
  CLASSIFICATION_COLOR,
  CLASSIFICATION_LABEL,
  CLASSIFICATION_SUBTITLE,
  computeDayScore,
  spentByCategory,
} from '../../domain/scoring';
import { computeBalances } from '../../domain/timeTheft';
import { computeHabitStatus } from '../../domain/habits';
import { DayScore } from '../../domain/types';
import { FocusBlock } from '../focus/FocusBlock';
import { FocusMode } from '../focus/FocusMode';
import { CategoryChip } from '../components/CategoryChip';
import { CategoryBalances } from '../components/CategoryBalances';
import { PlanEditor } from '../components/PlanEditor';
import { DayMapModal } from '../components/DayMapModal';
import { DayRibbon } from '../components/DayRibbon';
import { MacroboxRows } from '../components/MacroboxRows';
import { WhisperList } from '../components/WhisperList';
import { AdjustLastSheet } from '../components/AdjustLastSheet';

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
    shiftActiveStart, reassignLastSession, splitLastSession,
    setAwakeMinutes, setAllocation,
  } = useStore();

  const [mapOpen, setMapOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const date = todayISO();
  const plan = plans[date];

  const activeSession = useMemo(
    () => sessions.find(s => s.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );
  const activeCategory = activeSession
    ? categories.find(c => c.id === activeSession.categoryId) ?? null
    : null;

  const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
  const lastCategory = lastSession
    ? categories.find(c => c.id === lastSession.categoryId) ?? null
    : null;

  // Atualização leve: sessão ativa → 10s (para o anel refletir o tempo),
  // sem sessão ativa → 10min.
  const tickKey = useTickEveryMs(activeSession ? 10_000 : 600_000);

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

  // Dados da atividade ativa para o FocusBlock / FocusMode
  const activeSpent = activeCategory ? (spent[activeCategory.id] ?? 0) : 0;
  const activeGoal  = activeCategory ? (plan.allocations[activeCategory.id] ?? 0) : 0;

  return (
    <div className="space-y-6">
      {/* ───────────── 1. NOW — a atividade atual, centro do momento ───────────── */}
      <FocusBlock
        category={activeCategory}
        startedAt={activeSession?.startedAt ?? null}
        spentMinutes={activeSpent}
        goalMinutes={activeGoal}
        awakeMinutes={plan.awakeMinutes}
        onStop={stopActivity}
        onEnterFocusMode={() => setFocusOpen(true)}
      />

      {/* trocar atividade: faixa de chips discreta, logo abaixo do anel */}
      <div className="rounded-2xl bg-ink-800/40 border border-ink-700/70 px-4 py-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className="text-[10px] uppercase tracking-[0.3em] text-ink-400">
            trocar atividade
          </div>
          {lastSession && (
            <button
              onClick={() => setAdjustOpen(true)}
              className="text-[10px] uppercase tracking-[0.2em] text-ink-400 hover:text-ink-100 transition min-h-[32px] px-2"
            >
              ajustar último ↺
            </button>
          )}
        </div>
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

      {/* ───────────── 2. DIA — régua cronológica por macrocaixa ───────────── */}
      <div className="rounded-2xl bg-ink-800/40 border border-ink-700/70 px-5 py-4">
        <DayRibbon
          sessions={sessions}
          categories={categories}
          awakeMinutes={plan.awakeMinutes}
        />
      </div>

      {/* ───────────── 3. SALDO — leitura primária por macrocaixa ───────────── */}
      <div className="rounded-2xl bg-ink-800/40 border border-ink-700/70 px-5 py-4">
        <MacroboxRows
          categories={categories}
          balances={balances}
          thefts={thefts}
        />

        {/* detalhe por categoria: escondido por padrão, só quem quiser mergulha */}
        <div className="mt-4 pt-3 border-t border-ink-800/80 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => setShowDetail(s => !s)}
            className="text-[11px] uppercase tracking-[0.2em] text-ink-400 hover:text-ink-200 transition min-h-[36px] px-1"
          >
            {showDetail ? '− esconder categorias' : '+ ver por categoria'}
          </button>
          <div className="flex items-center gap-3 text-[11px]">
            <button
              onClick={() => setShowPlan(s => !s)}
              className="text-ink-400 hover:text-ink-200 transition min-h-[36px] px-1"
            >
              {showPlan ? 'fechar plano' : 'editar plano'}
            </button>
            <span className="text-ink-700">·</span>
            <button
              onClick={() => setMapOpen(true)}
              className="text-gold hover:brightness-110 transition min-h-[36px] px-1"
            >
              mapa do dia ↗
            </button>
          </div>
        </div>

        {showPlan && (
          <div className="mt-4">
            <PlanEditor
              categories={categories}
              plan={plan}
              onSetAwake={setAwakeMinutes}
              onSetAllocation={setAllocation}
            />
          </div>
        )}

        {showDetail && (
          <div className="mt-4">
            <CategoryBalances categories={categories} balances={balances} thefts={thefts} />
          </div>
        )}
      </div>

      {/* ───────────── 4. SUSSURROS + LEITURA ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 rounded-2xl bg-ink-800/40 border border-ink-700/70 px-5 py-4">
          <WhisperList habits={habits} statuses={habitStatus} categories={categories} />
        </div>
        <div className="lg:col-span-2">
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

      <FocusMode
        open={focusOpen}
        onClose={() => setFocusOpen(false)}
        category={activeCategory}
        startedAt={activeSession?.startedAt ?? null}
        spentMinutes={activeSpent}
        goalMinutes={activeGoal}
        awakeMinutes={plan.awakeMinutes}
        onStop={stopActivity}
      />

      <AdjustLastSheet
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        lastSession={lastSession}
        lastCategory={lastCategory}
        categories={orderedCats}
        shiftActiveStart={shiftActiveStart}
        reassignLastSession={reassignLastSession}
        splitLastSession={splitLastSession}
      />
    </div>
  );
}

function ScoreSummary({ score }: { score: DayScore }) {
  return (
    <div className="rounded-2xl bg-ink-800/40 border border-ink-700/70 px-5 py-4 h-full">
      <div className="text-[10px] uppercase tracking-[0.3em] text-ink-400 mb-3">
        como está o dia
      </div>
      <div className="mb-4">
        <div
          className="font-serif text-3xl leading-none"
          style={{ color: CLASSIFICATION_COLOR[score.classification] }}
        >
          {CLASSIFICATION_LABEL[score.classification]}
        </div>
        <div className="text-xs text-ink-400 mt-1.5 italic">
          {CLASSIFICATION_SUBTITLE[score.classification]}
        </div>
      </div>
      <Bar label="Prazer" value={score.enjoyment100} />
      <Bar label="Futuro" value={score.future100} />
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex justify-between text-[11px] text-ink-400 mb-1">
        <span>{label}</span>
        <span className="tabular-nums">{value}/100</span>
      </div>
      <div className="h-1.5 bg-ink-800 rounded-full overflow-hidden">
        <div className="h-full bg-ink-200" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
