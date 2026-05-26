import {
  mountReleaseAnnouncementModal,
  writeReleaseAnnouncementState,
  type ReleaseAnnouncementKind,
} from '../../features/releaseAnnouncement';

export async function mountDashboardReleaseAnnouncement(): Promise<void> {
  await applyReleaseAnnouncementDebugQuery();
  await mountReleaseAnnouncementModal();
}

async function applyReleaseAnnouncementDebugQuery(): Promise<void> {
  const debugParams = readDebugReleaseAnnouncementParams(window.location.href);
  const debugType = parseDebugReleaseAnnouncementType(debugParams);
  if (!debugType) return;

  const version = getManifestVersion();
  const previousVersion = debugParams.get('debugReleaseAnnouncementPreviousVersion')?.trim();

  await writeReleaseAnnouncementState({
    pending: {
      type: debugType,
      ...(version ? { version } : {}),
      ...(debugType === 'update' && previousVersion ? { previousVersion } : {}),
      createdAt: Date.now(),
    },
  });
}

function readDebugReleaseAnnouncementParams(href: string): URLSearchParams {
  const params = new URLSearchParams();

  try {
    const url = new URL(href);
    mergeParams(params, new URLSearchParams(url.search));
    const hashQuery = url.hash.includes('?') ? url.hash.slice(url.hash.indexOf('?')) : '';
    if (hashQuery) mergeParams(params, new URLSearchParams(hashQuery));
  } catch {
    mergeParams(params, new URLSearchParams(window.location.search));
  }

  return params;
}

function mergeParams(target: URLSearchParams, source: URLSearchParams): void {
  source.forEach((value, key) => {
    target.set(key, value);
  });
}

function parseDebugReleaseAnnouncementType(params: URLSearchParams): ReleaseAnnouncementKind | null {
  const value = params.get('debugReleaseAnnouncement');
  if (value === 'install' || value === 'update') return value;
  return null;
}

function getManifestVersion(): string {
  try {
    return chrome.runtime.getManifest?.().version || '';
  } catch {
    return '';
  }
}
