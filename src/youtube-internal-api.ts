import type { NetAPI } from '@lumen-media/module-sdk';
import type { SearchError, YoutubeVideoResult } from './youtube-types.js';
import { makeVideoUrl } from './youtube-url.js';

interface YtThumbnail {
  url: string;
  width: number;
  height: number;
}

interface YtRun {
  text: string;
  navigationEndpoint?: {
    browseEndpoint?: { browseId: string; canonicalBaseUrl?: string };
  };
}

interface YtVideoRenderer {
  videoId: string;
  thumbnail: { thumbnails: YtThumbnail[] };
  title: { runs?: YtRun[]; simpleText?: string };
  longBylineText?: { runs: YtRun[] };
  ownerText?: { runs: YtRun[] };
  lengthText?: { simpleText?: string };
  viewCountText?: { simpleText?: string; runs?: YtRun[] };
  publishedTimeText?: { simpleText?: string };
  detailedMetadataSnippets?: Array<{ snippetText?: { runs: YtRun[] } }>;
}

const RE_YTDATA = /(?:var\s+)?ytInitialData\s*=\s*(\{.+?\});\s*<\/script>/s;
const RE_CFG = /ytcfg\.set\s*\(\s*(\{.+?\})\s*\)/s;

function parseDurationSeconds(text: string): number {
  const parts = text.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function parseViewCount(text: string): number {
  if (!text) return 0;
  const cleaned = text.replace(/[^0-9]/g, '');
  return parseInt(cleaned, 10) || 0;
}

export class YoutubeInternalApi {
  constructor(
    private net: NetAPI,
    private regionCode: string,
    private language: string,
  ) {}

  async search(
    query: string,
    pageToken?: string,
  ): Promise<{ results: YoutubeVideoResult[]; nextPageToken?: string }> {
    try {
      const url = pageToken
        ? `https://www.youtube.com${pageToken}`
        : `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=${this.language || 'en'}&gl=${this.regionCode || 'US'}`;

      const res = await this.net.request<string>({
        method: 'GET',
        url,
        responseType: 'text',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept-Language': `${this.language || 'en'}-${this.regionCode || 'US'},en;q=0.9`,
        },
      });

      if (!res.ok) {
        throw new Error(`YouTube returned status ${res.status}`);
      }

      const html = res.data;
      if (typeof html !== 'string') {
        throw new Error('Unexpected response type from YouTube');
      }

      const match = html.match(RE_YTDATA);
      if (!match) {
        throw new Error('Could not find ytInitialData in YouTube page');
      }

      let data: Record<string, unknown>;
      try {
        data = JSON.parse(match[1]);
      } catch {
        throw new Error('Failed to parse ytInitialData JSON');
      }

      const results = this.extractVideos(data);
      const nextPageToken = this.extractContinuation(data, html) || undefined;

      return { results, nextPageToken };
    } catch (err) {
      if (err && typeof err === 'object' && 'type' in err) {
        throw err;
      }
      const networkErr: SearchError = {
        type: 'network',
        message: err instanceof Error ? err.message : 'YouTube search failed',
      };
      throw networkErr;
    }
  }

  private extractVideos(data: Record<string, unknown>): YoutubeVideoResult[] {
    const results: YoutubeVideoResult[] = [];

    const contents = data?.contents as Record<string, unknown> | undefined;
    const twoCol = contents?.twoColumnSearchResultsRenderer as Record<string, unknown> | undefined;
    const primary = twoCol?.primaryContents as Record<string, unknown> | undefined;
    const sectionList = primary?.sectionListRenderer as Record<string, unknown> | undefined;
    const sections = sectionList?.contents as Array<Record<string, unknown>> | undefined;

    if (!sections) return results;

    for (const section of sections) {
      const itemSection = section?.itemSectionRenderer as Record<string, unknown> | undefined;
      const items = itemSection?.contents as Array<Record<string, unknown>> | undefined;
      if (!items) continue;

      for (const item of items) {
        const vr = item?.videoRenderer as YtVideoRenderer | undefined;
        if (!vr?.videoId) continue;

        const thumbnails = vr.thumbnail?.thumbnails;
        const thumbnailUrl =
          thumbnails?.[thumbnails.length - 1]?.url ??
          `https://i.ytimg.com/vi/${vr.videoId}/mqdefault.jpg`;

        const title =
          vr.title?.runs?.[0]?.text ?? vr.title?.simpleText ?? '';

        const channelTitle =
          vr.longBylineText?.runs?.[0]?.text ??
          vr.ownerText?.runs?.[0]?.text ??
          '';

        const channelId =
          vr.longBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
          vr.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
          undefined;

        const viewCount = vr.viewCountText?.simpleText
          ? parseViewCount(vr.viewCountText.simpleText)
          : vr.viewCountText?.runs?.[0]?.text
            ? parseViewCount(vr.viewCountText.runs[0].text)
            : undefined;

        const duration = vr.lengthText?.simpleText
          ? parseDurationSeconds(vr.lengthText.simpleText)
          : undefined;

        const desc =
          vr.detailedMetadataSnippets?.[0]?.snippetText?.runs
            ?.map((r) => r.text)
            .join('') || undefined;

        results.push({
          videoId: vr.videoId,
          url: makeVideoUrl(vr.videoId),
          title,
          channelTitle,
          channelId,
          thumbnailUrl,
          publishedAt: undefined,
          durationSeconds: duration,
          viewCount: viewCount || undefined,
          description: desc,
          liveBroadcastContent: 'none',
        });
      }
    }

    return results;
  }

  private extractContinuation(data: Record<string, unknown>, html: string): string | null {
    const contents = data?.contents as Record<string, unknown> | undefined;
    const twoCol = contents?.twoColumnSearchResultsRenderer as Record<string, unknown> | undefined;
    const primary = twoCol?.primaryContents as Record<string, unknown> | undefined;
    const sectionList = primary?.sectionListRenderer as Record<string, unknown> | undefined;
    const sections = sectionList?.contents as Array<Record<string, unknown>> | undefined;

    if (!sections) return null;

    for (const section of sections) {
      const itemSection = section?.itemSectionRenderer as Record<string, unknown> | undefined;
      const items = itemSection?.contents as Array<Record<string, unknown>> | undefined;
      if (!items) continue;

      for (const item of items) {
        const cont = item?.continuationItemRenderer as Record<string, unknown> | undefined;
        if (cont?.continuationEndpoint) {
          const endpoint = cont.continuationEndpoint as Record<string, unknown>;
          const contCmd = endpoint?.continuationCommand as Record<string, unknown> | undefined;
          const token = contCmd?.token as string | undefined;
          if (token) {
            return `/youtubei/v1/search?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`;
          }
        }
      }
    }

    return null;
  }
}
