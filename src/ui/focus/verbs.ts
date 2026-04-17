import { Category } from '../../domain/types';

/**
 * Mapa categoria → verbo no gerúndio. Mantido explícito (em vez de auto-gerado
 * a partir do nome) porque gerúndio em PT-BR exige curadoria.
 *
 * Cobre os defaults; cai para "fazendo" para categorias custom no futuro.
 */
const MAP: Record<string, string> = {
  'cat-trabalho':  'trabalhando',
  'cat-estudo':    'estudando',
  'cat-treino':    'treinando',
  'cat-refeicao':  'comendo',
  'cat-sono-prep': 'descansando',
  'cat-social':    'conversando',
  'cat-lazer-ok':  'curtindo',
  'cat-lazer-bx':  'descansando',
  'cat-casa':      'cuidando da casa',
  'cat-scroll':    'scrollando',
};

export function gerundForCategory(c: Category): string {
  return MAP[c.id] ?? 'fazendo';
}
