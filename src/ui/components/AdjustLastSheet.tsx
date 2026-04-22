// =====================================================================
// AdjustLastSheet — folha de ajuste retroativo da última sessão.
//
// Resolve quatro casos cotidianos:
//   1. "Comecei X min antes/depois do que cliquei."
//      → desliza o INÍCIO da sessão (ativa ou encerrada).
//   2. "Terminei X min antes do que cliquei." (só sessões encerradas)
//      → ajusta o FIM da última sessão.
//   3. "Cliquei a categoria errada."
//      → reatribui a categoria sem perder o intervalo.
//   4. "Estava em A, virei B há Y min, mas só registrei agora."
//      → quebra a sessão em duas no ponto Y atrás.
//   5. "Esqueci de registrar um bloco."
//      → adiciona uma sessão retroativa no passado.
// =====================================================================

import { useMemo, useState } from 'react';
import { Category, Session } from '../../domain/types';
import { formatHM } from '../../domain/time';

interface Props {
  open: boolean;
  onClose: () => void;
  lastSession: Session | null;
  lastCategory: Category | null;
  categories: Category[];
  shiftLastSessionStart: (deltaMin: number) => void;
  shiftLastSessionEnd: (deltaMin: number) => void;
  reassignLastSession: (categoryId: string) => void;
  splitLastSession: (atMs: number, newCategoryId: string) => void;
  addRetroSession: (categoryId: string, startMs: number, endMs: number) => void;
}

type Mode = 'shift-start' | 'shift-end' | 'reassign' | 'split' | 'add-block';

