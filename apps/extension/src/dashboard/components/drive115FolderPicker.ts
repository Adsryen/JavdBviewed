import { getDrive115V2Service, type Drive115V2FileListItem, type Drive115V2PathItem } from '../../features/drive115/v2';

export type Drive115FolderSelection = {
  cid: string;
  name: string;
  path: string;
};

type PickerState = {
  currentCid: string;
  currentName: string;
  currentPath: string;
  pathItems: Drive115V2PathItem[];
  folders: Drive115V2FileListItem[];
  page: number;
  loading: boolean;
  error: string;
};

const FOLDER_PAGE_SIZE = 20;

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getFolderId(item: Drive115V2FileListItem | Drive115V2PathItem): string {
  const anyItem: any = item || {};
  return String(anyItem.fid ?? anyItem.file_id ?? anyItem.cid ?? '').trim();
}

function getFolderName(item: Drive115V2FileListItem | Drive115V2PathItem): string {
  const anyItem: any = item || {};
  return String(anyItem.fn ?? anyItem.name ?? anyItem.file_name ?? anyItem.fid ?? anyItem.cid ?? '未命名文件夹');
}

function isFolder(item: Drive115V2FileListItem): boolean {
  return String((item as any)?.fc ?? (item as any)?.file_category ?? '') === '0';
}

function buildPath(pathItems: Drive115V2PathItem[], currentName: string): string {
  const parts = pathItems.map(getFolderName).filter(Boolean);
  if (currentName && parts[parts.length - 1] !== currentName) parts.push(currentName);
  return parts.length ? `/${parts.join('/')}` : '/';
}

function normalizeRootCid(cid: string): string {
  const value = String(cid || '').trim();
  return value === '0' ? '' : value;
}

