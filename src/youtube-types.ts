export interface YoutubeVideoResult {
  videoId: string;
  url: string;
  title: string;
  channelTitle: string;
  channelId?: string;
  description?: string;
  thumbnailUrl?: string;
  publishedAt?: string;
  durationIso?: string;
  durationSeconds?: number;
  viewCount?: number;
  liveBroadcastContent?: 'none' | 'live' | 'upcoming';
}

export interface YoutubeSearchItemSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    default?: YoutubeThumbnail;
    medium?: YoutubeThumbnail;
    high?: YoutubeThumbnail;
  };
  channelTitle: string;
  liveBroadcastContent: 'none' | 'live' | 'upcoming';
}

export interface YoutubeThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YoutubeSearchItem {
  kind: string;
  id: {
    kind: string;
    videoId: string;
  };
  snippet: YoutubeSearchItemSnippet;
}

export interface YoutubeSearchResponse {
  kind: string;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YoutubeSearchItem[];
}

export interface YoutubeVideoItem {
  kind: string;
  id: string;
  snippet: YoutubeSearchItemSnippet;
  contentDetails?: {
    duration: string;
    caption: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
  status?: {
    embeddable: boolean;
  };
}

export interface YoutubeVideoResponse {
  kind: string;
  items: YoutubeVideoItem[];
}

export type SearchError =
  | { type: 'missing_key' }
  | { type: 'invalid_key' }
  | { type: 'quota_exceeded' }
  | { type: 'network'; message: string }
  | { type: 'api'; message: string };

export interface YoutubePreferences {
  apiKey: string;
  apiKeyBackup: string;
  regionCode: string;
  relevanceLanguage: string;
  safeSearch: 'none' | 'moderate' | 'strict';
  defaultAction: 'addToQueue' | 'playNow';
  maxResults: 5 | 10 | 25 | 50;
  searchSource: 'auto' | 'google' | 'piped';
}
