import type { ListRecord } from '../../types';
import { dbListsPut, dbListsDelete, dbListsGetAllNormalized } from '../dbClient';
import { showMessage } from '../ui/toast';
import { showConfirm } from '../components/confirmModal';

export class ListsTab {
    public isInitialized: boolean = false;
    private lists: ListRecord[] = [];
    // 当前正在重命名的清单 ID（null 表示无）
    private renamingId: string | null = null;
    // 是否正在显示新建输入行
    private isCreating: boolean = false;

    async initialize(): Promise<void> {
        if (this.isInitialized) return;
        try {
            this.bindEvents();
            await this.loadAndRender();
            this.isInitialized = true;
        } catch (e: any) {
            console.error('[ListsTab] initialize failed', e);
            showMessage('初始化清单页面失败', 'error');
        }
    }

    private bindEvents(): void {
        const refreshBtn = document.getElementById('listsRefreshBtn') as HTMLButtonElement | null;
        const goSyncBtn = document.getElementById('listsGoSyncBtn') as HTMLButtonElement | null;
        const searchInput = document.getElementById('listsSearchInput') as HTMLInputElement | null;
        const createBtn = document.getElementById('listsCreateBtn') as HTMLButtonElement | null;

        refreshBtn?.addEventListener('click', async () => { await this.loadAndRender(); });
        goSyncBtn?.addEventListener('click', () => { location.hash = '#tab-sync'; });
        searchInput?.addEventListener('input', () => { this.render(); });

        // 新建清单：展开内嵌输入行
        createBtn?.addEventListener('click', () => {
            if (this.isCreating) return;
            this.isCreating = true;
            this.renamingId = null;
            this.render();
            // 聚焦新建输入框
            setTimeout(() => {
                const input = document.getElementById('listsInlineCreateInput') as HTMLInputElement | null;
                input?.focus();
            }, 30);
        });

        // 我的清单 / 收藏清单 点击跳转
        const mine = document.getElementById('listsMineContainer');
        const fav = document.getElementById('listsFavContainer');
        const onClickNav = (e: Event) => {
            const target = e.target as HTMLElement | null;
            const item = target?.closest('.lists-item') as HTMLElement | null;
            if (!item) return;
            const id = item.getAttribute('data-list-id') || '';
            if (!id) return;
            this.navigateToRecordsWithList(id);
        };
        mine?.addEventListener('click', onClickNav);
        fav?.addEventListener('click', onClickNav);

        // 本地清单：事件委托
        const localContainer = document.getElementById('listsLocalContainer');
        localContainer?.addEventListener('click', (e: Event) => {
            const target = e.target as HTMLElement | null;

            // 重命名确认
            const renameConfirmBtn = target?.closest('.list-rename-confirm-btn') as HTMLElement | null;
            if (renameConfirmBtn) {
                const listId = renameConfirmBtn.getAttribute('data-list-id') || '';
                this.commitRename(listId);
                return;
            }

            // 重命名取消
            const renameCancelBtn = target?.closest('.list-rename-cancel-btn') as HTMLElement | null;
            if (renameCancelBtn) {
                this.renamingId = null;
                this.render();
                return;
            }

            // 重命名按钮
            const renameBtn = target?.closest('.list-rename-btn') as HTMLElement | null;
            if (renameBtn) {
                const listId = renameBtn.getAttribute('data-list-id') || '';
                this.renamingId = listId;
                this.isCreating = false;
                this.render();
                setTimeout(() => {
                    const input = document.getElementById(`listsRenameInput_${listId}`) as HTMLInputElement | null;
                    input?.focus();
                    input?.select();
                }, 30);
                return;
            }

            // 删除按钮
            const deleteBtn = target?.closest('.list-delete-btn') as HTMLElement | null;
            if (deleteBtn) {
                const listId = deleteBtn.getAttribute('data-list-id') || '';
                const list = this.lists.find(l => String(l.id) === listId);
                if (list) this.deleteLocalList(list);
                return;
            }

            // 新建确认
            const createConfirmBtn = target?.closest('.list-create-confirm-btn') as HTMLElement | null;
            if (createConfirmBtn) {
                this.commitCreate();
                return;
            }

            // 新建取消
            const createCancelBtn = target?.closest('.list-create-cancel-btn') as HTMLElement | null;
            if (createCancelBtn) {
                this.isCreating = false;
                this.render();
                return;
            }

            // 点击条目跳转（排除编辑状态）
            const item = target?.closest('.lists-item') as HTMLElement | null;
            if (!item) return;
            if (item.classList.contains('lists-item-editing')) return;
            const id = item.getAttribute('data-list-id') || '';
            if (!id) return;
            this.navigateToRecordsWithList(id);
        });

        // 键盘事件委托（Enter/Escape）
        localContainer?.addEventListener('keydown', (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (target?.id === 'listsInlineCreateInput') {
                if (e.key === 'Enter') { e.preventDefault(); this.commitCreate(); }
                if (e.key === 'Escape') { this.isCreating = false; this.render(); }
            }
            if (target?.id?.startsWith('listsRenameInput_')) {
                const listId = target.id.replace('listsRenameInput_', '');
                if (e.key === 'Enter') { e.preventDefault(); this.commitRename(listId); }
                if (e.key === 'Escape') { this.renamingId = null; this.render(); }
            }
        });
    }

