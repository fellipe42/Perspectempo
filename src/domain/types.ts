// =====================================================================
// Perspectempo — Domínio puro.
// Sem React, sem DOM, sem storage. Reaproveitável em mobile.
// =====================================================================

export type Macrobox =
  | 'sobrevivencia'
  | 'construcao'
  | 'manutencao'
  | 'nutricao'
  | 'vazamento';

export interface Category {
  id: string;
  name: string;
  color: string;       // hex (#rrggbb)
  macrobox: Macrobox;
  enjoyment: number;   // -2 .. +2
  future: number;      // -2 .. +2
  priority: number;    // 1 = mais prioritária ... 5 = menos prioritária
  protected: boolean;  // não pode sofrer roubo de tempo
  flexible: boolean;   // primeira a ceder tempo (em empate de prioridade)
}

export interface DailyPlan {
  date: string;                                 // YYYY-MM-DD
  awakeMinutes: number;
  allocations: Record<string /*categoryId*/, number /*minutes*/>;
}

export interface Session {
  id: string;
  categoryId: string;
  startedAt: number;   // ms epoch
  endedAt?: number;    // ms epoch (undefined = em andamento)
  note?: string;
}

export interface Habit {
  id: string;
  name: string;
  categoryId: string;        // hábito amarrado a uma categoria
  thresholdMinutes: number;  // satisfeito quando minutos na categoria >= threshold
}

export type DayClassification = 'ideal' | 'pleasure' | 'duty' | 'drift';

export interface DayScore {
  date: string;
  totalMinutes: number;
  enjoymentRaw: number;   // -2..+2
  futureRaw: number;      // -2..+2
  enjoyment100: number;   // 0..100
  future100: number;      // 0..100
  classification: DayClassification;
}

export interface TheftReport {
  fromCategoryId: string;   // categoria que excedeu
  toCategoryId: string | null; // null = excesso "sem destino" (todas vítimas exauridas/protegidas)
  minutes: number;
}

export interface CategoryBalance {
  categoryId: string;
  plannedMinutes: number;
  spentMinutes: number;
  remainingMinutes: number;  // pode ser negativo (excesso)
  overrunMinutes: number;    // max(0, spent - planned)
  stolenFromMinutes: number; // quanto foi roubado DESTA categoria por outras
}

export interface HabitStatus {
  habitId: string;
  spentMinutes: number;
  satisfied: boolean;
  progress: number; // 0..1
}

export interface AppState {
  categories: Category[];
  habits: Habit[];
  plans: Record<string /*date*/, DailyPlan>;
  sessions: Session[];
  activeSessionId: string | null;
}
