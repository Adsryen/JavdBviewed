/**
 * @file index.ts
 * @description 版本更新公告统一导出
 * @module features/releaseAnnouncement
 */
export type {
  ReleaseAnnouncementKind,
  ReleaseAnnouncementPending,
  ReleaseAnnouncementStorageState,
  ReleaseNote,
  ResolveAnnouncementInput,
  ResolvedReleaseAnnouncement,
} from './domain/types';
export { RELEASE_NOTES, DEFAULT_RELEASE_HIGHLIGHTS, INSTALL_WELCOME_HIGHLIGHTS } from './domain/releaseNotes';
export {
  RELEASE_ANNOUNCEMENT_FALLBACK_KEY,
  RELEASE_ANNOUNCEMENT_STORAGE_KEY,
  buildAnnouncementKey,
  markAnnouncementSeen,
  readReleaseAnnouncementState,
  setPendingReleaseAnnouncement,
  writeReleaseAnnouncementState,
} from './application/announcementState';
export { resolveAnnouncement } from './application/resolveAnnouncement';
export { mountReleaseAnnouncementModal } from './ui/releaseAnnouncementModal';
