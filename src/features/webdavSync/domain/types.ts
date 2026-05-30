export interface WebDAVAuth {
  username: string;
  password: string;
}

export interface WebDAVFile {
  name: string;
  path: string;
  lastModified: string;
  isDirectory: boolean;
  size?: number;
  uploaderClientId?: string;
  uploaderDeviceLabel?: string;
  uploaderBrowserName?: string;
  uploadId?: string;
}

export interface WebDAVClientProfile {
  clientId: string;
  deviceLabel: string;
  browserName: string;
  platform?: string;
  extensionVersion?: string;
  installedAt?: string;
  lastSeenAt?: string;
  lastSyncAt?: string;
  lastSyncStatus?: 'success' | 'failed' | 'pending';
  lastUploadId?: string;
  disabled?: boolean;
}

export interface WebDAVUploadIndexItem {
  uploadId: string;
  uploadedAt: string;
  clientId: string;
  deviceLabel: string;
  browserName: string;
  type: 'full';
  status: 'success' | 'failed';
  file?: string;
  recordCount?: number;
  dataVersion?: number;
}

export interface WebDAVUploadIndex {
  version: number;
  updatedAt: string;
  lastUploadId: string;
  items: WebDAVUploadIndexItem[];
}

export interface WebDAVConfig {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string;
  provider?: 'jianguoyun' | 'teracloud' | 'custom';
  createdAt?: number;
  updatedAt: number;
  lastSync: string | null;
  [key: string]: any;
}
