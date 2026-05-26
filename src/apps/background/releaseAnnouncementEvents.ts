import { setPendingReleaseAnnouncement } from '../../features/releaseAnnouncement';

export function registerReleaseAnnouncementEvents(): void {
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason !== 'install' && details.reason !== 'update') return;

    return setPendingReleaseAnnouncement({
      type: details.reason,
      version: getManifestVersion(),
      previousVersion: details.previousVersion,
      createdAt: Date.now(),
    }).catch(error => {
      console.warn('[ReleaseAnnouncement] Failed to record install/update state:', error);
    });
  });
}

function getManifestVersion(): string {
  try {
    return chrome.runtime.getManifest?.().version || '';
  } catch {
    return '';
  }
}
