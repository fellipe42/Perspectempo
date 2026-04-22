// =====================================================================
// InstallCoach — banner leve de instalação para iOS Safari.
//
// Aparece ~4s após o primeiro carregamento se o usuário estiver no
// Safari do iPhone/iPad e o app ainda não foi adicionado à tela de início.
// Pode ser dispensado permanentemente (localStorage).
// =====================================================================

import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'perspectempo:install-dismissed';

function isIOSSafariNotInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(ua.includes('CriOS') || ua.includes('FxiOS'));
  const isStandalone = 'standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isIOS && !isStandalone;
}

export function InstallCoach() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;
    if (!isIOSSafariNotInstalled()) return;
    const t = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  }

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="bg-ink-800 border-t border-ink-600 px-5 py-4">
        <div className="flex items-start gap-3 max-w-lg mx-auto">
          <div className="flex-1">
            <p className="text-sm font-medium text-ink-100 mb-1">
              Instalar no iPhone / iPad
            </p>
            <p className="text-xs text-ink-400 leading-relaxed">
              Toque em{' '}
              <span className="text-ink-200 font-medium">Compartilhar ⬆</span>
              {' '}e depois em{' '}
              <span className="text-ink-200 font-medium">Adicionar à Tela de Início</span>
              {' '}para usar o Perspectempo como app — sem barra do navegador.
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Fechar"
            className="text-ink-500 hover:text-ink-200 text-xl leading-none flex-shrink-0 mt-0.5 transition min-w-[24px] text-center"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
