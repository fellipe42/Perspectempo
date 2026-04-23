import { useState } from 'react';
import { formatHM } from '../../domain/time';

interface Props {
  value: number;
  onChange: (minutes: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  compact?: boolean;
}

export function MinuteInput({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 5,
  className = '',
  compact = false,
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
        className={`${compact ? 'h-5 w-5 text-xs sm:h-6 sm:w-6 sm:text-sm' : 'h-6 w-6 text-sm'} flex-shrink-0 rounded bg-ink-700 text-ink-300 leading-none hover:bg-ink-600 flex items-center justify-center`}
      >
        −
      </button>

      <input
        type="text"
        inputMode="numeric"
        value={displayed}
        onFocus={e => {
          setDraft(String(value));
          e.target.select();
        }}
        onChange={e => setDraft(e.target.value)}
        onBlur={e => commit(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.currentTarget.blur(); }
          if (e.key === 'ArrowUp') { adjust(step); e.preventDefault(); }
          if (e.key === 'ArrowDown') { adjust(-step); e.preventDefault(); }
        }}
        className={`${compact ? 'w-11 text-[13px] sm:w-14 sm:text-sm' : 'w-14 text-sm'} rounded border border-ink-600 bg-ink-700 px-1 py-0.5 tabular-nums text-right transition focus:border-ink-400 focus:outline-none`}
      />

      <button
        type="button"
        tabIndex={-1}
        onClick={() => adjust(step)}
        className={`${compact ? 'h-5 w-5 text-xs sm:h-6 sm:w-6 sm:text-sm' : 'h-6 w-6 text-sm'} flex-shrink-0 rounded bg-ink-700 text-ink-300 leading-none hover:bg-ink-600 flex items-center justify-center`}
      >
        +
      </button>

      {value > 0 && (
        <span className={`${compact ? 'ml-0.5 w-8 text-[10px] sm:ml-1 sm:w-10 sm:text-[11px]' : 'ml-1 w-10 text-[11px]'} flex-shrink-0 text-right tabular-nums text-ink-400`}>
          {formatHM(value)}
        </span>
      )}
    </div>
  );
}
