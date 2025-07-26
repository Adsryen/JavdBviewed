import { STATE } from '../state';
import { VIDEO_STATUS, STORAGE_KEYS } from '../../utils/config';
import type { VideoRecord, VideoStatus } from '../../types';
import { showMessage } from '../ui/toast';

export function initRecordsTab(): void {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const filterSelect = document.getElementById('filterSelect') as HTMLSelectElement;
    const sortSelect = document.getElementById('sortSelect') as HTMLSelectElement;
    const videoList = document.getElementById('videoList') as HTMLUListElement;
    const paginationContainer = document.querySelector('.pagination-controls .pagination') as HTMLElement;
    const recordsPerPageSelect = document.getElementById('recordsPerPageSelect') as HTMLSelectElement;

    let tooltipElement: HTMLPreElement | null = null;

    function createTooltip() {
        if (tooltipElement) return;
        tooltipElement = document.createElement('pre');
        tooltipElement.id = 'json-tooltip';
        document.body.appendChild(tooltipElement);
    }

    function removeTooltip() {
        if (tooltipElement) {
            tooltipElement.remove();
            tooltipElement = null;
        }
    }

    createTooltip();

    if (!searchInput || !videoList || !sortSelect || !recordsPerPageSelect || !paginationContainer) return;

    let currentPage = 1;
    let recordsPerPage = STATE.settings.recordsPerPage || 10;
    let filteredRecords: VideoRecord[] = [];

    recordsPerPageSelect.value = String(recordsPerPage);

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

        // Add sorting logic
        const sortValue = sortSelect.value;
        filteredRecords.sort((a, b) => {
            switch (sortValue) {
                case 'createdAt_asc':
                    return a.createdAt - b.createdAt;
                case 'id_asc':
                    return a.id.localeCompare(b.id);
                case 'id_desc':
                    return b.id.localeCompare(a.id);
                case 'createdAt_desc':
                default:
                    return b.createdAt - a.createdAt;
            }
        });
    }

    function renderVideoList() {
        videoList.innerHTML = '';
        if (filteredRecords.length === 0) {
            videoList.innerHTML = '<li class="empty-list">没有符合条件的记录。</li>';
            return;
        }

        const startIndex = (currentPage - 1) * recordsPerPage;
        const recordsToRender = filteredRecords.slice(startIndex, startIndex + recordsPerPage);

        recordsToRender.forEach(record => {
            const li = document.createElement('li');
            li.className = 'video-item';


            // Create a container for search engine icons
            const iconsContainer = document.createElement('div');
            iconsContainer.className = 'video-search-icons';

            STATE.settings.searchEngines.forEach(engine => {
                const searchUrl = engine.urlTemplate.replace('{{ID}}', encodeURIComponent(record.id));
                const icon = document.createElement('a');
                icon.href = searchUrl;
                icon.target = '_blank';
                icon.title = `Search on ${engine.name}`;

                const img = document.createElement('img');
                img.src = engine.icon.startsWith('assets/')
                    ? chrome.runtime.getURL(engine.icon)
                    : engine.icon;
                img.alt = engine.name;
                img.onerror = () => { // Fallback icon
                    img.src = chrome.runtime.getURL('assets/icon.png');
                };

                icon.appendChild(img);
                iconsContainer.appendChild(icon);
            });

            const date = new Date(record.createdAt);
            const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

            const refreshButton = document.createElement('button');
            refreshButton.className = 'refresh-button';
            refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
            refreshButton.title = '同步数据 - 从JavDB获取最新信息';
            refreshButton.addEventListener('click', async (e) => {
                e.stopPropagation(); 
                
                refreshButton.classList.add('is-loading');
                refreshButton.disabled = true;
                refreshButton.title = '正在同步数据...';

                try {
                    // First test if background script is responding
                    console.log(`[Dashboard] Testing background script connection...`);
                    const pingResponse = await chrome.runtime.sendMessage({ type: 'ping' });
                    console.log(`[Dashboard] Ping response:`, pingResponse);

                    if (!pingResponse || !pingResponse.success) {
                        throw new Error('后台脚本无响应，请重新加载扩展');
                    }

                    console.log(`[Dashboard] Sending refresh request for videoId: ${record.id}`);
                    const response = await chrome.runtime.sendMessage({
                        type: 'refresh-record',
                        videoId: record.id
                    });

                    console.log(`[Dashboard] Received response for ${record.id}:`, response);

                    if (response?.success) {
                        // Find the record in the main STATE and update it
                        const recordIndex = STATE.records.findIndex(r => r.id === record.id);
                        if (recordIndex !== -1) {
                            STATE.records[recordIndex] = response.record;
                        }
                        updateFilteredRecords();
                        render();
                        showMessage(`'${record.id}' 已成功刷新。`, 'success');
                    } else {
                        // Handle cases where response is undefined or success is false
                        const errorMessage = response?.error || '刷新请求未收到响应或失败';
                        console.error(`[Dashboard] Refresh failed for ${record.id}:`, errorMessage);
                        throw new Error(errorMessage);
                    }
                } catch (error: any) {
                    console.error(`[Dashboard] Error during refresh for ${record.id}:`, error);
                    showMessage(`刷新 '${record.id}' 失败: ${error.message}`, 'error');
                } finally {
                    console.log(`[Dashboard] Finalizing refresh UI for ${record.id}`);
                    // This button might not exist anymore if the list was re-rendered, so check first.
                    const newButton = document.querySelector(`[data-record-id="${record.id}"] .refresh-button`) as HTMLButtonElement;
                    if (newButton) {
                        newButton.classList.remove('is-loading');
                        newButton.removeAttribute('disabled');
                        newButton.title = '同步数据 - 从JavDB获取最新信息';
                    }
                }
            });

            const controlsContainer = document.createElement('div');
            controlsContainer.className = 'video-controls';
            controlsContainer.appendChild(iconsContainer);
            controlsContainer.appendChild(refreshButton);

            // Create JSON info icon
            const jsonIcon = document.createElement('span');
            jsonIcon.className = 'json-info-icon';
            jsonIcon.innerHTML = '{ }';
            jsonIcon.title = '查看原始JSON数据';

            // Add hover events for JSON tooltip
            jsonIcon.addEventListener('mouseenter', (e) => {
                if (!tooltipElement) return;
                tooltipElement.textContent = JSON.stringify(record, null, 2);
                tooltipElement.style.display = 'block';
                updateTooltipPosition(e);
            });

            jsonIcon.addEventListener('mouseleave', () => {
                if (!tooltipElement) return;
                tooltipElement.style.display = 'none';
            });

            jsonIcon.addEventListener('mousemove', (e) => {
                updateTooltipPosition(e);
            });

            // Create the video ID element (with or without link based on javdbUrl)
            let videoIdHtml = '';
            if (record.javdbUrl && record.javdbUrl.trim() !== '' && record.javdbUrl !== '#') {
                videoIdHtml = `<a href="${record.javdbUrl}" target="_blank" class="video-id-link">${record.id}</a>`;
            } else {
                videoIdHtml = `<span class="video-id-text">${record.id}</span>`;
            }

            li.innerHTML = `
                <div class="video-content-wrapper">
                    <div class="video-id-container">
                        ${videoIdHtml}
                    </div>
                    <span class="video-title">${record.title}</span>
                </div>
                <span class="video-date">${formattedDate}</span>
                <span class="video-status status-${record.status}">${record.status}</span>
            `;

            // Insert the JSON icon after the video ID
            const videoIdContainer = li.querySelector('.video-id-container');
            if (videoIdContainer) {
                videoIdContainer.appendChild(jsonIcon);
            }

            // Append the icons container to the list item
            li.appendChild(controlsContainer);
            li.dataset.recordId = record.id;
            videoList.appendChild(li);
        });
    }

    function updateTooltipPosition(e: MouseEvent) {
        if (!tooltipElement) return;
        const x = e.clientX + 15;
        const y = e.clientY + 15;
        const tooltipWidth = tooltipElement.offsetWidth;
        const tooltipHeight = tooltipElement.offsetHeight;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let newX = x;
        let newY = y;

        if (x + tooltipWidth > viewportWidth) {
            newX = viewportWidth - tooltipWidth - 15;
        }
        if (y + tooltipHeight > viewportHeight) {
            newY = viewportHeight - tooltipHeight - 15;
        }

        tooltipElement.style.left = `${newX}px`;
        tooltipElement.style.top = `${newY}px`;
    }

    function renderPagination() {
        paginationContainer.innerHTML = '';
        const pageCount = Math.ceil(filteredRecords.length / recordsPerPage);
        if (pageCount <= 1) return;
        const goToPage = (page: number) => {
            if (page < 1 || page > pageCount) return;
            currentPage = page;
            render();
        };

        const createButton = (
            content: string | number,
            page?: number,
            options: { isDisabled?: boolean; isActive?: boolean; isEllipsis?: boolean; title?: string } = {}
        ) => {
            const button = document.createElement('button');
            button.innerHTML = String(content);
            button.disabled = options.isDisabled ?? false;
            if (options.title) {
                button.title = options.title;
            }

            const classNames = ['page-button'];
            if (options.isActive) classNames.push('active');
            if (options.isEllipsis) classNames.push('ellipsis');
            
            button.className = classNames.join(' ');

            if (page) {
                button.addEventListener('click', () => goToPage(page));
            }
            paginationContainer.appendChild(button);
        };

        // First and Previous buttons
        createButton('<i class="fas fa-angles-left"></i>', 1, { isDisabled: currentPage === 1, title: '首页' });
        createButton('<i class="fas fa-angle-left"></i>', currentPage - 1, { isDisabled: currentPage === 1, title: '上一页' });

        // Page numbers logic
        const pagesToShow = new Set<number>();
        pagesToShow.add(1);
        pagesToShow.add(pageCount);

        for (let i = -2; i <= 2; i++) {
            const page = currentPage + i;
            if (page > 1 && page < pageCount) {
                pagesToShow.add(page);
            }
        }
        if (currentPage > 1 && currentPage < pageCount) {
            pagesToShow.add(currentPage);
        }
        
        const sortedPages = Array.from(pagesToShow).sort((a, b) => a - b);
        
        let lastPage: number | null = null;
        for (const page of sortedPages) {
            if (lastPage !== null && page - lastPage > 1) {
                createButton('...', undefined, { isDisabled: true, isEllipsis: true });
            }
            createButton(page, page, { isActive: page === currentPage });
            lastPage = page;
        }

        // Next and Last buttons
        createButton('<i class="fas fa-angle-right"></i>', currentPage + 1, { isDisabled: currentPage === pageCount, title: '下一页' });
        createButton('<i class="fas fa-angles-right"></i>', pageCount, { isDisabled: currentPage === pageCount, title: '末页' });
    }

    function render() {
        renderVideoList();
        renderPagination();
    }

    searchInput.addEventListener('input', () => { currentPage = 1; updateFilteredRecords(); render(); });
    filterSelect.addEventListener('change', () => { currentPage = 1; updateFilteredRecords(); render(); });
    sortSelect.addEventListener('change', () => { currentPage = 1; updateFilteredRecords(); render(); });

    recordsPerPageSelect.addEventListener('change', () => {
        recordsPerPage = parseInt(recordsPerPageSelect.value, 10);
        STATE.settings.recordsPerPage = recordsPerPage;
        chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: STATE.settings });
        currentPage = 1;
        render();
    });

    updateFilteredRecords();
    render();
} 