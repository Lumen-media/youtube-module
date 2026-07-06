const en: Record<string, string> = {
  commandTitle: 'Search YouTube',
  commandSubtitle: 'Search and play YouTube videos',
  searchPlaceholder: 'Search YouTube or paste a URL...',
  clearSearch: 'Clear search',
  searchFor: 'Search for',
  pressEnter: 'Press Enter to search',

  playAction: 'Play',
  queueAction: 'Queue',
  nextAction: 'Next',
  libraryAction: 'Library',
  openAction: 'Open',
  copyAction: 'Copy URL',

  playingVideo: 'Playing {{title}}',
  addedToQueue: 'Added to queue: {{title}}',
  addedNext: 'Playing next: {{title}}',
  addedToLibrary: 'Added to library: {{title}}',
  copiedUrl: 'URL copied to clipboard',
  copyFailed: 'Failed to copy URL',

  searching: 'Searching...',

  noKeyTitle: 'API Key Required',
  noKeyDescription: 'Configure your YouTube Data API key to start searching.',
  configureKey: 'Configure API Key',
  editKey: 'Edit API Key',

  invalidKeyTitle: 'Invalid API Key',
  invalidKeyDescription: 'The configured API key is invalid or has been revoked.',

  quotaTitle: 'Quota Exceeded',
  quotaDescription: 'The API quota for this key has been reached. Try again later.',

  networkTitle: 'Network Error',
  apiErrorTitle: 'API Error',

  retry: 'Retry',
  loadMore: 'Load more',

  offlineTitle: 'No Connection',
  offlineDescription: 'An internet connection is required to search YouTube.',

  settingsTitle: 'YouTube Module Settings',
  settings: 'Settings',

  apiKeyLabel: 'YouTube Data API Key',
  apiKeyPlaceholder: 'Paste your API key',
  apiKeyHint:
    'This key belongs to you. Get one at https://console.cloud.google.com/apis/credentials',
  show: 'Show',
  hide: 'Hide',

  regionLabel: 'Region Code',
  languageLabel: 'Language',
  safeSearchLabel: 'Safe Search',
  maxResultsLabel: 'Max Results',
  defaultActionLabel: 'Default Action',

  safeNone: 'None',
  safeModerate: 'Moderate',
  safeStrict: 'Strict',

  actionAddToQueue: 'Add to Queue',
  actionPlayNow: 'Play Now',

  cancel: 'Cancel',
  save: 'Save',
  saving: 'Saving...',

  noResults: 'No results found',
  noResultsDescription: 'Try a different search term.',
  searchReady: 'Search YouTube',
  searchReadyDescription: 'Type a query above to search for videos.',

  today: 'Today',
  daysAgo: '{{count}}d ago',
  monthsAgo: '{{count}}mo ago',
  yearsAgo: '{{count}}y ago',

  views: '{{count}} views',
};

export default en;
