import { STATE } from '../state';
import { VIDEO_STATUS, STORAGE_KEYS } from '../../utils/config';
import type { VideoRecord, VideoStatus } from '../../types';
import { showMessage } from '../ui/toast';
import { showConfirmationModal } from '../ui/modal';

export function initRecordsTab(): void {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const filterSelect = document.getElementById('filterSelect') as HTMLSelectElement;
    const sortSelect = document.getElementById('sortSelect') as HTMLSelectElement;
    const videoList = document.getElementById('videoList') as HTMLUListElement;
    const paginationContainer = document.querySelector('.pagination-controls .pagination') as HTMLElement;
    const recordsPerPageSelect = document.getElementById('recordsPerPageSelect') as HTMLSelectElement;

    // Tags filter elements
    const tagsFilterInput = document.getElementById('tagsFilterInput') as HTMLInputElement;
    const tagsFilterDropdown = document.getElementById('tagsFilterDropdown') as HTMLElement;
    const tagsSearchInput = document.getElementById('tagsSearchInput') as HTMLInputElement;
    const tagsFilterList = document.getElementById('tagsFilterList') as HTMLElement;
    const selectedTagsContainer = document.getElementById('selectedTagsContainer') as HTMLElement;

    // 批量操作相关元素
    const batchOperations = document.getElementById('batchOperations') as HTMLDivElement;
    const selectAllCheckbox = document.getElementById('selectAllCheckbox') as HTMLInputElement;
    const selectedCount = document.getElementById('selectedCount') as HTMLSpanElement;
    const batchRefreshBtn = document.getElementById('batchRefreshBtn') as HTMLButtonElement;
    const batchDeleteBtn = document.getElementById('batchDeleteBtn') as HTMLButtonElement;
    const cancelBatchBtn = document.getElementById('cancelBatchBtn') as HTMLButtonElement;

    let tooltipElement: HTMLPreElement | null = null;
    let imageTooltipElement: HTMLDivElement | null = null;

    // 选择状态
    let selectedRecords = new Set<string>();

    // Tags filter state
    let selectedTags = new Set<string>();
    let allTags = new Set<string>();

    function createTooltip() {
        if (tooltipElement) return;
        tooltipElement = document.createElement('pre');
        tooltipElement.id = 'json-tooltip';
        document.body.appendChild(tooltipElement);
    }

    function createImageTooltip() {
        if (imageTooltipElement) return;
        imageTooltipElement = document.createElement('div');
        imageTooltipElement.id = 'image-tooltip';
        imageTooltipElement.className = 'image-tooltip';
        document.body.appendChild(imageTooltipElement);
    }

    function removeTooltip() {
        if (tooltipElement) {
            tooltipElement.remove();
            tooltipElement = null;
        }
    }

    function removeImageTooltip() {
        if (imageTooltipElement) {
            imageTooltipElement.remove();
            imageTooltipElement = null;
        }
    }

    createTooltip();
    createImageTooltip();

    if (!searchInput || !videoList || !sortSelect || !recordsPerPageSelect || !paginationContainer) return;

    let currentPage = 1;
    let recordsPerPage = STATE.settings.recordsPerPage || 10;
    let filteredRecords: VideoRecord[] = [];

    recordsPerPageSelect.value = String(recordsPerPage);

    function updateFilteredRecords() {
        try {
            const searchTerm = searchInput.value.toLowerCase();
            const filterValue = filterSelect.value as 'all' | VideoStatus;

            // 确保 STATE.records 是数组
            const records = Array.isArray(STATE.records) ? STATE.records : [];

            filteredRecords = records.filter(record => {
                // 确保 record 对象存在且有必要的属性
                if (!record || typeof record !== 'object') {
                    console.warn('无效的记录对象:', record);
                    return false;
                }

                const matchesSearch = !searchTerm ||
                    (record.id && record.id.toLowerCase().includes(searchTerm)) ||
                    (record.title && record.title.toLowerCase().includes(searchTerm));
                const matchesFilter = filterValue === 'all' || record.status === filterValue;

                // Tags filter
                const matchesTags = selectedTags.size === 0 ||
                    (record.tags && Array.isArray(record.tags) &&
                     Array.from(selectedTags).every(tag => record.tags.includes(tag)));

                return matchesSearch && matchesFilter && matchesTags;
            });

            // Add sorting logic
            const sortValue = sortSelect.value;
            filteredRecords.sort((a, b) => {
                try {
                    switch (sortValue) {
                        case 'createdAt_desc':
                            return (b.createdAt || 0) - (a.createdAt || 0);
                        case 'createdAt_asc':
                            return (a.createdAt || 0) - (b.createdAt || 0);
                        case 'updatedAt_asc':
                            return (a.updatedAt || 0) - (b.updatedAt || 0);
                        case 'id_asc':
                            return (a.id || '').localeCompare(b.id || '');
                        case 'id_desc':
                            return (b.id || '').localeCompare(a.id || '');
                        case 'updatedAt_desc':
                        default:
                            return (b.updatedAt || 0) - (a.updatedAt || 0);
                    }
                } catch (error) {
                    console.error('排序时出错:', error, a, b);
                    return 0;
                }
            });
        } catch (error) {
            console.error('更新过滤记录时出错:', error);
            filteredRecords = [];
        }
    }

    function renderVideoList() {
        try {
            videoList.innerHTML = '';

            // 确保 filteredRecords 是数组
            if (!Array.isArray(filteredRecords)) {
                console.warn('filteredRecords 不是数组:', filteredRecords);
                filteredRecords = [];
            }

            if (filteredRecords.length === 0) {
                videoList.innerHTML = '<li class="empty-list">没有符合条件的记录。</li>';
                return;
            }

            const startIndex = (currentPage - 1) * recordsPerPage;
            const recordsToRender = filteredRecords.slice(startIndex, startIndex + recordsPerPage);

            // 确保 recordsToRender 是数组
            if (!Array.isArray(recordsToRender)) {
                console.warn('recordsToRender 不是数组:', recordsToRender);
                return;
            }

            recordsToRender.forEach(record => {
                try {
                    // 确保 record 对象存在
                    if (!record || typeof record !== 'object') {
                        console.warn('无效的记录对象:', record);
                        return;
                    }
            const li = document.createElement('li');
            li.className = 'video-item batch-mode'; // 始终使用batch-mode样式

            // 设置选中状态
            if (selectedRecords.has(record.id)) {
                li.classList.add('selected');
            }


            // Create a container for search engine icons
            const iconsContainer = document.createElement('div');
            iconsContainer.className = 'video-search-icons';

            // 确保 searchEngines 是数组
            const searchEngines = Array.isArray(STATE.settings?.searchEngines) ? STATE.settings.searchEngines : [];

            searchEngines.forEach(engine => {
                try {
                    // 确保 engine 对象有必要的属性
                    if (!engine || !engine.urlTemplate || !engine.name) {
                        console.warn('无效的搜索引擎配置:', engine);
                        return;
                    }

                    const searchUrl = engine.urlTemplate.replace('{{ID}}', encodeURIComponent(record.id));
                    const icon = document.createElement('a');
                    icon.href = searchUrl;
                    icon.target = '_blank';
                    icon.title = `Search on ${engine.name}`;

                    const img = document.createElement('img');
                    img.src = engine.icon && engine.icon.startsWith('assets/')
                        ? chrome.runtime.getURL(engine.icon)
                        : (engine.icon || chrome.runtime.getURL('assets/alternate-search.png'));
                    img.alt = engine.name;
                    img.onerror = () => { // Fallback icon
                        img.src = chrome.runtime.getURL('assets/alternate-search.png');
                    };

                    icon.appendChild(img);
                    iconsContainer.appendChild(icon);
                } catch (error) {
                    console.error('创建搜索引擎图标时出错:', error, engine);
                }
            });

            const createdDate = new Date(record.createdAt);
            const updatedDate = new Date(record.updatedAt);
            const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

            const formattedCreatedDate = formatDate(createdDate);
            const formattedUpdatedDate = formatDate(updatedDate);

            // 如果创建时间和更新时间相同，只显示一个时间
            const timeDisplay = record.createdAt === record.updatedAt
                ? `创建: ${formattedCreatedDate}`
                : `创建: ${formattedCreatedDate}\n更新: ${formattedUpdatedDate}`;

            const refreshButton = document.createElement('button');
            refreshButton.className = 'refresh-button';
            refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
            refreshButton.title = '刷新源数据 - 从JavDB获取最新信息';
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

            // 创建删除按钮
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-button';
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButton.title = '删除此记录';
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();

                // 使用确认modal
                showConfirmationModal({
                    title: '确认删除记录',
                    message: `确定要删除记录 "${record.id}" 吗？\n\n标题: ${record.title}\n状态: ${record.status}\n\n此操作不可撤销！`,
                    onConfirm: async () => {
                        try {
                            // 从STATE中删除记录
                            const recordIndex = STATE.records.findIndex(r => r.id === record.id);
                            if (recordIndex !== -1) {
                                STATE.records.splice(recordIndex, 1);

                                // 保存到存储
                                const recordsData = STATE.records.reduce((acc, record) => {
                                    acc[record.id] = record;
                                    return acc;
                                }, {} as Record<string, VideoRecord>);

                                await chrome.storage.local.set({ [STORAGE_KEYS.VIEWED_RECORDS]: recordsData });

                                // 更新显示
                                updateFilteredRecords();
                                render();

                                showMessage(`记录 "${record.id}" 已删除`, 'success');
                            }
                        } catch (error: any) {
                            console.error('删除记录时出错:', error);
                            showMessage(`删除记录失败: ${error.message}`, 'error');
                        }
                    },
                    onCancel: () => {
                        // 用户取消删除，不需要做任何操作
                    }
                });
            });

            // 创建统一的操作按钮容器
            const actionButtonsContainer = document.createElement('div');
            actionButtonsContainer.className = 'action-buttons-container';

            // 编辑按钮
            const editButton = document.createElement('button');
            editButton.className = 'action-button edit-button';
            editButton.innerHTML = '<i class="fas fa-edit"></i>';
            editButton.title = '编辑记录';
            editButton.addEventListener('click', (e) => {
                e.stopPropagation();
                showEditModal(record);
            });

            // 同步按钮（重命名refresh按钮）
            refreshButton.className = 'action-button sync-button';
            refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
            refreshButton.title = '刷新源数据';

            // 删除按钮样式调整
            deleteButton.className = 'action-button delete-button';
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButton.title = '删除记录';

            // 将按钮添加到容器
            actionButtonsContainer.appendChild(editButton);
            actionButtonsContainer.appendChild(refreshButton);
            actionButtonsContainer.appendChild(deleteButton);

            const controlsContainer = document.createElement('div');
            controlsContainer.className = 'video-controls';
            controlsContainer.appendChild(iconsContainer);
            controlsContainer.appendChild(actionButtonsContainer);



            // Create the video ID element (with or without link based on javdbUrl)
            let videoIdHtml = '';
            if (record.javdbUrl && record.javdbUrl.trim() !== '' && record.javdbUrl !== '#') {
                videoIdHtml = `<a href="${record.javdbUrl}" target="_blank" class="video-id-link">${record.id}</a>`;
            } else {
                videoIdHtml = `<span class="video-id-text">${record.id}</span>`;
            }

            // 生成tags HTML
            const tagsHtml = record.tags && record.tags.length > 0
                ? `<div class="video-tags">${record.tags.map(tag =>
                    `<span class="video-tag ${selectedTags.has(tag) ? 'selected' : ''}" data-tag="${tag}" title="点击筛选此标签">${tag}</span>`
                ).join('')}</div>`
                : '';

            li.innerHTML = `
                <div class="video-content-wrapper">
                    <div class="video-id-container">
                        ${videoIdHtml}
                    </div>
                    ${tagsHtml}
                    <span class="video-title">${record.title}</span>
                </div>
                <span class="video-date" title="${timeDisplay.replace('\n', ' | ')}">${record.createdAt === record.updatedAt ? formattedCreatedDate : formattedUpdatedDate}</span>
                <span class="video-status status-${record.status}">${record.status}</span>
            `;





            // 添加图片悬浮功能到video-id-link
            const videoIdLink = li.querySelector('.video-id-link') as HTMLAnchorElement;
            if (videoIdLink && record.javdbImage) {
                videoIdLink.addEventListener('mouseenter', (e) => {
                    if (!imageTooltipElement) return;

                    // 创建图片悬浮内容
                    const tooltipContent = document.createElement('div');
                    tooltipContent.className = 'image-tooltip-content';

                    const img = document.createElement('img');
                    img.src = record.javdbImage;
                    img.alt = record.title;
                    img.style.opacity = '0';

                    const loadingDiv = document.createElement('div');
                    loadingDiv.className = 'image-tooltip-loading';
                    loadingDiv.textContent = '加载中...';

                    // 添加图片加载事件监听器
                    img.addEventListener('load', () => {
                        img.style.opacity = '1';
                        loadingDiv.style.display = 'none';
                    });

                    img.addEventListener('error', () => {
                        img.style.display = 'none';
                        loadingDiv.textContent = '图片加载失败';
                    });

                    tooltipContent.appendChild(img);
                    tooltipContent.appendChild(loadingDiv);

                    // 清空并添加新内容
                    imageTooltipElement.innerHTML = '';
                    imageTooltipElement.appendChild(tooltipContent);

                    imageTooltipElement.style.display = 'block';
                    imageTooltipElement.style.opacity = '0';

                    // 位置更新
                    const updateImageTooltipPosition = (event: MouseEvent) => {
                        if (!imageTooltipElement) return;
                        const x = event.clientX + 15;
                        const y = event.clientY + 15;
                        imageTooltipElement.style.left = `${x}px`;
                        imageTooltipElement.style.top = `${y}px`;
                    };

                    updateImageTooltipPosition(e);

                    // 延迟显示，避免快速移动时闪烁
                    setTimeout(() => {
                        if (imageTooltipElement && imageTooltipElement.style.display === 'block') {
                            imageTooltipElement.style.opacity = '1';
                        }
                    }, 200);

                    videoIdLink.addEventListener('mousemove', updateImageTooltipPosition);
                });

                videoIdLink.addEventListener('mouseleave', () => {
                    if (imageTooltipElement) {
                        imageTooltipElement.style.display = 'none';
                        imageTooltipElement.style.opacity = '0';
                    }
                });
            }

            // 添加点击事件处理
            li.addEventListener('click', (e) => {
                // 如果点击的是按钮、链接或标签，不触发选择
                if ((e.target as HTMLElement).closest('button, a, .video-tag')) {
                    return;
                }

                // 直接切换选择状态
                const isSelected = selectedRecords.has(record.id);
                handleRecordSelection(record.id, !isSelected);
            });

            // 如果当前项被选中，添加选中样式
            if (selectedRecords.has(record.id)) {
                li.classList.add('selected');
            }

            // 为video-tag添加点击事件
            const videoTags = li.querySelectorAll('.video-tag');
            videoTags.forEach(tagElement => {
                tagElement.addEventListener('click', (e) => {
                    e.stopPropagation(); // 防止触发行选择
                    const tag = tagElement.getAttribute('data-tag');
                    if (tag) {
                        if (selectedTags.has(tag)) {
                            selectedTags.delete(tag);
                        } else {
                            selectedTags.add(tag);
                        }
                        currentPage = 1;
                        updateFilteredRecords();
                        render();
                        refreshTagsFilterDisplay();
                    }
                });
            });

            // Append the icons container to the list item
            li.appendChild(controlsContainer);
            li.dataset.recordId = record.id;
            videoList.appendChild(li);
                } catch (error) {
                    console.error('渲染记录项时出错:', error, record);
                }
            });
        } catch (error) {
            console.error('渲染视频列表时出错:', error);
            videoList.innerHTML = '<li class="empty-list error">渲染列表时出现错误，请刷新重试。</li>';
        }
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
        updateStats();
    }

    function updateStats() {
        const statsContainer = document.getElementById('recordsStatsContainer');
        if (!statsContainer) return;

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const stats = {
            total: STATE.records.length,
            viewed: STATE.records.filter(r => r.status === 'viewed').length,
            browsed: STATE.records.filter(r => r.status === 'browsed').length,
            want: STATE.records.filter(r => r.status === 'want').length,
            thisWeek: STATE.records.filter(r => new Date(r.createdAt) >= oneWeekAgo).length,
            thisMonth: STATE.records.filter(r => new Date(r.createdAt) >= oneMonthAgo).length
        };

        statsContainer.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">总番号数</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.viewed}</div>
                <div class="stat-label">已观看</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.browsed}</div>
                <div class="stat-label">已浏览</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.want}</div>
                <div class="stat-label">我想看</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.thisWeek}</div>
                <div class="stat-label">本周新增</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.thisMonth}</div>
                <div class="stat-label">本月新增</div>
            </div>
        `;
    }

    function collectAllTags() {
        allTags.clear();
        STATE.records.forEach(record => {
            if (record.tags && Array.isArray(record.tags)) {
                record.tags.forEach(tag => allTags.add(tag));
            }
        });
    }

    function renderTagsFilter() {
        collectAllTags();
        const sortedTags = Array.from(allTags).sort();

        tagsFilterList.innerHTML = sortedTags.map(tag => `
            <div class="tag-option ${selectedTags.has(tag) ? 'selected' : ''}" data-tag="${tag}">
                <input type="checkbox" ${selectedTags.has(tag) ? 'checked' : ''}>
                <span>${tag}</span>
            </div>
        `).join('');

        updateSelectedTagsDisplay();
        updateTagsFilterInput();
    }

    function refreshTagsFilterDisplay() {
        // 更新下拉框中的选择状态
        const tagOptions = tagsFilterList.querySelectorAll('.tag-option');
        tagOptions.forEach(option => {
            const tag = option.getAttribute('data-tag');
            const checkbox = option.querySelector('input[type="checkbox"]') as HTMLInputElement;
            if (tag) {
                const isSelected = selectedTags.has(tag);
                option.classList.toggle('selected', isSelected);
                if (checkbox) {
                    checkbox.checked = isSelected;
                }
            }
        });

        updateSelectedTagsDisplay();
        updateTagsFilterInput();
    }

    function updateSelectedTagsDisplay() {
        selectedTagsContainer.innerHTML = Array.from(selectedTags).map(tag => `
            <div class="selected-tag">
                <span>${tag}</span>
                <span class="remove-tag" data-tag="${tag}">×</span>
            </div>
        `).join('');
    }

    function updateTagsFilterInput() {
        const count = selectedTags.size;
        tagsFilterInput.value = count > 0 ? `已选择 ${count} 个标签` : '点击选择标签';
    }

    function filterTagsList(searchTerm: string) {
        const tagOptions = tagsFilterList.querySelectorAll('.tag-option');
        tagOptions.forEach(option => {
            const tagName = option.querySelector('span')?.textContent || '';
            const matches = tagName.toLowerCase().includes(searchTerm.toLowerCase());
            (option as HTMLElement).style.display = matches ? 'flex' : 'none';
        });
    }

    searchInput.addEventListener('input', () => { currentPage = 1; updateFilteredRecords(); render(); });
    filterSelect.addEventListener('change', () => { currentPage = 1; updateFilteredRecords(); render(); });
    sortSelect.addEventListener('change', () => { currentPage = 1; updateFilteredRecords(); render(); });

    // Tags filter event listeners
    tagsFilterInput.addEventListener('click', () => {
        tagsFilterDropdown.style.display = tagsFilterDropdown.style.display === 'none' ? 'block' : 'none';
        if (tagsFilterDropdown.style.display === 'block') {
            renderTagsFilter();
            tagsSearchInput.focus();
        }
    });

    tagsSearchInput.addEventListener('input', (e) => {
        filterTagsList((e.target as HTMLInputElement).value);
    });

    tagsFilterList.addEventListener('click', (e) => {
        const tagOption = (e.target as HTMLElement).closest('.tag-option');
        if (tagOption) {
            const tag = tagOption.getAttribute('data-tag');
            if (tag) {
                if (selectedTags.has(tag)) {
                    selectedTags.delete(tag);
                } else {
                    selectedTags.add(tag);
                }
                refreshTagsFilterDisplay();
                currentPage = 1;
                updateFilteredRecords();
                render();
            }
        }
    });

    selectedTagsContainer.addEventListener('click', (e) => {
        const removeBtn = (e.target as HTMLElement).closest('.remove-tag');
        if (removeBtn) {
            const tag = removeBtn.getAttribute('data-tag');
            if (tag) {
                selectedTags.delete(tag);
                refreshTagsFilterDisplay();
                currentPage = 1;
                updateFilteredRecords();
                render();
            }
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!tagsFilterInput.contains(e.target as Node) && !tagsFilterDropdown.contains(e.target as Node)) {
            tagsFilterDropdown.style.display = 'none';
        }
    });

    recordsPerPageSelect.addEventListener('change', () => {
        recordsPerPage = parseInt(recordsPerPageSelect.value, 10);
        STATE.settings.recordsPerPage = recordsPerPage;
        chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: STATE.settings });
        currentPage = 1;
        render();
    });

    // 批量操作事件监听器
    selectAllCheckbox.addEventListener('change', handleSelectAll);
    batchRefreshBtn.addEventListener('click', handleBatchRefresh);
    batchDeleteBtn.addEventListener('click', handleBatchDelete);
    cancelBatchBtn.addEventListener('click', clearAllSelection);

    updateFilteredRecords();
    render();
    renderTagsFilter(); // 初始化标签筛选
    updateBatchUI(); // 初始化批量操作UI状态

    // 编辑记录的modal功能
    function showEditModal(record: VideoRecord) {
        // 创建modal元素
        const modal = document.createElement('div');
        modal.className = 'edit-record-modal';
        modal.innerHTML = `
            <div class="edit-modal-content">
                <div class="edit-modal-header">
                    <h3>编辑记录: ${record.id}</h3>
                    <button class="edit-modal-close">&times;</button>
                </div>
                <div class="edit-modal-body">
                    <div class="edit-form">
                        <div class="form-group">
                            <label for="edit-id">视频ID:</label>
                            <input type="text" id="edit-id" value="${record.id}" />
                            <small class="form-hint">修改ID后会创建新记录，原记录将被删除</small>
                        </div>
                        <div class="form-group">
                            <label for="edit-title">标题:</label>
                            <input type="text" id="edit-title" value="${record.title}" />
                        </div>
                        <div class="form-group">
                            <label for="edit-status">状态:</label>
                            <select id="edit-status">
                                <option value="${VIDEO_STATUS.VIEWED}" ${record.status === VIDEO_STATUS.VIEWED ? 'selected' : ''}>已观看</option>
                                <option value="${VIDEO_STATUS.BROWSED}" ${record.status === VIDEO_STATUS.BROWSED ? 'selected' : ''}>已浏览</option>
                                <option value="${VIDEO_STATUS.WANT}" ${record.status === VIDEO_STATUS.WANT ? 'selected' : ''}>想看</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-release-date">发布日期:</label>
                            <input type="text" id="edit-release-date" value="${record.releaseDate || ''}" placeholder="YYYY-MM-DD" />
                        </div>
                        <div class="form-group">
                            <label for="edit-javdb-url">JavDB链接:</label>
                            <input type="url" id="edit-javdb-url" value="${record.javdbUrl || ''}" />
                        </div>
                        <div class="form-group">
                            <label for="edit-javdb-image">封面图片链接:</label>
                            <input type="url" id="edit-javdb-image" value="${record.javdbImage || ''}" />
                        </div>
                        <div class="form-group">
                            <label for="edit-tags">标签 (用逗号分隔):</label>
                            <input type="text" id="edit-tags" value="${record.tags ? record.tags.join(', ') : ''}" />
                        </div>
                    </div>
                    <div class="json-editor">
                        <label for="edit-json">原始JSON数据:</label>
                        <textarea id="edit-json" rows="10">${JSON.stringify(record, null, 2)}</textarea>
                        <div class="json-editor-buttons">
                            <button id="form-to-json" class="btn-secondary">表单 → JSON</button>
                            <button id="json-to-form" class="btn-secondary">JSON → 表单</button>
                        </div>
                    </div>
                </div>
                <div class="edit-modal-footer">
                    <button id="save-record" class="btn-primary">保存</button>
                    <button id="cancel-edit" class="btn-secondary">取消</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 获取表单元素
        const idInput = modal.querySelector('#edit-id') as HTMLInputElement;
        const titleInput = modal.querySelector('#edit-title') as HTMLInputElement;
        const statusSelect = modal.querySelector('#edit-status') as HTMLSelectElement;
        const releaseDateInput = modal.querySelector('#edit-release-date') as HTMLInputElement;
        const javdbUrlInput = modal.querySelector('#edit-javdb-url') as HTMLInputElement;
        const javdbImageInput = modal.querySelector('#edit-javdb-image') as HTMLInputElement;
        const tagsInput = modal.querySelector('#edit-tags') as HTMLInputElement;
        const jsonTextarea = modal.querySelector('#edit-json') as HTMLTextAreaElement;

        // 表单到JSON的转换
        const formToJson = () => {
            const formData = {
                ...record,
                id: idInput.value.trim(),
                title: titleInput.value,
                status: statusSelect.value as VideoStatus,
                releaseDate: releaseDateInput.value || undefined,
                javdbUrl: javdbUrlInput.value || undefined,
                javdbImage: javdbImageInput.value || undefined,
                tags: tagsInput.value ? tagsInput.value.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
                updatedAt: Date.now()
            };
            jsonTextarea.value = JSON.stringify(formData, null, 2);
        };

        // JSON到表单的转换
        const jsonToForm = () => {
            try {
                const jsonData = JSON.parse(jsonTextarea.value);
                idInput.value = jsonData.id || '';
                titleInput.value = jsonData.title || '';
                statusSelect.value = jsonData.status || VIDEO_STATUS.BROWSED;
                releaseDateInput.value = jsonData.releaseDate || '';
                javdbUrlInput.value = jsonData.javdbUrl || '';
                javdbImageInput.value = jsonData.javdbImage || '';
                tagsInput.value = jsonData.tags ? jsonData.tags.join(', ') : '';
            } catch (error) {
                showMessage('JSON格式错误，无法解析', 'error');
            }
        };

        // 事件监听器
        modal.querySelector('#form-to-json')?.addEventListener('click', formToJson);
        modal.querySelector('#json-to-form')?.addEventListener('click', jsonToForm);

        // 关闭modal
        const closeModal = () => {
            document.body.removeChild(modal);
        };

        modal.querySelector('.edit-modal-close')?.addEventListener('click', closeModal);
        modal.querySelector('#cancel-edit')?.addEventListener('click', closeModal);

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // 保存记录
        modal.querySelector('#save-record')?.addEventListener('click', async () => {
            try {
                // 先尝试从JSON解析
                const updatedRecord = JSON.parse(jsonTextarea.value);

                // 验证必要字段
                if (!updatedRecord.id || !updatedRecord.title) {
                    showMessage('ID和标题是必填字段', 'error');
                    return;
                }

                // 确保更新时间
                updatedRecord.updatedAt = Date.now();

                const originalId = record.id;
                const newId = updatedRecord.id.trim();

                // 检查ID是否发生变化
                if (originalId !== newId) {
                    // ID发生变化，需要删除原记录并创建新记录

                    // 检查新ID是否已存在
                    const existingRecord = STATE.records.find(r => r.id === newId);
                    if (existingRecord) {
                        showMessage(`ID "${newId}" 已存在，请使用其他ID`, 'error');
                        return;
                    }

                    // 删除原记录
                    const originalIndex = STATE.records.findIndex(r => r.id === originalId);
                    if (originalIndex !== -1) {
                        STATE.records.splice(originalIndex, 1);
                    }

                    // 添加新记录
                    STATE.records.push(updatedRecord);

                    showMessage(`记录ID从 "${originalId}" 更改为 "${newId}"`, 'success');
                } else {
                    // ID没有变化，直接更新记录
                    const recordIndex = STATE.records.findIndex(r => r.id === originalId);
                    if (recordIndex !== -1) {
                        STATE.records[recordIndex] = updatedRecord;
                    }

                    showMessage(`记录 "${updatedRecord.id}" 已更新`, 'success');
                }

                // 保存到存储
                const recordsData = STATE.records.reduce((acc, record) => {
                    acc[record.id] = record;
                    return acc;
                }, {} as Record<string, VideoRecord>);

                await chrome.storage.local.set({ [STORAGE_KEYS.VIEWED_RECORDS]: recordsData });

                // 更新显示
                updateFilteredRecords();
                render();

                closeModal();
            } catch (error: any) {
                console.error('保存记录时出错:', error);
                showMessage(`保存失败: ${error.message}`, 'error');
            }
        });

        // ESC键关闭
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    // 清除所有选择
    function clearAllSelection() {
        selectedRecords.clear();
        document.querySelectorAll('.video-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        updateBatchUI();
    }

    function handleSelectAll() {
        const isChecked = selectAllCheckbox.checked;

        if (isChecked) {
            // 选择当前页面的所有记录
            const currentRecords = filteredRecords.slice(
                (currentPage - 1) * recordsPerPage,
                currentPage * recordsPerPage
            );
            currentRecords.forEach(record => selectedRecords.add(record.id));
        } else {
            // 取消选择当前页面的所有记录
            const currentRecords = filteredRecords.slice(
                (currentPage - 1) * recordsPerPage,
                currentPage * recordsPerPage
            );
            currentRecords.forEach(record => selectedRecords.delete(record.id));
        }

        updateBatchUI();
        render();
    }

    function handleRecordSelection(recordId: string, isSelected: boolean) {
        if (isSelected) {
            selectedRecords.add(recordId);
        } else {
            selectedRecords.delete(recordId);
        }

        // 更新对应的li元素的选中状态
        const li = document.querySelector(`[data-record-id="${recordId}"]`) as HTMLElement;
        if (li) {
            if (isSelected) {
                li.classList.add('selected');
            } else {
                li.classList.remove('selected');
            }
        }

        updateBatchUI();
        // 不要重新渲染整个列表，只更新UI状态
    }

    function updateBatchUI() {
        const selectedCount_element = selectedCount;
        const count = selectedRecords.size;
        selectedCount_element.textContent = `已选择 ${count} 项`;

        // 根据选择数量显示/隐藏批量操作栏
        if (count > 0) {
            batchOperations.style.display = 'flex';
        } else {
            batchOperations.style.display = 'none';
        }

        // 更新按钮状态
        batchRefreshBtn.disabled = count === 0;
        batchDeleteBtn.disabled = count === 0;

        // 更新全选复选框状态
        const currentRecords = filteredRecords.slice(
            (currentPage - 1) * recordsPerPage,
            currentPage * recordsPerPage
        );
        const currentSelectedCount = currentRecords.filter(record => selectedRecords.has(record.id)).length;

        if (currentSelectedCount === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (currentSelectedCount === currentRecords.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }





    async function handleBatchRefresh() {
        if (selectedRecords.size === 0) return;

        const selectedIds = Array.from(selectedRecords);

        showCustomConfirm(
            '批量刷新确认',
            `确定要刷新 ${selectedIds.length} 个视频的源数据吗？\n\n这将重新获取视频的详细信息，可能需要一些时间。`,
            () => {
                performBatchRefresh(selectedIds);
            }
        );
    }

    async function performBatchRefresh(selectedIds: string[]) {

        // 显示进度
        const progressModal = showBatchProgress('正在刷新源数据...', selectedIds.length);

        try {
            let completed = 0;
            const errors: string[] = [];

            for (const recordId of selectedIds) {
                try {
                    await refreshSingleRecord(recordId);
                    completed++;
                    updateBatchProgress(progressModal, completed, selectedIds.length, `已完成 ${completed}/${selectedIds.length}`);

                    // 添加延迟避免请求过快
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error: any) {
                    errors.push(`${recordId}: ${error.message}`);
                    console.error(`刷新记录 ${recordId} 失败:`, error);
                }
            }

            hideBatchProgress(progressModal);

            // 清空选择
            selectedRecords.clear();

            // 刷新显示
            updateFilteredRecords();
            render();
            updateBatchUI();

            if (errors.length > 0) {
                showMessage(`刷新完成，但有 ${errors.length} 个失败`, 'warn');
                console.log('刷新失败的项目:', errors);
            } else {
                showMessage(`成功刷新了 ${completed} 个视频的源数据！`, 'success');
            }

        } catch (error: any) {
            hideBatchProgress(progressModal);
            console.error('批量刷新失败:', error);
            showMessage(`批量刷新失败: ${error.message}`, 'error');

            // 即使失败也要刷新列表，因为可能有部分成功
            updateFilteredRecords();
            render();
            updateBatchUI();
        }
    }

    async function handleBatchDelete() {
        if (selectedRecords.size === 0) return;

        const selectedIds = Array.from(selectedRecords);

        showCustomConfirm(
            '批量删除确认',
            `确定要删除 ${selectedIds.length} 个视频记录吗？\n\n此操作不可撤销！删除后将无法恢复这些记录。`,
            () => {
                performBatchDelete(selectedIds);
            }
        );
    }

    async function performBatchDelete(selectedIds: string[]) {

        try {
            const recordsData = await chrome.storage.local.get(STORAGE_KEYS.VIEWED_RECORDS);
            const records = recordsData[STORAGE_KEYS.VIEWED_RECORDS] || {};

            // 删除选中的记录
            selectedIds.forEach(id => {
                delete records[id];
            });

            await chrome.storage.local.set({ [STORAGE_KEYS.VIEWED_RECORDS]: records });

            // 清空选择
            selectedRecords.clear();

            // 重新加载数据并刷新显示
            await reloadRecordsData();
            updateFilteredRecords();
            render();
            updateBatchUI();

            showMessage(`成功删除了 ${selectedIds.length} 个视频记录！`, 'success');

        } catch (error: any) {
            console.error('批量删除失败:', error);
            showMessage(`批量删除失败: ${error.message}`, 'error');

            // 即使失败也要重新加载数据并刷新列表
            await reloadRecordsData();
            updateFilteredRecords();
            render();
            updateBatchUI();
        }
    }



    // 自定义确认弹窗
    function showCustomConfirm(title: string, message: string, onConfirm: () => void, onCancel?: () => void): void {
        const modal = document.createElement('div');
        modal.className = 'custom-confirm-modal';
        modal.innerHTML = `
            <div class="custom-confirm-overlay"></div>
            <div class="custom-confirm-content">
                <div class="custom-confirm-header">
                    <h3>${title}</h3>
                </div>
                <div class="custom-confirm-body">
                    <p>${message}</p>
                </div>
                <div class="custom-confirm-footer">
                    <button class="custom-confirm-cancel">取消</button>
                    <button class="custom-confirm-ok">确定</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const overlay = modal.querySelector('.custom-confirm-overlay') as HTMLElement;
        const cancelBtn = modal.querySelector('.custom-confirm-cancel') as HTMLButtonElement;
        const okBtn = modal.querySelector('.custom-confirm-ok') as HTMLButtonElement;

        const closeModal = () => {
            modal.remove();
        };

        overlay.addEventListener('click', () => {
            closeModal();
            if (onCancel) onCancel();
        });

        cancelBtn.addEventListener('click', () => {
            closeModal();
            if (onCancel) onCancel();
        });

        okBtn.addEventListener('click', () => {
            closeModal();
            onConfirm();
        });

        // ESC键关闭
        const handleKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeModal();
                if (onCancel) onCancel();
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    }

    // 重新加载数据
    async function reloadRecordsData() {
        try {
            const recordsData = await chrome.storage.local.get(STORAGE_KEYS.VIEWED_RECORDS);
            const records = recordsData[STORAGE_KEYS.VIEWED_RECORDS] || {};

            // 更新STATE.records
            if (records && typeof records === 'object') {
                STATE.records = Object.values(records);
            } else {
                STATE.records = [];
            }

            // 确保 STATE.records 是数组
            if (!Array.isArray(STATE.records)) {
                STATE.records = [];
            }

            console.log(`重新加载了 ${STATE.records.length} 条记录`);
        } catch (error) {
            console.error('重新加载记录数据失败:', error);
            showMessage('重新加载数据失败', 'error');
        }
    }

    // 辅助函数
    async function refreshSingleRecord(recordId: string): Promise<void> {
        // 发送消息到background script刷新单个记录
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                type: 'refresh-record',
                videoId: recordId
            }, (response) => {
                if (response?.success) {
                    resolve();
                } else {
                    reject(new Error(response?.error || '刷新失败'));
                }
            });
        });
    }

    function showBatchProgress(title: string, total: number): HTMLElement {
        const modal = document.createElement('div');
        modal.className = 'batch-progress';
        modal.innerHTML = `
            <div class="batch-progress-text">${title}</div>
            <div class="batch-progress-bar">
                <div class="batch-progress-fill" style="width: 0%"></div>
            </div>
            <div class="batch-progress-details">0 / ${total}</div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    function updateBatchProgress(modal: HTMLElement, current: number, total: number, details: string) {
        const fill = modal.querySelector('.batch-progress-fill') as HTMLElement;
        const detailsElement = modal.querySelector('.batch-progress-details') as HTMLElement;

        const percentage = Math.round((current / total) * 100);
        fill.style.width = `${percentage}%`;
        detailsElement.textContent = details;
    }

    function hideBatchProgress(modal: HTMLElement) {
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }



    // 清理函数，在页面切换时调用
    return function cleanup() {
        removeTooltip();
        removeImageTooltip();
    };
}