import { STATE } from '../state';
import { VIDEO_STATUS, STORAGE_KEYS } from '../../utils/config';
import type { VideoRecord, VideoStatus } from '../../types';
import { showMessage } from '../ui/toast';
import { showConfirmationModal } from '../ui/modal';
import { dbViewedPage, dbViewedStats, dbViewedDelete, dbViewedBulkDelete, dbViewedQuery, dbViewedPut, type ViewedPageParams, type ViewedStats, type ViewedQueryParams } from '../dbClient';

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

    // Advanced search elements
    const advToggleBtn = document.getElementById('advancedSearchToggle') as HTMLButtonElement;
    const advPanel = document.getElementById('advancedSearchPanel') as HTMLDivElement;
    const advAddBtn = document.getElementById('addConditionBtn') as HTMLButtonElement;
    const advApplyBtn = document.getElementById('applyConditionsBtn') as HTMLButtonElement;
    const advResetBtn = document.getElementById('resetConditionsBtn') as HTMLButtonElement;
    const advConditionsEl = document.getElementById('advConditions') as HTMLDivElement;
    const advPresetNameInput = document.getElementById('advPresetName') as HTMLInputElement;
    const advPresetSelect = document.getElementById('advPresetSelect') as HTMLSelectElement;
    const saveAdvPresetBtn = document.getElementById('saveAdvPresetBtn') as HTMLButtonElement;
    const loadAdvPresetBtn = document.getElementById('loadAdvPresetBtn') as HTMLButtonElement;
    const deleteAdvPresetBtn = document.getElementById('deleteAdvPresetBtn') as HTMLButtonElement;
    const quickTimeField = document.getElementById('quickTimeField') as HTMLSelectElement;
    const quickTimeValue = document.getElementById('quickTimeValue') as HTMLInputElement;
    const quickTimeUnit = document.getElementById('quickTimeUnit') as HTMLSelectElement;
    const addQuickTimeBtn = document.getElementById('addQuickTimeBtn') as HTMLButtonElement;

    // 批量操作相关元素
    const batchOperations = document.getElementById('batchOperations') as HTMLDivElement;
    const selectAllCheckbox = document.getElementById('selectAllCheckbox') as HTMLInputElement;
    const selectedCount = document.getElementById('selectedCount') as HTMLSpanElement;
    const batchRefreshBtn = document.getElementById('batchRefreshBtn') as HTMLButtonElement;
    const batchDeleteBtn = document.getElementById('batchDeleteBtn') as HTMLButtonElement;
    const cancelBatchBtn = document.getElementById('cancelBatchBtn') as HTMLButtonElement;

    let imageTooltipElement: HTMLDivElement | null = null;

    // 选择状态
    let selectedRecords = new Set<string>();

    // Tags filter state
    let selectedTags = new Set<string>();
    let allTags = new Set<string>();

    // Advanced search state
    type FieldKey = 'id' | 'title' | 'status' | 'tags' | 'releaseDate' | 'createdAt' | 'updatedAt' | 'javdbUrl' | 'javdbImage';
    type Comparator =
        | 'contains' | 'equals' | 'starts_with' | 'ends_with'
        | 'empty' | 'not_empty'
        | 'eq' | 'gt' | 'gte' | 'lt' | 'lte'
        | 'includes' | 'length_eq' | 'length_gt' | 'length_gte' | 'length_lt';
    interface AdvCondition { id: string; field: FieldKey; op: Comparator; value?: string }
    let advConditions: AdvCondition[] = [];

    type AdvPresets = Record<string, AdvCondition[]>;

    async function loadAdvPresets(): Promise<AdvPresets> {
        const data = await chrome.storage.local.get(STORAGE_KEYS.ADV_SEARCH_PRESETS);
        return (data && data[STORAGE_KEYS.ADV_SEARCH_PRESETS]) || {};
    }

    async function saveAdvPresets(presets: AdvPresets): Promise<void> {
        await chrome.storage.local.set({ [STORAGE_KEYS.ADV_SEARCH_PRESETS]: presets });
    }

    async function refreshPresetSelect(): Promise<void> {
        try {
            const presets = await loadAdvPresets();
            const current = advPresetSelect.value;
            advPresetSelect.innerHTML = '<option value="">选择已保存方案...</option>';
            Object.keys(presets).sort().forEach(name => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                advPresetSelect.appendChild(opt);
            });
            // 保持选择不变
            if (current && presets[current]) {
                advPresetSelect.value = current;
            }
        } catch (e) {
            console.error('刷新高级搜索方案下拉失败:', e);
        }
    }

    function createAdvConditionRow(condition?: AdvCondition) {
        const rowId = condition?.id || `cond_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const row = document.createElement('div');
        row.className = 'adv-condition-row';
        row.dataset.id = rowId;

        const fieldSelect = document.createElement('select');
        fieldSelect.className = 'adv-field';
        const fieldOptions: { key: FieldKey; label: string }[] = [
            { key: 'id', label: '番号(id)' },
            { key: 'title', label: '标题(title)' },
            { key: 'status', label: '状态(status)' },
            { key: 'tags', label: '标签(tags)' },
            { key: 'releaseDate', label: '发行日期(releaseDate)' },
            { key: 'createdAt', label: '创建时间(createdAt)' },
            { key: 'updatedAt', label: '更新时间(updatedAt)' },
            { key: 'javdbUrl', label: 'JavDB链接(javdbUrl)' },
            { key: 'javdbImage', label: '封面链接(javdbImage)' },
        ];
        fieldOptions.forEach(opt => {
            const o = document.createElement('option');
            o.value = opt.key;
            o.textContent = opt.label;
            fieldSelect.appendChild(o);
        });

        const opSelect = document.createElement('select');
        opSelect.className = 'adv-operator';

        const valueInput = document.createElement('input');
        valueInput.className = 'adv-value';
        valueInput.type = 'text';
        valueInput.placeholder = '比较值';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'button-like adv-remove';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.title = '移除此条件';

        function setOperatorsForField(field: FieldKey) {
            opSelect.innerHTML = '';
            const addOps = (ops: { value: Comparator; label: string }[]) => {
                ops.forEach(op => {
                    const o = document.createElement('option');
                    o.value = op.value;
                    o.textContent = op.label;
                    opSelect.appendChild(o);
                });
            };
            if (field === 'id' || field === 'title' || field === 'status' || field === 'releaseDate' || field === 'javdbUrl' || field === 'javdbImage') {
                addOps([
                    { value: 'contains', label: '包含' },
                    { value: 'equals', label: '等于' },
                    { value: 'starts_with', label: '开头是' },
                    { value: 'ends_with', label: '结尾是' },
                    { value: 'empty', label: '为空' },
                    { value: 'not_empty', label: '非空' },
                ]);
            } else if (field === 'createdAt' || field === 'updatedAt') {
                addOps([
                    { value: 'eq', label: '等于(时间戳/毫秒)' },
                    { value: 'gt', label: '大于' },
                    { value: 'gte', label: '大于等于' },
                    { value: 'lt', label: '小于' },
                    { value: 'lte', label: '小于等于' },
                    { value: 'empty', label: '为空' },
                    { value: 'not_empty', label: '非空' },
                ]);
            } else if (field === 'tags') {
                addOps([
                    { value: 'includes', label: '包含某标签' },
                    { value: 'length_eq', label: '标签数量 = ' },
                    { value: 'length_gt', label: '标签数量 > ' },
                    { value: 'length_gte', label: '标签数量 ≥ ' },
                    { value: 'length_lt', label: '标签数量 < ' },
                    { value: 'empty', label: '为空' },
                    { value: 'not_empty', label: '非空' },
                ]);
            }
        }

        function updateValueVisibility() {
            const op = opSelect.value as Comparator;
            if (op === 'empty' || op === 'not_empty') {
                valueInput.style.display = 'none';
            } else {
                valueInput.style.display = '';
            }
        }

        fieldSelect.addEventListener('change', () => {
            setOperatorsForField(fieldSelect.value as FieldKey);
            updateValueVisibility();
        });
        opSelect.addEventListener('change', updateValueVisibility);
        removeBtn.addEventListener('click', () => {
            const id = row.dataset.id!;
            advConditions = advConditions.filter(c => c.id !== id);
            row.remove();
            currentPage = 1; updateFilteredRecords(); render();
        });

        // initial values
        fieldSelect.value = (condition?.field || 'id') as string;
        setOperatorsForField(fieldSelect.value as FieldKey);
        if (condition?.op) opSelect.value = condition.op;
        if (condition?.value !== undefined) valueInput.value = condition.value;
        updateValueVisibility();

        row.appendChild(fieldSelect);
        row.appendChild(opSelect);
        row.appendChild(valueInput);
        row.appendChild(removeBtn);
        advConditionsEl.appendChild(row);
    }

    function parseAdvConditionsFromUI(): AdvCondition[] {
        const rows = Array.from(advConditionsEl.querySelectorAll('.adv-condition-row')) as HTMLDivElement[];
        return rows.map(row => {
            const id = row.dataset.id || `cond_${Math.random()}`;
            const field = (row.querySelector('.adv-field') as HTMLSelectElement).value as FieldKey;
            const op = (row.querySelector('.adv-operator') as HTMLSelectElement).value as Comparator;
            const valueEl = row.querySelector('.adv-value') as HTMLInputElement;
            const value = (op === 'empty' || op === 'not_empty') ? undefined : (valueEl?.value ?? '');
            return { id, field, op, value };
        });
    }

    function clearAdvRows(): void {
        advConditionsEl.innerHTML = '';
    }

    function rebuildAdvRows(conditions: AdvCondition[]): void {
        clearAdvRows();
        conditions.forEach(cond => createAdvConditionRow(cond));
    }

    function evaluateCondition(record: VideoRecord, cond: AdvCondition): boolean {
        const getField = (key: FieldKey): any => {
            switch (key) {
                case 'id': return record.id ?? '';
                case 'title': return record.title ?? '';
                case 'status': return record.status ?? '';
                case 'tags': return Array.isArray(record.tags) ? record.tags : [];
                case 'releaseDate': return record.releaseDate ?? '';
                case 'createdAt': return record.createdAt;
                case 'updatedAt': return record.updatedAt;
                case 'javdbUrl': return record.javdbUrl ?? '';
                case 'javdbImage': return record.javdbImage ?? '';
            }
        };

        const v = getField(cond.field);
        const op = cond.op;
        const compareVal = cond.value ?? '';

        // helpers
        const isEmpty = (val: any): boolean => {
            if (Array.isArray(val)) return val.length === 0;
            if (val === null || val === undefined) return true;
            if (typeof val === 'string') return val.trim() === '';
            return false;
        };

        if (op === 'empty') return isEmpty(v);
        if (op === 'not_empty') return !isEmpty(v);

        if (cond.field === 'id' || cond.field === 'title' || cond.field === 'status' || cond.field === 'releaseDate' || cond.field === 'javdbUrl' || cond.field === 'javdbImage') {
            const sv = String(v).toLowerCase();
            const cv = String(compareVal).toLowerCase();
            switch (op) {
                case 'contains': return sv.includes(cv);
                case 'equals': return sv === cv;
                case 'starts_with': return sv.startsWith(cv);
                case 'ends_with': return sv.endsWith(cv);
                default: return true;
            }
        }

        if (cond.field === 'createdAt' || cond.field === 'updatedAt') {
            const nv = Number(v);
            const c = Number(compareVal);
            if (Number.isNaN(nv)) return false;
            switch (op) {
                case 'eq': return nv === c;
                case 'gt': return nv > c;
                case 'gte': return nv >= c;
                case 'lt': return nv < c;
                case 'lte': return nv <= c;
                default: return true;
            }
        }

        if (cond.field === 'tags') {
            const arr: string[] = Array.isArray(v) ? v : [];
            switch (op) {
                case 'includes': return compareVal ? arr.includes(compareVal) : false;
                case 'length_eq': return arr.length === Number(compareVal || 0);
                case 'length_gt': return arr.length > Number(compareVal || 0);
                case 'length_gte': return arr.length >= Number(compareVal || 0);
                case 'length_lt': return arr.length < Number(compareVal || 0);
                default: return true;
            }
        }

        return true;
    }

    // 注：高级过滤直接集成在 updateFilteredRecords 中，无需额外包装函数

    if (!searchInput || !videoList || !sortSelect || !recordsPerPageSelect || !paginationContainer) return;

    let currentPage = 1;
    let recordsPerPage = STATE.settings.recordsPerPage || 10;
    let filteredRecords: VideoRecord[] = [];
    // IDB 分页模式
    let serverModeActive = false;
    let serverPageItems: VideoRecord[] = [];
    let serverTotal = 0;

    recordsPerPageSelect.value = String(recordsPerPage);

    // 一律优先使用 IDB（复杂条件用查询，简单条件用分页），失败再回退到内存
    function shouldUseIDB(): boolean {
        return true;
    }

    function parseSort(): { orderBy: 'updatedAt' | 'createdAt' | 'id' | 'title'; order: 'asc' | 'desc' } | null {
        const sortVal = (sortSelect?.value || 'updatedAt_desc');
        if (sortVal.startsWith('updatedAt_')) {
            return { orderBy: 'updatedAt', order: sortVal.endsWith('_asc') ? 'asc' : 'desc' };
        }
        if (sortVal.startsWith('createdAt_')) {
            return { orderBy: 'createdAt', order: sortVal.endsWith('_asc') ? 'asc' : 'desc' };
        }
        if (sortVal.startsWith('id_')) {
            return { orderBy: 'id', order: sortVal.endsWith('_asc') ? 'asc' : 'desc' };
        }
        if (sortVal.startsWith('title_')) {
            return { orderBy: 'title', order: sortVal.endsWith('_asc') ? 'asc' : 'desc' };
        }
        return null;
    }

    async function renderServerPage(): Promise<void> {
        try {
            serverModeActive = true;
            const sort = parseSort();
            const searchTerm = (searchInput?.value || '').trim();
            const hasTags = selectedTags.size > 0;
            const adv = advConditions.length > 0 ? advConditions.map(c => ({ field: c.field, op: c.op, value: c.value })) : [];
            const statusVal = (filterSelect?.value || 'all') as 'all' | VideoStatus;

            try { videoList.innerHTML = '<li class="empty-list">加载中...</li>'; } catch {}

            let items: VideoRecord[] = [];
            let total = 0;

            // 复杂条件或按 id/title 排序 -> 后台查询
            if (searchTerm || hasTags || adv.length > 0 || !sort || sort.orderBy === 'id' || sort.orderBy === 'title') {
                const queryParams: ViewedQueryParams = {
                    search: searchTerm || undefined,
                    status: statusVal,
                    tags: Array.from(selectedTags),
                    orderBy: sort ? sort.orderBy : 'updatedAt',
                    order: sort ? sort.order : 'desc',
                    offset: (currentPage - 1) * recordsPerPage,
                    limit: recordsPerPage,
                    adv,
                };
                const resp = await dbViewedQuery(queryParams);
                items = resp.items || [];
                total = resp.total || 0;
            } else {
                // 简单条件 -> 高效分页
                const params: ViewedPageParams = {
                    offset: (currentPage - 1) * recordsPerPage,
                    limit: recordsPerPage,
                    orderBy: sort.orderBy,
                    order: sort.order,
                } as ViewedPageParams;
                if (statusVal !== 'all') (params as any).status = statusVal;
                const resp = await dbViewedPage(params);
                items = resp.items || [];
                total = resp.total || 0;
            }

            serverPageItems = Array.isArray(items) ? items : [];
            serverTotal = Number.isFinite(total) ? total : 0;
            renderVideoList();
            renderPagination();
        } catch (e) {
            console.warn('[RecordsTab] IDB 查询/分页失败', e);
            // 不回退本地模式，仅提示错误，保留当前 UI 状态
            try { videoList.innerHTML = '<li class="empty-list">加载失败：IndexedDB 查询异常，请稍后重试</li>'; } catch {}
            showMessage('IDB 查询失败，请稍后重试', 'error');
        }
    }

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

                const basicMatch = matchesSearch && matchesFilter && matchesTags;
                if (!basicMatch) return false;

                // Advanced search conditions (AND)
                return advConditions.length === 0 || advConditions.every(c => evaluateCondition(record, c));
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

            const sourceRecords = serverModeActive ? serverPageItems : (Array.isArray(filteredRecords) ? filteredRecords : []);

            if (sourceRecords.length === 0) {
                videoList.innerHTML = '<li class="empty-list">没有符合条件的记录。</li>';
                return;
            }

            const startIndex = serverModeActive ? 0 : (currentPage - 1) * recordsPerPage;
            const recordsToRender = serverModeActive ? sourceRecords : sourceRecords.slice(startIndex, startIndex + recordsPerPage);

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
                            img.alt = String(engine.name || '');
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
                                    await dbViewedDelete(record.id);
                                    // 从内存中移除并更新选择集
                                    const recordIndex = STATE.records.findIndex(r => r.id === record.id);
                                    if (recordIndex !== -1) STATE.records.splice(recordIndex, 1);
                                    selectedRecords.delete(record.id);
                                    // 重新渲染（服务端分页/查询会刷新）
                                    render();
                                    showMessage(`记录 "${record.id}" 已删除`, 'success');
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
                            img.src = record.javdbImage ?? chrome.runtime.getURL('assets/alternate-search.png');
                            img.alt = String(record.title || '');
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

    function renderPagination() {
        paginationContainer.innerHTML = '';
        const totalCount = serverModeActive ? serverTotal : filteredRecords.length;
        const pageCount = Math.ceil(totalCount / recordsPerPage);
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
        const useIDB = shouldUseIDB();
        serverModeActive = useIDB;
        if (useIDB) {
            try { videoList.innerHTML = '<li class="empty-list">加载中...</li>'; } catch {}
            renderServerPage().finally(() => updateStats());
            return;
        }
        updateFilteredRecords();
        renderVideoList();
        renderPagination();
        updateStats();
    }

    async function updateStats() {
        const statsContainer = document.getElementById('recordsStatsContainer');
        if (!statsContainer) return;

        // 在 IDB 模式优先使用后端统计，更准确更快；否则回退到内存
        let stats: { total: number; viewed: number; browsed: number; want: number; thisWeek: number; thisMonth: number };
        if (serverModeActive) {
            try {
                const s: ViewedStats = await dbViewedStats();
                stats = {
                    total: s.total || 0,
                    viewed: (s.byStatus?.viewed as any) ?? 0,
                    browsed: (s.byStatus?.browsed as any) ?? 0,
                    want: (s.byStatus?.want as any) ?? 0,
                    thisWeek: s.last7Days || 0,
                    thisMonth: s.last30Days || 0,
                };
            } catch {
                // 回退：内存统计
                const now = new Date();
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                stats = {
                    total: STATE.records.length,
                    viewed: STATE.records.filter(r => r.status === 'viewed').length,
                    browsed: STATE.records.filter(r => r.status === 'browsed').length,
                    want: STATE.records.filter(r => r.status === 'want').length,
                    thisWeek: STATE.records.filter(r => r.createdAt && r.createdAt >= oneWeekAgo.getTime()).length,
                    thisMonth: STATE.records.filter(r => r.createdAt && r.createdAt >= oneMonthAgo.getTime()).length
                };
            }
        } else {
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            stats = {
                total: STATE.records.length,
                viewed: STATE.records.filter(r => r.status === 'viewed').length,
                browsed: STATE.records.filter(r => r.status === 'browsed').length,
                want: STATE.records.filter(r => r.status === 'want').length,
                thisWeek: STATE.records.filter(r => r.createdAt && r.createdAt >= oneWeekAgo.getTime()).length,
                thisMonth: STATE.records.filter(r => r.createdAt && r.createdAt >= oneMonthAgo.getTime()).length
            };
        }

        statsContainer.innerHTML = `
            <div class="stat-card new-works-stat">
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">总番号数</div>
            </div>
            <div class="stat-card new-works-stat">
                <div class="stat-value">${stats.viewed}</div>
                <div class="stat-label">已观看</div>
            </div>
            <div class="stat-card new-works-stat">
                <div class="stat-value">${stats.browsed}</div>
                <div class="stat-label">已浏览</div>
            </div>
            <div class="stat-card new-works-stat">
                <div class="stat-value">${stats.want}</div>
                <div class="stat-label">我想看</div>
            </div>
            <div class="stat-card new-works-stat">
                <div class="stat-value">${stats.thisWeek}</div>
                <div class="stat-label">本周新增</div>
            </div>
            <div class="stat-card new-works-stat">
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

    // Advanced search event listeners
    if (advToggleBtn && advPanel) {
        advToggleBtn.addEventListener('click', () => {
            advPanel.style.display = advPanel.style.display === 'none' ? 'block' : 'none';
        });
    }

    if (advAddBtn) {
        advAddBtn.addEventListener('click', () => {
            const newCond: AdvCondition = { id: `cond_${Date.now()}`, field: 'id', op: 'contains', value: '' };
            advConditions.push(newCond);
            createAdvConditionRow(newCond);
        });
    }

    if (advApplyBtn) {
        advApplyBtn.addEventListener('click', () => {
            advConditions = parseAdvConditionsFromUI();
            currentPage = 1;
            updateFilteredRecords();
            render();
        });
    }

    if (advResetBtn) {
        advResetBtn.addEventListener('click', () => {
            advConditions = [];
            advConditionsEl.innerHTML = '';
            currentPage = 1;
            updateFilteredRecords();
            render();
        });
    }

    // Preset handlers
    if (saveAdvPresetBtn) {
        saveAdvPresetBtn.addEventListener('click', async () => {
            const name = (advPresetNameInput?.value || '').trim();
            if (!name) {
                showMessage('请输入方案名称', 'warn');
                return;
            }
            const presets = await loadAdvPresets();
            const conditions = parseAdvConditionsFromUI();
            presets[name] = conditions;
            await saveAdvPresets(presets);
            showMessage(`方案 "${name}" 已保存`, 'success');
            await refreshPresetSelect();
            advPresetSelect.value = name;
        });
    }

    if (loadAdvPresetBtn) {
        loadAdvPresetBtn.addEventListener('click', async () => {
            const name = advPresetSelect?.value || '';
            const presets = await loadAdvPresets();
            if (!name || !presets[name]) {
                showMessage('请选择要载入的方案', 'warn');
                return;
            }
            advConditions = presets[name];
            rebuildAdvRows(advConditions);
            currentPage = 1;
            updateFilteredRecords();
            render();
            showMessage(`已载入方案 "${name}"`, 'success');
        });
    }

    if (deleteAdvPresetBtn) {
        deleteAdvPresetBtn.addEventListener('click', async () => {
            const name = advPresetSelect?.value || '';
            const presets = await loadAdvPresets();
            if (!name || !presets[name]) {
                showMessage('请选择要删除的方案', 'warn');
                return;
            }
            delete presets[name];
            await saveAdvPresets(presets);
            await refreshPresetSelect();
            advPresetSelect.value = '';
            showMessage(`方案 "${name}" 已删除`, 'success');
        });
    }

    // Quick relative time condition
    if (addQuickTimeBtn) {
        addQuickTimeBtn.addEventListener('click', () => {
            const field = (quickTimeField?.value || 'createdAt') as FieldKey;
            const n = parseInt(quickTimeValue?.value || '0', 10);
            const unit = quickTimeUnit?.value || 'days';
            if (Number.isNaN(n) || n <= 0) {
                showMessage('请输入有效的数字 N', 'warn');
                return;
            }
            const now = Date.now();
            const delta = unit === 'hours' ? n * 60 * 60 * 1000 : n * 24 * 60 * 60 * 1000;
            const since = now - delta;
            const cond: AdvCondition = { id: `cond_${Date.now()}`, field, op: 'gte', value: String(since) } as any;
            advConditions.push(cond);
            createAdvConditionRow(cond);
            currentPage = 1;
            updateFilteredRecords();
            render();
        });
    }

    // 初始化预置下拉
    refreshPresetSelect();

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

                // 如果 ID 发生变化，先删除旧记录
                if (originalId !== newId) {
                    // 检查新ID是否已存在
                    const existingRecord = STATE.records.find(r => r.id === newId);
                    if (existingRecord) {
                        showMessage(`ID "${newId}" 已存在，请使用其他ID`, 'error');
                        return;
                    }
                    try { await dbViewedDelete(originalId); } catch {}
                }

                // 写入（或更新）新记录
                await dbViewedPut(updatedRecord);

                // 同步内存
                const idx = STATE.records.findIndex(r => r.id === originalId);
                if (idx !== -1) {
                    STATE.records.splice(idx, 1, updatedRecord);
                } else {
                    STATE.records.push(updatedRecord);
                }
                if (originalId !== newId) {
                    // 确保移除旧 id 的残留
                    for (let i = STATE.records.length - 1; i >= 0; i--) {
                        if (STATE.records[i].id === originalId) STATE.records.splice(i, 1);
                    }
                    showMessage(`记录ID从 "${originalId}" 更改为 "${newId}"`, 'success');
                } else {
                    showMessage(`记录 "${updatedRecord.id}" 已更新`, 'success');
                }

                // 刷新视图
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
            // 选择当前页面的所有记录（IDB 分页或内存分页）
            const currentRecords = serverModeActive
                ? serverPageItems
                : filteredRecords.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);
            currentRecords.forEach(record => selectedRecords.add(record.id));
        } else {
            // 取消选择当前页面的所有记录（IDB 分页或内存分页）
            const currentRecords = serverModeActive
                ? serverPageItems
                : filteredRecords.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);
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

        // 更新全选复选框状态（IDB 分页或内存分页）
        const currentRecords = serverModeActive
            ? serverPageItems
            : filteredRecords.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);
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

    // 辅助函数
    async function refreshSingleRecord(recordId: string): Promise<void> {
        // 发送消息到 background script 刷新单个记录
        return new Promise((resolve, reject) => {
            try {
                chrome.runtime.sendMessage({
                    type: 'refresh-record',
                    videoId: recordId,
                }, (response) => {
                    if (response?.success) {
                        resolve();
                    } else {
                        reject(new Error(response?.error || '刷新失败'));
                    }
                });
            } catch (e: any) {
                reject(new Error(e?.message || '刷新失败'));
            }
        });
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
            await dbViewedBulkDelete(selectedIds);

            // 更新内存中的 STATE.records
            const idSet = new Set(selectedIds);
            if (Array.isArray(STATE.records)) {
                STATE.records = STATE.records.filter(r => !idSet.has(r.id));
            } else {
                STATE.records = [];
            }

            // 清空选择并刷新
            selectedRecords.clear();
            render();
            updateBatchUI();
            showMessage(`成功删除了 ${selectedIds.length} 个视频记录！`, 'success');
        } catch (error: any) {
            console.error('批量删除失败:', error);
            showMessage(`批量删除失败: ${error.message}`, 'error');
            // 尝试刷新视图以保持同步
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

}