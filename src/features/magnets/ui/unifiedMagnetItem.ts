/**
 * @file unifiedMagnetItem.ts
 * @description Unified magnet result item DOM helper
 * @module features/magnets
 */
import { getResultSources } from '../application/resultMerge';
import { extractHashFromMagnet, isCrackedVersion } from '../application/resultMetadata';
import type { MagnetResult } from '../domain/types';
import { createMagnetQualityTag } from './qualityTag';

export interface UnifiedMagnetItemCallbacks {
  copyMagnet: (magnet: string) => void | Promise<void>;
  push115: (button: HTMLButtonElement, magnet: string, name: string) => void | Promise<void>;
}

export function createUnifiedMagnetItem(result: MagnetResult, index: number, callbacks: UnifiedMagnetItemCallbacks): HTMLElement {
  // 创建主容器
  const item = document.createElement('div');
  item.className = `item is-desktop jdb-magnet-row ${index % 2 === 0 ? '' : 'odd'} privacy-protected`;
  if (result.source !== 'JavDB') {
    item.classList.add('is-external-source');
  }
  item.setAttribute('data-privacy-protected', 'true');
  item.setAttribute('data-source', result.source);
  // 统一使用弹性布局，避免 Bulma columns 的列宽不一致导致溢出
  item.style.display = 'flex';
  item.style.alignItems = 'center';
  item.style.flexWrap = 'nowrap';

  // 创建磁力名称列 - 使用固定宽度以对齐按钮
  const nameColumn = document.createElement('div');
  nameColumn.className = 'magnet-name jdb-magnet-main';
  // 自适应宽度，并允许内容被省略号正确截断
  nameColumn.style.flex = '1 1 auto';
  nameColumn.style.minWidth = '0';

  const magnetLink = document.createElement('a');
  magnetLink.className = 'jdb-magnet-link';
  magnetLink.href = result.magnet;
  magnetLink.title = '右键点击并选择「复制链接地址」';

  const nameSpan = document.createElement('span');
  nameSpan.className = 'name jdb-magnet-title privacy-protected';
  nameSpan.setAttribute('data-privacy-protected', 'true');
  nameSpan.textContent = result.name;
  nameSpan.style.display = 'block';
  nameSpan.style.overflow = 'hidden';
  nameSpan.style.textOverflow = 'ellipsis';
  nameSpan.style.whiteSpace = 'nowrap';
  nameSpan.title = result.name; // 悬停显示完整名称

  const metaSpan = document.createElement('span');
  metaSpan.className = 'meta jdb-magnet-meta';
  const sourceLabels = getResultSources(result);
  const sourceText = sourceLabels.join(' / ');
  metaSpan.textContent = result.size
    ? `${result.size}${sourceText !== 'JavDB' ? ` · 来源 ${sourceText}` : ''}`
    : `${sourceText !== 'JavDB' ? `来源 ${sourceText}` : 'JavDB'}`;

  // 创建标签容器
  const tagsDiv = document.createElement('div');
  tagsDiv.className = 'tags jdb-magnet-tags';

  // 添加来源标签
  sourceLabels.forEach((source) => {
    const sourceTag = document.createElement('span');
    sourceTag.className = `tag is-${source === 'JavDB' ? 'info' : 'danger'} is-small jdb-magnet-source-tag`;
    sourceTag.textContent = source;
    tagsDiv.appendChild(sourceTag);
  });

  tagsDiv.appendChild(createMagnetQualityTag(result));

  // 添加质量标签
  if (result.quality) {
    const qualityTag = document.createElement('span');
    qualityTag.className = 'tag is-primary is-small is-light';
    qualityTag.textContent = result.quality;
    qualityTag.style.marginLeft = '4px';
    tagsDiv.appendChild(qualityTag);
  }

  // 添加字幕标签
  if (result.hasSubtitle) {
    const subtitleTag = document.createElement('span');
    subtitleTag.className = 'tag is-warning is-small is-light';
    subtitleTag.textContent = '字幕';
    subtitleTag.style.marginLeft = '4px';
    tagsDiv.appendChild(subtitleTag);
  }

  // 添加破解标签
  if (isCrackedVersion(result.name)) {
    const crackedTag = document.createElement('span');
    crackedTag.className = 'tag is-success is-small is-light';
    crackedTag.textContent = '破解';
    crackedTag.style.marginLeft = '4px';
    tagsDiv.appendChild(crackedTag);
  }

  magnetLink.appendChild(nameSpan);
  magnetLink.appendChild(metaSpan);
  magnetLink.appendChild(tagsDiv);
  nameColumn.appendChild(magnetLink);

  // 创建按钮列 - 固定宽度
  const buttonsColumn = document.createElement('div');
  buttonsColumn.className = 'buttons';
  // 使用自然宽度，避免固定宽度导致整体溢出
  buttonsColumn.style.flex = '0 0 auto';
  buttonsColumn.style.display = 'flex';
  buttonsColumn.style.alignItems = 'center';
  buttonsColumn.style.gap = '6px';

  // 复制按钮
  const copyButton = document.createElement('button');
  copyButton.className = 'button is-info is-small';
  copyButton.textContent = '复制';
  copyButton.addEventListener('click', () => callbacks.copyMagnet(result.magnet));

  // 下载按钮（保持JavDB原有样式）
  const downloadButton = document.createElement('a');
  downloadButton.className = 'button is-info is-small';
  downloadButton.href = `https://keepshare.org/aa36p03v/magnet%3A%3Fxt%3Durn%3Abtih%3A${extractHashFromMagnet(result.magnet)}`;
  downloadButton.target = '_blank';
  downloadButton.innerHTML = '&nbsp;下载&nbsp;';

  // 115推送按钮
  const push115Button = document.createElement('button');
  push115Button.className = 'button is-success is-small drive115-push-btn';
  push115Button.title = '推送到115网盘离线下载';
  push115Button.innerHTML = '&nbsp;推送115&nbsp;';
  push115Button.addEventListener('click', () => callbacks.push115(push115Button, result.magnet, result.name));

  buttonsColumn.appendChild(copyButton);
  buttonsColumn.appendChild(downloadButton);
  buttonsColumn.appendChild(push115Button);

  // 创建日期列 - 固定宽度
  const dateColumn = document.createElement('div');
  dateColumn.className = 'date';
  dateColumn.style.width = '80px'; // 固定日期列宽度
  dateColumn.style.flexShrink = '0'; // 防止收缩
  dateColumn.style.textAlign = 'center'; // 居中对齐
  const timeSpan = document.createElement('span');
  timeSpan.className = 'time';
  timeSpan.textContent = result.date || 'Unknown';
  dateColumn.appendChild(timeSpan);

  // 组装完整项目
  item.appendChild(nameColumn);
  item.appendChild(buttonsColumn);
  item.appendChild(dateColumn);

  return item;
}

/**
 * 检查影片是否已看
 */
