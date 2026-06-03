import { STATE } from '../../dashboard/state';
import { getDisplayVersionInfo } from '../../shared/utils/versionInfo';

export function renderDashboardVersionInfo(): void {
  const infoContainer = document.getElementById('versionInfoSidebar') || document.getElementById('infoContainer');
  if (!infoContainer) return;

  let manifestVersion = '';
  try {
    manifestVersion = chrome?.runtime?.getManifest?.().version || '';
  } catch {}

  const versionInfo = getDisplayVersionInfo({
    manifestVersion,
    env: import.meta.env,
  });
  const deviceId = String(STATE.settings?.webdav?.clientId || '').trim();

  const buildLine = versionInfo.buildNumber
    ? `
        <div class="info-item">
            <span class="info-label">Build:</span>
            <span class="info-value">${versionInfo.buildNumber}</span>
        </div>`
    : '';

  const commitLine = versionInfo.commit
    ? `
        <div class="info-item">
            <span class="info-label">Commit:</span>
            <span class="info-value">${versionInfo.commit}</span>
        </div>`
    : '';

  const stateLine = `
        <div class="info-item">
            <span class="info-label">State:</span>
            <span class="info-value version-state-${versionInfo.state}" title="${getStateTitle(versionInfo.state)}">${versionInfo.state}</span>
        </div>`;

  const builtAtLine = versionInfo.builtAt
    ? `
        <div class="info-item">
            <span class="info-label">Built At:</span>
            <span class="info-value">${versionInfo.builtAt}</span>
        </div>`
    : '';

  const deviceIdLine = deviceId
    ? `
        <div class="info-item">
            <span class="info-label">Device ID:</span>
            <span class="info-value" title="当前 WebDAV 客户端设备 ID">${deviceId}</span>
        </div>`
    : '';

  infoContainer.innerHTML = `
        <div class="info-item">
            <span class="info-label">Version:</span>
            <span class="info-value version-state-${versionInfo.state}" title="${getStateTitle(versionInfo.state)}">${versionInfo.version}</span>
        </div>${buildLine}${commitLine}${stateLine}${builtAtLine}${deviceIdLine}
    `;
}

function getStateTitle(state: string): string {
  switch (state) {
    case 'clean':
      return '此版本基于干净且完全提交的 Git 工作区构建。';
    case 'staged':
      return '此版本包含已暂存但未提交的更改。';
    case 'dirty':
      return '警告：此版本包含未提交或未暂存的本地修改（dirty）。';
    default:
      return '无法确定此版本的构建状态。';
  }
}
