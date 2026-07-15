/**
 * @file DisplaySettingsPage.tsx
 * @description 显示设置 React 全页：番号过滤 + 演员列表过滤（自研 patterns）
 * @module apps/dashboard/pages/settings/display
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { PageHeader } from '../../../../../ui/patterns/PageHeader/PageHeader';
import { SettingSection } from '../../../../../ui/patterns/SettingSection/SettingSection';
import { SettingToggleRow } from '../../../../../ui/patterns/SettingToggleRow/SettingToggleRow';
import type { ExtensionSettings } from '../../../../../types';
import { getSettings, saveSettings } from '../../../../../utils/storage';
import {
  ACTOR_LIST_FILTER_FIELDS,
  applyDisplayFormToSettings,
  DEFAULT_DISPLAY_SETTINGS_FORM,
  DISPLAY_FILTER_FIELDS,
  mapSettingsToDisplayForm,
  type DisplaySettingsFormState,
} from './displaySettingsModel';
import './displaySettingsPage.css';
const AUTO_SAVE_MS = 500;

/**
 * 通知已打开的 JavDB 标签页设置已更新（与遗留 DisplaySettings 一致）
 */
function notifyJavdbTabsSettingsUpdated(): void {
  try {
    chrome.tabs.query({ url: '*://javdb.com/*' }, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'settings-updated' }, () => {
            if (chrome.runtime.lastError) {
              console.debug(
                '[DisplaySettingsPage] 跳过未连接的 JavDB 标签页:',
                tab.id,
                chrome.runtime.lastError.message,
              );
            }
          });
        }
      });
    });
  } catch (err) {
    console.debug('[DisplaySettingsPage] notify tabs failed', err);
  }
}

/**
 * 尝试更新 dashboard STATE.settings，避免与遗留面板状态脱节
 */
async function syncDashboardState(settings: ExtensionSettings): Promise<void> {
  try {
    const { STATE } = await import('../../../../../dashboard/state');
    STATE.settings = settings;
  } catch {
    /* 非 dashboard 上下文可忽略 */
  }
}

/**
 * 显示设置完整页面（自包含 PageHeader + 表单）
 */
export function DisplaySettingsPage() {
  const [form, setForm] = useState<DisplaySettingsFormState>(DEFAULT_DISPLAY_SETTINGS_FORM);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const settings = await getSettings();
        if (cancelled) return;
        setForm(mapSettingsToDisplayForm(settings));
      } catch (err) {
        console.error('[DisplaySettingsPage] load failed', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, []);

  const persist = useCallback(async (nextForm: DisplaySettingsFormState) => {
    try {
      const current = await getSettings();
      const next = applyDisplayFormToSettings(current, nextForm);
      await saveSettings(next);
      await syncDashboardState(next);
      notifyJavdbTabsSettingsUpdated();
      if (mountedRef.current) setSaveError(null);
    } catch (err) {
      console.error('[DisplaySettingsPage] save failed', err);
      if (mountedRef.current) {
        setSaveError(err instanceof Error ? err.message : '保存失败');
      }
    }
  }, []);

  const scheduleSave = useCallback(
    (nextForm: DisplaySettingsFormState) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        void persist(nextForm);
      }, AUTO_SAVE_MS);
    },
    [persist],
  );

  const updateField = useCallback(
    <K extends keyof DisplaySettingsFormState>(key: K, value: DisplaySettingsFormState[K]) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  return (
    <div
      className="dsp-page mx-auto w-full max-w-3xl px-1 pb-8"
      data-display-settings-react="1"
      data-settings-stack="react-display"
    >
      <PageHeader
        className="mb-5"
        align="center"
        eyebrow={
          <button
            type="button"
            className="ssp-back"
            data-action="back-to-settings"
          >
            ← 返回设置
          </button>
        }
        title="列表显示设置"
        description="控制在JavDB网站上访问时，是否自动隐藏符合条件的影片。"
      />

      {loading ? (
        <p className="m-0 text-[13px] text-[var(--color-fg-muted)]">加载中…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SettingSection title="番号过滤">
              {DISPLAY_FILTER_FIELDS.map((field) => (
                <SettingToggleRow
                  key={field.id}
                  id={field.id}
                  label={field.label}
                  checked={form[field.key]}
                  onChange={(checked) => updateField(field.key, checked)}
                />
              ))}
            </SettingSection>

            <SettingSection title="演员过滤（列表）">
              {ACTOR_LIST_FILTER_FIELDS.map((field) => (
                <SettingToggleRow
                  key={field.id}
                  id={field.id}
                  label={field.label}
                  checked={form[field.key]}
                  onChange={(checked) => updateField(field.key, checked)}
                />
              ))}
            </SettingSection>
          </div>

          <div className="rounded-[var(--radius-3)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3">
            <p className="m-0 text-[12.5px] leading-relaxed text-[var(--color-fg-muted)]">
              基于本地演员库与订阅信息，近似识别标题中的演员并进行过滤。(通过标题识别，故存在一定误差)
            </p>
            <p className="mt-1.5 mb-0 text-[12.5px] leading-relaxed text-[var(--color-fg-muted)]">
              说明：演员过滤相关选项属于
              <b className="text-[var(--color-fg)]">功能增强（列表增强）</b>
              相关开关，JSON配置也不归入&quot;列表显示设置&quot;内。
            </p>
          </div>

          {saveError ? (
            <p className="m-0 text-[12.5px] text-[var(--color-danger,#c0392b)]" role="alert">
              保存失败：{saveError}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
