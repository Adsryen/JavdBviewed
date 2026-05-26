export type {
  RevealSettingsSearchTargetOptions,
  SettingsSearchItem,
  SettingsSearchPageSource,
  SettingsSearchResult,
  SettingsSearchTarget,
} from './domain/types';
export { SETTINGS_SEARCH_ALIASES, expandSettingsSearchQuery, normalizeSettingsSearchText } from './domain/aliases';
export { buildSettingsSearchIndex } from './application/buildSettingsSearchIndex';
export { findSettingsResults } from './application/findSettingsResults';
export { resolveSettingsTarget } from './application/resolveSettingsTarget';
export { mountSettingsSearch } from './ui/settingsSearchBox';
export {
  readStoredSettingsSearchTarget,
  revealStoredSettingsSearchTarget,
  storeSettingsSearchTarget,
} from './ui/settingsSearchHighlight';
