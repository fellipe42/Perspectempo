import { Category, CategoryBalance, DailyPlan, TheftReport } from './types';

/**
 * Lógica de roubo de tempo.
 *
 * Para cada categoria que excedeu o planejado, distribui o excesso entre
 * categorias "vítimas" (planejadas mas ainda com sobra), na ordem:
 *   1. Não-protegidas primeiro (protected nunca cede tempo)
 *   2. Menos prioritárias primeiro (priority maior cede antes)
 *   3. Flexíveis primeiro em caso de empate
 *   4. Maior remaining primeiro em caso de empate
 *
 * É uma função pura. Para trocar a estratégia no futuro, basta criar
 * outra função com a mesma assinatura.
 */
export function computeBalances(
  plan: DailyPlan,
  spent: Record<string, number>,
  categories: Category[],
): { balances: CategoryBalance[]; thefts: TheftReport[] } {
  const catById = new Map(categories.map(c => [c.id, c]));

  // Considera todas as categorias presentes no plano OU com tempo gasto.
  const involvedIds = new Set<string>([
    ...Object.keys(plan.allocations),
    ...Object.keys(spent),
  ]);

  // Inicializa balances.
  const balances: Record<string, CategoryBalance> = {};
  for (const id of involvedIds) {
    const planned = plan.allocations[id] ?? 0;
    const sp = spent[id] ?? 0;
    balances[id] = {
      categoryId: id,
      plannedMinutes: planned,
      spentMinutes: sp,
      remainingMinutes: planned - sp,
      overrunMinutes: Math.max(0, sp - planned),
      stolenFromMinutes: 0,
    };
  }

  const thefts: TheftReport[] = [];

  // Lista de "ladrões" (categorias com overrun), maior overrun primeiro.
  const thieves = Object.values(balances)
    .filter(b => b.overrunMinutes > 0)
    .sort((a, b) => b.overrunMinutes - a.overrunMinutes);

  for (const thief of thieves) {
    let remainingDebt = thief.overrunMinutes;

    // Vítimas elegíveis: têm sobra, não são protegidas, não são o próprio ladrão.
    const victims = Object.values(balances)
      .filter(b => {
        if (b.categoryId === thief.categoryId) return false;
        const c = catById.get(b.categoryId);
        if (!c) return false;
        if (c.protected) return false;
        const realRemaining = b.plannedMinutes - b.spentMinutes - b.stolenFromMinutes;
        return realRemaining > 0;
      })
      .sort((a, b) => {
        const ca = catById.get(a.categoryId)!;
        const cb = catById.get(b.categoryId)!;
        if (ca.priority !== cb.priority) return cb.priority - ca.priority; // menor prioridade primeiro
        if (ca.flexible !== cb.flexible) return ca.flexible ? -1 : 1;       // flexíveis primeiro
        const ra = a.plannedMinutes - a.spentMinutes - a.stolenFromMinutes;
        const rb = b.plannedMinutes - b.spentMinutes - b.stolenFromMinutes;
        return rb - ra;
      });

    for (const victim of victims) {
      if (remainingDebt <= 0) break;
      const realRemaining = victim.plannedMinutes - victim.spentMinutes - victim.stolenFromMinutes;
      const take = Math.min(remainingDebt, realRemaining);
      if (take <= 0) continue;
      victim.stolenFromMinutes += take;
      remainingDebt -= take;
      thefts.push({
        fromCategoryId: thief.categoryId,
        toCategoryId: victim.categoryId,
        minutes: take,
      });
    }

    // Sobrou? Excesso "perdido" — todas vítimas exauridas/protegidas.
    if (remainingDebt > 0) {
      thefts.push({
        fromCategoryId: thief.categoryId,
        toCategoryId: null,
        minutes: remainingDebt,
      });
    }
  }

  return { balances: Object.values(balances), thefts };
}
