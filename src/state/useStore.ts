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

  // plano
  ensureTodayPlan: () => void;
  setAwakeMinutes: (min: number) => void;
  setAllocation: (categoryId: string, minutes: number) => void;

  // util
  resetAll: () => void;
  exportJSON: () => string;
  importJSON: (json: string) => boolean;
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
        categories: s.categories,
        habits: s.habits,
        plans: s.plans,
        sessions: s.sessions,
      }, null, 2);
    },

    importJSON: (json) => {
      try {
        const parsed = JSON.parse(json);
        persist({
          categories: parsed.categories ?? get().categories,
          habits: parsed.habits ?? get().habits,
          plans: parsed.plans ?? get().plans,
          sessions: parsed.sessions ?? get().sessions,
          activeSessionId: null,
        });
        return true;
      } catch {
        return false;
      }
    },
  };
});

// Garante plano para hoje no boot.
useStore.getState().ensureTodayPlan();
