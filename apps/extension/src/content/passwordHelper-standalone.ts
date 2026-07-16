/**
 * 密码显示助手 - 独立内容脚本
 * 在所有网站上运行，提供密码显示功能
 */

// 简单的日志函数（不依赖 state.ts）
const log = (...args: any[]) => {
    console.log('[PasswordHelper]', ...args);
};

const KEY_ENTER = 13;
const KEY_CTRL = 17;

class PasswordHelper {
    private showMethod: number = 0;
    private waitTime: number = 300;
    private modified: WeakSet<HTMLInputElement> = new WeakSet();
    private observer: MutationObserver | null = null;

    constructor(showMethod: number = 0, waitTime: number = 300) {
        this.showMethod = showMethod;
        this.waitTime = waitTime;
    }

    public init(): void {
        log('初始化密码显示助手', {
            showMethod: this.showMethod,
            waitTime: this.waitTime
        });

        this.modifyAllInputs();

        this.observer = new MutationObserver(() => {
            this.modifyAllInputs();
        });

        this.observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['type']
        });
    }

    public destroy(): void {
        log('销毁密码显示助手');

        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        this.modified = new WeakSet();
    }

    public updateConfig(showMethod: number, waitTime: number): void {
        log('更新配置', { showMethod, waitTime });

        this.showMethod = showMethod;
        this.waitTime = waitTime;

        this.destroy();
        this.init();
    }

    private modifyAllInputs(): void {
        const passwordInputs = document.querySelectorAll('input[type=password]');
        passwordInputs.forEach(input => {
            if (!this.modified.has(input as HTMLInputElement)) {
                this.applyBehavior(input as HTMLInputElement);
                this.modified.add(input as HTMLInputElement);
            }
        });
    }

    private applyBehavior(input: HTMLInputElement): void {
        const actions = [
            this.mouseOver.bind(this),
            this.mouseDblClick.bind(this),
            this.mouseFocus.bind(this),
            this.ctrlKeyShift.bind(this)
        ];

        actions[this.showMethod](input);
    }

    private mouseOver(input: HTMLInputElement): void {
        let isMouseOver = false;

        input.addEventListener('mouseover', () => {
            isMouseOver = true;
            setTimeout(() => {
                if (isMouseOver) {
                    input.type = 'text';
                }
            }, this.waitTime);
        }, false);

        input.addEventListener('mouseout', () => {
            isMouseOver = false;
            input.type = 'password';
        }, false);

        input.addEventListener('blur', () => {
            input.type = 'password';
        }, false);

        input.addEventListener('keydown', (e) => {
            if (e.keyCode === KEY_ENTER) {
                input.type = 'password';
            }
        }, false);
    }

    private mouseDblClick(input: HTMLInputElement): void {
        input.addEventListener('dblclick', () => {
            input.type = input.type === 'password' ? 'text' : 'password';
        }, false);

        input.addEventListener('blur', () => {
            input.type = 'password';
        }, false);

        input.addEventListener('keydown', (e) => {
            if (e.keyCode === KEY_ENTER) {
                input.type = 'password';
            }
        }, false);
    }

    private mouseFocus(input: HTMLInputElement): void {
        input.addEventListener('focus', () => {
            input.type = 'text';
        }, false);

        input.addEventListener('blur', () => {
            input.type = 'password';
        }, false);

        input.addEventListener('keydown', (e) => {
            if (e.keyCode === KEY_ENTER) {
                input.type = 'password';
            }
        }, false);
    }

    private ctrlKeyShift(input: HTMLInputElement): void {
        let isHide = true;
        let notPressCtrl = true;
        let onlyCtrl = true;

        input.addEventListener('blur', () => {
            input.type = 'password';
            isHide = true;
            notPressCtrl = true;
            onlyCtrl = true;
        }, false);

        input.addEventListener('keyup', (e) => {
            if (e.keyCode === KEY_CTRL) {
                if (onlyCtrl) {
                    isHide = !isHide;
                } else {
                    isHide = false;
                }

                if (isHide) {
                    input.type = 'password';
                } else {
                    input.type = 'text';
                }
                notPressCtrl = true;
                onlyCtrl = true;
            }
        }, false);

        input.addEventListener('keydown', (e) => {
            if (e.keyCode === KEY_ENTER) {
                input.type = 'password';
                isHide = true;
                notPressCtrl = true;
                onlyCtrl = true;
            } else if (e.keyCode === KEY_CTRL) {
                if (notPressCtrl) {
                    input.type = 'text';
                    notPressCtrl = false;
                    onlyCtrl = true;
                }
            } else {
                onlyCtrl = notPressCtrl;
            }
        }, false);
    }
}

// 从 chrome.storage 获取设置
async function getSettings() {
    try {
        const result = await chrome.storage.local.get('settings');
        return result.settings || {};
    } catch (error) {
        log('Failed to get settings:', error);
        return {};
    }
}

/** 主 content bootstrap 已覆盖的站点：避免与 passwordHelper:init 双份注入 */
function isCoveredByMainContentScript(hostname: string): boolean {
    const host = String(hostname || '').toLowerCase();
    return (
        host === 'javdb.com' ||
        host.endsWith('.javdb.com') ||
        host === 'javdb36.com' ||
        host.endsWith('.javdb36.com') ||
        host.includes('javdb')
    );
}

// 初始化密码助手
async function initialize() {
    try {
        // 全站独立脚本：JavDB 主站由 apps/content/bootstrap 的 passwordHelper:init 负责
        if (isCoveredByMainContentScript(window.location.hostname)) {
            log('Skip standalone on main content host', window.location.hostname);
            return;
        }

        const settings = await getSettings() as any;
        let passwordHelper: PasswordHelper | null = null;

        const ensureStarted = (cfg: { showMethod?: number; waitTime?: number }) => {
            if (!passwordHelper) {
                passwordHelper = new PasswordHelper(cfg.showMethod || 0, cfg.waitTime || 300);
                setTimeout(() => {
                    passwordHelper?.init();
                    log('Password helper initialized on', window.location.hostname);
                }, 1000);
            } else {
                passwordHelper.updateConfig(cfg.showMethod || 0, cfg.waitTime || 300);
            }
        };

        const applySettings = (newSettings: any) => {
            if (newSettings?.userExperience?.enablePasswordHelper) {
                const newConfig = newSettings.passwordHelper || { showMethod: 0, waitTime: 300 };
                ensureStarted(newConfig);
                log('Password helper config updated');
            } else if (passwordHelper) {
                passwordHelper.destroy();
                passwordHelper = null;
                log('Password helper disabled');
            }
        };

        // 与 bootstrap 同一 settings key：关闭时不修改输入框
        if (settings.userExperience?.enablePasswordHelper) {
            const passwordHelperConfig = settings.passwordHelper || { showMethod: 0, waitTime: 300 };
            ensureStarted(passwordHelperConfig);
        } else {
            log('Password helper is disabled');
        }

        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'settings-updated' || message.type === 'SETTINGS_UPDATED') {
                applySettings(message.settings);
            }
        });

        try {
            chrome.storage.onChanged.addListener((changes, area) => {
                if (area !== 'local' || !changes['settings']) return;
                applySettings(changes['settings'].newValue || {});
            });
        } catch (e) {
            log('storage.onChanged bind failed', e);
        }
    } catch (error) {
        log('Initialization failed:', error);
    }
}

// 启动
initialize();
