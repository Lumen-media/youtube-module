import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { YoutubeApi } from '../youtube-api.js';
import type { SearchError, YoutubePreferences, YoutubeVideoResult } from '../youtube-types.js';
import { makeVideoUrl, parseVideoId } from '../youtube-url.js';

export interface UseYoutubeSearchResult {
  results: YoutubeVideoResult[];
  error: SearchError | null;
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
}

export function useYoutubeSearch(
  api: YoutubeApi | null,
  query: string,
  apiKey: string,
  searchSource: YoutubePreferences['searchSource'] = 'auto'
): UseYoutubeSearchResult {
  const trimmed = query.trim();
  const urlId = trimmed && parseVideoId(trimmed);
  const isUrlCase = !!urlId;

  const queryResult = useInfiniteQuery({
    queryKey: ['youtube-search', trimmed, apiKey, searchSource],
    queryFn: async ({ pageParam }) => {
      return api!.search(trimmed, pageParam);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
    enabled: !!trimmed && !isUrlCase && !!api,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const directResult: YoutubeVideoResult | null = useMemo(
    () =>
      urlId
        ? {
            videoId: urlId,
            url: makeVideoUrl(urlId),
            title: trimmed,
            channelTitle: '',
            thumbnailUrl: `https://i.ytimg.com/vi/${urlId}/mqdefault.jpg`,
          }
        : null,
    [urlId, trimmed]
  );

  const results = useMemo(() => {
    if (directResult) return [directResult];
    const all = queryResult.data?.pages.flatMap((p) => p.results) ?? [];
    const seen = new Set<string>();
    return all.filter((r) => {
      if (seen.has(r.videoId)) return false;
      seen.add(r.videoId);
      return true;
    });
  }, [directResult, queryResult.data?.pages]);

  return {
    results,
    error: (queryResult.error as unknown as SearchError) ?? null,
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching,
    isFetchingNextPage: queryResult.isFetchingNextPage,
    fetchNextPage: queryResult.fetchNextPage,
    hasNextPage: !!queryResult.hasNextPage,
  };
}
