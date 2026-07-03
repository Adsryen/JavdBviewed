import { SimpleActorAvatar } from '../../../components/SimpleActorAvatar';
import type { ActorPagedSearchResult, ActorRecord } from '../../../types';
import { buildActorCardHtml } from './cardViewModel';

export interface ActorListRuntimeOptions {
  currentQuery: string;
  currentViewMode: 'list' | 'card';
  selectedActorIds: Set<string>;
  subscribedActorIds: Set<string>;
  showBlacklistBadge: boolean;
  openActorWorks(actorId: string): void;
  selectActor(actorId: string, isSelected: boolean): void;
  setupActorCard(actor: ActorRecord): void;
  updateBatchUi(): void;
}

export function renderActorListRuntime(
  container: HTMLElement,
  result: ActorPagedSearchResult,
  options: ActorListRuntimeOptions,
): void {
  if (result.actors.length === 0) {
    container.innerHTML = `
                <div class="no-actors">
                    <div class="no-actors-icon">👤</div>
                    <div class="no-actors-text">
                        ${options.currentQuery ? '未找到匹配的演员' : '暂无演员数据'}
                    </div>
                    ${!options.currentQuery ? '<div class="no-actors-hint">点击同步按钮从JavDB同步演员数据</div>' : ''}
                </div>
            `;
    return;
  }

  const actorCards = result.actors
    .map(actor => buildActorCardHtml(actor, {
      viewMode: options.currentViewMode,
      isSubscribed: options.subscribedActorIds.has(actor.id),
      showBlacklistBadge: options.showBlacklistBadge,
    }))
    .join('');

  const containerClass = options.currentViewMode === 'card' ? 'actor-grid' : 'actor-list';
  container.innerHTML = `<div class="${containerClass}">${actorCards}</div>`;

  if (options.currentViewMode === 'list') {
    container.classList.add('list-view');
  } else {
    container.classList.remove('list-view');
  }

  result.actors.forEach(actor => {
    const actorCard = container.querySelector(`[data-actor-id="${actor.id}"].actor-card`) as HTMLElement | null;
    const avatarContainer = container.querySelector(`#actor-avatar-${actor.id}`) as HTMLElement | null;

    if (options.selectedActorIds.has(actor.id)) {
      actorCard?.classList.add('selected');
    }

    if (actorCard) {
      actorCard.addEventListener('click', event => {
        if ((event.target as HTMLElement).closest('button, a, .actor-social-link')) {
          return;
        }

        const isSelected = options.selectedActorIds.has(actor.id);
        options.selectActor(actor.id, !isSelected);
      });
    }

    if (avatarContainer) {
      // 根据视图模式设置头像大小
      const avatarSize = options.currentViewMode === 'card' ? 'large' : 'small';
      const avatarElement = SimpleActorAvatar.create(
        actor.id,
        actor.avatarUrl,
        actor.gender,
        avatarSize,
        actorId => options.openActorWorks(actorId),
      );
      avatarContainer.appendChild(avatarElement);
    }

    options.setupActorCard(actor);
  });

  options.updateBatchUi();
}
