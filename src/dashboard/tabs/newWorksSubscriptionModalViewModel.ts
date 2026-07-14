import type { ActorSubscription } from '../../types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value?: number): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('zh-CN');
  } catch {
    return '—';
  }
}

function renderSubscriptionCard(sub: ActorSubscription): string {
  const enabled = Boolean(sub.enabled);
  const statusClass = enabled ? 'on' : 'off';
  const statusLabel = enabled ? '订阅中' : '已关闭';
  const name = escapeHtml(sub.actorName || '未知演员');
  const actorId = escapeHtml(sub.actorId);
  const avatar = sub.avatarUrl
    ? `
      <div class="subscription-avatar-wrapper">
        <img src="${escapeHtml(sub.avatarUrl)}" alt="${name}" class="subscription-avatar">
      </div>`
    : `<div class="subscription-avatar-placeholder" aria-hidden="true"><i class="fas fa-user"></i></div>`;

  return `
    <article class="subscription-item${enabled ? '' : ' is-inactive'}" data-actor-id="${actorId}" data-enabled="${enabled ? '1' : '0'}">
      ${avatar}
      <div class="subscription-details">
        <div class="subscription-title-row">
          <div class="subscription-name">${name}</div>
          <span class="subscription-status-dot ${statusClass}">${statusLabel}</span>
        </div>
        <div class="subscription-meta">
          <span>订阅于 <b>${formatDate(sub.subscribedAt)}</b></span>
          <span>最后检查 <b>${formatDate(sub.lastCheckTime)}</b></span>
        </div>
      </div>
      <div class="subscription-actions">
        <button class="btn-check-single" data-action="check-single" data-actor-id="${actorId}" title="立即检查此演员的新作品" type="button" aria-label="立即检查 ${name}">
          <i class="fas fa-sync-alt"></i>
        </button>
        <label class="ui-toggle" title="${enabled ? '关闭自动检查' : '恢复自动检查'}">
          <input class="ui-toggle__input" type="checkbox" ${enabled ? 'checked' : ''} data-action="toggle" aria-label="${enabled ? '关闭自动检查' : '恢复自动检查'}">
          <span class="ui-toggle__slider"></span>
        </label>
        <button class="btn-danger" data-action="remove" type="button">
          <i class="fas fa-trash"></i> 移除
        </button>
      </div>
    </article>
  `;
}

export function buildSubscriptionManagementModalHtml(subscriptions: ActorSubscription[]): string {
  const enabledCount = subscriptions.filter((sub) => sub.enabled).length;
  const cards = subscriptions.map(renderSubscriptionCard).join('');
  const listBody = cards || `
    <div class="subscription-empty-state" role="status">
      还没有订阅演员。点右上角「添加演员」开始维护名单。
    </div>
  `;

  return `
            <div class="modal-overlay">
                <div class="modal-content subscription-management-shell">
                    <div class="modal-header subscription-modal-header">
                        <div class="modal-header-main">
                            <div class="modal-kicker">Subscription · 订阅名单</div>
                            <h3>管理订阅演员</h3>
                            <p class="modal-subtitle">管理已加入名单的演员：可临时关闭自动检查、单人立即检查，或移除不再关注的演员。</p>
                        </div>
                        <button class="modal-close-btn" type="button" aria-label="关闭">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body subscription-modal-body">
                        <div class="subscription-management-toolbar">
                            <div class="actor-selector-search subscription-search">
                                <i class="fas fa-search" aria-hidden="true"></i>
                                <input type="search" id="subscriptionManagementSearch" placeholder="搜索已订阅演员…" autocomplete="off" />
                            </div>
                            <div class="subscription-status-pills" role="tablist" aria-label="按状态筛选">
                                <button class="subscription-status-pill is-active" type="button" data-status-filter="all">全部</button>
                                <button class="subscription-status-pill" type="button" data-status-filter="on">订阅中</button>
                                <button class="subscription-status-pill" type="button" data-status-filter="off">已关闭</button>
                            </div>
                            <button class="btn-success" id="subscriptionManagementAddActor" type="button">
                                <i class="fas fa-user-plus"></i> 添加演员
                            </button>
                        </div>
                        <div class="subscription-list">
                            ${listBody}
                        </div>
                    </div>
                    <div class="modal-footer subscription-modal-footer">
                        <span class="subscription-management-summary">共 ${subscriptions.length} 个订阅 · ${enabledCount} 位订阅中</span>
                        <button class="btn-secondary" id="subscriptionManagementClose" type="button">关闭</button>
                    </div>
                </div>
            </div>
        `;
}
