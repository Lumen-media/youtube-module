import type { NetAPI } from '@lumen-media/module-sdk';
import type { SearchError, YoutubeVideoResult } from './youtube-types.js';
import { makeVideoUrl } from './youtube-url.js';

const DEFAULT_INSTANCES: string[] = [
  'https://yt.chocolatemoo53.com',
  'https://invidious.snopyta.org',
  'https://yewtu.be',
  'https://inv.nadeko.net',
  'https://vid.puffyan.us',
];

interface InvidiousVideoItem {
  type: string;
  title: string;
  videoId: string;
  author: string;
  authorId?: string;
  description?: string;
  viewCount?: number;
  published?: number;
  lengthSeconds?: number;
  liveNow?: boolean;
  isUpcoming?: boolean;
}

export class InvidiousApi {
  constructor(
    private net: NetAPI,
    private regionCode: string,
    private language: string
  ) {}

  async search(
    query: string,
    page?: string
  ): Promise<{ results: YoutubeVideoResult[]; nextPageToken?: string }> {
    const errors: string[] = [];

    for (const baseUrl of DEFAULT_INSTANCES) {
      try {
        return await this.tryInstance(baseUrl, query, page);
      } catch (err) {
        errors.push(`${baseUrl}: ${err instanceof Error ? err.message : 'unknown error'}`);
      }
    }

    const networkErr: SearchError = {
      type: 'network',
      message: `All Invidious instances failed: ${errors.join('; ')}`,
    };
    throw networkErr;
  }

  private async tryInstance(
    baseUrl: string,
    query: string,
    page?: string
  ): Promise<{ results: YoutubeVideoResult[]; nextPageToken?: string }> {
    const params: Record<string, string> = {
      q: query,
      type: 'video',
      sort: 'relevance',
    };
    if (page) params.page = page;
    if (this.language) params.hl = this.language;
    if (this.regionCode) params.region = this.regionCode;

    const res = await this.net.request<InvidiousVideoItem[]>({
      method: 'get' as unknown as never,
      url: `${baseUrl}/api/v1/search`,
      query: params,
    });

    if (!res.ok) {
      throw new Error(`Invidious returned status ${res.status}`);
    }

    if (!Array.isArray(res.data)) {
      return { results: [] };
    }

    const nextPage = page ? String(Number(page) + 1) : '2';

    const results: YoutubeVideoResult[] = res.data
      .filter((item) => item?.type === 'video')
      .map((item) => ({
        videoId: item.videoId,
        url: makeVideoUrl(item.videoId),
        title: item.title,
        channelTitle: item.author,
        channelId: item.authorId || undefined,
        description: item.description || undefined,
        thumbnailUrl: `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`,
        publishedAt: item.published ? new Date(item.published * 1000).toISOString() : undefined,
        durationSeconds: item.lengthSeconds || undefined,
        viewCount: item.viewCount ?? undefined,
        liveBroadcastContent: item.liveNow ? 'live' : item.isUpcoming ? 'upcoming' : 'none',
      }));

    return {
      results,
      nextPageToken: results.length > 0 ? nextPage : undefined,
    };
  }
}
