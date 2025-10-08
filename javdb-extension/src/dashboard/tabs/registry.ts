// src/dashboard/tabs/registry.ts
// 集中管理各 Tab 的初始化逻辑，并使用动态 import 进行代码分割

export async function initializeTabById(tabId: string | null | undefined): Promise<void> {
  if (!tabId) return;
  try {
    switch (tabId) {
      case 'tab-records': {
        const { initRecordsTab } = await import('./records');
        await initRecordsTab();
        break;
      }
      case 'tab-actors': {
        const { actorsTab } = await import('./actors');
        if (!actorsTab.isInitialized) await actorsTab.initActorsTab();
        break;
      }
      case 'tab-new-works': {
        const { newWorksTab } = await import('./newWorks');
        if (!newWorksTab.isInitialized) await newWorksTab.initialize();
        break;
      }
      case 'tab-sync': {
        const { syncTab } = await import('./sync');
        await syncTab.initSyncTab();
        break;
      }
      case 'tab-logs': {
        const { logsTab } = await import('./logs');
        if (!logsTab.isInitialized) await logsTab.initialize();
        break;
      }
      case 'tab-drive115-tasks': {
        let mgr = (window as any).drive115TasksManager;
        if (!mgr) {
          const { Drive115TasksManager } = await import('./drive115Tasks');
          mgr = new Drive115TasksManager();
          (window as any).drive115TasksManager = mgr;
        }
        await mgr.initialize();
        break;
      }
      case 'tab-settings': {
        const { initSettingsTab } = await import('./settings');
        await initSettingsTab();
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error('[tabs/registry] initializeTabById failed for', tabId, error);
  }
}

// 仅预取模块代码，不执行初始化，用于悬停预取
export async function prefetchModuleById(tabId: string | null | undefined): Promise<void> {
  if (!tabId) return;
  try {
    switch (tabId) {
      case 'tab-records':
        await import('./records');
        break;
      case 'tab-actors':
        await import('./actors');
        break;
      case 'tab-new-works':
        await import('./newWorks');
        break;
      case 'tab-sync':
        await import('./sync');
        break;
      case 'tab-logs':
        await import('./logs');
        break;
      case 'tab-drive115-tasks':
        await import('./drive115Tasks');
        break;
      case 'tab-settings':
        await import('./settings');
        break;
      default:
        break;
    }
  } catch (error) {
    console.warn('[tabs/registry] prefetchModuleById failed for', tabId, error);
  }
}
