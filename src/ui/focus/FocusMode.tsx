// =====================================================================
// FocusMode — overlay fullscreen para deixar aberto durante a atividade.
//
// Intenção: ser a "tela do pomodoro", silenciosa, escura, com presença.
// Adquire Wake Lock (quando suportado) para manter a tela acesa.
// Sair com ESC ou clicando fora do centro.
// =====================================================================

import { useEffect, useRef, useState } from 'react';
import { Category } from '../../domain/types';
import { formatHM, formatHMS } from '../../domain/time';
import { FocusRing } from './FocusRing';
import { gerundForCategory } from './verbs';
import { useWakeLock } from './useWakeLock';

interface PomodoroConfig {
  sessions: number;
  workMin: number;
  breakMin: number;
}

interface PomodoroState {
  active: boolean;
  config: PomodoroConfig;
  currentSession: number;
  phase: 'work' | 'break';
  secondsLeft: number;
  soundEnabled: boolean;
}

const DEFAULT_POMODORO: PomodoroConfig = { sessions: 4, workMin: 50, breakMin: 10 };

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

  // Pomodoro state
  const [showPomodoroSetup, setShowPomodoroSetup] = useState(false);
  const [pomodoro, setPomodoro] = useState<PomodoroState>({
    active: false,
    config: DEFAULT_POMODORO,
    currentSession: 1,
    phase: 'work',
    secondsLeft: DEFAULT_POMODORO.workMin * 60,
    soundEnabled: false,
  });

  // Config drafts
  const [draftConfig, setDraftConfig] = useState<PomodoroConfig>(DEFAULT_POMODORO);

  const audioRef = useRef<AudioContext | null>(null);

  // Tick principal para o clock de elapsed time
  useEffect(() => {
    if (!open || !startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open, startedAt]);

  // Tick do pomodoro — separado para evitar interferência
  useEffect(() => {
    if (!pomodoro.active) return;
    const id = setInterval(() => {
      setPomodoro(prev => {
        if (prev.secondsLeft <= 1) {
          // Fase acabou
          if (prev.soundEnabled) playBeep(audioRef);
          const isWork = prev.phase === 'work';
          const nextSession = isWork ? prev.currentSession : prev.currentSession + 1;
          if (!isWork && nextSession > prev.config.sessions) {
            // Ciclo completo
            return {
              ...prev,
              active: false,
              phase: 'work',
              currentSession: 1,
              secondsLeft: prev.config.workMin * 60,
            };
          }
          return {
            ...prev,
            phase: isWork ? 'break' : 'work',
            currentSession: nextSession,
            secondsLeft: isWork
              ? prev.config.breakMin * 60
              : prev.config.workMin * 60,
          };
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [pomodoro.active]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
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

  function startPomodoro() {
    setPomodoro({
      active: true,
      config: draftConfig,
      currentSession: 1,
      phase: 'work',
      secondsLeft: draftConfig.workMin * 60,
      soundEnabled: pomodoro.soundEnabled,
    });
    setShowPomodoroSetup(false);
  }

  function stopPomodoro() {
    setPomodoro(prev => ({
      ...prev,
      active: false,
      phase: 'work',
      currentSession: 1,
      secondsLeft: prev.config.workMin * 60,
    }));
  }

  const pomodoroRunning = pomodoro.active;
  const pomodoroPhaseLabel = pomodoro.phase === 'work' ? 'foco' : 'pausa';

  return (
    <div className="fixed inset-0 z-50 bg-ink-950 flex flex-col">
      {/* ── Chrome topo ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 text-[11px] uppercase tracking-[0.3em] text-ink-400">
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

      {/* ── Conteúdo central ── ocupa todo o espaço disponível */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 px-4 py-2">
        <div
          className="text-xs uppercase tracking-[0.4em] mb-6"
          style={{ color: category.color }}
        >
          {gerundForCategory(category)}
        </div>

        {pomodoroRunning ? (
          /* ── Modo Pomodoro ── */
          <div className="flex flex-col items-center">
            <div className="text-[10px] uppercase tracking-[0.3em] text-ink-400 mb-4">
              sessão {pomodoro.currentSession}/{pomodoro.config.sessions} · {pomodoroPhaseLabel}
            </div>
            <div
              className="font-serif tabular-nums leading-none"
              style={{
                fontSize: 'clamp(3.5rem, 12vw, 7rem)',
                color: pomodoro.phase === 'work' ? category.color : '#7aa884',
              }}
            >
              {formatHMS(pomodoro.secondsLeft)}
            </div>
            <div className="mt-3 text-sm text-ink-400">
              {pomodoro.phase === 'work'
                ? `${pomodoro.config.workMin} min de foco`
                : `${pomodoro.config.breakMin} min de pausa`}
            </div>
            <div className="flex gap-2 mt-5">
              {Array.from({ length: pomodoro.config.sessions }).map((_, i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full transition-colors"
                  style={{
                    background:
                      i < pomodoro.currentSession - 1
                        ? category.color
                        : i === pomodoro.currentSession - 1
                          ? '#ece8df'
                          : '#2a2f3a',
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          /* ── Modo normal: anel ── */
          <FocusRing
            color={category.color}
            spentMinutes={spentMinutes}
            goalMinutes={goalMinutes}
            awakeMinutes={awakeMinutes}
            sessionSeconds={sessionSeconds}
            size={Math.min(480, typeof window !== 'undefined' ? window.innerHeight * 0.52 : 400)}
            pulsing
          >
            <div className="text-center">
              <div
                className="font-serif tabular-nums leading-none"
                style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)', color: '#ece8df' }}
              >
                {formatHMS(sessionSeconds)}
              </div>
              <div
                className="mt-3 font-medium"
                style={{ color: category.color, fontSize: 'clamp(0.9rem, 1.4vw, 1.3rem)' }}
              >
                {category.name}
              </div>
            </div>
          </FocusRing>
        )}

        {/* Estatística de progresso diário */}
        {!pomodoroRunning && (
          <div className="mt-6 text-sm text-ink-300 tabular-nums">
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
        )}

        {/* Botão encerrar — sempre visível no centro, separado da zona do pomodoro */}
        <button
          onClick={() => { onStop(); onClose(); }}
          className="mt-8 px-6 py-2.5 rounded-xl bg-ink-800 hover:bg-ink-700 text-ink-200 text-sm border border-ink-700 transition"
        >
          Encerrar atividade
        </button>

        {pomodoroRunning && (
          <button
            onClick={stopPomodoro}
            className="mt-3 text-[11px] text-ink-600 hover:text-ink-400 transition"
          >
            cancelar pomodoro
          </button>
        )}
      </div>

      {/* ── Rodapé fixo — pomodoro + texto contemplativo ── */}
      <div className="flex-shrink-0 flex flex-col items-center gap-2.5 py-5 border-t border-ink-800/60">
        {!pomodoroRunning && (
          <button
            onClick={() => { setDraftConfig(pomodoro.config); setShowPomodoroSetup(true); }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-ink-700/60 text-[11px] uppercase tracking-[0.2em] text-ink-400 hover:text-ink-200 hover:border-ink-600 transition"
          >
            <span>⏱</span>
            <span>Pomodoro</span>
          </button>
        )}
        <div className="text-[11px] uppercase tracking-[0.3em] text-ink-600">
          este é o tempo que você está vivendo
        </div>
      </div>

      {/* ── Overlay de configuração do pomodoro ── */}
      {showPomodoroSetup && (
        <div
          className="absolute inset-0 bg-ink-950/80 flex items-center justify-center z-10"
          onClick={() => setShowPomodoroSetup(false)}
        >
          <div
            className="bg-ink-800 border border-ink-700 rounded-2xl p-6 w-72 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-sm font-medium text-ink-200 mb-4">Configurar Pomodoro</div>
            <div className="space-y-3 mb-5">
              <PomodoroField
                label="Sessões"
                value={draftConfig.sessions}
                min={1} max={8}
                onChange={v => setDraftConfig(c => ({ ...c, sessions: v }))}
              />
              <PomodoroField
                label="Foco (min)"
                value={draftConfig.workMin}
                min={5} max={120} step={5}
                onChange={v => setDraftConfig(c => ({ ...c, workMin: v }))}
              />
              <PomodoroField
                label="Pausa (min)"
                value={draftConfig.breakMin}
                min={1} max={30} step={1}
                onChange={v => setDraftConfig(c => ({ ...c, breakMin: v }))}
              />
            </div>
            <div className="flex items-center justify-between mb-5">
              <span className="text-[12px] text-ink-400">Alerta sonoro</span>
              <button
                onClick={() => setPomodoro(p => ({ ...p, soundEnabled: !p.soundEnabled }))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  pomodoro.soundEnabled ? 'bg-ink-400' : 'bg-ink-700'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                  pomodoro.soundEnabled ? 'translate-x-4' : 'translate-x-1'
                }`} />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPomodoroSetup(false)}
                className="flex-1 py-2 rounded-lg bg-ink-700 hover:bg-ink-600 text-ink-300 text-sm transition"
              >
                Cancelar
              </button>
              <button
                onClick={startPomodoro}
                className="flex-1 py-2 rounded-lg text-sm transition font-medium"
                style={{ background: category.color, color: '#0a0c10' }}
              >
                Iniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PomodoroField({
  label, value, min, max, step = 1, onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-ink-400">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-6 h-6 rounded bg-ink-700 hover:bg-ink-600 text-ink-300 text-sm leading-none flex items-center justify-center"
        >
          −
        </button>
        <span className="text-sm tabular-nums text-ink-100 w-8 text-center">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-6 h-6 rounded bg-ink-700 hover:bg-ink-600 text-ink-300 text-sm leading-none flex items-center justify-center"
        >
          +
        </button>
      </div>
    </div>
  );
}

function playBeep(audioRef: React.MutableRefObject<AudioContext | null>) {
  try {
    if (!audioRef.current) {
      audioRef.current = new AudioContext();
    }
    const ctx = audioRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch {
    // AudioContext não disponível — silêncio
  }
}
