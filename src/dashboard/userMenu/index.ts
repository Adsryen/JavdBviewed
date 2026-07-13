import { initUserProfileSection } from '../userProfile';

const HELP_URL = 'https://jbd.we-together.club/';
const GITHUB_URL = 'https://github.com/lmixture/JavdBviewed';
const TELEGRAM_URL = 'https://t.me/javdbviewed';

let boundRoot: HTMLElement | null = null;
let cleanupMenuEvents: (() => void) | null = null;

export function initDashboardUserMenu(): void {
  const root = document.getElementById('dashboard-user-menu-root');
  if (!root) return;
  if (boundRoot === root && root.dataset.userMenuInitialized === 'true') return;

  cleanupMenuEvents?.();
  cleanupMenuEvents = null;
  if (boundRoot) {
    delete boundRoot.dataset.userMenuInitialized;
  }

  root.innerHTML = `
    <div class="dashboard-user-menu" data-open="false">
      <button id="dashboard-user-menu-trigger" class="dashboard-user-menu-trigger" type="button" aria-haspopup="menu" aria-expanded="false" title="账号与信息">
        <span class="dashboard-user-menu-avatar" aria-hidden="true"><i class="fas fa-user-circle"></i></span>
        <span class="dashboard-user-menu-caret" aria-hidden="true"><i class="fas fa-chevron-down"></i></span>
      </button>
      <div id="dashboard-user-menu-popover" class="dashboard-user-menu-popover" role="menu" aria-labelledby="dashboard-user-menu-trigger" hidden>
        <div class="dashboard-user-menu-scroll">
          <div id="user-profile-section"></div>
          <div class="dashboard-user-menu-actions" aria-label="快捷入口">
            <button type="button" class="dashboard-user-menu-action" data-user-menu-action="settings">
              <i class="fas fa-cog"></i><span>设置中心</span>
            </button>
            <button type="button" class="dashboard-user-menu-action" data-user-menu-action="drive115">
              <img src="../assets/115-logo.svg" alt="" /><span>115 设置</span>
            </button>
            <button type="button" class="dashboard-user-menu-action" data-user-menu-action="about">
              <i class="fas fa-info-circle"></i><span>关于与版本</span>
            </button>
            <button type="button" class="dashboard-user-menu-action" data-user-menu-action="help">
              <i class="fas fa-question-circle"></i><span>帮助文档</span>
            </button>
          </div>
          <div class="dashboard-user-menu-links" aria-label="项目链接">
            <button type="button" class="dashboard-user-menu-link" data-user-menu-action="github" title="打开 GitHub 项目">
              <i class="fab fa-github"></i><span>GitHub</span>
            </button>
            <button type="button" class="dashboard-user-menu-link" data-user-menu-action="telegram" title="加入 Telegram 群组">
              <i class="fab fa-telegram"></i><span>Telegram</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  cleanupMenuEvents = bindMenuEvents(root);
  initUserProfileSection();
  root.dataset.userMenuInitialized = 'true';
  boundRoot = root;
}

function bindMenuEvents(root: HTMLElement): () => void {
  const host = root.querySelector<HTMLElement>('.dashboard-user-menu');
  const trigger = root.querySelector<HTMLButtonElement>('#dashboard-user-menu-trigger');
  const popover = root.querySelector<HTMLElement>('#dashboard-user-menu-popover');
  if (!host || !trigger || !popover) return () => {};

  const setOpen = (open: boolean) => {
    host.dataset.open = open ? 'true' : 'false';
    popover.hidden = !open;
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  const handleTriggerClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(popover.hidden);
  };

  const handleDocumentClick = (event: MouseEvent) => {
    if (!root.contains(event.target as Node)) {
      setOpen(false);
    }
  };

  const handleDocumentKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !popover.hidden) {
      setOpen(false);
      trigger.focus();
    }
  };

  const handleRootClick = (event: MouseEvent) => {
    const actionElement = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-user-menu-action]');
    const action = actionElement?.dataset.userMenuAction;
    if (!action) return;

    if (action === 'settings') {
      window.location.hash = '#tab-settings';
      setOpen(false);
      return;
    }
    if (action === 'drive115') {
      window.location.hash = '#tab-settings/drive115-settings';
      setOpen(false);
      return;
    }
    if (action === 'about') {
      window.location.hash = '#tab-settings/about-settings';
      setOpen(false);
      return;
    }
    if (action === 'help') {
      window.open(HELP_URL, '_blank', 'noopener,noreferrer');
      setOpen(false);
      return;
    }
    if (action === 'github') {
      window.open(GITHUB_URL, '_blank', 'noopener,noreferrer');
      setOpen(false);
      return;
    }
    if (action === 'telegram') {
      window.open(TELEGRAM_URL, '_blank', 'noopener,noreferrer');
      setOpen(false);
    }
  };

  trigger.addEventListener('click', handleTriggerClick);
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleDocumentKeydown);
  root.addEventListener('click', handleRootClick);

  return () => {
    trigger.removeEventListener('click', handleTriggerClick);
    document.removeEventListener('click', handleDocumentClick);
    document.removeEventListener('keydown', handleDocumentKeydown);
    root.removeEventListener('click', handleRootClick);
  };
}
