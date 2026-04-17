import { Category, DayClassification, DayScore, Session } from './types';
import { minutesBetween } from './time';

/** Tempo (em minutos) gasto por categoria no dia, baseado em sessões. */
export function spentByCategory(
  sessions: Session[],
  date: string,
  now: number = Date.now(),
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of sessions) {
    const startISO = new Date(s.startedAt).toISOString().slice(0, 10);
    // Considera a sessão como pertencente ao dia em que começou.
    // (Suficiente para o MVP. No futuro: split em meia-noite.)
    if (startISO !== date) continue;
    const end = s.endedAt ?? now;
    out[s.categoryId] = (out[s.categoryId] ?? 0) + minutesBetween(s.startedAt, end);
  }
  return out;
}

/** Score do dia. Médias ponderadas pelo tempo. */
export function computeDayScore(
  spent: Record<string, number>,
  categories: Category[],
  date: string,
): DayScore {
  const catById = new Map(categories.map(c => [c.id, c]));
  let totalMin = 0;
  let enjoyAcc = 0;
  let futureAcc = 0;
  for (const [id, min] of Object.entries(spent)) {
    const c = catById.get(id);
    if (!c || min <= 0) continue;
    totalMin += min;
    enjoyAcc += min * c.enjoyment;
    futureAcc += min * c.future;
  }
  const enjoymentRaw = totalMin > 0 ? enjoyAcc / totalMin : 0;
  const futureRaw    = totalMin > 0 ? futureAcc / totalMin : 0;
  const enjoyment100 = Math.round(((enjoymentRaw + 2) / 4) * 100);
  const future100    = Math.round(((futureRaw + 2) / 4) * 100);
  return {
    date,
    totalMinutes: totalMin,
    enjoymentRaw,
    futureRaw,
    enjoyment100,
    future100,
    classification: classify(enjoymentRaw, futureRaw),
  };
}

/** Classifica em quadrantes com margem 0.5 ao redor de 0 (raw -2..+2). */
export function classify(enjoyment: number, future: number): DayClassification {
  const e = enjoyment >= 0.5;
  const f = future >= 0.5;
  if (e && f) return 'ideal';
  if (e && !f) return 'pleasure';
  if (!e && f) return 'duty';
  return 'drift';
}

export const CLASSIFICATION_LABEL: Record<DayClassification, string> = {
  ideal:    'Ideal',
  pleasure: 'Fruição',
  duty:     'Ofício',
  drift:    'Deriva',
};

export const CLASSIFICATION_SUBTITLE: Record<DayClassification, string> = {
  ideal:    'prazer e futuro caminhando juntos',
  pleasure: 'mais prazer que construção',
  duty:     'mais construção que prazer',
  drift:    'pouco prazer, pouca construção',
};

export const CLASSIFICATION_COLOR: Record<DayClassification, string> = {
  ideal:    '#7aa884', // sálvia
  pleasure: '#d4a373', // terracota
  duty:     '#7d92b3', // azul-aço
  drift:    '#6b6f78', // bruma
};

/** Resumo textual curto do dia. */
export function dayNarrative(score: DayScore): string {
  if (score.totalMinutes < 30) {
    return 'Pouco tempo registrado ainda. Registre mais algumas atividades para começar a ver o contorno do dia.';
  }
  switch (score.classification) {
    case 'ideal':    return 'Hoje você viveu bem. Prazer e futuro caminharam juntos.';
    case 'pleasure': return 'Um dia gostoso, leve em construção. Tudo bem, dias assim existem.';
    case 'duty':     return 'Um dia de ofício. Produtivo, mas pobre em prazer — lembre de te nutrir também.';
    case 'drift':    return 'Um dia à deriva. Nem te nutriu, nem te construiu.';
  }
}
