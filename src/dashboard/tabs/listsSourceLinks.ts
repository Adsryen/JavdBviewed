import type { ListRecord } from '../../types';

const DEFAULT_JAVDB_ORIGIN = 'https://javdb.com';

function escapeHtmlAttr(value: string): string {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeSourceOrigin(record: ListRecord): string {
    if (record.url) {
        try {
            return new URL(record.url).origin;
        } catch {}
    }
    return DEFAULT_JAVDB_ORIGIN;
}

function stripCollectionPrefix(type: ListRecord['type'], rawId: string): string {
    const value = String(rawId || '').trim();
    if (type === 'series' && value.startsWith('series:')) return value.slice('series:'.length);
    if (type === 'label' && value.startsWith('label:')) return value.slice('label:'.length).toUpperCase();
    return type === 'label' ? value.toUpperCase() : value;
}

export function getListCollectionExternalId(record: ListRecord): string {
    const externalId = String(record.externalId || '').trim();
    if (externalId) return record.type === 'label' ? externalId.toUpperCase() : externalId;
    return stripCollectionPrefix(record.type, String(record.id || ''));
}

export function buildListSourceUrl(record: ListRecord): string {
    if (record.source !== 'javdb') return '';
    if (record.url) return record.url;

    const origin = normalizeSourceOrigin(record);
    if (record.type === 'series') {
        const externalId = getListCollectionExternalId(record);
        return externalId ? `${origin}/series/${encodeURIComponent(externalId)}` : '';
    }
    if (record.type === 'label') {
        const externalId = getListCollectionExternalId(record);
        return externalId ? `${origin}/video_codes/${encodeURIComponent(externalId)}` : '';
    }
    if (record.type === 'mine' || record.type === 'favorite') {
        const id = String(record.id || '').trim();
        return id ? `${origin}/lists/${encodeURIComponent(id)}` : '';
    }
    return '';
}

export function renderListSourceLinkButton(record: ListRecord): string {
    const sourceUrl = buildListSourceUrl(record);
    if (!sourceUrl) return '';

    return `
        <button class="list-source-link-btn" type="button" data-source-url="${escapeHtmlAttr(sourceUrl)}" title="打开 JavDB 源站页面" aria-label="打开 JavDB 源站页面">
            <i class="fas fa-external-link-alt"></i>
        </button>
    `;
}
