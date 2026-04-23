import { AppState } from '../domain/types';

export type SyncStatus = 'visitor' | 'disabled' | 'synced' | 'pending' | 'syncing' | 'error';

export interface SyncMetadata {
  deviceId: string;
  cloudUserId?: string;
  lastLocalChangeAt?: string;
  lastSyncedAt?: string;
  lastCloudUpdatedAt?: string;
  pendingSync: boolean;
  syncError?: string;
}

export interface CloudSnapshotRow {
  user_id: string;
  state_json: AppState;
  updated_at: string;
  created_at?: string;
  source_device_id?: string | null;
}

export type MigrationDecisionMode = 'upload-local' | 'choose-source';

export interface MigrationPromptState {
  mode: MigrationDecisionMode;
  localState: AppState;
  remoteState?: AppState;
  remoteUpdatedAt?: string;
}
