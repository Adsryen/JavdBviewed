import { DEFAULT_RELEASE_HIGHLIGHTS, INSTALL_WELCOME_HIGHLIGHTS, RELEASE_NOTES } from '../domain/releaseNotes';
import type { ReleaseNote, ResolveAnnouncementInput, ResolvedReleaseAnnouncement } from '../domain/types';
import { buildAnnouncementKey } from './announcementState';

export function resolveAnnouncement(input: ResolveAnnouncementInput): ResolvedReleaseAnnouncement | null {
  const currentVersion = String(input.currentVersion || input.state.pending?.version || '').trim();
  const announcementKey = buildAnnouncementKey(currentVersion);

  if (input.state.lastSeenAnnouncementKey === announcementKey) {
    return null;
  }

  const pending = input.state.pending;
  const type = pending?.type === 'install' ? 'install' : 'update';
  const version = currentVersion || undefined;
  const previousVersion = pending?.previousVersion;
  const notes = input.releaseNotes || RELEASE_NOTES;

  if (type === 'install') {
    return {
      type,
      announcementKey,
      version,
      previousVersion,
      title: '欢迎使用 Jav 助手',
      subtitle: '这是你的 JavDB 个人浏览助手，可以帮你整理记录、查找资源，并把常用增强集中到一个控制面板。',
      highlights: INSTALL_WELCOME_HIGHLIGHTS,
      primaryActionLabel: '开始使用',
    };
  }

  const highlights = findHighlights(notes, version);

  return {
    type,
    announcementKey,
    version,
    previousVersion,
    title: 'Jav 助手已更新',
    subtitle: buildUpdateSubtitle(version, previousVersion),
    highlights,
    primaryActionLabel: '知道了',
  };
}

function findHighlights(notes: ReleaseNote[], version?: string): string[] {
  const match = version ? notes.find(note => note.version === version) : undefined;
  return match?.highlights?.length ? match.highlights : DEFAULT_RELEASE_HIGHLIGHTS;
}

function buildUpdateSubtitle(version?: string, previousVersion?: string): string {
  if (version && previousVersion) {
    return `已从 v${previousVersion} 更新到 v${version}，以下是本次主要变化。`;
  }
  if (version) {
    return `v${version} 已安装，以下是本次主要变化。`;
  }
  return '以下是本次主要变化。';
}
