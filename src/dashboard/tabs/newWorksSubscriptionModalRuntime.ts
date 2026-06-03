import type { ActorSubscription } from '../../types';
import { buildSubscriptionManagementModalHtml } from './newWorksSubscriptionModalViewModel';

type MessageType = 'success' | 'error' | 'info' | 'warn' | 'warning';

export interface SubscriptionManagementModalDeps {
  showAddSubscriptionModal(): void;
  toggleSubscription(actorId: string, enabled: boolean): Promise<void>;
  removeSubscription(actorId: string): Promise<void>;
  confirmRemove(actorName: string): Promise<boolean>;
  render(): Promise<void>;
  showMessage(message: string, type: MessageType): void;
  handleSingleSubscriptionCheck(subscription: ActorSubscription, button: HTMLButtonElement): Promise<void>;
  logInfo(message: string): void;
  logError(message: string, error: unknown): void;
  doc?: Document;
  win?: Window;
}

export function openSubscriptionManagementModal(
  subscriptions: ActorSubscription[],
  deps: SubscriptionManagementModalDeps,
): HTMLDivElement {
  const doc = deps.doc || document;
  const win = deps.win || window;
  const modal = doc.createElement('div');
  modal.className = 'subscription-management-modal';
  modal.innerHTML = buildSubscriptionManagementModalHtml(subscriptions);
  doc.body.appendChild(modal);

  let isClosing = false;
  const escHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape') closeModal();
  };
  const closeModal = () => {
    if (isClosing) return;
    isClosing = true;
    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
      overlay.classList.remove('visible');
      deps.logInfo('管理订阅弹窗: 已移除visible类，开始隐藏弹窗');
    }
    try { doc.removeEventListener('keydown', escHandler); } catch {}
    win.setTimeout(() => {
      modal.remove();
      doc.body.style.overflow = '';
    }, 200);
  };

  attachCloseActions(modal, closeModal, doc, escHandler);
  attachAddActorAction(modal, closeModal, deps, win);
  attachSubscriptionItemActions(modal, subscriptions, deps, doc, win);

  modal.style.display = 'block';
  doc.body.style.overflow = 'hidden';

  const overlay = modal.querySelector('.modal-overlay');
  if (overlay) {
    overlay.classList.add('visible');
    deps.logInfo('管理订阅弹窗: 已添加visible类，弹窗应该可见');
  }

  return modal;
}

function attachCloseActions(
  modal: HTMLDivElement,
  closeModal: () => void,
  doc: Document,
  escHandler: (event: KeyboardEvent) => void,
): void {
  const headerCloseBtn = modal.querySelector('.modal-close-btn') as HTMLButtonElement | null;
  headerCloseBtn?.setAttribute('type', 'button');
  headerCloseBtn?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    closeModal();
  }, { once: true });

  const footerCloseBtn = modal.querySelector('#subscriptionManagementClose') as HTMLButtonElement | null;
  footerCloseBtn?.setAttribute('type', 'button');
  footerCloseBtn?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    closeModal();
  }, { once: true });

  const overlayEl = modal.querySelector('.modal-overlay');
  overlayEl?.addEventListener('click', event => {
    if (event.target === overlayEl) {
      closeModal();
    }
  });
  doc.addEventListener('keydown', escHandler);
}

function attachAddActorAction(
  modal: HTMLDivElement,
  closeModal: () => void,
  deps: SubscriptionManagementModalDeps,
  win: Window,
): void {
  const addActorBtn = modal.querySelector('#subscriptionManagementAddActor') as HTMLButtonElement | null;
  addActorBtn?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    closeModal();
    win.setTimeout(() => {
      deps.showAddSubscriptionModal();
    }, 220);
  });
}

function attachSearchFilter(modal: HTMLDivElement, subscriptions: ActorSubscription[]): () => void {
  const searchInput = modal.querySelector('#subscriptionManagementSearch') as HTMLInputElement | null;
  const subscriptionItems = Array.from(modal.querySelectorAll('.subscription-item')) as HTMLElement[];
  const applySearchFilter = () => {
    const keyword = (searchInput?.value || '').trim().toLowerCase();
    let visibleCount = 0;

    subscriptionItems.forEach(item => {
      const nameEl = item.querySelector('.subscription-name');
      const actorName = (nameEl?.textContent || '').trim().toLowerCase();
      const matched = !keyword || actorName.includes(keyword);
      item.style.display = matched ? '' : 'none';
      if (matched) visibleCount++;
    });

    const summaryEl = modal.querySelector('.subscription-management-summary');
    if (summaryEl) {
      summaryEl.textContent = keyword
        ? `搜索结果 ${visibleCount} / ${subscriptions.length}`
        : `共 ${subscriptions.length} 个订阅演员`;
    }
  };
  searchInput?.addEventListener('input', applySearchFilter);
  return applySearchFilter;
}

