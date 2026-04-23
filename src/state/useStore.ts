import { create } from 'zustand';
import { AppState, Category, DailyPlan, DefaultPlan, Session, UserProfile, countsTowardAllocated, isCap } from '../domain/types';
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
  shiftLastSessionStart: (deltaMin: number) => void;
  shiftLastSessionEnd: (deltaMin: number) => void;
  reassignLastSession: (categoryId: string) => void;
  splitLastSession: (atMs: number, newCategoryId: string) => void;
  addRetroSession: (categoryId: string, startMs: number, endMs: number) => void;

  // deletar/restaurar sessão
  deleteSession: (id: string) => void;
  restoreDeletedSession: (session: Session) => void;

  // plano
  ensureTodayPlan: () => void;
  setAwakeMinutes: (min: number) => void;
  setAllocation: (categoryId: string, minutes: number) => void;
  allocateSlack: () => void;
  saveAsDefaultPlan: () => void;
  applyDefaultPlan: () => void;

  // perfil
  setProfile: (partial: Partial<UserProfile>) => void;

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
        profile: next.profile,
        defaultPlan: next.defaultPlan,
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

    // Empurra o início da sessão ATIVA para trás ou pra frente.
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
      if (prev && prev.endedAt && Math.abs(prev.endedAt - cur.startedAt) < 2_000) {
        sessions[idx - 1] = { ...prev, endedAt: target };
      }
      persist({ sessions });
    },

    // Desloca o INÍCIO da última sessão (ativa ou encerrada).
    shiftLastSessionStart: (deltaMin) => {
      const state = get();
      if (state.sessions.length === 0) return;
      const idx = state.sessions.length - 1;
      const cur = state.sessions[idx];
      const prev = idx > 0 ? state.sessions[idx - 1] : null;
      const minStart = prev?.endedAt ?? prev?.startedAt ?? 0;
      const maxStart = (cur.endedAt ?? Date.now()) - 60_000;
      const targetRaw = cur.startedAt + deltaMin * 60_000;
      const target = Math.max(minStart, Math.min(maxStart, targetRaw));
      const sessions = [...state.sessions];
      sessions[idx] = { ...cur, startedAt: target };
      if (prev && prev.endedAt && Math.abs(prev.endedAt - cur.startedAt) < 2_000) {
        sessions[idx - 1] = { ...prev, endedAt: target };
      }
      persist({ sessions });
    },

    // Desloca o FIM da última sessão encerrada.
    shiftLastSessionEnd: (deltaMin) => {
      const state = get();
      if (state.sessions.length === 0) return;
      const idx = state.sessions.length - 1;
      const cur = state.sessions[idx];
      if (!cur.endedAt) return; // sessão ainda ativa não tem fim
      const minEnd = cur.startedAt + 60_000;
      const maxEnd = Date.now();
      const targetRaw = cur.endedAt + deltaMin * 60_000;
      const target = Math.max(minEnd, Math.min(maxEnd, targetRaw));
      const sessions = [...state.sessions];
      sessions[idx] = { ...cur, endedAt: target };
      persist({ sessions });
    },

    // Reatribui retroativamente a categoria da ÚLTIMA sessão (ativa ou fechada).
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

    // Quebra a última sessão em duas no ponto atMs.
    splitLastSession: (atMs, newCategoryId) => {
      const state = get();
      if (state.sessions.length === 0) return;
      const idx = state.sessions.length - 1;
      const last = state.sessions[idx];
      const end = last.endedAt ?? Date.now();
      if (atMs <= last.startedAt + 1000 || atMs >= end - 1000) return;
      const sessions = [...state.sessions];
      sessions[idx] = { ...last, endedAt: atMs };
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

    // Adiciona uma sessão retroativa (fechada) em ordem cronológica.
    addRetroSession: (categoryId, startMs, endMs) => {
      const state = get();
      const now = Date.now();
      // Validações básicas
      if (startMs >= endMs) return;
      if (endMs > now) return;
      // Não pode sobrepor a sessão ativa (se houver)
      const active = state.sessions.find(s => s.id === state.activeSessionId);
      if (active && endMs > active.startedAt) return;
      const newSession: Session = {
        id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        categoryId,
        startedAt: startMs,
        endedAt: endMs,
      };
      // Insere em ordem cronológica para manter shiftActiveStart correto
      const sessions = [...state.sessions, newSession].sort((a, b) => a.startedAt - b.startedAt);
      persist({ sessions });
    },

    deleteSession: (id) => {
      const state = get();
      const sessions = state.sessions.filter(s => s.id !== id);
      const activeSessionId = state.activeSessionId === id ? null : state.activeSessionId;
      persist({ sessions, activeSessionId });
    },

    restoreDeletedSession: (session) => {
      const state = get();
      const sessions = [...state.sessions, session].sort((a, b) => a.startedAt - b.startedAt);
      persist({ sessions });
    },

    ensureTodayPlan: () => {
      const state = get();
      const date = todayISO();
      if (state.plans[date]) return;
      // Usa o plano padrão se disponível, senão usa os defaults hardcoded
      const plan: DailyPlan = {
        date,
        awakeMinutes: state.defaultPlan?.awakeMinutes ?? DEFAULT_AWAKE_MINUTES,
        allocations: state.defaultPlan
          ? { ...state.defaultPlan.allocations }
          : { ...DEFAULT_ALLOCATION_MIN },
      };
      persist({ plans: { ...state.plans, [date]: plan } });
    },

    setAwakeMinutes: (min) => {
      const date = todayISO();
      const state = get();
      const current = state.plans[date];
      if (!current) return;
      const newAwake = Math.max(60, min);
      const autoRebalance = state.profile?.autoRebalanceEnabled !== false; // default true

      let allocations = { ...current.allocations };

      if (autoRebalance) {
        // Calcula o total alocado em categorias que contam para o orçamento
        const totalAllocated = Object.entries(allocations).reduce((sum, [id, m]) => {
          const cat = state.categories.find(c => c.id === id);
          return cat && countsTowardAllocated(cat) ? sum + m : sum;
        }, 0);

        const overflow = totalAllocated - newAwake;
        if (overflow > 0) {
          // Remanejar: reduzir categorias por prioridade (menor prioridade = mais alta numericamente = cede primeiro)
          // Só categorias que podem ceder: target e flexible, não protected, não cap
          const donors = state.categories
            .filter(c => countsTowardAllocated(c) && !isCap(c) && c.budgetType !== 'protected')
            .sort((a, b) => {
              if (b.priority !== a.priority) return b.priority - a.priority; // menor prioridade primeiro
              if (a.budgetType === 'flexible' && b.budgetType !== 'flexible') return -1;
              if (b.budgetType === 'flexible' && a.budgetType !== 'flexible') return 1;
              return (allocations[b.id] ?? 0) - (allocations[a.id] ?? 0); // mais tempo primeiro
            });

          let remaining = overflow;
          for (const cat of donors) {
            if (remaining <= 0) break;
            const cur = allocations[cat.id] ?? 0;
            const reduce = Math.min(cur, remaining);
            allocations[cat.id] = cur - reduce;
            remaining -= reduce;
          }
        }
      }

      persist({
        plans: { ...state.plans, [date]: { ...current, awakeMinutes: newAwake, allocations } },
      });
    },

    // Distribui o tempo livre (slack) proporcionalmente entre categorias target/flexible.
    allocateSlack: () => {
      const date = todayISO();
      const state = get();
      const current = state.plans[date];
      if (!current) return;

      const allocations = { ...current.allocations };
      const totalAllocated = Object.entries(allocations).reduce((sum, [id, m]) => {
        const cat = state.categories.find(c => c.id === id);
        return cat && countsTowardAllocated(cat) ? sum + m : sum;
      }, 0);
      const slack = current.awakeMinutes - totalAllocated;
      if (slack <= 0) return;

      // Distribui proporcionalmente entre target (não protected, não cap)
      const recipients = state.categories.filter(
        c => countsTowardAllocated(c) && !isCap(c) && c.budgetType !== 'protected',
      );
      if (recipients.length === 0) return;

      const totalCurrent = recipients.reduce((s, c) => s + (allocations[c.id] ?? 0), 0);
      let distributed = 0;
      for (let i = 0; i < recipients.length; i++) {
        const cat = recipients[i];
        const cur = allocations[cat.id] ?? 0;
        const share = i === recipients.length - 1
          ? slack - distributed
          : totalCurrent > 0
            ? Math.round((cur / totalCurrent) * slack)
            : Math.round(slack / recipients.length);
        allocations[cat.id] = cur + share;
        distributed += share;
      }

      persist({ plans: { ...state.plans, [date]: { ...current, allocations } } });
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

    saveAsDefaultPlan: () => {
      const state = get();
      const plan = state.plans[todayISO()];
      if (!plan) return;
      const defaultPlan: DefaultPlan = {
        awakeMinutes: plan.awakeMinutes,
        allocations: { ...plan.allocations },
      };
      persist({ defaultPlan });
    },

    applyDefaultPlan: () => {
      const state = get();
      if (!state.defaultPlan) return;
      const date = todayISO();
      const current = state.plans[date];
      if (!current) return;
      const updated: DailyPlan = {
        ...current,
        awakeMinutes: state.defaultPlan.awakeMinutes,
        allocations: { ...state.defaultPlan.allocations },
      };
      persist({ plans: { ...state.plans, [date]: updated } });
    },

    setProfile: (partial) => {
      const state = get();
      const base: UserProfile = state.profile ?? {
        sleepStartHour: 23,
        sleepEndHour: 7,
        onboardingDone: false,
      };
      persist({ profile: { ...base, ...partial } });
    },

    resetAll: () => {
      repository.reset();
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
        profile: s.profile,
        defaultPlan: s.defaultPlan,
      }, null, 2);
    },

    importJSON: (json) => {
      try {
        const parsed = JSON.parse(json);
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
          profile: parsed.profile ?? get().profile,
          defaultPlan: parsed.defaultPlan ?? get().defaultPlan,
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
