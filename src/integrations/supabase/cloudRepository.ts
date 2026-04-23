import { AppState } from '../../domain/types';
import { normalizeAppState, pickPersistedAppState } from '../../data/appState';
import { getSupabaseClient } from './client';
import { CloudSnapshotRow } from '../../sync/types';

const TABLE = 'user_snapshots';

export class CloudRepository {
  async fetchSnapshot(userId: string): Promise<CloudSnapshotRow | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from(TABLE)
      .select('user_id, state_json, updated_at, created_at, source_device_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      state_json: normalizeAppState(data.state_json as AppState),
    };
  }

  async upsertSnapshot(params: {
    userId: string;
    state: AppState;
    updatedAt: string;
    sourceDeviceId: string;
  }): Promise<CloudSnapshotRow> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase não configurado.');
    }

    const payload = {
      user_id: params.userId,
      state_json: pickPersistedAppState(params.state),
      updated_at: params.updatedAt,
      source_device_id: params.sourceDeviceId,
    };

    const { data, error } = await supabase
      .from(TABLE)
      .upsert(payload, { onConflict: 'user_id' })
      .select('user_id, state_json, updated_at, created_at, source_device_id')
      .single();

    if (error) throw error;

    return {
      ...data,
      state_json: normalizeAppState(data.state_json as AppState),
    };
  }
}

export const cloudRepository = new CloudRepository();
