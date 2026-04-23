import { localStorageAdapter } from '../data/storage';
import { SyncMetadata } from './types';

const META_KEY = 'perspectempo:v1:sync-meta';

function generateDeviceId(): string {
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export class LocalSyncMetaStore {
  load(): SyncMetadata {
    const stored = localStorageAdapter.getJSON<Partial<SyncMetadata>>(META_KEY);
    return {
      deviceId: stored?.deviceId ?? generateDeviceId(),
      cloudUserId: stored?.cloudUserId,
      lastLocalChangeAt: stored?.lastLocalChangeAt,
      lastSyncedAt: stored?.lastSyncedAt,
      lastCloudUpdatedAt: stored?.lastCloudUpdatedAt,
      pendingSync: stored?.pendingSync ?? false,
      syncError: stored?.syncError,
    };
  }

  save(meta: SyncMetadata): SyncMetadata {
    localStorageAdapter.setJSON(META_KEY, meta);
    return meta;
  }

  patch(partial: Partial<SyncMetadata>): SyncMetadata {
    const next = { ...this.load(), ...partial };
    return this.save(next);
  }

  clearForUserSwitch(nextUserId?: string): SyncMetadata {
    return this.save({
      deviceId: this.load().deviceId,
      cloudUserId: nextUserId,
      pendingSync: false,
    });
  }
}

export const localSyncMetaStore = new LocalSyncMetaStore();
