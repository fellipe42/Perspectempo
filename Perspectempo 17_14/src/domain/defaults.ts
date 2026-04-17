import { Category, Habit, Macrobox } from './types';

// Paleta intencionalmente distinta entre categorias adjacentes.
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-trabalho',  name: 'Trabalho',         color: '#5b8def', macrobox: 'construcao',     enjoyment:  0, future:  2, priority: 1, budgetType: 'target'    },
  { id: 'cat-estudo',    name: 'Estudo',           color: '#7c5bef', macrobox: 'construcao',     enjoyment:  1, future:  2, priority: 1, budgetType: 'target'    },
  { id: 'cat-treino',    name: 'Treino',           color: '#26c281', macrobox: 'manutencao',     enjoyment:  0, future:  2, priority: 2, budgetType: 'target'    },
  { id: 'cat-refeicao',  name: 'Refeições',        color: '#e8a23b', macrobox: 'sobrevivencia',  enjoyment:  1, future:  0, priority: 1, budgetType: 'protected' },
  { id: 'cat-sono-prep', name: 'Sono / Higiene',   color: '#3aa6b9', macrobox: 'sobrevivencia',  enjoyment:  0, future:  1, priority: 1, budgetType: 'protected' },
  { id: 'cat-social',    name: 'Conexão social',   color: '#ef5b8c', macrobox: 'nutricao',       enjoyment:  2, future:  1, priority: 2, budgetType: 'target'    },
  { id: 'cat-lazer-ok',  name: 'Lazer ativo',      color: '#d96bff', macrobox: 'nutricao',       enjoyment:  2, future:  1, priority: 3, budgetType: 'target'    },
  { id: 'cat-lazer-bx',  name: 'Lazer passivo',    color: '#b58bff', macrobox: 'nutricao',       enjoyment:  1, future: -1, priority: 4, budgetType: 'flexible'  },
  { id: 'cat-casa',      name: 'Casa / Tarefas',   color: '#9ea4b3', macrobox: 'manutencao',     enjoyment: -1, future:  1, priority: 3, budgetType: 'target'    },
  // Scroll é CAP: 30 min é LIMITE TOLERADO, não meta. 0 min = ótimo. Não doa, não recebe.
  { id: 'cat-scroll',    name: 'Scroll / Distrações', color: '#e85b5b', macrobox: 'vazamento',  enjoyment:  1, future: -2, priority: 5, budgetType: 'cap'        },
];

// Hábitos default amarrados a categorias acima.
export const DEFAULT_HABITS: Habit[] = [
  { id: 'hab-treino', name: 'Treinar 20+ min',    categoryId: 'cat-treino', thresholdMinutes: 20 },
  { id: 'hab-casa',   name: 'Casa 20+ min',        categoryId: 'cat-casa',   thresholdMinutes: 20 },
  { id: 'hab-estudo', name: 'Estudar 30+ min',    categoryId: 'cat-estudo', thresholdMinutes: 30 },
];

// Alocação inicial sugerida (em minutos) — total ~ 16h acordado
export const DEFAULT_ALLOCATION_MIN: Record<string, number> = {
  'cat-trabalho':  6 * 60,
  'cat-estudo':    1 * 60,
  'cat-treino':    45,
  'cat-refeicao':  60,
  'cat-sono-prep': 45,
  'cat-social':    60,
  'cat-lazer-ok':  60,
  'cat-lazer-bx':  60,
  'cat-casa':      45,
  'cat-scroll':    30,
};

export const DEFAULT_AWAKE_MINUTES = 16 * 60;

export const MACROBOX_LABEL: Record<Macrobox, string> = {
  sobrevivencia: 'Sobrevivência',
  construcao:    'Construção',
  manutencao:    'Manutenção',
  nutricao:      'Nutrição',
  vazamento:     'Vazamento',
};

// Paleta semântica das 5 macrocaixas — terrosas, dessaturadas.
// Nenhuma deve competir com o ouro do accent principal.
export const MACROBOX_COLOR: Record<Macrobox, string> = {
  construcao:    '#6c84a8', // azul ardósia
  manutencao:    '#8b9b7e', // verde musgo
  sobrevivencia: '#b8956a', // ocre quente
  nutricao:      '#b07a93', // rosa antigo
  vazamento:     '#9a5e5e', // bordô apagado
};

// Tom mais saturado da mesma cor — usado para o "transbordamento" do excesso.
// Elegância: o excesso é a mesma cor, só um pouco mais intensa.
export const MACROBOX_COLOR_OVER: Record<Macrobox, string> = {
  construcao:    '#8ea8cc',
  manutencao:    '#b0c098',
  sobrevivencia: '#d6a87a',
  nutricao:      '#c993ab',
  vazamento:     '#b77070',
};

// Ordem de leitura fixa na UI — construção primeiro, vazamento por último.
export const MACROBOX_ORDER: Macrobox[] = [
  'construcao', 'manutencao', 'sobrevivencia', 'nutricao', 'vazamento',
];
