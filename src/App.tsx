import { useRef, useState } from 'react';
import { TodayPage } from './ui/pages/TodayPage';
import { PerspectivePage } from './ui/pages/PerspectivePage';
import { useStore } from './state/useStore';
import { OnboardingModal } from './ui/components/OnboardingModal';
import { InstallCoach } from './ui/components/InstallCoach';

type Tab = 'today' | 'perspective';

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [menuOpen, setMenuOpen] = useState(false);
  const resetAll   = useStore(s => s.resetAll);
  const exportJSON = useStore(s => s.exportJSON);
  const importJSON = useStore(s => s.importJSON);
  const profile    = useStore(s => s.profile);
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
    setMenuOpen(false);
  }

  function handleImportClick() {
    fileRef.current?.click();
    setMenuOpen(false);
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

  function handleProfile() {
    setProfile({ onboardingDone: false });
    setMenuOpen(false);
  }

  function handleReset() {
    if (confirm('Apagar todos os dados locais? Essa ação não pode ser desfeita.')) {
      resetAll();
    }
    setMenuOpen(false);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-700 bg-ink-800/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* Esquerda: título + tabs */}
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <h1 className="text-base sm:text-lg font-semibold tracking-tight flex-shrink-0">
              Perspectempo
              <span className="ml-2 text-[10px] sm:text-xs text-ink-400 font-normal hidden sm:inline">
                protótipo
              </span>
            </h1>
            <nav className="flex items-center gap-1">
              <TabBtn active={tab === 'today'} onClick={() => setTab('today')}>Hoje</TabBtn>
              <TabBtn active={tab === 'perspective'} onClick={() => setTab('perspective')}>Perspectiva</TabBtn>
            </nav>
          </div>

          {/* Direita: ações desktop visíveis / mobile no 3-pontos */}
          <div className="flex items-center gap-1.5 text-xs">
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFile}
              className="hidden"
            />

            {/* Desktop: botões visíveis */}
            <div className="hidden sm:flex items-center gap-1.5">
              <ActionBtn onClick={handleImportClick} title="Importar backup JSON">Importar</ActionBtn>
              <ActionBtn onClick={handleExport} title="Baixar backup JSON">Exportar</ActionBtn>
              <ActionBtn onClick={handleProfile} title="Configurar perfil">Perfil</ActionBtn>
              <ActionBtn
                onClick={handleReset}
                className="hover:bg-red-500/30 hover:text-red-200"
              >
                Resetar
              </ActionBtn>
            </div>

            {/* Mobile: menu de 3 pontos */}
            <div className="relative sm:hidden">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-ink-700 hover:bg-ink-600 text-ink-200 text-lg leading-none"
                aria-label="Menu de ações"
              >
                ⋮
              </button>

              {menuOpen && (
                <>
                  {/* Overlay para fechar ao clicar fora */}
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-30 w-44 rounded-xl bg-ink-800 border border-ink-700 shadow-xl overflow-hidden">
                    <DropdownItem onClick={handleImportClick}>Importar backup</DropdownItem>
                    <DropdownItem onClick={handleExport}>Exportar backup</DropdownItem>
                    <DropdownItem onClick={handleProfile}>Perfil / Sono</DropdownItem>
                    <DropdownItem onClick={handleReset} danger>Resetar tudo</DropdownItem>
                  </div>
                </>
              )}
            </div>
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

      {showOnboarding && (
        <OnboardingModal
          onComplete={(data) => setProfile({ ...data, onboardingDone: true })}
        />
      )}

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

function ActionBtn({
  onClick, title, children, className = '',
}: {
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`px-3 py-1.5 rounded-lg bg-ink-700 hover:bg-ink-600 min-h-[36px] transition ${className}`}
    >
      {children}
    </button>
  );
}

function DropdownItem({
  onClick, children, danger = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 text-sm transition border-b border-ink-700/50 last:border-0 ${
        danger
          ? 'text-red-300 hover:bg-red-500/10'
          : 'text-ink-200 hover:bg-ink-700'
      }`}
    >
      {children}
    </button>
  );
}
