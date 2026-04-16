import { useState } from 'react';
import { TodayPage } from './ui/pages/TodayPage';
import { PerspectivePage } from './ui/pages/PerspectivePage';
import { useStore } from './state/useStore';

type Tab = 'today' | 'perspective';

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const resetAll = useStore(s => s.resetAll);
  const exportJSON = useStore(s => s.exportJSON);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-700 bg-ink-800/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold tracking-tight">
              Perspectempo
              <span className="ml-2 text-xs text-ink-400 font-normal">protótipo</span>
            </h1>
            <nav className="flex items-center gap-1">
              <TabBtn active={tab === 'today'} onClick={() => setTab('today')}>Hoje</TabBtn>
              <TabBtn active={tab === 'perspective'} onClick={() => setTab('perspective')}>Perspectiva</TabBtn>
            </nav>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => {
                const blob = new Blob([exportJSON()], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `perspectempo-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1.5 rounded-lg bg-ink-700 hover:bg-ink-600"
            >
              Exportar
            </button>
            <button
              onClick={() => {
                if (confirm('Apagar todos os dados locais? Essa ação não pode ser desfeita.')) {
                  resetAll();
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-ink-700 hover:bg-red-500/30 hover:text-red-200"
            >
              Resetar
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {tab === 'today' ? <TodayPage /> : <PerspectivePage />}
        </div>
      </main>

      <footer className="text-center text-xs text-ink-500 py-4">
        Dados salvos localmente no seu navegador. Nada sai do seu computador.
      </footer>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm transition ${
        active ? 'bg-ink-100 text-ink-900' : 'text-ink-300 hover:text-ink-100 hover:bg-ink-700'
      }`}
    >
      {children}
    </button>
  );
}
