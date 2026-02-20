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

// 初始化密码助手
async function initialize() {
    try {
        const settings = await getSettings();
        
        // 检查是否启用密码助手
        if (!settings.userExperience?.enablePasswordHelper) {
            log('Password helper is disabled');
            return;
        }

        const passwordHelperConfig = settings.passwordHelper || { showMethod: 0, waitTime: 300 };
        
        const passwordHelper = new PasswordHelper(
            passwordHelperConfig.showMethod || 0,
            passwordHelperConfig.waitTime || 300
        );

        // 延迟初始化，避免影响页面加载
        setTimeout(() => {
            passwordHelper.init();
            log('Password helper initialized on', window.location.hostname);
        }, 1000);

        // 监听设置更新
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'settings-updated' || message.type === 'SETTINGS_UPDATED') {
                const newSettings = message.settings;
                if (newSettings.userExperience?.enablePasswordHelper) {
                    const newConfig = newSettings.passwordHelper || { showMethod: 0, waitTime: 300 };
                    passwordHelper.updateConfig(
                        newConfig.showMethod || 0,
                        newConfig.waitTime || 300
                    );
                    log('Password helper config updated');
                } else {
                    passwordHelper.destroy();
                    log('Password helper disabled');
                }
            }
        });
    } catch (error) {
        log('Initialization failed:', error);
    }
}

// 启动
initialize();
