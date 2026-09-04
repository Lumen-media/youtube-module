const ptBR: Record<string, string> = {
  commandTitle: 'Pesquisar YouTube',
  commandSubtitle: 'Busque e reproduza vídeos do YouTube',
  searchPlaceholder: 'Pesquisar no YouTube ou cole uma URL...',
  clearSearch: 'Limpar busca',
  searchFor: 'Pesquisar por',
  pressEnter: 'Pressione Enter para pesquisar',

  playAction: 'Tocar',
  queueAction: 'Fila',
  nextAction: 'Próximo',
  libraryAction: 'Biblioteca',
  openAction: 'Abrir',
  copyAction: 'Copiar URL',

  playingVideo: 'Tocando {{title}}',
  addedToQueue: 'Adicionado à fila: {{title}}',
  addedNext: 'Tocando em seguida: {{title}}',
  addedToLibrary: 'Adicionado à biblioteca: {{title}}',
  copiedUrl: 'URL copiada para a área de transferência',
  copyFailed: 'Falha ao copiar URL',

  searching: 'Pesquisando...',

  noKeyTitle: 'Chave de API Necessária',
  noKeyDescription: 'Configure sua chave da YouTube Data API para começar a pesquisar.',
  configureKey: 'Configurar Chave de API',
  editKey: 'Editar Chave de API',

  invalidKeyTitle: 'Chave de API Inválida',
  invalidKeyDescription: 'A chave de API configurada é inválida ou foi revogada.',

  quotaTitle: 'Cota Excedida',
  quotaDescription: 'A cota da API para esta chave foi atingida. Tente novamente mais tarde.',

  networkTitle: 'Erro de Rede',
  apiErrorTitle: 'Erro de API',

  retry: 'Tentar novamente',
  loadMore: 'Carregar mais',

  offlineTitle: 'Sem Conexão',
  offlineDescription: 'É necessária uma conexão com a internet para pesquisar no YouTube.',

  settingsTitle: 'Configurações do Módulo YouTube',
  settings: 'Configurações',

  apiKeyLabel: 'Chave da YouTube Data API',
  apiKeyPlaceholder: 'Cole sua chave de API',
  apiKeyHint: 'Colar URL de vídeo não gasta cota — só pesquisas por texto consomem (~100/dia).',
  apiKeyBackupLabel: 'Chave de API Reserva (opcional)',
  apiKeyBackupPlaceholder: 'Cole uma chave de API reserva',
  apiKeyBackupHint:
    'Se a chave principal atingir a cota, a chave reserva é usada automaticamente. Use uma chave de um projeto diferente do Google Cloud para máxima redundância.',
  addBackupKey: 'Adicionar chave de API reserva',
  show: 'Mostrar',
  hide: 'Ocultar',
  remove: 'Remover',

  regionLabel: 'Código da Região',
  languageLabel: 'Idioma',
  safeSearchLabel: 'Busca Segura',
  maxResultsLabel: 'Máx. Resultados',
  defaultActionLabel: 'Ação Padrão',

  safeNone: 'Nenhum',
  safeModerate: 'Moderado',
  safeStrict: 'Restrito',

  actionAddToQueue: 'Adicionar à Fila',
  actionPlayNow: 'Tocar Agora',

  getKey: 'Obtenha uma no Google Cloud Console',
  save: 'Salvar',
  saving: 'Salvando...',
  cancel: 'Cancelar',

  noResults: 'Nenhum resultado encontrado',
  noResultsDescription: 'Tente um termo de busca diferente.',
  searchReady: 'Pesquisar YouTube',
  searchReadyDescription: 'Digite um termo acima para pesquisar vídeos.',

  today: 'Hoje',
  daysAgo: '{{count}}d atrás',
  monthsAgo: '{{count}} meses atrás',
  yearsAgo: '{{count}}a atrás',

  views: '{{count}} visualizações',

  sourceLabel: 'Fonte de Busca',
  sourceAuto: 'Automático (Google + Piped + YouTube)',
  sourceGoogle: 'API do Google apenas',
  sourcePiped: 'Piped apenas',
  sourceAutoDesc:
    'Usa a API do Google se houver chave; sem chave, tenta as instâncias do Piped (da mais rápida à mais lenta) e depois a página do YouTube.',
  sourceGoogleDesc: 'Usa apenas a API do Google. Requer uma chave de API válida.',
  sourcePipedDesc:
    'Usa as APIs do Piped (api.piped.private.coffee e pipedapi.ducks.party), da mais rápida à mais lenta. Não precisa de chave.',
  liveBadge: 'AO VIVO',
  upcomingBadge: 'PRÓXIMO',
};

export default ptBR;
