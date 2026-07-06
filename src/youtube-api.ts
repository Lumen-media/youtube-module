import type { NetAPI } from '@lumen-media/module-sdk';
import type {
  SearchError,
  YoutubePreferences,
  YoutubeSearchResponse,
  YoutubeVideoResponse,
  YoutubeVideoResult,
} from './youtube-types.js';
import { makeVideoUrl } from './youtube-url.js';

function parseIsoDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? '0', 10);
  const minutes = parseInt(match[2] ?? '0', 10);
  const seconds = parseInt(match[3] ?? '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function normalizeResult(
  searchItem: NonNullable<YoutubeSearchResponse['items']>[number],
  details: NonNullable<YoutubeVideoResponse['items']>[number] | undefined
): YoutubeVideoResult {
  const { snippet, id } = searchItem;
  const videoId = id.videoId;
  return {
    videoId,
    url: makeVideoUrl(videoId),
    title: snippet.title,
    channelTitle: snippet.channelTitle,
    channelId: snippet.channelId,
    description: snippet.description,
    thumbnailUrl: snippet.thumbnails.medium?.url ?? snippet.thumbnails.default?.url,
    publishedAt: snippet.publishedAt,
    durationIso: details?.contentDetails?.duration,
    durationSeconds: details?.contentDetails?.duration
      ? parseIsoDuration(details.contentDetails.duration)
      : undefined,
    viewCount: details?.statistics?.viewCount ? Number(details.statistics.viewCount) : undefined,
    liveBroadcastContent: snippet.liveBroadcastContent,
  };
}

export class YoutubeApi {
  constructor(
    private net: NetAPI,
    private prefs: YoutubePreferences
  ) {}

  private get key(): string | null {
    const k = this.prefs.apiKey;
    return k?.trim() ? k.trim() : null;
  }

  private assertKey(): string {
    const key = this.key;
    if (!key) {
      const err: SearchError = { type: 'missing_key' };
      throw err;
    }
    return key;
  }

  async search(
    query: string,
    pageToken?: string
  ): Promise<{
    results: YoutubeVideoResult[];
    nextPageToken?: string;
    prevPageToken?: string;
  }> {
    const key = this.assertKey();

    let searchResponse: YoutubeSearchResponse;
    try {
      const res = await this.net.request<YoutubeSearchResponse>({
        method: 'get',
        url: 'https://www.googleapis.com/youtube/v3/search',
        query: {
          part: 'snippet',
          type: 'video',
          q: query,
          key,
          maxResults: String(this.prefs.maxResults),
          safeSearch: this.prefs.safeSearch,
          ...(this.prefs.regionCode ? { regionCode: this.prefs.regionCode } : {}),
          ...(this.prefs.relevanceLanguage
            ? { relevanceLanguage: this.prefs.relevanceLanguage }
            : {}),
          ...(pageToken ? { pageToken } : {}),
        },
      });
      searchResponse = res.data;
    } catch (err: unknown) {
      throw this.normalizeError(err);
    }

    if (!searchResponse.items?.length) {
      return { results: [] };
    }

    const videoIds = searchResponse.items.map((item) => item.id.videoId).filter(Boolean);

    const detailsMap = new Map<string, NonNullable<YoutubeVideoResponse['items']>[number]>();
    if (videoIds.length > 0) {
      try {
        const detailsRes = await this.net.request<YoutubeVideoResponse>({
          method: 'get',
          url: 'https://www.googleapis.com/youtube/v3/videos',
          query: {
            part: 'contentDetails,statistics',
            id: videoIds.join(','),
            key,
          },
        });
        if (detailsRes.data.items) {
          for (const item of detailsRes.data.items) {
            detailsMap.set(item.id, item);
          }
        }
      } catch {
        // details are optional; proceed without them
      }
    }

    const results = searchResponse.items.map((item) =>
      normalizeResult(item, detailsMap.get(item.id.videoId))
    );

    return {
      results,
      nextPageToken: searchResponse.nextPageToken,
      prevPageToken: searchResponse.prevPageToken,
    };
  }

  private normalizeError(err: unknown): SearchError {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'permission_denied'
    ) {
      return { type: 'invalid_key' };
    }

    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'network_error'
    ) {
      return { type: 'network', message: (err as Error).message };
    }

    if (
      err &&
      typeof err === 'object' &&
      'status' in err &&
      typeof (err as { status: unknown }).status === 'number'
    ) {
      const status = (err as { status: number }).status;

      if (status === 403) return { type: 'quota_exceeded' };
      if (status === 400) return { type: 'invalid_key' };

      return {
        type: 'api',
        message: `HTTP ${status}: ${(err as { statusText?: string }).statusText ?? 'Unknown error'}`,
      };
    }

    if (err && typeof err === 'object' && 'message' in err) {
      const msg = (err as Error).message;
      if (msg?.includes('Failed to fetch') || msg?.includes('NetworkError')) {
        return { type: 'network', message: msg };
      }
      return { type: 'api', message: msg };
    }

    return { type: 'api', message: 'Unknown error' };
  }
}
