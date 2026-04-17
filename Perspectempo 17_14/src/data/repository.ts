import { AppState, BudgetType, Category } from '../domain/types';
import { DEFAULT_ALLOCATION_MIN, DEFAULT_AWAKE_MINUTES, DEFAULT_CATEGORIES, DEFAULT_HABITS } from '../domain/defaults';
import { todayISO } from '../domain/time';
import { Storage, localStorageAdapter } from './storage';

const STORAGE_KEY = 'perspectempo:v1:state';

/**
 * Migração de Category v0 → v1.
 *
 * v0 usava (protected: bool, flexible: bool) sem distinguir cap.
 * v1 usa budgetType. Derivação:
 *   - protected===true                       → 'protected'
 *   - macrobox==='vazamento'                 → 'cap'   (Scroll, Distrações, etc)
 *   - flexible===true                        → 'flexible'
 *   - resto                                  → 'target'
 *
 * Categorias já com budgetType passam direto.
 */
function migrateCategory(c: any): Category {
  if (c && typeof c.budgetType === 'string') return c as Category;
  let bt: BudgetType = 'target';
  if (c?.protected) bt = 'protected';
  else if (c?.macrobox === 'vazamento') bt = 'cap';
  else if (c?.flexible) bt = 'flexible';
  return { ...c, budgetType: bt };
}

function freshState(): AppState {
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

export class Repository {
  constructor(private storage: Storage = localStorageAdapter) {}

  load(): AppState {
    const stored = this.storage.getJSON<AppState>(STORAGE_KEY);
    if (!stored) return freshState();
    // Merge defensivo (caso evolução do schema). Migra cada categoria.
    const migrated = (stored.categories?.length ? stored.categories : freshState().categories)
      .map(migrateCategory);
    return {
      categories: migrated,
      habits: stored.habits ?? freshState().habits,
      plans: stored.plans ?? {},
      sessions: stored.sessions ?? [],
      activeSessionId: stored.activeSessionId ?? null,
    };
  }

  save(state: AppState): void {
    this.storage.setJSON(STORAGE_KEY, state);
  }

  reset(): void {
    this.storage.remove(STORAGE_KEY);
  }
}

export const repository = new Repository();
