import {
  Category, CategoryBalance, DailyPlan, TheftReport,
  canDonate, canReceive, isCap, countsTowardAllocated,
} from './types';

/**
 * Lógica de roubo de tempo.
 *
 * Regras (v1, com BudgetType):
 *
 * 1. Categorias `cap` (ex: Scroll/Distrações) NÃO entram no jogo de roubo:
 *    - não são doadoras (canDonate=false)
 *    - não são receptoras (canReceive=false)
 *    - se passarem do limite, geram overrunMinutes mas NÃO um TheftReport
 *      (o excesso é vazamento próprio, sem destino — a UI mostra esse fato
 *      diretamente via overrunMinutes do balance).
 *
 * 2. Categorias `protected` (Refeições, Sono): NÃO doam, mas recebem normal.
 *
 * 3. Categorias `target` e `flexible` formam o pool de vítimas elegíveis.
 *    Ordem de sacrifício:
 *      a. menor prioridade primeiro (priority maior cede antes)
 *      b. flexible cede antes de target em empate
 *      c. maior remaining primeiro em empate
 *
 * 4. Quem rouba: qualquer balance com overrun > 0 EXCETO caps.
 *    O excesso de target/flexible/protected pode roubar de target/flexible.
 *
 * Pura. Para trocar a estratégia no futuro, basta criar outra função
 * com a mesma assinatura.
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

  // Inicializa balances. Para caps, "planned" é o LIMITE TOLERADO; semanticamente
  // diferente de meta, mas armazenado no mesmo campo (a UI sabe interpretar via
  // category.budgetType).
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

  // Tempo livre do plano (slack) = horas acordado − total alocado em metas reais.
  // Esse pool é absorvido ANTES de qualquer roubo entre categorias.
  // Raciocínio: se há tempo não alocado, o overrun apenas preencheu esse espaço vazio;
  // só o que excede o slack é um roubo genuíno.
  const totalAllocated = Object.values(balances).reduce((sum, b) => {
    const c = catById.get(b.categoryId);
    return c && countsTowardAllocated(c) ? sum + b.plannedMinutes : sum;
  }, 0);
  let slackPool = Math.max(0, plan.awakeMinutes - totalAllocated);

  // Ladrões elegíveis: têm overrun E não são caps.
  const thieves = Object.values(balances)
    .filter(b => {
      if (b.overrunMinutes <= 0) return false;
      const c = catById.get(b.categoryId);
      if (!c) return false;
      return !isCap(c);
    })
    .sort((a, b) => b.overrunMinutes - a.overrunMinutes);

  for (const thief of thieves) {
    let remainingDebt = thief.overrunMinutes;

    // 1) Absorver do slack primeiro — não é roubo, é tempo livre sendo usado.
    if (slackPool > 0 && remainingDebt > 0) {
      const fromSlack = Math.min(remainingDebt, slackPool);
      slackPool -= fromSlack;
      remainingDebt -= fromSlack;
      thefts.push({
        fromCategoryId: thief.categoryId,
        toCategoryId: null,
        minutes: fromSlack,
        fromSlack: true,
      });
    }

    if (remainingDebt <= 0) continue;

    // 2) O que resta após o slack: precisa roubar de categorias.
    const victims = Object.values(balances)
      .filter(b => {
        if (b.categoryId === thief.categoryId) return false;
        const c = catById.get(b.categoryId);
        if (!c) return false;
        if (!canDonate(c)) return false; // exclui caps E protected
        const realRemaining = b.plannedMinutes - b.spentMinutes - b.stolenFromMinutes;
        return realRemaining > 0;
      })
      .sort((a, b) => {
        const ca = catById.get(a.categoryId)!;
        const cb = catById.get(b.categoryId)!;
        if (ca.priority !== cb.priority) return cb.priority - ca.priority; // menor prioridade cede primeiro
        const aFlex = ca.budgetType === 'flexible' ? 1 : 0;
        const bFlex = cb.budgetType === 'flexible' ? 1 : 0;
        if (aFlex !== bFlex) return bFlex - aFlex;
        const ra = a.plannedMinutes - a.spentMinutes - a.stolenFromMinutes;
        const rb = b.plannedMinutes - b.spentMinutes - b.stolenFromMinutes;
        return rb - ra;
      });

    for (const victim of victims) {
      if (remainingDebt <= 0) break;
      const vc = catById.get(victim.categoryId)!;
      if (!canReceive(vc)) continue;
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

    // 3) Sobrou depois de slack + vítimas? Excesso real além de todas as horas planejadas.
    if (remainingDebt > 0) {
      thefts.push({
        fromCategoryId: thief.categoryId,
        toCategoryId: null,
        minutes: remainingDebt,
        fromSlack: false,
      });
    }
  }

  return { balances: Object.values(balances), thefts };
}
