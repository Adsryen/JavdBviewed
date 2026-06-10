import type { SettingsSearchItem, SettingsSearchPageSource } from '../domain/types';
import { normalizeSettingsSearchText } from '../domain/aliases';
import { createSettingsSearchExtraItems } from './settingsSearchExtraItems';

const CONTROL_SELECTOR = [
  'input[id]',
  'select[id]',
  'textarea[id]',
  'button[id]',
  '[data-settings-search-target][id]',
  '.enhancement-toggle[data-target]',
].join(',');

const WRAPPER_SELECTOR = [
  '.form-group',
  '.form-group-checkbox',
  '.setting-item',
  '.param-item',
  '.settings-group',
  '.privacy-card',
  '.webdav-section',
  '.logging-section',
  '.settings-card',
  '.settings-section',
].join(',');

const SECTION_SELECTOR = [
  '.settings-section',
  '.settings-card',
  '.settings-subsection',
  '.settings-group',
  '.privacy-card',
  '.webdav-section',
  '.logging-section',
].join(',');

export function buildSettingsSearchIndex(sources: SettingsSearchPageSource[]): SettingsSearchItem[] {
  const items: SettingsSearchItem[] = [];
  const seen = new Set<string>();

  for (const source of sources) {
    const document = new DOMParser().parseFromString(source.html, 'text/html');
    const pageRoot = document.getElementById(source.pageId) || document.body;
    addPageItem(items, seen, source, pageRoot);
    addSectionItems(items, seen, source, pageRoot);

    const controls = Array.from(pageRoot.querySelectorAll<HTMLElement>(CONTROL_SELECTOR));

    for (const control of controls) {
      if (isHiddenStateSource(control)) continue;

      const id = getControlSearchId(control);
      if (!id) continue;

      const wrapper = control.closest(WRAPPER_SELECTOR) as HTMLElement | null;
      const title = extractControlTitle(document, control, wrapper, id);
      if (!title) continue;

      const sectionTitle = extractSectionTitle(control, wrapper, pageRoot, title);
      const description = extractDescription(wrapper);
      const targetSelector = getControlTargetSelector(control, id);
      const keywords = cleanText(control.getAttribute('data-settings-search-keywords') || '');
      const itemKey = `${source.pageId}:${targetSelector}`;
      if (seen.has(itemKey)) continue;
      seen.add(itemKey);

      const searchableText = [
        title,
        description,
        sectionTitle,
        keywords,
        source.pageTitle,
        source.pageId,
        id,
        ...(source.keywords || []),
      ].join(' ');

      items.push({
        id: itemKey,
        pageId: source.pageId,
        pageTitle: source.pageTitle,
        hash: source.hash,
        title,
        description,
        sectionTitle,
        targetSelector,
        searchableText,
      });
    }

    addExtraItems(items, seen, source);
  }

  return items;
}

function addExtraItems(
  items: SettingsSearchItem[],
  seen: Set<string>,
  source: SettingsSearchPageSource,
): void {
  for (const item of createSettingsSearchExtraItems(source)) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    items.push(item);
  }
}

function addPageItem(
  items: SettingsSearchItem[],
  seen: Set<string>,
  source: SettingsSearchPageSource,
  pageRoot: HTMLElement,
): void {
  const title = cleanText(source.pageTitle || pageRoot.querySelector('.settings-page-header h2, .settings-page-header h3, h2, h3')?.textContent || '');
  if (!title) return;

  const targetSelector = `#${cssEscape(source.pageId)}`;
  const itemKey = `${source.pageId}:${targetSelector}:page`;
  if (seen.has(itemKey)) return;
  seen.add(itemKey);

  const description = cleanText(pageRoot.querySelector('.settings-page-header .settings-description, .settings-description')?.textContent || '');
  items.push({
    id: itemKey,
    pageId: source.pageId,
    pageTitle: source.pageTitle,
    hash: source.hash,
    title,
    description,
    sectionTitle: title,
    targetSelector,
    searchableText: [
      title,
      description,
      source.pageTitle,
      source.pageId,
      ...(source.keywords || []),
    ].join(' '),
  });
}

function addSectionItems(
  items: SettingsSearchItem[],
  seen: Set<string>,
  source: SettingsSearchPageSource,
  pageRoot: HTMLElement,
): void {
  const sections = Array.from(pageRoot.querySelectorAll<HTMLElement>(SECTION_SELECTOR));
  for (const section of sections) {
    if (section.closest(SECTION_SELECTOR) !== section) {
      const closest = section.parentElement?.closest(SECTION_SELECTOR);
      if (closest && closest.contains(section)) continue;
    }

    const title = extractHeadingText(section);
    if (!title) continue;

    const targetSelector = section.id ? `#${cssEscape(section.id)}` : `#${cssEscape(source.pageId)}`;
    const itemKey = `${source.pageId}:${targetSelector}:section:${title}`;
    if (seen.has(itemKey)) continue;
    seen.add(itemKey);

    const description = extractSectionDescription(section);
    items.push({
      id: itemKey,
      pageId: source.pageId,
      pageTitle: source.pageTitle,
      hash: source.hash,
      title,
      description,
      sectionTitle: title,
      targetSelector,
      searchableText: [
        title,
        description,
        source.pageTitle,
        source.pageId,
        ...(source.keywords || []),
      ].join(' '),
    });
  }
}

