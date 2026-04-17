// =====================================================================
// FocusBlock — a atividade atual como centro da tela Hoje.
//
// Hierarquia visual do centro do anel:
//   1. Cronômetro (serif, maior)     — o momento
//   2. Nome da categoria (sans)      — contexto
//   3. Verbo gerúndio no topo do card— convite
//   4. "modo foco ↗" no canto        — utilitário discreto
//
// Regra: o tempo NUNCA compete com o nome. Nome = ~35% do tempo.
// =====================================================================

import { useEffect, useState } from 'react';
import { Category } from '../../domain/types';
import { formatHM, formatHMS } from '../../domain/time';
import { FocusRing } from './FocusRing';
import { gerundForCategory } from './verbs';

interface Props {
  category: Category | null;
  startedAt: number | null;
  spentMinutes: number;
  goalMinutes: number;
  awakeMinutes: number;
  onStop: () => void;
  onEnterFocusMode: () => void;
}

export function FocusBlock({
  category, startedAt,
  spentMinutes, goalMinutes, awakeMinutes,
  onStop, onEnterFocusMode,
}: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  // ---------- OCIOSO ----------
  if (!category || !startedAt) {
    return (
      <section className="rounded-3xl bg-ink-800/50 border border-ink-700/80 px-6 md:px-10 py-10 md:py-12">
        <div className="flex flex-col items-center">
          <div className="text-[10px] uppercase tracking-[0.35em] text-ink-400 mb-6">
            ocioso
          </div>
          <FocusRing
            color="#2a2f3a"
            spentMinutes={0}
            goalMinutes={0}
            awakeMinutes={awakeMinutes}
            sessionSeconds={0}
            size={280}
          >
            <div>
              <div className="font-serif text-4xl tabular-nums text-ink-400">00:00</div>
            </div>
          </FocusRing>
          <p className="mt-7 text-ink-300 text-sm">
            Nada rodando agora. Comece quando começar.
          </p>
        </div>
      </section>
    );
  }

  // ---------- ATIVO ----------
  const sessionSeconds = Math.floor((now - startedAt) / 1000);
  const hasGoal = goalMinutes > 0;
  const overrun = Math.max(0, spentMinutes - goalMinutes);
  const timeText = formatHMS(sessionSeconds);

  // Tipografia responsiva: HH:MM:SS cabe menos largo que MM:SS.
  // Calibrado para size=320 com safe≈147px.
  const isLong = timeText.length > 5; // "HH:MM:SS" vs "MM:SS"
  const timeClass = isLong
    ? 'text-[2.6rem] md:text-[3rem]'
    : 'text-[3.2rem] md:text-[3.8rem]';

  return (
    <section
      className="relative rounded-3xl bg-ink-800/50 border border-ink-700/80 px-6 md:px-10 py-10 md:py-12 overflow-hidden"
      style={{
        background: `radial-gradient(circle at 50% 20%, ${category.color}14, transparent 65%), rgba(22,26,33,0.5)`,
      }}
    >
      {/* linha superior: verbo + modo foco */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div
          className="text-[10px] uppercase tracking-[0.35em] font-medium"
          style={{ color: category.color }}
        >
          {gerundForCategory(category)}
        </div>
        <button
          onClick={onEnterFocusMode}
          className="text-[10px] uppercase tracking-[0.25em] text-ink-400 hover:text-ink-100 transition"
          aria-label="Entrar em Modo Foco"
        >
          modo foco ↗
        </button>
      </div>

      {/* centro: anel com tempo + nome */}
      <div className="flex justify-center">
        <FocusRing
          color={category.color}
          spentMinutes={spentMinutes}
          goalMinutes={goalMinutes}
          awakeMinutes={awakeMinutes}
          sessionSeconds={sessionSeconds}
          size={320}
          pulsing
        >
          <div className="flex flex-col items-center justify-center w-full">
            <div
              className={`font-serif tabular-nums text-ink-100 ${timeClass}`}
              style={{ lineHeight: 0.95, letterSpacing: '-0.01em' }}
            >
              {timeText}
            </div>
            <div
              className="mt-2 text-[0.8rem] md:text-sm font-medium"
              style={{ color: category.color, letterSpacing: '0.01em' }}
            >
              {category.name}
            </div>
          </div>
        </FocusRing>
      </div>

      {/* rodapé: meta + ação */}
      <div className="mt-8 md:mt-10 flex items-center justify-between text-sm">
        <div className="text-ink-300 tabular-nums">
          {hasGoal ? (
            <>
              <span className="text-ink-400">hoje </span>
              <span className="text-ink-100">{formatHM(spentMinutes)}</span>
              <span className="text-ink-400"> de </span>
              <span className="text-ink-100">{formatHM(goalMinutes)}</span>
              {overrun > 0 && (
                <span className="ml-2" style={{ color: category.color, opacity: 0.9 }}>
                  +{formatHM(overrun)}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-ink-400">sem meta — </span>
              <span className="text-ink-100">{formatHM(spentMinutes)}</span>
              <span className="text-ink-400"> nesta categoria hoje</span>
            </>
          )}
        </div>
        <button
          onClick={onStop}
          className="px-3.5 py-1.5 rounded-lg bg-ink-700/80 hover:bg-ink-600 text-ink-100 text-xs transition"
        >
          Encerrar
        </button>
      </div>
    </section>
  );
}
