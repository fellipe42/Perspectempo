import { Category, Habit } from './types';

// Paleta intencionalmente distinta entre categorias adjacentes.
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-trabalho',  name: 'Trabalho',         color: '#5b8def', macrobox: 'construcao',     enjoyment:  0, future:  2, priority: 1, protected: false, flexible: false },
  { id: 'cat-estudo',    name: 'Estudo',           color: '#7c5bef', macrobox: 'construcao',     enjoyment:  1, future:  2, priority: 1, protected: false, flexible: false },
  { id: 'cat-treino',    name: 'Treino',           color: '#26c281', macrobox: 'manutencao',     enjoyment:  0, future:  2, priority: 2, protected: false, flexible: false },
  { id: 'cat-refeicao',  name: 'Refeições',        color: '#e8a23b', macrobox: 'sobrevivencia',  enjoyment:  1, future:  0, priority: 1, protected: true,  flexible: false },
  { id: 'cat-sono-prep', name: 'Sono / Higiene',   color: '#3aa6b9', macrobox: 'sobrevivencia',  enjoyment:  0, future:  1, priority: 1, protected: true,  flexible: false },
  { id: 'cat-social',    name: 'Conexão social',   color: '#ef5b8c', macrobox: 'nutricao',       enjoyment:  2, future:  1, priority: 2, protected: false, flexible: false },
  { id: 'cat-lazer-ok',  name: 'Lazer ativo',      color: '#d96bff', macrobox: 'nutricao',       enjoyment:  2, future:  1, priority: 3, protected: false, flexible: false },
  { id: 'cat-lazer-bx',  name: 'Lazer passivo',    color: '#b58bff', macrobox: 'nutricao',       enjoyment:  1, future: -1, priority: 4, protected: false, flexible: true  },
  { id: 'cat-casa',      name: 'Casa / Tarefas',   color: '#9ea4b3', macrobox: 'manutencao',     enjoyment: -1, future:  1, priority: 3, protected: false, flexible: false },
  { id: 'cat-scroll',    name: 'Scroll / Distrações', color: '#e85b5b', macrobox: 'vazamento',  enjoyment:  1, future: -2, priority: 5, protected: false, flexible: true  },
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

export const MACROBOX_LABEL: Record<string, string> = {
  sobrevivencia: 'Sobrevivência',
  construcao:    'Construção',
  manutencao:    'Manutenção',
  nutricao:      'Nutrição',
  vazamento:     'Vazamento',
};
