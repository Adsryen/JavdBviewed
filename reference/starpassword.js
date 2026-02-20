// ==UserScript==
// @name              星号密码显示助手
// @namespace         https://github.com/syhyz1990/starpassword
// @version           1.0.9
// @author            YouXiaoHou
// @description       当鼠标停留在密码框时显示星号密码。再也不担心忘记密码和输错密码了。
// @match             *://*/*
// @license           MIT
// @homepage          https://www.youxiaohou.com/tool/install-starpassword.html
// @supportURL        https://github.com/syhyz1990/starpassword
// @require           https://unpkg.com/sweetalert2@10.16.6/dist/sweetalert2.min.js
// @resource          swalStyle https://unpkg.com/sweetalert2@10.16.6/dist/sweetalert2.min.css
// @run-at            document-start
// @grant             GM_setValue
// @grant             GM_getValue
// @grant             GM_registerMenuCommand
// @grant             GM_getResourceText
// @icon              data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4Ij48cGF0aCBkPSJNMTAzLjkgNTEuMkg0Ni4xYy0xLjIgMC0yLjEtLjktMi4xLTIuMVYyOS44YzAtNy4xIDguOS0xNC45IDIwLTE0LjkgMTEgMCAyMCA3LjggMjAgMTQuOXY2LjRjLjYgMy42IDMuOCA2LjQgNy43IDYuNHM3LjItMi44IDcuNy02LjRoLjF2LTYuNEM5OS41IDEzLjQgODMuNiAwIDY0IDBTMjguNSAxMy40IDI4LjUgMjkuOFY0OWMwIDEuMi0uOSAyLjEtMi4xIDIuMUgyNGMtNy40IDAtMTMuMyA1LjctMTMuMyAxMi44djUxLjJjMCA3LjEgNiAxMi44IDEzLjMgMTIuOGg4MGM3LjQgMCAxMy4zLTUuNyAxMy4zLTEyLjh2LTUxYy0uMS03LjEtNi4xLTEyLjktMTMuNC0xMi45eiIgZmlsbD0iIzQ0NCIvPjxwYXRoIGQ9Ik02Ni44IDY2LjRsNCAxMi40Yy40IDEuMiAxLjUgMiAyLjggMmgxM2MyLjkgMCA0LjEgMy43IDEuNyA1LjRsLTEwLjUgNy42Yy0xIC44LTEuNSAyLjEtMS4xIDMuM2w0IDEyLjRjLjkgMi43LTIuMiA1LTQuNiAzLjNsLTEwLjUtNy42Yy0xLS44LTIuNC0uOC0zLjUgMGwtMTAuNSA3LjZjLTIuMyAxLjctNS41LS42LTQuNi0zLjNsNC0xMi40Yy40LTEuMiAwLTIuNi0xLjEtMy4zbC0xMC41LTcuNmMtMi4zLTEuNy0xLjEtNS40IDEuNy01LjRoMTNjMS4zIDAgMi40LS44IDIuOC0ybDQtMTIuNGMxLjItMi43IDUtMi43IDUuOSAweiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==
// ==/UserScript==

