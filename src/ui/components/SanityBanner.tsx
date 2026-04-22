// =====================================================================
// SanityBanner — banner não-intrusivo para sessões ativas improváveis.
//
// Mostra quando o cronômetro está ligado há mais tempo do que o esperado
// para a categoria, ou quando é horário de sono do usuário.
// Não é modal. Pode ser snoozeado por 1h.
// =====================================================================

import { useEffect, useRef, useState } from 'react';
import { Category, Session, UserProfile } from '../../domain/types';
import { checkSessionSanity } from '../../domain/sanity';
import { formatHM } from '../../domain/time';

interface Props {
  activeSession: Session | null;
  categories: Category[];
  profile?: UserProfile;
  onSwitch: (catId: string) => void;
  onStop: () => void;
}

export function SanityBanner({ activeSession, categories, profile, onSwitch, onStop }: Props) {
  // snooze por sessionId: re-exibe depois de 1h se ainda ativo
  const snoozeRef = useRef<Map<string, number>>(new Map());
  const [tick, setTick] = useState(0);

  // Reavalia a cada minuto para detectar quando o snooze expira
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!activeSession) return null;

  const snoozedUntil = snoozeRef.current.get(activeSession.id) ?? 0;
  if (Date.now() < snoozedUntil) return null;

  const check = checkSessionSanity(activeSession, categories, profile);
  if (!check.suspicious) return null;

  const cat = categories.find(c => c.id === activeSession.categoryId);

  const driftCats = check.driftSuggestions
    .map(id => categories.find(c => c.id === id))
    .filter((c): c is Category => !!c && c.id !== activeSession.categoryId)
    .slice(0, 4);

  function snooze() {
    snoozeRef.current.set(activeSession!.id, Date.now() + 60 * 60_000);
    setTick(t => t + 1);
  }

  const nowHour = new Date().getHours();
  const message = check.reason === 'sleep_window'
    ? `São ${String(nowHour).padStart(2, '0')}h — o cronômetro de ${cat?.name ?? 'atividade'} ficou ligado durante a janela de sono.`
    : `${cat?.name ?? 'Atividade'} há ${formatHM(check.durationMin)} — ainda está nisso?`;

  return (
    <div className="rounded-2xl bg-amber-950/30 border border-amber-700/40 px-4 py-3">
      <p className="text-xs text-amber-200/90 mb-2.5">{message}</p>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={snooze}
          className="px-3 py-1.5 rounded-lg text-xs bg-ink-700/80 hover:bg-ink-600 text-ink-300 transition"
        >
          sim, continuo
        </button>

        {driftCats.map(dc => (
          <button
            key={dc.id}
            onClick={() => { onSwitch(dc.id); snooze(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-ink-700/80 hover:bg-ink-600 transition"
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: dc.color }}
            />
            <span className="text-ink-300">{dc.name}</span>
          </button>
        ))}

        <button
          onClick={() => { onStop(); snooze(); }}
          className="px-3 py-1.5 rounded-lg text-xs bg-ink-700/80 hover:bg-ink-600 text-ink-500 transition"
        >
          parar
        </button>
      </div>
    </div>
  );
}
