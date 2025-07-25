import { STATE } from '../state';
import { VIDEO_STATUS } from '../../utils/config';
import type { VideoRecord, VideoStatus } from '../../types';

export function initRecordsTab(): void {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const filterSelect = document.getElementById('filterSelect') as HTMLSelectElement;
    const videoList = document.getElementById('videoList') as HTMLUListElement;
    const paginationContainer = document.querySelector('.pagination') as HTMLDivElement;

    if (!searchInput || !videoList) return;

    let currentPage = 1;
    const recordsPerPage = 20;
    let filteredRecords: VideoRecord[] = [];

    function updateFilteredRecords() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterSelect.value as 'all' | VideoStatus;

        filteredRecords = STATE.records.filter(record => {
            const matchesSearch = !searchTerm ||
                record.id.toLowerCase().includes(searchTerm) ||
                record.title.toLowerCase().includes(searchTerm);
            const matchesFilter = filterValue === 'all' || record.status === filterValue;
            return matchesSearch && matchesFilter;
        });
    }

    function renderVideoList() {
        videoList.innerHTML = '';
        if (filteredRecords.length === 0) {
            videoList.innerHTML = '<li class="empty-list">No records match your criteria.</li>';
            return;
        }

        const startIndex = (currentPage - 1) * recordsPerPage;
        const recordsToRender = filteredRecords.slice(startIndex, startIndex + recordsPerPage);

        const searchEngine = STATE.settings.searchEngines[0];

        recordsToRender.forEach(record => {
            const li = document.createElement('li');
            li.className = 'video-item';
            const searchUrl = searchEngine ? searchEngine.urlTemplate.replace('{{ID}}', encodeURIComponent(record.id)) : '#';

            li.innerHTML = `
                <span class="video-id"><a href="${searchUrl}" target="_blank">${record.id}</a></span>
                <span class="video-title">${record.title}</span>
                <span class="video-status status-${record.status}">${record.status}</span>
            `;
            videoList.appendChild(li);
        });
    }

    function renderPagination() {
        paginationContainer.innerHTML = '';
        const pageCount = Math.ceil(filteredRecords.length / recordsPerPage);
        if (pageCount <= 1) return;
    
        const createPageButton = (page: number | string, active: boolean = false, disabled: boolean = false) => {
            const button = document.createElement('button');
            button.textContent = String(page);
            if (typeof page === 'number') {
                button.className = `page-button ${active ? 'active' : ''}`;
                button.addEventListener('click', () => {
                    currentPage = page;
                    render();
                });
            } else {
                button.className = 'page-button ellipsis';
                disabled = true;
            }
            if (disabled) {
                button.disabled = true;
            }
            paginationContainer.appendChild(button);
        };
    
        const maxPagesToShow = 7; // Max number of page buttons to show (including ellipsis)
        if (pageCount <= maxPagesToShow) {
            for (let i = 1; i <= pageCount; i++) {
                createPageButton(i, i === currentPage);
            }
        } else {
            // Logic for lots of pages: 1 ... 4 5 6 ... 99
            let pages = new Set<number>();
            pages.add(1);
            pages.add(pageCount);
            pages.add(currentPage);
            for (let i = -1; i <= 1; i++) {
                if (currentPage + i > 0 && currentPage + i <= pageCount) {
                    pages.add(currentPage + i);
                }
            }
            
            let sortedPages = Array.from(pages).sort((a, b) => a - b);
            
            let lastPage: number | null = null;
            for (const page of sortedPages) {
                if (lastPage !== null && page - lastPage > 1) {
                    createPageButton('...');
                }
                createPageButton(page, page === currentPage);
                lastPage = page;
            }
        }
    }

    function render() {
        renderVideoList();
        renderPagination();
    }

    searchInput.addEventListener('input', () => { currentPage = 1; updateFilteredRecords(); render(); });
    filterSelect.addEventListener('change', () => { currentPage = 1; updateFilteredRecords(); render(); });

    updateFilteredRecords();
    render();
} 