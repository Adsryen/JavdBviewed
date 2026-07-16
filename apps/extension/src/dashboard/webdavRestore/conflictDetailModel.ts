export type ConflictDetailType = 'video' | 'actor' | 'newWorksSub' | 'newWorksRec';

export interface ConflictFieldViewModel {
  iconClass: string;
  label: string;
  value: string;
  valueClass?: string;
  href?: string;
  tags?: string[];
}

export interface ConflictFieldBuildOptions {
  now?: number;
}

export function buildConflictVersionFields(
  data: any,
  type: ConflictDetailType,
  options: ConflictFieldBuildOptions = {},
): ConflictFieldViewModel[] {
  if (type === 'video') {
    return buildVideoFields(data);
  }

  if (type === 'actor') {
    return buildActorFields(data);
  }

  if (type === 'newWorksSub') {
    return buildNewWorksSubscriptionFields(data);
  }

  return buildNewWorksRecordFields(data, options);
}

export function buildConflictVersionFieldsHtml(fields: ConflictFieldViewModel[]): string {
  return fields.map(buildConflictVersionFieldHtml).join('');
}

export function buildConflictVersionContentHtml(data: any, type: ConflictDetailType): string {
  return buildConflictVersionFieldsHtml(buildConflictVersionFields(data, type));
}

export function buildConflictVersionFieldHtml(field: ConflictFieldViewModel): string {
  const valueClass = field.valueClass ? ` ${field.valueClass}` : '';
  let valueHtml = field.value;

  if (field.tags) {
    valueHtml = field.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
  } else if (field.href) {
    valueHtml = `<a href="${field.href}" target="_blank" class="external-link">${field.value}</a>`;
  }

  return `<div class="field-item"><span class="field-label"><i class="${field.iconClass}"></i> ${field.label}</span><span class="field-value${valueClass}">${valueHtml}</span></div>`;
}

export function getConflictTypeLabel(type: ConflictDetailType): string {
  const labels: Record<ConflictDetailType, string> = {
    video: '视频记录',
    actor: '演员记录',
    newWorksSub: '新作品订阅',
    newWorksRec: '新作品记录',
  };
  return labels[type];
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN');
}

export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    viewed: '已观看',
    want: '我想看',
    browsed: '已浏览',
  };
  return statusMap[status] || status;
}

export function getResolutionText(resolution: string): string {
  const resolutionMap: Record<string, string> = {
    local: '保留本地',
    cloud: '保留云端',
    merge: '智能合并',
  };
  return resolutionMap[resolution] || resolution;
}

function buildVideoFields(data: any): ConflictFieldViewModel[] {
  const fields: ConflictFieldViewModel[] = [
    field('fas fa-video', '标题:', data?.title || '未知'),
    {
      ...field('fas fa-eye', '状态:', getStatusText(data?.status)),
      valueClass: `status-${data?.status}`,
    },
  ];

  fields.push(buildTagsField('标签:', data?.tags));

  if (data?.releaseDate) {
    fields.push(field('fas fa-calendar', '发行日期:', data.releaseDate));
  }

  if (data?.javdbUrl) {
    fields.push(linkField('fas fa-link', '链接:', data.javdbUrl));
  }

  fields.push(field('fas fa-clock', '更新时间:', formatTimestamp(data?.updatedAt)));
  return fields;
}

function buildActorFields(data: any): ConflictFieldViewModel[] {
  const fields: ConflictFieldViewModel[] = [
    field('fas fa-user', '姓名:', data?.name || '未知'),
  ];

  if (data?.gender) {
    fields.push(field('fas fa-venus-mars', '性别:', data.gender));
  }

  if (data?.category) {
    fields.push(field('fas fa-tags', '分类:', data.category));
  }

  if (data?.profileUrl) {
    fields.push(linkField('fas fa-link', '资料链接:', data.profileUrl));
  }

  fields.push(field('fas fa-clock', '更新时间:', formatTimestamp(data?.updatedAt)));
  return fields;
}

function buildNewWorksSubscriptionFields(data: any): ConflictFieldViewModel[] {
  const fields: ConflictFieldViewModel[] = [
    field('fas fa-id-badge', '演员：', data?.actorName || '未知'),
    field('fas fa-toggle-on', '订阅状态：', data?.enabled ? '启用' : '停用'),
  ];

  if (data?.lastCheckTime) {
    fields.push(field('fas fa-clock', '最后检查：', formatTimestamp(data.lastCheckTime)));
  }

  if (data?.subscribedAt) {
    fields.push(field('fas fa-calendar-plus', '订阅时间：', formatTimestamp(data.subscribedAt)));
  }

  return fields;
}

function buildNewWorksRecordFields(data: any, options: ConflictFieldBuildOptions): ConflictFieldViewModel[] {
  const fields: ConflictFieldViewModel[] = [
    field('fas fa-film', '标题：', data?.title || '未知'),
  ];

  if (data?.actorName) {
    fields.push(field('fas fa-user', '演员：', data.actorName));
  }

  if (data?.releaseDate) {
    fields.push(field('fas fa-calendar', '发行日期：', data.releaseDate));
  }

  if (data?.tags?.length > 0) {
    fields.push(buildTagsField('标签：', data.tags));
  }

  if (data?.javdbUrl) {
    fields.push(linkField('fas fa-link', '链接：', data.javdbUrl));
  }

  if (data?.discoveredAt) {
    fields.push(field('fas fa-search', '发现时间：', formatTimestamp(data.discoveredAt)));
  }

  fields.push(field('fas fa-clock', '更新时间：', formatTimestamp(data?.updatedAt || options.now || Date.now())));
  return fields;
}

function field(iconClass: string, label: string, value: unknown): ConflictFieldViewModel {
  return {
    iconClass,
    label,
    value: String(value ?? ''),
  };
}

function linkField(iconClass: string, label: string, url: string): ConflictFieldViewModel {
  return {
    ...field(iconClass, label, shortenUrl(url)),
    href: url,
  };
}

function buildTagsField(label: string, tags: string[] | undefined): ConflictFieldViewModel {
  if (tags && tags.length > 0) {
    return {
      iconClass: 'fas fa-tags',
      label,
      value: '',
      valueClass: 'tags',
      tags,
    };
  }

  return {
    iconClass: 'fas fa-tags',
    label,
    value: '无标签',
    valueClass: 'empty',
  };
}

function shortenUrl(url: string): string {
  return url.length > 50 ? `${url.substring(0, 50)}...` : url;
}
