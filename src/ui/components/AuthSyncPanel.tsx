import { useState } from 'react';
import { AppState } from '../../domain/types';
import { MigrationPromptState, SyncStatus } from '../../sync/types';

interface Props {
  configured: boolean;
  userEmail?: string;
  authBusy: boolean;
  authMessage: string | null;
  syncStatus: SyncStatus;
  statusText: string;
  migrationPrompt: MigrationPromptState | null;
  onGoogleLogin: () => void;
  onEmailLogin: (credentials: { email: string; password: string }) => void;
  onEmailSignup: (credentials: { email: string; password: string }) => void;
  onLogout: () => void;
  onSyncNow: () => void;
  onUseLocalAsSource: () => void;
  onUseCloudAsSource: () => void;
}

const STATUS_STYLES: Record<SyncStatus, string> = {
  visitor: 'bg-ink-700/70 text-ink-300',
  disabled: 'bg-ink-700/70 text-ink-500',
  synced: 'bg-emerald-500/15 text-emerald-200',
  pending: 'bg-amber-500/15 text-amber-100',
  syncing: 'bg-sky-500/15 text-sky-100',
  error: 'bg-red-500/15 text-red-200',
};

export function AuthSyncPanel({
  configured,
  userEmail,
  authBusy,
  authMessage,
  syncStatus,
  statusText,
  migrationPrompt,
  onGoogleLogin,
  onEmailLogin,
  onEmailSignup,
  onLogout,
  onSyncNow,
  onUseLocalAsSource,
  onUseCloudAsSource,
}: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isAuthenticated = Boolean(userEmail);

  function submitEmailLogin() {
    onEmailLogin({ email: email.trim(), password });
  }

  function submitEmailSignup() {
    onEmailSignup({ email: email.trim(), password });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <span className={`hidden rounded-full px-2.5 py-1 text-[11px] sm:inline ${STATUS_STYLES[syncStatus]}`}>
          {statusText}
        </span>
        <button
          onClick={() => setOpen(v => !v)}
          className="min-h-[36px] rounded-lg bg-ink-700 px-3 py-1.5 text-xs text-ink-100 transition hover:bg-ink-600"
        >
          {isAuthenticated ? 'Conta' : 'Entrar'}
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-4 top-[calc(100%+0.5rem)] z-30 w-[min(92vw,24rem)] rounded-2xl border border-ink-700 bg-ink-800 p-4 shadow-2xl sm:right-6">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-ink-400">conta e sync</div>
                <div className="mt-1 text-sm text-ink-200">
                  {isAuthenticated ? userEmail : 'Modo visitante'}
                </div>
              </div>
              <span className={`rounded-full px-2 py-1 text-[10px] ${STATUS_STYLES[syncStatus]}`}>
                {statusText}
              </span>
            </div>

            {!configured && (
              <p className="rounded-xl bg-ink-900/70 px-3 py-2 text-sm text-ink-400">
                Configure o Supabase no `.env.local` para habilitar login e sincronização.
              </p>
            )}

            {configured && !isAuthenticated && (
              <div className="space-y-3">
                <button
                  onClick={onGoogleLogin}
                  disabled={authBusy}
                  className="w-full rounded-lg bg-ink-100 px-4 py-2.5 text-sm font-medium text-ink-900 transition hover:brightness-105 disabled:opacity-60"
                >
                  entrar com Google
                </button>

                <div className="space-y-2">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-ink-400 focus:outline-none"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="senha"
                    className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-ink-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={submitEmailLogin}
                    disabled={authBusy || !email.trim() || !password}
                    className="rounded-lg bg-ink-700 px-3 py-2 text-sm text-ink-100 transition hover:bg-ink-600 disabled:opacity-60"
                  >
                    entrar
                  </button>
                  <button
                    onClick={submitEmailSignup}
                    disabled={authBusy || !email.trim() || !password}
                    className="rounded-lg bg-ink-700 px-3 py-2 text-sm text-ink-100 transition hover:bg-ink-600 disabled:opacity-60"
                  >
                    criar conta
                  </button>
                </div>
              </div>
            )}

            {configured && isAuthenticated && (
              <div className="space-y-3">
                <p className="rounded-xl bg-ink-900/70 px-3 py-2 text-sm text-ink-300">
                  Seus dados continuam locais/offline. A nuvem entra como continuidade entre dispositivos e backup da conta.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={onSyncNow}
                    disabled={authBusy}
                    className="rounded-lg bg-ink-700 px-3 py-2 text-sm text-ink-100 transition hover:bg-ink-600 disabled:opacity-60"
                  >
                    sincronizar agora
                  </button>
                  <button
                    onClick={onLogout}
                    disabled={authBusy}
                    className="rounded-lg bg-ink-700 px-3 py-2 text-sm text-ink-100 transition hover:bg-ink-600 disabled:opacity-60"
                  >
                    sair
                  </button>
                </div>
              </div>
            )}

            {authMessage && (
              <p className="mt-3 text-xs text-ink-400">{authMessage}</p>
            )}
          </div>
        </>
      )}

      {migrationPrompt && (
        <MigrationPrompt
          prompt={migrationPrompt}
          onUseLocal={onUseLocalAsSource}
          onUseCloud={onUseCloudAsSource}
        />
      )}
    </>
  );
}

function MigrationPrompt({
  prompt,
  onUseLocal,
  onUseCloud,
}: {
  prompt: MigrationPromptState;
  onUseLocal: () => void;
  onUseCloud: () => void;
}) {
  const localSummary = summarizeState(prompt.localState);
  const remoteSummary = prompt.remoteState ? summarizeState(prompt.remoteState) : null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-ink-700 bg-ink-800 p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-ink-400">migrar dados locais</div>
        <h3 className="mt-2 font-serif text-xl text-ink-100">
          {prompt.mode === 'upload-local' ? 'Subir seus dados locais para a conta?' : 'Escolha a origem principal'}
        </h3>

        <div className="mt-4 space-y-3 text-sm text-ink-300">
          <div className="rounded-xl bg-ink-900/70 px-3 py-3">
            <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-ink-500">local</div>
            <div>{localSummary}</div>
          </div>

          {remoteSummary && (
            <div className="rounded-xl bg-ink-900/70 px-3 py-3">
              <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-ink-500">nuvem</div>
              <div>{remoteSummary}</div>
              {prompt.remoteUpdatedAt && (
                <div className="mt-1 text-xs text-ink-500">
                  atualizado em {new Date(prompt.remoteUpdatedAt).toLocaleString('pt-BR')}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-4 text-sm text-ink-400">
          O modelo atual usa last write wins. Edição simultânea em dois dispositivos ainda pode sobrescrever o lado mais antigo.
        </p>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {remoteSummary && (
            <button
              onClick={onUseCloud}
              className="rounded-lg bg-ink-700 px-3 py-2 text-sm text-ink-100 transition hover:bg-ink-600"
            >
              manter nuvem
            </button>
          )}
          <button
            onClick={onUseLocal}
            className="rounded-lg bg-gold px-3 py-2 text-sm font-medium text-ink-900 transition hover:brightness-105"
          >
            usar dados locais como origem
          </button>
        </div>
      </div>
    </div>
  );
}

function summarizeState(state: AppState): string {
  const totalPlans = Object.keys(state.plans).length;
  return [
    `${state.sessions.length} sessões`,
    `${totalPlans} planos`,
    `${state.categories.length} categorias`,
    `${state.habits.length} hábitos`,
  ].join(' · ');
}
