export type OnlineAvailabilitySitePreferenceMap = Record<string, boolean>;

export type OnlineAvailabilitySiteOption = {
  key: string;
  name: string;
  enabled: boolean;
};

export const ONLINE_AVAILABILITY_SITE_OPTIONS: OnlineAvailabilitySiteOption[] = [
  { key: 'fanza', name: 'FANZA 動画', enabled: true },
  { key: 'jable', name: 'Jable', enabled: true },
  { key: 'missav', name: 'MISSAV', enabled: true },
  { key: '123av', name: '123AV', enabled: true },
  { key: 'supjav', name: 'Supjav', enabled: true },
  { key: 'netflav', name: 'NETFLAV', enabled: true },
  { key: 'avgle', name: 'Avgle', enabled: true },
  { key: 'javhhh', name: 'JAVHHH', enabled: true },
  { key: 'javguru', name: 'Jav.Guru', enabled: true },
  { key: 'javbus', name: 'JavBus', enabled: true },
];

export function renderOnlineAvailabilitySiteOptions(container: HTMLElement | null | undefined): void {
  if (!container || container.dataset.rendered === '1') return;

  container.innerHTML = ONLINE_AVAILABILITY_SITE_OPTIONS.map(site => `
    <label class="online-availability-site-item">
      <span class="online-availability-site-name">${site.name}</span>
      <span class="ui-toggle ui-toggle--sm">
        <input class="ui-toggle__input online-availability-site-input" type="checkbox" data-site-key="${site.key}" aria-label="${site.name}" ${site.enabled ? 'checked' : ''}>
        <span class="ui-toggle__slider"></span>
      </span>
    </label>
  `).join('');

  container.dataset.rendered = '1';
}

export function collectOnlineAvailabilitySiteStates(
  inputs: ArrayLike<HTMLInputElement> | null | undefined,
): OnlineAvailabilitySitePreferenceMap | undefined {
  if (!inputs || inputs.length === 0) return undefined;

  const states: OnlineAvailabilitySitePreferenceMap = {};
  Array.from(inputs).forEach(input => {
    const siteKey = input.dataset.siteKey?.trim();
    if (!siteKey) return;
    states[siteKey] = input.checked;
  });

  return Object.keys(states).length > 0 ? states : undefined;
}

export function applyOnlineAvailabilitySiteStates(
  inputs: ArrayLike<HTMLInputElement> | null | undefined,
  preferences: unknown,
): void {
  if (!inputs || inputs.length === 0) return;
  const sitePreferences = preferences && typeof preferences === 'object'
    ? preferences as Record<string, unknown>
    : {};

  Array.from(inputs).forEach(input => {
    const siteKey = input.dataset.siteKey?.trim();
    if (!siteKey) return;
    const fallback = ONLINE_AVAILABILITY_SITE_OPTIONS.find(site => site.key === siteKey)?.enabled ?? true;
    input.checked = typeof sitePreferences[siteKey] === 'boolean'
      ? sitePreferences[siteKey] as boolean
      : fallback;
  });
}
