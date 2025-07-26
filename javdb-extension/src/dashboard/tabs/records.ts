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

    let tooltipElement: HTMLPreElement | null = null;
    let imageTooltipElement: HTMLDivElement | null = null;

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
                case 'createdAt_desc':
                    return b.createdAt - a.createdAt;
                case 'createdAt_asc':
                    return a.createdAt - b.createdAt;
                case 'updatedAt_asc':
                    return a.updatedAt - b.updatedAt;
                case 'id_asc':
                    return a.id.localeCompare(b.id);
                case 'id_desc':
                    return b.id.localeCompare(a.id);
                case 'updatedAt_desc':
                default:
                    return b.updatedAt - a.updatedAt;
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
            refreshButton.title = '同步到云端';

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
                ? `<div class="video-tags">${record.tags.map(tag => `<span class="video-tag">${tag}</span>`).join('')}</div>`
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

    // 清理函数，在页面切换时调用
    return function cleanup() {
        removeTooltip();
        removeImageTooltip();
    };
}