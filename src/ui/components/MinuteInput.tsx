// =====================================================================
// MinuteInput — input de tempo em minutos sem o bug do zero inicial.
//
// - type="text" evita os quirks de type="number" (leading zero, spinner)
// - Mostra o valor atual como número de minutos
// - Em foco: digitação livre, parse no blur/enter
// - Abaixo do campo: equivalente em Xh Ym
// - Botões − e + com step configurável
// =====================================================================

import { useState } from 'react';
import { formatHM } from '../../domain/time';

interface Props {
  value: number;           // minutos
  onChange: (minutes: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function MinuteInput({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 5,
  className = '',
}: Props) {
  const [draft, setDraft] = useState<string | null>(null);

  const displayed = draft !== null ? draft : String(value);

  function clamp(n: number) {
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  function commit(raw: string) {
    setDraft(null);
    const n = parseInt(raw, 10);
    if (!isNaN(n)) onChange(clamp(n));
  }

  function adjust(delta: number) {
    onChange(clamp(value + delta));
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        type="button"
        tabIndex={-1}
        onClick={() => adjust(-step)}
        className="w-6 h-6 rounded bg-ink-700 hover:bg-ink-600 text-ink-300 text-sm leading-none flex items-center justify-center flex-shrink-0"
      >
        −
      </button>

      <input
        type="text"
        inputMode="numeric"
        value={displayed}
        onFocus={e => {
          setDraft(String(value));
          // seleciona tudo ao focar para facilitar sobrescrever
          e.target.select();
        }}
        onChange={e => setDraft(e.target.value)}
        onBlur={e => commit(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter')      { e.currentTarget.blur(); }
          if (e.key === 'ArrowUp')    { adjust(step); e.preventDefault(); }
          if (e.key === 'ArrowDown')  { adjust(-step); e.preventDefault(); }
        }}
        className="w-14 bg-ink-700 border border-ink-600 rounded px-1 py-0.5 text-sm tabular-nums text-right focus:outline-none focus:border-ink-400 transition"
      />

      <button
        type="button"
        tabIndex={-1}
        onClick={() => adjust(step)}
        className="w-6 h-6 rounded bg-ink-700 hover:bg-ink-600 text-ink-300 text-sm leading-none flex items-center justify-center flex-shrink-0"
      >
        +
      </button>

      {value > 0 && (
        <span className="text-[11px] text-ink-400 tabular-nums ml-1 w-10 text-right flex-shrink-0">
          {formatHM(value)}
        </span>
      )}
    </div>
  );
}
