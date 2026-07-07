import type {
  CommanderAppProps,
  CommanderSearchTrailingComponent,
  LumenHost,
} from '@lumen-media/module-sdk';
import { ScrollArea } from '@lumen-media/module-sdk/ui';
import { Button, Empty } from '@lumen-media/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  BarChart3,
  Globe,
  Inbox,
  Key,
  Loader,
  Settings2,
  TriangleAlert, WifiOff
} from 'lucide-react';
import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebounceValue, useEventListener } from 'usehooks-ts';
import type { PreferencesStore } from '../data/preferences.js';
import { useYoutubeSearch } from '../hooks/useYoutubeSearch.js';
import { t } from '../i18n.js';
import { YoutubeApi } from '../youtube-api.js';
import { YoutubeLogoIcon } from './YoutubeLogoIcon.js';
import type { SearchError, YoutubePreferences, YoutubeVideoResult } from '../youtube-types.js';
import { ResultList } from './ResultList.js';
import { SettingsView } from './SettingsView.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000, retry: 1 },
  },
});
let lastSearchQuery = '';

type CommanderBackHandler = () => boolean | undefined | Promise<boolean | undefined>;
type CommanderBackHandlerSetter = Dispatch<SetStateAction<CommanderBackHandler | undefined>>;

interface YoutubeCommanderAppProps {
  host: LumenHost;
  prefsStore: PreferencesStore;
  commanderQuery?: string;
  onBack?: CommanderAppProps['onBack'];
  setBackHandler?: CommanderBackHandlerSetter;
  setSearchTrailing?: CommanderAppProps['setSearchTrailing'];
  setQuery?: CommanderAppProps['setQuery'];
}

type ViewState = 'search' | 'settings';

export function YoutubeCommanderApp({
  host,
  prefsStore,
  commanderQuery,
  onBack,
  setBackHandler,
  setSearchTrailing,
  setQuery,
}: YoutubeCommanderAppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <YoutubeCommanderInner
        host={host}
        prefsStore={prefsStore}
        commanderQuery={commanderQuery}
        onBack={onBack}
        setBackHandler={setBackHandler}
        setSearchTrailing={setSearchTrailing}
        setQuery={setQuery}
      />
    </QueryClientProvider>
  );
}

