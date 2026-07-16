/**
 * @file LogSettingsPage.tsx
 * @description 日志设置 React 全页
 * @module apps/dashboard/pages/settings/log
 */
import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../../../../ui/primitives/Button/Button';
import { Input } from '../../../../../ui/primitives/Input/Input';
import { SettingSection } from '../../../../../ui/patterns/SettingSection/SettingSection';
import { SettingField } from '../../../../../ui/patterns/SettingField/SettingField';
import { SettingSelect } from '../../../../../ui/patterns/SettingSelect/SettingSelect';
import { SettingToggleRow } from '../../../../../ui/patterns/SettingToggleRow/SettingToggleRow';
import { SettingsPageFrame } from '../shared/settingsPageFrame';
import {
  getSettings,
  saveSettings,
  syncDashboardState,
  useDebouncedSettingsSave,
} from '../shared/settingsPersist';
import {
  applyEnableAll,
  applyLogFormToSettings,
  applyMuteAll,
  applyResetDefault,
  CONSOLE_LEVEL_OPTIONS,
  DEFAULT_LOG_SETTINGS_FORM,
  LOG_MODULE_FIELDS,
  mapSettingsToLogForm,
  TIMEZONE_OPTIONS,
  validateLogForm,
  type ConsoleLevel,
  type LogModulesState,
  type LogSettingsFormState,
} from './logSettingsModel';

const AUTO_SAVE_MS = 1000;

