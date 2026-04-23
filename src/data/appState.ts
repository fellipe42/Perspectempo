import { AppState, BudgetType, Category } from '../domain/types';
import {
  DEFAULT_ALLOCATION_MIN,
  DEFAULT_AWAKE_MINUTES,
  DEFAULT_CATEGORIES,
  DEFAULT_HABITS,
} from '../domain/defaults';
import { todayISO } from '../domain/time';

function migrateCategory(c: any): Category {
  if (c && typeof c.budgetType === 'string') return c as Category;
  let bt: BudgetType = 'target';
  if (c?.protected) bt = 'protected';
  else if (c?.macrobox === 'vazamento') bt = 'cap';
  else if (c?.flexible) bt = 'flexible';
  return { ...c, budgetType: bt };
}

export function createFreshState(): AppState {
  const date = todayISO();
  return {
    categories: DEFAULT_CATEGORIES,
    habits: DEFAULT_HABITS,
    plans: {
      [date]: {
        date,
        awakeMinutes: DEFAULT_AWAKE_MINUTES,
        allocations: { ...DEFAULT_ALLOCATION_MIN },
      },
    },
    sessions: [],
    activeSessionId: null,
  };
}

export function normalizeAppState(input?: Partial<AppState> | null): AppState {
  const fresh = createFreshState();
  if (!input) return fresh;

  const migratedCategories = (input.categories?.length ? input.categories : fresh.categories)
    .map(migrateCategory);

  return {
    categories: migratedCategories,
    habits: input.habits ?? fresh.habits,
    plans: input.plans ?? fresh.plans,
    sessions: input.sessions ?? fresh.sessions,
    activeSessionId: input.activeSessionId ?? null,
    profile: input.profile,
    defaultPlan: input.defaultPlan,
  };
}

export function pickPersistedAppState(state: AppState): AppState {
  return {
    categories: state.categories,
    habits: state.habits,
    plans: state.plans,
    sessions: state.sessions,
    activeSessionId: state.activeSessionId,
    profile: state.profile,
    defaultPlan: state.defaultPlan,
  };
}

export function serializeAppState(state: AppState): string {
  return JSON.stringify(pickPersistedAppState(state));
}

export function isMeaningfulAppState(state: AppState): boolean {
  const fresh = createFreshState();
  return serializeAppState({
    ...state,
    activeSessionId: null,
  }) !== serializeAppState({
    ...fresh,
    activeSessionId: null,
  });
}
