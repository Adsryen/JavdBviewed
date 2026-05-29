export interface SubtitleSearchLink {
  name: string;
  url: string;
}

export interface XunleiSubtitleItem {
  name: string;
  ext?: string;
  url?: string;
  language?: string;
  rate?: number | string;
  duration?: number | string;
  sourceLabel?: string;
  hash?: string;
}

export interface XunleiSubtitleResponse {
  data?: unknown;
  subtitles?: unknown;
}
