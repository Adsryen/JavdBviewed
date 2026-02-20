/**
 * 密码显示助手
 * 参考 starpassword.js 实现
 * 在密码框上显示星号密码，避免忘记或输错密码
 */

import { log } from './state';

const KEY_ENTER = 13;
const KEY_CTRL = 17;

export class PasswordHelper {
    private showMethod: number = 0; // 0=悬浮, 1=双击, 2=单击, 3=Ctrl+单击
    private waitTime: number = 300; // 等待时间（毫秒）
    private modified: WeakSet<HTMLInputElement> = new WeakSet();
    private observer: MutationObserver | null = null;

    constructor(showMethod: number = 0, waitTime: number = 300) {
        this.showMethod = showMethod;
        this.waitTime = waitTime;
    }

    /**
     * 初始化密码助手
     */
    public init(): void {
        log('[PasswordHelper] 初始化密码显示助手', {
            showMethod: this.showMethod,
            waitTime: this.waitTime
        });

        // 修改所有现有的密码输入框
        this.modifyAllInputs();

        // 监听 DOM 变化，处理动态添加的密码框
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

    /**
     * 销毁密码助手
     */
    public destroy(): void {
        log('[PasswordHelper] 销毁密码显示助手');
        
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        // 清理所有已修改的密码框
        this.modified = new WeakSet();
    }

    /**
     * 更新配置
     */
    public updateConfig(showMethod: number, waitTime: number): void {
        log('[PasswordHelper] 更新配置', { showMethod, waitTime });
        
        this.showMethod = showMethod;
        this.waitTime = waitTime;
        
        // 重新初始化
        this.destroy();
        this.init();
    }

    /**
     * 修改所有密码输入框
     */
    private modifyAllInputs(): void {
        const passwordInputs = document.querySelectorAll('input[type=password]');
        passwordInputs.forEach(input => {
            if (!this.modified.has(input as HTMLInputElement)) {
                this.applyBehavior(input as HTMLInputElement);
                this.modified.add(input as HTMLInputElement);
            }
        });
    }

    /**
     * 应用行为到密码框
     */
    private applyBehavior(input: HTMLInputElement): void {
        const actions = [
            this.mouseOver.bind(this),
            this.mouseDblClick.bind(this),
            this.mouseFocus.bind(this),
            this.ctrlKeyShift.bind(this)
        ];

        actions[this.showMethod](input);
    }

    /**
     * 鼠标悬浮显示
     */
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

    /**
     * 双击显示
     */
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

    /**
     * 单击（获得焦点）显示
     */
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

    /**
     * Ctrl+单击显示
     */
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