    private async loadAndRender(): Promise<void> {
        try {
            this.lists = await dbListsGetAllNormalized();
        } catch (e) {
            this.lists = [];
        }
        this.render();
    }

    private render(): void {
        const localEl = document.getElementById('listsLocalContainer') as HTMLElement | null;
        const mineEl = document.getElementById('listsMineContainer') as HTMLElement | null;
        const favEl = document.getElementById('listsFavContainer') as HTMLElement | null;
        const localCountEl = document.getElementById('listsLocalCount') as HTMLElement | null;
        const mineCountEl = document.getElementById('listsMineCount') as HTMLElement | null;
        const favCountEl = document.getElementById('listsFavCount') as HTMLElement | null;
        const emptyTip = document.getElementById('listsEmptyTip') as HTMLElement | null;
        const searchInput = document.getElementById('listsSearchInput') as HTMLInputElement | null;
        if (!mineEl || !favEl) return;

        const q = String(searchInput?.value || '').trim().toLowerCase();
        const match = (l: ListRecord) => {
            if (!q) return true;
            return String(l.name || '').toLowerCase().includes(q) || String(l.id || '').toLowerCase().includes(q);
        };

        const local = (this.lists || []).filter(l => l && l.source === 'local' && match(l)).sort((a, b) => String(a.name).localeCompare(String(b.name)));
        const mine = (this.lists || []).filter(l => l && l.source !== 'local' && l.type === 'mine' && match(l)).sort((a, b) => String(a.name).localeCompare(String(b.name)));
        const fav = (this.lists || []).filter(l => l && l.source !== 'local' && l.type === 'favorite' && match(l)).sort((a, b) => String(a.name).localeCompare(String(b.name)));

        if (localEl) {
            const items = local.map(l => this.renderItem(l)).join('');
            const createRow = this.isCreating ? this.renderCreateRow() : '';
            const empty = !items && !createRow ? '<div class="lists-empty">暂无本地清单</div>' : '';
            localEl.innerHTML = items + createRow + empty;
        }
        mineEl.innerHTML = mine.map(l => this.renderItem(l)).join('') || '<div class="lists-empty">暂无</div>';
        favEl.innerHTML = fav.map(l => this.renderItem(l)).join('') || '<div class="lists-empty">暂无</div>';

        if (localCountEl) localCountEl.textContent = String(local.length);
        if (mineCountEl) mineCountEl.textContent = String(mine.length);
        if (favCountEl) favCountEl.textContent = String(fav.length);

        const total = (this.lists || []).length;
        if (emptyTip) {
            emptyTip.style.display = total === 0 && !this.isCreating ? '' : 'none';
            if (total === 0 && !this.isCreating) emptyTip.textContent = '暂无清单数据，请先到"数据同步"里执行"同步清单"。';
        }
    }

    /** 渲染内嵌新建输入行 */
    private renderCreateRow(): string {
        return `
            <div class="lists-item lists-item-inline-edit">
                <input id="listsInlineCreateInput" class="lists-inline-input" type="text" placeholder="输入清单名称" maxlength="50" />
                <div class="list-inline-actions">
                    <button class="list-create-confirm-btn list-inline-btn list-inline-confirm" title="确认"><i class="fas fa-check"></i></button>
                    <button class="list-create-cancel-btn list-inline-btn list-inline-cancel" title="取消"><i class="fas fa-times"></i></button>
                </div>
            </div>
        `;
    }

