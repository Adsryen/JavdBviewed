export interface WebDAVRouterHandlers {
  listFiles: () => Promise<any>;
  previewBackup: (filename: string) => Promise<any>;
  performRestoreUnified: (filename: string, options?: any) => Promise<any>;
  testWebDAVConnection: () => Promise<any>;
  testWebDAVConnectionWithConfig: (config: any) => Promise<any>;
  diagnoseWebDAVConnection: () => Promise<any>;
  performUpload: () => Promise<any>;
  getCurrentWebDAVClientProfile: () => Promise<any>;
  listWebDAVClients: () => Promise<any>;
  updateCurrentWebDAVDeviceLabel: (deviceLabel: string) => Promise<any>;
  updateWebDAVClientDeviceLabel: (clientId: string, deviceLabel: string) => Promise<any>;
  collectBackupData: () => Promise<any>;
  downloadBackupFileAsBase64: (filename: string) => Promise<any>;
  applyImportDataDirect: (importData: any, options?: any) => Promise<any>;
}

function buildUnifiedOptionsFromLegacyRestore(options: any = {}): any {
  return {
    categories: {
      settings: options.restoreSettings !== false,
      viewed: options.restoreRecords !== false,
      userProfile: options.restoreUserProfile !== false,
      actors: options.restoreActorRecords !== false,
      logs: options.restoreLogs === true,
      magnetPushLogs: options.restoreMagnetPushLogs === true,
      importStats: options.restoreImportStats !== false,
      newWorks: options.restoreNewWorks === true,
    },
    autoBackupBeforeRestore: options.autoBackupBeforeRestore !== false,
  };
}

export function registerWebDAVRouterListener(handlers: WebDAVRouterHandlers): void {
  try {
    chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse): boolean | void => {
      if (!message || typeof message !== 'object') return false;
      switch (message.type) {
        case 'webdav-list-files':
          handlers.listFiles().then(sendResponse).catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        case 'WEB_DAV:RESTORE_PREVIEW': {
          const { filename } = message;
          handlers.previewBackup(filename).then(sendResponse).catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        }
        case 'WEB_DAV:RESTORE_UNIFIED': {
          const { filename, options } = message;
          handlers.performRestoreUnified(filename, options).then(sendResponse).catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        }
        case 'webdav-restore': {
          const { filename, options, preview } = message;
          if (preview) {
            handlers.previewBackup(filename).then(sendResponse).catch((e) => sendResponse({ success: false, error: e?.message }));
            return true;
          }
          handlers.performRestoreUnified(filename, buildUnifiedOptionsFromLegacyRestore(options))
            .then(sendResponse)
            .catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        }
        case 'webdav-test':
          handlers.testWebDAVConnection().then(sendResponse).catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        case 'webdav-test-temp':
          handlers.testWebDAVConnectionWithConfig(message.config).then(sendResponse).catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        case 'webdav-diagnose':
          handlers.diagnoseWebDAVConnection().then(sendResponse).catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        case 'webdav-upload':
          handlers.performUpload().then(sendResponse).catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        case 'webdav-get-client-profile':
          handlers.getCurrentWebDAVClientProfile()
            .then(sendResponse)
            .catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        case 'webdav-list-clients':
          handlers.listWebDAVClients().then(sendResponse).catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        case 'webdav-update-device-label':
          handlers.updateCurrentWebDAVDeviceLabel(message?.deviceLabel).then(sendResponse).catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        case 'webdav-update-client-device-label':
          handlers.updateWebDAVClientDeviceLabel(message?.clientId, message?.deviceLabel).then(sendResponse).catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        case 'get-next-sync-time':
          chrome.alarms.get('webdav-auto-sync', (alarm) => {
            sendResponse({ scheduledTime: alarm?.scheduledTime ?? null });
          });
          return true;
        case 'collect-backup-data':
          handlers.collectBackupData()
            .then((data) => sendResponse({ success: true, data }))
            .catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        case 'webdav-download-file': {
          const { filename } = message;
          handlers.downloadBackupFileAsBase64(filename).then(sendResponse).catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        }
        case 'restore-from-json': {
          const { jsonData, categories } = message;
          let importData: any;
          try { importData = JSON.parse(jsonData); } catch (e: any) {
            sendResponse({ success: false, error: `JSON 解析失败: ${e?.message}` });
            return false;
          }
          handlers.applyImportDataDirect(importData, { categories })
            .then(sendResponse)
            .catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        }
        default:
          return false;
      }
    });
  } catch {}
}
