import type { ActorSubscription } from '../../types';

export function buildSubscriptionManagementModalHtml(subscriptions: ActorSubscription[]): string {
  return `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>管理订阅演员</h3>
                        <button class="modal-close-btn" type="button">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="subscription-management-toolbar">
                            <div class="actor-selector-search subscription-search">
                                <input type="text" id="subscriptionManagementSearch" placeholder="搜索演员姓名..." />
                            </div>
                            <button class="btn-success" id="subscriptionManagementAddActor" type="button">
                                <i class="fas fa-user-plus"></i> 添加演员
                            </button>
                        </div>
                        <div class="subscription-list">
                            ${subscriptions.map(sub => `
                                <div class="subscription-item" data-actor-id="${sub.actorId}">
                                    <div class="subscription-info">
                                        ${sub.avatarUrl ? `
                                            <div class="subscription-avatar-wrapper">
                                                <img src="${sub.avatarUrl}" alt="${sub.actorName}" class="subscription-avatar">
                                            </div>
                                        ` : '<div class="subscription-avatar-placeholder"><i class="fas fa-user"></i></div>'}
                                        <div class="subscription-details">
                                            <div class="subscription-name">${sub.actorName}</div>
                                            <div class="subscription-meta">
                                                订阅于 ${new Date(sub.subscribedAt).toLocaleDateString('zh-CN')}
                                                ${sub.lastCheckTime ? `| 最后检查: ${new Date(sub.lastCheckTime).toLocaleDateString('zh-CN')}` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="subscription-actions">
                                        <button class="btn-check-single" data-action="check-single" data-actor-id="${sub.actorId}" title="立即检查此演员的新作品">
                                            <i class="fas fa-sync-alt"></i>
                                        </button>
                                        <label class="ui-toggle">
                                            <input class="ui-toggle__input" type="checkbox" ${sub.enabled ? 'checked' : ''} data-action="toggle">
                                            <span class="ui-toggle__slider"></span>
                                        </label>
                                        <button class="btn-danger" data-action="remove">
                                            <i class="fas fa-trash"></i> 移除
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <span class="subscription-management-summary">共 ${subscriptions.length} 个订阅演员</span>
                        <button class="btn-secondary" id="subscriptionManagementClose">关闭</button>
                    </div>
                </div>
            </div>
        `;
}
