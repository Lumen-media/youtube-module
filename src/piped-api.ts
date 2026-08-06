import type { NetAPI } from '@lumen-media/module-sdk';
import type { SearchError, YoutubeVideoResult } from './youtube-types.js';
import { makeVideoUrl } from './youtube-url.js';

const PIPED_INSTANCE = 'https://api.piped.private.coffee';

interface PipedVideoItem {
  url: string;
  type: string;
  title: string;
  thumbnail: string;
  uploaderName: string;
  uploaderUrl: string;
  uploadedDate?: string;
  shortDescription?: string;
  duration: number;
  views: number;
  isShort?: boolean;
}

interface PipedResponse {
  items: PipedVideoItem[];
  nextpage?: string;
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'application/json',
};

function extractVideoId(url: string): string {
  const match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? '';
}

function extractChannelId(url: string): string | undefined {
  const match = url.match(/\/channel\/([a-zA-Z0-9_-]+)/);
  return match?.[1];
}

export class PipedApi {
  constructor(
    private net: NetAPI,
  ) {}

  async search(
    query: string,
  ): Promise<{ results: YoutubeVideoResult[]; nextPageToken?: string }> {
    const res = await this.net.request<PipedResponse>({
      method: 'GET',
      url: `${PIPED_INSTANCE}/search`,
      query: { q: query, filter: 'videos' },
      headers: HEADERS,
    });

    if (!res.ok) {
      const networkErr: SearchError = {
        type: 'network',
        message: `Piped returned status ${res.status}`,
      };
      throw networkErr;
    }

    const data = res.data;
    if (!data?.items || !Array.isArray(data.items)) {
      const networkErr: SearchError = {
        type: 'network',
        message: 'Unexpected response from Piped',
      };
      throw networkErr;
    }

    const results: YoutubeVideoResult[] = data.items
      .filter((item) => item.type !== 'channel' && item.type !== 'playlist' && !item.isShort)
      .map((item) => {
        const videoId = extractVideoId(item.url);
        return {
          videoId,
          url: videoId ? makeVideoUrl(videoId) : item.url,
          title: item.title,
          channelTitle: item.uploaderName,
          channelId: extractChannelId(item.uploaderUrl),
          description: item.shortDescription || undefined,
          thumbnailUrl: item.thumbnail,
          publishedAt: item.uploadedDate || undefined,
          durationSeconds: item.duration > 0 ? item.duration : undefined,
          viewCount: item.views > 0 ? item.views : undefined,
          liveBroadcastContent: 'none' as const,
        };
      })
      .filter((item) => item.videoId);

    return { results, nextPageToken: data.nextpage || undefined };
  }
}