function attachSubscriptionItemActions(
  modal: HTMLDivElement,
  subscriptions: ActorSubscription[],
  deps: SubscriptionManagementModalDeps,
  doc: Document,
  win: Window,
): void {
  const subscriptionItems = Array.from(modal.querySelectorAll('.subscription-item')) as HTMLElement[];
  const applySearchFilter = attachSearchFilter(modal, subscriptions);

  subscriptionItems.forEach(item => {
    const actorId = item.getAttribute('data-actor-id');
    if (!actorId) return;

    attachAvatarPreview(item, doc, win);
    attachToggle(item, actorId, deps);
    attachSingleCheck(item, actorId, subscriptions, deps);
    attachRemove(item, actorId, subscriptions, subscriptionItems, applySearchFilter, deps);
  });
}

function attachAvatarPreview(item: HTMLElement, doc: Document, win: Window): void {
  const avatarWrapper = item.querySelector('.subscription-avatar-wrapper') as HTMLElement | null;
  const avatarImg = avatarWrapper?.querySelector('.subscription-avatar') as HTMLImageElement | null;
  const avatarUrl = avatarImg?.src;
  if (!avatarWrapper || !avatarUrl) return;

  let preview: HTMLElement | null = null;
  let isHovering = false;
  const showPreview = () => {
    isHovering = true;
    preview = doc.createElement('div');
    preview.className = 'subscription-avatar-preview show';
    preview.innerHTML = `<img src="${avatarUrl}" alt="预览" />`;
    doc.body.appendChild(preview);

    const rect = avatarWrapper.getBoundingClientRect();
    const top = rect.top + rect.height / 2 - 100;
    const left = rect.right + 15;
    preview.style.top = `${top}px`;
    preview.style.left = `${left}px`;
  };

  const hidePreview = () => {
    isHovering = false;
    win.setTimeout(() => {
      if (!isHovering && preview) {
        preview.remove();
        preview = null;
      }
    }, 100);
  };

  avatarWrapper.addEventListener('mouseenter', showPreview);
  avatarWrapper.addEventListener('mouseleave', hidePreview);
}

function attachToggle(item: HTMLElement, actorId: string, deps: SubscriptionManagementModalDeps): void {
  const toggleSwitch = item.querySelector('[data-action="toggle"]') as HTMLInputElement | null;
  toggleSwitch?.addEventListener('change', async () => {
    try {
      await deps.toggleSubscription(actorId, toggleSwitch.checked);
      await deps.render();
    } catch (error) {
      deps.logError('切换订阅状态失败:', error);
      toggleSwitch.checked = !toggleSwitch.checked;
    }
  });
}

function attachSingleCheck(
  item: HTMLElement,
  actorId: string,
  subscriptions: ActorSubscription[],
  deps: SubscriptionManagementModalDeps,
): void {
  const checkBtn = item.querySelector('[data-action="check-single"]') as HTMLButtonElement | null;
  checkBtn?.addEventListener('click', async event => {
    event.preventDefault();
    event.stopPropagation();
    const subscription = subscriptions.find(sub => sub.actorId === actorId);
    if (!subscription) {
      deps.showMessage('未找到演员订阅信息', 'error');
      return;
    }
    await deps.handleSingleSubscriptionCheck(subscription, checkBtn);
  });
}

function attachRemove(
  item: HTMLElement,
  actorId: string,
  subscriptions: ActorSubscription[],
  subscriptionItems: HTMLElement[],
  applySearchFilter: () => void,
  deps: SubscriptionManagementModalDeps,
): void {
  const removeBtn = item.querySelector('[data-action="remove"]');
  removeBtn?.addEventListener('click', async () => {
    const actorName = subscriptions.find(sub => sub.actorId === actorId)?.actorName || '未知';
    const confirmed = await deps.confirmRemove(actorName);
    if (!confirmed) return;

    try {
      await deps.removeSubscription(actorId);
      item.remove();
      const index = subscriptionItems.indexOf(item);
      if (index >= 0) subscriptionItems.splice(index, 1);
      applySearchFilter();
      await deps.render();
      deps.showMessage(`已移除演员 ${actorName} 的订阅`, 'success');
    } catch (error) {
      deps.logError('移除订阅失败:', error);
      deps.showMessage('移除失败，请重试', 'error');
    }
  });
}