export function AdjustLastSheet({
  open, onClose,
  lastSession, lastCategory, categories,
  shiftLastSessionStart, shiftLastSessionEnd,
  reassignLastSession, splitLastSession, addRetroSession,
}: Props) {
  const [mode, setMode] = useState<Mode>('shift-start');

  // shift-start / shift-end
  const [shiftMin, setShiftMin] = useState(15);
  const [endShiftMin, setEndShiftMin] = useState(-15);

  // split
  const [splitAgoMin, setSplitAgoMin] = useState(15);
  const [splitTo, setSplitTo] = useState<string>(categories[0]?.id ?? '');

  // reassign
  const [reassignTo, setReassignTo] = useState<string>(lastCategory?.id ?? categories[0]?.id ?? '');

  // add-block
  const [blockCat, setBlockCat] = useState<string>(categories[0]?.id ?? '');
  const [blockStartAgo, setBlockStartAgo] = useState(60);
  const [blockDuration, setBlockDuration] = useState(30);

  if (!open) return null;

  if (!lastSession || !lastCategory) {
    return (
      <Backdrop onClose={onClose}>
        <div className="rounded-2xl bg-ink-800 border border-ink-700 p-6 max-w-md w-full">
          <h3 className="font-serif text-xl text-ink-100">Sem sessão recente</h3>
          <p className="mt-2 text-sm text-ink-300">
            Comece uma atividade primeiro. Você poderá ajustar o início ou trocar
            a categoria depois — sem precisar clicar no segundo exato.
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
  const startLocal = new Date(lastSession.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const endLocal = lastSession.endedAt
    ? new Date(lastSession.endedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : 'agora';
  const elapsedMin = Math.round(((lastSession.endedAt ?? Date.now()) - lastSession.startedAt) / 60_000);

  // Preview do bloco retroativo
  const blockStart = Date.now() - blockStartAgo * 60_000;
  const blockEnd = blockStart + blockDuration * 60_000;
  const blockStartStr = new Date(blockStart).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const blockEndStr = new Date(blockEnd).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <Backdrop onClose={onClose}>
      <div className="rounded-2xl bg-ink-800 border border-ink-700 max-w-md w-full overflow-hidden">
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-ink-700/80">
          <div className="text-[10px] uppercase tracking-[0.3em] text-ink-400">
            ajustar período
          </div>
          <div className="mt-1.5 text-sm text-ink-200 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span style={{ color: lastCategory.color }}>{lastCategory.name}</span>
            <span className="text-ink-600">·</span>
            <span className="tabular-nums text-ink-400">
              {startLocal} → {endLocal}
            </span>
            <span className="text-ink-600">({formatHM(elapsedMin)})</span>
            {isActive && (
              <span className="text-[10px] bg-ink-700 text-ink-300 px-1.5 py-0.5 rounded">
                ativa
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-ink-700/80 no-scrollbar">
          <Tab active={mode === 'shift-start'} onClick={() => setMode('shift-start')}>
            mover início
          </Tab>
          {!isActive && (
            <Tab active={mode === 'shift-end'} onClick={() => setMode('shift-end')}>
              ajustar fim
            </Tab>
          )}
          <Tab active={mode === 'reassign'} onClick={() => setMode('reassign')}>
            trocar categoria
          </Tab>
          <Tab active={mode === 'split'} onClick={() => setMode('split')}>
            dividir
          </Tab>
          <Tab active={mode === 'add-block'} onClick={() => setMode('add-block')}>
            + bloco
          </Tab>
        </div>

        {/* Conteúdo por modo */}
        <div className="px-5 py-5 space-y-4">

          {mode === 'shift-start' && (
            <>
              <p className="text-sm text-ink-300">
                {isActive
                  ? 'Recuar ou adiantar quando essa sessão começou.'
                  : 'Corrigir quando essa sessão encerrada começou (o fim permanece).'}
              </p>
              <Stepper
                value={shiftMin}
                onChange={setShiftMin}
                steps={[-30, -15, -5, +5, +15, +30]}
                unit="min"
              />
              <button
                onClick={() => { shiftLastSessionStart(shiftMin); onClose(); }}
                className="w-full mt-2 px-4 py-3 rounded-lg bg-gold text-ink-900 font-medium text-sm hover:brightness-110"
              >
                {shiftMin >= 0
                  ? `adiar início em ${shiftMin} min`
                  : `recuar início em ${-shiftMin} min`}
              </button>
            </>
          )}

          {mode === 'shift-end' && !isActive && (
            <>
              <p className="text-sm text-ink-300">
                Corrigir quando essa sessão terminou (o início permanece).
              </p>
              <Stepper
                value={endShiftMin}
                onChange={setEndShiftMin}
                steps={[-30, -15, -5, +5, +15]}
                unit="min"
              />
              <button
                onClick={() => { shiftLastSessionEnd(endShiftMin); onClose(); }}
                className="w-full mt-2 px-4 py-3 rounded-lg bg-gold text-ink-900 font-medium text-sm hover:brightness-110"
              >
                {endShiftMin >= 0
                  ? `adiar fim em ${endShiftMin} min`
                  : `recuar fim em ${-endShiftMin} min`}
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
                "Há {splitAgoMin} min eu troquei de atividade, mas só registrei agora."
              </p>
              <Stepper
                value={splitAgoMin}
                onChange={setSplitAgoMin}
                steps={[5, 10, 15, 30, 45, 60]}
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

          {mode === 'add-block' && (
            <>
              <p className="text-sm text-ink-300">
                Adicionar um bloco que você esqueceu de registrar.
              </p>

              <div className="space-y-4">
                <div>
                  <div className="text-xs text-ink-400 mb-1.5">Começou há</div>
                  <Stepper
                    value={blockStartAgo}
                    onChange={setBlockStartAgo}
                    steps={[30, 60, 90, 120, 180]}
                    unit="min atrás"
                    positiveOnly
                  />
                </div>
                <div>
                  <div className="text-xs text-ink-400 mb-1.5">Duração</div>
                  <Stepper
                    value={blockDuration}
                    onChange={setBlockDuration}
                    steps={[15, 30, 45, 60, 90]}
                    unit="min"
                    positiveOnly
                  />
                </div>
              </div>

              <div className="rounded-lg bg-ink-900/50 border border-ink-700/60 px-3 py-2 text-xs text-ink-400 tabular-nums">
                Vai registrar: <span className="text-ink-200">{blockStartStr} → {blockEndStr}</span>
                {' '}({formatHM(blockDuration)})
              </div>

              <CategoryPicker
                categories={categories}
                value={blockCat}
                onChange={setBlockCat}
              />

              <button
                onClick={() => {
                  if (blockEnd > Date.now()) return; // não pode ser no futuro
                  addRetroSession(blockCat, blockStart, blockEnd);
                  onClose();
                }}
                disabled={blockEnd > Date.now() || blockDuration < 1}
                className="w-full mt-2 px-4 py-3 rounded-lg bg-gold text-ink-900 font-medium text-sm hover:brightness-110 disabled:bg-ink-700 disabled:text-ink-500"
              >
                adicionar bloco
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
      className={`flex-shrink-0 px-3 py-3 text-[11px] uppercase tracking-[0.15em] transition ${
        active
          ? 'text-ink-100 border-b-2 border-gold'
          : 'text-ink-400 hover:text-ink-200 border-b-2 border-transparent'
      }`}
    >
      {children}
    </button>
  );
}

function Stepper({
  value, onChange, steps, unit, positiveOnly,
}: {
  value: number;
  onChange: (v: number) => void;
  steps: number[];
  unit: string;
  positiveOnly?: boolean;
}) {
  return (
    <div>
      <div className="text-center font-serif text-3xl tabular-nums mb-3 text-ink-100">
        {value > 0 && !positiveOnly ? '+' : ''}{value}
        <span className="text-sm text-ink-400 ml-2">{unit}</span>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {steps.map(s => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={`min-w-[56px] min-h-[44px] px-3 py-2 rounded-lg text-sm tabular-nums transition ${
              value === s
                ? 'bg-ink-100 text-ink-900'
                : 'bg-ink-700 text-ink-200 hover:bg-ink-600'
            }`}
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
