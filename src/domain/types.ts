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

/**
 * Tipo de orçamento da categoria.
 *
 * - target:    meta positiva. Quero fazer. Conta no alocado, doa, recebe.
 * - protected: precisa existir e não cede. Conta no alocado, NÃO doa, recebe.
 * - flexible:  positiva mas sacrificável. Conta no alocado, doa primeiro, recebe.
 * - cap:       teto tolerado. Quero EVITAR. Não conta no alocado, não doa,
 *              não recebe. Só vira "vazamento" se passar do limite.
 *              Abaixo do limite = neutro/bom. Em zero = ótimo.
 */
export type BudgetType = 'target' | 'protected' | 'flexible' | 'cap';

export interface Category {
  id: string;
  name: string;
  color: string;       // hex (#rrggbb)
  macrobox: Macrobox;
  enjoyment: number;   // -2 .. +2
  future: number;      // -2 .. +2
  priority: number;    // 1 = mais prioritária ... 5 = menos prioritária
  budgetType: BudgetType;
  aliases?: string[];  // termos alternativos para busca (nomes populares, verbos, apps)
  /**
   * @deprecated use budgetType === 'protected'. Mantido para retrocompat.
   */
  protected?: boolean;
  /**
   * @deprecated use budgetType === 'flexible'. Mantido para retrocompat.
   */
  flexible?: boolean;
}

// Helpers semânticos — toda a UI e o domínio leem por aqui, nunca por flags soltas.
export function countsTowardAllocated(c: Category): boolean {
  return c.budgetType !== 'cap';
}
export function canDonate(c: Category): boolean {
  return c.budgetType === 'target' || c.budgetType === 'flexible';
}
export function canReceive(c: Category): boolean {
  return c.budgetType !== 'cap';
}
export function isCap(c: Category): boolean {
  return c.budgetType === 'cap';
}

/** Perfil do usuário — usado para Life Weeks e heurística de sono. */
export interface UserProfile {
  birthDate?: string;       // YYYY-MM-DD
  sleepStartHour: number;   // hora típica de dormir, 0-23 (e.g. 23)
  sleepEndHour: number;     // hora típica de acordar, 0-23 (e.g. 7)
  onboardingDone: boolean;
  autoRebalanceEnabled?: boolean; // remaneja alocações automaticamente ao mudar horas acordado (default: true)
  tutorialSeen?: boolean;         // tutorial inicial já foi exibido
}

/** Plano padrão reutilizável — copiado para novos dias quando disponível. */
export interface DefaultPlan {
  awakeMinutes: number;
  allocations: Record<string /*categoryId*/, number /*minutes*/>;
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
  profile?: UserProfile;
  defaultPlan?: DefaultPlan;
}
