import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useStore } from '../state/useStore';
import { AppState } from '../domain/types';
import { cloudRepository } from '../integrations/supabase/cloudRepository';
import { getSupabaseClient, isSupabaseConfigured } from '../integrations/supabase/client';
import {
  isMeaningfulAppState,
  pickPersistedAppState,
  serializeAppState,
} from '../data/appState';
import { localSyncMetaStore } from './localMeta';
import { MigrationPromptState, SyncMetadata, SyncStatus } from './types';

type AuthCredentials = {
  email: string;
  password: string;
};

function getLocalAppState(): AppState {
  return pickPersistedAppState(useStore.getState());
}

export function useAuthSync() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const configured = Boolean(supabase) && isSupabaseConfigured();
  const replaceAllData = useStore(s => s.replaceAllData);

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(configured ? 'visitor' : 'disabled');
  const [statusText, setStatusText] = useState(configured ? 'Modo visitante' : 'Supabase não configurado');
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [migrationPrompt, setMigrationPrompt] = useState<MigrationPromptState | null>(null);

  const metaRef = useRef<SyncMetadata>(localSyncMetaStore.load());
  const currentUserRef = useRef<User | null>(null);
  const applyingRemoteRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncInFlightRef = useRef(false);

  const clearSyncTimer = useCallback(() => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
  }, []);

  const applyRemoteState = useCallback((nextState: AppState, remoteUpdatedAt: string, cloudUserId: string) => {
    applyingRemoteRef.current = true;
    replaceAllData(nextState);
    applyingRemoteRef.current = false;
    metaRef.current = localSyncMetaStore.patch({
      cloudUserId,
      pendingSync: false,
      syncError: undefined,
      lastSyncedAt: remoteUpdatedAt,
      lastCloudUpdatedAt: remoteUpdatedAt,
    });
    setSyncStatus('synced');
    setStatusText('Sincronizado');
  }, [replaceAllData]);

  const performSync = useCallback(async (reason: 'manual' | 'online' | 'focus' | 'change' | 'auth' = 'manual') => {
    if (!configured || !currentUserRef.current || migrationPrompt || syncInFlightRef.current) return;

    syncInFlightRef.current = true;
    setSyncStatus('syncing');
    setStatusText(reason === 'focus' ? 'Verificando nuvem...' : 'Sincronizando...');

    try {
      const localState = getLocalAppState();
      const remote = await cloudRepository.fetchSnapshot(currentUserRef.current.id);
      const meta = metaRef.current;

      if (remote && !meta.pendingSync) {
        const knownCloud = meta.lastCloudUpdatedAt ?? meta.lastSyncedAt ?? '';
        if (remote.updated_at > knownCloud && serializeAppState(remote.state_json) !== serializeAppState(localState)) {
          applyRemoteState(remote.state_json, remote.updated_at, currentUserRef.current.id);
          return;
        }
      }

      if (meta.pendingSync) {
        const localUpdatedAt = meta.lastLocalChangeAt ?? new Date().toISOString();
        if (remote && remote.updated_at > localUpdatedAt) {
          applyRemoteState(remote.state_json, remote.updated_at, currentUserRef.current.id);
          return;
        }

        const saved = await cloudRepository.upsertSnapshot({
          userId: currentUserRef.current.id,
          state: localState,
          updatedAt: localUpdatedAt,
          sourceDeviceId: meta.deviceId,
        });

        metaRef.current = localSyncMetaStore.patch({
          cloudUserId: currentUserRef.current.id,
          pendingSync: false,
          syncError: undefined,
          lastSyncedAt: saved.updated_at,
          lastCloudUpdatedAt: saved.updated_at,
        });
        setSyncStatus('synced');
        setStatusText('Sincronizado');
        return;
      }

      if (!remote && isMeaningfulAppState(localState)) {
        setSyncStatus('pending');
        setStatusText('Aguardando decidir origem da nuvem');
        return;
      }

      metaRef.current = localSyncMetaStore.patch({
        cloudUserId: currentUserRef.current.id,
        syncError: undefined,
      });
      setSyncStatus('synced');
      setStatusText('Sincronizado');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao sincronizar.';
      metaRef.current = localSyncMetaStore.patch({
        pendingSync: true,
        syncError: message,
      });
      setSyncStatus('error');
      setStatusText(navigator.onLine ? 'Erro de sync' : 'Offline com alterações pendentes');
    } finally {
      syncInFlightRef.current = false;
    }
  }, [applyRemoteState, configured, migrationPrompt]);

  const scheduleSync = useCallback((reason: 'online' | 'focus' | 'change' | 'auth') => {
    if (!configured || !currentUserRef.current || migrationPrompt) return;
    clearSyncTimer();
    syncTimerRef.current = setTimeout(() => {
      void performSync(reason);
    }, reason === 'change' ? 900 : 150);
  }, [clearSyncTimer, configured, migrationPrompt, performSync]);

  const reconcileAfterAuth = useCallback(async (nextUser: User) => {
    const localState = getLocalAppState();
    const localMeaningful = isMeaningfulAppState(localState);
    const remote = await cloudRepository.fetchSnapshot(nextUser.id);
    const meta = metaRef.current;
    const sameUserAsMeta = meta.cloudUserId === nextUser.id;

    metaRef.current = localSyncMetaStore.patch({
      cloudUserId: nextUser.id,
      syncError: undefined,
    });

    if (!remote) {
      if (localMeaningful && !sameUserAsMeta) {
        setMigrationPrompt({
          mode: 'upload-local',
          localState,
        });
        setSyncStatus('pending');
        setStatusText('Escolha se quer subir seus dados locais');
        return;
      }

      if (localMeaningful) {
        metaRef.current = localSyncMetaStore.patch({
          pendingSync: true,
          lastLocalChangeAt: meta.lastLocalChangeAt ?? new Date().toISOString(),
        });
        setSyncStatus('pending');
        setStatusText('Alterações locais pendentes');
        scheduleSync('auth');
        return;
      }

      setSyncStatus('synced');
      setStatusText('Conta conectada');
      return;
    }

    const remoteState = remote.state_json;
    const sameState = serializeAppState(remoteState) === serializeAppState(localState);

    if (sameState) {
      metaRef.current = localSyncMetaStore.patch({
        pendingSync: false,
        lastSyncedAt: remote.updated_at,
        lastCloudUpdatedAt: remote.updated_at,
        syncError: undefined,
      });
      setSyncStatus('synced');
      setStatusText('Sincronizado');
      return;
    }

    if (localMeaningful && !sameUserAsMeta) {
      setMigrationPrompt({
        mode: 'choose-source',
        localState,
        remoteState,
        remoteUpdatedAt: remote.updated_at,
      });
      setSyncStatus('pending');
      setStatusText('Escolha entre dados locais e nuvem');
      return;
    }

    if (meta.pendingSync && meta.lastLocalChangeAt && meta.lastLocalChangeAt >= remote.updated_at) {
      setSyncStatus('pending');
      setStatusText('Alterações locais pendentes');
      scheduleSync('auth');
      return;
    }

    applyRemoteState(remoteState, remote.updated_at, nextUser.id);
  }, [applyRemoteState, scheduleSync]);

  const syncNow = useCallback(async () => {
    await performSync('manual');
  }, [performSync]);

  const useLocalAsSource = useCallback(async () => {
    if (!currentUserRef.current || !migrationPrompt) return;

    setMigrationPrompt(null);
    const updatedAt = new Date().toISOString();
    metaRef.current = localSyncMetaStore.patch({
      cloudUserId: currentUserRef.current.id,
      pendingSync: true,
      lastLocalChangeAt: updatedAt,
      syncError: undefined,
    });
    setSyncStatus('pending');
    setStatusText('Subindo dados locais...');
    await performSync('manual');
  }, [migrationPrompt, performSync]);

  const useCloudAsSource = useCallback(() => {
    if (!currentUserRef.current || !migrationPrompt?.remoteState || !migrationPrompt.remoteUpdatedAt) return;
    setMigrationPrompt(null);
    applyRemoteState(migrationPrompt.remoteState, migrationPrompt.remoteUpdatedAt, currentUserRef.current.id);
  }, [applyRemoteState, migrationPrompt]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return;
    setAuthBusy(true);
    setAuthMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Falha no login com Google.');
    } finally {
      setAuthBusy(false);
    }
  }, [supabase]);

  const signInWithPassword = useCallback(async ({ email, password }: AuthCredentials) => {
    if (!supabase) return;
    setAuthBusy(true);
    setAuthMessage(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Falha no login por e-mail.');
    } finally {
      setAuthBusy(false);
    }
  }, [supabase]);

  const signUpWithPassword = useCallback(async ({ email, password }: AuthCredentials) => {
    if (!supabase) return;
    setAuthBusy(true);
    setAuthMessage(null);
    try {
      const { error, data } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setAuthMessage(
        data.session
          ? 'Conta criada e conectada.'
          : 'Conta criada. Se o projeto exigir confirmação, confira seu e-mail.',
      );
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Falha ao criar conta.');
    } finally {
      setAuthBusy(false);
    }
  }, [supabase]);

  const logout = useCallback(async () => {
    if (!supabase) return;
    setAuthBusy(true);
    setAuthMessage(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Falha ao sair da conta.');
    } finally {
      setAuthBusy(false);
    }
  }, [supabase]);

  useEffect(() => {
    const unsubscribe = useStore.subscribe((state, prevState) => {
      const nextSerialized = serializeAppState(pickPersistedAppState(state));
      const prevSerialized = serializeAppState(pickPersistedAppState(prevState));
      if (nextSerialized === prevSerialized) return;
      if (applyingRemoteRef.current) return;

      const now = new Date().toISOString();
      metaRef.current = localSyncMetaStore.patch({
        cloudUserId: currentUserRef.current?.id ?? metaRef.current.cloudUserId,
        lastLocalChangeAt: now,
        pendingSync: true,
        syncError: undefined,
      });

      if (!configured || !currentUserRef.current) {
        setSyncStatus(configured ? 'visitor' : 'disabled');
        setStatusText(configured ? 'Modo visitante' : 'Supabase não configurado');
        return;
      }

      setSyncStatus('pending');
      setStatusText('Alterações locais pendentes');
      scheduleSync('change');
    });

    return () => unsubscribe();
  }, [configured, scheduleSync]);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      currentUserRef.current = data.session?.user ?? null;

      if (!data.session?.user) {
        setSyncStatus('visitor');
        setStatusText('Modo visitante');
        return;
      }

      void reconcileAfterAuth(data.session.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      currentUserRef.current = nextSession?.user ?? null;

      if (!nextSession?.user) {
        setMigrationPrompt(null);
        setSyncStatus('visitor');
        setStatusText('Modo visitante');
        return;
      }

      void reconcileAfterAuth(nextSession.user);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
      clearSyncTimer();
    };
  }, [clearSyncTimer, reconcileAfterAuth, supabase]);

  useEffect(() => {
    if (!configured) return;

    const onOnline = () => {
      if (currentUserRef.current) scheduleSync('online');
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && currentUserRef.current) {
        scheduleSync('focus');
      }
    };
    const onFocus = () => {
      if (currentUserRef.current) scheduleSync('focus');
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [configured, scheduleSync]);

  return {
    configured,
    session,
    user,
    authBusy,
    authMessage,
    syncStatus,
    statusText,
    migrationPrompt,
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    logout,
    syncNow,
    useLocalAsSource,
    useCloudAsSource,
  };
}
