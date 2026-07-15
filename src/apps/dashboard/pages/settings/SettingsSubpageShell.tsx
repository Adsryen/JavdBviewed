/**
 * @file SettingsSubpageShell.tsx
 * @description 设置子页 React 壳：返回栏 + 标题 + 内容区（partial HTML 由 React 托管注入）
 * @module apps/dashboard/pages/settings
 */
export type SettingsSubpageShellProps = {
  title: string;
  description?: string;
  /** 遗留面板 HTML（由 React 写入，避免手动 innerHTML 被协调清掉） */
  panelHtml: string;
  /** 内容宿主 id，供面板 init 的 getElementById 使用 */
  bodyHostId: string;
};

/**
 * 子设置页外壳
 */
export function SettingsSubpageShell({
  title,
  description,
  panelHtml,
  bodyHostId,
}: SettingsSubpageShellProps) {
  return (
    <div className="ssp-page" data-settings-subpage="react-shell">
      <header className="ssp-header">
        <button
          type="button"
          className="ssp-back"
          data-action="back-to-settings"
        >
          ← 返回设置
        </button>
        <div className="ssp-heading">
          <h2 className="ssp-title">{title}</h2>
          {description ? <p className="ssp-desc">{description}</p> : null}
        </div>
      </header>
      {/* 关键：partial 必须走 React 属性注入，禁止 render 后再 body.innerHTML=... */}
      <div
        className="ssp-body"
        id={bodyHostId}
        data-settings-panel-host="1"
        dangerouslySetInnerHTML={{ __html: panelHtml }}
      />
    </div>
  );
}
