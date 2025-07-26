// src/content/export.ts

import { SELECTORS } from './state';

// --- Export Feature ---

let isExporting = false;
let exportButton: HTMLButtonElement | null;
let stopButton: HTMLButtonElement | null;

export function initExportFeature(): void {
    const validUrlPatterns = [
      /https:\/\/javdb\.com\/users\/want_watch_videos.*/,
      /https:\/\/javdb\.com\/users\/watched_videos.*/,
      /https:\/\/javdb\.com\/users\/list_detail.*/,
      /https:\/\/javdb\.com\/lists.*/
    ];

    if (validUrlPatterns.some(pattern => pattern.test(window.location.href))) {
        createExportUI();
    }
}

function createExportUI(): void {
    const maxPageInput = document.createElement('input');
    maxPageInput.type = 'number';
    maxPageInput.id = 'maxPageInput';
    maxPageInput.placeholder = '页数(空则全部)';
    maxPageInput.className = 'input is-small';
    maxPageInput.style.width = '120px';
    maxPageInput.style.marginRight = '8px';

    exportButton = document.createElement('button');
    exportButton.textContent = '导出页面数据';
    exportButton.className = 'button is-small is-primary';
    exportButton.addEventListener('click', startExport);

    stopButton = document.createElement('button');
    stopButton.textContent = '停止';
    stopButton.className = 'button is-small is-danger';
    stopButton.style.marginLeft = '8px';
    stopButton.disabled = true;
    stopButton.addEventListener('click', stopExport);

    const container = document.createElement('div');
    container.className = 'level-item';
    container.appendChild(maxPageInput);
    container.appendChild(exportButton);
    container.appendChild(stopButton);
    
    const target = document.querySelector<HTMLElement>(SELECTORS.EXPORT_TOOLBAR);
    if (target) {
        target.appendChild(container);
    }
}

async function startExport(): Promise<void> {
    const maxPageInput = document.getElementById('maxPageInput') as HTMLInputElement | null;
    const totalCount = getTotalVideoCount();
    const maxPages = Math.ceil(totalCount / 20);
    const pagesToExport = maxPageInput?.value ? parseInt(maxPageInput.value) : maxPages;
    const currentPage = new URLSearchParams(window.location.search).get('page') || '1';
    
    isExporting = true;
    if (exportButton) exportButton.disabled = true;
    if (stopButton) stopButton.disabled = false;
    
    let allVideos: {id: string, title: string}[] = [];
    
    for (let i = 0; i < pagesToExport; i++) {
        if (!isExporting) break;
        
        const pageNum = parseInt(currentPage) + i;
        if (pageNum > maxPages) break;
        
        if (exportButton) exportButton.textContent = `导出中... ${pageNum}/${maxPages}`;
        
        if (i > 0) {
            const url = new URL(window.location.href);
            url.searchParams.set('page', String(pageNum));
            window.location.href = url.href;
            await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
        }
        
        allVideos = allVideos.concat(scrapeVideosFromPage());
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (allVideos.length > 0) {
        downloadExportedData(allVideos);
    }
    
    finishExport();
}

function scrapeVideosFromPage(): {id: string, title: string}[] {
    return Array.from(document.querySelectorAll<HTMLElement>(SELECTORS.MOVIE_LIST_ITEM)).map(item => {
        const idElement = item.querySelector<HTMLElement>(SELECTORS.VIDEO_ID);
        const titleElement = item.querySelector<HTMLElement>(SELECTORS.VIDEO_TITLE);
        return {
            id: idElement?.textContent?.trim() || '',
            title: titleElement?.textContent?.trim() || ''
        };
    });
}

function downloadExportedData(data: any[]): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `javdb-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function getTotalVideoCount(): number {
    const activeLink = document.querySelector<HTMLAnchorElement>('a.is-active');
    if (activeLink) {
        const match = activeLink.textContent?.match(/\((\d+)\)/);
        return match ? parseInt(match[1], 10) : 0;
    }
    return 0;
}

function stopExport(): void {
    isExporting = false;
    finishExport();
}

function finishExport(): void {
    isExporting = false;
    if (exportButton) {
        exportButton.disabled = false;
        exportButton.textContent = '导出页面数据';
    }
    if (stopButton) {
        stopButton.disabled = true;
    }
}
