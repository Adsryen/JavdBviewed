// src/dashboard/tabs/navigation.ts
// 负责标签页的切换、预取、hash 解析与初始化

import { initializeTabById, prefetchModuleById } from './registry';
import { mountTabIfNeeded } from './mount';
import { prefetchedTabs, prefetchTabResources } from './resources';

export async function initTabs(): Promise<void> {
  try {
    console.log('[Navigation] initTabs 开始执行');
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

    const switchTab = (tabButton: Element | null, preserveSubPath: boolean = false) => {
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

        // 对于设置页面，只在明确要求保留子路径时才保留
        let newHash = `#${tabId}`;
        if (tabId === 'tab-settings' && preserveSubPath) {
          const currentHash = window.location.hash.substring(1);
          const [currentMain, currentSub] = currentHash.split('/');
          // 如果当前已经在设置页且有子路径，保留它
          if (currentMain === 'tab-settings' && currentSub) {
            newHash = `#${tabId}/${currentSub}`;
          }
        }

        if (history.pushState) {
          history.pushState(null, '', newHash);
        } else {
          location.hash = newHash;
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

    // 监听 URL 变化（必须在初始化逻辑之前注册，避免提前 return 导致监听器未注册）
    console.log('[Navigation] 注册 hashchange 监听器');
    window.addEventListener('hashchange', async () => {
      console.log('[Navigation] hashchange 事件触发');
      const newHash = window.location.hash.substring(1) || 'tab-home';
      const [newMainTab, newSubSection] = newHash.split('/');
      console.log('[Navigation] newHash:', newHash);
      console.log('[Navigation] newMainTab:', newMainTab);
      console.log('[Navigation] newSubSection:', newSubSection);

      // 如果是设置页（无论是否有子页面），激活设置标签并加载对应页面
      if (newMainTab === 'tab-settings') {
        console.log('[Navigation] 检测到设置页面');
        const settingsTab = document.querySelector(`.tab-link[data-tab="tab-settings"]`);
        const currentActiveTab = document.querySelector('.tab-link.active');
        if (currentActiveTab !== settingsTab) {
          console.log('[Navigation] 激活设置标签');
          // 不要调用 switchTab，直接激活标签，保持原有 URL
          if (settingsTab) {
            if (tabs && (tabs as any).forEach) {
              (tabs as any).forEach((t: Element) => t.classList.remove('active'));
            }
            if (contents && (contents as any).forEach) {
              (contents as any).forEach((c: Element) => c.classList.remove('active'));
            }
            settingsTab.classList.add('active');
            document.getElementById('tab-settings')?.classList.add('active');
          }
        }
        console.log('[Navigation] 调用 mountTabIfNeeded');
        await mountTabIfNeeded('tab-settings');
        console.log('[Navigation] 调用 initializeTabById');
        await initializeTabById('tab-settings');
        console.log('[Navigation] 设置页面处理完成');
        return;
      }

      const currentActiveTab = document.querySelector('.tab-link.active');
      const currentTabId = currentActiveTab?.getAttribute('data-tab');

      if (currentTabId !== newMainTab) {
        const newTargetTab = document.querySelector(`.tab-link[data-tab="${newMainTab}"]`);
        if (newTargetTab) {
          switchTab(newTargetTab, false);
          await mountTabIfNeeded(newMainTab);
        }
      }

      await initializeTabById(newMainTab);
      if (newMainTab === 'tab-home') {
        try { window.dispatchEvent(new CustomEvent('home:init-required')); } catch {}
      }
    });
    console.log('[Navigation] hashchange 监听器注册完成');

    // 解析当前 hash，支持二级路径
    const fullHash = window.location.hash.substring(1) || 'tab-home';
    const [mainTab, subSection] = fullHash.split('/');
    
    // 如果是设置页的子页面，激活设置标签并加载对应页面
    if (mainTab === 'tab-settings' && subSection) {
      const settingsTab = document.querySelector(`.tab-link[data-tab="tab-settings"]`);
      // 不要调用 switchTab，直接激活标签，保持原有 URL
      if (settingsTab) {
        if (tabs && (tabs as any).forEach) {
          (tabs as any).forEach((t: Element) => t.classList.remove('active'));
        }
        if (contents && (contents as any).forEach) {
          (contents as any).forEach((c: Element) => c.classList.remove('active'));
        }
        settingsTab.classList.add('active');
        document.getElementById('tab-settings')?.classList.add('active');
      }
      await mountTabIfNeeded('tab-settings');
      await initializeTabById('tab-settings');
      return;
    }
    
    const targetTab = document.querySelector(`.tab-link[data-tab="${mainTab}"]`);
    switchTab(targetTab || ((tabs && tabs.length > 0) ? tabs[0] : null), false);
    await mountTabIfNeeded(mainTab);

    await initializeTabById(mainTab);
    if (mainTab === 'tab-home') {
      try { window.dispatchEvent(new CustomEvent('home:init-required')); } catch {}
    }
  } catch (error) {
    console.error('初始化标签页时出错:', error);
  }
}
