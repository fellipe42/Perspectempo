// =====================================================================
// AdjustLastSheet — folha leve para ajuste retroativo da última sessão.
//
// Resolve três casos cotidianos:
//   1. "Comecei essa atividade X min antes do que eu cliquei."
//      → desliza o INÍCIO da sessão atual pra trás.
//   2. "Cliquei a categoria errada."
//      → reatribui a categoria da última sessão sem perder o intervalo.
//   3. "Estava em A, virei B há Y min, mas só registrei agora."
//      → quebra a última sessão em duas no ponto Y atrás.
//
// Sem calendário. Sem date picker. Só relativo a agora, em minutos.
// =====================================================================

import { useState } from 'react';
import { Category, Session } from '../../domain/types';
import { formatHM } from '../../domain/time';

interface Props {
  open: boolean;
  onClose: () => void;
  lastSession: Session | null;
  lastCategory: Category | null;
  categories: Category[];
  shiftActiveStart: (deltaMin: number) => void;
  reassignLastSession: (categoryId: string) => void;
  splitLastSession: (atMs: number, newCategoryId: string) => void;
}

type Mode = 'shift' | 'reassign' | 'split';

export function AdjustLastSheet({
  open, onClose,
  lastSession, lastCategory, categories,
  shiftActiveStart, reassignLastSession, splitLastSession,
}: Props) {
  const [mode, setMode] = useState<Mode>('shift');
  const [shiftMin, setShiftMin] = useState(15);
  const [splitAgoMin, setSplitAgoMin] = useState(15);
  const [splitTo, setSplitTo] = useState<string>(categories[0]?.id ?? '');
  const [reassignTo, setReassignTo] = useState<string>(lastCategory?.id ?? categories[0]?.id ?? '');

  if (!open) return null;
  if (!lastSession || !lastCategory) {
    return (
      <Backdrop onClose={onClose}>
        <div className="rounded-2xl bg-ink-800 border border-ink-700 p-6 max-w-md w-full">
          <h3 className="font-serif text-xl text-ink-100">Sem sessão recente</h3>
          <p className="mt-2 text-sm text-ink-300">
            Comece uma atividade primeiro. Você poderá ajustar o início ou trocar
            a categoria depois — sem se preocupar em clicar no segundo exato.
          </p>
          <div className="mt-5 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-ink-700 hover:bg-ink-600 text-sm">
              fechar
            </button>
          </div>
        </div>
      </Backdrop>
    );
  }

  const isActive = !lastSession.endedAt;
  const sessionStartLocal = new Date(lastSession.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const sessionEndLocal = lastSession.endedAt
    ? new Date(lastSession.endedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : 'agora';
  const elapsedMin = Math.round(((lastSession.endedAt ?? Date.now()) - lastSession.startedAt) / 60_000);

  return (
    <Backdrop onClose={onClose}>
      <div className="rounded-2xl bg-ink-800 border border-ink-700 max-w-md w-full overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-700/80">
          <div className="text-[10px] uppercase tracking-[0.3em] text-ink-400">
            ajustar último período
          </div>
          <div className="mt-1.5 text-sm text-ink-200">
            <span style={{ color: lastCategory.color }}>{lastCategory.name}</span>{' '}
            <span className="text-ink-500">·</span>{' '}
            <span className="tabular-nums text-ink-300">
              {sessionStartLocal} → {sessionEndLocal}
            </span>{' '}
            <span className="text-ink-500">({formatHM(elapsedMin)})</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-ink-700/80">
          <Tab active={mode === 'shift'}    onClick={() => setMode('shift')}>
            mover início
          </Tab>
          <Tab active={mode === 'reassign'} onClick={() => setMode('reassign')}>
            trocar categoria
          </Tab>
          <Tab active={mode === 'split'}    onClick={() => setMode('split')}>
            dividir em duas
          </Tab>
        </div>

        {/* Conteúdo por modo */}
        <div className="px-5 py-5 space-y-4">
          {mode === 'shift' && (
            <>
              {!isActive && (
                <p className="text-[12px] text-ink-400 italic">
                  Esta sessão já foi encerrada. Ajustar o início só funciona quando
                  ainda está ativa.
                </p>
              )}
              <p className="text-sm text-ink-300">
                Empurrar o início para trás (negativo) ou para frente (positivo).
              </p>
              <Stepper
                value={shiftMin}
                onChange={setShiftMin}
                steps={[-30, -15, -5, +5, +15]}
                unit="min"
                disabled={!isActive}
              />
              <button
                disabled={!isActive}
                onClick={() => { shiftActiveStart(shiftMin); onClose(); }}
                className="w-full mt-2 px-4 py-3 rounded-lg bg-gold text-ink-900 font-medium text-sm hover:brightness-110 disabled:bg-ink-700 disabled:text-ink-500"
              >
                {shiftMin >= 0 ? `adiar início em ${shiftMin} min` : `recuar início em ${-shiftMin} min`}
              </button>
            </>
          )}

          {mode === 'reassign' && (
            <>
              <p className="text-sm text-ink-300">
                Trocar a categoria do último período sem perder o intervalo.
              </p>
              <CategoryPicker
                categories={categories}
                value={reassignTo}
                onChange={setReassignTo}
              />
              <button
                onClick={() => { reassignLastSession(reassignTo); onClose(); }}
                disabled={reassignTo === lastCategory.id}
                className="w-full mt-2 px-4 py-3 rounded-lg bg-gold text-ink-900 font-medium text-sm hover:brightness-110 disabled:bg-ink-700 disabled:text-ink-500"
              >
                reatribuir
              </button>
            </>
          )}

          {mode === 'split' && (
            <>
              <p className="text-sm text-ink-300">
                "Há {splitAgoMin} min eu já tinha trocado pra outra atividade,
                mas só registrei agora."
              </p>
              <Stepper
                value={splitAgoMin}
                onChange={setSplitAgoMin}
                steps={[5, 10, 15, 30, 45]}
                unit="min atrás"
                positiveOnly
              />
              <CategoryPicker
                categories={categories}
                value={splitTo}
                onChange={setSplitTo}
              />
              <button
                onClick={() => {
                  const at = (lastSession.endedAt ?? Date.now()) - splitAgoMin * 60_000;
                  splitLastSession(at, splitTo);
                  onClose();
                }}
                className="w-full mt-2 px-4 py-3 rounded-lg bg-gold text-ink-900 font-medium text-sm hover:brightness-110"
              >
                dividir
              </button>
            </>
          )}
        </div>

        <div className="px-5 py-3 border-t border-ink-700/80 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-ink-400 hover:text-ink-100 text-sm">
            cancelar
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
      onClick={onClose}
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div onClick={e => e.stopPropagation()} className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-3 py-3 text-[11px] uppercase tracking-[0.15em] transition ${
        active ? 'text-ink-100 border-b-2 border-gold' : 'text-ink-400 hover:text-ink-200 border-b-2 border-transparent'
      }`}
    >
      {children}
    </button>
  );
}

function Stepper({
  value, onChange, steps, unit, disabled, positiveOnly,
}: {
  value: number;
  onChange: (v: number) => void;
  steps: number[];
  unit: string;
  disabled?: boolean;
  positiveOnly?: boolean;
}) {
  return (
    <div>
      <div className={`text-center font-serif text-3xl tabular-nums mb-3 ${disabled ? 'text-ink-500' : 'text-ink-100'}`}>
        {value > 0 && !positiveOnly ? '+' : ''}{value}
        <span className="text-sm text-ink-400 ml-2">{unit}</span>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {steps.map(s => (
          <button
            key={s}
            disabled={disabled}
            onClick={() => onChange(s)}
            className={`min-w-[60px] min-h-[44px] px-3 py-2 rounded-lg text-sm tabular-nums transition ${
              value === s
                ? 'bg-ink-100 text-ink-900'
                : 'bg-ink-700 text-ink-200 hover:bg-ink-600'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {s > 0 && !positiveOnly ? '+' : ''}{s}
          </button>
        ))}
      </div>
    </div>
  );
}

function CategoryPicker({
  categories, value, onChange,
}: { categories: Category[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {categories.map(c => {
        const active = c.id === value;
        return (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className={`min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition ${
              active ? 'bg-ink-700 ring-1 ring-ink-400' : 'bg-ink-800/60 hover:bg-ink-700/60'
            }`}
          >
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: c.color }}
            />
            <span className="text-ink-100 truncate">{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}
