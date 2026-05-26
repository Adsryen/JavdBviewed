export type ReleaseAnnouncementKind = 'install' | 'update';

export interface ReleaseAnnouncementPending {
  type: ReleaseAnnouncementKind;
  version?: string;
  previousVersion?: string;
  createdAt: number;
}

export interface ReleaseAnnouncementStorageState {
  pending?: ReleaseAnnouncementPending;
  lastSeenAnnouncementKey?: string;
  lastSeenAt?: number;
}

export interface ReleaseNote {
  version: string;
  highlights: string[];
}

export interface ResolveAnnouncementInput {
  state: ReleaseAnnouncementStorageState;
  currentVersion?: string;
  releaseNotes?: ReleaseNote[];
}

export interface ResolvedReleaseAnnouncement {
  type: ReleaseAnnouncementKind;
  announcementKey: string;
  version?: string;
  previousVersion?: string;
  title: string;
  subtitle: string;
  highlights: string[];
  primaryActionLabel: string;
}
