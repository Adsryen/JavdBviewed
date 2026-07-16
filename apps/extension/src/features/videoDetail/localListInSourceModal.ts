/**
 * @file localListInSourceModal.ts
 * @description 源站「存入清單」modal 中注入拓展本地清单 checkbox
 * @module features/videoDetail
 */
import './localListInSourceModal.css';
import { STATE, log } from '../contentState';
import { extractVideoIdFromPage } from '../../platform/browser';
import { sendRuntimeMessage } from '../../platform/browser/runtimeMessages';
import { showToast } from '../../platform/browser/toast';
import type { ListRecord, VideoRecord } from '../../types';

const SECTION_ID = 'jdb-ext-local-lists';
const MODAL_SELECTOR = '#modal-save-list';
const STYLE_ID = 'jdb-ext-local-lists-style';

type LocalList = Pick<ListRecord, 'id' | 'name' | 'source'>;

/**
 * 在源站「存入清單」modal 中展示拓展本地清单
 */
export class LocalListInSourceModalEnhancer {
  private videoId: string | null = null;
  private record: VideoRecord | null = null;
  private observer: MutationObserver | null = null;
  private clickHandler: ((event: Event) => void) | null = null;
  private lastActive = false;
  private rendering = false;
  private initialized = false;

  public async init(): Promise<void> {
    try {
      if (!this.isFeatureEnabled()) {
        log('[LocalListInSourceModal] Feature disabled in settings');
        return;
      }

      this.videoId = extractVideoIdFromPage();
      if (!this.videoId) {
        log('[LocalListInSourceModal] No video ID found');
        return;
      }

      if (this.initialized) {
        return;
      }
      this.initialized = true;

      this.ensureStyles();
      this.bindModalOpenListeners();
      await this.syncIfModalActive();
      log('[LocalListInSourceModal] Initialized for video:', this.videoId);
    } catch (error) {
      console.error('[LocalListInSourceModal] Init error:', error);
    }
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler, true);
      this.clickHandler = null;
    }
    this.removeSection();
    this.record = null;
    this.videoId = null;
    this.lastActive = false;
    this.initialized = false;
  }

  private isFeatureEnabled(): boolean {
    const ve = STATE.settings?.videoEnhancement as { enabled?: boolean; enableLocalListInSourceModal?: boolean } | undefined;
    return ve?.enabled === true && ve?.enableLocalListInSourceModal !== false;
  }

  private ensureStyles(): void {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    // CSS 由 bundler 注入；这里仅作为兜底标记，避免重复探测
    const marker = document.createElement('meta');
    marker.id = STYLE_ID;
    marker.setAttribute('data-jdb-ext', 'local-lists-style');
    document.head.appendChild(marker);
  }

  private bindModalOpenListeners(): void {
    this.clickHandler = (event: Event) => {
      const target = event.target as Element | null;
      if (!target) {
        return;
      }
      const trigger = target.closest('[data-target="modal-save-list"]');
      if (!trigger) {
        return;
      }
      // 源站 modal 打开有轻微延迟，分几轮探测
      window.setTimeout(() => {
        void this.syncIfModalActive();
      }, 50);
      window.setTimeout(() => {
        void this.syncIfModalActive();
      }, 250);
      window.setTimeout(() => {
        void this.syncIfModalActive();
      }, 600);
    };
    document.addEventListener('click', this.clickHandler, true);

    this.observer = new MutationObserver(() => {
      void this.syncIfModalActive();
    });

    const modal = document.querySelector(MODAL_SELECTOR);
    const observeTarget = modal || document.body;
    this.observer.observe(observeTarget, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true,
    });
  }

  private isModalActive(): boolean {
    const modal = document.querySelector(MODAL_SELECTOR);
    if (!modal) {
      return false;
    }
    return modal.classList.contains('is-active');
  }

  private async syncIfModalActive(): Promise<void> {
    if (!this.isFeatureEnabled()) {
      this.removeSection();
      this.lastActive = false;
      return;
    }

    const active = this.isModalActive();
    if (!active) {
      this.lastActive = false;
      return;
    }

    // 每次从关闭到打开，或 section 缺失时都刷新
    const section = document.getElementById(SECTION_ID);
    if (!this.lastActive || !section) {
      this.lastActive = true;
      await this.renderSection();
      return;
    }
  }

  private removeSection(): void {
    document.getElementById(SECTION_ID)?.remove();
  }

  private async loadLocalLists(): Promise<LocalList[]> {
    const response = await sendRuntimeMessage<{ success?: boolean; records?: ListRecord[]; error?: string }>({
      type: 'DB:LISTS_GET_ALL_NORMALIZED',
    });
    if (!response?.success || !Array.isArray(response.records)) {
      throw new Error(response?.error || '加载本地清单失败');
    }
    return response.records
      .filter((item) => item && item.source === 'local' && typeof item.id === 'string' && typeof item.name === 'string')
      .map((item) => ({ id: item.id, name: item.name, source: item.source }));
  }

  private async loadRecord(): Promise<VideoRecord | null> {
    if (!this.videoId) {
      return null;
    }
    const response = await sendRuntimeMessage<{ success?: boolean; record?: VideoRecord; error?: string }>({
      type: 'DB:VIEWED_GET',
      payload: { id: this.videoId },
    });
    if (response?.success && response.record) {
      this.record = response.record;
      return response.record;
    }
    this.record = null;
    return null;
  }

  private resolveDashboardListsUrl(): string {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
        return chrome.runtime.getURL('dashboard/dashboard.html#tab-lists');
      }
    } catch {
      // ignore
    }
    return 'dashboard/dashboard.html#tab-lists';
  }

  private getModalBody(): HTMLElement | null {
    const modal = document.querySelector(MODAL_SELECTOR);
    if (!modal) {
      return null;
    }
    return (
      modal.querySelector<HTMLElement>('.modal-card-body')
      || modal.querySelector<HTMLElement>('.modal-content')
      || (modal as HTMLElement)
    );
  }

  private async renderSection(): Promise<void> {
    if (this.rendering) {
      return;
    }
    this.rendering = true;
    try {
      const body = this.getModalBody();
      if (!body) {
        log('[LocalListInSourceModal] Modal body not found');
        return;
      }

      this.removeSection();

      const section = document.createElement('div');
      section.id = SECTION_ID;
      section.className = 'jdb-ext-local-lists';
      section.setAttribute('data-jdb-ext', 'local-lists');
      section.innerHTML = `
        <div class="jdb-ext-local-lists__title">Jav助手清单</div>
        <div class="jdb-ext-local-lists__body control is-grouped">
          <p class="jdb-ext-local-lists__loading">正在加载本地清单…</p>
        </div>
      `;


      const footer = body.querySelector('.modal-card-foot, .modal-footer, footer');
      if (footer && footer.parentElement === body) {
        body.insertBefore(section, footer);
      } else {
        body.appendChild(section);
      }

      const [lists, record] = await Promise.all([
        this.loadLocalLists(),
        this.loadRecord(),
      ]);

      // modal 可能在加载期间关闭
      if (!this.isModalActive() || !document.getElementById(SECTION_ID)) {
        return;
      }

      const bodyEl = section.querySelector('.jdb-ext-local-lists__body');
      if (!bodyEl) {
        return;
      }

      if (lists.length === 0) {
        const dashboardUrl = this.resolveDashboardListsUrl();
        bodyEl.innerHTML = `
          <p class="jdb-ext-local-lists__empty">
            还没有本地清单。
            <a class="jdb-ext-local-lists__link" href="${dashboardUrl}" target="_blank" rel="noopener noreferrer">去创建</a>
          </p>
        `;
        return;
      }

      const listIds = new Set(Array.isArray(record?.listIds) ? record.listIds : []);
      const fragment = document.createDocumentFragment();
      for (const list of lists) {
        const control = document.createElement('p');
        control.className = 'control';

        const label = document.createElement('label');
        label.className = 'checkbox jdb-ext-local-lists__item';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.dataset.listId = list.id;
        input.dataset.listName = list.name;
        input.checked = listIds.has(list.id);

        // 与源站 label.checkbox 一致：勾选框后直接跟文本节点
        const nameText = document.createTextNode(` ${list.name}`);

        // 保留隐藏 span 供测试与无障碍读名称
        const nameSpan = document.createElement('span');
        nameSpan.className = 'jdb-ext-local-lists__name';
        nameSpan.textContent = list.name;
        nameSpan.hidden = true;

        label.appendChild(input);
        label.appendChild(nameText);
        label.appendChild(nameSpan);
        control.appendChild(label);
        fragment.appendChild(control);
      }

      bodyEl.innerHTML = '';
      bodyEl.appendChild(fragment);
      this.bindCheckboxEvents(section);

    } catch (error) {
      console.error('[LocalListInSourceModal] Failed to render section:', error);
      const bodyEl = document.querySelector(`#${SECTION_ID} .jdb-ext-local-lists__body`);
      if (bodyEl) {
        bodyEl.innerHTML = `<p class="jdb-ext-local-lists__error">本地清单加载失败，请稍后重试。</p>`;
      }
    } finally {
      this.rendering = false;
    }
  }

  private bindCheckboxEvents(section: HTMLElement): void {
    const inputs = section.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-list-id]');
    inputs.forEach((input) => {
      input.addEventListener('change', () => {
        void this.handleCheckboxChange(input);
      });
    });
  }

  private async ensureRecord(): Promise<VideoRecord> {
    if (this.record) {
      return this.record;
    }

    const existing = await this.loadRecord();
    if (existing) {
      return existing;
    }

    if (!this.videoId) {
      throw new Error('missing video id');
    }

    const title =
      document.querySelector('h2.title.is-4 strong')?.textContent?.trim()
      || document.title.replace(/ \| JavDB.*/, '').trim()
      || this.videoId;

    const now = Date.now();
    const record: VideoRecord = {
      id: this.videoId,
      title,
      status: 'browsed',
      tags: [],
      createdAt: now,
      updatedAt: now,
      listIds: [],
    };

    const putResponse = await sendRuntimeMessage<{ success?: boolean; error?: string }>({
      type: 'DB:VIEWED_PUT',
      payload: {
        record: {
          ...record,
          tags: [...(record.tags || [])],
          listIds: [...(record.listIds || [])],
        },
      },
    });
    if (!putResponse?.success) {
      throw new Error(putResponse?.error || '创建影片记录失败');
    }

    this.record = {
      ...record,
      tags: [...(record.tags || [])],
      listIds: [...(record.listIds || [])],
    };
    return this.record;
  }

  private async handleCheckboxChange(input: HTMLInputElement): Promise<void> {
    const listId = input.dataset.listId;
    const listName = input.dataset.listName || '清单';
    if (!listId || !this.videoId) {
      return;
    }

    const checked = input.checked;
    input.disabled = true;

    try {
      await this.ensureRecord();

      const response = await sendRuntimeMessage<{ success?: boolean; error?: string }>({
        type: 'DB:VIEWED_PATCH_LIST',
        payload: {
          videoId: this.videoId,
          listId,
          action: checked ? 'add' : 'remove',
        },
      });

      if (!response?.success) {
        throw new Error(response?.error || '更新清单失败');
      }

      if (this.record) {
        const ids = new Set(Array.isArray(this.record.listIds) ? this.record.listIds : []);
        if (checked) {
          ids.add(listId);
        } else {
          ids.delete(listId);
        }
        this.record.listIds = Array.from(ids);
        this.record.updatedAt = Date.now();
      }

      showToast(checked ? `已加入「${listName}」` : `已移出「${listName}」`, 'success');
    } catch (error) {
      console.error('[LocalListInSourceModal] Checkbox change failed:', error);
      input.checked = !checked;
      showToast('操作失败，请重试', 'error');
    } finally {
      input.disabled = false;
    }
  }
}

export const localListInSourceModalEnhancer = new LocalListInSourceModalEnhancer();
