import { useEffect, useState } from 'react';
import { Category } from '../../domain/types';
import { formatHMS } from '../../domain/time';

interface Props {
  category: Category | null;
  startedAt: number | null;
  onStop: () => void;
}

export function Timer({ category, startedAt, onStop }: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (!category || !startedAt) {
    return (
      <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 flex items-center justify-between">
        <div>
          <div className="text-ink-400 text-sm">Nenhuma atividade ativa</div>
          <div className="text-ink-200 text-2xl font-medium mt-1">Escolha uma categoria abaixo</div>
        </div>
        <div className="text-ink-500 text-3xl tabular-nums">00:00</div>
      </div>
    );
  }

  const seconds = Math.floor((now - startedAt) / 1000);

  return (
    <div
      className="rounded-2xl p-6 flex items-center justify-between"
      style={{
        background: `linear-gradient(135deg, ${category.color}22, #12151c 70%)`,
        border: `1px solid ${category.color}55`,
      }}
    >
      <div>
        <div className="text-ink-300 text-sm uppercase tracking-wide">Em andamento</div>
        <div className="text-3xl font-semibold mt-1" style={{ color: category.color }}>
          {category.name}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-5xl font-bold tabular-nums">{formatHMS(seconds)}</div>
        <button
          onClick={onStop}
          className="px-4 py-2 rounded-xl bg-ink-700 hover:bg-ink-600 text-ink-100 text-sm"
        >
          Encerrar
        </button>
      </div>
    </div>
  );
}
