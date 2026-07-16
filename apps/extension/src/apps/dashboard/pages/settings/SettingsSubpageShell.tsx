/**
 * @file SettingsSubpageShell.tsx
 * @description 设置子页极简壳：仅固定返回钮；正文完全保留 partial 原样
 * @module apps/dashboard/pages/settings
 */

export type SettingsSubpageShellProps = {
  /** 保留参数以兼容 mount API；标题/说明由 partial 自带 header 展示 */
  title: string;
  description?: string;
  /** 遗留面板 HTML（由 React 写入，避免手动 innerHTML 被协调清掉） */
  panelHtml: string;
  /** 内容宿主 id，供面板 init 的 getElementById 使用 */
  bodyHostId: string;
};

/**
 * 子设置页外壳
 * - 不引入 Tailwind/PageHeader，避免污染遗留卡片悬浮与弹窗样式
 * - partial 内原标题/说明保留；仅隐藏 partial 自带返回钮（改用壳上固定钮）
 */
export function SettingsSubpageShell({
  panelHtml,
  bodyHostId,
}: SettingsSubpageShellProps) {
  return (
    <div className="ssp-page" data-settings-subpage="react-shell">
      <div className="ssp-back-bar">
        <button type="button" className="ssp-back" data-action="back-to-settings">
          ← 返回设置
        </button>
      </div>
      <div
        className="ssp-body"
        id={bodyHostId}
        data-settings-panel-host="1"
        dangerouslySetInnerHTML={{ __html: panelHtml }}
      />
    </div>
  );
}
