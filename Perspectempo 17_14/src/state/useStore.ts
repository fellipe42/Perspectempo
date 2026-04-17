import { create } from 'zustand';
import { AppState, DailyPlan, Session } from '../domain/types';
import { repository } from '../data/repository';
import { todayISO } from '../domain/time';
import { DEFAULT_ALLOCATION_MIN, DEFAULT_AWAKE_MINUTES } from '../domain/defaults';

interface StoreActions {
  // ações sobre sessões
  startActivity: (categoryId: string) => void;
  switchActivity: (categoryId: string) => void;
  stopActivity: () => void;

  // ajustes retroativos
  shiftActiveStart: (deltaMin: number) => void;
  reassignLastSession: (categoryId: string) => void;
  splitLastSession: (atMs: number, newCategoryId: string) => void;

  // plano
  ensureTodayPlan: () => void;
  setAwakeMinutes: (min: number) => void;
  setAllocation: (categoryId: string, minutes: number) => void;

  // util
  resetAll: () => void;
  exportJSON: () => string;
  importJSON: (json: string) => { ok: boolean; error?: string };
}

type Store = AppState & StoreActions;

const initial = repository.load();

export const useStore = create<Store>((set, get) => {
  // helper interno que persiste após cada mutação
  function persist(partial: Partial<AppState>) {
    set(state => {
      const next = { ...state, ...partial };
      repository.save({
        categories: next.categories,
        habits: next.habits,
        plans: next.plans,
        sessions: next.sessions,
        activeSessionId: next.activeSessionId,
      });
      return next;
    });
  }

  return {
    ...initial,

    startActivity: (categoryId) => {
      const state = get();
      // se já existe sessão ativa, encerra antes
      let sessions = state.sessions;
      if (state.activeSessionId) {
        sessions = sessions.map(s =>
          s.id === state.activeSessionId && !s.endedAt ? { ...s, endedAt: Date.now() } : s,
        );
      }
      const newSession: Session = {
        id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        categoryId,
        startedAt: Date.now(),
      };
      persist({
        sessions: [...sessions, newSession],
        activeSessionId: newSession.id,
      });
    },

    switchActivity: (categoryId) => {
      get().startActivity(categoryId);
    },

    stopActivity: () => {
      const state = get();
      if (!state.activeSessionId) return;
      const sessions = state.sessions.map(s =>
        s.id === state.activeSessionId && !s.endedAt ? { ...s, endedAt: Date.now() } : s,
      );
      persist({ sessions, activeSessionId: null });
    },

    // Empurra o início da sessão ativa para trás (delta negativo) ou pra
    // frente (positivo). Usado quando o usuário só lembra agora que
    // começou X min antes (ou só percebeu agora que começou tarde).
    // Limites: não pode passar do início da sessão anterior nem do "agora".
    shiftActiveStart: (deltaMin) => {
      const state = get();
      if (!state.activeSessionId) return;
      const idx = state.sessions.findIndex(s => s.id === state.activeSessionId);
      if (idx < 0) return;
      const cur = state.sessions[idx];
      const prev = idx > 0 ? state.sessions[idx - 1] : null;
      const minStart = prev?.endedAt ?? prev?.startedAt ?? 0;
      const maxStart = Date.now();
      const targetRaw = cur.startedAt + deltaMin * 60_000;
      const target = Math.max(minStart, Math.min(maxStart, targetRaw));
      const sessions = [...state.sessions];
      sessions[idx] = { ...cur, startedAt: target };
      // Se há prev e ele terminava em cur.startedAt antigo, precisa ajustar prev.endedAt.
      if (prev && prev.endedAt && Math.abs(prev.endedAt - cur.startedAt) < 2_000) {
        sessions[idx - 1] = { ...prev, endedAt: target };
      }
      persist({ sessions });
    },

    // Reatribui retroativamente a categoria da ÚLTIMA sessão (ativa ou fechada).
    // "Eu disse que estava em Trabalho mas na verdade era Estudo."
    reassignLastSession: (categoryId) => {
      const state = get();
      if (state.sessions.length === 0) return;
      const idx = state.sessions.length - 1;
      const last = state.sessions[idx];
      if (last.categoryId === categoryId) return;
      const sessions = [...state.sessions];
      sessions[idx] = { ...last, categoryId };
      persist({ sessions });
    },

    // Quebra a última sessão em duas: [start..at] na categoria antiga,
    // [at..end] na nova. Útil quando "comecei em Trabalho às 9h, troquei
    // pra Treino às 10h, mas só registrei agora às 11h".
    splitLastSession: (atMs, newCategoryId) => {
      const state = get();
      if (state.sessions.length === 0) return;
      const idx = state.sessions.length - 1;
      const last = state.sessions[idx];
      const end = last.endedAt ?? Date.now();
      if (atMs <= last.startedAt + 1000 || atMs >= end - 1000) return;
      const sessions = [...state.sessions];
      // fecha a antiga em atMs
      sessions[idx] = { ...last, endedAt: atMs };
      // cria a nova começando em atMs, herda estado de ativa se necessário
      const wasActive = !last.endedAt;
      const newSession: Session = {
        id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        categoryId: newCategoryId,
        startedAt: atMs,
        endedAt: wasActive ? undefined : end,
      };
      sessions.push(newSession);
      persist({
        sessions,
        activeSessionId: wasActive ? newSession.id : state.activeSessionId,
      });
    },

    ensureTodayPlan: () => {
      const state = get();
      const date = todayISO();
      if (state.plans[date]) return;
      const plan: DailyPlan = {
        date,
        awakeMinutes: DEFAULT_AWAKE_MINUTES,
        allocations: { ...DEFAULT_ALLOCATION_MIN },
      };
      persist({ plans: { ...state.plans, [date]: plan } });
    },

    setAwakeMinutes: (min) => {
      const date = todayISO();
      const state = get();
      const current = state.plans[date];
      if (!current) return;
      persist({
        plans: { ...state.plans, [date]: { ...current, awakeMinutes: Math.max(0, min) } },
      });
    },

    setAllocation: (categoryId, minutes) => {
      const date = todayISO();
      const state = get();
      const current = state.plans[date];
      if (!current) return;
      const next = { ...current.allocations, [categoryId]: Math.max(0, Math.round(minutes)) };
      persist({
        plans: { ...state.plans, [date]: { ...current, allocations: next } },
      });
    },

    resetAll: () => {
      repository.reset();
      // recarrega da fonte default
      const fresh = repository.load();
      set({ ...fresh });
    },

    exportJSON: () => {
      const s = get();
      return JSON.stringify({
        version: 1,
        exportedAt: new Date().toISOString(),
        app: 'perspectempo',
        categories: s.categories,
        habits: s.habits,
        plans: s.plans,
        sessions: s.sessions,
      }, null, 2);
    },

    importJSON: (json) => {
      try {
        const parsed = JSON.parse(json);
        // Validação básica de schema. Não exige version (tolerante a v0).
        if (typeof parsed !== 'object' || parsed === null) {
          return { ok: false, error: 'Arquivo não é um JSON válido.' };
        }
        if (parsed.app && parsed.app !== 'perspectempo') {
          return { ok: false, error: 'Arquivo não é um backup do Perspectempo.' };
        }
        if (parsed.categories && !Array.isArray(parsed.categories)) {
          return { ok: false, error: 'Campo "categories" inválido.' };
        }
        if (parsed.sessions && !Array.isArray(parsed.sessions)) {
          return { ok: false, error: 'Campo "sessions" inválido.' };
        }
        if (parsed.plans && (typeof parsed.plans !== 'object' || Array.isArray(parsed.plans))) {
          return { ok: false, error: 'Campo "plans" inválido.' };
        }
        persist({
          categories: parsed.categories ?? get().categories,
          habits: parsed.habits ?? get().habits,
          plans: parsed.plans ?? get().plans,
          sessions: parsed.sessions ?? get().sessions,
          activeSessionId: null,
        });
        return { ok: true };
      } catch (e) {
        return { ok: false, error: 'JSON malformado.' };
      }
    },
  };
});

// Garante plano para hoje no boot.
useStore.getState().ensureTodayPlan();
