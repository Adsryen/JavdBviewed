export interface SettingsSearchPageSource {
  pageId: string;
  pageTitle: string;
  hash: string;
  html: string;
  keywords?: string[];
}

export interface SettingsSearchItem {
  id: string;
  pageId: string;
  pageTitle: string;
  hash: string;
  title: string;
  description: string;
  sectionTitle: string;
  targetSelector: string;
  searchableText: string;
}

export interface SettingsSearchResult extends SettingsSearchItem {
  score: number;
}

export interface SettingsSearchTarget {
  hash: string;
  targetSelector: string;
  title: string;
}

export interface RevealSettingsSearchTargetOptions {
  waitMs?: number;
  highlightMs?: number;
}
