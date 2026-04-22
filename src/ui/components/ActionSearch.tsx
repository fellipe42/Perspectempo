// =====================================================================
// ActionSearch — busca rápida de atividade por nome ou sinônimo.
//
// Pesquisa em Category.name e Category.aliases.
// Clique em resultado inicia (ou troca) a atividade.
// Desaparece automaticamente após escolha ou ESC.
// =====================================================================

import { useMemo, useRef, useState } from 'react';
import { Category } from '../../domain/types';

interface Props {
  categories: Category[];
  onStart: (catId: string) => void;
}

export function ActionSearch({ categories, onStart }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return categories.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.aliases?.some(a => a.toLowerCase().includes(q)),
    );
  }, [query, categories]);

  function openSearch() {
    setOpen(true);
    // aguarda render para focar
    setTimeout(() => inputRef.current?.focus(), 30);
  }

  function close() {
    setOpen(false);
    setQuery('');
  }

  function pick(catId: string) {
    onStart(catId);
    close();
  }

  if (!open) {
    return (
      <button
        onClick={openSearch}
        className="text-[10px] uppercase tracking-[0.3em] text-ink-600 hover:text-ink-400 transition px-1 py-1 min-h-[32px]"
      >
        buscar atividade
      </button>
    );
  }

  return (
    <div className="mt-2">
      <input
        ref={inputRef}
        type="text"
        placeholder="o que você está fazendo? (ex: netflix, correndo, meditação…)"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === 'Escape' && close()}
        className="w-full bg-ink-700/80 border border-ink-600 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder:text-ink-600 outline-none focus:border-ink-400 transition"
      />

      {results.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {results.map(c => (
            <button
              key={c.id}
              onClick={() => pick(c.id)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ink-700 hover:bg-ink-600 text-sm transition"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: c.color }}
              />
              <span className="text-ink-100">{c.name}</span>
            </button>
          ))}
        </div>
      )}

      {query.trim() !== '' && results.length === 0 && (
        <p className="mt-2 text-xs text-ink-600 italic">
          Sem correspondência para "{query}". Tente outro termo ou use os chips acima.
        </p>
      )}

      <button
        onClick={close}
        className="mt-2 text-[10px] text-ink-700 hover:text-ink-500 transition"
      >
        fechar busca ×
      </button>
    </div>
  );
}