(function () {
    'use strict';

    let MutationObserverNew = null;

    let util = {
        getValue(name) {
            return GM_getValue(name);
        },

        setValue(name, value) {
            GM_setValue(name, value);
        },

        addStyle(id, tag, css) {
            tag = tag || 'style';
            let doc = document, styleDom = doc.getElementById(id);
            if (styleDom) return;
            let style = doc.createElement(tag);
            style.rel = 'stylesheet';
            style.id = id;
            tag === 'style' ? style.innerHTML = css : style.href = css;
            document.head.appendChild(style);
        },
    };

    let main = {
        /**
         * 配置默认值
         */
        initValue() {
            let value = [{
                name: 'setting_wait_time',
                value: 300
            }, {
                name: 'setting_show_method',
                value: 0
            }];

            value.forEach((v) => {
                util.getValue(v.name) === undefined && util.setValue(v.name, v.value);
            });
        },

        /**
         * 保存原始的MutationObserver，防止被覆盖
         */
        observer() {
            MutationObserverNew = window.MutationObserver;
        },

        registerMenuCommand() {
            GM_registerMenuCommand('⚙️ 设置', () => {
                let html = `<div style="font-size: 1em;">
                              <label class="starpassword-setting-label">显示密码方式
                              <select id="S-starpassword-show-method" class="starpassword-select">
                                <option value="0" ${util.getValue('setting_show_method') == 0 ? 'selected' : ''}>鼠标悬浮在密码框上时</option>
                                <option value="1" ${util.getValue('setting_show_method') == 1 ? 'selected' : ''}>双击密码框时</option>
                                <option value="2" ${util.getValue('setting_show_method') == 2 ? 'selected' : ''}>单击密码框时</option>
                                <option value="3" ${util.getValue('setting_show_method') == 3 ? 'selected' : ''}>按下Ctrl并单击密码框时</option>
                              </select>
                              </label>
                              <label class="starpassword-setting-label"><span>等待时间 <span id="S-starpassword-wait-time-label">（${util.getValue('setting_wait_time')}毫秒）</span></span><input type="range" id="S-starpassword-wait-time" min="0" max="1000" step="50" value="${util.getValue('setting_wait_time')}" style="width: 180px;"></label>
                            </div>`;
                Swal.fire({
                    title: '星号密码显示助手',
                    html,
                    icon: 'info',
                    showCloseButton: true,
                    confirmButtonText: '保存',
                    footer: '<div style="text-align: center;font-size: 1em;">Powered by <a href="https://www.youxiaohou.com">油小猴</a></div>',
                    customClass: {
                        container: 'starpassword-container',
                        popup: 'starpassword-popup'
                    }
                }).then((res) => {
                    res.isConfirmed && history.go(0);
                });

                document.getElementById('S-starpassword-show-method').addEventListener('change', (e) => {
                    util.setValue('setting_show_method', e.currentTarget.value);
                });
                document.getElementById('S-starpassword-wait-time').addEventListener('change', (e) => {
                    util.setValue('setting_wait_time', e.target.value);
                    document.getElementById('S-starpassword-wait-time-label').innerText = `（${e.target.value}毫秒）`;
                });
            });
        },

        addPluginStyle() {
            let style = `
                .starpassword-container { z-index: 999999!important }
                .starpassword-popup { font-size: 14px!important }
                .starpassword-setting-label { display:flex; align-items: center; justify-content: space-between; padding-top: 18px; }
                .starpassword-select { background: #f3fcff; height: 28px; width: 180px; line-height: 28px; border: 1px solid #9bc0dd; border-radius: 2px;}
            `;

            if (document.head) {
                util.addStyle('swal-pub-style', 'style', GM_getResourceText('swalStyle'));
                util.addStyle('starpassword-style', 'style', style);
            }

            const headObserver = new MutationObserver(() => {
                util.addStyle('swal-pub-style', 'style', GM_getResourceText('swalStyle'));
                util.addStyle('starpassword-style', 'style', style);
            });
            headObserver.observe(document.head, {childList: true, subtree: true});
        },

        isTopWindow() {
            return window.self === window.top;
        },

        showPassword() {
            const KEY_ENTER = 13;
            const KEY_CTRL = 17;
            let behave = util.getValue('setting_show_method');
            let wait = util.getValue('setting_wait_time');

            function mouseOver(tar) {
                tar.addEventListener('mouseover', () => {
                    tar.isMouseOver = true;
                    setTimeout(() => {
                        if (tar.isMouseOver) {
                            tar.type = 'text';
                        }
                    }, wait);
                }, false);

                tar.addEventListener('mouseout', () => {
                    tar.isMouseOver = false;
                    tar.type = 'password';
                }, false);

                tar.addEventListener('blur', () => {
                    tar.type = 'password';
                }, false);

                tar.addEventListener('keydown', e => {
                    if (e.keyCode === KEY_ENTER) {
                        tar.type = 'password';
                    }
                }, false);
            }

            function mouseDblClick(tar) {
                tar.addEventListener('dblclick', () => {
                    tar.type = tar.type === 'password' ? 'text' : 'password';
                }, false);

                tar.addEventListener('blur', () => {
                    tar.type = 'password';
                }, false);

                tar.addEventListener('keydown', e => {
                    if (e.keyCode === KEY_ENTER) {
                        tar.type = 'password';
                    }
                }, false);
            }

            function mouseFocus(tar) {
                tar.addEventListener('focus', () => {
                    tar.type = 'text';
                }, false);

                tar.addEventListener('blur', () => {
                    tar.type = 'password';
                }, false);

                tar.addEventListener('keydown', e => {
                    if (e.keyCode === KEY_ENTER) {
                        tar.type = 'password';
                    }
                }, false);
            }

            function ctrlKeyShift(tar) {
                let isHide = true;
                let notPressCtrl = true;
                let onlyCtrl = true;

                tar.addEventListener('blur', () => {
                    tar.type = 'password';
                    isHide = true;
                    notPressCtrl = true;
                    onlyCtrl = true;
                }, false);

                tar.addEventListener('keyup', e => {
                    if (e.keyCode === KEY_CTRL) {
                        if (onlyCtrl) {
                            isHide = !isHide;
                        } else {
                            isHide = false;
                        }

                        if (isHide) {
                            tar.type = 'password';
                        } else {
                            tar.type = 'text';
                        }
                        notPressCtrl = true;
                        onlyCtrl = true;
                    }
                }, false);

                tar.addEventListener('keydown', e => {
                    if (e.keyCode === KEY_ENTER) {
                        tar.type = 'password';
                        isHide = true;
                        notPressCtrl = true;
                        onlyCtrl = true;
                    } else if (e.keyCode === KEY_CTRL) {
                        if (notPressCtrl) {
                            tar.type = 'text';
                            notPressCtrl = false;
                            onlyCtrl = true;
                        }
                    } else {
                        onlyCtrl = notPressCtrl;
                    }
                }, false);
            }

            const actionsArr = [mouseOver, mouseDblClick, mouseFocus, ctrlKeyShift];
            const doc = window.document;
            const modified = new WeakSet();

            function modifyAllInputs() {
                const passwordInputs = doc.querySelectorAll('input[type=password]');
                passwordInputs.forEach(input => {
                    if (!modified.has(input)) {
                        actionsArr[behave](input);
                        modified.add(input);
                    }
                });
            }

            function modifyWeb() {
                modifyAllInputs();
            }

            modifyWeb();

            const docObserver = new MutationObserverNew(() => {
                // NOTE: Despite we can recursively check element from addNodes.
                // Benchmark shows that it is much fast to just use `querySelectorAll` to find password inputs
                modifyWeb();
            });

            docObserver.observe(doc.documentElement, {
                childList: true,
                subtree: true,
                // Some website add input with text type at first, then change its type to password.
                attributes: true,
                attributeFilter: ['type']
            });
        },

        init() {
            this.observer();
            this.initValue();
            this.showPassword();
            this.addPluginStyle();
            this.isTopWindow() && this.registerMenuCommand();
        }
    };
    main.init();
})();
