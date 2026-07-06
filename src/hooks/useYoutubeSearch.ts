import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { YoutubeApi } from '../youtube-api.js';
import type { SearchError, YoutubeVideoResult } from '../youtube-types.js';
import { makeVideoUrl, parseVideoId } from '../youtube-url.js';

const MAX_AUTO_PAGES = 5;

export interface UseYoutubeSearchResult {
  results: YoutubeVideoResult[];
  error: SearchError | null;
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  showLoadMore: boolean;
  totalPages: number;
}

export function useYoutubeSearch(
  api: YoutubeApi | null,
  query: string,
  apiKey: string
): UseYoutubeSearchResult {
  const trimmed = query.trim();
  const urlId = trimmed && parseVideoId(trimmed);
  const isUrlCase = !!urlId;

  const queryResult = useInfiniteQuery({
    queryKey: ['youtube-search', trimmed, apiKey],
    queryFn: async ({ pageParam }) => {
      return api!.search(trimmed, pageParam);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
    enabled: !!trimmed && !isUrlCase && !!api,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
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

  const results = directResult
    ? [directResult]
    : (queryResult.data?.pages.flatMap((p) => p.results) ?? []);

  const totalPages = queryResult.data?.pages.length ?? 0;
  const hasNextPage = !!queryResult.hasNextPage && totalPages < MAX_AUTO_PAGES;
  const showLoadMore = !!queryResult.hasNextPage && totalPages >= MAX_AUTO_PAGES;

  return {
    results,
    error: (queryResult.error as SearchError) ?? null,
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching,
    isFetchingNextPage: queryResult.isFetchingNextPage,
    fetchNextPage: queryResult.fetchNextPage,
    hasNextPage,
    showLoadMore,
    totalPages,
  };
}
