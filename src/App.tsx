import { useRef, useState } from 'react';
import { TodayPage } from './ui/pages/TodayPage';
import { PerspectivePage } from './ui/pages/PerspectivePage';
import { useStore } from './state/useStore';
import { OnboardingModal } from './ui/components/OnboardingModal';
import { InstallCoach } from './ui/components/InstallCoach';

type Tab = 'today' | 'perspective';

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const resetAll  = useStore(s => s.resetAll);
  const exportJSON = useStore(s => s.exportJSON);
  const importJSON = useStore(s => s.importJSON);
  const profile   = useStore(s => s.profile);
  const setProfile = useStore(s => s.setProfile);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const showOnboarding = !profile?.onboardingDone;

  function handleExport() {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `perspectempo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileRef.current?.click();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!confirm(
      `Importar "${file.name}"? Isso substitui seus dados atuais.\n` +
      `Sugestão: exporte um backup antes.`,
    )) return;
    const text = await file.text();
    const result = importJSON(text);
    if (!result.ok) {
      alert(`Falha ao importar: ${result.error ?? 'desconhecido'}`);
    } else {
      alert('Importado com sucesso.');
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-700 bg-ink-800/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 sm:gap-6">
            <h1 className="text-base sm:text-lg font-semibold tracking-tight">
              Perspectempo
              <span className="ml-2 text-[10px] sm:text-xs text-ink-400 font-normal">protótipo</span>
            </h1>
            <nav className="flex items-center gap-1">
              <TabBtn active={tab === 'today'} onClick={() => setTab('today')}>Hoje</TabBtn>
              <TabBtn active={tab === 'perspective'} onClick={() => setTab('perspective')}>Perspectiva</TabBtn>
            </nav>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFile}
              className="hidden"
            />
            <button
              onClick={handleImportClick}
              className="px-3 py-1.5 rounded-lg bg-ink-700 hover:bg-ink-600 min-h-[36px]"
              title="Importar backup JSON"
            >
              Importar
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 rounded-lg bg-ink-700 hover:bg-ink-600 min-h-[36px]"
              title="Baixar backup JSON"
            >
              Exportar
            </button>
            {/* Acesso rápido ao perfil / onboarding */}
            <button
              onClick={() => setProfile({ onboardingDone: false })}
              className="px-3 py-1.5 rounded-lg bg-ink-700 hover:bg-ink-600 min-h-[36px]"
              title="Configurar perfil (data de nascimento e sono)"
            >
              Perfil
            </button>
            <button
              onClick={() => {
                if (confirm('Apagar todos os dados locais? Essa ação não pode ser desfeita.')) {
                  resetAll();
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-ink-700 hover:bg-red-500/30 hover:text-red-200 min-h-[36px]"
            >
              Resetar
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {tab === 'today' ? <TodayPage /> : <PerspectivePage />}
        </div>
      </main>

      <footer className="text-center text-[11px] sm:text-xs text-ink-500 py-4 px-4">
        Dados salvos localmente no seu navegador. Nada sai do seu dispositivo.
      </footer>

      {/* Onboarding — aparece no primeiro acesso ou ao clicar em "Perfil" */}
      {showOnboarding && (
        <OnboardingModal
          onComplete={(data) => setProfile({ ...data, onboardingDone: true })}
        />
      )}

      {/* Coach de instalação iOS — auto-exibe em Safari do iPhone se não instalado */}
      <InstallCoach />
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm transition min-h-[36px] ${
        active ? 'bg-ink-100 text-ink-900' : 'text-ink-300 hover:text-ink-100 hover:bg-ink-700'
      }`}
    >
      {children}
    </button>
  );
}
