import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Service worker: só registra em produção. Em dev, garante que NÃO há SW
// registrado (evita o cache antigo bloquear hot-reload).
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('[sw] registro falhou:', err);
      });
    });
  } else {
    navigator.serviceWorker.getRegistrations().then(regs => {
      for (const r of regs) r.unregister();
    });
  }
}
