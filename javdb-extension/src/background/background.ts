// src/background/background.ts
// 背景入口：装配与注册各模块

import { installDrive115V2Proxy } from './drive115Proxy';
import { installConsoleProxyWithSettings } from './consoleConfig';
import { registerWebDAVRouter } from './webdav';
import { registerDbMessageRouter } from './dbRouter';
import { registerMiscRouter } from './miscHandlers';
import { ensureMigrationsStart } from './migrations';
import { newWorksScheduler } from '../services/newWorks';

// 启动期安装/初始化
installDrive115V2Proxy();
installConsoleProxyWithSettings();
ensureMigrationsStart();

// 注册所有消息路由
registerWebDAVRouter();
registerDbMessageRouter();
registerMiscRouter();

// 浏览器启动时初始化新作品调度器
try {
  chrome.runtime.onStartup.addListener(async () => {
    try {
      await newWorksScheduler.initialize();
    } catch (e: any) {
      console.warn('[Background] Failed to initialize new works scheduler:', e?.message || e);
    }
  });
} catch {}