    private renderItem(l: ListRecord): string {
        const count = typeof l.moviesCount === 'number' ? l.moviesCount : undefined;
        const meta = count !== undefined ? `${count} 部` : '';
        const safeName = this.escapeHtml(String(l.name || l.id));
        const safeMeta = this.escapeHtml(meta);
        const safeId = this.escapeHtml(String(l.id));

        // 来源徽章
        let sourceBadge = '';
        if (l.source === 'javdb') {
            sourceBadge = `<span class="list-source-badge list-source-javdb">JavDB</span>`;
        } else if (l.source === 'local') {
            sourceBadge = `<span class="list-source-badge list-source-local">本地</span>`;
        }

        // 本地清单：重命名状态下渲染内嵌输入
        if (l.source === 'local' && this.renamingId === String(l.id)) {
            return `
                <div class="lists-item lists-item-inline-edit lists-item-editing" data-list-id="${safeId}">
                    <input id="listsRenameInput_${safeId}" class="lists-inline-input" type="text" value="${safeName}" maxlength="50" />
                    <div class="list-inline-actions">
                        <button class="list-rename-confirm-btn list-inline-btn list-inline-confirm" data-list-id="${safeId}" title="确认"><i class="fas fa-check"></i></button>
                        <button class="list-rename-cancel-btn list-inline-btn list-inline-cancel" title="取消"><i class="fas fa-times"></i></button>
                    </div>
                </div>
            `;
        }

        // 本地清单操作按钮
        let actionBtns = '';
        if (l.source === 'local') {
            actionBtns = `
                <div class="list-item-actions">
                    <button class="list-rename-btn" data-list-id="${safeId}" title="重命名"><i class="fas fa-pen"></i></button>
                    <button class="list-delete-btn" data-list-id="${safeId}" title="删除"><i class="fas fa-trash"></i></button>
                </div>`;
        }

        return `
            <div class="lists-item" data-list-id="${safeId}" title="点击筛选番号库：${safeName}">
                <div class="lists-item-title">${safeName}${sourceBadge}</div>
                <div class="lists-item-meta">${safeMeta}</div>
                ${actionBtns}
            </div>
        `;
    }

    private escapeHtml(s: string): string {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    validateName(name: string, excludeId?: string): string | null {
        if (name.trim() === '') return '清单名称不能为空';
        const duplicate = this.lists.some(l => {
            if (excludeId && String(l.id) === String(excludeId)) return false;
            return String(l.name) === name.trim();
        });
        if (duplicate) return '清单名称已存在';
        return null;
    }

    private async commitCreate(): Promise<void> {
        const input = document.getElementById('listsInlineCreateInput') as HTMLInputElement | null;
        const name = (input?.value || '').trim();
        const error = this.validateName(name);
        if (error) {
            showMessage(error, 'warning');
            input?.focus();
            return;
        }
        const record: ListRecord = {
            id: 'local_' + Date.now(),
            name,
            type: 'mine',
            source: 'local',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        try {
            await dbListsPut(record);
            this.isCreating = false;
            await this.loadAndRender();
            showMessage(`清单"${name}"创建成功`, 'success');
        } catch (e) {
            console.error('[ListsTab] commitCreate failed', e);
            showMessage('创建清单失败', 'error');
        }
    }

    private async commitRename(id: string): Promise<void> {
        const input = document.getElementById(`listsRenameInput_${id}`) as HTMLInputElement | null;
        const name = (input?.value || '').trim();
        const error = this.validateName(name, id);
        if (error) {
            showMessage(error, 'warning');
            input?.focus();
            return;
        }
        const list = this.lists.find(l => String(l.id) === id);
        if (!list) return;
        try {
            await dbListsPut({ ...list, name, updatedAt: Date.now() });
            this.renamingId = null;
            await this.loadAndRender();
        } catch (e) {
            console.error('[ListsTab] commitRename failed', e);
            showMessage('重命名失败', 'error');
        }
    }

    private async deleteLocalList(list: ListRecord): Promise<void> {
        const confirmed = await showConfirm({
            title: '删除清单',
            message: `确定要删除清单"${list.name}"吗？删除清单不会删除番号库中的视频。`,
            confirmText: '删除',
            cancelText: '取消',
            type: 'danger',
        });
        if (!confirmed) return;
        try {
            await dbListsDelete(String(list.id));
            await this.loadAndRender();
            showMessage(`清单"${list.name}"已删除`, 'success');
        } catch (e) {
            console.error('[ListsTab] deleteLocalList failed', e);
            showMessage('删除清单失败', 'error');
        }
    }

    private async navigateToRecordsWithList(listId: string): Promise<void> {
        const list = this.lists.find(l => String(l.id) === String(listId));
        if (list && typeof list.moviesCount === 'number' && list.moviesCount === 0) {
            showMessage('该清单为空，无需跳转', 'info');
            return;
        }
        location.hash = '#tab-records';
        const desired = `listid:${String(listId)}`;
        for (let i = 0; i < 40; i++) {
            await new Promise((r) => setTimeout(r, 80));
            const tab = document.getElementById('tab-records') as HTMLElement | null;
            const input = document.getElementById('searchInput') as HTMLInputElement | null;
            if (!tab || !tab.classList.contains('active') || !input) continue;
            input.value = desired;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            try { input.focus(); } catch {}
            break;
        }
    }
}

export const listsTab = new ListsTab();
