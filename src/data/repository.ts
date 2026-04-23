import { AppState } from '../domain/types';
import { Storage, localStorageAdapter } from './storage';
import { createFreshState, normalizeAppState, pickPersistedAppState } from './appState';

export const STORAGE_KEY = 'perspectempo:v1:state';

export class Repository {
  constructor(private storage: Storage = localStorageAdapter) {}

  load(): AppState {
    const stored = this.storage.getJSON<AppState>(STORAGE_KEY);
    if (!stored) return createFreshState();
    return normalizeAppState(stored);
  }

  save(state: AppState): void {
    this.storage.setJSON(STORAGE_KEY, pickPersistedAppState(state));
  }

  reset(): void {
    this.storage.remove(STORAGE_KEY);
  }
}

export const repository = new Repository();
