import type { NetAPI, NetMethod, NetResponse } from '@lumen-media/module-sdk';
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
  #keyOrder: string[];

  constructor(
    private net: NetAPI,
    private prefs: YoutubePreferences
  ) {
    this.#keyOrder = this.#buildKeyOrder();
  }

  #buildKeyOrder(): string[] {
    const keys: string[] = [];
    const primary = this.prefs.apiKey?.trim();
    if (primary) keys.push(primary);
    const backup = this.prefs.apiKeyBackup?.trim();
    if (backup) keys.push(backup);
    return keys;
  }

  private assertKeys(): string[] {
    if (this.#keyOrder.length === 0) {
      const err: SearchError = { type: 'missing_key' };
      throw err;
    }
    return this.#keyOrder;
  }

  private demoteKey(key: string) {
    const idx = this.#keyOrder.indexOf(key);
    if (idx !== -1) {
      this.#keyOrder.splice(idx, 1);
      this.#keyOrder.push(key);
    }
  }

  private isQuotaError(res: NetResponse<unknown>): boolean {
    if (res.status === 429 || res.status === 403) return true;
    const code = (res.data as { error?: { code?: number } })?.error?.code;
    return code === 429 || code === 403;
  }

  private async requestWithFallback<T>(
    makeRequest: (key: string) => Promise<NetResponse<T>>
  ): Promise<T> {
    const keys = this.assertKeys();
    let lastError: unknown;

    for (const key of keys) {
      try {
        const res = await makeRequest(key);
        if (this.isQuotaError(res)) {
          this.demoteKey(key);
          lastError = { status: res.status, data: res.data };
          continue;
        }
        return res.data;
      } catch (err: unknown) {
        const status =
          err && typeof err === 'object' && 'status' in err
            ? (err as { status: unknown }).status
            : undefined;
        if (status === 429 || status === 403) {
          this.demoteKey(key);
          lastError = err;
          continue;
        }
        throw err;
      }
    }

    throw lastError;
  }

  private async doSearch(query: string, pageToken: string | undefined, key: string) {
    return this.net.request<YoutubeSearchResponse>({
      method: 'get' as unknown as NetMethod,
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
  }

  private async doDetails(videoIds: string[], key: string) {
    return this.net.request<YoutubeVideoResponse>({
      method: 'get' as unknown as NetMethod,
      url: 'https://www.googleapis.com/youtube/v3/videos',
      query: {
        part: 'contentDetails,statistics',
        id: videoIds.join(','),
        key,
      },
    });
  }

  async search(
    query: string,
    pageToken?: string
  ): Promise<{
    results: YoutubeVideoResult[];
    nextPageToken?: string;
    prevPageToken?: string;
  }> {
    const searchResponse = await this.requestWithFallback((key) =>
      this.doSearch(query, pageToken, key)
    );

    if (!searchResponse.items?.length) {
      return { results: [] };
    }

    const videoIds = searchResponse.items.map((item) => item.id.videoId).filter(Boolean);

    const detailsMap = new Map<string, NonNullable<YoutubeVideoResponse['items']>[number]>();
    if (videoIds.length > 0) {
      try {
        const detailsResponse = await this.requestWithFallback((key) =>
          this.doDetails(videoIds, key)
        );
        if (detailsResponse.items) {
          for (const item of detailsResponse.items) {
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
}
