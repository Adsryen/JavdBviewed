import type { ListRecord } from '../../types';
import { dbListsGetAll } from '../dbClient';
import { showMessage } from '../ui/toast';

export class ListsTab {
    public isInitialized: boolean = false;
    private lists: ListRecord[] = [];

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

        refreshBtn?.addEventListener('click', async () => {
            await this.loadAndRender();
        });

        goSyncBtn?.addEventListener('click', () => {
            location.hash = '#tab-sync';
        });

        searchInput?.addEventListener('input', () => {
            this.render();
        });

        const mine = document.getElementById('listsMineContainer');
        const fav = document.getElementById('listsFavContainer');
        const onClick = (e: Event) => {
            const target = e.target as HTMLElement | null;
            const item = target?.closest('.p-lists__item') as HTMLElement | null;
            if (!item) return;
            const id = item.getAttribute('data-list-id') || '';
            if (!id) return;
            this.navigateToRecordsWithList(id);
        };
        mine?.addEventListener('click', onClick);
        fav?.addEventListener('click', onClick);
    }

    private async loadAndRender(): Promise<void> {
        try {
            this.lists = await dbListsGetAll();
        } catch (e) {
            this.lists = [];
        }
        this.render();
    }

    private render(): void {
        const mineEl = document.getElementById('listsMineContainer') as HTMLElement | null;
        const favEl = document.getElementById('listsFavContainer') as HTMLElement | null;
        const emptyTip = document.getElementById('listsEmptyTip') as HTMLElement | null;
        const searchInput = document.getElementById('listsSearchInput') as HTMLInputElement | null;
        if (!mineEl || !favEl) return;

        const q = String(searchInput?.value || '').trim().toLowerCase();
        const match = (l: ListRecord) => {
            if (!q) return true;
            const n = String(l.name || '').toLowerCase();
            const id = String(l.id || '').toLowerCase();
            return n.includes(q) || id.includes(q);
        };

        const mine = (this.lists || []).filter(l => l && l.type === 'mine' && match(l)).sort((a, b) => String(a.name).localeCompare(String(b.name)));
        const fav = (this.lists || []).filter(l => l && l.type === 'favorite' && match(l)).sort((a, b) => String(a.name).localeCompare(String(b.name)));

        mineEl.innerHTML = mine.map(l => this.renderItem(l)).join('') || '<div class="p-lists__empty">暂无</div>';
        favEl.innerHTML = fav.map(l => this.renderItem(l)).join('') || '<div class="p-lists__empty">暂无</div>';

        const total = (this.lists || []).length;
        if (emptyTip) {
            if (total === 0) {
                emptyTip.style.display = '';
                emptyTip.textContent = '暂无清单数据，请先到“数据同步”里执行“同步清单”。';
            } else {
                emptyTip.style.display = 'none';
                emptyTip.textContent = '';
            }
        }
    }

    private renderItem(l: ListRecord): string {
        const count = typeof l.moviesCount === 'number' ? l.moviesCount : undefined;
        const meta = count !== undefined ? `${count} 部` : '';
        const safeName = this.escapeHtml(String(l.name || l.id));
        const safeMeta = this.escapeHtml(meta);
        return `
            <div class="p-lists__item" data-list-id="${this.escapeHtml(String(l.id))}" title="点击筛选番号库：${safeName}">
                <div class="p-lists__item-title">${safeName}</div>
                <div class="p-lists__item-meta">${safeMeta}</div>
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

    private async navigateToRecordsWithList(listId: string): Promise<void> {
        // 检查清单是否为空
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
