import type { LumenHost } from '@lumen-media/module-sdk';
import { Button, Empty } from '@lumen-media/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PreferencesStore } from '../data/preferences.js';
import { t } from '../i18n.js';
import { YoutubeApi } from '../youtube-api.js';
import type { SearchError, YoutubePreferences, YoutubeVideoResult } from '../youtube-types.js';
import { makeVideoUrl, parseVideoId } from '../youtube-url.js';
import { ResultList } from './ResultList.js';
import { SearchBox } from './SearchBox.js';
import { SettingsView } from './SettingsView.js';

interface YoutubeCommanderAppProps {
  host: LumenHost;
  prefsStore: PreferencesStore;
  initialQuery?: string;
}

type ViewState = 'search' | 'settings';

export function YoutubeCommanderApp({ host, prefsStore, initialQuery }: YoutubeCommanderAppProps) {
  const [view, setView] = useState<ViewState>('search');
  const [query, setQuery] = useState(initialQuery ?? '');
  const [results, setResults] = useState<YoutubeVideoResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SearchError | null>(null);
  const [prefs, setPrefs] = useState<YoutubePreferences>(prefsStore.get());

  const apiRef = useRef<YoutubeApi | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    apiRef.current = new YoutubeApi(host.net, prefs);
  }, [prefs, host.net]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    const urlId = parseVideoId(q.trim());
    if (urlId) {
      setResults([
        {
          videoId: urlId,
          url: makeVideoUrl(urlId),
          title: q.trim(),
          channelTitle: '',
          thumbnailUrl: `https://i.ytimg.com/vi/${urlId}/mqdefault.jpg`,
        },
      ]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const page = await apiRef.current!.search(q.trim());
      setResults(page.results);
      setSelectedIndex(0);
    } catch (err: unknown) {
      setError(err as SearchError);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      doSearch(query);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, doSearch]);

  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setError(null);
  };

  const handlePlay = (video: YoutubeVideoResult) => {
    host.ui.notify({ message: t('playingVideo', { title: video.title }) });
    host.player.play?.(video.videoId);
  };

  const handleAddToQueue = useCallback(
    (video: YoutubeVideoResult) => {
      const q = host.queue as unknown as Record<string, unknown>;
      if (typeof q.addUrl === 'function') {
        q.addUrl({ url: video.url, position: 'end' });
      }
      host.ui.notify({ message: t('addedToQueue', { title: video.title }) });
    },
    [host]
  );

  const handleAddNext = useCallback(
    (video: YoutubeVideoResult) => {
      const q = host.queue as unknown as Record<string, unknown>;
      if (typeof q.addUrl === 'function') {
        q.addUrl({ url: video.url, position: 'next' });
      }
      host.ui.notify({ message: t('addedNext', { title: video.title }) });
    },
    [host]
  );

  const handleAddToLibrary = useCallback(
    (video: YoutubeVideoResult) => {
      const lib = host.library as unknown as Record<string, unknown>;
      if (typeof lib.addUrl === 'function') {
        lib.addUrl({ url: video.url });
      }
      host.ui.notify({ message: t('addedToLibrary', { title: video.title }) });
    },
    [host]
  );

  const handleOpenExternal = (video: YoutubeVideoResult) => {
    window.open(video.url, '_blank');
  };

  const handleCopyUrl = async (video: YoutubeVideoResult) => {
    try {
      await navigator.clipboard.writeText(video.url);
      host.ui.notify({ message: t('copiedUrl') });
    } catch {
      host.ui.notify({ message: t('copyFailed'), level: 'error' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      // handled by ResultRow onKeyDown
      return;
    }
  };

  const handleSavePrefs = async (newPrefs: YoutubePreferences) => {
    const saved = await prefsStore.save(newPrefs);
    setPrefs(saved);
  };

  const hasKey = prefsStore.hasApiKey();
  const showEmptyState = !loading && !error && results.length === 0 && !query.trim();

  if (view === 'settings') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <SettingsView prefs={prefs} onSave={handleSavePrefs} onClose={() => setView('search')} />
      </div>
    );
  }

  return (
    <div
      role="application"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <SearchBox
          value={query}
          onChange={setQuery}
          onClear={handleClearSearch}
          disabled={!hasKey && !loading}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setView('settings')}
          style={{ marginRight: 8, fontSize: 18 }}
          aria-label={t('settings')}
        >
          ⚙
        </Button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {loading && (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--muted-foreground)' }}>
            {t('searching')}
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: 16 }}>
            <ErrorState error={error} onOpenSettings={() => setView('settings')} />
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <ResultList
            results={results}
            selectedIndex={selectedIndex}
            onSelectIndex={setSelectedIndex}
            onPlay={handlePlay}
            onAddToQueue={handleAddToQueue}
            onAddNext={handleAddNext}
            onAddToLibrary={handleAddToLibrary}
            onOpenExternal={handleOpenExternal}
            onCopyUrl={handleCopyUrl}
          />
        )}

        {showEmptyState && !hasKey && (
          <div style={{ padding: 16 }}>
            <Empty>
              <Empty.EmptyMedia>🎬</Empty.EmptyMedia>
              <Empty.EmptyHeader>
                <Empty.EmptyTitle>{t('noKeyTitle')}</Empty.EmptyTitle>
                <Empty.EmptyDescription>{t('noKeyDescription')}</Empty.EmptyDescription>
              </Empty.EmptyHeader>
              <Empty.EmptyContent>
                <Button onClick={() => setView('settings')}>{t('configureKey')}</Button>
              </Empty.EmptyContent>
            </Empty>
          </div>
        )}

        {showEmptyState && hasKey && query.trim() === '' && !initialQuery && (
          <div style={{ padding: 16 }}>
            <Empty>
              <Empty.EmptyMedia>🔍</Empty.EmptyMedia>
              <Empty.EmptyHeader>
                <Empty.EmptyTitle>{t('searchReady')}</Empty.EmptyTitle>
                <Empty.EmptyDescription>{t('searchReadyDescription')}</Empty.EmptyDescription>
              </Empty.EmptyHeader>
            </Empty>
          </div>
        )}

        {!loading && !error && hasKey && query.trim() && results.length === 0 && (
          <div style={{ padding: 16 }}>
            <Empty>
              <Empty.EmptyMedia>📭</Empty.EmptyMedia>
              <Empty.EmptyHeader>
                <Empty.EmptyTitle>{t('noResults')}</Empty.EmptyTitle>
                <Empty.EmptyDescription>{t('noResultsDescription')}</Empty.EmptyDescription>
              </Empty.EmptyHeader>
            </Empty>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorState({ error, onOpenSettings }: { error: SearchError; onOpenSettings: () => void }) {
  switch (error.type) {
    case 'missing_key':
      return (
        <Empty>
          <Empty.EmptyMedia>🔑</Empty.EmptyMedia>
          <Empty.EmptyHeader>
            <Empty.EmptyTitle>{t('noKeyTitle')}</Empty.EmptyTitle>
            <Empty.EmptyDescription>{t('noKeyDescription')}</Empty.EmptyDescription>
          </Empty.EmptyHeader>
          <Empty.EmptyContent>
            <Button onClick={onOpenSettings}>{t('configureKey')}</Button>
          </Empty.EmptyContent>
        </Empty>
      );

    case 'invalid_key':
      return (
        <Empty>
          <Empty.EmptyMedia>🔑</Empty.EmptyMedia>
          <Empty.EmptyHeader>
            <Empty.EmptyTitle>{t('invalidKeyTitle')}</Empty.EmptyTitle>
            <Empty.EmptyDescription>{t('invalidKeyDescription')}</Empty.EmptyDescription>
          </Empty.EmptyHeader>
          <Empty.EmptyContent>
            <Button onClick={onOpenSettings}>{t('editKey')}</Button>
          </Empty.EmptyContent>
        </Empty>
      );

    case 'quota_exceeded':
      return (
        <Empty>
          <Empty.EmptyMedia>📊</Empty.EmptyMedia>
          <Empty.EmptyHeader>
            <Empty.EmptyTitle>{t('quotaTitle')}</Empty.EmptyTitle>
            <Empty.EmptyDescription>{t('quotaDescription')}</Empty.EmptyDescription>
          </Empty.EmptyHeader>
        </Empty>
      );

    case 'network':
      return (
        <Empty>
          <Empty.EmptyMedia>🌐</Empty.EmptyMedia>
          <Empty.EmptyHeader>
            <Empty.EmptyTitle>{t('networkTitle')}</Empty.EmptyTitle>
            <Empty.EmptyDescription>{error.message}</Empty.EmptyDescription>
          </Empty.EmptyHeader>
          <Empty.EmptyContent>
            <Button onClick={() => window.location.reload()}>{t('retry')}</Button>
          </Empty.EmptyContent>
        </Empty>
      );

    case 'api':
      return (
        <Empty>
          <Empty.EmptyMedia>⚠️</Empty.EmptyMedia>
          <Empty.EmptyHeader>
            <Empty.EmptyTitle>{t('apiErrorTitle')}</Empty.EmptyTitle>
            <Empty.EmptyDescription>{error.message}</Empty.EmptyDescription>
          </Empty.EmptyHeader>
        </Empty>
      );
  }
}
