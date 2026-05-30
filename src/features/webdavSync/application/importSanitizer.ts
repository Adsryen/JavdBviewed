export function sanitizeImportedSettings(importedSettings: any, currentSettings: any): any {
  if (!importedSettings || typeof importedSettings !== 'object') return importedSettings;
  const next = { ...importedSettings, webdav: { ...(importedSettings.webdav || {}) } };
  const currentWebdav = currentSettings?.webdav || {};
  next.webdav.clientId = currentWebdav.clientId || next.webdav.clientId || '';
  next.webdav.deviceLabel = currentWebdav.deviceLabel || next.webdav.deviceLabel || '';
  next.webdav.browserName = currentWebdav.browserName || next.webdav.browserName || '';
  next.webdav.clientInstalledAt = currentWebdav.clientInstalledAt || next.webdav.clientInstalledAt || '';
  return next;
}
