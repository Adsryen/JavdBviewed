import { injectXunleiSubtitleStyles } from '../../subtitles';

export function injectDetailSearchStyles(): void {
  if (!document.getElementById('jdb-external-search-styles')) {
    const style = document.createElement('style');
    style.id = 'jdb-external-search-styles';
    style.textContent = `
      .jdb-external-search-panel {
        align-items: center;
        gap: 0;
      }

      .jdb-external-search-links {
        display: inline-flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.35rem;
        min-width: 0;
      }

      .jdb-external-search-link {
        display: inline-flex !important;
        align-items: center;
        gap: 0.25rem;
        text-decoration: none !important;
        margin: 0 !important;
        max-width: 9rem;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .jdb-external-search-icon {
        width: 0.875rem;
        height: 0.875rem;
        object-fit: contain;
        flex: 0 0 auto;
      }
    `;
    document.head.appendChild(style);
  }

  injectXunleiSubtitleStyles();
}
