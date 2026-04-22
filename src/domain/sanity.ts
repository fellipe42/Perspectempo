// =====================================================================
// Perspectempo — Sanidade de sessões.
// Detecta sessões ativas improváveis: muito longas ou dentro da janela
// de sono. Retorna sugestões de recuperação para a UI.
// =====================================================================

import { Category, Session, UserProfile } from './types';

// Duração máxima sem confirmação por categoria (minutos)
// Exceder este limite faz a sessão aparecer como "improvável".
const CATEGORY_THRESHOLDS: Record<string, number> = {
  'cat-trabalho':   360,  // 6h
  'cat-estudo':     120,  // 2h
  'cat-treino':     120,  // 2h
  'cat-refeicao':    90,  // 1h30
  'cat-sono-prep':  600,  // 10h (sono longo é normal — alertar só se for absurdo)
  'cat-social':     240,  // 4h
  'cat-lazer-ok':   240,  // 4h
  'cat-lazer-bx':   120,  // 2h
  'cat-casa':       180,  // 3h
  'cat-scroll':      60,  // 1h
};
const DEFAULT_THRESHOLD_MIN = 180;

// Para cada macrobox, IDs de categorias mais prováveis de desvio.
// Ex.: "estava Trabalhando mas na verdade fui pro Scroll".
const DRIFT_BY_MACROBOX: Record<string, string[]> = {
  construcao:    ['cat-scroll', 'cat-lazer-bx', 'cat-refeicao', 'cat-social'],
  manutencao:    ['cat-scroll', 'cat-lazer-bx', 'cat-refeicao'],
  sobrevivencia: ['cat-scroll', 'cat-lazer-bx', 'cat-social'],
  nutricao:      ['cat-scroll', 'cat-refeicao'],
  vazamento:     ['cat-lazer-bx', 'cat-refeicao'],
};

export interface SanityCheck {
  suspicious: boolean;
  reason: 'too_long' | 'sleep_window' | null;
  durationMin: number;
  thresholdMin: number;
  /** IDs de categorias prováveis alternativas para oferecer como sugestão. */
  driftSuggestions: string[];
}

/**
 * Verifica se uma sessão ATIVA parece improvável.
 *
 * Dois critérios:
 * 1. Duração excede o threshold da categoria.
 * 2. Hora atual está na janela de sono do usuário e a sessão não é sono.
 *
 * @param nowMs  Permite injetar o "agora" para testes.
 */
export function checkSessionSanity(
  session: Session,
  categories: Category[],
  profile?: UserProfile,
  nowMs = Date.now(),
): SanityCheck {
  const empty: SanityCheck = {
    suspicious: false,
    reason: null,
    durationMin: 0,
    thresholdMin: 0,
    driftSuggestions: [],
  };

  if (session.endedAt) return empty; // só sessões ativas

  const durationMin = Math.floor((nowMs - session.startedAt) / 60_000);
  const cat = categories.find(c => c.id === session.categoryId);
  const threshold = cat
    ? (CATEGORY_THRESHOLDS[cat.id] ?? DEFAULT_THRESHOLD_MIN)
    : DEFAULT_THRESHOLD_MIN;
  const drifts = cat ? (DRIFT_BY_MACROBOX[cat.macrobox] ?? []) : [];

  // ── Critério 1: janela de sono ──────────────────────────────────────
  if (profile && cat?.id !== 'cat-sono-prep') {
    const hour = new Date(nowMs).getHours();
    const { sleepStartHour, sleepEndHour } = profile;
    // overnight (ex.: dormir 23, acordar 7) vs. diurno (ex.: 13–15 sesta)
    const overnight = sleepStartHour > sleepEndHour;
    const inWindow = overnight
      ? (hour >= sleepStartHour || hour < sleepEndHour)
      : (hour >= sleepStartHour && hour < sleepEndHour);

    if (inWindow && durationMin > 20) {
      return {
        suspicious: true,
        reason: 'sleep_window',
        durationMin,
        thresholdMin: threshold,
        driftSuggestions: ['cat-sono-prep', ...drifts.slice(0, 2)],
      };
    }
  }

  // ── Critério 2: duração excessiva ───────────────────────────────────
  if (durationMin >= threshold) {
    return {
      suspicious: true,
      reason: 'too_long',
      durationMin,
      thresholdMin: threshold,
      driftSuggestions: drifts,
    };
  }

  return empty;
}
