/**
 * @file SettingsSubpageShell.tsx
 * @description 设置子页 React 壳：返回栏固定左上 + 居中标题 + partial 内容区
 * @module apps/dashboard/pages/settings
 */
import { PageHeader } from '../../../../ui/patterns/PageHeader/PageHeader';

export type SettingsSubpageShellProps = {
  title: string;
  description?: string;
  /** 遗留面板 HTML（由 React 写入，避免手动 innerHTML 被协调清掉） */
  panelHtml: string;
  /** 内容宿主 id，供面板 init 的 getElementById 使用 */
  bodyHostId: string;
};

/**
 * 子设置页外壳（与 SettingsPageFrame 同一返回钮布局）
 */
export function SettingsSubpageShell({
  title,
  description,
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
      <div className="mx-auto w-full max-w-3xl px-1">
        <PageHeader
          className="ssp-header"
          align="center"
          title={title}
          description={description}
        />
      </div>
      {/* 关键：partial 必须走 React 属性注入，禁止 render 后再 body.innerHTML=... */}
      <div
        className="ssp-body mx-auto w-full max-w-3xl px-1"
        id={bodyHostId}
        data-settings-panel-host="1"
        dangerouslySetInnerHTML={{ __html: panelHtml }}
      />
    </div>
  );
}