function extractControlTitle(document: Document, control: HTMLElement, wrapper: HTMLElement | null, controlId: string): string {
  const featureName = extractDirectFeatureName(wrapper);
  if (control.matches('.enhancement-toggle[data-target]') && featureName) return featureName;

  const labelFromFor = document.querySelector<HTMLLabelElement>(`label[for="${cssEscape(controlId)}"]`);
  const label = labelFromFor || control.closest('label');
  const explicit = label ? extractLabelTitle(label, control) : '';
  if (explicit) return explicit;

  if (featureName) return featureName;

  const aria = cleanDisplayText(control.getAttribute('aria-label') || control.getAttribute('title') || '');
  if (aria) return aria;

  if (control.tagName === 'BUTTON' || control.hasAttribute('data-settings-search-target')) {
    const controlText = cleanDisplayText(control.textContent || '');
    if (controlText) return controlText;
  }

  return extractHeadingText(wrapper);
}

function extractSectionTitle(
  control: HTMLElement,
  wrapper: HTMLElement | null,
  pageRoot: HTMLElement,
  ownTitle: string,
): string {
  const parentFeature = extractNearestParentFeatureTitle(wrapper || control, pageRoot, ownTitle);
  if (parentFeature) return parentFeature;

  const section = control.closest(SECTION_SELECTOR) as HTMLElement | null;
  const text = extractHeadingText(section);
  if (text && normalizeSettingsSearchText(text) !== normalizeSettingsSearchText(ownTitle)) return text;

  const pageHeading = pageRoot.querySelector('h2, h3');
  return cleanText(pageHeading?.textContent || '');
}

function extractDescription(wrapper: HTMLElement | null): string {
  if (!wrapper) return '';
  const descriptions = Array.from(wrapper.querySelectorAll<HTMLElement>('.input-description, .setting-description, .section-description, .settings-description, .setting-desc, .sub-description'));
  return cleanText(descriptions.map(node => node.textContent || '').join(' '));
}

function extractSectionDescription(section: HTMLElement): string {
  const descriptions = Array.from(section.children)
    .filter((child): child is HTMLElement => child.nodeType === 1)
    .filter(child => child.matches('.input-description, .setting-description, .section-description, .settings-description, .setting-desc, .sub-description, p'))
    .map(child => child.textContent || '');
  return cleanText(descriptions.join(' '));
}

function extractLabelTitle(label: HTMLLabelElement, control: HTMLElement): string {
  const titledChild = label.querySelector<HTMLElement>(':scope > .setting-title, :scope .setting-title, :scope .enhancement-feature-name');
  const titledText = cleanDisplayText(titledChild?.textContent || '');
  if (titledText) return titledText;

  const directText = Array.from(label.childNodes)
    .filter(node => node.nodeType === 3)
    .map(node => node.textContent || '')
    .join(' ');
  const directTitle = cleanDisplayText(directText);
  if (directTitle) return directTitle;

  const clone = label.cloneNode(true) as HTMLLabelElement;
  const controlClone = control.id
    ? clone.querySelector<HTMLElement>(`#${cssEscape(control.id)}`)
    : null;
  controlClone?.remove();
  clone.querySelectorAll('option').forEach(option => option.remove());
  return cleanDisplayText(clone.textContent || '');
}

function extractHeadingText(container: HTMLElement | null | undefined): string {
  if (!container) return '';
  const heading = container.querySelector<HTMLElement>(
    ':scope > h4, :scope > h5, :scope > h6, :scope > .section-header, :scope > .webdav-section-header, :scope > .setting-title, :scope > .config-title, :scope > .advanced-tool-header h4, :scope > .advanced-tool-header h5, :scope > .sub-settings-header h5, :scope > label .enhancement-feature-name',
  );
  return cleanDisplayText(heading?.textContent || '');
}

function extractDirectFeatureName(container: HTMLElement | null | undefined): string {
  if (!container) return '';
  const heading = container.querySelector<HTMLElement>(':scope > label .enhancement-feature-name');
  return cleanDisplayText(heading?.textContent || '');
}

function extractNearestParentFeatureTitle(
  element: HTMLElement,
  pageRoot: HTMLElement,
  ownTitle: string,
): string {
  let current = element.parentElement;
  const ownTitleNorm = normalizeSettingsSearchText(ownTitle);

  while (current && current !== pageRoot.parentElement) {
    if (current.matches('.form-group')) {
      const title = extractDirectFeatureName(current);
      if (title && normalizeSettingsSearchText(title) !== ownTitleNorm) {
        return title;
      }
    }
    if (current === pageRoot) break;
    current = current.parentElement;
  }

  return '';
}

function getControlSearchId(control: HTMLElement): string {
  return control.id?.trim() || control.getAttribute('data-target')?.trim() || '';
}

function getControlTargetSelector(control: HTMLElement, id: string): string {
  const dataTarget = control.getAttribute('data-target')?.trim();
  if (control.matches('.enhancement-toggle[data-target]') && dataTarget) {
    return `[data-target="${cssStringEscape(dataTarget)}"]`;
  }
  return `#${cssEscape(id)}`;
}

function isHiddenStateSource(control: HTMLElement): boolean {
  if (control.tagName !== 'INPUT' || (control as HTMLInputElement).type !== 'checkbox') return false;
  if (control.hidden) return true;

  const hiddenAncestor = control.closest<HTMLElement>('[style*="display: none"], [style*="display:none"]');
  if (!hiddenAncestor) return false;

  return !hiddenAncestor.matches('.sub-settings, .translation-provider-config, .form-group, .settings-card');
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function cleanDisplayText(value: string): string {
  return cleanText(value)
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/\b(可用|可选|实验性|推荐|已启用|已禁用)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cssEscape(value: string): string {
  const escaper = (globalThis as any).CSS?.escape;
  return typeof escaper === 'function'
    ? escaper(value)
    : value.replace(/[^a-zA-Z0-9_-]/g, char => `\\${char}`);
}

function cssStringEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function isSettingsSearchMatchText(value: string, query: string): boolean {
  return normalizeSettingsSearchText(value).includes(normalizeSettingsSearchText(query));
}
