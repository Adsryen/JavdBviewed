// src/dashboard/tabs/navigation.ts
// 负责标签页的切换、预取、hash 解析与初始化

import { initializeTabById, prefetchModuleById } from './registry';
import { mountTabIfNeeded } from './mount';
import { prefetchedTabs, prefetchTabResources } from './resources';

export async function initTabs(): Promise<void> {
  try {
    const tabs = document.querySelectorAll('.tab-link');
    const contents = document.querySelectorAll('.tab-content');

    if (!tabs || tabs.length === 0) {
      console.warn('未找到标签页链接元素');
      return;
    }
    if (!contents || contents.length === 0) {
      console.warn('未找到标签页内容元素');
      return;
    }

    const switchTab = (tabButton: Element | null) => {
      if (!tabButton) return;
      const tabId = tabButton.getAttribute('data-tab');
      if (!tabId) return;

      try {
        // 在移除 active 前记录之前的激活 tab，用于分发 hide
        let prevId: string | null = null;
        try {
          const prevActive = document.querySelector('.tab-link.active') as Element | null;
          prevId = (prevActive?.getAttribute('data-tab') ?? null);
        } catch {}

        if (tabs && (tabs as any).forEach) {
          (tabs as any).forEach((t: Element) => t.classList.remove('active'));
        }
        if (contents && (contents as any).forEach) {
          (contents as any).forEach((c: Element) => c.classList.remove('active'));
        }

        // 分发隐藏事件（上一个激活的 tab）
        try {
          if (prevId) window.dispatchEvent(new CustomEvent('tab:hide', { detail: { tabId: prevId } }));
        } catch {}

        tabButton.classList.add('active');
        document.getElementById(tabId)?.classList.add('active');

        if (history.pushState) {
          history.pushState(null, '', `#${tabId}`);
        } else {
          location.hash = `#${tabId}`;
        }

        // 分发显示事件（当前激活的 tab）
        try {
          window.dispatchEvent(new CustomEvent('tab:show', { detail: { tabId } }));
        } catch {}
      } catch (error) {
        console.error('切换标签页时出错:', error);
      }
    };

    // 给每个标签页添加预取与点击事件
    if (tabs && (tabs as any).forEach) {
      (tabs as any).forEach((tab: Element) => {
        try {
          // 悬停预取资源，提升首次点击体验
          tab.addEventListener('mouseenter', () => {
            const id = tab.getAttribute('data-tab') || '';
            if (!id || prefetchedTabs.has(id)) return;
            try { prefetchModuleById(id); } catch {}
            prefetchTabResources(id);
          });

          tab.addEventListener('click', async () => {
            switchTab(tab);
            const tabId = tab.getAttribute('data-tab');
            await mountTabIfNeeded(tabId || '');
            await initializeTabById(tabId || '');
          });
        } catch (error) {
          console.error('为标签页添加事件监听器时出错:', error);
        }
      });
    }

    // 解析当前 hash，支持二级路径
    const fullHash = window.location.hash.substring(1) || 'tab-home';
    const [mainTab, subSection] = fullHash.split('/');
    const targetTab = document.querySelector(`.tab-link[data-tab="${mainTab}"]`);
    switchTab(targetTab || ((tabs && tabs.length > 0) ? tabs[0] : null));
    await mountTabIfNeeded(mainTab);

    // 如果是设置页且有子页面，保存子页面信息供设置页初始化时使用
    if (mainTab === 'tab-settings' && subSection) {
      (window as any).initialSettingsSection = subSection;
    }

    await initializeTabById(mainTab);
    if (mainTab === 'tab-home') {
      try { window.dispatchEvent(new CustomEvent('home:init-required')); } catch {}
    }

    // 如果初始化时就是设置页且有子页面，立即触发切换事件
    if (mainTab === 'tab-settings' && subSection) {
      // 延迟触发，确保设置页面已经初始化完成
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('settingsSubSectionChange', {
          detail: { section: subSection }
        }));
      }, 100);
    }

    // 监听 URL 变化
    window.addEventListener('hashchange', async () => {
      const newHash = window.location.hash.substring(1) || 'tab-home';
      const [newMainTab, newSubSection] = newHash.split('/');

      const currentActiveTab = document.querySelector('.tab-link.active');
      const currentTabId = currentActiveTab?.getAttribute('data-tab');

      if (currentTabId !== newMainTab) {
        const newTargetTab = document.querySelector(`.tab-link[data-tab="${newMainTab}"]`);
        if (newTargetTab) {
          switchTab(newTargetTab);
          await mountTabIfNeeded(newMainTab);
        }
      }

      await initializeTabById(newMainTab);
      if (newMainTab === 'tab-home') {
        try { window.dispatchEvent(new CustomEvent('home:init-required')); } catch {}
      }

      if (newMainTab === 'tab-settings' && newSubSection) {
        window.dispatchEvent(new CustomEvent('settingsSubSectionChange', {
          detail: { section: newSubSection }
        }));
      }
    });
  } catch (error) {
    console.error('初始化标签页时出错:', error);
  }
}
