/**
 * @file reactMain.tsx
 * @description 新 UI 栈预览入口（W2 前不挂到 dashboard.html，仅供本地/Storybook 对照）
 * @module apps/dashboard
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '../../ui/primitives/Button/Button';
import '../../ui/styles/globals.css';

/**
 * 地基验收用最小页面
 */
function App() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-6 text-[var(--color-fg)]">
      <h1 className="mb-4 text-xl font-bold">Dashboard UI 地基</h1>
      <p className="mb-4 text-sm text-[var(--color-fg-muted)]">
        React + Token + Tailwind 脚手架。W2 外壳迁移后再正式接入入口。
      </p>
      <div className="flex flex-wrap gap-3">
        <Button>主要按钮</Button>
        <Button variant="secondary">次要按钮</Button>
        <Button variant="ghost">幽灵按钮</Button>
      </div>
    </div>
  );
}

const el = document.getElementById('dashboard-react-root');
if (el) {
  createRoot(el).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

export {};
