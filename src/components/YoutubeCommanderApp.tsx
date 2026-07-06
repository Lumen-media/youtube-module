import type {
  CommanderAppProps,
  CommanderSearchTrailingComponent,
  LumenHost,
} from '@lumen-media/module-sdk';
import { Button, Empty } from '@lumen-media/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  BarChart3,
  Globe,
  Inbox,
  Key,
  Loader,
  Search,
  Settings2,
  TriangleAlert,
  Video,
  WifiOff,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebounceValue, useEventListener } from 'usehooks-ts';
import type { PreferencesStore } from '../data/preferences.js';
import { useYoutubeSearch } from '../hooks/useYoutubeSearch.js';
import { t } from '../i18n.js';
import { YoutubeApi } from '../youtube-api.js';
import type { SearchError, YoutubePreferences, YoutubeVideoResult } from '../youtube-types.js';
import { ResultList } from './ResultList.js';
import { SettingsView } from './SettingsView.js';

interface YoutubeCommanderAppProps {
  host: LumenHost;
  prefsStore: PreferencesStore;
  commanderQuery?: string;
  setSearchTrailing?: CommanderAppProps['setSearchTrailing'];
}

type ViewState = 'search' | 'settings';

export function YoutubeCommanderApp({
  host,
  prefsStore,
  commanderQuery,
  setSearchTrailing,
}: YoutubeCommanderAppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000, retry: 1 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <YoutubeCommanderInner
        host={host}
        prefsStore={prefsStore}
        commanderQuery={commanderQuery}
        setSearchTrailing={setSearchTrailing}
      />
    </QueryClientProvider>
  );
}

