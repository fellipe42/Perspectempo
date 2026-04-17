// =====================================================================
// MacroboxRows — leitura PRIMÁRIA do saldo do dia.
//
// Agrupa categorias por macrocaixa e mostra uma linha por macrocaixa.
// Transbordamento: na própria cor da macrocaixa (mais saturada),
// "vazando" pra fora do trilho. Sem vermelho alarme.
//
// Microfrase de roubo: quando há roubo originado daquela macrocaixa,
// mostra em cinza discreto: "−12m Treino, −15m Estudo".
// =====================================================================

import {
  MACROBOX_COLOR, MACROBOX_COLOR_OVER, MACROBOX_LABEL, MACROBOX_ORDER,
} from '../../domain/defaults';
import { Category, CategoryBalance, Macrobox, TheftReport, isCap } from '../../domain/types';
import { formatHM } from '../../domain/time';

interface Props {
  categories: Category[];
  balances: CategoryBalance[];
  thefts: TheftReport[];
}

interface MacroboxAgg {
  macro: Macrobox;
  planned: number;        // soma do "alocado" (em cap = limite tolerado)
  spent: number;
  overrun: number;
  stolenFrom: number;
  /** True se TODAS as categorias com sinal nesta macrocaixa são `cap`. */
  isCapOnly: boolean;
  // roubos originados nesta macrocaixa, por categoria-vítima
  victimsByCat: Map<string, number>;
}

export function MacroboxRows({ categories, balances, thefts }: Props) {
  const catById = new Map(categories.map(c => [c.id, c]));

  const mkAgg = (macro: Macrobox): MacroboxAgg => ({
    macro, planned: 0, spent: 0, overrun: 0, stolenFrom: 0,
    isCapOnly: true, // começa true; vira false na 1ª categoria não-cap com sinal
    victimsByCat: new Map(),
  });

  const agg: Record<Macrobox, MacroboxAgg> = {
    construcao:    mkAgg('construcao'),
    manutencao:    mkAgg('manutencao'),
    sobrevivencia: mkAgg('sobrevivencia'),
    nutricao:      mkAgg('nutricao'),
    vazamento:     mkAgg('vazamento'),
  };

  for (const b of balances) {
    const cat = catById.get(b.categoryId);
    if (!cat) continue;
    const m = agg[cat.macrobox];
    m.planned += b.plannedMinutes;
    m.spent += b.spentMinutes;
    m.overrun += b.overrunMinutes;
    m.stolenFrom += b.stolenFromMinutes;
    // Se houver QUALQUER categoria não-cap com plano ou uso, a macrocaixa
    // deixa de ser "só cap".
    if (!isCap(cat) && (b.plannedMinutes > 0 || b.spentMinutes > 0)) {
      m.isCapOnly = false;
    }
  }

  // Macrocaixas sem nenhuma categoria envolvida ficam com isCapOnly=true por
  // default. Normaliza: se não houve sinal algum, isCapOnly não importa
  // (a linha será pulada no render).

  // Anexa vítimas por origem: caps NÃO viram doadoras (nem aparecem aqui,
  // já que computeBalances não emite theft com cap como ladrão; mas
  // protegemos contra ruído de migração).
  for (const t of thefts) {
    const thief = catById.get(t.fromCategoryId);
    if (!thief || !t.toCategoryId) continue;
    if (isCap(thief)) continue;
    const m = agg[thief.macrobox];
    const prev = m.victimsByCat.get(t.toCategoryId) ?? 0;
    m.victimsByCat.set(t.toCategoryId, prev + t.minutes);
  }

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-[10px] uppercase tracking-[0.3em] text-ink-400">
          saldo do dia
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
          por macrocaixa
        </div>
      </div>

      <div className="space-y-3">
        {MACROBOX_ORDER.map(m => {
          const row = agg[m];
          // pula macrocaixas totalmente silenciosas (sem plano e sem uso)
          if (row.planned === 0 && row.spent === 0) return null;
          return (
            <Row
              key={m}
              row={row}
              catById={catById}
            />
          );
        })}
      </div>
    </section>
  );
}

