import type { ReleaseAnnouncementPending, ReleaseAnnouncementStorageState } from '../domain/types';

export const RELEASE_ANNOUNCEMENT_STORAGE_KEY = 'release_announcement_state';
export const RELEASE_ANNOUNCEMENT_FALLBACK_KEY = 'release-announcement-current';

export function buildAnnouncementKey(version?: string): string {
  const trimmed = String(version || '').trim();
  if (trimmed) return trimmed;
  return RELEASE_ANNOUNCEMENT_FALLBACK_KEY;
}

export async function readReleaseAnnouncementState(): Promise<ReleaseAnnouncementStorageState> {
  const result = await chrome.storage.local.get(RELEASE_ANNOUNCEMENT_STORAGE_KEY);
  const state = result?.[RELEASE_ANNOUNCEMENT_STORAGE_KEY];
  return normalizeState(state);
}

export async function writeReleaseAnnouncementState(state: ReleaseAnnouncementStorageState): Promise<void> {
  await chrome.storage.local.set({
    [RELEASE_ANNOUNCEMENT_STORAGE_KEY]: normalizeState(state),
  });
}

export async function setPendingReleaseAnnouncement(pending: ReleaseAnnouncementPending): Promise<void> {
  const state = await readReleaseAnnouncementState();
  await writeReleaseAnnouncementState({
    ...state,
    pending: normalizePending(pending),
  });
}

export async function markAnnouncementSeen(announcementKey: string, seenAt = Date.now()): Promise<void> {
  const state = await readReleaseAnnouncementState();
  const nextState: ReleaseAnnouncementStorageState = {
    ...state,
    pending: undefined,
    lastSeenAnnouncementKey: announcementKey,
    lastSeenAt: seenAt,
  };

  await writeReleaseAnnouncementState(removeUndefinedState(nextState));
}

function normalizeState(value: unknown): ReleaseAnnouncementStorageState {
  if (!value || typeof value !== 'object') return {};
  const raw = value as ReleaseAnnouncementStorageState;
  const state: ReleaseAnnouncementStorageState = {};

  if (raw.pending) {
    state.pending = normalizePending(raw.pending);
  }
  if (typeof raw.lastSeenAnnouncementKey === 'string' && raw.lastSeenAnnouncementKey.trim()) {
    state.lastSeenAnnouncementKey = normalizeAnnouncementKey(raw.lastSeenAnnouncementKey.trim());
  }
  if (typeof raw.lastSeenAt === 'number' && Number.isFinite(raw.lastSeenAt)) {
    state.lastSeenAt = raw.lastSeenAt;
  }

  return state;
}

function normalizePending(value: ReleaseAnnouncementPending): ReleaseAnnouncementPending {
  const type = value.type === 'install' ? 'install' : 'update';
  const pending: ReleaseAnnouncementPending = {
    type,
    createdAt: typeof value.createdAt === 'number' && Number.isFinite(value.createdAt) ? value.createdAt : Date.now(),
  };

  const version = String(value.version || '').trim();
  if (version) pending.version = version;

  const previousVersion = String(value.previousVersion || '').trim();
  if (previousVersion) pending.previousVersion = previousVersion;

  return pending;
}

function normalizeAnnouncementKey(key: string): string {
  const buildKeyMatch = key.match(/^(.+)-build-\d+$/);
  return buildKeyMatch?.[1] || key;
}

function removeUndefinedState(state: ReleaseAnnouncementStorageState): ReleaseAnnouncementStorageState {
  return Object.fromEntries(
    Object.entries(state).filter(([, value]) => value !== undefined),
  ) as ReleaseAnnouncementStorageState;
}
