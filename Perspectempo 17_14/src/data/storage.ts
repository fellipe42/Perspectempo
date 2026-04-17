// Adapter trocável de persistência. Hoje localStorage; amanhã pode ser SQLite,
// AsyncStorage (RN), MMKV, etc. Mantém o domínio agnóstico.

export interface Storage {
  getJSON<T>(key: string): T | null;
  setJSON<T>(key: string, value: T): void;
  remove(key: string): void;
}

export const localStorageAdapter: Storage = {
  getJSON<T>(key: string): T | null {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  setJSON<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // Em quota cheia ou modo privado, falha silenciosamente.
      console.warn('[storage] setJSON failed', e);
    }
  },
  remove(key: string): void {
    window.localStorage.removeItem(key);
  },
};