function Row({
  row, catById,
}: { row: MacroboxAgg; catById: Map<string, Category> }) {
  const color = MACROBOX_COLOR[row.macro];
  const colorOver = MACROBOX_COLOR_OVER[row.macro];
  const label = MACROBOX_LABEL[row.macro];

  const planned = row.planned;
  const spent = row.spent;
  const overrun = row.overrun;
  const isCapBox = row.isCapOnly;

  // Layout robusto: o trilho ocupa 85% da largura, deixando 15% reservado
  // à direita pra "saliência" do transbordamento. Não estoura no mobile.
  const TRACK_FRAC = 0.85;
  const SPILL_FRAC = 1 - TRACK_FRAC;

  // Preenchimento dentro do trilho (0..100% do trilho).
  const filledPct = planned > 0 ? Math.min(100, (spent / planned) * 100) : (spent > 0 ? 100 : 0);
  // Saliência: só faz sentido quando passou do limite/meta.
  const overFrac = planned > 0 ? Math.min(1, overrun / planned) : 0;
  const spillWidthFrac = overFrac * SPILL_FRAC;

  // Microfrase de roubo. Para macrocaixas-só-cap, ela nunca aparece (cap
  // não doa). Para mistas, mostramos vítimas reais.
  const victims = isCapBox ? [] : [...row.victimsByCat.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, min]) => {
      const cat = catById.get(id);
      return cat ? { name: cat.name, min, color: cat.color } : null;
    })
    .filter((x): x is { name: string; min: number; color: string } => x !== null);

  // Estado semântico do CAP:
  //  - spent === 0 e limit > 0  → "ótimo, dentro do limite, em zero"
  //  - 0 < spent <= limit       → "tolerado"
  //  - spent > limit            → "passou do limite — vazamento"
  const capState: 'zero' | 'within' | 'over' | null = !isCapBox ? null
    : spent === 0 ? 'zero'
    : overrun > 0 ? 'over'
    : 'within';

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: color }}
          />
          <span className="text-sm text-ink-100">{label}</span>
          {isCapBox && (
            <span className="text-[9px] uppercase tracking-[0.2em] text-ink-500 ml-1">
              limite
            </span>
          )}
        </div>
        <div className="text-xs tabular-nums text-ink-300">
          {/* Cap: leitura "X / até Y", sem alarmismo abaixo do limite */}
          {isCapBox ? (
            <>
              <span className={
                capState === 'over'  ? 'text-ink-100'
              : capState === 'zero'  ? 'text-ink-400'
              :                        'text-ink-200'
              }>
                {formatHM(spent)}
              </span>
              {planned > 0 && (
                <>
                  <span className="text-ink-500"> / até </span>
                  <span className="text-ink-400">{formatHM(planned)}</span>
                </>
              )}
              {capState === 'over' && (
                <span className="ml-2" style={{ color: colorOver }}>
                  +{formatHM(overrun)} acima
                </span>
              )}
              {capState === 'zero' && (
                <span className="ml-2 text-ink-500 italic">em zero</span>
              )}
            </>
          ) : (
            <>
              <span className="text-ink-100">{formatHM(spent)}</span>
              {planned > 0 && (
                <>
                  <span className="text-ink-500"> / </span>
                  <span className="text-ink-400">{formatHM(planned)}</span>
                </>
              )}
              {overrun > 0 && (
                <span className="ml-2" style={{ color: colorOver }}>
                  +{formatHM(overrun)}
                </span>
              )}
              {row.stolenFrom > 0 && (
                <span className="ml-2 text-ink-500">
                  −{formatHM(row.stolenFrom)} cedido
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* barra com transbordamento — overflow-hidden no container externo
          garante que NADA estoura, mesmo em mobile estreito */}
      <div className="relative mt-2 h-2 w-full overflow-hidden">
        {/* trilho: ocupa TRACK_FRAC do container */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 rounded-full bg-ink-800/80"
          style={{ width: `${TRACK_FRAC * 100}%`, height: '6px' }}
        />
        {/* preenchimento: em cima do trilho, escala a TRACK_FRAC */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 rounded-full"
          style={{
            width: `${(filledPct / 100) * TRACK_FRAC * 100}%`,
            height: '6px',
            background: color,
            opacity: 0.92,
          }}
        />
        {/* saliência: começa logo após o trilho, dentro da zona reservada */}
        {spillWidthFrac > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 rounded-r-full"
            style={{
              left: `${TRACK_FRAC * 100}%`,
              width: `${spillWidthFrac * 100}%`,
              height: '10px',
              background: colorOver,
              opacity: 0.9,
              boxShadow: `0 0 6px ${colorOver}55`,
            }}
          />
        )}
      </div>

      {/* microfrase de roubo */}
      {victims.length > 0 && (
        <div className="mt-1.5 text-[11px] text-ink-400">
          {victims.map((v, i) => (
            <span key={v.name}>
              {i > 0 && <span className="text-ink-600"> · </span>}
              <span className="text-ink-500">−{formatHM(v.min)} </span>
              <span style={{ color: v.color, opacity: 0.85 }}>{v.name}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
