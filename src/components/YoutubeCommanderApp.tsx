import type {
  CommanderAppProps,
  CommanderSearchTrailingComponent,
  LumenHost,
} from '@lumen-media/module-sdk';
import { ScrollArea } from '@lumen-media/module-sdk/ui';
import { Button, Empty } from '@lumen-media/ui';
import {
  BarChart3,
  Globe,
  Inbox,
  Key,
  Search,
  Settings2,
  TriangleAlert,
  Video,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebounceValue, useEventListener } from 'usehooks-ts';
import type { PreferencesStore } from '../data/preferences.js';
import { t } from '../i18n.js';
import { YoutubeApi } from '../youtube-api.js';
import type { SearchError, YoutubePreferences, YoutubeVideoResult } from '../youtube-types.js';
import { makeVideoUrl, parseVideoId } from '../youtube-url.js';
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
  const [view, setView] = useState<ViewState>('search');
  const query = commanderQuery ?? '';
  const [results, setResults] = useState<YoutubeVideoResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SearchError | null>(null);
  const [prefs, setPrefs] = useState<YoutubePreferences>(prefsStore.get());

  const apiRef = useRef<YoutubeApi | null>(null);
  const [debouncedQuery] = useDebounceValue(query, 400);

  useEffect(() => {
    apiRef.current = new YoutubeApi(host.net, prefs);
  }, [prefs, host.net]);
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
    doSearch(debouncedQuery);
  }, [debouncedQuery, doSearch]);

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

  useEventListener('keydown', (e: KeyboardEvent) => {
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
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }
  });

  const handleSavePrefs = async (newPrefs: YoutubePreferences) => {
    const saved = await prefsStore.save(newPrefs);
    setPrefs(saved);
  };

  const hasKey = prefsStore.hasApiKey();
  const showEmptyState = !loading && !error && results.length === 0 && !query.trim();

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
        {loading && <div className="p-4 text-center text-muted-foreground">{t('searching')}</div>}

        {error && !loading && (
          <div className="p-4">
            <ErrorState error={error} onOpenSettings={() => setView('settings')} />
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <ScrollArea className="flex flex-col max-h-[400px] focus-visible:ring-0 focus-visible:outline-none">
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
          </ScrollArea>
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

        {showEmptyState && hasKey && query.trim() === '' && (
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

        {!loading && !error && hasKey && query.trim() && results.length === 0 && (
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
