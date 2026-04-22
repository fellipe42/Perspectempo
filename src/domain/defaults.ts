import { Category, Habit, Macrobox } from './types';

// Paleta intencionalmente distinta entre categorias adjacentes.
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-trabalho',
    name: 'Trabalho',
    color: '#5b8def',
    macrobox: 'construcao',
    enjoyment: 0, future: 2, priority: 2,
    budgetType: 'target',
    aliases: [
      'trabalhando', 'reunião', 'meeting', 'email', 'cliente', 'projeto',
      'código', 'programando', 'planejando', 'organizando o dia', 'postar',
      'conteúdo', 'retrospectiva', 'revisão', 'app', 'perspectempo',
      'teams', 'slack', 'documentação', 'escrevendo documento', 'fazendo relatório', 'fazendo apresentação',
      'relatório', 'apresentação', 'fazendo planilha', 'planilha', 'fazendo gráfico', 'gráfico', 'analisando dados', 'dados',
      'fazendo orçamento', 'orçamento', 'fazendo proposta', 'proposta', 'negociando', 'negociação',
      'zoom', 'google meet', 'videoconferência', 'call', 'skype', 'hangouts', 'pitch', 'fazendo pitch', 'apresentando projeto', 'apresentando ideia', 'brainstorming', 'fazendo brainstorming', 'resolvendo problema',
      'escrevendo prompt', 'fazendo prompt', 'prompt', 'projetando', 'inteligência artificial', 'IA',
      'Computador', 'trabalho', 'home office', 'escritório', 'fazendo coisa do trabalho', 'coisas do trabalho', 'foco no trabalho', 'concentrado no trabalho',
      'expediente', 'horário comercial', 'horário de trabalho', 'no trabalho', 'trabalhando duro', 'trabalhando muito', 'ralando', 'hora extra', 'trabalhando no fim de semana', 'trabalhando à noite', 'trabalhando de madrugada',
      'digitando', 'programando', 'dando aula', 'dando treinamento', 'ensinando',
      'criando post', 'criando conteúdo', 'criando vídeo', 'criando artigo', 'criando curso', 'criando aula',
      'gravando vídeo', 'gravando aula', 'gravando curso', 'gravando conteúdo', 'editando vídeo', 'editando aula', 'editando curso', 'editando conteúdo',
      'editando', 'produzindo', 'construindo', 'medindo', 'otimizando', 'automatizando', 'fazendo progresso', 'progredindo', 'criando valor', 'entregando valor', 'fazendo a diferença',
      'setando', 'definindo', 'determinando', 'alinhando', 'decidindo', 'respondendo', 'relatando', 'comunicando', 'colaborando',
      'traduzindo', 'fazendo tradução', 'tradução', 'interpretando', 'fazendo interpretação', 'interpretação',
      'transcrevendo', 'fazendo transcrição', 'transcrição', 'fazendo ata', 'ata', 'fazendo minutas', 'minutas',
      'regulatório', 'compliance', 'jurídico', 'legal', 'contrato', 'fazendo contrato', 'fazendo proposta comercial', 'proposta comercial',
      'comercial', 'vendas', 'fazendo venda', 'fazendo vendas', 'vendendo', 'negociando', 'negociação',
      'trampo', 'trabalhinho', 'trabalhão', 'estágio', 'freela', 'freelancer', 'consultoria', 'fazendo consultoria', 'consultando', 'fazendo consultoria',
      'fazendo freelas', 'fazendo freela', 'fazendo bico', 'bico', 'fazendo trampo', 'fazendo trabalhinho', 'fazendo trabalhão',
      'fazendo estágio', 'estagiando', 'orientando', 'mentorando', 'guiando', 'liderando', 'gerindo',
      'gestão', 'liderança', 'report', 'papelada', 'burocraciaa', 'fazendo papelada', 'fazendo burocracia', 'fazendo relatório de gestão', 'relatório de gestão',
      'assinando', 'resolvendo', 'resolvendo as coisas', 'resolução', 'criando solução', 'reunindo', 'fazendo reunião', 'fazendo meeting', 'fazendo call', 'video call',
      'microsoft', 'microsoft office', 'excel', 'powerpoint', 'word', 'outlook', 'microsoft teams',
      'google docs', 'google sheets', 'google slides', 'gmail', 'google calendar', 'agenda',
      'agendar', 'agendando', 'marcando compromisso', 'retornando', 'retornando contato', 'seguindo up', 'follow up', 'dando follow up', 'fazendo follow up', 'respondendo email', 'respondendo mensagem', 'respondendo cliente',
      'plantão', 'turno', 'ajudando', 'ajuda', 'suporte', 'fazendo suporte', 'atendendo cliente', 'atendendo chamado', 'chamado', 'ticket', 'resolvendo ticket', 'resolvendo chamado',
      'prospecção', 'prospectando', 'fiscalizando', 'fiscalização', 'monitorando', 'monitoramento', 'fazendo monitoramento', 'fazendo fiscalização', 'fazendo prospecção',
      'budget', 'orçando', 'plano', 'projetar', 'projetando', 'codar', 'codando', 'desenvolvendo', 'desenvolvimento', 'fazendo desenvolvimento', 'fazendo código', 'fazendo código novo', 'fazendo feature', 'fazendo bugfix', 'bugfix',
      'deploy', 'implantando', 'implantação', 'release', 'war room', 'bug',


    ],
  },
  {
    id: 'cat-estudo',
    name: 'Estudo',
    color: '#7c5bef',
    macrobox: 'construcao',
    enjoyment: 1, future: 2, priority: 1,
    budgetType: 'target',
    aliases: [
      'estudando', 'lendo', 'livro', 'curso', 'aula', 'pesquisa',
      'aprendendo', 'treinamento', 'leitura', 'podcast educativo',
      'documentário', 'aprendendo algo novo', 'estudo', 'foco nos estudos', 'concentração', 'foco',
      'estudando para prova', 'estudando para concurso', 'estudando para certificação', 'estudando para vestibular',
      'estudando música', 'estudando instrumento', 'praticando instrumento', 'estudando arte', 'estudando programação', 'estudando ciência',
      'educação', 'auto aprendizado', 'aprendizado autodidata', 'estudando por conta própria', 'aprendendo por conta própria',
      'desenvolvimento pessoal', 'desenvolvimento profissional', 'melhorando minhas habilidades', 'investindo em mim mesmo', 'investindo no meu futuro',
      'educação financeira', 'aprendendo sobre finanças', 'aprendendo sobre investimentos', 'aprendendo sobre economia', 'aprendendo sobre dinheiro',
      'vendo curso', 'vendo aula', 'vendo vídeo educativo', 'lendo artigo', 'lendo livro didático', 'lendo material de estudo',
      'duolingo', 'aprendendo idioma', 'estudando idioma', 'praticando idioma', 'aprendendo inglês', 'aprendendo espanhol', 'aprendendo francês',
      'aprendendo alemão', 'aprendendo japonês', 'aprendendo mandarim', 'aprendendo russo', 'aprendendo italiano',
      'aprendendo coreano', 'aprendendo árabe', 'aprendendo hindi', 'aprendendo grego', 'aprendendo latim',
      'aprendendo português', 'aprendendo gramática', 'aprendendo vocabulário', 'aprendendo pronúncia', 'aprendendo escrita',
      'gramática', 'vocabulário', 'certificado', 'prova', 'exame', 'teste', 'trabalho de casa', 'homework', 'tarefa escolar', 'tarefa universitária',
      'pesquisando', 'fazendo pesquisa', 'fazendo trabalho acadêmico', 'fazendo artigo científico', 'fazendo monografia',
    ],
  },
  {
    id: 'cat-treino',
    name: 'Treino',
    color: '#26c281',
    macrobox: 'manutencao',
    enjoyment: 0, future: 2, priority: 2,
    budgetType: 'target',
    aliases: [
      'malhando', 'academia', 'correndo', 'correr', 'yoga', 'exercício',
      'ginásio', 'ciclismo', 'natação', 'alongando', 'musculação',
      'crossfit', 'esporte', 'pilates', 'personal trainer', 'treinando', 'treino funcional',
      'treino de força', 'treino de resistência', 'treino de flexibilidade', 'treino de equilíbrio',
      'treino de alta intensidade', 'HIIT', 'treino ao ar livre', 'treino em casa',
      'treino de corrida', 'treino de ciclismo', 'treino de natação', 'treino de yoga',
      'treino de pilates', 'treino de alongamento', 'treino de musculação', 'treino de crossfit',
      'suando', 'ficando em forma', 'cuidando dos músculos', 'atividade física', 'movimentando o corpo',
      'pulando corda', 'subindo escadas', 'fazendo abdominais', 'fazendo flexões', 'fazendo agachamentos',
      'calistenia', 'corrida de rua', 'corrida', 'bicicleta', 'pedalando', 'nadar', 'nadando', 'indo para academia',
      'fisioterapia', 'fisio', 'instrumento', 'praticando instrumento',
      'praticando piano', 'praticando violão', 'praticando guitarra', 'praticando bateria',
      'treinando piano', 'treinando violão', 'treinando guitarra', 'treinando bateria',
      
    ],
  },
  {
    id: 'cat-refeicao',
    name: 'Refeições',
    color: '#e8a23b',
    macrobox: 'sobrevivencia',
    enjoyment: 1, future: 0, priority: 1,
    budgetType: 'protected',
    aliases: [
      'comendo', 'almoço', 'jantar', 'café', 'café da manhã',
      'lanche', 'cozinhando', 'refeição', 'restaurante',
      'comida', 'petiscando', 'beliscando', 'ceia', 'comida de verdade',
      'comida saudável', 'comida lixo', 'fast food', 'pizza', 'hambúrguer', 'sanduíche', 'sorvete',
      'bebendo', 'água', 'refrigerante', 'cerveja', 'vinho', 'suco', 'café', 'chá',
      'comendo', 'mastigando', 'degustando', 'saboreando', 'provando', 'cozinhando', 'preparando comida',
    ],
  },
  {
    id: 'cat-sono-prep',
    name: 'Higiene / Sono',
    color: '#3aa6b9',
    macrobox: 'sobrevivencia',
    enjoyment: 0, future: 1, priority: 1,
    budgetType: 'protected',
    aliases: [
      'dormindo', 'cochilo', 'descanso', 'higiene', 'banho', 'sesta', 'limpando a bunda', 'dormir', 'deitar',
      'ducha', 'rotina noturna', 'sono', 'dormindo', 'escovando', 'limpando a pele',
      'escovando os dentes', 'lavando o cabelo', 'cuidando de mim', 'autocuidado',
      'lavando o rosto', 'cuidando da pele', 'skincare', 'rotina de sono',
      'xixi','cocô', 'indo dormir', 'indo deitar', 'deitado', 'na cama', 'cama', 'sono longo',
      'banheiro', 'sanitário', 'toalete', 'lavabo', 'banho gelado', 'banho quente', 'relaxando no banho',
      'depilação', 'barbear', 'passando creme', 'raspando', 'tomando remédio', 'remédio', 'cagando', 'cagar', 'fazendo xixi', 'fazendo cocô', 'higiene íntima',
      'fio dental', 'passando fio dental', 'lente de contato', 'colocando lente de contato', 'tirando lente de contato', 'lentes de contato',
      'pijama', 'vestindo pijama', 'trocando de roupa', 'roupa de dormir', 'roupa confortável', 'me trocando',
      

    ],
  },
  {
    id: 'cat-social',
    name: 'Conexão social',
    color: '#ef5b8c',
    macrobox: 'nutricao',
    enjoyment: 2, future: 1, priority: 2,
    budgetType: 'target',
    aliases: [
      'amigos', 'família', 'conversa', 'ligação', 'papo',
      'encontro', 'vídeo chamada', 'conexão', 'socializar',
      'saindo', 'happy hour', 'confraternização', 'visitando', 'recebendo visita', 'evento social',
      'namorada', 'namorado', 'parceira', 'parceiro', 'crush', 'ficante', 'relacionamento', 'namoro',
      'irmã', 'irmão', 'mãe', 'pai', 'avó', 'avô', 'prima', 'primo', 'tia', 'tio', 'sobrinha', 'sobrinho',
      'vizinha', 'vizinho', 'colega de trabalho', 'colega de classe', 'amiga', 'amigo', 'parente', 'parentes', 'contato', 'amizade',
      'trocando ideia', 'conversando', 'juntando', 'socializando', 'interagindo', 'encontrando', 'indo pra balada', 'balada', 'aconselhando', 'ajudando',
      'bebendo com moderação', 'cervejinha', 'cervejada', 'vinho com amigos', 'vinho com a crush', 'vinho com o crush', 'vinhozinho', 'barzinho', 'pub', 'boteco', 'churrasco', 'festa', 'evento', 'reunião de família', 'almoço de família',
      'chamada de vídeo', 'discord', 'jogando com amigos', 'saindo com amigos', 'vendo amigo', 'vendo amiga',
      'networking', 'network', 'igreja', 'culto', 'reunião de igreja', 'atividade da igreja', 'voluntariado', 'trabalho voluntário', 'ONG', 'organização sem fins lucrativos',
      'colaborando', 'contando história', 'ouvindo',
    ],
  },
  {
    id: 'cat-lazer-ok',
    name: 'Lazer ativo',
    color: '#d96bff',
    macrobox: 'nutricao',
    enjoyment: 2, future: 1, priority: 3,
    budgetType: 'target',
    aliases: [
      'jogando', 'jogo', 'hobby', 'pintura', 'música', 'instrumento',
      'criando', 'meditação', 'meditando', 'lúdico', 'boardgame',
      'videogames', 'games', 'jogos', 'culinária por prazer',
      'fazendo arte', 'fazendo música', 'tocando instrumento', 'praticando instrumento',
      'pintando', 'desenhando', 'escrevendo', 'criando algo', 'fazendo algo com as mãos',
      'meditando', 'mindfulness', 'yoga leve', 'relaxamento', 'cuidando da mente',
      'jardinagem', 'cuidando das plantas', 'plantas', 'criando algo com as mãos',
      'tocando instrumento', 'playstation', 'xbox', 'switch', 'videogame', 'jogo de tabuleiro', 'boardgame',
      'jogo de cartas', 'pintura', 'desenho', 'escrita', 'hobbie', 'lendo por prazer', 'escrevendo',
      'literatura', 'romance', 'novel', 'quadrinho', 'mangá', 'criando', 'criatividade', 'arte', 'compondo música', 'hq', 'gibi',
      'brincando', 'brincadeira', 'divertindo', 'se divertindo', 'diversão', 'entretenimento ativo',
      'brincando com pet', 'pet', 'cuidando do pet', 'passeando com o cachorro', 'passeando com a cachorra', 'passeando com o pet',
      'faça você mesmo', 'DIY', 'projetos manuais', 'artesanato', 'crochê', 'tricô', 'marcenaria', 'cerâmica',
      'inventando', 'experiência', 'riscando algo da lista', 'fazendo algo novo', 'tentando algo novo', 'aprendendo algo novo',
      'conhecendo algo novo', 'explorando', 'aventura', 'viajando', 'viagem', 'passeio', 'turismo',
      'fazendo algo legal', 'curtindo o momento', 'curtindo', 'experimentando', 'saindo da zona de conforto',
    ],
  },

  {
    id: 'cat-lazer-bx',
    name: 'Lazer passivo',
    color: '#b58bff',
    macrobox: 'nutricao',
    enjoyment: 1, future: -1, priority: 4,
    budgetType: 'flexible',
    aliases: [
      'netflix', 'série', 'filme', 'tv', 'youtube', 'podcast',
      'assistindo', 'relaxando', 'prime video',
      'disney+', 'streaming', 'xbox', 'playstation', 'switch', 'videogame', 
      'novela', 'twitch', 'anime', 'crunchyroll', 'deitado', 'refletindo', 'brisando',
      'ouvindo música', 'spotify', 'apple music', 'música', 'rádio', 'audiobook',
      'assistindo série', 'assistindo filme', 'maratonando', 'maratona de série', 'maratona de filme',
      'ficando na cama', 'ficando deitado', 'ficando preguiçoso', 'preguiça', 'relaxamento passivo',
      'vendo série', 'vendo filme', 'assistindo algo', 'assistindo coisa aleatória', 'zapeando', 'zapping',
      'assistindo live', 'assistindo evento', 'assistindo partida', 'assistindo esportes', 'assistindo futebol',
      'vendo futebol', 'vendo jogo', 'assistindo jogo', 'de boa', 'fazendo uma pausa', 'pausa', 'ficando de bobeira', 'ficando à toa', 'sem fazer nada',
      
    ],
  },
  {
    id: 'cat-casa',
    name: 'Casa / Tarefas',
    color: '#9ea4b3',
    macrobox: 'manutencao',
    enjoyment: -1, future: 1, priority: 3,
    budgetType: 'target',
    aliases: [
      'limpeza', 'lavando', 'cozinha', 'compras', 'arrumando',
      'organização', 'tarefas domésticas', 'faxina', 'mercado',
      'cozinhando', 'organizando', 'varrendo', 'lavando roupa', 'consertos', 'manutenção da casa',
      'listando', 'planejando a semana', 'pagando contas', 'fazendo lista', 'quarto', 'sala', 'banheiro', 'quintal',
      'lixo', 'reciclagem', 'jardinagem', 'cuidando da casa', 'cuidando do lar', 'decorando','pintando a casa', 'reformando',
      'instalando', 'montando', 'consertando', 'reparando', 'manutenção', 'bancada', 'ferramentas', 'mesa', 'cadeira',
      'investindo', 'investimento financeiro', 'investimento', 'investimentos', 
    ],
  },
  // Scroll é CAP: 30 min é LIMITE TOLERADO, não meta. 0 min = ótimo. Não doa, não recebe.
  {
    id: 'cat-scroll',
    name: 'Scroll / Distrações',
    color: '#e85b5b',
    macrobox: 'vazamento',
    enjoyment: 1, future: -2, priority: 5,
    budgetType: 'cap',
    aliases: [
      'scrollando', 'rolando', 'instagram', 'tiktok', 'twitter', 'facebook', 'redes sociais', 'shorts', 'status do whatsapp', 'stories', 'status',
      'reddit', 'celular', 'distração', 'meme', 'notícias', 'browsing',
      'reels', 'feed', 'x (twitter)', 'tiktok', 'redes sociais', 'instagram', 'twitter', 'facebook',
      'scrollando', 'rolando', 'celular', 'distração', 'mexendo no celular', 'notícias', 'browsing',
      'reels', 'feed', 'x', 'pensando no ex', 'pensando na ex', 'pensamentos negativos', 'remoendo o passado', 'me culpando', 'procrastinando', 'remoendo',
      'pornô', 'porn', 'hentai', 'pornografia', 'xxx', 'masturbação','punheta', 'siririca', 'me tocando', 'me masturbando', 'tinder', 'grindr', 'aplicativo de paquera', 'bumble', 'happn', 'inner circle',
      'nada', 'tédio', 'sem propósito', 'vazio', 'sem rumo', 'ameba', 'sendo uma ameba', 'decepcionando meus pais', 'fazendo coisa errada', 'me prejudicando', 'perdendo tempo',
      'fumando', 'cigarro', 'charuto', 'cachimbo', 'fumando maconha', 'fumando baseado', 'fumando um', 'fumando um cigarro', 'fumando um charuto', 'fumando um cachimbo', 'fumando um baseado', 'fumando um cigarro de maconha', 'fumando um cigarro normal',
      'fumando narguilé', 'fumando um narguilé', 'fumando um narguile', 'fumando um hookah', 'fumando um shisha', 'fumando um arguile', 'cheirando pó', 'dando um tapa', 'cheirando cocaína', 'usando droga', 'usando drogas',
      'me drogando', 'ficando chapado', 'me entorpecendo', 'fazendo o que não devo', 'fazendo merda', 'me prejudicando', 'me auto sabotando', 'me auto destruindo', 'me acabando', 'me lascando', 'me fudendo', 'me fodendo',
      'indo atrás da ex', 'indo atrás do ex', 'stalkeando a ex', 'stalkeando o ex', 'vendo o perfil da ex', 'vendo o perfil do ex', 'obsessão', 'me comparando com os outros', 'inveja', 'sentindo inveja', 'sentindo ciúmes',
      'ciúmes', 'sentindo ciúmes', 'ódio', 'sentindo ódio', 'sentindo rancor', 'rancor', 'ressentimento', 'sentindo ressentimento',
      'fazendo besteira', 'besteira', 'nada de bom', 'ruim', 'prejudicial', 'bosta nenhuma', 'fútil', 'inútil', 
    ],
  },
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
