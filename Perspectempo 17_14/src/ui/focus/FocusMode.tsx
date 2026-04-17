// =====================================================================
// FocusMode — overlay fullscreen para deixar aberto durante a atividade.
//
// Intenção: ser a "tela do pomodoro", silenciosa, escura, com presença.
// Adquire Wake Lock (quando suportado) para manter a tela acesa.
// Sair com ESC ou clicando fora do centro.
// =====================================================================

import { useEffect, useState } from 'react';
import { Category } from '../../domain/types';
import { formatHM, formatHMS } from '../../domain/time';
import { FocusRing } from './FocusRing';
import { gerundForCategory } from './verbs';
import { useWakeLock } from './useWakeLock';

interface Props {
  open: boolean;
  onClose: () => void;
  category: Category | null;
  startedAt: number | null;
  spentMinutes: number;
  goalMinutes: number;
  awakeMinutes: number;
  onStop: () => void;
}

export function FocusMode({
  open, onClose, category, startedAt,
  spentMinutes, goalMinutes, awakeMinutes, onStop,
}: Props) {
  const [now, setNow] = useState(Date.now());
  const { supported, locked } = useWakeLock(open);

  useEffect(() => {
    if (!open || !startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open, startedAt]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    // trava scroll do body enquanto aberto
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !category || !startedAt) return null;

  const sessionSeconds = Math.floor((now - startedAt) / 1000);
  const overrun = Math.max(0, spentMinutes - goalMinutes);

  return (
    <div className="fixed inset-0 z-50 bg-ink-950 flex flex-col items-center justify-center">
      {/* chrome topo — quase invisível */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 text-[11px] uppercase tracking-[0.3em] text-ink-400">
        <span>modo foco</span>
        <span className="flex items-center gap-3">
          {supported ? (
            <span title={locked ? 'Tela travada acesa' : 'Wake lock disponível'}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${locked ? 'bg-gold' : 'bg-ink-500'}`} />
              {locked ? 'tela acesa' : 'aguardando'}
            </span>
          ) : (
            <span className="text-ink-500">sem wake lock</span>
          )}
          <button
            onClick={onClose}
            className="hover:text-ink-100 transition"
            aria-label="Sair do Modo Foco (ESC)"
          >
            sair · esc
          </button>
        </span>
      </div>

      <div className="flex flex-col items-center">
        <div
          className="text-xs uppercase tracking-[0.4em] mb-8"
          style={{ color: category.color }}
        >
          {gerundForCategory(category)}
        </div>

        <FocusRing
          color={category.color}
          spentMinutes={spentMinutes}
          goalMinutes={goalMinutes}
          awakeMinutes={awakeMinutes}
          sessionSeconds={sessionSeconds}
          size={Math.min(560, typeof window !== 'undefined' ? window.innerHeight * 0.6 : 480)}
          pulsing
        >
          <div className="text-center">
            <div
              className="font-serif tabular-nums leading-none"
              style={{ fontSize: 'clamp(3rem, 8vw, 6.5rem)', color: '#ece8df' }}
            >
              {formatHMS(sessionSeconds)}
            </div>
            <div
              className="mt-4 font-medium"
              style={{ color: category.color, fontSize: 'clamp(1rem, 1.5vw, 1.5rem)' }}
            >
              {category.name}
            </div>
          </div>
        </FocusRing>

        <div className="mt-10 text-sm text-ink-300 tabular-nums">
          {goalMinutes > 0 ? (
            <>
              hoje <span className="text-ink-100">{formatHM(spentMinutes)}</span>
              <span className="text-ink-400"> de </span>
              <span className="text-ink-100">{formatHM(goalMinutes)}</span>
              {overrun > 0 && <span className="ml-3 text-overflow">+{formatHM(overrun)}</span>}
            </>
          ) : (
            <>sessão sem meta — {formatHM(spentMinutes)} hoje</>
          )}
        </div>

        <button
          onClick={() => { onStop(); onClose(); }}
          className="mt-8 px-5 py-2 rounded-xl bg-ink-800 hover:bg-ink-700 text-ink-200 text-sm border border-ink-700 transition"
        >
          Encerrar atividade
        </button>
      </div>

      {/* rodapé contemplativo */}
      <div className="absolute bottom-8 left-0 right-0 text-center text-[11px] uppercase tracking-[0.3em] text-ink-500">
        este é o tempo que você está vivendo
      </div>
    </div>
  );
}