export function openDrive115FolderPicker(options: {
  initialCid?: string;
  onSelect: (selection: Drive115FolderSelection) => void | Promise<void>;
}): void {
  const existing = document.getElementById('drive115FolderPickerOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'drive115FolderPickerOverlay';
  overlay.className = 'c-modal-overlay drive115-folder-picker-overlay';
  overlay.innerHTML = `
    <div class="c-modal c-modal--lg drive115-folder-picker-modal" role="dialog" aria-modal="true" aria-labelledby="drive115FolderPickerTitle">
      <div class="c-modal__header">
        <div class="drive115-folder-picker-heading">
          <span class="drive115-folder-picker-mark"><i class="fas fa-folder-open"></i></span>
          <div>
            <span class="drive115-folder-picker-eyebrow">Drive 115</span>
            <h3 class="c-modal__title" id="drive115FolderPickerTitle">选择 115 下载目录</h3>
          </div>
        </div>
        <button type="button" class="c-modal__close" id="drive115FolderPickerClose" aria-label="关闭">&times;</button>
      </div>
      <div class="c-modal__body">
        <div class="drive115-folder-picker-pathbar">
          <div class="drive115-folder-picker-current-wrap">
            <span>当前目录</span>
            <strong class="drive115-folder-picker-current" id="drive115FolderPickerCurrent">/</strong>
            <small id="drive115FolderPickerCid">根目录 ID 0</small>
          </div>
          <div class="drive115-folder-picker-actions">
            <button type="button" class="button-like secondary" id="drive115FolderPickerRoot" title="回到根目录" aria-label="回到根目录">
              <i class="fas fa-home"></i>
            </button>
            <button type="button" class="button-like secondary" id="drive115FolderPickerRefresh" title="刷新当前目录" aria-label="刷新当前目录">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>
        <div class="drive115-folder-picker-breadcrumb" id="drive115FolderPickerBreadcrumb"></div>
        <div class="drive115-folder-picker-status" id="drive115FolderPickerStatus"></div>
        <div class="drive115-folder-picker-list" id="drive115FolderPickerList"></div>
        <div class="drive115-folder-picker-pagination" id="drive115FolderPickerPagination"></div>
      </div>
      <div class="c-modal__footer">
        <span class="drive115-folder-picker-selected" id="drive115FolderPickerSelected">将保存到根目录</span>
        <button type="button" class="button-like secondary" id="drive115FolderPickerCancel">取消</button>
        <button type="button" class="button-like" id="drive115FolderPickerUse">
          <i class="fas fa-check"></i>
          使用此目录
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const initialCid = normalizeRootCid(options.initialCid || '');
  const state: PickerState = {
    currentCid: initialCid,
    currentName: initialCid ? `目录 ${initialCid}` : '根目录',
    currentPath: '/',
    pathItems: [],
    folders: [],
    page: 1,
    loading: false,
    error: '',
  };

  const close = () => overlay.remove();
  const closeBtn = overlay.querySelector<HTMLButtonElement>('#drive115FolderPickerClose');
  const cancelBtn = overlay.querySelector<HTMLButtonElement>('#drive115FolderPickerCancel');
  const rootBtn = overlay.querySelector<HTMLButtonElement>('#drive115FolderPickerRoot');
  const refreshBtn = overlay.querySelector<HTMLButtonElement>('#drive115FolderPickerRefresh');
  const useBtn = overlay.querySelector<HTMLButtonElement>('#drive115FolderPickerUse');
  const listEl = overlay.querySelector<HTMLDivElement>('#drive115FolderPickerList');
  const statusEl = overlay.querySelector<HTMLDivElement>('#drive115FolderPickerStatus');
  const currentEl = overlay.querySelector<HTMLSpanElement>('#drive115FolderPickerCurrent');
  const currentCidEl = overlay.querySelector<HTMLElement>('#drive115FolderPickerCid');
  const breadcrumbEl = overlay.querySelector<HTMLDivElement>('#drive115FolderPickerBreadcrumb');
  const selectedEl = overlay.querySelector<HTMLSpanElement>('#drive115FolderPickerSelected');
  const paginationEl = overlay.querySelector<HTMLDivElement>('#drive115FolderPickerPagination');

  closeBtn?.addEventListener('click', close);
  cancelBtn?.addEventListener('click', close);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });

  const renderPagination = (totalPages: number) => {
    if (!paginationEl) return;
    if (state.loading || state.error || totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }
    paginationEl.innerHTML = `
      <button type="button" class="drive115-folder-page-btn" data-page="${state.page - 1}" ${state.page <= 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i>
        上一页
      </button>
      <span class="drive115-folder-page-info">第 ${state.page} / ${totalPages} 页</span>
      <button type="button" class="drive115-folder-page-btn" data-page="${state.page + 1}" ${state.page >= totalPages ? 'disabled' : ''}>
        下一页
        <i class="fas fa-chevron-right"></i>
      </button>
    `;
    paginationEl.querySelectorAll<HTMLButtonElement>('.drive115-folder-page-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextPage = Number(btn.dataset.page || state.page);
        if (!Number.isFinite(nextPage)) return;
        state.page = Math.min(totalPages, Math.max(1, nextPage));
        render();
      });
    });
  };

  const render = () => {
    const folders = state.folders;
    const totalPages = Math.max(1, Math.ceil(folders.length / FOLDER_PAGE_SIZE));
    state.page = Math.min(totalPages, Math.max(1, state.page));
    const pageStart = (state.page - 1) * FOLDER_PAGE_SIZE;
    const pageFolders = folders.slice(pageStart, pageStart + FOLDER_PAGE_SIZE);

    if (currentEl) currentEl.textContent = state.currentPath;
    if (currentCidEl) currentCidEl.textContent = state.currentCid ? `目录 ID ${state.currentCid}` : '根目录 ID 0';
    if (selectedEl) selectedEl.textContent = `将保存到：${state.currentPath}（${state.currentCid || '0'}）`;
    if (useBtn) useBtn.disabled = state.loading;
    if (statusEl) {
      if (state.loading) {
        statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>正在加载文件夹</span>';
      } else if (state.error) {
        statusEl.innerHTML = `<i class="fas fa-exclamation-circle"></i><span>${escapeHtml(state.error)}</span>`;
      } else {
        const rangeText = folders.length > FOLDER_PAGE_SIZE
          ? `，显示 ${pageStart + 1}-${pageStart + pageFolders.length}`
          : '';
        statusEl.innerHTML = `<i class="fas fa-folder-tree"></i><span>${folders.length} 个子文件夹${rangeText}</span>`;
      }
      statusEl.dataset.kind = state.error ? 'error' : 'info';
    }

    if (breadcrumbEl) {
      const crumbs = state.pathItems
        .map((item) => {
          const cid = getFolderId(item);
          const name = getFolderName(item);
          return `<button type="button" class="drive115-folder-crumb" data-cid="${escapeHtml(cid)}">${escapeHtml(name)}</button>`;
        })
        .join('<span class="drive115-folder-separator">/</span>');
      breadcrumbEl.innerHTML = `<button type="button" class="drive115-folder-crumb" data-cid="">根目录</button>${crumbs ? '<span class="drive115-folder-separator">/</span>' + crumbs : ''}`;
      breadcrumbEl.querySelectorAll<HTMLButtonElement>('.drive115-folder-crumb').forEach((btn) => {
        btn.addEventListener('click', () => loadFolder(btn.dataset.cid || ''));
      });
    }

    if (!listEl) return;
    if (state.loading) {
      listEl.innerHTML = '<div class="drive115-folder-empty"><i class="fas fa-spinner fa-spin"></i><span>正在加载文件夹</span></div>';
      renderPagination(totalPages);
      return;
    }
    if (state.error) {
      listEl.innerHTML = `<div class="drive115-folder-empty"><i class="fas fa-exclamation-circle"></i><span>${escapeHtml(state.error)}</span></div>`;
      renderPagination(totalPages);
      return;
    }
    if (folders.length === 0) {
      listEl.innerHTML = '<div class="drive115-folder-empty"><i class="fas fa-folder"></i><span>当前目录没有子文件夹</span></div>';
      renderPagination(totalPages);
      return;
    }
    listEl.innerHTML = pageFolders.map((folder) => {
      const cid = getFolderId(folder);
      const name = getFolderName(folder);
      return `
        <button type="button" class="drive115-folder-row" data-cid="${escapeHtml(cid)}" data-name="${escapeHtml(name)}">
          <span class="drive115-folder-row-icon"><i class="fas fa-folder"></i></span>
          <span class="drive115-folder-row-main">
            <strong>${escapeHtml(name)}</strong>
          </span>
          <small class="drive115-folder-row-id">ID ${escapeHtml(cid)}</small>
          <i class="fas fa-chevron-right drive115-folder-row-arrow"></i>
        </button>
      `;
    }).join('');
    listEl.querySelectorAll<HTMLButtonElement>('.drive115-folder-row').forEach((btn) => {
      btn.addEventListener('click', () => loadFolder(btn.dataset.cid || '', btn.dataset.name || ''));
    });
    renderPagination(totalPages);
  };

  const loadFolder = async (cid: string, name?: string) => {
    const normalizedCid = normalizeRootCid(cid);
    state.loading = true;
    state.error = '';
    render();
    try {
      const svc = getDrive115V2Service();
      const tokenRet = await svc.getValidAccessToken();
      if (!tokenRet.success || !tokenRet.accessToken) {
        throw new Error((tokenRet as any)?.message || '无法获取 115 授权信息');
      }
      const ret = await svc.listFiles({
        accessToken: tokenRet.accessToken,
        cid: normalizedCid,
        limit: 1150,
        offset: 0,
        show_dir: 1,
        stdir: 1,
        cur: 1,
      });
      if (!ret.success) throw new Error(ret.message || '获取文件夹列表失败');
      const folders = (ret.data || []).filter(isFolder);
      state.currentCid = normalizedCid;
      state.pathItems = ret.path || [];
      state.folders = folders;
      state.page = 1;
      state.currentName = normalizedCid ? (name || (state.pathItems.length ? getFolderName(state.pathItems[state.pathItems.length - 1]) : `目录 ${normalizedCid}`)) : '根目录';
      state.currentPath = buildPath(state.pathItems, state.currentCid ? state.currentName : '');
      state.loading = false;
      render();
    } catch (error: any) {
      state.loading = false;
      state.error = error?.message || '获取文件夹列表失败';
      state.folders = [];
      render();
    }
  };

  rootBtn?.addEventListener('click', () => loadFolder(''));
  refreshBtn?.addEventListener('click', () => loadFolder(state.currentCid, state.currentName));
  useBtn?.addEventListener('click', async () => {
    await options.onSelect({
      cid: state.currentCid || '0',
      name: state.currentName,
      path: state.currentPath,
    });
    close();
  });

  loadFolder(state.currentCid).catch(() => {});
}