function YoutubeCommanderInner({
  host,
  prefsStore,
  commanderQuery,
  onBack,
  setBackHandler,
  setSearchTrailing,
  setQuery,
}: YoutubeCommanderAppProps) {
  const [view, setView] = useState<ViewState>('search');
  const query = commanderQuery ?? '';
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedIndexRef = useRef(selectedIndex);
  const handleSelectIndex = useCallback((index: number) => {
    selectedIndexRef.current = index;
    setSelectedIndex(index);
  }, []);
  const [prefs, setPrefs] = useState<YoutubePreferences>(prefsStore.get());
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(false);

  const api = useMemo(() => new YoutubeApi(host.net, prefs), [host.net, prefs]);
  const [debouncedQuery] = useDebounceValue(query, 400);

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (!isFirstMount.current) return;
    isFirstMount.current = false;
    if (!commanderQuery && lastSearchQuery && setQuery) {
      setQuery(lastSearchQuery);
    }
  }, [commanderQuery, setQuery]);

  useEffect(() => {
    if (debouncedQuery) lastSearchQuery = debouncedQuery;
  }, [debouncedQuery]);

  useEventListener('online', () => setIsOffline(false));
  useEventListener('offline', () => setIsOffline(true));

  const searchResult = useYoutubeSearch(api, debouncedQuery, prefs.apiKey);

  const results = searchResult.results;

  const handleBack = useCallback(() => {
    if (view === 'settings') {
      setView('search');
      return;
    }

    onBack?.();
  }, [onBack, view]);

  useEffect(() => {
    if (!setBackHandler) return;

    setBackHandler(() => () => {
      if (view === 'settings') {
        setView('search');
        return true;
      }

      return undefined;
    });

    return () => setBackHandler(undefined);
  }, [setBackHandler, view]);

  useEffect(() => {
    if (isOffline || debouncedQuery.trim() === '') return;
    handleSelectIndex(0);
  }, [debouncedQuery, isOffline, handleSelectIndex]);

  useEffect(() => {
    if (!setSearchTrailing) return;
    if (view === 'settings') {
      setSearchTrailing(undefined);
      return;
    }

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
  }, [setSearchTrailing, view]);

  const handlePlay = useCallback(
    (video: YoutubeVideoResult) => {
      host.player.play(video.url);
    },
    [host]
  );

  const handleAddToQueue = useCallback(
    (video: YoutubeVideoResult) => {
      const q = host.queue as unknown as Record<string, unknown>;
      if (typeof q.addUrl === 'function') {
        q.addUrl({ url: video.url, position: 'end' });
      }
      host.ui.notify({ message: t('addedToQueue', { title: video.title }), id: `queue:${video.videoId}` });
    },
    [host]
  );

  const handleAddNext = useCallback(
    (video: YoutubeVideoResult) => {
      const q = host.queue as unknown as Record<string, unknown>;
      if (typeof q.addUrl === 'function') {
        q.addUrl({ url: video.url, position: 'next' });
      }
      host.ui.notify({ message: t('addedNext', { title: video.title }), id: `next:${video.videoId}` });
    },
    [host]
  );

  const handleAddToLibrary = useCallback(
    (video: YoutubeVideoResult) => {
      const lib = host.library as unknown as Record<string, unknown>;
      if (typeof lib.addUrl === 'function') {
        lib.addUrl({ url: video.url });
      }
      host.ui.notify({ message: t('addedToLibrary', { title: video.title }), id: `library:${video.videoId}` });
    },
    [host]
  );

  const handleOpenExternal = useCallback((video: YoutubeVideoResult) => {
    window.open(video.url, '_blank');
  }, []);

  const handleCopyUrl = useCallback(
    async (video: YoutubeVideoResult) => {
      try {
        await navigator.clipboard.writeText(video.url);
        host.ui.notify({ message: t('copiedUrl'), id: 'copy-url' });
      } catch {
        host.ui.notify({ message: t('copyFailed'), level: 'error', id: 'copy-failed' });
      }
    },
    [host]
  );

  const handlePrimaryAction = useCallback(
    (video: YoutubeVideoResult) => {
      if (prefs.defaultAction === 'addToQueue') {
        handleAddToQueue(video);
      } else {
        handlePlay(video);
      }
    },
    [prefs.defaultAction, handleAddToQueue, handlePlay]
  );

  const handleCtrlEnter = useCallback(
    (video: YoutubeVideoResult) => {
      if (prefs.defaultAction === 'addToQueue') {
        handlePlay(video);
      } else {
        handleAddToLibrary(video);
      }
    },
    [prefs.defaultAction, handlePlay, handleAddToLibrary]
  );

  const handleKeyDownRef = useRef<(e: KeyboardEvent) => void>(() => { });
  handleKeyDownRef.current = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        (document.activeElement as HTMLElement).blur();
        e.stopPropagation();
        return;
      }
      if (view === 'settings') {
        e.stopPropagation();
        handleBack();
        return;
      }
      return;
    }

    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      shouldScrollRef.current = true;
      handleSelectIndex(Math.min(selectedIndexRef.current + 1, results.length - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      shouldScrollRef.current = true;
      handleSelectIndex(Math.max(selectedIndexRef.current - 1, 0));
      return;
    }

    const isInputFocused =
      document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';

    const video = results[selectedIndexRef.current];
    if (!video) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (e.shiftKey) {
        handleAddToQueue(video);
      } else if (e.ctrlKey || e.metaKey) {
        handleCtrlEnter(video);
      } else {
        handlePrimaryAction(video);
      }
      return;
    }

    if (isInputFocused) return;

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
  };

  useEventListener('keydown', (e: KeyboardEvent) => handleKeyDownRef.current(e), undefined, {
    capture: true,
  });

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
        <SettingsView prefs={prefs} onSave={handleSavePrefs} onClose={handleBack} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 min-h-0 overflow-hidden">
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
          <div className="flex h-full min-h-[260px] items-center justify-center p-6">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader size={24} className="animate-spin" aria-hidden="true" />
              <span className="text-sm">{t('searching')}</span>
            </div>
          </div>
        )}

        {!isOffline && searchResult.error && !searchResult.isLoading && (
          <div className="p-4">
            <ErrorState error={searchResult.error} onOpenSettings={() => setView('settings')} />
          </div>
        )}

        {!isOffline && !searchResult.isLoading && !searchResult.error && results.length > 0 && (
          <ScrollArea
            ref={scrollRef}
            className="h-full max-h-96"
            viewportClassName="custom-scrollbar"
          >
            <ResultList
              results={results}
              selectedIndex={selectedIndex}
              onSelectIndex={handleSelectIndex}
              scrollRef={scrollRef}
              shouldScrollRef={shouldScrollRef}
              onPrimaryAction={handlePrimaryAction}
              onAddToQueue={handleAddToQueue}
              onAddNext={handleAddNext}
              onAddToLibrary={handleAddToLibrary}
              onCtrlEnter={handleCtrlEnter}
              onOpenExternal={handleOpenExternal}
              onCopyUrl={handleCopyUrl}
            />

            {searchResult.isFetchingNextPage && (
              <div className="flex justify-center py-3">
                <Loader size={20} className="animate-spin text-muted-foreground" />
              </div>
            )}

            {searchResult.hasNextPage && (
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
          </ScrollArea>
        )}

        {showEmptyState && !hasKey && (
          <div className="flex h-full min-h-[260px] items-center justify-center p-6">
            <Empty className='gap-2'>
              <Empty.EmptyMedia className='mb-0'>
                <YoutubeLogoIcon size={28} />
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
          <div className="flex h-full min-h-[260px] items-center justify-center p-6">
            <Empty className='gap-2'>
              <Empty.EmptyMedia className='mb-0'>
                <YoutubeLogoIcon size={28} />
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








