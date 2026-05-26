import { describe, expect, it } from 'vitest';
import {
  RELEASE_ANNOUNCEMENT_FALLBACK_KEY,
  RELEASE_NOTES,
  buildAnnouncementKey,
  markAnnouncementSeen,
  readReleaseAnnouncementState,
  resolveAnnouncement,
} from '../../src/features/releaseAnnouncement';
import { getChromeStorageSnapshot, setChromeStorage } from '../setup/chrome';

describe('release announcement state', () => {
  it('resolves a welcome announcement for first install', () => {
    const announcement = resolveAnnouncement({
      state: {
        pending: {
          type: 'install',
          version: '1.20.2',
          createdAt: 1000,
        },
      },
      currentVersion: '1.20.2',
    });

    expect(announcement).toEqual(expect.objectContaining({
      type: 'install',
      announcementKey: '1.20.2',
      version: '1.20.2',
      title: '欢迎使用 Jav 助手',
      primaryActionLabel: '开始使用',
    }));
    expect(announcement?.subtitle).toContain('个人浏览助手');
    expect(announcement?.subtitle).not.toContain('v1.20.2');
    expect(announcement?.highlights).toEqual([
      '在番号库管理已看、想看和浏览记录。',
      '在影片页使用磁力搜索、在线可看和字幕入口。',
      '按需开启 115 推送、WebDAV 同步和隐私保护。',
      '所有增强功能都能在设置页随时调整。',
    ]);
  });

  it('uses version as the announcement key for same-version builds', () => {
    const announcement = resolveAnnouncement({
      state: {
        lastSeenAnnouncementKey: '1.20.2',
        pending: {
          type: 'update',
          version: '1.20.2',
          createdAt: 1000,
        },
      },
      currentVersion: '1.20.2',
    });

    expect(buildAnnouncementKey('1.20.2')).toBe('1.20.2');
    expect(announcement).toBeNull();
  });

  it('returns no announcement after the same key has been seen', () => {
    const announcement = resolveAnnouncement({
      state: {
        lastSeenAnnouncementKey: '1.20.2',
        pending: {
          type: 'update',
          version: '1.20.2',
          previousVersion: '1.20.1',
          createdAt: 1000,
        },
      },
      currentVersion: '1.20.2',
    });

    expect(announcement).toBeNull();
  });

  it('uses a fallback key and hides the version label when manifest version is absent', () => {
    const announcement = resolveAnnouncement({
      state: {
        pending: {
          type: 'update',
          createdAt: 1000,
        },
      },
      currentVersion: '',
    });

    expect(buildAnnouncementKey('', '')).toBe(RELEASE_ANNOUNCEMENT_FALLBACK_KEY);
    expect(announcement).toEqual(expect.objectContaining({
      type: 'update',
      announcementKey: RELEASE_ANNOUNCEMENT_FALLBACK_KEY,
      title: 'Jav 助手已更新',
    }));
    expect(announcement?.subtitle).not.toContain('v');
  });

  it('marks an announcement as seen and clears pending state', async () => {
    setChromeStorage({
      release_announcement_state: {
        pending: {
          type: 'update',
          version: '1.20.2',
          createdAt: 1000,
        },
      },
    });

    await markAnnouncementSeen('1.20.2', 2000);

    await expect(readReleaseAnnouncementState()).resolves.toEqual({
      lastSeenAnnouncementKey: '1.20.2',
      lastSeenAt: 2000,
    });
    expect(getChromeStorageSnapshot()).toMatchObject({
      release_announcement_state: {
        lastSeenAnnouncementKey: '1.20.2',
        lastSeenAt: 2000,
      },
    });
  });

  it('ships user-facing release notes for recent versions', () => {
    expect(RELEASE_NOTES.map(note => note.version)).toEqual(['1.20.2', '1.20.1', '1.20.0']);
    expect(RELEASE_NOTES[0]?.highlights).toEqual(expect.arrayContaining([
      '影片页新增在线可看、外部搜索和字幕搜索入口。',
      '磁力升级多源聚合、分页、来源筛选和 JAVBUS 兜底。',
    ]));
    expect(RELEASE_NOTES[1]?.highlights).toContain('115 离线下载支持选择目标文件夹。');
    expect(RELEASE_NOTES[2]?.highlights).toContain('全局任务中心接入详情页增强和后台任务。');
    for (const note of RELEASE_NOTES) {
      expect(note.highlights.length).toBeGreaterThanOrEqual(3);
      expect(note.highlights.every(item => item.length >= 12 && item.length <= 42)).toBe(true);
    }
  });
});
