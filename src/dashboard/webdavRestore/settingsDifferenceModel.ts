export const SETTINGS_DIFFERENCE_MODAL_CLASS = 'settings-diff-modal';

export interface SettingsDifferenceInput {
  local?: unknown;
  cloud?: unknown;
}

export interface SettingsDifferenceOpenState {
  bodyOverflow: string;
  initialStyle: Record<string, string>;
  animatedStyle: Record<string, string>;
}

export interface SettingsDifferenceCloseState {
  bodyOverflow: string;
  animationDurationMs: number;
  closingStyle: Record<string, string>;
}

export function getSettingsDifferenceOverlayStyle(): string {
  return `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.6) !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        backdrop-filter: blur(4px) !important;
    `;
}

export function getSettingsDifferenceOpenState(): SettingsDifferenceOpenState {
  return {
    bodyOverflow: 'hidden',
    initialStyle: {
      opacity: '0',
      transform: 'scale(0.9)',
      transition: 'all 0.3s ease-out',
    },
    animatedStyle: {
      opacity: '1',
      transform: 'scale(1)',
    },
  };
}

export function getSettingsDifferenceCloseState(): SettingsDifferenceCloseState {
  return {
    bodyOverflow: '',
    animationDurationMs: 300,
    closingStyle: {
      opacity: '0',
      transform: 'scale(0.9)',
    },
  };
}

export function buildSettingsDifferenceModalHtml(settingsDiff: SettingsDifferenceInput): string {
  const localJson = stringifySettings(settingsDiff.local);
  const cloudJson = stringifySettings(settingsDiff.cloud);

  return `
        <div style="
            background: white !important;
            border-radius: 16px !important;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
            max-width: 90vw !important;
            max-height: 90vh !important;
            width: 1000px !important;
            overflow: hidden !important;
            position: relative !important;
        ">
            <!-- 标题栏 -->
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                color: white !important;
                padding: 20px 24px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
            ">
                <h3 style="
                    margin: 0 !important;
                    font-size: 20px !important;
                    font-weight: 700 !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 12px !important;
                ">
                    <span style="font-size: 18px !important;">⚙️</span>
                    扩展设置差异对比
                </h3>
                <button id="closeSettingsDiff" style="
                    background: none !important;
                    border: none !important;
                    color: white !important;
                    font-size: 18px !important;
                    cursor: pointer !important;
                    padding: 8px !important;
                    border-radius: 8px !important;
                    transition: background-color 0.3s ease !important;
                " onmouseover="this.style.backgroundColor='rgba(255,255,255,0.2)'" onmouseout="this.style.backgroundColor='transparent'">
                    ✕
                </button>
            </div>

            <!-- 主体内容 -->
            <div style="
                padding: 24px !important;
                max-height: 70vh !important;
                overflow-y: auto !important;
            ">
                <!-- 对比区域 -->
                <div style="
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 24px !important;
                    margin-bottom: 24px !important;
                ">
                    <!-- 本地设置 -->
                    <div style="
                        border: 2px solid #e2e8f0 !important;
                        border-radius: 12px !important;
                        overflow: hidden !important;
                    ">
                        <div style="
                            background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%) !important;
                            padding: 16px 20px !important;
                            border-bottom: 2px solid #e2e8f0 !important;
                        ">
                            <div style="
                                display: flex !important;
                                align-items: center !important;
                                gap: 8px !important;
                                font-weight: 700 !important;
                                color: #2d3748 !important;
                                font-size: 16px !important;
                                margin-bottom: 4px !important;
                            ">
                                <span>💻</span>
                                本地设置
                            </div>
                            <small style="color: #6b7280 !important; font-size: 12px !important;">当前扩展配置</small>
                        </div>
                        <div style="
                            padding: 16px !important;
                            background: #f8fafc !important;
                            max-height: 400px !important;
                            overflow-y: auto !important;
                        ">
                            <pre style="
                                margin: 0 !important;
                                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
                                font-size: 12px !important;
                                line-height: 1.5 !important;
                                color: #2d3748 !important;
                                white-space: pre-wrap !important;
                                word-break: break-word !important;
                                background: none !important;
                                padding: 0 !important;
                                border: none !important;
                            ">${localJson}</pre>
                        </div>
                    </div>

                    <!-- 云端设置 -->
                    <div style="
                        border: 2px solid #e2e8f0 !important;
                        border-radius: 12px !important;
                        overflow: hidden !important;
                    ">
                        <div style="
                            background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%) !important;
                            padding: 16px 20px !important;
                            border-bottom: 2px solid #e2e8f0 !important;
                        ">
                            <div style="
                                display: flex !important;
                                align-items: center !important;
                                gap: 8px !important;
                                font-weight: 700 !important;
                                color: #2d3748 !important;
                                font-size: 16px !important;
                                margin-bottom: 4px !important;
                            ">
                                <span>☁️</span>
                                云端设置
                            </div>
                            <small style="color: #6b7280 !important; font-size: 12px !important;">备份文件配置</small>
                        </div>
                        <div style="
                            padding: 16px !important;
                            background: #f8fafc !important;
                            max-height: 400px !important;
                            overflow-y: auto !important;
                        ">
                            <pre style="
                                margin: 0 !important;
                                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
                                font-size: 12px !important;
                                line-height: 1.5 !important;
                                color: #2d3748 !important;
                                white-space: pre-wrap !important;
                                word-break: break-word !important;
                                background: none !important;
                                padding: 0 !important;
                                border: none !important;
                            ">${cloudJson}</pre>
                        </div>
                    </div>
                </div>

                <!-- 说明信息 -->
                <div style="
                    background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%) !important;
                    border: 2px solid #4fd1c7 !important;
                    border-radius: 12px !important;
                    padding: 16px !important;
                    display: flex !important;
                    align-items: flex-start !important;
                    gap: 12px !important;
                ">
                    <div style="
                        color: #319795 !important;
                        font-size: 18px !important;
                        margin-top: 2px !important;
                    ">ℹ️</div>
                    <div>
                        <p style="
                            margin: 0 0 8px 0 !important;
                            color: #2d3748 !important;
                            line-height: 1.5 !important;
                            font-weight: 600 !important;
                        ">说明：恢复时将根据选择的合并策略处理设置差异</p>
                        <p style="
                            margin: 0 !important;
                            color: #4a5568 !important;
                            font-size: 14px !important;
                            line-height: 1.5 !important;
                        ">建议仔细对比两边的设置，确认是否需要保留本地配置</p>
                    </div>
                </div>
            </div>

            <!-- 底部按钮 -->
            <div style="
                background: #f8fafc !important;
                border-top: 2px solid #e2e8f0 !important;
                padding: 16px 24px !important;
                display: flex !important;
                justify-content: flex-end !important;
            ">
                <button id="closeSettingsDiffFooter" style="
                    background: #6b7280 !important;
                    color: white !important;
                    border: none !important;
                    padding: 12px 24px !important;
                    border-radius: 8px !important;
                    cursor: pointer !important;
                    font-size: 14px !important;
                    font-weight: 600 !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                    transition: background-color 0.3s ease !important;
                " onmouseover="this.style.backgroundColor='#4a5568'" onmouseout="this.style.backgroundColor='#6b7280'">
                    <span>✕</span>
                    关闭
                </button>
            </div>
        </div>
    `;
}

function stringifySettings(value: unknown): string {
  return escapeHtml(JSON.stringify(value || {}, null, 2));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
