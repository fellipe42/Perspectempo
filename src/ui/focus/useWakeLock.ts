import { useEffect, useRef, useState } from 'react';

/**
 * Hook para Wake Lock API — mantém a tela acordada enquanto active=true.
 *
 * Fallback elegante:
 * - Se o browser não suporta, retorna { supported: false } e não faz nada.
 * - Se a aba perde visibilidade, o sistema libera o lock automaticamente;
 *   quando volta, re-adquirimos.
 *
 * Consumo de bateria: o lock só está ativo enquanto o Modo Foco está aberto.
 * É liberado no unmount ou quando active vira false.
 */
export function useWakeLock(active: boolean) {
  const [supported] = useState(
    () => typeof navigator !== 'undefined' && 'wakeLock' in navigator,
  );
  const [locked, setLocked] = useState(false);
  const sentinelRef = useRef<any>(null);

  useEffect(() => {
    if (!active || !supported) return;

    let cancelled = false;

    const acquire = async () => {
      try {
        const s = await (navigator as any).wakeLock.request('screen');
        if (cancelled) {
          await s.release().catch(() => {});
          return;
        }
        sentinelRef.current = s;
        setLocked(true);
        s.addEventListener?.('release', () => setLocked(false));
      } catch {
        // usuário pode ter negado ou política do browser — silencioso.
      }
    };

    const onVis = () => {
      if (document.visibilityState === 'visible' && !sentinelRef.current) {
        acquire();
      }
    };

    acquire();
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      const s = sentinelRef.current;
      sentinelRef.current = null;
      setLocked(false);
      s?.release?.().catch(() => {});
    };
  }, [active, supported]);

  return { supported, locked };
}