function parseNum(raw: string, fallback: number): number {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

async function notifyLogController(): Promise<void> {
  try {
    const { onSettingsChanged } = await import('../../../../../utils/logController');
    onSettingsChanged();
  } catch {
    /* ignore */
  }
}

async function toast(message: string, type: 'success' | 'info' = 'info'): Promise<void> {
  try {
    const { showMessage } = await import('../../../../../dashboard/ui/toast');
    showMessage(message, type);
  } catch {
    /* ignore */
  }
}

/**
 * 日志设置完整页面
 */
export function LogSettingsPage() {
  const [form, setForm] = useState<LogSettingsFormState>(DEFAULT_LOG_SETTINGS_FORM);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  const persist = useCallback(async (nextForm: LogSettingsFormState) => {
    const v = validateLogForm(nextForm);
    if (!v.isValid) {
      setSaveError(v.errors[0] || '校验失败');
      return;
    }
    try {
      const current = await getSettings();
      const next = applyLogFormToSettings(current, nextForm);
      await saveSettings(next);
      await syncDashboardState(next);
      await notifyLogController();
      setSaveError(null);
    } catch (err) {
      console.error('[LogSettingsPage] save failed', err);
      setSaveError(err instanceof Error ? err.message : '保存失败');
    }
  }, []);

  const { scheduleSave, flush } = useDebouncedSettingsSave({
    delayMs: AUTO_SAVE_MS,
    persist,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const settings = await getSettings();
        if (cancelled) return;
        setForm(mapSettingsToLogForm(settings));
      } catch (err) {
        console.error('[LogSettingsPage] load failed', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(
    <K extends keyof LogSettingsFormState>(key: K, value: LogSettingsFormState[K]) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const updateModule = useCallback(
    (key: keyof LogModulesState, value: boolean) => {
      setForm((prev) => {
        const next = {
          ...prev,
          modules: { ...prev.modules, [key]: value },
        };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const applyShortcut = useCallback(
    (mapper: (f: LogSettingsFormState) => LogSettingsFormState, message: string, type: 'success' | 'info' = 'info') => {
      setForm((prev) => {
        const next = mapper(prev);
        void flush(next);
        void toast(message, type);
        return next;
      });
    },
    [flush],
  );

  return (
    <SettingsPageFrame
      title="日志设置"
      description="配置扩展程序的日志记录行为。"
      rootDataAttrs={{ 'data-log-settings-react': '1' }}
    >
      {loading ? (
        <p className="m-0 text-[13px] text-[var(--color-fg-muted)]">加载中…</p>
      ) : (
        <div className="flex flex-col gap-4" id="log-settings">
          <SettingSection title="全局控制" description="控制所有日志的全局行为和存储设置。">
            <div className="flex flex-wrap gap-2 px-2 py-2">
              <Button
                id="consoleMuteAll"
                variant="secondary"
                onClick={() => applyShortcut(applyMuteAll, '所有日志已静默', 'info')}
              >
                全部静默
              </Button>
              <Button
                id="consoleEnableAll"
                variant="primary"
                onClick={() =>
                  applyShortcut(applyEnableAll, '所有日志已启用（DEBUG级别）', 'success')
                }
              >
                全部启用
              </Button>
              <Button
                id="consoleResetDefault"
                variant="secondary"
                onClick={() =>
                  applyShortcut(applyResetDefault, '已恢复默认日志配置（INFO级别）', 'success')
                }
              >
                恢复默认
              </Button>
            </div>

            <SettingField
              id="consoleLevel"
              label="日志级别（全局阈值）"
              description="全局过滤：只显示该级别及以上的日志。与下方功能模块日志联动生效。"
            >
              <SettingSelect
                id="consoleLevel"
                value={form.consoleLevel}
                onChange={(v) => update('consoleLevel', v as ConsoleLevel)}
                options={[...CONSOLE_LEVEL_OPTIONS]}
              />
            </SettingField>

            <div className="grid gap-1 sm:grid-cols-2">
              <SettingField
                id="maxLogEntries"
                label="最大保存条数"
                description="持久化日志的最大保存条数（100-50000）。"
              >
                <Input
                  id="maxLogEntries"
                  type="number"
                  min={100}
                  max={50000}
                  value={String(form.maxLogEntries)}
                  onChange={(e) =>
                    update('maxLogEntries', parseNum(e.currentTarget.value, form.maxLogEntries))
                  }
                />
              </SettingField>
              <SettingField
                id="maxMagnetPushEntries"
                label="磁力推送最大条数"
                description="仅针对 115 磁力推送记录的保留上限。"
              >
                <Input
                  id="maxMagnetPushEntries"
                  type="number"
                  min={100}
                  max={50000}
                  value={String(form.maxMagnetPushEntries)}
                  onChange={(e) =>
                    update(
                      'maxMagnetPushEntries',
                      parseNum(e.currentTarget.value, form.maxMagnetPushEntries),
                    )
                  }
                />
              </SettingField>
              <SettingField
                id="logRetentionDays"
                label="日志保留天数"
                description="设置为 0 表示不按天数清理，仅受最大条数限制。"
              >
                <Input
                  id="logRetentionDays"
                  type="number"
                  min={0}
                  max={3650}
                  value={String(form.retentionDays)}
                  onChange={(e) =>
                    update('retentionDays', parseNum(e.currentTarget.value, form.retentionDays))
                  }
                />
              </SettingField>
            </div>

            {/* 遗留兼容：隐藏字段保留稳定 id 供设置搜索锚点 */}
            <div className="hidden" aria-hidden="true">
              <input type="checkbox" id="verboseMode" checked={form.verboseMode} onChange={() => {}} />
              <input
                type="checkbox"
                id="showPrivacyLogs"
                checked={form.showPrivacyLogs}
                onChange={() => {}}
              />
              <input
                type="checkbox"
                id="showStorageLogs"
                checked={form.showStorageLogs}
                onChange={() => {}}
              />
            </div>
          </SettingSection>

          <SettingSection title="显示格式" description="自定义控制台日志的显示样式。">
            <div className="grid gap-0.5 sm:grid-cols-2">
              <SettingToggleRow
                id="consoleShowTimestamp"
                label="显示时间戳"
                checked={form.showTimestamp}
                onChange={(c) => update('showTimestamp', c)}
              />
              <SettingToggleRow
                id="consoleShowMilliseconds"
                label="显示毫秒"
                checked={form.showMilliseconds}
                onChange={(c) => update('showMilliseconds', c)}
              />
              <SettingToggleRow
                id="consoleShowSource"
                label="显示来源标签"
                checked={form.showSource}
                onChange={(c) => update('showSource', c)}
              />
              <SettingToggleRow
                id="consoleColor"
                label="彩色输出"
                checked={form.color}
                onChange={(c) => update('color', c)}
              />
            </div>
            <SettingField
              id="consoleTimeZone"
              label="时区设置"
              description="选择时区，用于格式化日志时间戳显示。"
            >
              <SettingSelect
                id="consoleTimeZone"
                value={form.timeZone}
                onChange={(v) => update('timeZone', v)}
                options={[...TIMEZONE_OPTIONS]}
              />
            </SettingField>
          </SettingSection>

          <SettingSection
            title="功能模块日志"
            description="按功能模块精细控制日志输出。需同时满足上方日志级别阈值才会显示。"
          >
            <SettingToggleRow
              id="suppressConsoleOutput"
              label="仅抑制控制台输出（数据库仍保存）"
              description="勾选后，模块日志不会输出到浏览器控制台，但仍会保存到数据库。"
              checked={form.suppressConsoleOutput}
              onChange={(c) => update('suppressConsoleOutput', c)}
            />
            <div className="grid gap-0.5 sm:grid-cols-2">
              {LOG_MODULE_FIELDS.map((field) => (
                <SettingToggleRow
                  key={field.id}
                  id={field.id}
                  label={`${field.label} ${field.tag}`}
                  description={field.description}
                  checked={form.modules[field.key]}
                  onChange={(c) => updateModule(field.key, c)}
                />
              ))}
            </div>
            <div className="mx-2 mt-2 rounded-[var(--radius-2)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-[12px] leading-relaxed text-[var(--color-fg-muted)]">
              <strong className="text-[var(--color-fg)]">如何使用：</strong>
              勾选模块后，该模块的日志会在浏览器控制台（F12）中显示。日志格式：
              [时间] [级别] [标签] 消息内容。建议日常保持默认，遇问题再启用相关模块。
            </div>
          </SettingSection>

          {saveError ? (
            <p className="m-0 text-[12.5px] text-[var(--color-danger,#c0392b)]" role="alert">
              保存失败：{saveError}
            </p>
          ) : null}
        </div>
      )}
    </SettingsPageFrame>
  );
}