function YoutubeCommanderInner({
  host,
  prefsStore,
  commanderQuery,
  setSearchTrailing,
}: YoutubeCommanderAppProps) {
  const [view, setView] = useState<ViewState>('search');
  const query = commanderQuery ?? '';
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [prefs, setPrefs] = useState<YoutubePreferences>(prefsStore.get());
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const apiRef = useRef<YoutubeApi | null>(null);
  const [debouncedQuery] = useDebounceValue(query, 400);

  useEffect(() => {
    apiRef.current = new YoutubeApi(host.net, prefs);
  }, [prefs, host.net]);

  useEventListener('online', () => setIsOffline(false));
  useEventListener('offline', () => setIsOffline(true));

  const searchResult = useYoutubeSearch(apiRef.current, debouncedQuery, prefs.apiKey);

  const results = searchResult.results;

  useEffect(() => {
    void debouncedQuery;
    if (isOffline) return;
    setSelectedIndex(0);
  }, [debouncedQuery, isOffline]);

  useEffect(() => {
    if (!setSearchTrailing) return;

    const SettingsAction: CommanderSearchTrailingComponent = () => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView('settings')}
        className="h-10 w-10 p-0"
        aria-label={t('settings')}
      >
        <Settings2 size={16} aria-hidden="true" />
      </Button>
    );

    setSearchTrailing(() => SettingsAction);
    return () => setSearchTrailing(undefined);
  }, [setSearchTrailing]);

  useEffect(() => {
    const el = sentinelRef.current;
    const container = scrollRef.current;
    if (!el || !searchResult.hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          searchResult.fetchNextPage();
        }
      },
      { root: container, rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [searchResult.hasNextPage, searchResult.fetchNextPage]);

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

  useEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') {
          (document.activeElement as HTMLElement).blur();
          e.stopPropagation();
          return;
        }
        if (view === 'settings') {
          e.stopPropagation();
          setView('search');
          return;
        }
        return;
      }

      if (results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      const video = results[selectedIndex];
      if (!video) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) {
          handleAddToQueue(video);
        } else if (e.ctrlKey || e.metaKey) {
          handleAddToLibrary(video);
        } else {
          handlePlay(video);
        }
        return;
      }

      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        e.stopPropagation();
        handleAddToQueue(video);
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        e.stopPropagation();
        handleAddNext(video);
        return;
      }

      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        e.stopPropagation();
        handleAddToLibrary(video);
        return;
      }

      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        e.stopPropagation();
        handleOpenExternal(video);
        return;
      }

      if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        e.stopPropagation();
        handleCopyUrl(video);
        return;
      }
    },
    undefined,
    { capture: true }
  );

  const handleSavePrefs = async (newPrefs: YoutubePreferences) => {
    const saved = await prefsStore.save(newPrefs);
    setPrefs(saved);
  };

  const hasKey = prefsStore.hasApiKey();
  const showEmptyState =
    !searchResult.isLoading &&
    !searchResult.error &&
    results.length === 0 &&
    !debouncedQuery.trim();

  if (view === 'settings') {
    return (
      <div className="flex flex-col h-full">
        <SettingsView prefs={prefs} onSave={handleSavePrefs} onClose={() => setView('search')} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 min-h-0">
        {isOffline && (
          <div className="p-4">
            <Empty>
              <Empty.EmptyMedia>
                <WifiOff size={24} aria-hidden="true" />
              </Empty.EmptyMedia>
              <Empty.EmptyHeader>
                <Empty.EmptyTitle>{t('offlineTitle')}</Empty.EmptyTitle>
                <Empty.EmptyDescription>{t('offlineDescription')}</Empty.EmptyDescription>
              </Empty.EmptyHeader>
            </Empty>
          </div>
        )}

        {!isOffline && searchResult.isLoading && (
          <div className="p-4 text-center text-muted-foreground">{t('searching')}</div>
        )}

        {!isOffline && searchResult.error && !searchResult.isLoading && (
          <div className="p-4">
            <ErrorState error={searchResult.error} onOpenSettings={() => setView('settings')} />
          </div>
        )}

        {!isOffline && !searchResult.isLoading && !searchResult.error && results.length > 0 && (
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto focus-visible:ring-0 focus-visible:outline-none"
          >
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

            {searchResult.isFetchingNextPage && (
              <div className="flex justify-center py-3">
                <Loader size={20} className="animate-spin text-muted-foreground" />
              </div>
            )}

            {!searchResult.isFetchingNextPage && searchResult.hasNextPage && (
              <div ref={sentinelRef} className="h-px" />
            )}

            {searchResult.showLoadMore && (
              <div className="py-3 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => searchResult.fetchNextPage()}
                  disabled={searchResult.isFetchingNextPage}
                >
                  {t('loadMore')}
                </Button>
              </div>
            )}
          </div>
        )}

        {showEmptyState && !hasKey && (
          <div className="p-4">
            <Empty>
              <Empty.EmptyMedia>
                <Video size={24} aria-hidden="true" />
              </Empty.EmptyMedia>
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

        {showEmptyState && hasKey && debouncedQuery.trim() === '' && (
          <div className="p-4">
            <Empty>
              <Empty.EmptyMedia>
                <Search size={24} aria-hidden="true" />
              </Empty.EmptyMedia>
              <Empty.EmptyHeader>
                <Empty.EmptyTitle>{t('searchReady')}</Empty.EmptyTitle>
                <Empty.EmptyDescription>{t('searchReadyDescription')}</Empty.EmptyDescription>
              </Empty.EmptyHeader>
            </Empty>
          </div>
        )}

        {!isOffline &&
          !searchResult.isLoading &&
          !searchResult.error &&
          hasKey &&
          debouncedQuery.trim() &&
          results.length === 0 && (
            <div className="p-4">
              <Empty>
                <Empty.EmptyMedia>
                  <Inbox size={24} aria-hidden="true" />
                </Empty.EmptyMedia>
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
          <Empty.EmptyMedia>
            <Key size={24} aria-hidden="true" />
          </Empty.EmptyMedia>
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
          <Empty.EmptyMedia>
            <Key size={24} aria-hidden="true" />
          </Empty.EmptyMedia>
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
          <Empty.EmptyMedia>
            <BarChart3 size={24} aria-hidden="true" />
          </Empty.EmptyMedia>
          <Empty.EmptyHeader>
            <Empty.EmptyTitle>{t('quotaTitle')}</Empty.EmptyTitle>
            <Empty.EmptyDescription>{t('quotaDescription')}</Empty.EmptyDescription>
          </Empty.EmptyHeader>
        </Empty>
      );

    case 'network':
      return (
        <Empty>
          <Empty.EmptyMedia>
            <Globe size={24} aria-hidden="true" />
          </Empty.EmptyMedia>
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
          <Empty.EmptyMedia>
            <TriangleAlert size={24} aria-hidden="true" />
          </Empty.EmptyMedia>
          <Empty.EmptyHeader>
            <Empty.EmptyTitle>{t('apiErrorTitle')}</Empty.EmptyTitle>
            <Empty.EmptyDescription>{error.message}</Empty.EmptyDescription>
          </Empty.EmptyHeader>
        </Empty>
      );
  }
}
