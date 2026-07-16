import { getTagByValue } from '../../../../config/actorFilterTags';
import { setValue } from '../../../../../utils/storage';

export type EnhancementActorAuxHost = any;

export function displayAppliedTags(host: EnhancementActorAuxHost, tagsString: string): void {
  if (!host.appliedTagsContainer) return;
  if (!tagsString) {
    host.appliedTagsContainer.innerHTML = '<span class="no-tags-message">暂无记录</span>';
    return;
  }
  const tags = tagsString.split(',').filter((tag: string) => tag.trim());
  const tagElements = tags.map((tag: string) => {
    const tagConfig = getTagByValue(tag);
    const tagName = tagConfig ? tagConfig.label : tag;
    return `<span class="applied-tag">${tagName}</span>`;
  }).join('');
  host.appliedTagsContainer.innerHTML = tagElements;
}

export function initializeActorEnhancementEvents(host: EnhancementActorAuxHost): void {
  if (host.actorDefaultTagInputs && host.actorDefaultTagInputs.length > 0) {
    host.actorDefaultTagInputs.forEach((input: HTMLInputElement) => {
      input.addEventListener('change', host.handleSettingChange.bind(host));
    });
  }

  if (host.enableAutoApplyTags) {
    host.enableAutoApplyTags.addEventListener('change', host.handleSettingChange.bind(host));
  }

  if (host.clearLastAppliedTags) {
    host.clearLastAppliedTags.addEventListener('click', async () => {
      await setValue('lastAppliedActorTags', '');
      host.displayAppliedTags('');
    });
  }
}
