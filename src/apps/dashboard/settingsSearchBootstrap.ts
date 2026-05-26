import { buildSettingsSearchIndex, mountSettingsSearch, revealStoredSettingsSearchTarget } from '../../features/settingsSearch';
import type { SettingsSearchPageSource } from '../../features/settingsSearch';
import { loadPartial } from '../../dashboard/loaders/partialsLoader';
import { TAB_PARTIALS } from '../../dashboard/tabs/resources';

let cachedIndexPromise: Promise<ReturnType<typeof buildSettingsSearchIndex>> | null = null;

export async function mountDashboardSettingsSearch(): Promise<void> {
  const container = document.querySelector<HTMLElement>('.settings-index');
  if (!container) return;

  const index = await getDashboardSettingsSearchIndex();
  mountSettingsSearch({ container, index });
}

export async function revealDashboardSettingsSearchTarget(): Promise<void> {
  await revealStoredSettingsSearchTarget();
}

function getDashboardSettingsSearchIndex(): Promise<ReturnType<typeof buildSettingsSearchIndex>> {
  if (!cachedIndexPromise) {
    cachedIndexPromise = buildDashboardSettingsSearchIndex();
  }
  return cachedIndexPromise;
}

async function buildDashboardSettingsSearchIndex(): Promise<ReturnType<typeof buildSettingsSearchIndex>> {
  const sources: SettingsSearchPageSource[] = [];
  const entries = Object.entries(TAB_PARTIALS)
    .filter(([key]) => key.startsWith('tab-settings-') && key !== 'tab-settings');

  for (const [key, cfg] of entries) {
    const html = await loadPartial(cfg.name);
    if (!html) continue;

    const subSection = key.replace(/^tab-settings-/, '') + '-settings';
    const pageId = normalizeSettingsPageId(subSection);
    const pageTitle = extractPageTitle(html) || pageId;

    sources.push({
      pageId,
      pageTitle,
      hash: `#tab-settings/${pageId}`,
      html,
      keywords: [pageTitle, pageId],
    });
  }

  return buildSettingsSearchIndex(sources);
}

function normalizeSettingsPageId(value: string): string {
  return value
    .replace('search-engine-settings', 'search-engine-settings')
    .replace('network-test-settings', 'network-test-settings')
    .replace('global-actions-settings', 'global-actions')
    .replace('log-settings', 'log-settings');
}

function extractPageTitle(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.querySelector('.settings-page-header h2, .settings-page-header h3')?.textContent || '')
    .replace(/\s+/g, ' ')
    .trim();
}
