// ==UserScript==
// @name         Javdb全能助手
// @name:en      JavdbBuddy
// @namespace    https://github.com/86168057/JavdbBuddy
// @version      0.9.0
// @description  JAVDB 一站式增强 Tampermonkey 用户脚本，集成 Emby / Jellyfin 入库状态同步、预览图查看、磁力链管理、多站点快捷搜索、免VIP热播/Top250/FC2PPV、全部评论、相关清单等功能。
// @description:en  JavdbBuddy - JAVDB All-in-One Assistant: Emby / Jellyfin library sync, preview images, magnet links, multi-site search, Hot/Top250/FC2PPV, all reviews, related lists
// @description:zh-CN  JAVDB + Emby / Jellyfin 联动脚本：实时同步入库状态、预览图查看、磁力链管理、多站点搜索、免VIP热播/Top250/FC2PPV、全部评论、相关清单
// @author       潇洒公子
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMjU2Ij48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwMGFjZWE7c3RvcC1vcGFjaXR5OjEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM1MmJlODA7c3RvcC1vcGFjaXR5OjEiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+SkQ8L3RleHQ+PC9zdmc+
// @match        *://javdb.com/*
// @match        *://*.javdb.com/*
// @include      *://*javdb*.com/*
// @match        *://sehuatang.net/*
// @match        *://*.sehuatang.net/*
// @include      *://sehuatang.net/*
// @include      *://*.sehuatang.net/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.19.0/js/md5.min.js
// @require      https://update.greasyfork.org/scripts/515994/1478507/gh_2215_make_GM_xhr_more_parallel_again.js
// @require      https://cdn.jsdelivr.net/npm/preact@10.25.4/dist/preact.min.js
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @connect      *
// @connect      localhost
// @connect      jdforrepam.com
// @connect      127.0.0.1
// @connect      192.168.0.0/16
// @connect      10.0.0.0/8
// @connect      172.16.0.0/12
// @run-at       document-start
// @license      MIT
// @homepage     https://github.com/86168057/JavdbBuddy
// @downloadURL https://update.sleazyfork.org/scripts/564141/Javdb%E5%85%A8%E8%83%BD%E5%8A%A9%E6%89%8B.user.js
// @updateURL https://update.sleazyfork.org/scripts/564141/Javdb%E5%85%A8%E8%83%BD%E5%8A%A9%E6%89%8B.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // ========== 🔥 超级功能 导航菜单按钮参数 ==========
    const JB_HOT_URL = '/advanced_search?handlePlayback=1&period=daily';
    const JB_TOP_URL = '/advanced_search?handleTop=1&handleType=all&type_value=&page=1';
    const JB_FC2_URL = '/advanced_search?type=3&score_min=0&d=1';

    // ⭐ document-start 立即执行的三件事：
    //   1. 隐藏 超级功能 页面（热播/Top250/FC2）的搜索表单，避免闪烁
    //   2. MutationObserver 第一时间修改导航栏元素（"排行榜"→"超级功能"、href 重定向）
    //   3. 不再使用 visibility:hidden 隐藏导航文字（避免修改后恢复不了的问题）

    const urlSearch = window.location.search;
    const isSpecialPage = urlSearch.includes('handlePlayback=1') || urlSearch.includes('handleTop=1') || urlSearch.includes('type=3');

    // 1. 立即注入 CSS：超级功能页面隐藏搜索表单 + 超级功能下拉菜单 hover/click 支持
    const earlyStyle = document.createElement('style');
    earlyStyle.textContent = `
        .navbar-item.has-dropdown:hover .navbar-dropdown,
        .navbar-item.has-dropdown.is-active .navbar-dropdown {
            display: block !important;
        }
    `;
    if (isSpecialPage) {
        earlyStyle.textContent += `
            .section .container > .box { display: none !important; }
            .empty-message, #sort-toggle-btn { display: none !important; }
        `;
    }
    (document.head || document.documentElement).appendChild(earlyStyle);

    // ========== [新增] 全局排行榜菜单 ==========
    // 添加返回顶部浮动按钮（替换原紫色排行榜按钮）
    function addBackToTopFloatButton() {
        try {
            if (document.getElementById('emby-backtotop-btn')) return;

            const floatBtn = document.createElement('div');
            floatBtn.id = 'emby-backtotop-btn';
            floatBtn.innerHTML = '⬆';
            floatBtn.title = '返回顶部';
            floatBtn.style.cssText = `
                position: fixed;
                top: calc(50% - 40px);
                right: 16px;
                width: 36px;
                height: 36px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                cursor: pointer;
                z-index: 99999;
                box-shadow: 0 3px 8px rgba(102, 126, 234, 0.4);
                transition: all 0.3s;
                color: white;
                line-height: 1;
                opacity: 0.85;
            `;

            floatBtn.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.1)';
                this.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
            });
            floatBtn.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
                this.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            });

            floatBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            document.body.appendChild(floatBtn);

            // 翻到底部按钮
            const bottomBtn = document.createElement('div');
            bottomBtn.id = 'emby-tobottom-btn';
            bottomBtn.innerHTML = '⬇';
            bottomBtn.title = '翻到底部';
            bottomBtn.style.cssText = `
                position: fixed;
                top: calc(50% + 0px);
                right: 16px;
                width: 36px;
                height: 36px;
                background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                cursor: pointer;
                z-index: 99999;
                box-shadow: 0 3px 8px rgba(67, 233, 123, 0.4);
                transition: all 0.3s;
                color: white;
                line-height: 1;
                opacity: 0.85;
            `;

            bottomBtn.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.1)';
                this.style.boxShadow = '0 6px 20px rgba(67, 233, 123, 0.6)';
            });
            bottomBtn.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
                this.style.boxShadow = '0 4px 12px rgba(67, 233, 123, 0.4)';
            });

            bottomBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            });

            document.body.appendChild(bottomBtn);
            console.log('JavdbBuddy: 浮动按钮已添加（⬆顶部 + ⬇底部）');
        } catch(e) {
            console.error('JavdbBuddy: 添加浮动按钮失败', e);
        }
    }

    // 尽早添加浮动按钮（不等待页面完全加载，页面一有可操作区域就显示）
    (function ensureFloatButtons() {
        const tryAdd = () => {
            if (document.body && document.getElementById('emby-backtotop-btn')) return true;
            if (document.body) { addBackToTopFloatButton(); return true; }
            return false;
        };
        if (tryAdd()) return;

        // 兜底轮询：每 80ms 检查一次，一旦 body 出现立即添加
        let intervalId = setInterval(() => {
            if (tryAdd()) {
                clearInterval(intervalId);
                if (obs) { obs.disconnect(); }
            }
        }, 80);

        // MutationObserver 快速响应：即使 documentElement 暂时为 null，也轮询等待它出现
        let obs;
        const startObserver = () => {
            if (document.documentElement) {
                obs = new MutationObserver(() => {
                    if (tryAdd()) {
                        obs.disconnect();
                        clearInterval(intervalId);
                    }
                });
                obs.observe(document.documentElement, { childList: true, subtree: true });
            } else {
                setTimeout(startObserver, 50);
            }
        };
        startObserver();

        document.addEventListener('DOMContentLoaded', () => {
            clearInterval(intervalId);
            if (obs) { obs.disconnect(); }
            tryAdd();
        });
    })();

    // ---------- 导航栏增强 ----------
    function jbAddNavigation() {
        const navbarEnd = document.querySelector('.navbar-end, .navbar-menu .navbar-end');
        if (!navbarEnd) return;

        // 避免重复添加
        if (document.querySelector('.jb-nav-item')) return;

        // 添加设置按钮
        const settingsBtn = document.createElement('a');
        settingsBtn.className = 'navbar-item jb-nav-item';
        settingsBtn.id = 'jb-nav-settings';
        settingsBtn.href = 'javascript:void(0);';
        settingsBtn.innerHTML = `<span style="font-weight:bold;color:#3498db;">⚙️ 设置</span>`;
        settingsBtn.style.cssText = 'padding: 0.5rem 0.75rem; font-size: 14px;';
        settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[JB] 设置按钮被点击');
            // 使用 try-catch 确保即使出错也不会影响页面
            try {
                const sd = (typeof showSettingsDialog === 'function' && showSettingsDialog) || (typeof window.showSettingsDialog === 'function' && window.showSettingsDialog);
                if (sd) {
                    sd();
                    console.log('[JB] 设置对话框已打开');
                    return;
                }

                console.warn('[JB] showSettingsDialog 尚未加载，尝试强制启动...');
                // 尝试强制执行 initMainScript（可能被 bypassCloudflare 阻塞）
                if (typeof initMainScript === 'function' && !window.__jb_init_done) {
                    try {
                        initMainScript();
                        console.log('[JB] 强制启动 initMainScript 成功');
                    } catch (initErr) {
                        console.error('[JB] 强制启动 initMainScript 失败:', initErr);
                    }
                }

                const sd2 = (typeof showSettingsDialog === 'function' && showSettingsDialog) || (typeof window.showSettingsDialog === 'function' && window.showSettingsDialog);
                if (sd2) {
                    sd2();
                    console.log('[JB] 设置对话框已打开（强制启动后）');
                    return;
                }

                // 脚本主体可能仍在加载，轮询等待
                let waitCount = 0;
                const maxWait = 50; // 最多等 5 秒
                const toast = document.createElement('div');
                toast.textContent = '⚙️ 设置功能加载中，请稍候...';
                toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#3498db;color:white;padding:10px 20px;border-radius:4px;z-index:999999;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.2);';
                document.body.appendChild(toast);
                const waitTimer = setInterval(() => {
                    waitCount++;
                    const sd = (typeof showSettingsDialog === 'function' && showSettingsDialog) || (typeof window.showSettingsDialog === 'function' && window.showSettingsDialog);
                    if (sd) {
                        clearInterval(waitTimer);
                        toast.remove();
                        sd();
                        console.log('[JB] 设置对话框已打开（延迟加载）');
                    } else if (waitCount >= maxWait) {
                        clearInterval(waitTimer);
                        toast.remove();
                        console.error('[JB] showSettingsDialog 函数未定义');
                        alert('设置功能加载失败，请刷新页面重试');
                    }
                }, 100);
            } catch (err) {
                console.error('[JB] 打开设置失败:', err);
                alert('打开设置时出错: ' + err.message);
            }
        });

        // 插入到 navbar-end 的第一个子元素之前（即"跟随系统"左侧）
        const firstChild = navbarEnd.firstElementChild;
        if (firstChild) {
            navbarEnd.insertBefore(settingsBtn, firstChild);
        } else {
            navbarEnd.appendChild(settingsBtn);
        }

        // Hook 网站原有导航按钮补充处理（MutationObserver 已在 document-start 处理了 href 重定向）
        jbHookOriginalNavButtons();
    }

    // 尽早添加设置按钮（不等待页面完全加载，监听 navbar-end 出现即插入）
    (function ensureSettingsButton() {
        const tryAdd = () => {
            if (document.querySelector('.jb-nav-item')) return true;
            const navbarEnd = document.querySelector('.navbar-end, .navbar-menu .navbar-end');
            if (navbarEnd) { jbAddNavigation(); return true; }
            return false;
        };
        if (tryAdd()) return;

        // 兜底轮询：每 80ms 检查一次，一旦 navbar-end 出现立即添加
        let intervalId = setInterval(() => {
            if (tryAdd()) {
                clearInterval(intervalId);
                if (obs) { obs.disconnect(); }
            }
        }, 80);

        // MutationObserver 快速响应：即使 documentElement 暂时为 null，也轮询等待它出现
        let obs;
        const startObserver = () => {
            if (document.documentElement) {
                obs = new MutationObserver(() => {
                    if (tryAdd()) {
                        obs.disconnect();
                        clearInterval(intervalId);
                    }
                });
                obs.observe(document.documentElement, { childList: true, subtree: true });
            } else {
                setTimeout(startObserver, 50);
            }
        };
        startObserver();

        document.addEventListener('DOMContentLoaded', () => {
            clearInterval(intervalId);
            if (obs) { obs.disconnect(); }
            tryAdd();
        });
    })();

    // Hook 网站原有的导航按钮补充处理（仅处理 MutationObserver 覆盖不到的部分）
    function jbHookOriginalNavButtons() {
        // 1. "猜你喜歡" tab 替换为 Top250（照搬 JavdbBuddy）
        document.querySelectorAll('.main-tabs ul li, .tabs ul li').forEach(li => {
            if (li.textContent.includes('猜你喜歡') || li.textContent.includes('猜你喜欢')) {
                li.innerHTML = `<a href="${JB_TOP_URL}"><span>Top250</span></a>`;
            }
        });
    }

    // 2. MutationObserver 第一时间监控 DOM 变化，立即修改导航栏
    const jbNavObserver = new MutationObserver(() => {
        // 2a. "排行榜" → "🔥超级功能"
        document.querySelectorAll('.navbar-item.has-dropdown a.navbar-link').forEach(link => {
            if (link.textContent.trim() === '排行榜' && !link.dataset.jbDone) {
                link.innerHTML = '🔥<span style="color:#ff4444;font-weight:bold;text-shadow:0 0 8px rgba(255,68,68,0.5);">超级功能</span>';
                // 不修改 href，确保下拉菜单能正常展开
                link.dataset.jbDone = '1';

                const parent = link.closest('.navbar-item.has-dropdown');
                const dropdown = parent?.querySelector('.navbar-dropdown');
                if (dropdown && !dropdown.dataset.jbDone) {
                    dropdown.innerHTML = `
                        <a class="navbar-item" href="${JB_HOT_URL}">🔥 热播</a>
                        <a class="navbar-item" href="${JB_TOP_URL}">🏆 Top250</a>
                        <hr class="navbar-divider">
                        <a class="navbar-item" href="/tags?c10=1">有碼</a>
                        <a class="navbar-item" href="/tags?c10=2">無碼</a>
                        <a class="navbar-item" href="/tags?c10=3">歐美</a>
                        <a class="navbar-item" href="${JB_FC2_URL}">FC2</a>
                        <a class="navbar-item" href="/tags?c10=4">FANZA(DMM)成人獎</a>
                    `;
                    dropdown.dataset.jbDone = '1';
                }

                // 点击展开/收起下拉菜单
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    parent?.classList.toggle('is-active');
                });
            }
        });
        // 2b. 热播 / Top250 href 重定向
        document.querySelectorAll('a[href*="rankings/playback"]').forEach(a => {
            if (!a.dataset.jbDone) { a.setAttribute('href', JB_HOT_URL); a.dataset.jbDone = '1'; }
        });
        document.querySelectorAll('a[href*="rankings/top"]').forEach(a => {
            if (!a.dataset.jbDone) { a.setAttribute('href', JB_TOP_URL); a.dataset.jbDone = '1'; }
        });
        // 2c. FC2 href 重定向
        document.querySelectorAll('.navbar-item').forEach(el => {
            if (el.textContent.trim() === 'FC2' && !el.dataset.jbDone) {
                el.setAttribute('href', JB_FC2_URL);
                el.dataset.jbDone = '1';
            }
        });
        document.querySelectorAll('.tabs a').forEach(el => {
            if (el.textContent.trim() === 'FC2' && !el.dataset.jbDone) {
                el.setAttribute('href', JB_FC2_URL);
                el.dataset.jbDone = '1';
            }
        });
    });
    jbNavObserver.observe(document.documentElement, { childList: true, subtree: true });
    // 10 秒后清理观察器（防内存泄漏）
    setTimeout(() => jbNavObserver.disconnect(), 10000);

    // ⭐ 立即执行的测试日志
    console.log('%c✅ JAVDB全能助手 已加载', 'color: green; font-size: 16px; font-weight: bold;');
    console.log('当前 URL:', window.location.href);
    console.log('当前路径:', window.location.pathname);
    console.log('查询参数:', window.location.search);

    // 保存原始 GM_xmlhttpRequest 引用（必须在 CF_HANDLER 之前定义）
    const originalGMXHR = GM_xmlhttpRequest.bind({});

    // ========== [新增] 全局 Cloudflare 验证自动处理模块 ==========
    const CF_HANDLER = {
        isVerifying: false,
        verifyTab: null,
        pendingRequests: [],
        
        // 检测响应是否包含 Cloudflare 验证
        isCFChallenge(response) {
            if (!response || !response.responseText) return false;
            const html = response.responseText;
            return html.includes('cf-turnstile') || 
                   html.includes('challenge-form') ||
                   html.includes('Checking your browser') ||
                   html.includes('Just a moment') ||
                   html.includes('验证您是真人') ||
                   html.includes('正在检查您的浏览器') ||
                   (response.status === 403 && html.includes('cloudflare'));
        },
        
        // 自动后台打开验证页面
        async autoVerify(url) {
            if (this.isVerifying) {
                console.log('🛡️ 验证已在进行中，等待完成...');
                await this.waitForVerify();
                return true;
            }
            
            this.isVerifying = true;
            console.log('%c🛡️ 检测到 Cloudflare 验证，后台自动处理中...', 'color: orange; font-size: 14px;');
            
            // 在后台打开验证页面（使用 javdb 首页作为验证入口）
            const verifyUrl = 'https://javdb.com';
            this.verifyTab = window.open(verifyUrl, '_blank', 'noopener,noreferrer');
            
            if (!this.verifyTab) {
                console.warn('⚠️ 无法打开验证窗口，可能被浏览器阻止');
                this.isVerifying = false;
                return false;
            }
            
            // 等待验证完成（最多30秒）
            let checkCount = 0;
            const maxChecks = 30;
            
            while (checkCount < maxChecks) {
                await this.sleep(1000);
                checkCount++;
                
                try {
                    // 检查验证是否完成（通过测试请求）
                    const testResponse = await this.testRequest(url);
                    if (testResponse && !this.isCFChallenge(testResponse)) {
                        console.log('%c✅ Cloudflare 验证已通过！', 'color: green; font-size: 14px;');
                        this.closeVerifyTab();
                        this.isVerifying = false;
                        return true;
                    }
                } catch (e) {
                    // 继续等待
                }
            }
            
            console.warn('⚠️ 验证超时，关闭验证窗口');
            this.closeVerifyTab();
            this.isVerifying = false;
            return false;
        },
        
        // 测试请求是否通过（使用原始函数避免递归）
        testRequest(url) {
            return new Promise((resolve, reject) => {
                // 必须使用原始 GM_xmlhttpRequest，避免递归
                originalGMXHR({
                    method: 'HEAD',
                    url: url,
                    timeout: 5000,
                    onload: resolve,
                    onerror: reject,
                    ontimeout: reject
                });
            });
        },
        
        // 等待验证完成
        waitForVerify() {
            return new Promise(resolve => {
                const check = setInterval(() => {
                    if (!this.isVerifying) {
                        clearInterval(check);
                        resolve();
                    }
                }, 500);
            });
        },
        
        // 关闭验证标签页
        closeVerifyTab() {
            if (this.verifyTab && !this.verifyTab.closed) {
                try {
                    this.verifyTab.close();
                    console.log('🗑️ 已关闭验证标签页');
                } catch (e) {
                    console.log('无法自动关闭验证标签页');
                }
            }
            this.verifyTab = null;
        },
        
        // 延迟函数
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    };

    // ========== [新增] 包装 GM_xmlhttpRequest 自动处理 Cloudflare 验证 ==========
    // 注意：当前版本暂时禁用自动验证功能，避免递归问题
    // 如需启用 Cloudflare 自动验证，需要重新设计实现方案
    // GM_xmlhttpRequest = requestWithCFHandling;
    
    function requestWithCFHandling(options) {
        const originalOnload = options.onload;
        const originalOnerror = options.onerror;
        const url = options.url;
        
        options.onload = async function(response) {
            // 检测是否遇到 Cloudflare 验证
            if (CF_HANDLER.isCFChallenge(response)) {
                console.log('%c🛡️ 请求遇到 Cloudflare 验证，后台自动处理...', 'color: orange;', url);
                
                const verified = await CF_HANDLER.autoVerify(url);
                if (verified) {
                    // 验证通过，重试原请求（使用原始函数避免循环）
                    console.log('🔄 验证完成，重新发送请求:', url);
                    originalGMXHR({
                        ...options,
                        onload: originalOnload,
                        onerror: originalOnerror
                    });
                    return;
                }
            }
            
            // 正常响应或验证失败，调用原始回调
            if (originalOnload) {
                originalOnload(response);
            }
        };
        
        options.onerror = async function(error) {
            // 请求失败也可能是验证导致的
            console.log('⚠️ 请求失败，尝试检测是否是验证问题:', url);
            
            // 尝试快速测试
            try {
                const testResponse = await CF_HANDLER.testRequest(url);
                if (CF_HANDLER.isCFChallenge(testResponse)) {
                    console.log('%c🛡️ 检测到 Cloudflare 验证，后台自动处理...', 'color: orange;');
                    const verified = await CF_HANDLER.autoVerify(url);
                    if (verified) {
                        // 验证通过，重试原请求（使用原始函数）
                        console.log('🔄 验证完成，重新发送请求:', url);
                        originalGMXHR({
                            ...options,
                            onload: originalOnload,
                            onerror: originalOnerror
                        });
                        return;
                    }
                }
            } catch (e) {
                // 测试也失败，调用原始错误处理
            }
            
            if (originalOnerror) {
                originalOnerror(error);
            }
        };
        
        // 发送请求
        return GM_xmlhttpRequest(options);
    }

    // ========== [新增] 自动静默过 Cloudflare 验证 ==========
    function bypassCloudflare() {
        // 检测是否是 Cloudflare 验证页面（只检测真正需要等待的验证状态）
        const title = document.title || '';
        
        // 核心判断：页面标题是 CF 验证标题，或存在挑战表单
        const isCFPage = 
            title.includes('Just a moment') || 
            title.includes('请稍候') ||
            title.includes('Attention Required') ||
            document.querySelector('#challenge-form') !== null;
        
        if (isCFPage) {
            console.log('%c🛡️ Cloudflare 验证页面检测，等待自动完成...', 'color: orange; font-size: 14px;');
            
            // 尝试自动点击验证复选框（如果存在）
            const turnstileCheckbox = document.querySelector('.cf-turnstile input[type="checkbox"]') || 
                                     document.querySelector('input[type="checkbox"][name*="cf"]') ||
                                     document.querySelector('[data-cf-turnstile] input');
            
            if (turnstileCheckbox) {
                console.log('%c🖱️ 发现验证复选框，尝试自动点击...', 'color: blue;');
                setTimeout(() => {
                    turnstileCheckbox.click();
                    console.log('%c✅ 已自动点击验证复选框', 'color: green;');
                }, 1000);
            }
            
            // 尝试点击验证按钮
            const verifyBtn = document.querySelector('input[type="submit"]') || 
                             document.querySelector('.cf-browser-verification button') ||
                             document.querySelector('#challenge-form input[type="submit"]') ||
                             document.querySelector('button[type="submit"]');
            
            if (verifyBtn && !turnstileCheckbox) {
                setTimeout(() => {
                    verifyBtn.click();
                    console.log('%c✅ 已自动点击验证按钮', 'color: green;');
                }, 1500);
            }
            
            // 监听页面变化，一旦验证完成就继续执行
            let checkCount = 0;
            const maxChecks = 15; // 最多检查15次（约15秒）
            
            const checkInterval = setInterval(() => {
                checkCount++;
                const currentTitle = document.title || '';
                const isStillCF = currentTitle.includes('Just a moment') || 
                                  currentTitle.includes('请稍候') ||
                                  currentTitle.includes('Attention Required') ||
                                  document.querySelector('#challenge-form') !== null;
                
                if (!isStillCF || checkCount >= maxChecks) {
                    clearInterval(checkInterval);
                    if (!isStillCF) {
                        console.log('%c✅ Cloudflare 验证已通过，继续加载脚本...', 'color: green;');
                    } else {
                        console.log('%c⚠️ Cloudflare 验证超时，尝试直接加载脚本...', 'color: orange;');
                    }
                    initMainScript();
                }
            }, 1000);
            
            return true; // 表示正在等待验证
        }
        return false; // 不是验证页面
    }
    
    // 执行主脚本逻辑（等待 DOM 加载完成）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAfterDOMReady);
    } else {
        runAfterDOMReady();
    }

    function runAfterDOMReady() {
        // 立即尝试跳过 Cloudflare
        if (bypassCloudflare()) {
            console.log('等待 Cloudflare 验证完成...');
            // 如果检测到验证页面，延迟执行主逻辑
            return;
        }
        initMainScript();
    }
    
    // 主脚本入口函数
    function initMainScript() {
        if (window.__jb_init_done) {
            console.log('[JB] initMainScript 已执行过，跳过');
            return;
        }
        console.log('[JB] initMainScript 开始执行');
    
    try {
    // 立即检查页面类型
    const isDetailPage = window.location.pathname.startsWith('/v/');
    console.log('是否是详情页:', isDetailPage);
    if (isDetailPage) {
        console.log('✅ 详情页检测通过，将在2秒后添加双标签磁力链');
    } else {
        console.log('ℹ️ 非详情页，跳过双标签磁力链功能');
    }
    
    // 检查Tampermonkey是否正常运行
    console.log('Tampermonkey GM_xmlhttpRequest 可用:', typeof GM_xmlhttpRequest === 'function');
    console.log('Tampermonkey GM_getValue 可用:', typeof GM_getValue === 'function');

    // ========== [新增] JAVBUS 磁力链内存缓存 ==========
    const JAVBUS_CACHE = {};
    const JAVDB_CACHE = {};  // JAVDB 磁力链缓存
    const PREVIEW_CACHE = {};  // 预览图缓存：{ status: 'loading'|'loaded'|'error', imgList: [], actors: [] }
    
    // ========== [新增] 请求限流机制 ==========
    const REQUEST_QUEUE = [];
    const MAX_CONCURRENT_REQUESTS = 1; // 同时最多1个请求
    const REQUEST_DELAY = 5000; // 每个请求间隔5000ms
    let activeRequests = 0;
    let lastRequestTime = 0;
    let totalPreloadedCount = 0; // 页面总预加载计数
    const MAX_PRELOAD_ITEMS = 0; // 关闭后台预加载，仅用户点击时才请求（防验证）
    let queuePaused = false; // 检测到验证时暂停队列
    
    // 请求队列管理
    function queueRequest(requestFn) {
        return new Promise((resolve, reject) => {
            REQUEST_QUEUE.push({ requestFn, resolve, reject });
            processQueue();
        });
    }
    
    function processQueue() {
        if (queuePaused || activeRequests >= MAX_CONCURRENT_REQUESTS || REQUEST_QUEUE.length === 0) {
            return;
        }
        
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;
        
        if (timeSinceLastRequest < REQUEST_DELAY) {
            setTimeout(processQueue, REQUEST_DELAY - timeSinceLastRequest);
            return;
        }
        
        const { requestFn, resolve, reject } = REQUEST_QUEUE.shift();
        activeRequests++;
        lastRequestTime = Date.now();
        
        requestFn()
            .then(resolve)
            .catch(reject)
            .finally(() => {
                activeRequests--;
                setTimeout(processQueue, REQUEST_DELAY);
            });
    }
    
    // 检测到CF验证时暂停队列并通知用户
    function handleCFDetection() {
        queuePaused = true;
        console.warn('%c🛡️ 检测到Cloudflare验证，暂停请求队列30秒...', 'color:orange;font-size:14px;');
        // 30秒后恢复，给用户时间手动验证
        setTimeout(() => {
            queuePaused = false;
            console.log('%c🛡️ 请求队列已恢复', 'color:green;font-size:14px;');
            processQueue();
        }, 30000);
    }


    // ========== [新增] 98堂自动搜索逻辑 ==========
    if (window.location.host.includes('sehuatang.net')) {
        if (window.location.search.includes('srchtxt=')) {
            const autoProcess = () => {
                // 第一步：检测并自动点击"满18岁"按钮（偶发性出现）
                const ageButton = Array.from(document.querySelectorAll('a, button, div')).find(el => 
                    el.textContent.includes('满18岁') || el.textContent.includes('please click here')
                );
                
                if (ageButton) {
                    console.log('98堂: 检测到年龄确认按钮，自动点击...');
                    ageButton.click();
                    // 点击后延迟执行搜索，确保页面已跳转
                    setTimeout(autoProcess, 800);
                    return;
                }
                
                // 第二步：自动点击搜索按钮（多种选择器兼容）
                const searchBtn = document.querySelector('button.pn') ||           // 优先尝试
                                  document.querySelector('button[type="submit"]') || 
                                  document.querySelector('button[name="searchsubmit"]') ||
                                  document.querySelector('.pn.pnc') ||
                                  document.querySelector('#searchsubmit') ||
                                  Array.from(document.querySelectorAll('button')).find(btn => 
                                      btn.textContent.includes('搜索') || btn.textContent.includes('搜 索')
                                  );
                
                if (searchBtn) {
                    console.log('98堂: 检测到搜索按钮，自动触发搜索...', searchBtn);
                    searchBtn.click();
                    return;
                }
                
                // 第三步：如果上述方法都失败，尝试表单提交
                const searchForm = document.querySelector('form[name="searchform"]') || 
                                   document.querySelector('form[id="search"]') ||
                                   document.querySelector('form');
                if (searchForm) {
                    console.log('98堂: 未找到按钮，尝试直接提交表单...');
                    searchForm.submit();
                    return;
                }
                
                console.warn('98堂: 未能找到搜索触发元素');
            };
            
            // 延迟执行，确保DOM完全加载
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => setTimeout(autoProcess, 300));
            } else {
                setTimeout(autoProcess, 300);
            }
        }
        return;
    }

    console.log('JavdbBuddy: 脚本启动');

    // 默认媒体服务器配置（空列表）
    const DEFAULT_SERVERS = [];

    // 缓存与索引
    let LIBRARY_INDEX = {};
    let JELLYFIN_LIBRARY_INDEX = {};
    let SYNC_ERROR = '';
    let JELLYFIN_SYNC_ERROR = '';
    // 启动时清除旧的错误缓存，让 verifyStatusBackground 实时检测连接状态
    (() => {
        const allServers = getServers();
        let changed = false;
        allServers.forEach(s => {
            if (s.lastError) { s.lastError = false; s.statusMsg = ''; changed = true; }
        });
        if (changed) saveServers(allServers);
        GM_setValue('emby_sync_error', '');
        GM_setValue('jellyfin_sync_error', '');
    })();
    try {
        LIBRARY_INDEX = JSON.parse(GM_getValue('emby_library_index', '{}'));
    } catch(e) {
        console.error('JavdbBuddy: 解析索引失败', e);
        LIBRARY_INDEX = {};
    }
    try {
        JELLYFIN_LIBRARY_INDEX = JSON.parse(GM_getValue('jellyfin_library_index', '{}'));
    } catch(e) {
        console.error('Jellyfin Checker: 解析索引失败', e);
        JELLYFIN_LIBRARY_INDEX = {};
    }

    let LAST_SYNC_TIME = GM_getValue('emby_last_sync', 0);
    let JELLYFIN_LAST_SYNC_TIME = GM_getValue('jellyfin_last_sync', 0);
    const SYNC_INTERVAL = 60 * 60 * 1000; // 每1小时自动同步一次

    // 获取服务器配置
    function getServers() {
        try {
            const saved = GM_getValue('emby_servers', null);
            return saved ? JSON.parse(saved) : DEFAULT_SERVERS;
        } catch(e) {
            return DEFAULT_SERVERS;
        }
    }

    function getServersByType(type) {
        return getServers().filter(s => (s.type || 'emby') === type);
    }

    // 保存服务器配置
    function saveServers(servers) {
        GM_setValue('emby_servers', JSON.stringify(servers));
        // 触发配置变更事件，通知页面重新检查
        GM_setValue('emby_config_changed', Date.now());
    }

    // 全量同步媒体库（Emby + Jellyfin）
    async function syncFullLibrary(manual = false) {
        await syncMediaLibrary('emby');
        await syncMediaLibrary('jellyfin');
        initCheck();
    }

    async function syncMediaLibrary(type) {
        const servers = getServersByType(type);
        const isEmby = type === 'emby';
        const indexVar = isEmby ? 'LIBRARY_INDEX' : 'JELLYFIN_LIBRARY_INDEX';
        const errorVar = isEmby ? 'SYNC_ERROR' : 'JELLYFIN_SYNC_ERROR';
        const lastSyncKey = isEmby ? 'emby_last_sync' : 'jellyfin_last_sync';
        const errorKey = isEmby ? 'emby_sync_error' : 'jellyfin_sync_error';
        const indexKey = isEmby ? 'emby_library_index' : 'jellyfin_library_index';

        if (servers.length === 0) {
            if (isEmby) SYNC_ERROR = '';
            else JELLYFIN_SYNC_ERROR = '';
            return;
        }

        if (isEmby) SYNC_ERROR = '';
        else JELLYFIN_SYNC_ERROR = '';

        console.log(`JavdbBuddy: 开始同步 ${type} 全量库...`);
        const newIndex = {};
        let totalCount = 0;
        let hasSuccess = false;

        for (const server of servers) {
            try {
                const items = await fetchAllMediaItems(server);
                if (Array.isArray(items)) {
                    hasSuccess = true;
                    server.lastError = false;
                    server.statusMsg = '在线已连接';
                    items.forEach(item => {
                        const code = extractCodeFromTitle(item.Name) || extractCodeFromTitle(item.Path);
                        if (code) {
                            newIndex[code.toUpperCase()] = {
                                itemId: item.Id,
                                serverId: item.ServerId,
                                serverUrl: server.url,
                                serverName: server.name
                            };
                            totalCount++;
                        }
                    });
                }
            } catch (e) {
                console.error(`JavdbBuddy: 同步 ${type} 服务器 ${server.name} 失败:`, e);
                server.lastError = true;
                server.statusMsg = e.toString() || '连接失败';
                if (isEmby) SYNC_ERROR = server.statusMsg;
                else JELLYFIN_SYNC_ERROR = server.statusMsg;
            }
        }

        // 保存所有服务器，保留其他类型的服务器配置不被覆盖
        const allServers = getServers();
        const otherServers = allServers.filter(s => (s.type || 'emby') !== type);
        saveServers([...otherServers, ...servers]);

        if (hasSuccess) {
            if (isEmby) SYNC_ERROR = '';
            else JELLYFIN_SYNC_ERROR = '';
        } else if (servers.length > 0) {
            if (isEmby && !SYNC_ERROR) SYNC_ERROR = '所有服务器连接失败';
            else if (!isEmby && !JELLYFIN_SYNC_ERROR) JELLYFIN_SYNC_ERROR = '所有服务器连接失败';
        }

        GM_setValue(errorKey, isEmby ? SYNC_ERROR : JELLYFIN_SYNC_ERROR);
        if (isEmby) {
            LIBRARY_INDEX = newIndex;
            GM_setValue(indexKey, JSON.stringify(LIBRARY_INDEX));
            LAST_SYNC_TIME = Date.now();
        } else {
            JELLYFIN_LIBRARY_INDEX = newIndex;
            GM_setValue(indexKey, JSON.stringify(JELLYFIN_LIBRARY_INDEX));
            JELLYFIN_LAST_SYNC_TIME = Date.now();
        }
        GM_setValue(lastSyncKey, Date.now());

        console.log(`JavdbBuddy: ${type} 全量同步完成，共计 ${totalCount} 个番号。`);
    }

    // 分页获取媒体服务器所有项目（Emby / Jellyfin API 兼容）
    function fetchAllMediaItems(server) {
        return new Promise((resolve, reject) => {
            const apiUrl = `${server.url}/Items?Recursive=true&IncludeItemTypes=Movie&Fields=Path&api_key=${server.apiKey}`;
            GM_xmlhttpRequest({
                method: 'GET',
                url: apiUrl,
                timeout: 10000,
                onload: function(response) {
                    if (response.status === 200) {
                        try {
                            const data = JSON.parse(response.responseText);
                            resolve(data.Items || []);
                        } catch (e) { reject('数据解析失败'); }
                    } else if (response.status === 401) {
                        reject('API Key 错误');
                    } else {
                        reject(`连接失败 (${response.status})`);
                    }
                },
                onerror: function() { reject('地址错误或无法连接'); },
                ontimeout: function() { reject('连接超时'); }
            });
        });
    }

    // 获取列表项中的详情页链接（兼容原生列表和 自定义列表）
    function getDetailLink(itemEl) {
        const link = itemEl.querySelector('a[href^="/v/"]');
        if (link) return link;
        if (itemEl.tagName === 'A' && itemEl.getAttribute('href')?.startsWith('/v/')) return itemEl;
        return null;
    }

    // 番号提取正则优化
    function extractCodeFromTitle(text) {
        if (!text) return null;
        text = text.trim();
        
        // 1. 匹配标准番号 (ABC-123, ABC_123, T28-123)
        const standardMatch = text.match(/([A-Z0-9]{2,12}[-_][A-Z0-9]{2,10}|[A-Z]{2,10}\d{3,6})/i);
        if (standardMatch) return standardMatch[1].toUpperCase();

        // 2. 匹配开头的一串字符（处理像 DigitalPlayground 或 012426_01 这种）
        const firstWordMatch = text.match(/^([a-z0-9_-]{3,25})/i);
        if (firstWordMatch) {
            const code = firstWordMatch[1];
            // 排除掉一些太通用的词
            if (!['THE', 'THIS', 'WHAT', 'WITH'].includes(code.toUpperCase())) {
                return code.toUpperCase();
            }
        }

        return null;
    }

    // 检查同步
    const embyNeedsSync = getServersByType('emby').length > 0 && Date.now() - LAST_SYNC_TIME > SYNC_INTERVAL;
    const jellyfinNeedsSync = getServersByType('jellyfin').length > 0 && Date.now() - JELLYFIN_LAST_SYNC_TIME > SYNC_INTERVAL;
    if (embyNeedsSync || jellyfinNeedsSync) {
        syncFullLibrary().catch(e => console.error('自动同步失败', e));
    }

    // 菜单
    try {
        if (typeof GM_registerMenuCommand === 'function') {
            GM_registerMenuCommand('🔄 立即同步媒体库', () => syncFullLibrary(manualSyncCallback));
            GM_registerMenuCommand('⚙️ 媒体服务器设置', showSettingsDialog);
        }
    } catch (e) {
        console.warn('[JB] GM_registerMenuCommand 不可用:', e);
    }

    function manualSyncCallback() {
        syncFullLibrary(true);
    }

    // 设置对话框
    function showSettingsDialog(activeTab = '') {
        const servers = getServers();

        // 辅助函数：生成单个服务器卡片HTML
        function renderServerCardHTML(server, index) {
            const shouldExpand = !server.url || !server.apiKey;
            const arrowIcon = shouldExpand ? '▲' : '▼';
            let statusHtml = '';
            if (server.lastError) {
                statusHtml = `<span style="margin-left:10px;padding:1px 6px;background:#ff9800;color:white;border-radius:3px;font-size:10px;font-weight:normal;">${server.statusMsg || '连接失败'}</span>`;
            } else if (server.statusMsg === '在线已连接') {
                statusHtml = `<span style="margin-left:10px;padding:1px 6px;background:#4CAF50;color:white;border-radius:3px;font-size:10px;font-weight:normal;">在线已连接</span>`;
            } else {
                statusHtml = `<span style="margin-left:10px;padding:1px 6px;background:#9e9e9e;color:white;border-radius:3px;font-size:10px;font-weight:normal;">待同步/未连接</span>`;
            }
            const serverType = server.type || 'emby';
            const typeLabel = serverType === 'emby' ? 'Emby' : 'Jellyfin';
            return `
            <div class="server-item" data-index="${index}" style="border:1px solid #ddd;margin-bottom:10px;border-radius:4px;">
                <div class="server-header" style="padding:12px 15px;background:#f8f9fa;cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onclick="const body = document.getElementById('server-body-${index}'); const arrow = document.getElementById('server-arrow-${index}'); body.style.display = body.style.display === 'none' ? 'block' : 'none'; arrow.textContent = body.style.display === 'none' ? '▼' : '▲';">
                    <div style="display:flex;align-items:center;">
                        <span style="margin-right:8px;padding:1px 6px;background:${serverType === 'emby' ? '#4CAF50' : '#673AB7'};color:white;border-radius:3px;font-size:10px;">${typeLabel}</span>
                        <strong style="font-size:14px;">${server.name || typeLabel}</strong>
                        ${statusHtml}
                    </div>
                    <span id="server-arrow-${index}" style="color:#999;font-size:12px;transition:transform 0.2s;">${arrowIcon}</span>
                </div>
                <div id="server-body-${index}" style="padding:15px;display:${shouldExpand ? 'block' : 'none'};">
                    <input type="hidden" id="type-${index}" value="${serverType}" />
                    <div style="margin-bottom:8px;">
                        <label style="display:inline-block;width:140px;font-weight:bold;">服务器名称：</label>
                        <input type="text" id="name-${index}" value="${server.name === '新服务器' || !server.name ? typeLabel : server.name}" placeholder="例如：主服务器" style="width:calc(100% - 150px);padding:5px;" />
                    </div>
                    <div style="margin-bottom:8px;">
                        <label style="display:inline-block;width:140px;font-weight:bold;">服务器地址：</label>
                        <input type="text" id="url-${index}" value="${server.url}" placeholder="例如：http://192.168.1.100:8096" style="width:calc(100% - 150px);padding:5px;" />
                    </div>
                    <div style="margin-bottom:12px;">
                        <label style="display:inline-block;width:140px;font-weight:bold;">API Key：</label>
                        <input type="text" id="key-${index}" value="${server.apiKey}" placeholder="32位API密钥" style="width:calc(100% - 150px);padding:5px;" />
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button class="connect-server-btn" data-index="${index}" style="background:#2196F3;color:white;border:none;padding:5px 15px;border-radius:3px;cursor:pointer;">连接</button>
                        <button class="remove-server-btn" data-index="${index}" style="background:#f44336;color:white;border:none;padding:5px 15px;border-radius:3px;cursor:pointer;">删除</button>
                    </div>
                </div>
            </div>`;
        }

        const overlay = document.createElement('div');
        overlay.id = 'emby-settings-overlay';
        overlay.style = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:999999;display:flex;align-items:center;justify-content:center;';
        
        const version = typeof GM_info !== 'undefined' && GM_info.script?.version ? GM_info.script.version : '0.7.0';
        // 读取通用设置（必须在 HTML 模板之前定义，否则会导致 Temporal Dead Zone 错误）
        const enableHoverZoom = GM_getValue('jb_enable_hover_zoom', false);
        const openInNewTab = GM_getValue('jb_open_in_new_tab', false);
        const openAllLinksInNewTab = GM_getValue('jb_open_all_links_in_new_tab', false);
        const openInPopup = GM_getValue('jb_open_in_popup', false);
        const showEmbyStatus = GM_getValue('jb_show_emby_status', true);
        const showJellyfinStatus = GM_getValue('jb_show_jellyfin_status', true);
        const webdavUrl = GM_getValue('jb_webdav_url', '');
        const webdavUser = GM_getValue('jb_webdav_user', '');
        const webdavPass = GM_getValue('jb_webdav_pass', '');
        let html = `
            <div style="background:white;border-radius:8px;width:800px;height:80vh;display:flex;overflow:hidden;font-family:sans-serif;color:#333;">
                <!-- 左侧分类栏 -->
                <div style="width:170px;background:#f8f9fa;border-right:1px solid #e0e0e0;display:flex;flex-direction:column;flex-shrink:0;">
                    <div style="padding:20px 16px;font-size:18px;font-weight:bold;color:#333;border-bottom:1px solid #e0e0e0;">设置</div>
                    <div style="flex:1;overflow-y:auto;padding:10px 0;">
                        <div class="jb-setting-tab active" data-tab="tab-general" style="padding:10px 16px;cursor:pointer;font-size:14px;color:#333;border-left:3px solid #2196F3;background:#e3f2fd;display:flex;align-items:center;gap:8px;"><span style="font-size:16px;">⚙️</span><span>通用设置</span></div>
                        <div class="jb-setting-tab" data-tab="tab-emby" style="padding:10px 16px;cursor:pointer;font-size:14px;color:#666;border-left:3px solid transparent;display:flex;align-items:center;gap:8px;"><span style="font-size:16px;">🖥️</span><span>媒体服务器配置</span></div>
                        <div class="jb-setting-tab" data-tab="tab-backup" style="padding:10px 16px;cursor:pointer;font-size:14px;color:#666;border-left:3px solid transparent;display:flex;align-items:center;gap:8px;"><span style="font-size:16px;">☁️</span><span>备份与恢复</span></div>
                        <div class="jb-setting-tab" data-tab="tab-about" style="padding:10px 16px;cursor:pointer;font-size:14px;color:#666;border-left:3px solid transparent;display:flex;align-items:center;gap:8px;"><span style="font-size:16px;">💖</span><span>关于打赏</span></div>
                    </div>
                    <div style="padding:12px 16px;border-top:1px solid #e0e0e0;color:#999;font-size:11px;text-align:center;">V${version}</div>
                </div>
                <!-- 右侧内容区 -->
                <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
                    <div style="padding:15px 20px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
                        <span id="jb-setting-title" style="font-size:16px;font-weight:bold;color:#333;">通用设置</span>
                        <span id="close-settings-btn" style="cursor:pointer;font-size:24px;color:#999;line-height:1;user-select:none;">&times;</span>
                    </div>
                    <div id="jb-setting-content" style="flex:1;overflow-y:auto;padding:20px;">
                        <div id="tab-general" class="jb-tab-content">
                            <div style="display:flex;flex-direction:column;gap:15px;">
                                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;color:#555;">
                                    <input type="checkbox" id="jb-hover-zoom" ${enableHoverZoom ? 'checked' : ''} style="cursor:pointer;width:16px;height:16px;">
                                    <span>启用悬浮大图</span>
                                </label>
                                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;color:#555;">
                                    <input type="checkbox" id="jb-open-new-tab" ${openInNewTab ? 'checked' : ''} style="cursor:pointer;width:16px;height:16px;">
                                    <span>启用列表页新窗口打开</span>
                                </label>
                                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;color:#555;">
                                    <input type="checkbox" id="jb-open-all-links" ${openAllLinksInNewTab ? 'checked' : ''} style="cursor:pointer;width:16px;height:16px;">
                                    <span>启用所有连接都在新窗口打开</span>
                                </label>
                                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;color:#555;">
                                    <input type="checkbox" id="jb-open-popup" ${openInPopup ? 'checked' : ''} style="cursor:pointer;width:16px;height:16px;">
                                    <span>弹窗方式打开详情页</span>
                                </label>
                                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;color:#555;">
                                    <input type="checkbox" id="jb-show-emby-status" ${showEmbyStatus ? 'checked' : ''} style="cursor:pointer;width:16px;height:16px;">
                                    <span>显示 Emby 入库状态</span>
                                </label>
                                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;color:#555;">
                                    <input type="checkbox" id="jb-show-jellyfin-status" ${showJellyfinStatus ? 'checked' : ''} style="cursor:pointer;width:16px;height:16px;">
                                    <span>显示 Jellyfin 入库状态</span>
                                </label>
                            </div>
                        </div>

                        <div id="tab-emby" class="jb-tab-content" style="display:none;">
                            <div style="margin-bottom:15px;color:#666;font-size:12px;">Emby 上次同步: ${LAST_SYNC_TIME ? new Date(LAST_SYNC_TIME).toLocaleString() : '尚未同步'} | Jellyfin 上次同步: ${JELLYFIN_LAST_SYNC_TIME ? new Date(JELLYFIN_LAST_SYNC_TIME).toLocaleString() : '尚未同步'}</div>
                            <div style="background:#f0f8ff;border-left:3px solid #2196F3;padding:12px;margin-bottom:15px;font-size:13px;line-height:1.6;">
                                <strong>📖 使用说明：</strong><br>
                                1. <strong>添加服务器</strong>：点击下方绿色按钮，选择服务器类型（Emby / Jellyfin），填写名称、地址和 API Key。<br>
                                2. <strong>获取 API Key</strong>：登录 Emby 后台 → 设置 → 高级 → API 密钥 → 新建；Jellyfin 后台 → 控制台 → 高级 → API 密钥 → 新建。<br>
                                3. <strong>保存并同步</strong>：点击下方蓝色按钮，脚本将<strong>立即连接</strong>所有已填写的服务器并<strong>全量抓取</strong>番号数据。只有同步成功后，页面才会显示入库状态。<br>
                                4. <strong>入库检查方式</strong>：脚本会同步服务器中所有视频的标题并建立本地索引，实现秒级比对。同时脚本具备<strong>实时秒同步</strong>能力，当您在服务器中<strong>增加或删除</strong>媒体视频后，页面状态也会实时感知并同步更新，无需手动干预。
                            </div>
                            <!-- Emby 区域 -->
                            <div style="margin-bottom:20px;">
                                <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #4CAF50;">
                                    <span style="padding:2px 8px;background:#4CAF50;color:white;border-radius:3px;font-size:12px;">Emby</span>
                                    <strong style="font-size:15px;">Emby 服务器配置</strong>
                                </div>
                                <div id="emby-server-list-container">`;
        servers.forEach((server, index) => {
            if ((server.type || 'emby') === 'emby') {
                html += renderServerCardHTML(server, index);
            }
        });
        html += `
                                </div>
                                <button id="add-emby-server-btn" style="background:#4CAF50;color:white;border:none;padding:8px 20px;border-radius:4px;cursor:pointer;margin-top:10px;">➕ 添加 Emby 服务器</button>
                            </div>
                            <!-- Jellyfin 区域 -->
                            <div style="margin-bottom:20px;">
                                <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #673AB7;">
                                    <span style="padding:2px 8px;background:#673AB7;color:white;border-radius:3px;font-size:12px;">Jellyfin</span>
                                    <strong style="font-size:15px;">Jellyfin 服务器配置</strong>
                                </div>
                                <div id="jellyfin-server-list-container">`;
        servers.forEach((server, index) => {
            if ((server.type || 'emby') === 'jellyfin') {
                html += renderServerCardHTML(server, index);
            }
        });
        html += `
                                </div>
                                <button id="add-jellyfin-server-btn" style="background:#673AB7;color:white;border:none;padding:8px 20px;border-radius:4px;cursor:pointer;margin-top:10px;">➕ 添加 Jellyfin 服务器</button>
                            </div>
                            <div style="display:flex;gap:10px;margin-top:15px;">
                                <button id="save-servers-btn" style="background:#2196F3;color:white;border:none;padding:8px 20px;border-radius:4px;cursor:pointer;" title="保存所有服务器配置并立即同步媒体库">💾 保存并同步</button>
                            </div>
                        </div>

                        <div id="tab-backup" class="jb-tab-content" style="display:none;">
                            <div style="display:flex;flex-direction:column;gap:20px;">
                                <div>
                                    <h4 style="margin:0 0 10px 0;font-size:14px;color:#333;">☁️ WebDAV 备份</h4>
                                    <div style="display:flex;flex-direction:column;gap:10px;max-width:500px;">
                                        <div style="background:#f8f9fa;border:1px solid #e9ecef;border-radius:4px;padding:10px 12px;font-size:12px;color:#555;line-height:1.6;">
                                            <div style="font-weight:bold;color:#333;margin-bottom:4px;">💡 地址填写说明</div>
                                            <div>• 通用格式：<code style="background:#e9ecef;padding:1px 4px;border-radius:3px;">http(s)://IP:端口/文件夹路径</code></div>
                                            <div>• <b>Alist 用户</b>：必须带 <code style="background:#e9ecef;padding:1px 4px;border-radius:3px;">/dav/</code> 路径，例如：<code style="background:#e9ecef;padding:1px 4px;border-radius:3px;">http://192.168.1.10:5244/dav/夸克网盘/备份</code></div>
                                            <div>• 若地址不含 <code style="background:#e9ecef;padding:1px 4px;border-radius:3px;">/dav/</code> 且端口为 5244，脚本会自动补全</div>
                                            <div>• 中文路径可直接粘贴，脚本会自动编码</div>
                                        </div>
                                        <div style="display:flex;align-items:center;gap:8px;">
                                            <label style="display:inline-block;width:80px;font-size:13px;color:#666;">服务器地址：</label>
                                            <input type="text" id="jb-webdav-url" value="${webdavUrl.replace(/"/g,'&quot;')}" placeholder="https://dav.example.com/javdb/" style="flex:1;padding:8px;font-size:13px;border:1px solid #ddd;border-radius:4px;">
                                        </div>
                                        <div style="display:flex;align-items:center;gap:8px;">
                                            <label style="display:inline-block;width:80px;font-size:13px;color:#666;">用户名：</label>
                                            <input type="text" id="jb-webdav-user" value="${webdavUser.replace(/"/g,'&quot;')}" placeholder="user" style="flex:1;padding:8px;font-size:13px;border:1px solid #ddd;border-radius:4px;">
                                        </div>
                                        <div style="display:flex;align-items:center;gap:8px;">
                                            <label style="display:inline-block;width:80px;font-size:13px;color:#666;">密码：</label>
                                            <input type="password" id="jb-webdav-pass" value="${webdavPass.replace(/"/g,'&quot;')}" placeholder="password" style="flex:1;padding:8px;font-size:13px;border:1px solid #ddd;border-radius:4px;">
                                        </div>
                                        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
                                            <button id="jb-webdav-save-btn" style="background:#607D8B;color:white;border:none;padding:6px 16px;border-radius:4px;cursor:pointer;font-size:13px;">💾 保存配置</button>
                                            <button id="jb-webdav-test-btn" style="background:#2196F3;color:white;border:none;padding:6px 16px;border-radius:4px;cursor:pointer;font-size:13px;">🔌 测试连接</button>
                                            <button id="jb-webdav-backup-btn" style="background:#FF9800;color:white;border:none;padding:6px 16px;border-radius:4px;cursor:pointer;font-size:13px;">⬆️ 备份到WebDAV</button>
                                            <button id="jb-webdav-restore-btn" style="background:#9C27B0;color:white;border:none;padding:6px 16px;border-radius:4px;cursor:pointer;font-size:13px;">⬇️ 从WebDAV恢复</button>
                                        </div>
                                        <div id="jb-webdav-msg" style="font-size:13px;color:#666;min-height:20px;margin-top:5px;"></div>
                                    </div>
                                </div>
                                <div style="border-top:1px solid #eee;padding-top:15px;">
                                    <h4 style="margin:0 0 10px 0;font-size:14px;color:#333;">💾 本地备份与恢复</h4>
                                    <div style="display:flex;gap:10px;flex-wrap:wrap;">
                                        <button id="backup-btn" style="background:#FF9800;color:white;border:none;padding:8px 20px;border-radius:4px;cursor:pointer;font-size:13px;">📥 备份配置</button>
                                        <button id="restore-btn" style="background:#9C27B0;color:white;border:none;padding:8px 20px;border-radius:4px;cursor:pointer;font-size:13px;">📤 恢复配置</button>
                                    </div>
                                </div>
                                <input type="file" id="restore-file-input" accept=".json" style="display:none;">
                            </div>
                        </div>

                        <div id="tab-about" class="jb-tab-content" style="display:none;">
                            <div style="text-align:center;padding:30px 0;">
                                <h3 style="margin:0 0 10px 0;color:#333;">JAVDB全能助手</h3>
                                <p style="margin:0 0 20px 0;color:#666;font-size:13px;">by: 潇洒公子</p>
                                <p style="margin:0 0 25px 0;color:#999;font-size:12px;">Version ${version}</p>
                                <div style="display:flex;justify-content:center;gap:20px;flex-wrap:wrap;">
                                    <div>
                                        <img src="https://raw.githubusercontent.com/86168057/JavdbBuddy/main/%E6%94%B6%E6%AC%BE%E4%BA%8C%E7%BB%B4%E7%A0%81/%E5%BE%AE%E4%BF%A1%E6%94%B6%E6%AC%BE%E4%BA%8C%E7%BB%B4%E7%A0%81.png" style="width:200px;height:200px;object-fit:contain;border:1px solid #eee;border-radius:4px;" alt="微信">
                                        <p style="margin:5px 0 0 0;color:#666;font-size:12px;">微信</p>
                                    </div>
                                    <div>
                                        <img src="https://raw.githubusercontent.com/86168057/JavdbBuddy/main/%E6%94%B6%E6%AC%BE%E4%BA%8C%E7%BB%B4%E7%A0%81/%E6%94%AF%E4%BB%98%E5%AE%9D%E6%94%B6%E6%AC%BE%E4%BA%8C%E7%BB%B4%E7%A0%81.png" style="width:200px;height:200px;object-fit:contain;border:1px solid #eee;border-radius:4px;" alt="支付宝">
                                        <p style="margin:5px 0 0 0;color:#666;font-size:12px;">支付宝</p>
                                    </div>
                                </div>
                                <div style="margin-top:20px;display:flex;justify-content:center;gap:20px;flex-wrap:wrap;">
                                    <a href="https://greasyfork.org/scripts?q=JavdbBuddy" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:#f7f7f7;border:1px solid #ddd;border-radius:4px;color:#333;text-decoration:none;font-size:13px;transition:all 0.2s;">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                                        <span>油猴脚本</span>
                                    </a>
                                    <a href="https://github.com/86168057/JavdbBuddy" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:#f7f7f7;border:1px solid #ddd;border-radius:4px;color:#333;text-decoration:none;font-size:13px;transition:all 0.2s;">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"></path></svg>
                                        <span>GitHub 仓库</span>
                                    </a>
                                </div>
                                <p style="margin-top:20px;color:#e91e63;font-size:13px;">💖 感谢支持，如果觉得脚本好用，欢迎打赏一杯咖啡 ☕</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        
        overlay.innerHTML = html;
        document.body.appendChild(overlay);

        // 分类切换逻辑
        const tabs = overlay.querySelectorAll('.jb-setting-tab');
        const contents = overlay.querySelectorAll('.jb-tab-content');
        const titleEl = overlay.querySelector('#jb-setting-title');
        const tabTitles = { 'tab-general': '通用设置', 'tab-emby': '媒体服务器配置', 'tab-backup': '备份与恢复', 'tab-about': '关于打赏' };
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                tabs.forEach(t => { t.classList.remove('active'); t.style.background = 'transparent'; t.style.color = '#666'; t.style.borderLeftColor = 'transparent'; t.style.fontWeight = 'normal'; });
                tab.classList.add('active'); tab.style.background = '#e3f2fd'; tab.style.color = '#333'; tab.style.borderLeftColor = '#2196F3'; tab.style.fontWeight = 'bold';
                contents.forEach(c => c.style.display = 'none');
                const targetContent = overlay.querySelector('#' + target);
                if (targetContent) targetContent.style.display = 'block';
                if (titleEl) titleEl.textContent = tabTitles[target] || '';
            });
        });

        // 如果传入了 activeTab，自动切换到该标签页
        if (activeTab) {
            const targetTab = overlay.querySelector(`.jb-setting-tab[data-tab="${activeTab}"]`);
            if (targetTab) targetTab.click();
        }

        // 自动保存逻辑 (不再包含未连接成功的服务器)
        const autoSave = () => {
            let changed = false;
            const newServers = [];
            servers.forEach((s, index) => {
                const name = document.getElementById(`name-${index}`)?.value.trim();
                const url = document.getElementById(`url-${index}`)?.value.trim();
                const apiKey = document.getElementById(`key-${index}`)?.value.trim();
                
                if (url && apiKey) {
                    const normalizedUrl = url.replace(/\/$/, '');
                    // 如果地址没变且没有错误，或者它是之前连接成功的，我们保留
                    // 如果地址变了，我们不在此处保存它为"已验证"状态
                    if (normalizedUrl === s.url && apiKey === s.apiKey) {
                        newServers.push({
                            ...s,
                            name: name || 'emby'
                        });
                    }
                }
            });
            saveServers(newServers);
        };

        // 点击背景自动保存并关闭
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                autoSave();
                overlay.remove();
            }
        };
        
        document.getElementById('close-settings-btn').onclick = () => {
            autoSave();
            overlay.remove();
        };
        function addServerByType(type) {
            const newIndex = servers.length;
            const defaultName = type === 'emby' ? 'emby' : 'jellyfin';
            servers.push({ url: '', apiKey: '', name: defaultName, type: type });
            saveServers(servers);
            const containerId = type === 'emby' ? 'emby-server-list-container' : 'jellyfin-server-list-container';
            const container = document.getElementById(containerId);
            if (!container) return;
            const statusHtml = `<span style="margin-left:10px;padding:1px 6px;background:#9e9e9e;color:white;border-radius:3px;font-size:10px;font-weight:normal;">待同步/未连接</span>`;
            const typeLabel = type === 'emby' ? 'Emby' : 'Jellyfin';
            const bgColor = type === 'emby' ? '#4CAF50' : '#673AB7';
            const itemHtml = `
            <div class="server-item" style="border:1px solid #ddd;margin-bottom:10px;border-radius:4px;">
                <div class="server-header" style="padding:12px 15px;background:#f8f9fa;cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onclick="const body = document.getElementById('server-body-${newIndex}'); const arrow = document.getElementById('server-arrow-${newIndex}'); body.style.display = body.style.display === 'none' ? 'block' : 'none'; arrow.textContent = body.style.display === 'none' ? '▼' : '▲';">
                    <div style="display:flex;align-items:center;">
                        <span style="margin-right:8px;padding:1px 6px;background:${bgColor};color:white;border-radius:3px;font-size:10px;">${typeLabel}</span>
                        <strong style="font-size:14px;">${defaultName}</strong>
                        ${statusHtml}
                    </div>
                    <span id="server-arrow-${newIndex}" style="color:#999;font-size:12px;transition:transform 0.2s;">▲</span>
                </div>
                <div id="server-body-${newIndex}" style="padding:15px;display:block;">
                    <input type="hidden" id="type-${newIndex}" value="${type}" />
                    <div style="margin-bottom:8px;">
                        <label style="display:inline-block;width:140px;font-weight:bold;">服务器名称：</label>
                        <input type="text" id="name-${newIndex}" value="${defaultName}" placeholder="例如：主服务器" style="width:calc(100% - 150px);padding:5px;" />
                    </div>
                    <div style="margin-bottom:8px;">
                        <label style="display:inline-block;width:140px;font-weight:bold;">服务器地址：</label>
                        <input type="text" id="url-${newIndex}" value="" placeholder="例如：http://192.168.1.100:8096" style="width:calc(100% - 150px);padding:5px;" />
                    </div>
                    <div style="margin-bottom:12px;">
                        <label style="display:inline-block;width:140px;font-weight:bold;">API Key：</label>
                        <input type="text" id="key-${newIndex}" value="" placeholder="32位API密钥" style="width:calc(100% - 150px);padding:5px;" />
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button class="connect-server-btn" data-index="${newIndex}" style="background:#2196F3;color:white;border:none;padding:5px 15px;border-radius:3px;cursor:pointer;">连接</button>
                        <button class="remove-server-btn" data-index="${newIndex}" style="background:#f44336;color:white;border:none;padding:5px 15px;border-radius:3px;cursor:pointer;">删除</button>
                    </div>
                </div>
            </div>`;
            container.insertAdjacentHTML('beforeend', itemHtml);
            const newConnectBtn = overlay.querySelector(`.connect-server-btn[data-index="${newIndex}"]`);
            const newRemoveBtn = overlay.querySelector(`.remove-server-btn[data-index="${newIndex}"]`);
            if (newConnectBtn) newConnectBtn.onclick = function() { handleConnect(this); };
            if (newRemoveBtn) newRemoveBtn.onclick = function() { handleRemove(this); };
        }

        document.getElementById('add-emby-server-btn').onclick = () => addServerByType('emby');
        document.getElementById('add-jellyfin-server-btn').onclick = () => addServerByType('jellyfin');
        document.getElementById('save-servers-btn').onclick = () => {
            const newServers = [];
            servers.forEach((_, index) => {
                const url = document.getElementById(`url-${index}`)?.value.trim() || '';
                if (url) {
                    newServers.push({
                        url: url.replace(/\/$/, ''),
                        apiKey: document.getElementById(`key-${index}`)?.value.trim() || '',
                        name: document.getElementById(`name-${index}`)?.value.trim() || 'emby',
                        type: document.getElementById(`type-${index}`)?.value || 'emby'
                    });
                }
            });
            saveServers(newServers);
            overlay.remove();
            syncFullLibrary(true);
        };
        
        // 备份配置
        document.getElementById('backup-btn').onclick = () => {
            const config = {
                servers: getServers(),
                libraryIndex: LIBRARY_INDEX,
                jellyfinLibraryIndex: JELLYFIN_LIBRARY_INDEX,
                lastSyncTime: LAST_SYNC_TIME,
                jellyfinLastSyncTime: JELLYFIN_LAST_SYNC_TIME,
                backupTime: new Date().toISOString()
            };
            const json = JSON.stringify(config, null, 2);
            const defaultName = `javdb-emby-backup-${new Date().toISOString().slice(0,10)}.json`;

            // 优先尝试 File System Access API，让用户选择保存路径
            // Tampermonkey 隔离上下文中 window 不是真顶层 window，必须用 unsafeWindow 访问浏览器原生 API
            const realWindow = (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window);
            if (typeof realWindow.showSaveFilePicker === 'function') {
                let pickerPromise;
                try {
                    pickerPromise = realWindow.showSaveFilePicker({
                        suggestedName: defaultName,
                        types: [{
                            description: 'JSON 文件',
                            accept: { 'application/json': ['.json'] }
                        }]
                    });
                } catch (err) {
                    console.warn('[JavdbBuddy] showSaveFilePicker 同步调用失败:', err);
                }
                if (pickerPromise) {
                    pickerPromise.then(async handle => {
                        const writable = await handle.createWritable();
                        await writable.write(json);
                        await writable.close();
                    }).catch(err => {
                        if (err.name !== 'AbortError') {
                            console.warn('[JavdbBuddy] showSaveFilePicker 后续失败，fallback 到默认下载:', err);
                            fallbackDownload(json, defaultName);
                        }
                    });
                    return;
                }
            }

            fallbackDownload(json, defaultName);
        };

        function fallbackDownload(json, defaultName) {
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = defaultName;
            a.click();
            URL.revokeObjectURL(url);
        }
        
        // 恢复配置
        document.getElementById('restore-btn').onclick = () => {
            document.getElementById('restore-file-input').click();
        };
        
        document.getElementById('restore-file-input').onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const config = JSON.parse(event.target.result);
                    if (config.servers) {
                        GM_setValue('emby_servers', JSON.stringify(config.servers));
                    }
                    if (config.libraryIndex) {
                        GM_setValue('emby_library_index', JSON.stringify(config.libraryIndex));
                        LIBRARY_INDEX = config.libraryIndex;
                    }
                    if (config.jellyfinLibraryIndex) {
                        GM_setValue('jellyfin_library_index', JSON.stringify(config.jellyfinLibraryIndex));
                        JELLYFIN_LIBRARY_INDEX = config.jellyfinLibraryIndex;
                    }
                    if (config.lastSyncTime) {
                        GM_setValue('emby_last_sync', config.lastSyncTime);
                        LAST_SYNC_TIME = config.lastSyncTime;
                    }
                    if (config.jellyfinLastSyncTime) {
                        GM_setValue('jellyfin_last_sync', config.jellyfinLastSyncTime);
                        JELLYFIN_LAST_SYNC_TIME = config.jellyfinLastSyncTime;
                    }
                    overlay.remove();
                    showSettingsDialog('tab-emby');
                } catch (err) {
                    console.error('配置文件格式错误：', err);
                }
            };
            reader.readAsText(file);
        };

        // 通用设置变更即时保存
        document.getElementById('jb-hover-zoom')?.addEventListener('change', (e) => {
            GM_setValue('jb_enable_hover_zoom', e.target.checked);
        });
        document.getElementById('jb-open-new-tab')?.addEventListener('change', (e) => {
            GM_setValue('jb_open_in_new_tab', e.target.checked);
            // 立即应用到当前页面
            applyListPageLinkTarget();
        });
        document.getElementById('jb-open-all-links')?.addEventListener('change', (e) => {
            GM_setValue('jb_open_all_links_in_new_tab', e.target.checked);
            // 立即应用到当前页面
            applyAllLinksTarget();
        });
        document.getElementById('jb-open-popup')?.addEventListener('change', (e) => {
            GM_setValue('jb_open_in_popup', e.target.checked);
            // 立即应用到当前页面
            applyListPagePopup();
        });
        document.getElementById('jb-show-emby-status')?.addEventListener('change', (e) => {
            GM_setValue('jb_show_emby_status', e.target.checked);
            refreshStatusIndicators();
        });
        document.getElementById('jb-show-jellyfin-status')?.addEventListener('change', (e) => {
            GM_setValue('jb_show_jellyfin_status', e.target.checked);
            refreshStatusIndicators();
        });

        // WebDAV 配置保存
        document.getElementById('jb-webdav-save-btn')?.addEventListener('click', () => {
            const url = document.getElementById('jb-webdav-url')?.value.trim() || '';
            const user = document.getElementById('jb-webdav-user')?.value.trim() || '';
            const pass = document.getElementById('jb-webdav-pass')?.value || '';
            GM_setValue('jb_webdav_url', url);
            GM_setValue('jb_webdav_user', user);
            GM_setValue('jb_webdav_pass', pass);
            const msg = document.getElementById('jb-webdav-msg');
            if (msg) { msg.textContent = '✅ WebDAV 配置已保存'; msg.style.color = '#4CAF50'; }
            setTimeout(() => { if (msg) msg.textContent = ''; }, 2000);
        });

        // WebDAV 备份
        document.getElementById('jb-webdav-backup-btn')?.addEventListener('click', async () => {
            const msgEl = document.getElementById('jb-webdav-msg');
            if (msgEl) { msgEl.textContent = '⬆️ 正在备份到 WebDAV...'; msgEl.style.color = '#666'; }
            const result = await backupToWebDAV();
            if (msgEl) {
                msgEl.textContent = result.success ? '✅ ' + result.message : '❌ ' + result.message;
                msgEl.style.color = result.success ? '#4CAF50' : '#f44336';
            }
            setTimeout(() => { if (msgEl) msgEl.textContent = ''; }, 5000);
        });

        // WebDAV 恢复
        document.getElementById('jb-webdav-restore-btn')?.addEventListener('click', async () => {
            const msgEl = document.getElementById('jb-webdav-msg');
            if (msgEl) { msgEl.textContent = '⬇️ 正在从 WebDAV 恢复...'; msgEl.style.color = '#666'; }
            const result = await restoreFromWebDAV();
            if (msgEl) {
                msgEl.textContent = result.success ? '✅ ' + result.message + '，即将刷新' : '❌ ' + result.message;
                msgEl.style.color = result.success ? '#4CAF50' : '#f44336';
            }
            if (result.success) setTimeout(() => window.location.reload(), 800);
        });

        // WebDAV 测试连接
        document.getElementById('jb-webdav-test-btn')?.addEventListener('click', async () => {
            const msgEl = document.getElementById('jb-webdav-msg');
            if (msgEl) { msgEl.textContent = '🔌 正在测试连接...'; msgEl.style.color = '#666'; }
            const result = await testWebDAVConnection();
            if (msgEl) {
                msgEl.textContent = result.success ? '✅ ' + result.message : '❌ ' + result.message;
                msgEl.style.color = result.success ? '#4CAF50' : '#f44336';
            }
        });

        async function handleConnect(btn) {
            const index = parseInt(btn.getAttribute('data-index'));
            const name = document.getElementById(`name-${index}`)?.value.trim() || 'emby';
            const url = document.getElementById(`url-${index}`)?.value.trim();
            const apiKey = document.getElementById(`key-${index}`)?.value.trim();
            const serverType = document.getElementById(`type-${index}`)?.value || 'emby';
            const typeLabel = serverType === 'emby' ? 'Emby' : 'Jellyfin';

            if (!url || !apiKey) {
                console.warn('JavdbBuddy: 请填写完整的服务器地址和 API Key');
                return;
            }

            const originalText = btn.textContent;
            btn.textContent = '连接中...';
            btn.disabled = true;
            btn.style.opacity = '0.7';

            const tempServer = {
                url: url.replace(/\/$/, ''),
                apiKey: apiKey,
                name: name,
                type: serverType
            };

            try {
                const items = await new Promise((resolve, reject) => {
                    const apiUrl = `${tempServer.url}/Items?Recursive=true&IncludeItemTypes=Movie&Fields=Path&Limit=1&api_key=${tempServer.apiKey}`;
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: apiUrl,
                        timeout: 3000,
                        onload: function(response) {
                            if (response.status === 200) {
                                try {
                                    const data = JSON.parse(response.responseText);
                                    resolve(data.Items || []);
                                } catch (e) { reject('数据解析失败'); }
                            } else if (response.status === 401) {
                                reject(`${typeLabel} API Key 错误`);
                            } else {
                                reject(`连接失败 (${response.status})`);
                            }
                        },
                        onerror: function() { reject(`${typeLabel}服务器地址错误或未连接`); },
                        ontimeout: function() { reject(`${typeLabel}服务器连接超时`); }
                    });
                });

                servers[index] = {
                    ...tempServer,
                    lastError: false,
                    statusMsg: '在线已连接'
                };
                saveServers(servers);

                syncFullLibrary(false);

                overlay.remove();
                showSettingsDialog('tab-emby');
                initCheck();
            } catch (e) {
                servers[index].statusMsg = e.toString();
                servers[index].lastError = true;

                btn.textContent = originalText;
                btn.disabled = false;
                btn.style.opacity = '1';

                const statusTag = document.querySelector(`#server-body-${index}`).previousElementSibling.querySelector('span[id^="server-arrow-"]').previousElementSibling;
                if (statusTag) {
                    statusTag.innerHTML = `<span style="margin-left:10px;padding:1px 6px;background:#ff9800;color:white;border-radius:3px;font-size:10px;font-weight:normal;">${e.toString()}</span>`;
                }
            }
        }
        
        function handleRemove(btn) {
            const idx = parseInt(btn.getAttribute('data-index'));
            servers.splice(idx, 1);
            saveServers(servers);
            overlay.remove();
            showSettingsDialog('tab-emby');
        }

        overlay.querySelectorAll('.connect-server-btn').forEach(btn => {
            btn.onclick = function() { handleConnect(this); };
        });
        
        overlay.querySelectorAll('.remove-server-btn').forEach(btn => {
            btn.onclick = function() { handleRemove(this); };
        });
    }

    // 样式
    const style = document.createElement('style');
    style.textContent = `
        .emby-status {
            display: inline-block;
            margin-left: 8px;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: bold;
            vertical-align: middle;
            line-height: 1.5;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            min-width: max-content !important;
            overflow: visible !important;
        }
        .emby-status-wrap {
            display: inline-flex !important;
            flex-direction: row !important;
            align-items: center;
            gap: 4px;
            flex-wrap: wrap;
            vertical-align: middle;
            min-width: fit-content !important;
            width: auto !important;
            flex-shrink: 0 !important;
        }
        .panel-block .emby-status-wrap {
            flex-shrink: 0 !important;
            min-width: fit-content !important;
        }
        .emby-status.exists {
            background-color: #4CAF50;
            color: white;
            cursor: pointer !important;
        }
        .emby-status.not-exists {
            background-color: #f44336;
            color: white;
        }
        .emby-status.not-added {
            background-color: #9e9e9e;
            color: white;
        }
        .emby-status.error {
            background-color: #ff9800;
            color: white;
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .grid-item, .movie-list .item { position: relative; }
        .grid-item .tags .emby-status,
        .movie-list .item .tags .emby-status {
            margin-right: 5px;
            margin-bottom: 5px;
        }
        /* 新增：第二行工具栏容器 */
        .emby-status-row {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 3px;
            margin-top: 5px;
            width: 100%;
        }
        .emby-tools-row {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 5px;
            margin-top: 5px;
            width: 100%;
        }
        .emby-tools-row .emby-status, 
        .emby-tools-row .preview-toggle-btn, 
        .emby-tools-row .magnet-toggle-btn,
        .emby-tools-row .review-toggle-btn,
        .emby-tools-row .copy-code-btn {
            margin: 0 !important;
            padding: 2px 6px !important; /* 缩小内边距 */
            font-size: clamp(9px, 1.2vw, 12px) !important;  /* 响应式字体，最小9px，最大12px */
            height: auto !important;     /* 取消固定高度，让文字撑开 */
            min-height: 20px !important;
            line-height: 1.4 !important;
            white-space: nowrap;
        }
        
        /* 响应式：极小屏幕下缩小文字 */
        @media screen and (max-width: 480px) {
            .emby-tools-row .preview-toggle-btn,
            .emby-tools-row .magnet-toggle-btn,
            .emby-tools-row .review-toggle-btn,
            .emby-tools-row .copy-code-btn {
                font-size: 9px !important;
                padding: 1px 4px !important;
            }
        }
        
        /* 悬浮封面放大 */
        .jb-hover-zoom-img {
            position: fixed;
            z-index: 999999;
            border-radius: 8px;
            box-shadow: 0 12px 40px rgba(0,0,0,0.45);
            pointer-events: none;
            opacity: 0;
            transform: scale(0.9);
            transition: opacity 0.25s ease, transform 0.25s ease;
            max-width: 650px;
            max-height: 930px;
            object-fit: contain;
            background: #000;
            border: 2px solid rgba(255,255,255,0.15);
        }
        .jb-hover-zoom-img.visible {
            opacity: 1;
            transform: scale(1.35);
        }

        /* 演员名单弹窗头部样式 */
        .actor-header-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            padding: 8px 12px;
            margin-bottom: 12px;
            background: linear-gradient(135deg, #667eea22, #764ba222);
            border-radius: 8px;
            border: 1px solid #667eea33;
            align-items: center;
        }
        .actor-header-bar .actor-label {
            font-size: 12px;
            color: #666;
            font-weight: bold;
        }
        .actor-header-bar .actor-link {
            display: inline-flex;
            align-items: center;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            text-decoration: none;
            border: 1px solid transparent;
            transition: all 0.2s;
            margin: 0 2px;
        }
        .actor-header-bar .actor-link:hover {
            background: rgba(0,0,0,0.08);
            transform: translateY(-1px);
        }
        .actor-header-bar .actor-female {
            color: #e91e63 !important;
            background: rgba(233,30,99,0.08);
            border-color: rgba(233,30,99,0.2);
        }
        .actor-header-bar .actor-female:hover {
            background: rgba(233,30,99,0.15);
        }
        .actor-header-bar .actor-male {
            color: #2196f3 !important;
            background: rgba(33,150,243,0.08);
            border-color: rgba(33,150,243,0.2);
        }
        .actor-header-bar .actor-male:hover {
            background: rgba(33,150,243,0.15);
        }
        .actor-header-bar .actor-unknown {
            color: #888 !important;
        }
        
        /* 全屏查看器托盘图标样式 */
        .viewer-controls {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
            z-index: 1000001;
        }
        .viewer-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            background: rgba(255,255,255,0.2);
            color: white;
            font-size: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            backdrop-filter: blur(5px);
        }
        .viewer-btn:hover {
            background: rgba(255,255,255,0.4);
            transform: scale(1.1);
        }
        
        /* 弹窗样式 */
        #emby-modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8);
            z-index: 999999;
            display: none;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(5px);
        }
        #emby-modal-window {
            background: white;
            width: 80%;
            max-width: 1000px;
            max-height: 85vh;
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            animation: emby-modal-in 0.3s ease-out;
            overscroll-behavior: contain;
        }
        @keyframes emby-modal-in {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        #emby-modal-header {
            padding: 15px 20px;
            background: #f8f9fa;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        #emby-modal-title {
            font-weight: bold;
            font-size: 16px;
            color: #333;
        }
        #emby-modal-close {
            cursor: pointer;
            font-size: 24px;
            color: #999;
            line-height: 1;
        }
        #emby-modal-close:hover { color: #333; }
        #emby-modal-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
        }
        
        .preview-toggle-btn, .magnet-toggle-btn, .review-toggle-btn {
            display: inline-flex;
            align-items: center;
            padding: 2px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            color: white;
            cursor: pointer;
            line-height: 20px;
            height: 24px;
            transition: all 0.2s;
            position: relative;
        }
        .preview-toggle-btn { background-color: #2196F3; }
        .preview-toggle-btn:hover { background-color: #1976D2; }
        .magnet-toggle-btn { background-color: #E91E63; }
        .magnet-toggle-btn:hover { background-color: #C2185B; }
        .review-toggle-btn {
            display: inline-flex;
            align-items: center;
            background-color: #FF9800;
            color: white;
        }
        .review-toggle-btn:hover {
            background-color: #F57C00;
        }
        
        /* 短评按钮角标（显示数量） */
        .review-toggle-btn .badge {
            position: absolute;
            top: -6px;
            right: -6px;
            background: #4CAF50;
            color: white;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        
        /* 短评弹窗列表卡片 */
        .review-modal-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .review-item-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 12px 14px;
            border-left: 4px solid #FF9800;
        }
        .review-user-label {
            font-weight: bold;
            font-size: 13px;
            color: #e91e63;
            margin-bottom: 6px;
        }
        .review-text {
            font-size: 13px;
            color: #444;
            line-height: 1.6;
            word-break: break-word;
        }
        
        /* 磁力链按钮角标 */
        .magnet-toggle-btn .badge {
            position: absolute;
            top: -6px;
            right: -6px;
            background: #4CAF50;
            color: white;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        .magnet-toggle-btn .badge.no-magnet {
            background: #9e9e9e;
        }
        
        /* 弹窗内容排版优化 */
        .modal-images-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: flex-start;
            align-items: flex-start;
        }
        .modal-images-grid img {
            height: 120px; /* 固定小图高度 */
            width: auto;
            object-fit: cover;
            border-radius: 4px;
            background: #f0f0f0;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: all 0.2s;
        }
        .modal-images-grid img:hover { 
            transform: scale(1.05); 
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10;
        }
        
        /* 图片查看器 */
        #image-viewer-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.95);
            z-index: 9999999;
            display: none;
            align-items: center;
            justify-content: center;
        }
        #image-viewer-container {
            position: relative;
            max-width: 100vw;
            max-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: auto;
        }
        #image-viewer-img {
            display: block;
            transition: transform 0.2s;
            cursor: zoom-in;
        }
        #image-viewer-img.zoomed {
            cursor: zoom-out;
        }
        .viewer-btn {
            position: absolute;
            background: rgba(255,255,255,0.9);
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            font-size: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            z-index: 10;
        }
        .viewer-btn:hover {
            background: white;
            transform: scale(1.1);
        }
        #viewer-close {
            top: 20px;
            right: 20px;
        }
        #viewer-prev {
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
        }
        #viewer-next {
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
        }
        .viewer-controls {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
        }
        
        /* 夸克按钮样式 */
        .modal-btn-quark { 
            background: #00CCAB !important; 
            color: white !important;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
        .modal-btn-quark:hover { background: #00B398 !important; }
        .quark-icon {
            width: 14px;
            height: 14px;
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="white" d="M512 0C229.2 0 0 229.2 0 512s229.2 512 512 512 512-229.2 512-512S794.8 0 512 0zm0 819.2c-169.7 0-307.2-137.5-307.2-307.2S342.3 204.8 512 204.8s307.2 137.5 307.2 307.2-137.5 307.2-307.2 307.2z"/></svg>');
            background-size: contain;
            display: inline-block;
        }

        .modal-magnet-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .modal-magnet-item {
            display: flex;
            align-items: center;
            padding: 12px 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #eee;
        }
        .modal-magnet-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;
            overflow: hidden;
        }
        .modal-magnet-name {
            font-size: 14px;
            font-weight: bold;
            color: #333;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .modal-magnet-meta {
            font-size: 12px;
            color: #666;
            font-family: monospace;
        }
        .modal-magnet-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 2px;
        }
        .modal-tag {
            padding: 1px 6px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: bold;
        }
        .modal-tag.is-warning { background: #ffdd57; color: rgba(0,0,0,0.7); }
        .modal-tag.is-info { background: #209cee; color: white; }
        .modal-tag.is-success { background: #23d160; color: white; }
        .modal-tag.is-primary { background: #00d1b2; color: white; }
        
        .modal-magnet-btns {
            display: flex;
            gap: 8px;
        }
        .modal-btn {
            padding: 5px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            text-decoration: none;
            border: none;
            transition: all 0.2s;
        }
        .modal-btn-copy { background: #4CAF50; color: white; }
        .modal-btn-copy:hover { background: #43A047; }
        .modal-btn-dl { background: #E91E63; color: white; }
        .modal-btn-dl:hover { background: #C2185B; }
        
        .preview-loading {
            text-align: center;
            padding: 40px;
            color: #666;
            font-style: italic;
        }
    `;
    document.head.appendChild(style);

    // 状态显示逻辑
    function addStatusIndicator(container, videoCode, itemEl = null, insertBefore = null, serverType = 'emby') {
        if (!videoCode) return;

        // 独立开关控制
        if (serverType === 'emby' && !GM_getValue('jb_show_emby_status', true)) return;
        if (serverType === 'jellyfin' && !GM_getValue('jb_show_jellyfin_status', true)) return;

        // 移除旧的显示状态（如果存在）
        const oldStatus = container.querySelector(`.emby-status[data-type="${serverType}"]`);
        if (oldStatus) {
            oldStatus.remove();
        }

        const servers = getServersByType(serverType);
        const statusDiv = document.createElement('span');
        statusDiv.dataset.type = serverType;

        const isEmby = serverType === 'emby';
        const libraryIndex = isEmby ? LIBRARY_INDEX : JELLYFIN_LIBRARY_INDEX;
        const syncError = isEmby ? SYNC_ERROR : JELLYFIN_SYNC_ERROR;
        const lastSync = isEmby ? LAST_SYNC_TIME : JELLYFIN_LAST_SYNC_TIME;

        // 先插入到容器（确保 isConnected 为 true，后续 render 才能正常工作）
        if (insertBefore) {
            container.insertBefore(statusDiv, insertBefore);
        } else {
            container.appendChild(statusDiv);
        }

        // 优先处理状态异常情况
        if (servers.length === 0) {
            renderStatusMessage(statusDiv, '未添加服务器', 'not-added', serverType);
        } else if (syncError) {
            renderStatusMessage(statusDiv, syncError, 'error', serverType);
        } else if (Object.keys(libraryIndex).length === 0 && lastSync === 0) {
            renderStatusMessage(statusDiv, '请点击设置并同步服务器', 'error', serverType);
            verifyStatusBackground(statusDiv, videoCode, false, serverType);
        } else {
            const info = libraryIndex[videoCode.toUpperCase()];
            if (info) {
                renderExists(statusDiv, info, serverType);
                verifyStatusBackground(statusDiv, videoCode, true, serverType);
            } else {
                renderNotExists(statusDiv, serverType);
                verifyStatusBackground(statusDiv, videoCode, false, serverType);
            }
        }
    }

    // 弹窗管理
    function initModal() {
        if (document.getElementById('emby-modal-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'emby-modal-overlay';
        overlay.innerHTML = `
            <div id="emby-modal-window">
                <div id="emby-modal-header">
                    <div id="emby-modal-title"></div>
                    <div id="emby-modal-close">&times;</div>
                </div>
                <div id="emby-modal-body"></div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.onclick = (e) => { if (e.target === overlay) hideModal(); };
        document.getElementById('emby-modal-close').onclick = hideModal;

        // 滚动隔离：防止弹窗背景滚动
        // 鼠标滚轮隔离
        overlay.addEventListener('wheel', (e) => {
            // 只阻止 overlay 背景层上的滚动，允许 modal-body 内部滚动
            const modalBody = document.getElementById('emby-modal-body');
            if (modalBody && !modalBody.contains(e.target)) {
                e.preventDefault();
            }
        }, { passive: false });

        // 移动端触摸隔离
        overlay.addEventListener('touchmove', (e) => {
            const modalBody = document.getElementById('emby-modal-body');
            if (modalBody && !modalBody.contains(e.target)) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    function showModal(title, contentHtml) {
        modalClosed = false; // 重置关闭标记
        initModal();
        // 保存当前滚动位置
        document.body.dataset.savedScrollY = window.scrollY;
        
        const overlay = document.getElementById('emby-modal-overlay');
        document.getElementById('emby-modal-title').textContent = title;
        document.getElementById('emby-modal-body').innerHTML = contentHtml;
        overlay.style.display = 'flex';
        
        // 锁定页面滚动：仅设置 overflow:hidden，不改变 position/top（防止页面跳回顶部）
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
    }

    // 标记当前模态框是否已关闭（防止请求完成后自动再弹窗）
    let modalClosed = false;

    function hideModal() {
        modalClosed = true;
        const overlay = document.getElementById('emby-modal-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            // 恢复滚动（不改变滚动位置）
            const scrollY = parseInt(document.body.dataset.savedScrollY || '0');
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            // 确保不跳回顶部
            if (window.scrollY !== scrollY) {
                window.scrollTo(0, scrollY);
            }
        }
    }

    // 检查模态框是否仍然打开用于显示内容
    function isModalVisible() {
        const overlay = document.getElementById('emby-modal-overlay');
        return overlay && overlay.style.display === 'flex';
    }

    // 图片查看器
    function initImageViewer() {
        if (document.getElementById('image-viewer-overlay')) return;
        const viewer = document.createElement('div');
        viewer.id = 'image-viewer-overlay';
        viewer.innerHTML = `
            <button class="viewer-btn" id="viewer-close">&times;</button>
            <button class="viewer-btn" id="viewer-prev">&lt;</button>
            <button class="viewer-btn" id="viewer-next">&gt;</button>
            <div id="image-viewer-container">
                <img id="image-viewer-img" />
            </div>
            <div class="viewer-controls">
                <button class="viewer-btn" id="viewer-zoom-in">+</button>
                <button class="viewer-btn" id="viewer-zoom-out">-</button>
                <button class="viewer-btn" id="viewer-reset">⟲</button>
            </div>
        `;
        document.body.appendChild(viewer);

        let currentImages = [];
        let currentIndex = 0;
        let scale = 1;

        const img = document.getElementById('image-viewer-img');
        const overlay = document.getElementById('image-viewer-overlay');

        function showImage(index) {
            currentIndex = index;
            scale = 1;
            img.src = currentImages[index];
            img.style.transform = `scale(${scale})`;
            img.classList.remove('zoomed');
            // 移除尺寸限制，显示原图大小
            img.style.maxWidth = 'none';
            img.style.maxHeight = 'none';
        }

        // 鼠标滚轮切换图片
        overlay.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                // 向上滚轮：上一张
                if (currentIndex > 0) showImage(currentIndex - 1);
            } else {
                // 向下滚轮：下一张
                if (currentIndex < currentImages.length - 1) showImage(currentIndex + 1);
            }
        }, { passive: false });

        document.getElementById('viewer-close').onclick = () => {
            overlay.style.display = 'none';
            document.documentElement.style.overflow = '';
            document.documentElement.style.height = '';
            document.body.style.overflow = '';
            document.body.style.height = '';
        };

        document.getElementById('viewer-prev').onclick = () => {
            if (currentIndex > 0) showImage(currentIndex - 1);
        };

        document.getElementById('viewer-next').onclick = () => {
            if (currentIndex < currentImages.length - 1) showImage(currentIndex + 1);
        };

        document.getElementById('viewer-zoom-in').onclick = () => {
            scale = Math.min(scale + 0.5, 3);
            img.style.transform = `scale(${scale})`;
        };

        document.getElementById('viewer-zoom-out').onclick = () => {
            scale = Math.max(scale - 0.5, 0.5);
            img.style.transform = `scale(${scale})`;
        };

        document.getElementById('viewer-reset').onclick = () => {
            scale = 1;
            img.style.transform = `scale(${scale})`;
        };

        img.onclick = () => {
            if (scale === 1) {
                scale = 2;
                img.classList.add('zoomed');
            } else {
                scale = 1;
                img.classList.remove('zoomed');
            }
            img.style.transform = `scale(${scale})`;
        };

        overlay.onclick = (e) => {
            if (e.target === overlay) {
                overlay.style.display = 'none';
                document.documentElement.style.overflow = '';
                document.documentElement.style.height = '';
                document.body.style.overflow = '';
                document.body.style.height = '';
            }
        };

        window.openImageViewer = (images, index) => {
            currentImages = images;
            showImage(index);
            overlay.style.display = 'flex';
            document.documentElement.style.overflow = 'hidden';
            document.documentElement.style.height = '100%';
            document.body.style.overflow = 'hidden';
            document.body.style.height = '100%';
        };
    }

    // 预加载预览图数据（后台静默加载 + 缓存）
    function preloadPreviewData(itemEl, videoCode) {
        if (PREVIEW_CACHE[videoCode] && PREVIEW_CACHE[videoCode].status === 'loaded') return;
        if (PREVIEW_CACHE[videoCode] && PREVIEW_CACHE[videoCode].status === 'loading') return;
        
        PREVIEW_CACHE[videoCode] = { status: 'loading', imgList: [], actors: [] };
        
        const detailLink = getDetailLink(itemEl);
        if (!detailLink) return;
        
        // 如果已在详情页，从 DOM 直接提取
        if (window.location.pathname.startsWith('/v/')) {
            const doc = document;
            const imgList = parsePreviewImages(doc, window.location.href);
            const actors = parseActorsFromDoc(doc);
            PREVIEW_CACHE[videoCode] = { status: 'loaded', imgList, actors };
            return;
        }
        
        // 否则后台请求
        queueRequest(() => {
            return new Promise((resolve) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: detailLink.href,
                    timeout: 15000,
                    onload: function(response) {
                        const errorMsg = detectResponseError(response);
                        if (errorMsg) {
                            PREVIEW_CACHE[videoCode] = { status: 'error', imgList: [], actors: [], errorMsg };
                            resolve();
                            return;
                        }
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(response.responseText, 'text/html');
                        const imgList = parsePreviewImages(doc, detailLink.href);
                        const actors = parseActorsFromDoc(doc);
                        PREVIEW_CACHE[videoCode] = { status: 'loaded', imgList, actors };
                        resolve();
                    },
                    onerror: function() {
                        PREVIEW_CACHE[videoCode] = { status: 'error', imgList: [], actors: [], errorMsg: '请求失败' };
                        resolve();
                    },
                    ontimeout: function() {
                        PREVIEW_CACHE[videoCode] = { status: 'error', imgList: [], actors: [], errorMsg: '请求超时' };
                        resolve();
                    }
                });
            });
        });
    }

    // 添加预览图切换按钮
    function addPreviewToggle(container, itemEl, videoCode) {
        const toggleBtn = document.createElement('span');
        toggleBtn.className = 'preview-toggle-btn';
        toggleBtn.textContent = '🖼️ 预览图';
        
        // 按钮进入视口时预加载预览图（限制总预加载数防验证）
        const preloadObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    preloadObserver.unobserve(entry.target);
                    if (totalPreloadedCount >= MAX_PRELOAD_ITEMS) return;
                    totalPreloadedCount++;
                    preloadPreviewData(itemEl, videoCode);
                }
            });
        }, { rootMargin: '100px' });
        preloadObserver.observe(toggleBtn);
        
        toggleBtn.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            fetchPreviewImages(itemEl, videoCode);
        };
        container.appendChild(toggleBtn);
    }

    // 添加磁力链切换按钮（列表页双标签版本）
    function addMagnetToggle(container, itemEl, videoCode) {
        const toggleBtn = document.createElement('span');
        toggleBtn.className = 'magnet-toggle-btn';
        toggleBtn.textContent = '🧲 磁力链';

        // [新增] 后台预加载 JAVBUS + JAVDB 磁力链 - 按钮进入视口时提前加载（限制总预加载数防验证）
        const needPreload = (!JAVBUS_CACHE[videoCode] || !JAVDB_CACHE[videoCode]);
        if (needPreload) {
            const preloadObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        preloadObserver.unobserve(entry.target);
                        if (totalPreloadedCount >= MAX_PRELOAD_ITEMS) return;
                        totalPreloadedCount++;
                        // 预加载 JAVBUS
                        if (!JAVBUS_CACHE[videoCode]) {
                            preloadJavbusData(videoCode);
                        }
                        // 预加载 JAVDB
                        if (!JAVDB_CACHE[videoCode]) {
                            preloadJavdbData(itemEl, videoCode);
                        }
                    }
                });
            }, { rootMargin: '100px' });
            preloadObserver.observe(toggleBtn);
        }

        toggleBtn.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            showDualMagnetModalForList(videoCode, itemEl);
        };
        container.appendChild(toggleBtn);
    }

    // 复制番号按钮
    function addCopyCodeButton(container, videoCode) {
        if (container.querySelector('.copy-code-btn')) return;
        const btn = document.createElement('span');
        btn.className = 'copy-code-btn';
        btn.textContent = '📋 复制番号';
        btn.title = '复制番号到剪贴板';
        btn.style.cssText = 'display: inline-flex; align-items: center; padding: 2px 6px; border-radius: 3px; font-size: 12px; cursor: pointer; background-color: #607D8B; color: white; white-space: nowrap; transition: all 0.2s;';
        btn.onmouseenter = () => { btn.style.backgroundColor = '#455A64'; };
        btn.onmouseleave = () => { btn.style.backgroundColor = '#607D8B'; };
        btn.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            navigator.clipboard.writeText(videoCode).then(() => {
                btn.textContent = '✅ 已复制';
                setTimeout(() => { btn.textContent = '📋 复制番号'; }, 1500);
            }).catch(() => {
                // fallback
                const ta = document.createElement('textarea');
                ta.value = videoCode;
                ta.style.position = 'fixed'; ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                btn.textContent = '✅ 已复制';
                setTimeout(() => { btn.textContent = '📋 复制番号'; }, 1500);
            });
        };
        container.appendChild(btn);
    }

    // 添加短评按钮
    function addShortReviewButton(container, itemEl, videoCode) {
        if (container.querySelector('.review-toggle-btn')) return;
        
        const btn = document.createElement('span');
        btn.className = 'review-toggle-btn';
        btn.textContent = '📝 短评';
        btn.title = '查看短评';
        btn.style.cssText = 'position: relative;';
        
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            fetchShortReviews(itemEl, videoCode);
        };
        
        container.appendChild(btn);
    }

    // 检测响应错误类型，返回具体原因描述
    function detectResponseError(response) {
        if (!response || !response.responseText) {
            if (response && response.status === 0) return '请求被阻止，请检查网络连接';
            return '未知错误';
        }
        const html = response.responseText;
        // 检测 Cloudflare 验证 → 自动暂停队列
        if (html.includes('cf-turnstile') || html.includes('challenge-form') ||
            html.includes('Checking your browser') || html.includes('Just a moment') ||
            html.includes('验证您是真人') || html.includes('正在检查您的浏览器') ||
            (response.status === 403 && html.includes('cloudflare'))) {
            handleCFDetection();
            return '触发了 Cloudflare 安全验证，请手动刷新 javdb.com 完成验证后重试';
        }
        // 检测需要登录（同时覆盖 redirect 跟随前后两种情况）
        // 情况1: followRedirects=false 时直接收到 302/301
        if (response.status === 302 || response.status === 301) {
            const headers = (response.responseHeaders || '').toLowerCase();
            if (headers.includes('location') && headers.includes('login')) {
                return '需要登录 JAVDB 账号才能查看此内容';
            }
        }
        // 情况2: followRedirects=true（默认）时 status 为 200，但 finalUrl 指向登录页
        const finalUrl = response.finalUrl || '';
        if (finalUrl && (finalUrl.includes('/sign_in') || finalUrl.includes('/login') ||
            finalUrl.includes('/phone') || finalUrl.includes('/verify'))) {
            return '需要登录 JAVDB 账号才能查看此内容';
        }
        // 情况3: 响应内容本身就是手机号/登录页面（某些站点直接返回 200 登录页）
        // 手机验证页面特征
        if ((html.includes('手机号') && html.includes('短信验证码')) ||
            (html.includes('手机号登录') || html.includes('手机验证'))) {
            return '当前需要登录 JAVDB 账号或完成手机验证才能查看此内容';
        }
        // 登录页面特征（包含登录表单）
        if (html.includes('action="/sign_in"') || html.includes('action="/login"') ||
            (html.includes('sign_in') && html.includes('password') && html.includes('submit'))) {
            return '需要登录 JAVDB 账号才能查看此内容';
        }
        // 检测 IP/请求被限制
        if (html.includes('请求太频繁') || html.includes('rate limit') || 
            html.includes('too many requests') || response.status === 429) {
            handleCFDetection();
            return '请求过于频繁，请稍后再试';
        }
        if (response.status === 403) return '请求被拒绝，可能触发了网站安全限制';
        if (response.status === 404) return '页面未找到（404）';
        if (response.status === 500) return '服务器内部错误（500）';
        if (response.status === 502 || response.status === 503) return '服务暂时不可用，请稍后重试';
        return null;
    }

    // 获取短评并弹窗（通过 JAVDB 短评 API）
    function fetchShortReviews(itemEl, videoCode) {
        const detailLink = getDetailLink(itemEl);
        if (!detailLink) return;

        showModal(`${videoCode} - 短评`, '<div class="preview-loading">正在获取短评...</div>');

        // 使用 JAVDB 短评完整列表页（/reviews/lastest 只返回3条，/reviews 返回全部）
        const baseUrl = detailLink.href.split(/[?#]/)[0].replace(/\/+$/, '');
        const reviewUrl = baseUrl + '/reviews';

        GM_xmlhttpRequest({
            method: 'GET',
            url: reviewUrl,
            timeout: 10000,
            onload: function(response) {
                if (!isModalVisible()) return;
                // 先检测错误
                const errorMsg = detectResponseError(response);
                if (errorMsg) {
                    // 404 时尝试回退到 外部API 获取短评
                    if (response.status === 404 && typeof jbApi !== 'undefined') {
                        const movieId = baseUrl.split('/').pop();
                        jbApi.getReviews(movieId, 1, 20).then(dataList => {
                            if (!isModalVisible()) return;
                            if (!dataList || dataList.length === 0) {
                                document.getElementById('emby-modal-body').innerHTML = '<div class="preview-loading">暂无短评</div>';
                                return;
                            }
                            let floorIndex = 1;
                            const panel = document.getElementById('emby-modal-body');
                            panel.innerHTML = '';
                            jbDisplayReviews(dataList, panel, () => floorIndex++);
                        }).catch(() => {
                            if (!isModalVisible()) return;
                            document.getElementById('emby-modal-body').innerHTML = `<div class="preview-loading" style="color:#e74c3c;">⚠️ ${errorMsg}</div>`;
                        });
                        return;
                    }
                    document.getElementById('emby-modal-body').innerHTML = `<div class="preview-loading" style="color:#e74c3c;">⚠️ ${errorMsg}</div>`;
                    return;
                }
                const parser = new DOMParser();
                const doc = parser.parseFromString(response.responseText, 'text/html');
                const reviews = parseReviewsFromDoc(doc);
                
                if (reviews.length === 0) {
                    document.getElementById('emby-modal-body').innerHTML = '<div class="preview-loading">暂无短评</div>';
                } else {
                    showReviewModal(videoCode, reviews);
                }
            },
            onerror: function() {
                if (!isModalVisible()) return;
                document.getElementById('emby-modal-body').innerHTML = '<div class="preview-loading" style="color:#e74c3c;">⚠️ 请求失败，请确认已登录 JAVDB</div>';
            },
            ontimeout: function() {
                if (!isModalVisible()) return;
                document.getElementById('emby-modal-body').innerHTML = '<div class="preview-loading" style="color:#e74c3c;">⚠️ 请求超时，请检查网络后重试</div>';
            }
        });
    }

    // 解析短评（基于 JAVDB API 返回的 HTML 结构）
    function parseReviewsFromDoc(doc) {
        const reviews = [];
        
        // 查找 dt.review-item 容器
        const items = doc.querySelectorAll('dt.review-item');
        
        items.forEach(item => {
            // 跳过"更多短评"提示行
            if (item.classList.contains('more')) return;
            
            const titleEl = item.querySelector('.review-title');
            if (!titleEl) return;
            
            // 提取用户名（.review-title 中的第一个文本节点，排除了子元素）
            let userName = '匿名用户';
            for (let child of titleEl.childNodes) {
                if (child.nodeType === 3) { // TEXT_NODE
                    const t = child.textContent.trim();
                    if (t.length > 0 && t.length < 30) {
                        userName = t;
                        break;
                    }
                }
            }
            
            // 提取日期
            const timeEl = titleEl.querySelector('.time');
            const date = timeEl ? timeEl.textContent.trim() : '';
            
            // 提取星级（计算亮星数量）
            const starsEl = titleEl.querySelector('.score-stars');
            let starStr = '';
            if (starsEl) {
                const goldStars = starsEl.querySelectorAll('i.icon-star:not(.gray)');
                const goldCount = goldStars.length;
                starStr = '★'.repeat(goldCount) + '☆'.repeat(5 - goldCount);
            }
            
            // 提取评论正文
            const contentEl = item.querySelector('.content p, .content');
            const text = contentEl ? contentEl.textContent.trim() : '';
            
            if (text && text.length > 0) {
                reviews.push({ 
                    user: userName, 
                    text: text,
                    star: starStr,
                    date: date
                });
            }
        });
        
        return reviews;
    }

    // 显示短评弹窗
    function showReviewModal(videoCode, reviews) {
        let html = `<div class="review-modal-list">`;
        reviews.forEach((review, index) => {
            const userEncoded = review.user.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const textEncoded = review.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const starDisplay = review.star || '';
            const dateDisplay = review.date ? `<span class="review-date">📅 ${review.date}</span>` : '';
            html += `
            <div class="review-item-card">
                <div class="review-user-label">👤 ${userEncoded} ${starDisplay ? '<span style="color:#f59e0b;">' + starDisplay + '</span>' : ''} ${dateDisplay}</div>
                <div class="review-text">${textEncoded}</div>
            </div>
            `;
        });
        html += '</div>';
        showModal(`${videoCode} - 短评 (${reviews.length}条)`, html);
    }

    // [新增] 后台预加载 JAVBUS 磁力链数据（不阻塞 UI）
    function preloadJavbusData(videoCode) {
        if (!videoCode) return;
        if (JAVBUS_CACHE[videoCode] && JAVBUS_CACHE[videoCode].status === 'loaded') return;
        
        JAVBUS_CACHE[videoCode] = { status: 'loading', data: null };
        
        const url = `https://www.javbus.com/${videoCode}`;
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            timeout: 20000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Referer': 'https://www.javbus.com/',
                'Cookie': 'existmag=all'
            },
            onload: function(response) {
                try {
                    if (response.status !== 200) {
                        JAVBUS_CACHE[videoCode] = { status: 'error', data: null };
                        return;
                    }
                    const html = response.responseText;
                    const gidMatch = html.match(/var\s+gid\s*=\s*(\d+)\s*;/);
                    const ucMatch = html.match(/var\s+uc\s*=\s*(\d+)\s*;/);
                    const imgMatch = html.match(/var\s+img\s*=\s*'([^']+)'\s*;/);
                    
                    if (gidMatch && ucMatch && imgMatch) {
                        const gid = gidMatch[1];
                        const uc = ucMatch[1];
                        const img = imgMatch[1];
                        const apiUrl = `https://www.javbus.com/ajax/uncledatoolsbyajax.php?gid=${gid}&lang=zh&img=${encodeURIComponent(img)}&uc=${uc}`;
                        
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: apiUrl,
                            timeout: 15000,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                                'Referer': url,
                                'Cookie': 'existmag=all',
                                'X-Requested-With': 'XMLHttpRequest'
                            },
                            onload: function(apiResponse) {
                                if (apiResponse.status !== 200) {
                                    // 失败时尝试直接从 HTML 解析
                                    JAVBUS_CACHE[videoCode] = { status: 'error', data: null, html: html };
                                    return;
                                }
                                const apiHtml = apiResponse.responseText;
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(`<table><tbody>${apiHtml}</tbody></table>`, 'text/html');
                                const rows = doc.querySelectorAll('tr');
                                const magnetData = [];
                                rows.forEach(row => {
                                    const cells = row.querySelectorAll('td');
                                    if (cells.length >= 3) {
                                        const nameLink = cells[0].querySelector('a');
                                        const sizeLink = cells[1].querySelector('a');
                                        const dateLink = cells[2].querySelector('a');
                                        if (nameLink && nameLink.href.startsWith('magnet:')) {
                                            const nameText = nameLink.textContent.trim();
                                            const nameHTML = cells[0].innerHTML;
                                            magnetData.push({
                                                name: nameText,
                                                size: sizeLink ? sizeLink.textContent.trim() : '',
                                                date: dateLink ? dateLink.textContent.trim() : '',
                                                magnetUrl: nameLink.href,
                                                hasSub: nameHTML.includes('字幕') || nameText.includes('字幕'),
                                                hasHD: nameHTML.includes('高清') || nameText.includes('高清')
                                            });
                                        }
                                    }
                                });
                                magnetData.sort((a, b) => (b.hasSub ? 1 : 0) - (a.hasSub ? 1 : 0));
                                JAVBUS_CACHE[videoCode] = { status: 'loaded', data: magnetData };
                            },
                            onerror: function() {
                                JAVBUS_CACHE[videoCode] = { status: 'error', data: null, html: html };
                            },
                            ontimeout: function() {
                                JAVBUS_CACHE[videoCode] = { status: 'error', data: null, html: html };
                            }
                        });
                    } else {
                        JAVBUS_CACHE[videoCode] = { status: 'error', data: null, html: html };
                    }
                } catch (e) {
                    JAVBUS_CACHE[videoCode] = { status: 'error', data: null };
                }
            },
            onerror: function() {
                JAVBUS_CACHE[videoCode] = { status: 'error', data: null };
            },
            ontimeout: function() {
                JAVBUS_CACHE[videoCode] = { status: 'error', data: null };
            }
        });
    }

    // [新增] 后台预加载 JAVDB 磁力链数据
    function preloadJavdbData(itemEl, videoCode) {
        if (!videoCode || !itemEl) return;
        if (JAVDB_CACHE[videoCode] && JAVDB_CACHE[videoCode].status === 'loaded') return;

        const detailLink = getDetailLink(itemEl);
        if (!detailLink) return;

        JAVDB_CACHE[videoCode] = { status: 'loading', data: null };

        GM_xmlhttpRequest({
            method: 'GET',
            url: detailLink.href,
            timeout: 15000,
            onload: function(response) {
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.responseText, 'text/html');
                    const magnetList = parseMagnetItems(doc);
                    JAVDB_CACHE[videoCode] = { status: 'loaded', data: magnetList };
                } catch (e) {
                    JAVDB_CACHE[videoCode] = { status: 'error', data: null };
                }
            },
            onerror: function() {
                JAVDB_CACHE[videoCode] = { status: 'error', data: null };
            },
            ontimeout: function() {
                JAVDB_CACHE[videoCode] = { status: 'error', data: null };
            }
        });
    }

    // 列表页双标签磁力弹窗（集成演员名单）
    function showDualMagnetModalForList(videoCode, itemEl) {
        // 创建双标签弹窗HTML，顶部预留演员栏位
        let html = `
        <div id="actor-header-magnet" style="margin-bottom: 10px;"></div>
        <div class="dual-magnet-modal" style="padding: 0;">
            <!-- 标签切换按钮 -->
            <div class="dual-magnet-tabs" style="display: flex; margin-bottom: 15px; border-bottom: 2px solid #f0f0f0;">
                <button id="javdb-tab-btn" class="dual-tab-btn active" style="flex: 1; padding: 12px; border: none; background: #fff; color: #333; font-weight: bold; cursor: pointer; border-bottom: 3px solid #ff6b6b;">
                    🔥 JAVDB 磁力链
                    <span id="javdb-count" style="background: #ff6b6b; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px; margin-left: 5px;">加载中...</span>
                </button>
                <button id="javbus-tab-btn" class="dual-tab-btn" style="flex: 1; padding: 12px; border: none; background: #f5f5f5; color: #666; font-weight: bold; cursor: pointer; border-bottom: 3px solid transparent;">
                    🧲 JAVBUS 磁力链
                    <span id="javbus-count" style="background: #999; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px; margin-left: 5px;">加载中...</span>
                </button>
            </div>

            <!-- JAVDB 内容区域 -->
            <div id="javdb-content" class="tab-content" style="display: block;">
                <div id="javdb-loading" class="preview-loading">正在获取 JAVDB 磁力链...</div>
                <div id="javdb-magnet-list" class="modal-magnet-list" style="display: none;"></div>
            </div>

            <!-- JAVBUS 内容区域 -->
            <div id="javbus-content" class="tab-content" style="display: none;">
                <div id="javbus-loading" class="preview-loading">正在获取 JAVBUS 磁力链...</div>
                <div id="javbus-magnet-list" class="modal-magnet-list" style="display: none;"></div>
            </div>
        </div>
        `;

        showModal(`${videoCode} - 磁力链接`, html);

        // 后台获取详情页并提取演员名单
        const detailLink = getDetailLink(itemEl);
        if (detailLink) {
            GM_xmlhttpRequest({
                method: 'GET',
                url: detailLink.href,
                timeout: 10000,
                onload: function(response) {
                    if (!isModalVisible()) return;
                    try {
                        const errorMsg = detectResponseError(response);
                        if (errorMsg) {
                            const actorHeader = document.getElementById('actor-header-magnet');
                            if (actorHeader) {
                                actorHeader.innerHTML = `<span style="color:#e74c3c;font-size:12px;">⚠️ ${errorMsg}</span>`;
                            }
                            return;
                        }
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(response.responseText, 'text/html');
                        const actors = parseActorsFromDoc(doc);
                        const actorHeader = document.getElementById('actor-header-magnet');
                        if (actorHeader && actors.length > 0) {
                            actorHeader.innerHTML = renderActorHeaderHTML(actors);
                        }
                    } catch(e) {
                        // 静默失败，不影响磁力链功能
                    }
                },
                onerror: function() {},
                ontimeout: function() {}
            });
        }

        // 绑定标签切换事件
        setTimeout(() => {
            const javdbTabBtn = document.getElementById('javdb-tab-btn');
            const javbusTabBtn = document.getElementById('javbus-tab-btn');
            const javdbContent = document.getElementById('javdb-content');
            const javbusContent = document.getElementById('javbus-content');

            if (javdbTabBtn) {
                javdbTabBtn.onclick = () => {
                    javdbTabBtn.style.cssText = 'flex: 1; padding: 12px; border: none; background: #fff; color: #333; font-weight: bold; cursor: pointer; border-bottom: 3px solid #ff6b6b;';
                    javbusTabBtn.style.cssText = 'flex: 1; padding: 12px; border: none; background: #f5f5f5; color: #666; font-weight: bold; cursor: pointer; border-bottom: 3px solid transparent;';
                    javdbContent.style.display = 'block';
                    javbusContent.style.display = 'none';
                };
            }

            if (javbusTabBtn) {
                javbusTabBtn.onclick = () => {
                    javbusTabBtn.style.cssText = 'flex: 1; padding: 12px; border: none; background: #fff; color: #333; font-weight: bold; cursor: pointer; border-bottom: 3px solid #667eea;';
                    javdbTabBtn.style.cssText = 'flex: 1; padding: 12px; border: none; background: #f5f5f5; color: #666; font-weight: bold; cursor: pointer; border-bottom: 3px solid transparent;';
                    javbusContent.style.display = 'block';
                    javdbContent.style.display = 'none';
                };
            }

            // 同时加载 JAVDB 和 JAVBUS 数据
            loadJavdbMagnetsForList(itemEl, videoCode);
            loadJavbusMagnetsForList(videoCode);
        }, 100);
    }

    // 加载 JAVDB 磁力链（列表页弹窗用）
    function loadJavdbMagnetsForList(itemEl, videoCode) {
        const detailLink = getDetailLink(itemEl);
        const loadingDiv = document.getElementById('javdb-loading');
        const listDiv = document.getElementById('javdb-magnet-list');
        const countSpan = document.getElementById('javdb-count');

        if (!detailLink) {
            if (loadingDiv) loadingDiv.textContent = '无法获取详情页链接';
            if (countSpan) {
                countSpan.textContent = '0';
                countSpan.style.background = '#999';
            }
            return;
        }

        // ====== [优先] 检查 JAVDB 缓存 ======
        const cached = JAVDB_CACHE[videoCode];
        if (cached && cached.status === 'loaded' && cached.data) {
            if (listDiv) {
                listDiv.innerHTML = renderMagnetListHTML(cached.data);
                listDiv.style.display = 'block';
                if (loadingDiv) loadingDiv.style.display = 'none';
            }
            if (countSpan) {
                countSpan.textContent = cached.data.length;
                countSpan.style.background = cached.data.length > 0 ? '#ff6b6b' : '#999';
            }
            return;
        }

        // 缓存未命中或正在加载，不等预加载，直接请求
        doJavdbDirectRequest(detailLink, loadingDiv, listDiv, countSpan, videoCode);
    }

    // [提取] JAVDB 直接请求逻辑
    function doJavdbDirectRequest(detailLink, loadingDiv, listDiv, countSpan, videoCode) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: detailLink.href,
            timeout: 15000,
            onload: function(response) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(response.responseText, 'text/html');
                const magnetList = parseMagnetItems(doc);

                // ====== 保存到 JAVDB 缓存 ======
                if (videoCode) {
                    JAVDB_CACHE[videoCode] = { status: 'loaded', data: magnetList };
                }

                if (listDiv) {
                    if (magnetList.length > 0) {
                        listDiv.innerHTML = renderMagnetListHTML(magnetList);
                        listDiv.style.display = 'block';
                        if (loadingDiv) loadingDiv.style.display = 'none';
                    } else {
                        if (loadingDiv) {
                            loadingDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">未找到磁力链接</div>';
                        }
                    }
                }

                if (countSpan) {
                    countSpan.textContent = magnetList.length;
                    countSpan.style.background = magnetList.length > 0 ? '#ff6b6b' : '#999';
                }
            },
            onerror: function() {
                if (loadingDiv) {
                    loadingDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #e74c3c;">获取失败，请检查网络</div>';
                }
                if (countSpan) {
                    countSpan.textContent = '错误';
                    countSpan.style.background = '#e74c3c';
                }
            },
            ontimeout: function() {
                if (loadingDiv) {
                    loadingDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #e74c3c;">请求超时</div>';
                }
                if (countSpan) {
                    countSpan.textContent = '超时';
                    countSpan.style.background = '#e74c3c';
                }
            }
        });
    }

    // 加载 JAVBUS 磁力链（列表页弹窗用）- 使用详情页相同的逻辑
    function loadJavbusMagnetsForList(videoCode) {
        const loadingDiv = document.getElementById('javbus-loading');
        const listDiv = document.getElementById('javbus-magnet-list');
        const countSpan = document.getElementById('javbus-count');

        if (listDiv) listDiv.dataset.loaded = 'loading';

        // ====== [优先] 检查缓存 ======
        const cached = JAVBUS_CACHE[videoCode];
        if (cached && cached.status === 'loaded' && cached.data) {
            if (listDiv) {
                listDiv.innerHTML = renderMagnetListHTML(cached.data);
                listDiv.style.display = 'block';
                listDiv.dataset.loaded = 'true';
                if (loadingDiv) loadingDiv.style.display = 'none';
            }
            if (countSpan) {
                countSpan.textContent = cached.data.length;
                countSpan.style.background = cached.data.length > 0 ? '#667eea' : '#999';
            }
            return;
        }
        
        // 缓存未命中或正在加载中，不等预加载，直接请求
        doJavbusRequest(videoCode, loadingDiv, listDiv, countSpan);
    }

    // [提取] JAVBUS 实际请求逻辑
    function doJavbusRequest(videoCode, loadingDiv, listDiv, countSpan) {
        const url = `https://www.javbus.com/${videoCode}`;

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            timeout: 20000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Referer': 'https://www.javbus.com/',
                'Cookie': 'existmag=all'
            },
            onload: function(response) {
                try {
                    const html = response.responseText;

                    if (response.status !== 200) {
                        if (loadingDiv) {
                            loadingDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无数据</div>';
                        }
                        if (countSpan) {
                            countSpan.textContent = '0';
                            countSpan.style.background = '#999';
                        }
                        return;
                    }

                    // 使用详情页相同的正则提取变量
                    const gidMatch = html.match(/var\s+gid\s*=\s*(\d+)\s*;/);
                    const ucMatch = html.match(/var\s+uc\s*=\s*(\d+)\s*;/);
                    const imgMatch = html.match(/var\s+img\s*=\s*'([^']+)'\s*;/);

                    if (gidMatch && ucMatch && imgMatch) {
                        const gid = gidMatch[1];
                        const uc = ucMatch[1];
                        const img = imgMatch[1];

                        // 调用 API 获取磁力链
                        const apiUrl = `https://www.javbus.com/ajax/uncledatoolsbyajax.php?gid=${gid}&lang=zh&img=${encodeURIComponent(img)}&uc=${uc}`;

                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: apiUrl,
                            timeout: 15000,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                                'Referer': url,
                                'Cookie': 'existmag=all',
                                'X-Requested-With': 'XMLHttpRequest'
                            },
                            onload: function(apiResponse) {
                                if (apiResponse.status !== 200) {
                                    fallbackLoadJavbusFromHTML(html, loadingDiv, listDiv, countSpan, videoCode);
                                    return;
                                }

                                const apiHtml = apiResponse.responseText;

                                // 使用详情页相同的解析方式：用 table 包装
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(`<table><tbody>${apiHtml}</tbody></table>`, 'text/html');
                                const rows = doc.querySelectorAll('tr');

                                const magnetData = [];
                                rows.forEach(row => {
                                    const cells = row.querySelectorAll('td');
                                    if (cells.length >= 3) {
                                        const nameCell = cells[0];
                                        const sizeCell = cells[1];
                                        const dateCell = cells[2];

                                        const nameLink = nameCell.querySelector('a');
                                        const sizeLink = sizeCell.querySelector('a');
                                        const dateLink = dateCell.querySelector('a');

                                        if (nameLink && nameLink.href.startsWith('magnet:')) {
                                            const nameText = nameLink.textContent.trim();
                                            const sizeText = sizeLink ? sizeLink.textContent.trim() : '';
                                            const dateText = dateLink ? dateLink.textContent.trim() : '';

                                            // 从 nameCell 的 HTML 中提取标签
                                            const nameHTML = nameCell.innerHTML;
                                            const hasHD = nameHTML.includes('高清') || nameText.includes('高清');
                                            const hasSub = nameHTML.includes('字幕') || nameText.includes('字幕');

                                            magnetData.push({
                                                name: nameText,
                                                size: sizeText,
                                                date: dateText,
                                                magnetUrl: nameLink.href,
                                                hasSub: hasSub,
                                                hasHD: hasHD
                                            });
                                        }
                                    }
                                });

                                // 排序：有字幕的排在前面
                                magnetData.sort((a, b) => {
                                    if (a.hasSub && !b.hasSub) return -1;
                                    if (!a.hasSub && b.hasSub) return 1;
                                    return 0;
                                });

                                // ====== 保存到缓存 ======
                                JAVBUS_CACHE[videoCode] = { status: 'loaded', data: magnetData };

                                if (listDiv) {
                                    if (magnetData.length > 0) {
                                        listDiv.innerHTML = renderMagnetListHTML(magnetData);
                                        listDiv.style.display = 'block';
                                        listDiv.dataset.loaded = 'true';
                                        if (loadingDiv) loadingDiv.style.display = 'none';
                                    } else {
                                        if (loadingDiv) {
                                            loadingDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">未找到磁力链接</div>';
                                        }
                                    }
                                }

                                if (countSpan) {
                                    countSpan.textContent = magnetData.length;
                                    countSpan.style.background = magnetData.length > 0 ? '#667eea' : '#999';
                                }
                            },
                            onerror: function() {
                                fallbackLoadJavbusFromHTML(html, loadingDiv, listDiv, countSpan, videoCode);
                            },
                            ontimeout: function() {
                                fallbackLoadJavbusFromHTML(html, loadingDiv, listDiv, countSpan, videoCode);
                            }
                        });
                    } else {
                        // 尝试直接从 HTML 解析
                        fallbackLoadJavbusFromHTML(html, loadingDiv, listDiv, countSpan, videoCode);
                    }
                } catch (error) {
                    console.error('加载 JAVBUS 磁力链失败:', error);
                    if (loadingDiv) {
                        loadingDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无数据</div>';
                    }
                }
            },
            onerror: function() {
                if (loadingDiv) {
                    loadingDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无数据</div>';
                }
                if (countSpan) {
                    countSpan.textContent = '0';
                    countSpan.style.background = '#999';
                }
            },
            ontimeout: function() {
                if (loadingDiv) {
                    loadingDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无数据</div>';
                }
                if (countSpan) {
                    countSpan.textContent = '0';
                    countSpan.style.background = '#999';
                }
            }
        });
    }

    // 回退：从 HTML 解析 JAVBUS 磁力链
    function fallbackLoadJavbusFromHTML(html, loadingDiv, listDiv, countSpan, videoCode) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const magnetLinks = doc.querySelectorAll('a[href^="magnet:"]');

            const magnetData = [];
            magnetLinks.forEach((link, index) => {
                const magnetUrl = link.href;
                const name = link.textContent.trim() || `磁力链接 ${index + 1}`;
                const row = link.closest('tr');

                let size = '';
                let date = '';
                let hasSub = false;
                let hasHD = false;

                if (row) {
                    const tds = row.querySelectorAll('td');
                    if (tds.length >= 2) size = tds[1]?.textContent.trim() || '';
                    if (tds.length >= 3) date = tds[2]?.textContent.trim() || '';

                    hasSub = row.textContent.includes('字幕') || row.textContent.includes('Sub');
                    hasHD = row.textContent.includes('高清') || row.textContent.includes('HD');
                }

                magnetData.push({ name, magnetUrl, size, date, hasSub, hasHD });
            });

            magnetData.sort((a, b) => (b.hasSub ? 1 : 0) - (a.hasSub ? 1 : 0));

            // ====== 保存到缓存 ======
            if (videoCode) {
                JAVBUS_CACHE[videoCode] = { status: 'loaded', data: magnetData };
            }

            if (listDiv) {
                if (magnetData.length > 0) {
                    listDiv.innerHTML = renderMagnetListHTML(magnetData);
                    listDiv.style.display = 'block';
                    listDiv.dataset.loaded = 'true';
                    if (loadingDiv) loadingDiv.style.display = 'none';
                } else {
                    if (loadingDiv) {
                        loadingDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">未找到磁力链接</div>';
                    }
                }
            }

            if (countSpan) {
                countSpan.textContent = magnetData.length;
                countSpan.style.background = magnetData.length > 0 ? '#667eea' : '#999';
            }
        } catch (error) {
            console.error('回退解析 JAVBUS 失败:', error);
            if (loadingDiv) {
                loadingDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无数据</div>';
            }
        }
    }

    // 渲染磁力链列表 HTML
    // 标签背景色映射
    const TAG_COLORS = {
        'is-success': { bg: '#2ecc71', text: 'white' },
        'is-info': { bg: '#3498db', text: 'white' },
        'is-warning': { bg: '#ffdd57', text: 'rgba(0,0,0,0.7)' },
        'is-primary': { bg: '#00d1b2', text: 'white' }
    };

    function renderMagnetListHTML(magnetList) {
        if (!magnetList || magnetList.length === 0) {
            return '<div style="text-align: center; padding: 20px; color: #999;">未找到磁力链接</div>';
        }

        let html = '';
        magnetList.forEach(m => {
            let tagsHtml = '';
            
            // 优先使用 tags 数组（来自 parseMagnetItems 的丰富标签）
            if (m.tags && m.tags.length > 0) {
                tagsHtml = m.tags.map(t => {
                    const colorKey = t.className.split(' ').find(c => TAG_COLORS[c]) || '';
                    const colors = TAG_COLORS[colorKey] || { bg: '#666', text: 'white' };
                    return `<span style="background: ${colors.bg}; color: ${colors.text}; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 5px;">${t.text}</span>`;
                }).join('');
            } else {
                // 后备：使用布尔字段
                if (m.hasSub) tagsHtml += '<span class="modal-tag is-success" style="background: #2ecc71; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 5px;">字幕</span>';
                if (m.hasHD) tagsHtml += '<span class="modal-tag is-info" style="background: #3498db; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 5px;">高清</span>';
            }

            // 兼容 meta 字段（parseMagnetItems 的合并格式）以及 size/date 字段（JAVBUS 的分立格式）
            const metaText = [m.size, m.date].filter(Boolean).join(' | ') || m.meta || '';

            html += `
                <div class="modal-magnet-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #f0f0f0; background: #fafafa; margin-bottom: 8px; border-radius: 6px;">
                    <div class="modal-magnet-info" style="flex: 1; min-width: 0;">
                        <div class="modal-magnet-name" title="${m.name}" style="font-weight: 500; margin-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.name}</div>
                        <div class="modal-magnet-meta" style="font-size: 12px; color: #666; margin-bottom: 6px;">${metaText}</div>
                        <div class="modal-magnet-tags">${tagsHtml}</div>
                    </div>
                    <div class="modal-magnet-btns" style="margin-left: 10px;">
                        <button class="modal-btn modal-btn-copy" onclick="const btn=this; navigator.clipboard.writeText('${m.magnetUrl}').then(() => { const old=btn.textContent; btn.textContent='已复制'; btn.style.background='#2e7d32'; setTimeout(()=>{btn.textContent=old; btn.style.background='';}, 1000); })" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; transition: all 0.2s;">复制</button>
                        <button class="modal-btn modal-btn-dl" onclick="window.open('${m.magnetUrl}', '_blank')" style="padding: 8px 16px; background: #E91E63; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; transition: all 0.2s;">下载</button>
                    </div>
                </div>`;
        });

        return html;
    }
    
    // 检查磁力链是否可用
    function checkMagnetAvailability(toggleBtn, itemEl) {
        const detailLink = getDetailLink(itemEl);
        if (!detailLink) return;
            
        GM_xmlhttpRequest({
            method: 'GET',
            url: detailLink.href,
            timeout: 5000,
            onload: function(response) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(response.responseText, 'text/html');
                const magnetItems = doc.querySelectorAll('#magnets-content .item, #magnets-content tr, .magnet-links .item');
                    
                const badge = toggleBtn.querySelector('.badge');
                if (magnetItems.length > 0) {
                    // 有磁力链，显示数量
                    badge.textContent = magnetItems.length > 9 ? '9+' : magnetItems.length;
                    badge.classList.remove('no-magnet');
                } else {
                    // 无磁力链，显示"0"
                    badge.textContent = '0';
                    badge.classList.add('no-magnet');
                }
            },
            onerror: function() {
                // 请求失败，隐藏角标
                const badge = toggleBtn.querySelector('.badge');
                if (badge) badge.style.display = 'none';
            },
            ontimeout: function() {
                const badge = toggleBtn.querySelector('.badge');
                if (badge) badge.style.display = 'none';
            }
        });
    }
        
    // 预加载磁力链数据（后台静默加载 + 请求队列 + 只加载可见区域）
    function preloadMagnetLinks(toggleBtn, itemEl, videoCode, callback) {
        const detailLink = getDetailLink(itemEl);
        if (!detailLink) return;
        
        // 使用 IntersectionObserver 监听可见性
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // 元素可见时才预加载
                    observer.unobserve(entry.target); // 只加载一次
                    
                    // 将请求放入队列
                    queueRequest(() => {
                        return new Promise((resolve, reject) => {
                            GM_xmlhttpRequest({
                                method: 'GET',
                                url: detailLink.href,
                                timeout: 8000,
                                onload: function(response) {
                                    const parser = new DOMParser();
                                    const doc = parser.parseFromString(response.responseText, 'text/html');
                                    const magnetList = parseMagnetItems(doc);
                                        
                                    // 更新角标
                                    const badge = toggleBtn.querySelector('.badge');
                                    if (magnetList.length > 0) {
                                        badge.textContent = magnetList.length > 9 ? '9+' : magnetList.length;
                                        badge.classList.remove('no-magnet');
                                    } else {
                                        badge.textContent = '0';
                                        badge.classList.add('no-magnet');
                                    }
                                        
                                    // 回调缓存数据
                                    callback(magnetList);
                                    resolve();
                                },
                                onerror: function() {
                                    const badge = toggleBtn.querySelector('.badge');
                                    if (badge) badge.style.display = 'none';
                                    callback([]);
                                    resolve();
                                },
                                ontimeout: function() {
                                    const badge = toggleBtn.querySelector('.badge');
                                    if (badge) badge.style.display = 'none';
                                    callback([]);
                                    resolve();
                                }
                            });
                        });
                    });
                }
            });
        }, {
            rootMargin: '200px' // 提前200px开始加载
        });
        
        observer.observe(itemEl);
    }
        
    // 解析磁力链项（提取为独立函数）
    function parseMagnetItems(doc) {
        const magnetItems = doc.querySelectorAll('#magnets-content .item, #magnets-content tr, .magnet-links .item');
        let magnetList = [];
            
        magnetItems.forEach(item => {
            const linkEl = item.querySelector('a[href^="magnet:"]') || (item.tagName === 'A' && item.href.startsWith('magnet:') ? item : null);
            if (linkEl) {
                const magnetUrl = linkEl.href;
                let name = item.querySelector('.name')?.textContent.trim() || 
                           item.querySelector('.magnet-name')?.textContent.trim() ||
                           linkEl.title || 
                           item.textContent.trim().split('\n')[0];
                                        
                let meta = item.querySelector('.meta')?.textContent.trim() || 
                           item.querySelector('.size')?.textContent.trim() || 
                           item.querySelector('.date')?.textContent.trim() || '';
            
                // 提取有效标签（严格过滤）
                let tags = [];
                item.querySelectorAll('.tag').forEach(tag => {
                    const text = tag.textContent.trim();
                    // 白名单机制：只保留真正的资源属性标签
                    const validTags = ['字幕', '高清', '无码', '有码', '中文', '无修正'];
                    if (validTags.some(v => text.includes(v)) && !meta.includes(text)) {
                        let className = 'modal-tag';
                        if (tag.classList.contains('is-warning')) className += ' is-warning';
                        else if (tag.classList.contains('is-info')) className += ' is-info';
                        else if (tag.classList.contains('is-success')) className += ' is-success';
                        else if (tag.classList.contains('is-primary')) className += ' is-primary';
                        tags.push({ text, className });
                    }
                });
                                        
                // ====== 从 meta 中提取 size 和 date ======
                let size = '';
                let date = '';
                let hasHD = tags.some(t => t.text.includes('高清'));
                
                if (meta) {
                    // meta 可能包含 "7.54GB | 1個文件" 或 "7.54GB | 2026-05-12" 等格式
                    const metaParts = meta.split('|').map(s => s.trim());
                    metaParts.forEach(part => {
                        if (/\d+(\.\d+)?\s*(MB|GB|TB|KB|MiB|GiB)/i.test(part)) {
                            size = part;
                        } else if (/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/.test(part)) {
                            date = part;
                        }
                    });
                    
                    // 单值情况：meta 本身就是一个大小或日期
                    if (!size && !date) {
                        if (/\d+(\.\d+)?\s*(MB|GB|TB)/i.test(meta)) {
                            size = meta;
                        } else if (/^\d{4}[-\/]\d/.test(meta)) {
                            date = meta;
                        }
                    }
                }
                
                magnetList.push({
                    name,
                    meta,
                    magnetUrl,
                    tags,
                    size,
                    date,
                    hasHD,
                    hasSub: tags.some(t => t.text.includes('字幕'))
                });
            }
        });
            
        // 排序：有字幕的排在最前面
        magnetList.sort((a, b) => (b.hasSub ? 1 : 0) - (a.hasSub ? 1 : 0));
            
        return magnetList;
    }
        
    // 快速显示磁力链弹窗（使用缓存数据）
    function showMagnetModal(videoCode, magnetList) {
        let html = '<div class="modal-magnet-list">';
        magnetList.forEach(m => {
            let tagsHtml = m.tags.map(t => `<span class="${t.className}">${t.text}</span>`).join('');
            html += `
                <div class="modal-magnet-item">
                    <div class="modal-magnet-info">
                        <div class="modal-magnet-name" title="${m.name}">${m.name}</div>
                        <div class="modal-magnet-meta">${m.meta}</div>
                        <div class="modal-magnet-tags">${tagsHtml}</div>
                    </div>
                    <div class="modal-magnet-btns">
                        <button class="modal-btn modal-btn-copy" onclick="const btn=this; navigator.clipboard.writeText('${m.magnetUrl}').then(() => { const old=btn.textContent; btn.textContent='已复制'; btn.style.background='#2e7d32'; setTimeout(()=>{btn.textContent=old; btn.style.background='';}, 1000); })">复制</button>
                        <button class="modal-btn modal-btn-dl" onclick="window.open('${m.magnetUrl}', '_blank')">下载</button>
                    </div>
                </div>`;
        });
            
        if (magnetList.length === 0) {
            html += '<div class="preview-loading">未找到磁力链接，请确认是否需要登录查看</div>';
        }
        html += '</div>';
            
        showModal(`${videoCode} - 磁力链接`, html);
    }
    
    // 列表页搜索站点配置
    const SEARCH_SITES = [
        { name: '98堂', url: 'https://sehuatang.net/search.php?mod=forum&srchtxt={code}', format: 'query' },
        { name: 'BTSOW', url: 'https://btsow.pics/search/{code}', format: 'path' },
        { name: 'JAVLib', url: 'https://www.javlibrary.com/cn/vl_searchbyid.php?keyword={code}', format: 'query' },
        { name: 'JAVBUS', url: 'https://javbus.com/{code}', format: 'path' },
        { name: '草榴社区', url: 'https://www.google.com/search?q={code}%20site:t66y.com', format: 'query' },
        { name: '谷歌搜索', url: 'https://www.google.com/search?q={code}', format: 'query' }
    ];

    // 为列表页添加搜索按钮
    function addListPageSearchButtons(container, videoCode) {
        if (!videoCode) return;

        // 防止重复添加
        if (container.querySelector('.list-search-panel')) return;

        const searchPanel = document.createElement('div');
        searchPanel.className = 'list-search-panel';
        searchPanel.style.cssText = 'display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap; width: 100%;';

        const buttonColors = [
            { bg: '#dc3545', hover: '#c82333' },
            { bg: '#007bff', hover: '#0056b3' },
            { bg: '#28a745', hover: '#218838' },
            { bg: '#ffc107', hover: '#e0a800', text: '#000' },
            { bg: '#6f42c1', hover: '#5a32a3' },
            { bg: '#17a2b8', hover: '#138496' }
        ];

        SEARCH_SITES.forEach((site, index) => {
            const btn = document.createElement('button');
            btn.textContent = site.name;
            const color = buttonColors[index] || { bg: '#6c757d', hover: '#5a6268' };
            btn.style.cssText = `padding: 2px 6px; background-color: ${color.bg}; color: ${color.text || 'white'}; border: none; border-radius: 3px; cursor: pointer; font-size: clamp(9px, 1.1vw, 11px); font-weight: 500; transition: all 0.2s; white-space: nowrap;`;

            btn.addEventListener('mouseenter', function() { this.style.backgroundColor = color.hover; });
            btn.addEventListener('mouseleave', function() { this.style.backgroundColor = color.bg; });
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const url = site.format === 'path' ? site.url.replace('{code}', videoCode) : site.url.replace('{code}', encodeURIComponent(videoCode));
                window.open(url, '_blank');
            });
            searchPanel.appendChild(btn);
        });

        container.appendChild(searchPanel);
    }

    // 获取磁力链并弹窗
    function fetchMagnetLinks(itemEl, videoCode) {
        const detailLink = getDetailLink(itemEl);
        if (!detailLink) return;

        showModal(`${videoCode} - 磁力链接`, '<div class="preview-loading">正在获取磁力链...</div>');

        GM_xmlhttpRequest({
            method: 'GET',
            url: detailLink.href,
            onload: function(response) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(response.responseText, 'text/html');
                
                // 更加全面的选择器适配
                const magnetItems = doc.querySelectorAll('#magnets-content .item, #magnets-content tr, .magnet-links .item');
                let magnetList = [];
                
                magnetItems.forEach(item => {
                    const linkEl = item.querySelector('a[href^="magnet:"]') || (item.tagName === 'A' && item.href.startsWith('magnet:') ? item : null);
                    if (linkEl) {
                        const magnetUrl = linkEl.href;
                        let name = item.querySelector('.name')?.textContent.trim() || 
                                   item.querySelector('.magnet-name')?.textContent.trim() ||
                                   linkEl.title || 
                                   item.textContent.trim().split('\n')[0];
                                        
                        let meta = item.querySelector('.meta')?.textContent.trim() || 
                                   item.querySelector('.size')?.textContent.trim() || 
                                   item.querySelector('.date')?.textContent.trim() || '';
                
                        // 提取有效标签（严格过滤）
                        let tags = [];
                        // 方法1：查找.tag类的元素（JavDB格式）
                        item.querySelectorAll('.tag').forEach(tag => {
                            const text = tag.textContent.trim();
                            const validTags = ['字幕', '高清', '无码', '有码', '中文', '无修正'];
                            if (validTags.some(v => text.includes(v)) && !meta.includes(text)) {
                                let className = 'modal-tag';
                                if (tag.classList.contains('is-warning')) className += ' is-warning';
                                else if (tag.classList.contains('is-info')) className += ' is-info';
                                else if (tag.classList.contains('is-success')) className += ' is-success';
                                else if (tag.classList.contains('is-primary')) className += ' is-primary';
                                tags.push({ text, className });
                            }
                        });
                        
                        // 方法2：查找有title属性包含"包含"或"磁力"的元素（JavBus格式）
                        if (tags.length === 0) {
                            item.querySelectorAll('[title*="包含"], [title*="磁力"]').forEach(tag => {
                                const text = tag.textContent.trim();
                                const validTags = ['字幕', '高清', '无码', '有码', '中文', '无修正'];
                                if (validTags.some(v => text.includes(v)) && !meta.includes(text)) {
                                    let className = 'modal-tag is-primary'; // JavBus标签使用绿色
                                    tags.push({ text, className });
                                }
                            });
                        }
                                        
                        magnetList.push({
                            name,
                            meta,
                            magnetUrl,
                            tags,
                            hasSub: tags.some(t => t.text.includes('字幕'))
                        });
                    }
                });
                
                // 排序：有字幕的排在最前面
                magnetList.sort((a, b) => (b.hasSub ? 1 : 0) - (a.hasSub ? 1 : 0));
                
                let html = '<div class="modal-magnet-list">';
                magnetList.forEach(m => {
                    let tagsHtml = m.tags.map(t => `<span class="${t.className}">${t.text}</span>`).join('');
                    html += `
                        <div class="modal-magnet-item">
                            <div class="modal-magnet-info">
                                <div class="modal-magnet-name" title="${m.name}">${m.name}</div>
                                <div class="modal-magnet-meta">${m.meta}</div>
                                <div class="modal-magnet-tags">${tagsHtml}</div>
                            </div>
                            <div class="modal-magnet-btns">
                                <button class="modal-btn modal-btn-copy" onclick="const btn=this; navigator.clipboard.writeText('${m.magnetUrl}').then(() => { const old=btn.textContent; btn.textContent='已复制'; btn.style.background='#2e7d32'; setTimeout(()=>{btn.textContent=old; btn.style.background='';}, 1000); })">复制</button>
                            </div>
                        </div>`;
                });
                
                if (magnetList.length === 0) {
                    html += '<div class="preview-loading">未找到磁力链接，请确认是否需要登录查看</div>';
                }
                html += '</div>';
                document.getElementById('emby-modal-body').innerHTML = html;
            }
        });
    }

    // 获取预览图并弹窗（先查缓存，再回退到请求；详情页直接从 DOM 提取）
    function fetchPreviewImages(itemEl, videoCode) {
        showModal(`${videoCode} - 预览图`, '<div class="preview-loading">正在加载预览图...</div>');

        // 如果已经在详情页，直接从当前 DOM 提取
        if (window.location.pathname.startsWith('/v/')) {
            const imgList = parsePreviewImages(document, window.location.href);
            const actors = parseActorsFromDoc(document);
            if (!isModalVisible()) return;
            if (imgList.length === 0) {
                const actorHeader = renderActorHeaderHTML(actors);
                document.getElementById('emby-modal-body').innerHTML = (actorHeader || '') + '<div class="preview-loading">未找到预览图</div>';
            } else {
                showPreviewModal(videoCode, imgList, actors);
            }
            // 也写入缓存
            PREVIEW_CACHE[videoCode] = { status: 'loaded', imgList, actors };
            return;
        }

        // 检查缓存
        const cached = PREVIEW_CACHE[videoCode];
        if (cached) {
            if (cached.status === 'loaded') {
                if (!isModalVisible()) return;
                if (cached.imgList && cached.imgList.length > 0) {
                    showPreviewModal(videoCode, cached.imgList, cached.actors);
                } else {
                    const actorHeader = renderActorHeaderHTML(cached.actors);
                    document.getElementById('emby-modal-body').innerHTML = (actorHeader || '') + '<div class="preview-loading">未找到预览图</div>';
                }
                return;
            }
            if (cached.status === 'loading') {
                // 正在加载中，等待完成
                const pollInterval = setInterval(() => {
                    if (!isModalVisible()) { clearInterval(pollInterval); return; }
                    const cur = PREVIEW_CACHE[videoCode];
                    if (cur.status === 'loaded') {
                        clearInterval(pollInterval);
                        if (!isModalVisible()) return;
                        if (cur.imgList && cur.imgList.length > 0) {
                            showPreviewModal(videoCode, cur.imgList, cur.actors);
                        } else {
                            const actorHeader = renderActorHeaderHTML(cur.actors);
                            document.getElementById('emby-modal-body').innerHTML = (actorHeader || '') + '<div class="preview-loading">未找到预览图</div>';
                        }
                    } else if (cur.status === 'error') {
                        clearInterval(pollInterval);
                        if (!isModalVisible()) return;
                        document.getElementById('emby-modal-body').innerHTML = `<div class="preview-loading" style="color:#e74c3c;">⚠️ ${cur.errorMsg || '获取失败'}</div>`;
                    }
                }, 200);
                return;
            }
            if (cached.status === 'error') {
                // 之前失败，重新请求
            }
        }

        // 发起请求
        preloadPreviewData(itemEl, videoCode);
        
        // 轮询等待缓存
        const pollInterval = setInterval(() => {
            if (!isModalVisible()) { clearInterval(pollInterval); return; }
            const cur = PREVIEW_CACHE[videoCode];
            if (!cur) return;
            if (cur.status === 'loaded') {
                clearInterval(pollInterval);
                if (!isModalVisible()) return;
                if (cur.imgList && cur.imgList.length > 0) {
                    showPreviewModal(videoCode, cur.imgList, cur.actors);
                } else {
                    const actorHeader = renderActorHeaderHTML(cur.actors);
                    document.getElementById('emby-modal-body').innerHTML = (actorHeader || '') + '<div class="preview-loading">未找到预览图</div>';
                }
            } else if (cur.status === 'error') {
                clearInterval(pollInterval);
                if (!isModalVisible()) return;
                document.getElementById('emby-modal-body').innerHTML = `<div class="preview-loading" style="color:#e74c3c;">⚠️ ${cur.errorMsg || '获取失败'}</div>`;
            }
        }, 200);
    }
    
    // 预加载预览图（后台静默加载 + 请求队列 + 只加载可见区域）
    function preloadPreviewImages(itemEl, callback) {
        const detailLink = getDetailLink(itemEl);
        if (!detailLink) return;
        
        // 使用 IntersectionObserver 监听可见性
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // 元素可见时才预加载
                    observer.unobserve(entry.target); // 只加载一次
                    
                    // 将请求放入队列
                    queueRequest(() => {
                        return new Promise((resolve, reject) => {
                            GM_xmlhttpRequest({
                                method: 'GET',
                                url: detailLink.href,
                                timeout: 10000,
                                onload: function(response) {
                                    const parser = new DOMParser();
                                    const doc = parser.parseFromString(response.responseText, 'text/html');
                                    const imgList = parsePreviewImages(doc, detailLink.href);
                                    callback(imgList);
                                    resolve();
                                },
                                onerror: function() {
                                    callback([]);
                                    resolve();
                                },
                                ontimeout: function() {
                                    callback([]);
                                    resolve();
                                }
                            });
                        });
                    });
                }
            });
        }, {
            rootMargin: '200px' // 提前200px开始加载
        });
        
        observer.observe(itemEl);
    }
    
    // 从已解析的文档中提取完整演员名单（含性别标记）
    function parseActorsFromDoc(doc) {
        const actors = [];
        const panels = doc.querySelectorAll('.panel-block, .movie-panel-info .panel-block');
        for (let panel of panels) {
            const strong = panel.querySelector('strong');
            if (!strong) continue;
            const label = strong.textContent;
            
            // 检测面板类型：女性演员/男优
            let defaultGender = 'unknown';
            if (label.includes('演員') || label.includes('演员')) {
                defaultGender = 'female';
            } else if (label.includes('男優') || label.includes('男优')) {
                defaultGender = 'male';
            } else {
                continue; // 不相关面板跳过
            }
            
            const actorLinks = panel.querySelectorAll('a');
            actorLinks.forEach(link => {
                const text = link.textContent.trim();
                if (text) {
                    // 检测性别：检查链接本身的文本、链接的相邻元素、以及整个面板的内容
                    let gender = defaultGender;
                    
                    // 方法1：检查链接文本中的符号
                    if (text.match(/[\u2642\u2640♂♀]/)) {
                        if (text.includes('♂') || text.includes('\u2642')) gender = 'male';
                        if (text.includes('♀') || text.includes('\u2640')) gender = 'female';
                    } else {
                        // 方法2：检查链接的下一个兄弟节点（JAVDB 常用 <span>♂</span> 跟在 <a> 后面）
                        const next = link.nextElementSibling || link.nextSibling;
                        if (next) {
                            const nextText = next.textContent || '';
                            if (nextText.includes('♂') || nextText.includes('\u2642')) gender = 'male';
                            else if (nextText.includes('♀') || nextText.includes('\u2640')) gender = 'female';
                        }
                    }
                    
                    const cleanName = text.replace(/[♀♂\u2642\u2640]/g, '').trim();
                    if (cleanName.length > 0) {
                        const href = link.getAttribute('href');
                        const fullUrl = href ? (href.startsWith('http') ? href : new URL(href, 'https://javdb.com').href) : null;
                        actors.push({ name: cleanName, url: fullUrl, gender: gender });
                    }
                }
            });
            // 如果通过链接没找到，检查 .value 容器
            if (actorLinks.length === 0) {
                const value = panel.querySelector('.value');
                if (value) {
                    const text = value.textContent.trim();
                    if (text) {
                        // 从容器文本中检测性别符号
                        const hasMale = text.match(/[\u2642♂]/);
                        const hasFemale = text.match(/[\u2640♀]/);
                        let gender = defaultGender;
                        if (hasMale && !hasFemale) gender = 'male';
                        else if (hasFemale && !hasMale) gender = 'female';
                        actors.push({ name: text.replace(/[♀♂\u2642\u2640]/g, '').trim(), url: null, gender: gender });
                    }
                }
            }
            // 不 break，继续查找其他面板（女性+男性都收集）
        }
        return actors;
    }
    
    // 生成演员名单 HTML（已支持按性别区分颜色）
    function renderActorHeaderHTML(actors) {
        if (!actors || actors.length === 0) return '';
        let html = '<div class="actor-header-bar">';
        html += '<span class="actor-label">🌟 演员：</span>';
        actors.forEach(actor => {
            // 根据性别设置颜色：女性粉色、男性蓝色、未知灰色
            const genderClass = actor.gender === 'female' ? 'actor-female' : (actor.gender === 'male' ? 'actor-male' : 'actor-unknown');
            if (actor.url) {
                html += `<a href="${actor.url}" target="_blank" class="actor-link ${genderClass}">${actor.name}</a>`;
            } else {
                html += `<span class="actor-link ${genderClass}" style="cursor:default;">${actor.name}</span>`;
            }
        });
        html += '</div>';
        return html;
    }
    
    // 解析预览图（提取为独立函数）
    function parsePreviewImages(doc, baseUrl) {
        const sampleContainer = doc.querySelector('.tile-images, .sample-images');
        const imgList = [];

        if (sampleContainer) {
            // 优先提取 <a> 标签中的大图链接，避免重复抓取缩略图
            sampleContainer.querySelectorAll('a').forEach(el => {
                if (el.href && (el.href.match(/\.(jpg|jpeg|png|webp)$/i) || el.href.includes('img.php'))) {
                    let src = el.href;
                    if (src.startsWith('//')) src = 'https:' + src;
                    else if (src.startsWith('/')) src = new URL(src, baseUrl).href;
                    if (!imgList.includes(src)) {
                        imgList.push(src);
                    }
                }
            });
            
            // 如果没有找到，尝试直接提取 <img> 标签
            if (imgList.length === 0) {
                sampleContainer.querySelectorAll('img').forEach(img => {
                    let src = img.src || img.dataset.src;
                    if (src) {
                        if (src.startsWith('//')) src = 'https:' + src;
                        else if (src.startsWith('/')) src = new URL(src, baseUrl).href;
                        // 过滤掉明显的缩略图
                        if (!src.includes('thumb') && !src.includes('small') && !imgList.includes(src)) {
                            imgList.push(src);
                        }
                    }
                });
            }
        }
        
        return imgList;
    }
    
    // 快速显示预览图弹窗（使用缓存数据）
    function showPreviewModal(videoCode, imgList, actors) {
        initImageViewer();
        let html = '';
        // 集成演员名单到顶部
        if (actors && actors.length > 0) {
            html += renderActorHeaderHTML(actors);
        }
        html += '<div class="modal-images-grid">';
        imgList.forEach((src, index) => {
            // 使用数据属性存储图片信息，避免字符串转义问题
            html += `<img src="${src}" data-index="${index}" class="preview-image" style="cursor: pointer;" />`;
        });
        html += '</div>';
        showModal(`${videoCode} - 预览图 (${imgList.length}张)`, html);
        
        // 添加点击事件
        setTimeout(() => {
            document.querySelectorAll('.preview-image').forEach(img => {
                img.onclick = () => {
                    const index = parseInt(img.dataset.index);
                    window.openImageViewer(imgList, index);
                };
            });
        }, 100);
    }

    function renderExists(statusDiv, info, serverType = 'emby') {
        const label = serverType === 'emby' ? 'Emby已入库' : 'Jellyfin已入库';
        if (!statusDiv.isConnected) {
            const el = document.querySelector(`.emby-status[data-type="${serverType}"]`);
            if (!el) return; statusDiv = el;
        }
        statusDiv.className = 'emby-status exists';
        statusDiv.textContent = label;

        const servers = getServers();
        const currentServer = servers.find(s => s.name === info.serverName) || { url: info.serverUrl };
        const finalUrl = currentServer.url || info.serverUrl;
        const detailPath = serverType === 'emby'
            ? `/web/index.html#!/item?id=${info.itemId}&serverId=${info.serverId}`
            : `/web/index.html#!/details?id=${info.itemId}&serverId=${info.serverId}`;

        statusDiv.title = `点击打开${serverType === 'emby' ? 'EMBY' : 'Jellyfin'}\n服务器: ${info.serverName}`;
        statusDiv.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            window.open(`${finalUrl}${detailPath}`, '_blank');
        };

        // 添加提示文字（仅详情页）
        if (window.location.pathname.startsWith('/v/')) {
            const wrap = statusDiv.parentElement;
            if (wrap && !wrap.querySelector('.emby-status-hint')) {
                const hint = document.createElement('span');
                hint.className = 'emby-status-hint';
                hint.style.cssText = 'font-size: 11px; color: #999; margin-left: 4px; line-height: 1.4; white-space: nowrap;';
                hint.textContent = `ℹ️ 点击标签可直接跳转到 ${serverType === 'emby' ? 'Emby' : 'Jellyfin'} 服务器中的媒体页面`;
                wrap.appendChild(hint);
            }
        }
    }

    function renderNotExists(statusDiv, serverType = 'emby') {
        const label = serverType === 'emby' ? 'Emby未入库' : 'Jellyfin未入库';
        if (!statusDiv.isConnected) {
            const el = document.querySelector(`.emby-status[data-type="${serverType}"]`);
            if (!el) return; statusDiv = el;
        }
        statusDiv.className = 'emby-status not-exists';
        statusDiv.textContent = label;
        statusDiv.title = '未在服务器中找到，点击打开设置';
        statusDiv.style.cursor = 'pointer';
        statusDiv.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            showSettingsDialog('tab-emby');
        };
    }

    // 新增：渲染状态消息（如未添加服务器、连接失败）
    function renderStatusMessage(statusDiv, message, type, serverType = 'emby') {
        const prefix = serverType === 'emby' ? 'Emby' : 'Jellyfin';
        // 简化长错误消息
        const shorten = (msg) => {
            if (msg.includes('未添加服务器')) return '未添加';
            if (msg.includes('地址错误') || msg.includes('无法连接') || msg.includes('连接超时') || msg.includes('连接失败') || msg.includes('所有服务器') || msg.includes('连接出错')) return '无法连接';
            if (msg.includes('返回数据异常')) return '数据异常';
            if (msg.includes('API Key')) return 'API Key 错误';
            if (msg.includes('配置不完整')) return '配置不完整';
            return msg;
        };
        const shortMsg = shorten(message);
        const label = shortMsg.startsWith(prefix) || shortMsg.startsWith('点击') ? shortMsg : prefix + shortMsg;
        // 确保 statusDiv 仍然在 DOM 中，如果已脱离则通过 data-type 重新定位
        const el = statusDiv.isConnected ? statusDiv : document.querySelector(`.emby-status[data-type="${serverType}"]`);
        if (!el) return;
        el.className = `emby-status ${type}`;
        el.textContent = label;
        el.title = label;
        el.style.cursor = 'pointer';
        el.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            showSettingsDialog('tab-emby');
        };
    }

    // 请求队列：限制并发 GM_xmlhttpRequest 数量，防止限流导致回调丢失
    const xhrQueue = [];
    let xhrRunning = 0;
    const MAX_CONCURRENT_XHR = 3;

    function enqueueXhr(fn) {
        xhrQueue.push(fn);
        processXhrQueue();
    }
    function processXhrQueue() {
        while (xhrRunning < MAX_CONCURRENT_XHR && xhrQueue.length > 0) {
            xhrRunning++;
            const fn = xhrQueue.shift();
            fn(() => { xhrRunning--; processXhrQueue(); });
        }
    }

    // 后台验证状态（实时同步关键）
    function verifyStatusBackground(statusDiv, videoCode, cachedExists, serverType = 'emby') {
        const servers = getServersByType(serverType);
        if (servers.length === 0) return;

        const firstServer = servers[0];

        if (!firstServer.url || !firstServer.apiKey) {
            renderStatusMessage(statusDiv, '服务器配置不完整', 'error', serverType);
            return;
        }

        const apiUrl = `${firstServer.url}/Items?searchTerm=${encodeURIComponent(videoCode)}&Recursive=true&IncludeItemTypes=Movie&Limit=1&api_key=${firstServer.apiKey}`;

        const isEmby = serverType === 'emby';
        const indexVar = isEmby ? LIBRARY_INDEX : JELLYFIN_LIBRARY_INDEX;
        const syncError = isEmby ? SYNC_ERROR : JELLYFIN_SYNC_ERROR;
        const indexKey = isEmby ? 'emby_library_index' : 'jellyfin_library_index';

        enqueueXhr(function(done) {
            GM_xmlhttpRequest({
            method: 'GET',
            url: apiUrl,
            timeout: 1500,
            onload: function(response) {
                if (response.status !== 200) {
                    let msg = `连接出错 (${response.status})`;
                    if (response.status === 401) msg = `${serverType === 'emby' ? 'Emby' : 'Jellyfin'} API Key 错误`;
                    firstServer.lastError = true;
                    firstServer.statusMsg = msg;
                    renderStatusMessage(statusDiv, msg, 'error', serverType);
                    done(); return;
                }
                // 连接成功，清除错误状态
                firstServer.lastError = false;
                firstServer.statusMsg = '';
                try {
                    const data = JSON.parse(response.responseText);
                    const nowExists = data.Items && data.Items.length > 0;

                    if (cachedExists && !nowExists) {
                        if (isEmby) {
                            delete LIBRARY_INDEX[videoCode.toUpperCase()];
                            GM_setValue(indexKey, JSON.stringify(LIBRARY_INDEX));
                        } else {
                            delete JELLYFIN_LIBRARY_INDEX[videoCode.toUpperCase()];
                            GM_setValue(indexKey, JSON.stringify(JELLYFIN_LIBRARY_INDEX));
                        }
                        renderNotExists(statusDiv, serverType);
                    } else if (!cachedExists && nowExists) {
                        const item = data.Items[0];
                        const newInfo = {
                            itemId: item.Id,
                            serverId: item.ServerId,
                            serverUrl: firstServer.url,
                            serverName: firstServer.name
                        };
                        if (isEmby) {
                            LIBRARY_INDEX[videoCode.toUpperCase()] = newInfo;
                            GM_setValue(indexKey, JSON.stringify(LIBRARY_INDEX));
                        } else {
                            JELLYFIN_LIBRARY_INDEX[videoCode.toUpperCase()] = newInfo;
                            GM_setValue(indexKey, JSON.stringify(JELLYFIN_LIBRARY_INDEX));
                        }
                        renderExists(statusDiv, newInfo, serverType);
                    }
                } catch (e) {
                    renderStatusMessage(statusDiv, `${serverType === 'emby' ? 'Emby' : 'Jellyfin'}返回数据异常`, 'error', serverType);
                }
                done();
            },
            onerror: function() {
                firstServer.lastError = true;
                firstServer.statusMsg = '地址错误或无法连接';
                renderStatusMessage(statusDiv, '地址错误或无法连接', 'error', serverType);
                done();
            },
            ontimeout: function() {
                firstServer.lastError = true;
                firstServer.statusMsg = '连接超时';
                renderStatusMessage(statusDiv, '连接超时', 'error', serverType);
                done();
            }
        });
        });
    }

    // 标记已处理的元素，避免重复处理（使用无连字符名称，避免 DOMStringMap 在某些浏览器中抛 SyntaxError）
    const PROCESSED_MARK = 'jb_processed';

    function initCheck() {
        if (document.hidden) return; // 页面隐藏时不执行
        console.log('JavdbBuddy: 执行页面扫描');

        // 应用列表页链接 target 设置
        applyListPageLinkTarget();
        // 应用弹窗方式打开详情页
        applyListPagePopup();
        // 应用所有链接 target 设置
        applyAllLinksTarget();
        // 初始化悬浮封面放大
        initHoverZoom();

        // 详情页
        if (window.location.pathname.startsWith('/v/')) {
            console.log('JavdbBuddy: 检测到详情页，开始查找番号元素');

            // 多种方式查找番号元素
            const blocks = document.querySelectorAll('.video-meta-panel .panel-block, .movie-panel-info .panel-block, .panel-block');
            console.log(`JavdbBuddy: 找到 ${blocks.length} 个 panel-block`);

            let foundCode = false;
            for (let block of blocks) {
                // 跳过已处理的块
                if (block.dataset[PROCESSED_MARK]) continue;

                const strongEl = block.querySelector('strong');
                console.log('JavdbBuddy: 检查 panel-block, strong 内容:', strongEl?.textContent);

                if (strongEl && (strongEl.textContent.includes('番號') || strongEl.textContent.includes('番号'))) {
                    const val = block.querySelector('.value');
                    console.log('JavdbBuddy: 找到番号块，value:', val?.textContent);

                    if (val) {
                        foundCode = true;
                        const videoCode = val.textContent.trim().replace(/[^\w\-]/g, '');

                        // 清理已存在的容器和提示（防止重复添加）
                        block.querySelectorAll('.emby-status-wrap').forEach(el => el.remove());
                        block.querySelectorAll('.emby-status-hint').forEach(el => el.remove());

                        const copyBtn = block.querySelector('.copy-to-clipboard');

                        // 创建一个 inline-flex 容器来水平排列两个标签，避免竖排
                        const statusWrap = document.createElement('span');
                        statusWrap.className = 'emby-status-wrap';
                        statusWrap.style.cssText = 'display: inline-flex !important; flex-direction: row !important; gap: 4px; align-items: center; margin-left: 4px; flex-wrap: wrap; vertical-align: middle; min-width: fit-content; flex-shrink: 0 !important;';
                        if (copyBtn) copyBtn.after(statusWrap);
                        else {
                            const val = block.querySelector('.value');
                            if (val) val.after(statusWrap);
                            else block.appendChild(statusWrap);
                        }
                        addStatusIndicator(statusWrap, videoCode, null, null, 'emby');
                        addStatusIndicator(statusWrap, videoCode, null, null, 'jellyfin');

                        // 为详情页番号块添加网站搜索按钮
                        // 先清理 block 后面可能残留的旧搜索面板（after 插入的是兄弟节点，querySelector 查不到）
                        let next = block.nextElementSibling;
                        while (next && next.classList.contains('detail-search-panel')) {
                            const toRemove = next;
                            next = next.nextElementSibling;
                            toRemove.remove();
                        }
                        if (!block.nextElementSibling || !block.nextElementSibling.classList.contains('detail-search-panel')) {
                            const detailSearchPanel = document.createElement('div');
                            detailSearchPanel.className = 'detail-search-panel';
                            detailSearchPanel.style.cssText = 'display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;';
                            const dColors = [
                                { bg: '#dc3545', hover: '#c82333', text: '#fff' },
                                { bg: '#007bff', hover: '#0056b3', text: '#fff' },
                                { bg: '#28a745', hover: '#218838', text: '#fff' },
                                { bg: '#ffc107', hover: '#e0a800', text: '#000' },
                                { bg: '#6f42c1', hover: '#5a32a3', text: '#fff' },
                                { bg: '#17a2b8', hover: '#138496', text: '#fff' }
                            ];
                            SEARCH_SITES.forEach((site, idx) => {
                                const btn = document.createElement('button');
                                btn.textContent = site.name;
                                const c = dColors[idx];
                                btn.style.cssText = `padding: 3px 8px; background-color: ${c.bg}; color: ${c.text}; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.2s; white-space: nowrap;`;
                                btn.addEventListener('mouseenter', function() { this.style.backgroundColor = c.hover; });
                                btn.addEventListener('mouseleave', function() { this.style.backgroundColor = c.bg; });
                                btn.addEventListener('click', (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const url = site.format === 'path' ? site.url.replace('{code}', videoCode) : site.url.replace('{code}', encodeURIComponent(videoCode));
                                    window.open(url, '_blank');
                                });
                                detailSearchPanel.appendChild(btn);
                            });
                            block.after(detailSearchPanel);
                        }

                        // 标记为已处理
                        block.dataset[PROCESSED_MARK] = '1';

                        break;
                    }
                }
            }

            if (!foundCode) {
                console.log('JavdbBuddy: 未能通过 panel-block 找到番号，尝试其他方法');
            }
        }

        // 列表页 - 只处理未处理过的项目（兼容 .grid-item 和 .movie-list .item）
        const listItems = document.querySelectorAll('.grid-item:not([data-' + PROCESSED_MARK + ']), .movie-list .item:not([data-' + PROCESSED_MARK + '])');
        console.log('JavdbBuddy: 找到新列表项数量:', listItems.length);

        listItems.forEach((item, index) => {
            console.log(`JavdbBuddy: 处理第 ${index + 1} 个新列表项`);
            const titleDiv = item.querySelector('.video-title');
            const tags = item.querySelector('.tags');
            // 尝试多个选择器找到日期元素（JavDB 新版用 .video-date，旧版用 .meta 或 .date）
            const dateEl = item.querySelector('.video-date') || item.querySelector('.date') || item.querySelector('.meta');
            if (titleDiv && tags) {
                const code = extractCodeFromTitle(titleDiv.textContent) || titleDiv.textContent.trim().split(/\s+/)[0];
                if (!code || code.length <= 2) {
                    item.dataset[PROCESSED_MARK] = '1'; // 标记为已处理（即使无有效code）
                    return;
                }

                // 1. 入库状态标签：用 emby-status-wrap 包裹日期和标签同行显示
                if (dateEl) {
                    const existingWrap = dateEl.closest('.emby-status-wrap');
                    if (existingWrap) {
                        // 已包裹：只刷新标签，不重建 wrapper（避免孤儿 API 回调）
                        existingWrap.querySelectorAll('.emby-status').forEach(el => el.remove());
                        addStatusIndicator(existingWrap, code, item, null, 'emby');
                        addStatusIndicator(existingWrap, code, item, null, 'jellyfin');
                    } else {
                        // 首次：创建 wrapper 包裹日期
                        const statusWrap = document.createElement('span');
                        statusWrap.className = 'emby-status-wrap';
                        dateEl.before(statusWrap);
                        statusWrap.appendChild(dateEl);
                        addStatusIndicator(statusWrap, code, item, null, 'emby');
                        addStatusIndicator(statusWrap, code, item, null, 'jellyfin');
                    }
                }

                // 2. 其他工具按钮容器
                let toolsContainer = item.querySelector('.emby-tools-container');
                if (!toolsContainer) {
                    toolsContainer = document.createElement('div');
                    toolsContainer.className = 'emby-tools-container';
                    toolsContainer.style.cssText = 'margin-top: 5px; width: 100%; display: block;';
                    tags.after(toolsContainer);
                }

                // 3. 第二行：短评、预览、磁力
                let toolsRow = toolsContainer.querySelector('.emby-tools-row');
                if (!toolsRow) {
                    toolsRow = document.createElement('div');
                    toolsRow.className = 'emby-tools-row';
                    toolsRow.style.cssText = 'display: flex; flex-wrap: wrap; align-items: center; gap: 3px; width: 100%; overflow: visible;';
                    toolsContainer.appendChild(toolsRow);

                    addCopyCodeButton(toolsRow, code);
                    addShortReviewButton(toolsRow, item, code);
                    addPreviewToggle(toolsRow, item, code);
                    addMagnetToggle(toolsRow, item, code);
                }

                // 4. 搜索按钮（另起一行）
                if (!toolsContainer.querySelector('.list-search-panel')) {
                    addListPageSearchButtons(toolsContainer, code);
                }

                // 标记为已处理
                item.dataset[PROCESSED_MARK] = '1';
            } else {
                console.log(`JavdbBuddy: 第 ${index + 1} 项缺少必要元素`, { titleDiv: !!titleDiv, tags: !!tags });
            }
        });
    }

    // 实时刷新入库状态标签的显示/隐藏
    function refreshStatusIndicators() {
        const showEmby = GM_getValue('jb_show_emby_status', true);
        const showJellyfin = GM_getValue('jb_show_jellyfin_status', true);

        // 关闭时直接移除对应标签
        if (!showEmby) {
            document.querySelectorAll('.emby-status[data-type="emby"]').forEach(el => el.remove());
        }
        if (!showJellyfin) {
            document.querySelectorAll('.emby-status[data-type="jellyfin"]').forEach(el => el.remove());
        }

        // 清理空的状态容器（先恢复被包裹的日期元素，避免一起被删）
        document.querySelectorAll('.emby-status-wrap').forEach(el => {
            if (!el.querySelector('.emby-status')) {
                const innerDateEl = el.querySelector('.video-date, .date, .meta');
                if (innerDateEl) el.before(innerDateEl);
                el.remove();
            }
        });
        document.querySelectorAll('.emby-status-inline').forEach(el => {
            if (!el.querySelector('.emby-status')) el.remove();
        });

        // 如果任一开关开启，清除已处理标记并重新扫描
        // 注意：不清除 data-jb_processed 会导致已处理元素被跳过，所以仍然需要清除
        // 但需要先清理详情页已存在的旧搜索面板，避免重复
        if (showEmby || showJellyfin) {
            // 清理详情页已存在的旧搜索面板（防止重新扫描时重复创建）
            document.querySelectorAll('.detail-search-panel').forEach(el => el.remove());
            document.querySelectorAll('[data-jb_processed]').forEach(el => {
                el.removeAttribute('data-jb_processed');
            });
            initCheck();
        }
    }

    // 启动
    const start = () => {
        try {
            console.log('JavdbBuddy: ========== 脚本启动 ==========');
            console.log('JavdbBuddy: 当前URL:', window.location.href);
            console.log('JavdbBuddy: 当前路径:', window.location.pathname);
            
            addBackToTopFloatButton(); // 添加返回顶部/底部浮动按钮
            initCheck();
            
            // 延迟执行在线观看面板，确保页面元素已加载
            console.log('JavdbBuddy: 准备添加在线观看面板...');
            // 立即执行一次
            setTimeout(() => {
                console.log('JavdbBuddy: 立即尝试添加在线观看面板');
                addOnlineWatchPanel();
            }, 0);
            setTimeout(() => {
                console.log('JavdbBuddy: 300ms - 尝试添加在线观看面板');
                addOnlineWatchPanel();
            }, 300);
            setTimeout(() => {
                console.log('JavdbBuddy: 1000ms - 尝试添加在线观看面板');
                addOnlineWatchPanel();
            }, 1000);
        } catch(e) {
            console.error('JavdbBuddy: 启动失败', e);
        }
    };

    // ========== 多网站搜索功能（直接移植自 JAV 添加跳转在线观看 脚本） ==========

    // 注入 CSS（原脚本样式，原样照搬）
 

    function addOnlineWatchPanel() {
        if (!window.location.pathname.startsWith('/v/')) return;
        if (document.querySelector('.jop-app')) return;

(o=>{if(typeof GM_addStyle=="function"){GM_addStyle(o);return}const e=document.createElement("style");e.textContent=o,document.head.append(e)})(' .jop-list{box-sizing:border-box;display:flex;flex-wrap:wrap;justify-content:flex-start;gap:10px;width:100%;height:100%;z-index:1;transition:right .2s ease-in-out;color:#000}.jop-button,.jop-button_def{position:relative;display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:3px 10px;border-radius:4px;font-weight:500;font-size:14px;border:1px solid #dcdfe6;color:#606266;cursor:pointer}.jop-button_def{margin:10px 0;width:100px}.jop-button:visited{color:#606266}.jop-button:hover{text-decoration:none;color:#409eff;border:1px solid #c6e2ff;background-color:#ecf5ff}.jop-button_label{position:absolute;font-size:10px;padding:4px;border-radius:4px;top:-13px;right:-10px;line-height:.75;color:#67c23a;border:1px solid #e1f3d8;background:#fff}.jop-button_green{color:#fff!important;background-color:#67c23a}.jop-button_green:hover{color:#fff!important;background-color:#95d475}.jop-button_red{color:#fff!important;background-color:#f56c6c}.jop-button_red:hover{color:#fff!important;background-color:#f89898}.jop-loading{display:inline-block;width:14px;height:14px;margin-right:10px;border:2px dashed #dcdfe6;border-top-color:transparent;border-radius:100%;animation:btnLoading infinite 1s linear}@keyframes btnLoading{0%{transform:rotate(0)}to{transform:rotate(360deg)}}.jop-tag{padding:3px 6px;color:#409eff!important;background:#ecf5ff;border:1px solid #d9ecff;border-radius:4px}.jop-setting{margin-top:20px}.jop-setting-list{display:flex;flex-wrap:wrap}.jop-setting-title{margin:10px 0 5px;font-weight:700}.jop-setting-item{display:flex;height:20px;align-items:center;margin-right:15px;-webkit-user-select:none;user-select:none;cursor:pointer}.db-panel .movie-panel-info div.panel-block{padding:5.5px 12px}.db-panel .jop-app{padding:15px 12px}.lib-panel .jop-app{padding:20px 30px;margin-top:10px}input[type=checkbox],input[type=radio]{margin:0 0 0 5px;cursor:pointer}.jop-tooltip-container{position:relative;display:inline-block}.jop-tooltip{position:absolute;bottom:100%;left:50%;transform:translate(-50%);background-color:#333;color:#fff;padding:5px 10px;border-radius:4px;font-size:12px;white-space:nowrap;z-index:1000}.jop-setting-label{cursor:pointer}.jop-checkbox{display:inline-flex;align-items:center;cursor:pointer;margin-right:15px;-webkit-user-select:none;user-select:none}.jop-checkbox-input{position:absolute;opacity:0;cursor:pointer}.jop-checkbox-custom{position:relative;display:inline-block;width:16px;height:16px;background-color:#fff;border:1px solid #dcdfe6;border-radius:2px;transition:all .3s}.jop-checkbox-input:checked+.jop-checkbox-custom{background-color:#409eff;border-color:#409eff}.jop-checkbox-input:checked+.jop-checkbox-custom:after{content:"";position:absolute;top:1px;left:4px;width:5px;height:10px;border:solid white;border-width:0 2px 2px 0;transform:rotate(45deg)}.jop-checkbox-label{margin-left:3px;font-size:14px;color:#606266}.jop-checkbox:hover .jop-checkbox-custom{border-color:#409eff} ');
 
(function (preact) {
  'use strict';
 
  var f$1 = 0;
  function u$1(e2, t2, n, o2, i2, u2) {
    t2 || (t2 = {});
    var a2, c2, p2 = t2;
    if ("ref" in p2) for (c2 in p2 = {}, t2) "ref" == c2 ? a2 = t2[c2] : p2[c2] = t2[c2];
    var l2 = { type: e2, props: p2, key: n, ref: a2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --f$1, __i: -1, __u: 0, __source: i2, __self: u2 };
    if ("function" == typeof e2 && (a2 = e2.defaultProps)) for (c2 in a2) void 0 === p2[c2] && (p2[c2] = a2[c2]);
    return preact.options.vnode && preact.options.vnode(l2), l2;
  }
  const libSites = [
    {
      name: "javdb",
      enable: true,
      identifier: "a[href*='javdb']",
      querys: {
        panelQueryStr: ".video-meta-panel>.columns.is-desktop .panel.movie-panel-info",
        codeQueryStr: `[data-clipboard-text]`
      },
      method() {
        const columnVideoCover = document.querySelector(".column-video-cover");
        if (columnVideoCover) {
          columnVideoCover.style.width = "60%";
        }
        const panel = document.querySelector(
          ".video-meta-panel>.columns.is-desktop>.column:not(.column-video-cover)"
        );
        panel == null ? void 0 : panel.classList.add("db-panel");
      }
    },
    {
      name: "javbus",
      enable: true,
      identifier: "a[href*='javbus']",
      querys: {
        panelQueryStr: ".movie>div.info",
        codeQueryStr: `span[style="color:#CC0000;"]`
      },
      method() {
      }
    },
    {
      name: "javlib",
      enable: true,
      identifier: "img[src*='logo-top']",
      querys: {
        panelQueryStr: "#video_jacket_info #video_info",
        codeQueryStr: `#video_id td.text`
      },
      method() {
        const panel = document.querySelector("#video_info");
        panel == null ? void 0 : panel.classList.add("lib-panel");
      }
    }
  ];
  var _GM_getValue = /* @__PURE__ */ (() => typeof GM_getValue != "undefined" ? GM_getValue : void 0)();
  var _GM_setValue = /* @__PURE__ */ (() => typeof GM_setValue != "undefined" ? GM_setValue : void 0)();
  var _GM_xmlhttpRequest = /* @__PURE__ */ (() => typeof GM_xmlhttpRequest != "undefined" ? GM_xmlhttpRequest : void 0)();
  const siteList = [
    {
      name: "FANZA 動画",
      hostname: "dmm.co.jp",
      url: "https://www.dmm.co.jp/digital/videoa/-/detail/=/cid={{code}}/",
      // url: "https://video.dmm.co.jp/av/list/?key={{code}}",
      fetchType: "get",
      codeFormater: (preCode) => {
        const [pre, num] = preCode.split("-");
        const padNum = num.padStart(5, "0");
        if (pre.toLowerCase().startsWith("start")) {
          return `1${pre.toLowerCase()}${padNum}`;
        }
        return `${pre}${padNum}`;
      },
      domQuery: {}
    },
    {
      name: "Jable",
      hostname: "jable.tv",
      url: "https://jable.tv/videos/{{code}}/",
      fetchType: "get",
      domQuery: {
        subQuery: ".info-header",
        leakQuery: ".info-header"
      }
    },
    {
      name: "MISSAV",
      hostname: "missav.ws",
      url: "https://missav.ws/{{code}}/",
      fetchType: "get",
      domQuery: {
        // 标签区的第一个一般是字幕标签
        subQuery: '.space-y-2 a.text-nord13[href="https://missav.ws/chinese-subtitle"]',
        // 有个「切換無碼」按钮，藏在分享按钮旁边……
        leakQuery: ".order-first div.rounded-md a[href]:last-child"
      }
    },
    {
      name: "123av",
      hostname: "123av.com",
      url: "https://123av.com/zh/search?keyword={{code}}",
      fetchType: "parser",
      strictParser: true,
      domQuery: {
        linkQuery: `.detail>a[href*='v/']`,
        titleQuery: `.detail>a[href*='v/']`
      }
    },
    {
      // 有可能搜出仨：leakage subtitle 4k
      name: "Supjav",
      hostname: "supjav.com",
      url: "https://supjav.com/zh/?s={{code}}",
      fetchType: "parser",
      domQuery: {
        linkQuery: `.posts.clearfix>.post>a.img[title]`,
        titleQuery: `h3>a[rel="bookmark"][itemprop="url"]`
      }
    },
    {
      name: "NETFLAV",
      hostname: "netflav5.com",
      url: "https://netflav5.com/search?type=title&keyword={{code}}",
      fetchType: "parser",
      domQuery: {
        linkQuery: ".grid_0_cell>a[href^='/video?']",
        titleQuery: ".grid_0_cell>a[href^='/video?'] .grid_0_title"
      }
    },
    {
      name: "Avgle",
      hostname: "avgle.com",
      url: "https://avgle.com/search/videos?search_query={{code}}&search_type=videos",
      fetchType: "parser",
      domQuery: {
        linkQuery: ".container>.row .row .well>a[href]",
        titleQuery: ".container>.row .row .well .video-title"
      }
    },
    {
      name: "JAVHHH",
      hostname: "javhhh.com",
      url: "https://javhhh.com/v/?wd={{code}}",
      fetchType: "parser",
      domQuery: {
        linkQuery: ".typelist>.i-container>a[href]",
        titleQuery: ".typelist>.i-container>a[href]"
      }
    },
    {
      name: "BestJP",
      hostname: "bestjavporn.com",
      url: "https://www3.bestjavporn.com/search/{{code}}",
      fetchType: "parser",
      domQuery: { linkQuery: "article.thumb-block>a", titleQuery: "article.thumb-block>a" }
    },
    {
      name: "JAVMENU",
      hostname: "javmenu.com",
      url: "https://javmenu.com/{{code}}",
      fetchType: "get",
      domQuery: {
        videoQuery: "a.nav-link[aria-controls='pills-0']"
      }
      // codeFormater: (preCode) => preCode.replace("-", ""),
    },
    {
      name: "Jav.Guru",
      hostname: "jav.guru",
      url: "https://jav.guru/?s={{code}}",
      fetchType: "parser",
      domQuery: { linkQuery: ".imgg>a[href]", titleQuery: ".inside-article>.grid1 a[title]" }
    },
    {
      name: "JAVMOST",
      hostname: "javmost.cx",
      url: "https://javmost.cx/search/{{code}}/",
      fetchType: "parser",
      domQuery: {
        linkQuery: ".card #myButton",
        titleQuery: ".card-block h4.card-title"
      }
    },
    {
      name: "HAYAV",
      hostname: "hayav.com",
      url: "https://hayav.com/video/{{code}}/",
      fetchType: "get",
      domQuery: {
        // subQuery: `.site__col>.entry-header>h1.entry-title`,
      }
    },
    {
      name: "AvJoy",
      hostname: "avjoy.me",
      url: "https://avjoy.me/search/videos/{{code}}",
      fetchType: "parser",
      domQuery: {
        titleQuery: `#wrapper .row .content-info span.content-title`,
        linkQuery: `#wrapper .row a[href^="/video/"]`
      }
    },
    {
      name: "JAVFC2",
      hostname: "javfc2.net",
      url: "https://javfc2.net/?s={{code}}",
      fetchType: "parser",
      domQuery: {
        linkQuery: "article.loop-video>a[href]",
        titleQuery: "article.loop-video .entry-header"
      }
    },
    {
      name: "baihuse",
      hostname: "paipancon.com",
      url: "https://paipancon.com/search/{{code}}",
      fetchType: "parser",
      domQuery: {
        linkQuery: "div.col>div.card>a[href]",
        // 然而这个不是 title，是图片，这个站居然 title 里不包含 code，反而图片包含
        titleQuery: "div.card img.card-img-top"
      }
    },
    {
      name: "GGJAV",
      hostname: "ggjav.com",
      url: "https://ggjav.com/main/search?string={{code}}",
      fetchType: "parser",
      domQuery: {
        listIndex: 1,
        // spaceCode: true,
        titleQuery: "div.columns.large-3.medium-6.small-12.item.float-left>div.item_title>a.gray_a",
        linkQuery: "div.columns.large-3.medium-6.small-12.item.float-left>div.item_title>a.gray_a"
      }
    },
    {
      name: "AV01",
      hostname: "www.av01.tv",
      url: "https://www.av01.tv/search/videos?search_query={{code}}",
      fetchType: "parser",
      domQuery: {
        linkQuery: "div.well>a[href^='/video/']",
        titleQuery: "div.well>a[href^='/video/']"
      }
    },
    {
      name: "18sex",
      hostname: "18sex.org",
      url: "https://www.18sex.org/cn/search/{{code}}/",
      fetchType: "parser",
      domQuery: { linkQuery: ".white_link[href]", titleQuery: ".white_link>.card-title" }
    },
    {
      name: "highporn",
      hostname: "highporn.net",
      url: "https://highporn.net/search/videos?search_query={{code}}",
      fetchType: "parser",
      domQuery: { linkQuery: ".well>a[href]", titleQuery: ".well>a[href]>span.video-title" }
    },
    {
      // 套了个 cf_clearance 的 cookie，不好搞
      name: "evojav",
      hostname: "evojav.pro",
      url: "https://evojav.pro/video/{{code}}/",
      fetchType: "get",
      domQuery: {}
    },
    {
      name: "18av",
      hostname: "18av.mm-cg.com",
      url: "https://18av.mm-cg.com/zh/fc_search/all/{{code}}/1.html",
      fetchType: "parser",
      domQuery: { linkQuery: ".posts h3>a[href]", titleQuery: ".posts h3>a[href]" }
    },
    {
      name: "javgo",
      hostname: "javgo.to",
      url: "https://javgo.to/zh/v/{{code}}",
      fetchType: "get",
      domQuery: {}
    },
    {
      name: "javhub",
      hostname: "javhub.net",
      url: "https://javhub.net/search/{{code}}",
      fetchType: "parser",
      domQuery: { linkQuery: "a.card-text[href*='play']", titleQuery: "a.card-text[href*='play']" }
    },
    {
      name: "JavBus",
      hostname: "javbus.com",
      url: "https://javbus.com/{{code}}",
      fetchType: "get",
      domQuery: {},
      codeFormater: (preCode) => preCode.startsWith("MIUM") ? `${SP_PREFIX}${preCode}` : preCode
    },
    {
      name: "JavDB",
      hostname: "javdb.com",
      url: "https://javdb.com/search?q={{code}}",
      fetchType: "parser",
      domQuery: {
        linkQuery: ".movie-list>.item:first-child>a",
        titleQuery: ".video-title"
      }
    },
    {
      name: "JAVLib",
      hostname: "javlibrary.com",
      url: "https://www.javlibrary.com/cn/vl_searchbyid.php?keyword={{code}}",
      fetchType: "false"
      // domQuery: {
      //   linkQuery: ".videothumblist .video[id]:first-child>a",
      //   titleQuery: ".videothumblist .video[id]:first-child>a>div.id",
      // },
    }
  ];
  const SP_PREFIX = "300";
  const gmGet = ({ url }) => {
    return new Promise((resolve, reject) => {
      _GM_xmlhttpRequest({
        method: "GET",
        url,
        onload: (response) => resolve(response),
        onerror: (error) => reject(error)
      });
    });
  };
  const isCaseInsensitiveEqual = (str1, str2) => {
    if (!str1 || !str2) return false;
    return str1.toLowerCase() === str2.toLowerCase();
  };
  const isErrorCode = (resCode) => {
    return [404, 403].includes(resCode);
  };
  const getCode = (libItem) => {
    const { codeQueryStr } = libItem.querys;
    const codeNode = document.querySelector(codeQueryStr);
    if (!codeNode) return "";
    const codeText = libItem.name === "javdb" ? codeNode.dataset.clipboardText : codeNode.innerText.replace("复制", "");
    if (codeText.includes("FC2")) return codeText.split("-")[1];
    if (codeText.startsWith(SP_PREFIX)) return codeText.substring(3);
    return codeText;
  };
  const regEnum = {
    subtitle: /(中文|字幕|subtitle)/,
    leakage: /(无码|無碼|泄漏|泄露|Uncensored)/
  };
  const tagsQuery = ({
    leakageText,
    subtitleText
  }) => {
    const hasLeakage = regEnum.leakage.test(leakageText);
    const hasSubtitle = regEnum.subtitle.test(subtitleText);
    const tags = [];
    if (hasLeakage) tags.push("无码");
    if (hasSubtitle) tags.push("字幕");
    return tags.join(" ");
  };
  var t, r, u, i, o = 0, f = [], c = preact.options, e = c.__b, a = c.__r, v = c.diffed, l = c.__c, m = c.unmount, s = c.__;
  function d(n, t2) {
    c.__h && c.__h(r, n, o || t2), o = 0;
    var u2 = r.__H || (r.__H = { __: [], __h: [] });
    return n >= u2.__.length && u2.__.push({}), u2.__[n];
  }
  function h(n) {
    return o = 1, p(D, n);
  }
  function p(n, u2, i2) {
    var o2 = d(t++, 2);
    if (o2.t = n, !o2.__c && (o2.__ = [D(void 0, u2), function(n2) {
      var t2 = o2.__N ? o2.__N[0] : o2.__[0], r2 = o2.t(t2, n2);
      t2 !== r2 && (o2.__N = [r2, o2.__[1]], o2.__c.setState({}));
    }], o2.__c = r, !r.u)) {
      var f2 = function(n2, t2, r2) {
        if (!o2.__c.__H) return true;
        var u3 = o2.__c.__H.__.filter(function(n3) {
          return !!n3.__c;
        });
        if (u3.every(function(n3) {
          return !n3.__N;
        })) return !c2 || c2.call(this, n2, t2, r2);
        var i3 = o2.__c.props !== n2;
        return u3.forEach(function(n3) {
          if (n3.__N) {
            var t3 = n3.__[0];
            n3.__ = n3.__N, n3.__N = void 0, t3 !== n3.__[0] && (i3 = true);
          }
        }), c2 && c2.call(this, n2, t2, r2) || i3;
      };
      r.u = true;
      var c2 = r.shouldComponentUpdate, e2 = r.componentWillUpdate;
      r.componentWillUpdate = function(n2, t2, r2) {
        if (this.__e) {
          var u3 = c2;
          c2 = void 0, f2(n2, t2, r2), c2 = u3;
        }
        e2 && e2.call(this, n2, t2, r2);
      }, r.shouldComponentUpdate = f2;
    }
    return o2.__N || o2.__;
  }
  function y(n, u2) {
    var i2 = d(t++, 3);
    !c.__s && C(i2.__H, u2) && (i2.__ = n, i2.i = u2, r.__H.__h.push(i2));
  }
  function j$1() {
    for (var n; n = f.shift(); ) if (n.__P && n.__H) try {
      n.__H.__h.forEach(z), n.__H.__h.forEach(B$1), n.__H.__h = [];
    } catch (t2) {
      n.__H.__h = [], c.__e(t2, n.__v);
    }
  }
  c.__b = function(n) {
    r = null, e && e(n);
  }, c.__ = function(n, t2) {
    n && t2.__k && t2.__k.__m && (n.__m = t2.__k.__m), s && s(n, t2);
  }, c.__r = function(n) {
    a && a(n), t = 0;
    var i2 = (r = n.__c).__H;
    i2 && (u === r ? (i2.__h = [], r.__h = [], i2.__.forEach(function(n2) {
      n2.__N && (n2.__ = n2.__N), n2.i = n2.__N = void 0;
    })) : (i2.__h.forEach(z), i2.__h.forEach(B$1), i2.__h = [], t = 0)), u = r;
  }, c.diffed = function(n) {
    v && v(n);
    var t2 = n.__c;
    t2 && t2.__H && (t2.__H.__h.length && (1 !== f.push(t2) && i === c.requestAnimationFrame || ((i = c.requestAnimationFrame) || w)(j$1)), t2.__H.__.forEach(function(n2) {
      n2.i && (n2.__H = n2.i), n2.i = void 0;
    })), u = r = null;
  }, c.__c = function(n, t2) {
    t2.some(function(n2) {
      try {
        n2.__h.forEach(z), n2.__h = n2.__h.filter(function(n3) {
          return !n3.__ || B$1(n3);
        });
      } catch (r2) {
        t2.some(function(n3) {
          n3.__h && (n3.__h = []);
        }), t2 = [], c.__e(r2, n2.__v);
      }
    }), l && l(n, t2);
  }, c.unmount = function(n) {
    m && m(n);
    var t2, r2 = n.__c;
    r2 && r2.__H && (r2.__H.__.forEach(function(n2) {
      try {
        z(n2);
      } catch (n3) {
        t2 = n3;
      }
    }), r2.__H = void 0, t2 && c.__e(t2, r2.__v));
  };
  var k = "function" == typeof requestAnimationFrame;
  function w(n) {
    var t2, r2 = function() {
      clearTimeout(u2), k && cancelAnimationFrame(t2), setTimeout(n);
    }, u2 = setTimeout(r2, 100);
    k && (t2 = requestAnimationFrame(r2));
  }
  function z(n) {
    var t2 = r, u2 = n.__c;
    "function" == typeof u2 && (n.__c = void 0, u2()), r = t2;
  }
  function B$1(n) {
    var t2 = r;
    n.__c = n.__(), r = t2;
  }
  function C(n, t2) {
    return !n || n.length !== t2.length || t2.some(function(t3, r2) {
      return t3 !== n[r2];
    });
  }
  function D(n, t2) {
    return "function" == typeof t2 ? t2(n) : t2;
  }
  function g(n, t2) {
    for (var e2 in t2) n[e2] = t2[e2];
    return n;
  }
  function E(n, t2) {
    for (var e2 in n) if ("__source" !== e2 && !(e2 in t2)) return true;
    for (var r2 in t2) if ("__source" !== r2 && n[r2] !== t2[r2]) return true;
    return false;
  }
  function N(n, t2) {
    this.props = n, this.context = t2;
  }
  function M(n, e2) {
    function r2(n2) {
      var t2 = this.props.ref, r3 = t2 == n2.ref;
      return !r3 && t2 && (t2.call ? t2(null) : t2.current = null), E(this.props, n2);
    }
    function u2(e3) {
      return this.shouldComponentUpdate = r2, preact.createElement(n, e3);
    }
    return u2.displayName = "Memo(" + (n.displayName || n.name) + ")", u2.prototype.isReactComponent = true, u2.__f = true, u2;
  }
  (N.prototype = new preact.Component()).isPureReactComponent = true, N.prototype.shouldComponentUpdate = function(n, t2) {
    return E(this.props, n) || E(this.state, t2);
  };
  var T = preact.options.__b;
  preact.options.__b = function(n) {
    n.type && n.type.__f && n.ref && (n.props.ref = n.ref, n.ref = null), T && T(n);
  };
  var F = preact.options.__e;
  preact.options.__e = function(n, t2, e2, r2) {
    if (n.then) {
      for (var u2, o2 = t2; o2 = o2.__; ) if ((u2 = o2.__c) && u2.__c) return null == t2.__e && (t2.__e = e2.__e, t2.__k = e2.__k), u2.__c(n, t2);
    }
    F(n, t2, e2, r2);
  };
  var U = preact.options.unmount;
  function V(n, t2, e2) {
    return n && (n.__c && n.__c.__H && (n.__c.__H.__.forEach(function(n2) {
      "function" == typeof n2.__c && n2.__c();
    }), n.__c.__H = null), null != (n = g({}, n)).__c && (n.__c.__P === e2 && (n.__c.__P = t2), n.__c = null), n.__k = n.__k && n.__k.map(function(n2) {
      return V(n2, t2, e2);
    })), n;
  }
  function W(n, t2, e2) {
    return n && e2 && (n.__v = null, n.__k = n.__k && n.__k.map(function(n2) {
      return W(n2, t2, e2);
    }), n.__c && n.__c.__P === t2 && (n.__e && e2.appendChild(n.__e), n.__c.__e = true, n.__c.__P = e2)), n;
  }
  function P() {
    this.__u = 0, this.o = null, this.__b = null;
  }
  function j(n) {
    var t2 = n.__.__c;
    return t2 && t2.__a && t2.__a(n);
  }
  function B() {
    this.i = null, this.l = null;
  }
  preact.options.unmount = function(n) {
    var t2 = n.__c;
    t2 && t2.__R && t2.__R(), t2 && 32 & n.__u && (n.type = null), U && U(n);
  }, (P.prototype = new preact.Component()).__c = function(n, t2) {
    var e2 = t2.__c, r2 = this;
    null == r2.o && (r2.o = []), r2.o.push(e2);
    var u2 = j(r2.__v), o2 = false, i2 = function() {
      o2 || (o2 = true, e2.__R = null, u2 ? u2(c2) : c2());
    };
    e2.__R = i2;
    var c2 = function() {
      if (!--r2.__u) {
        if (r2.state.__a) {
          var n2 = r2.state.__a;
          r2.__v.__k[0] = W(n2, n2.__c.__P, n2.__c.__O);
        }
        var t3;
        for (r2.setState({ __a: r2.__b = null }); t3 = r2.o.pop(); ) t3.forceUpdate();
      }
    };
    r2.__u++ || 32 & t2.__u || r2.setState({ __a: r2.__b = r2.__v.__k[0] }), n.then(i2, i2);
  }, P.prototype.componentWillUnmount = function() {
    this.o = [];
  }, P.prototype.render = function(n, e2) {
    if (this.__b) {
      if (this.__v.__k) {
        var r2 = document.createElement("div"), o2 = this.__v.__k[0].__c;
        this.__v.__k[0] = V(this.__b, r2, o2.__O = o2.__P);
      }
      this.__b = null;
    }
    var i2 = e2.__a && preact.createElement(preact.Fragment, null, n.fallback);
    return i2 && (i2.__u &= -33), [preact.createElement(preact.Fragment, null, e2.__a ? null : n.children), i2];
  };
  var H = function(n, t2, e2) {
    if (++e2[1] === e2[0] && n.l.delete(t2), n.props.revealOrder && ("t" !== n.props.revealOrder[0] || !n.l.size)) for (e2 = n.i; e2; ) {
      for (; e2.length > 3; ) e2.pop()();
      if (e2[1] < e2[0]) break;
      n.i = e2 = e2[2];
    }
  };
  (B.prototype = new preact.Component()).__a = function(n) {
    var t2 = this, e2 = j(t2.__v), r2 = t2.l.get(n);
    return r2[0]++, function(u2) {
      var o2 = function() {
        t2.props.revealOrder ? (r2.push(u2), H(t2, n, r2)) : u2();
      };
      e2 ? e2(o2) : o2();
    };
  }, B.prototype.render = function(n) {
    this.i = null, this.l = /* @__PURE__ */ new Map();
    var t2 = preact.toChildArray(n.children);
    n.revealOrder && "b" === n.revealOrder[0] && t2.reverse();
    for (var e2 = t2.length; e2--; ) this.l.set(t2[e2], this.i = [1, 0, this.i]);
    return n.children;
  }, B.prototype.componentDidUpdate = B.prototype.componentDidMount = function() {
    var n = this;
    this.l.forEach(function(t2, e2) {
      H(n, e2, t2);
    });
  };
  var q = "undefined" != typeof Symbol && Symbol.for && Symbol.for("react.element") || 60103, G = /^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/, J = /^on(Ani|Tra|Tou|BeforeInp|Compo)/, K = /[A-Z0-9]/g, Q = "undefined" != typeof document, X = function(n) {
    return ("undefined" != typeof Symbol && "symbol" == typeof Symbol() ? /fil|che|rad/ : /fil|che|ra/).test(n);
  };
  preact.Component.prototype.isReactComponent = {}, ["componentWillMount", "componentWillReceiveProps", "componentWillUpdate"].forEach(function(t2) {
    Object.defineProperty(preact.Component.prototype, t2, { configurable: true, get: function() {
      return this["UNSAFE_" + t2];
    }, set: function(n) {
      Object.defineProperty(this, t2, { configurable: true, writable: true, value: n });
    } });
  });
  var en = preact.options.event;
  function rn() {
  }
  function un() {
    return this.cancelBubble;
  }
  function on() {
    return this.defaultPrevented;
  }
  preact.options.event = function(n) {
    return en && (n = en(n)), n.persist = rn, n.isPropagationStopped = un, n.isDefaultPrevented = on, n.nativeEvent = n;
  };
  var ln = { enumerable: false, configurable: true, get: function() {
    return this.class;
  } }, fn = preact.options.vnode;
  preact.options.vnode = function(n) {
    "string" == typeof n.type && function(n2) {
      var t2 = n2.props, e2 = n2.type, u2 = {}, o2 = -1 === e2.indexOf("-");
      for (var i2 in t2) {
        var c2 = t2[i2];
        if (!("value" === i2 && "defaultValue" in t2 && null == c2 || Q && "children" === i2 && "noscript" === e2 || "class" === i2 || "className" === i2)) {
          var l2 = i2.toLowerCase();
          "defaultValue" === i2 && "value" in t2 && null == t2.value ? i2 = "value" : "download" === i2 && true === c2 ? c2 = "" : "translate" === l2 && "no" === c2 ? c2 = false : "o" === l2[0] && "n" === l2[1] ? "ondoubleclick" === l2 ? i2 = "ondblclick" : "onchange" !== l2 || "input" !== e2 && "textarea" !== e2 || X(t2.type) ? "onfocus" === l2 ? i2 = "onfocusin" : "onblur" === l2 ? i2 = "onfocusout" : J.test(i2) && (i2 = l2) : l2 = i2 = "oninput" : o2 && G.test(i2) ? i2 = i2.replace(K, "-$&").toLowerCase() : null === c2 && (c2 = void 0), "oninput" === l2 && u2[i2 = l2] && (i2 = "oninputCapture"), u2[i2] = c2;
        }
      }
      "select" == e2 && u2.multiple && Array.isArray(u2.value) && (u2.value = preact.toChildArray(t2.children).forEach(function(n3) {
        n3.props.selected = -1 != u2.value.indexOf(n3.props.value);
      })), "select" == e2 && null != u2.defaultValue && (u2.value = preact.toChildArray(t2.children).forEach(function(n3) {
        n3.props.selected = u2.multiple ? -1 != u2.defaultValue.indexOf(n3.props.value) : u2.defaultValue == n3.props.value;
      })), t2.class && !t2.className ? (u2.class = t2.class, Object.defineProperty(u2, "className", ln)) : (t2.className && !t2.class || t2.class && t2.className) && (u2.class = u2.className = t2.className), n2.props = u2;
    }(n), n.$$typeof = q, fn && fn(n);
  };
  var an = preact.options.__r;
  preact.options.__r = function(n) {
    an && an(n), n.__c;
  };
  var sn = preact.options.diffed;
  preact.options.diffed = function(n) {
    sn && sn(n);
    var t2 = n.props, e2 = n.__e;
    null != e2 && "textarea" === n.type && "value" in t2 && t2.value !== e2.value && (e2.value = null == t2.value ? "" : t2.value);
  };
  const Tooltip = ({ content, children }) => {
    const [isVisible, setIsVisible] = h(false);
    return /* @__PURE__ */ u$1(
      "div",
      {
        className: "jop-tooltip-container",
        onMouseEnter: () => setIsVisible(true),
        onMouseLeave: () => setIsVisible(false),
        children: [
          children,
          isVisible && content && /* @__PURE__ */ u$1("div", { className: "jop-tooltip", children: content })
        ]
      }
    );
  };
  const Checkbox = ({ label, value, tip, onChange }) => {
    const handleChange = (event) => {
      onChange(event.currentTarget.checked);
    };
    return /* @__PURE__ */ u$1("label", { className: "jop-checkbox", children: [
      /* @__PURE__ */ u$1(
        "input",
        {
          type: "checkbox",
          className: "jop-checkbox-input",
          checked: value,
          onChange: handleChange
        }
      ),
      /* @__PURE__ */ u$1("span", { className: "jop-checkbox-custom" }),
      /* @__PURE__ */ u$1(Tooltip, { content: tip || "", children: /* @__PURE__ */ u$1("span", { className: "jop-checkbox-label", children: label }) })
    ] });
  };
  const Setting = ({
    siteList: siteList2,
    setDisables,
    disables,
    multipleNavi,
    setMultipleNavi,
    hiddenError,
    setHiddenError
  }) => {
    const [showSetting, setShowSetting] = h(false);
    const hanleListChange = (item, isHidden) => {
      if (isHidden) {
        setDisables(disables.filter((disItem) => disItem !== item.name));
      } else {
        setDisables([...disables, item.name]);
      }
    };
    const handleNaviChange = (checked) => {
      setMultipleNavi(checked);
      _GM_setValue("multipleNavi", checked);
    };
    const handlehiddenErrorChange = (checked) => {
      setHiddenError(checked);
      _GM_setValue("hiddenError", checked);
    };
    return /* @__PURE__ */ u$1(preact.Fragment, { children: [
      !showSetting && /* @__PURE__ */ u$1("div", { className: "jop-button_def", onClick: () => setShowSetting(!showSetting), children: "设置" }),
      showSetting && /* @__PURE__ */ u$1(preact.Fragment, { children: [
        /* @__PURE__ */ u$1("div", { className: "jop-setting", children: [
          /* @__PURE__ */ u$1(Group, { title: "勾选默认展示", children: siteList2.map((item) => {
            const isHidden = disables.includes(item.name);
            return /* @__PURE__ */ u$1(
              Checkbox,
              {
                label: item.name,
                value: !isHidden,
                onChange: (checked) => hanleListChange(item, checked)
              }
            );
          }) }),
          /* @__PURE__ */ u$1(Group, { title: "其他设置", children: [
            /* @__PURE__ */ u$1(
              Checkbox,
              {
                label: "展示多个搜索结果",
                value: multipleNavi,
                tip: "一个站点内出现多条匹配结果时，打开后跳转搜索结果页",
                onChange: handleNaviChange
              }
            ),
            /* @__PURE__ */ u$1(
              Checkbox,
              {
                label: "隐藏失败结果",
                value: hiddenError,
                onChange: handlehiddenErrorChange
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ u$1(
          "div",
          {
            className: "jop-button_def",
            onClick: () => {
              setShowSetting(!showSetting);
            },
            children: "收起设置"
          }
        )
      ] })
    ] });
  };
  const Group = ({ title, children }) => {
    return /* @__PURE__ */ u$1(preact.Fragment, { children: [
      /* @__PURE__ */ u$1("h4", { className: "jop-setting-title", children: title }),
      /* @__PURE__ */ u$1("div", { className: "jop-setting-list", children })
    ] });
  };
  function videoPageParser(responseText, { subQuery, leakQuery, videoQuery }) {
    const doc = new DOMParser().parseFromString(responseText, "text/html");
    const subNode = subQuery ? doc.querySelector(subQuery) : "";
    const subNodeText = subNode ? subNode.innerHTML : "";
    const leakNode = leakQuery ? doc.querySelector(leakQuery) : null;
    const leakNodeText = leakNode ? leakNode.innerHTML : "";
    const videoNode = videoQuery ? doc.querySelector(videoQuery) : true;
    return {
      isSuccess: !!videoNode,
      tag: tagsQuery({ leakageText: leakNodeText, subtitleText: subNodeText })
    };
  }
  function searchPageCodeCheck(titleNodes, siteItem, CODE) {
    if (!titleNodes || titleNodes.length === 0) return { isSuccess: false, titleNodeText: "" };
    const codeRegex = /[a-zA-Z]{3,5}-\d{3,5}/;
    if (siteItem.strictParser) {
      const nodes = Array.from(titleNodes);
      const passNodes = nodes.filter((node) => {
        const nodeCode = node.outerHTML.match(codeRegex);
        return isCaseInsensitiveEqual(nodeCode == null ? void 0 : nodeCode[0], CODE);
      });
      const titleNodeText = passNodes.map((node) => node.outerHTML).join(" ");
      return {
        titleNodeText,
        isSuccess: passNodes.length > 0,
        multipleRes: passNodes.length > 1
      };
    } else {
      const titleNode = titleNodes[siteItem.domQuery.listIndex ?? 0];
      const titleNodeText = titleNode ? titleNode == null ? void 0 : titleNode.outerHTML : "";
      const matchCode = titleNodeText.match(codeRegex);
      const isSuccess = isCaseInsensitiveEqual(matchCode == null ? void 0 : matchCode[0], CODE);
      return { titleNodeText, isSuccess, multipleRes: titleNodes.length > 1 };
    }
  }
  function serachPageParser(responseText, siteItem, CODE) {
    const { linkQuery, titleQuery } = siteItem.domQuery;
    const doc = new DOMParser().parseFromString(responseText, "text/html");
    const titleNodes = titleQuery ? doc.querySelectorAll(titleQuery) : [];
    const { isSuccess, titleNodeText, multipleRes } = searchPageCodeCheck(titleNodes, siteItem, CODE);
    const linkNodes = linkQuery ? doc.querySelectorAll(linkQuery) : [];
    const linkNode = linkNodes[siteItem.domQuery.listIndex ?? 0];
    if (!isSuccess) {
      return { isSuccess: false };
    }
    const resultLinkText = linkNode.href.replace(linkNode.hostname, siteItem.hostname);
    return {
      isSuccess: true,
      resultLink: resultLinkText,
      multipleRes,
      tag: tagsQuery({ leakageText: titleNodeText, subtitleText: titleNodeText })
    };
  }
  const baseFetcher = async ({ siteItem, targetLink, CODE }) => {
    if (siteItem.fetchType === "false") {
      return Promise.resolve({
        isSuccess: true,
        resultLink: targetLink
      });
    }
    try {
      const response = await gmGet({ url: targetLink });
      if (isErrorCode(response.status)) {
        throw Error(String(response.status));
      }
      if (siteItem.fetchType === "get") {
        return {
          resultLink: targetLink,
          ...videoPageParser(response.responseText, siteItem.domQuery)
        };
      } else {
        return {
          ...serachPageParser(response.responseText, siteItem, CODE)
        };
      }
    } catch (error) {
      return {
        isSuccess: false
      };
    }
  };
  const javbleFetcher = async (args) => {
    const res = await baseFetcher(args);
    if (res.isSuccess) return res;
    const newLink = args.targetLink.slice(0, -1) + "-c/";
    return await baseFetcher({ ...args, targetLink: newLink });
  };
  const fetcher = (args) => {
    if (args.siteItem.name === "Jable") {
      return javbleFetcher(args);
    }
    return baseFetcher(args);
  };
  const SiteBtn = ({ siteItem, CODE, multipleNavi, hiddenError }) => {
    const { name, codeFormater } = siteItem;
    const formatCode = codeFormater ? codeFormater(CODE) : CODE;
    const originLink = siteItem.url.replace("{{code}}", formatCode);
    const [loading, setLoading] = h(false);
    const [fetchRes, setFetchRes] = h();
    y(() => {
      setLoading(true);
      fetcher({ siteItem, targetLink: originLink, CODE: formatCode }).then((res) => {
        setFetchRes(res);
        setLoading(false);
      });
    }, [fetcher, siteItem, CODE, originLink]);
    const multipleFlag = multipleNavi && (fetchRes == null ? void 0 : fetchRes.multipleRes);
    const tag = multipleFlag ? "多结果" : fetchRes == null ? void 0 : fetchRes.tag;
    const resultLink = multipleFlag ? originLink : fetchRes == null ? void 0 : fetchRes.resultLink;
    const colorClass = (fetchRes == null ? void 0 : fetchRes.isSuccess) ? "jop-button_green " : "jop-button_red ";
    if (hiddenError && !(fetchRes == null ? void 0 : fetchRes.isSuccess)) {
      return /* @__PURE__ */ u$1(preact.Fragment, {});
    }
    return /* @__PURE__ */ u$1(
      "a",
      {
        className: "jop-button " + (loading ? " " : colorClass),
        target: "_blank",
        href: !resultLink ? originLink : resultLink,
        children: [
          tag && /* @__PURE__ */ u$1("div", { className: "jop-button_label", children: tag }),
          /* @__PURE__ */ u$1("span", { children: name })
        ]
      }
    );
  };
  const App = M(function({ libItem, CODE }) {
    const DEF_DIS = [
      ...["AvJoy", "baihuse", "GGJAV", "AV01", "18sex", "highporn", "evojav", "HAYAV"],
      ...["JavBus", "JavDB", "JAVLib", "MISSAV_", "123av", "javhub", "javgo", "JAVMENU"]
    ];
    const [disables, setDisables] = h(_GM_getValue("disable", DEF_DIS));
    const [multipleNavi, setMultipleNavi] = h(_GM_getValue("multipleNavi", true));
    const [hiddenError, setHiddenError] = h(_GM_getValue("hiddenError", false));
    const list = siteList.filter(
      (siteItem) => !disables.includes(siteItem.name) && !siteItem.hostname.includes(libItem.name)
    );
    return /* @__PURE__ */ u$1(preact.Fragment, { children: [
      /* @__PURE__ */ u$1("div", { class: "jop-list", children: list.map((siteItem) => /* @__PURE__ */ u$1(
        SiteBtn,
        {
          siteItem,
          CODE,
          multipleNavi,
          hiddenError
        },
        siteItem.name
      )) }),
      /* @__PURE__ */ u$1(
        Setting,
        {
          siteList,
          setDisables: (disable) => {
            setDisables(disable);
            _GM_setValue("disable", disable);
          },
          multipleNavi,
          setMultipleNavi: (multipleNavi2) => {
            setMultipleNavi(multipleNavi2);
            _GM_setValue("multipleNavi", multipleNavi2);
          },
          disables,
          hiddenError,
          setHiddenError: (v2) => {
            setHiddenError(v2);
            _GM_setValue("hiddenError", v2);
          }
        }
      )
    ] });
  });
  function main() {
    const libItem = libSites.find((item) => document.querySelector(item.identifier));
    if (!libItem) {
      console.error("||jop 匹配站点失败");
      return;
    }
    const CODE = getCode(libItem);
    libItem.method();
    const panel = document.querySelector(libItem.querys.panelQueryStr);
    if (!panel) {
      console.error("||jop 插入界面失败");
      return;
    }
    const app = document.createElement("div");
    app.classList.add("jop-app");
    panel.append(app);
    preact.render(/* @__PURE__ */ u$1(App, { libItem, CODE }), app);
    console.log("||脚本挂载成功", CODE);
  }
  main();
 
})(preact);
    }


    // 多重启动策略确保兼容性
    function initScript() {
        console.log('JavdbBuddy: initScript 被调用, readyState=', document.readyState);
        start();
        
        // 额外的延迟重试（针对动态加载的页面）
        setTimeout(() => {
            console.log('JavdbBuddy: 5秒后重新尝试初始化');
            addOnlineWatchPanel();
            initCheck();
        }, 5000);
    }
    
    // 多种启动方式确保兼容性
    const startupMethods = [
        () => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    console.log('JavdbBuddy: DOMContentLoaded 触发');
                    setTimeout(initScript, 100);
                });
            }
        },
        () => {
            if (document.readyState === 'interactive') {
                console.log('JavdbBuddy: 页面处于 interactive 状态');
                setTimeout(initScript, 100);
            }
        },
        () => {
            window.addEventListener('load', () => {
                console.log('JavdbBuddy: window.load 触发');
                initScript();
            });
        },
        () => {
            if (document.readyState === 'complete') {
                console.log('JavdbBuddy: 页面已完全加载');
                initScript();
            }
        },
        () => {
            // 轮询检查，最多 20 次
            let pollCount = 0;
            const pollInterval = setInterval(() => {
                pollCount++;
                console.log(`JavdbBuddy: 轮询检查 #${pollCount}`);
                
                if (document.body && document.querySelector('.video-meta-panel, .movie-panel-info')) {
                    console.log('JavdbBuddy: 轮询检测到页面元素，开始初始化');
                    clearInterval(pollInterval);
                    initScript();
                } else if (pollCount >= 20) {
                    console.log('JavdbBuddy: 轮询达到上限，强制初始化');
                    clearInterval(pollInterval);
                    initScript();
                }
            }, 500);
        }
    ];
    
    // 执行所有启动方法
    console.log('JavdbBuddy: 开始执行所有启动方法');
    startupMethods.forEach((method, index) => {
        try {
            method();
        } catch(e) {
            console.error(`JavdbBuddy: 启动方法 ${index} 失败`, e);
        }
    });
    
    // 最后的兼容方案：直接延迟执行
    console.log('JavdbBuddy: 执行直接延迟启动');
    setTimeout(() => {
        console.log('JavdbBuddy: 1秒后直接启动');
        initScript();
    }, 1000);
    setTimeout(() => {
        console.log('JavdbBuddy: 3秒后直接启动');
        initScript();
    }, 3000);

    // 变动监听
    let timer;
    let buttonAttempts = 0; // 按钮添加尝试次数
    const MAX_BUTTON_ATTEMPTS = 10; // 最多尝试 10 次
    
    const observer = new MutationObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            initCheck();

            // 如果在线观看面板还未添加成功，继续尝试
            if (buttonAttempts < MAX_BUTTON_ATTEMPTS) {
                const existingPanel = document.querySelector('.jop-app');
                if (!existingPanel) {
                    console.log(`JavdbBuddy: 检测到 DOM 变化，第 ${buttonAttempts + 1} 次尝试添加面板`);
                    addOnlineWatchPanel();
                    buttonAttempts++;
                } else {
                    console.log('JavdbBuddy: 在线观看面板已存在，停止尝试');
                    buttonAttempts = MAX_BUTTON_ATTEMPTS; // 停止尝试
                }
            }
        }, 300);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // 页面加载后持续轮询服务器状态（实时监测开关机）
    let lastPingResult = {}; // { emby: true/false, jellyfin: true/false }
    function doDelayedReverify() {
        ['emby', 'jellyfin'].forEach(serverType => {
            const servers = getServersByType(serverType);
            if (servers.length === 0 || !servers[0].url || !servers[0].apiKey) return;
            const pingUrl = `${servers[0].url.replace(/\/$/, '')}/System/Info?api_key=${servers[0].apiKey}`;
            GM_xmlhttpRequest({
                method: 'GET', url: pingUrl, timeout: 3000,
                onload: function(r) {
                    const online = r.status === 200;
                    const prev = lastPingResult[serverType];
                    lastPingResult[serverType] = online;
                    if (prev !== undefined && prev === online) return;
                    if (!online) {
                        bulkUpdateStatus(serverType, '无法连接');
                    } else {
                        // 服务器恢复在线：只把显示"无法连接"的标签改为"未入库"，已入库的保留不动
                        const prefix = serverType === 'emby' ? 'Emby' : 'Jellyfin';
                        document.querySelectorAll(`.emby-status.error[data-type="${serverType}"]`).forEach(el => {
                            el.className = 'emby-status not-exists';
                            el.textContent = prefix + '未入库';
                            el.title = prefix + '未入库';
                        });
                        // 触发重新检测已入库项
                        document.querySelectorAll('.detail-search-panel').forEach(el => el.remove());
                        document.querySelectorAll('[data-jb_processed]').forEach(el => el.removeAttribute('data-jb_processed'));
                        initCheck();
                    }
                },
                onerror: function() {
                    if (lastPingResult[serverType] !== false) {
                        lastPingResult[serverType] = false;
                        bulkUpdateStatus(serverType, '无法连接');
                    }
                },
                ontimeout: function() {
                    if (lastPingResult[serverType] !== false) {
                        lastPingResult[serverType] = false;
                        bulkUpdateStatus(serverType, '无法连接');
                    }
                }
            });
        });
    }
    // 首次延迟检查，之后每5秒轮询
    setTimeout(doDelayedReverify, 1500);
    setInterval(doDelayedReverify, 5000);
    function bulkUpdateStatus(serverType, msg) {
        const cls = (msg === '未入库') ? 'emby-status not-exists' : 'emby-status error';
        document.querySelectorAll(`.emby-status[data-type="${serverType}"]`).forEach(el => {
            const prefix = serverType === 'emby' ? 'Emby' : 'Jellyfin';
            el.className = cls;
            el.textContent = prefix + msg;
            el.title = prefix + msg;
        });
    }
    setTimeout(doDelayedReverify, 1500);

    // 配置变更监听：当设置中添加/修改服务器后，立即重新检查所有标签
    let lastConfigChangeTime = GM_getValue('emby_config_changed', 0);
    setInterval(() => {
        const currentConfigChangeTime = GM_getValue('emby_config_changed', 0);
        if (currentConfigChangeTime > lastConfigChangeTime) {
            console.log('JavdbBuddy: 检测到配置变更，重新检查所有标签');
            lastConfigChangeTime = currentConfigChangeTime;
            
            // 重新加载配置和索引
            try {
                LIBRARY_INDEX = JSON.parse(GM_getValue('emby_library_index', '{}'));
            } catch(e) {
                LIBRARY_INDEX = {};
            }
            try {
                JELLYFIN_LIBRARY_INDEX = JSON.parse(GM_getValue('jellyfin_library_index', '{}'));
            } catch(e) {
                JELLYFIN_LIBRARY_INDEX = {};
            }

            // 重新执行检查
            initCheck();
        }
    }, 1000); // 每秒检查一次配置是否变更

    // ==================== 双标签磁力链功能 ====================
    function addDualTabsForMagnets() {
        console.log('JavdbBuddy: addDualTabsForMagnets()函数被调用');
        console.log('JavdbBuddy: 当前URL:', window.location.href);
        console.log('JavdbBuddy: 当前路径:', window.location.pathname);
        try {
            // 只在详情页显示
            if (!window.location.pathname.startsWith('/v/')) {
                console.log('JavdbBuddy: 不是详情页，跳过添加双标签磁力链');
                return;
            }
            
            // 防止重复添加
            if (document.querySelector('.javdb-dual-magnet-tabs')) {
                console.log('JavdbBuddy: 双标签磁力链已存在');
                return;
            }
            
            console.log('JavdbBuddy: 开始添加双标签磁力链');
            
            // 提取当前番号
            let videoCode = '';
            const codeMatch = document.body.textContent.match(/番[号號][:：]\s*([A-Z0-9\-]+)/i);
            if (codeMatch) {
                videoCode = codeMatch[1].trim();
            }
            if (!videoCode) {
                console.log('JavdbBuddy: 无法提取番号，跳过磁力链双标签');
                return;
            }
            console.log('JavdbBuddy: 双标签磁力链，番号:', videoCode);
            
            // ====== [新增] 立即后台预加载 JAVBUS 磁力链 ======
            preloadJavbusData(videoCode);
            
            // 查找磁力链区域的容器
            // JAVDB页面通常有一个标签页区域，包含"磁链"、"短评"、"相关清单"
            // 我们需要找到当前激活的磁力链内容区域
            const magnetTabContent = document.querySelector('#magnets') || 
                                    document.querySelector('[id*="magnet"]') ||
                                    document.querySelector('.magnet-list');
            
            if (!magnetTabContent) {
                console.log('JavdbBuddy: 未找到磁力链容器');
                return;
            }
            
            // 创建双标签界面（现代化设计）
            const dualTabsContainer = document.createElement('div');
            dualTabsContainer.className = 'javdb-dual-magnet-tabs';
            dualTabsContainer.style.cssText = `
                margin: 15px 0 10px 0;
                display: flex;
                gap: 8px;
                background: transparent;
                padding: 0;
            `;
            
            // JAVDB标签按钮
            const javdbTab = document.createElement('button');
            javdbTab.className = 'javdb-tab active';
            javdbTab.innerHTML = `🔥 JAVDB 磁力链 <span id="javdb-magnet-badge" style="
                position: absolute;
                top: -6px;
                right: -8px;
                background: #FF9800;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: none;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: bold;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                z-index: 10;
            "></span>`;
            javdbTab.style.cssText = `
                padding: 6px 12px;
                border: none;
                background: white;
                color: #667eea;
                cursor: pointer;
                font-weight: 700;
                font-size: 13px;
                text-align: center;
                border-radius: 6px;
                transition: all 0.3s ease;
                margin: 0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                position: relative;
                overflow: visible;
            `;
            
            // 添加微妙的内阴影效果
            javdbTab.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)';
            
            javdbTab.onclick = function() {
                showJAVDBMagnets();
                javdbTab.style.background = 'white';
                javdbTab.style.color = '#667eea';
                javdbTab.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                javbusTab.style.background = 'white';
                javbusTab.style.color = '#999';
                javbusTab.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                
                // 取消超时检查
                if (javdbLoadTimeout) {
                    clearTimeout(javdbLoadTimeout);
                    javdbLoadTimeout = null;
                }
            };
            
            // JAVBUS标签按钮
            const javbusTab = document.createElement('button');
            javbusTab.className = 'javdb-tab';
            javbusTab.innerHTML = `🧲 JAVBUS 磁力链 <span id="javbus-magnet-badge" style="
                position: absolute;
                top: -6px;
                right: -8px;
                background: #4CAF50;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: none;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: bold;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                z-index: 10;
            "></span>`;
            javbusTab.style.cssText = `
                padding: 6px 12px;
                border: none;
                background: white;
                color: #999;
                cursor: pointer;
                font-weight: 600;
                font-size: 13px;
                text-align: center;
                border-radius: 6px;
                transition: all 0.3s ease;
                margin: 0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                position: relative;
                overflow: visible;
            `;
            
            javbusTab.onclick = function() {
                showJAVBUSMagnets(videoCode);
                javbusTab.style.background = 'white';
                javbusTab.style.color = '#667eea';
                javbusTab.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                javdbTab.style.background = 'white';
                javdbTab.style.color = '#999';
                javdbTab.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            };
            
            // 添加悬停效果
            [javdbTab, javbusTab].forEach(tab => {
                tab.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-2px)';
                    this.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
                });
                
                tab.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                    if (this.classList.contains('active')) {
                        this.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                    } else {
                        this.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
                    }
                });
            });
            
            dualTabsContainer.appendChild(javdbTab);
            dualTabsContainer.appendChild(javbusTab);
            
            // 插入到磁力链容器前面（作为兄弟元素，方便分别控制显隐）
            magnetTabContent.parentNode.insertBefore(dualTabsContainer, magnetTabContent);
            
            // 创建JAVBUS磁力链容器（初始隐藏，放在磁力链容器后面）
            const javbusMagnetsContainer = document.createElement('div');
            javbusMagnetsContainer.id = 'javbus-magnet-container';
            javbusMagnetsContainer.style.display = 'none';
            magnetTabContent.parentNode.insertBefore(javbusMagnetsContainer, magnetTabContent.nextSibling);
            
            // 添加手动加载按钮（如果自动加载失败）
            const manualLoadBtn = document.createElement('button');
            manualLoadBtn.textContent = '🔄 手动加载JAVBUS磁力链';
            manualLoadBtn.style.cssText = `
                margin-top: 10px;
                padding: 8px 16px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.2s;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            `;
            manualLoadBtn.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-1px)';
                this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            });
            manualLoadBtn.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            });
            manualLoadBtn.addEventListener('click', function() {
                console.log('JavdbBuddy: 用户手动触发JAVBUS磁力链加载');
                javbusMagnetsContainer.innerHTML = '<p>正在从JAVBUS加载磁力链...</p>';
                javbusMagnetsContainer.style.display = 'block';
                fetchJAVBUSMagnets(videoCode, javbusMagnetsContainer);
                // 隐藏按钮
                this.style.display = 'none';
            });
            
            // 将按钮添加到 JAVBUS 容器后面
            javbusMagnetsContainer.parentNode.insertBefore(manualLoadBtn, javbusMagnetsContainer.nextSibling);
            
            // ====== 监听 JAVDB 原生标签切换 → 同步双标签显隐 ======
            // showJAVBUSMagnets 和 showJAVDBMagnets 操作 #magnets 显隐时设置标记，
            // 标记延迟清除，让 Observer 能区分"我们主动隐藏"和"JAVDB 原生标签切换"
            window.__dualMagnetHandling = false;
            
            function syncMagnetTabVisibility() {
                const isHidden = magnetTabContent.style.display === 'none' || 
                                 window.getComputedStyle(magnetTabContent).display === 'none' ||
                                 magnetTabContent.classList.contains('is-hidden');
                if (isHidden) {
                    // 非我们主动操作 → 原生标签切换，隐藏所有自定义元素
                    if (!window.__dualMagnetHandling) {
                        dualTabsContainer.style.display = 'none';
                        javbusMagnetsContainer.style.display = 'none';
                        manualLoadBtn.style.display = 'none';
                    }
                } else {
                    // 切回磁链标签时，恢复显示双标签，默认显示 JAVDB 内容
                    dualTabsContainer.style.display = 'flex';
                    magnetTabContent.style.display = 'block';
                    javbusMagnetsContainer.style.display = 'none';
                    manualLoadBtn.style.display = 'none';
                    // 重置标签按钮样式为 JAVDB 激活
                    javdbTab.classList.add('active');
                    javdbTab.style.background = 'white';
                    javdbTab.style.color = '#667eea';
                    javdbTab.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                    javbusTab.classList.remove('active');
                    javbusTab.style.background = 'white';
                    javbusTab.style.color = '#999';
                    javbusTab.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }
            }
            const magnetTabObserver = new MutationObserver(syncMagnetTabVisibility);
            magnetTabObserver.observe(magnetTabContent, { 
                attributes: true, 
                attributeFilter: ['style', 'class'],
                subtree: false
            });
            // 初始执行一次
            syncMagnetTabVisibility();
            
            // 自动预加载JAVBUS磁力链数据（改进版）
            let retryCount = 0;
            const maxRetries = 3;
            
            function autoLoadJAVBUS() {
                console.log('JavdbBuddy: autoLoadJAVBUS()函数被调用');
                console.log('JavdbBuddy: 当前加载状态:', javbusMagnetsContainer.dataset.loaded);
                console.log('JavdbBuddy: 重试次数:', retryCount, '最大重试次数:', maxRetries);
                console.log('JavdbBuddy: 容器是否存在:', !!javbusMagnetsContainer);
                console.log('JavdbBuddy: 容器是否在DOM中:', document.body.contains(javbusMagnetsContainer));
                
                if (javbusMagnetsContainer.dataset.loaded === 'true') {
                    console.log('JavdbBuddy: JAVBUS磁力链数据已加载');
                    return;
                }
                
                if (retryCount >= maxRetries) {
                    console.log('JavdbBuddy: 自动加载JAVBUS磁力链失败，已达最大重试次数');
                    javbusMagnetsContainer.innerHTML = `
                        <div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 4px;">
                            <p style="font-weight: bold; margin-bottom: 8px;">暂无数据</p>
                            <p style="font-size: 12px;">JAVBUS 未收录该影片或暂无可用的磁力链</p>
                        </div>
                    `;
                    javbusMagnetsContainer.dataset.loaded = 'error';
                    const badge = document.getElementById('javbus-magnet-badge');
                    if (badge) { badge.textContent = '0'; badge.style.display = 'flex'; }
                    
                    // 显示手动加载按钮
                    if (manualLoadBtn) {
                        manualLoadBtn.style.display = 'block';
                    }
                    return;
                }
                
                console.log(`JavdbBuddy: 自动预加载JAVBUS磁力链数据（第${retryCount + 1}次尝试）`);
                console.log('JavdbBuddy: 番号:', videoCode);
                console.log('JavdbBuddy: 目标容器:', javbusMagnetsContainer.id);
                
                // 显示加载状态
                javbusMagnetsContainer.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #666;">
                        <p>正在从JAVBUS加载磁力链...</p>
                        <p style="font-size: 12px; color: #999;">尝试 ${retryCount + 1}/${maxRetries}，请稍候</p>
                    </div>
                `;
                
                retryCount++;
                fetchJAVBUSMagnets(videoCode, javbusMagnetsContainer);
            }
            
            // 首次加载：延迟2秒确保页面完全加载
            console.log('JavdbBuddy: 设置自动预加载，2秒后执行');
            setTimeout(autoLoadJAVBUS, 2000);
            
            // 设置加载状态为false
            javbusMagnetsContainer.dataset.loaded = 'false';
            
            // 如果失败，2秒后重试
            const retryInterval = setInterval(() => {
                console.log('JavdbBuddy: 重试检查，当前状态:', javbusMagnetsContainer.dataset.loaded, '重试次数:', retryCount);
                if (javbusMagnetsContainer.dataset.loaded !== 'true' && javbusMagnetsContainer.dataset.loaded !== 'error' && retryCount < maxRetries) {
                    console.log('JavdbBuddy: 检测到加载失败，准备重试...');
                    setTimeout(autoLoadJAVBUS, 1000);
                } else {
                    console.log('JavdbBuddy: 停止重试检查');
                    clearInterval(retryInterval);
                }
            }, 3000); // 每3秒检查一次
            
            // 显示JAVDB磁力链（默认）
            function showJAVDBMagnets() {
                window.__dualMagnetHandling = true;
                magnetTabContent.style.display = 'block';
                javbusMagnetsContainer.style.display = 'none';
                setTimeout(() => { window.__dualMagnetHandling = false; }, 0);
            }
            
            // 检查JAVDB磁力链是否加载超时
            let javdbLoadTimeout = null;
            function checkJAVDBLoadTimeout() {
                if (magnetTabContent.textContent.includes('搜寻中')) {
                    console.log('JavdbBuddy: JAVDB磁力链加载超时，自动切换到JAVBUS');
                    // 自动切换到JAVBUS标签
                    javbusTab.click();
                }
            }
            
            // 设置10秒后检查JAVDB磁力链是否加载超时
            javdbLoadTimeout = setTimeout(checkJAVDBLoadTimeout, 10000);
            console.log('JavdbBuddy: 设置JAVDB磁力链加载超时检查（10秒后）');
            
            // 显示JAVBUS磁力链
            function showJAVBUSMagnets(code) {
                console.log('JavdbBuddy: showJAVBUSMagnets()函数被调用，番号:', code);
                window.__dualMagnetHandling = true;
                magnetTabContent.style.display = 'none';
                javbusMagnetsContainer.style.display = 'block';
                setTimeout(() => { window.__dualMagnetHandling = false; }, 0);
                
                // 如果已经通过 autoLoadJAVBUS 加载过，直接显示
                if (javbusMagnetsContainer.dataset.loaded === 'true') {
                    console.log('JavdbBuddy: JAVBUS磁力链数据已加载，直接显示');
                    return;
                }
                
                // 检查缓存（预加载完成的）
                const cached = JAVBUS_CACHE[code];
                if (cached && cached.status === 'loaded' && cached.data && cached.data.length > 0) {
                    renderMagnetData(cached.data, javbusMagnetsContainer);
                    javbusMagnetsContainer.dataset.loaded = 'true';
                    const badge = document.getElementById('javbus-magnet-badge');
                    if (badge) {
                        badge.textContent = cached.data.length;
                        badge.style.display = 'flex';
                    }
                    return;
                }
                // 缓存已标记为失败或空数据，直接显示“暂无数据”并显示角标 0
                if (cached && (cached.status === 'error' || (cached.status === 'loaded' && (!cached.data || cached.data.length === 0)))) {
                    javbusMagnetsContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 4px;">
                        <p style="font-weight: bold; margin-bottom: 8px;">暂无数据</p>
                        <p style="font-size: 12px;">JAVBUS 未收录该影片或暂无可用的磁力链</p>
                    </div>`;
                    javbusMagnetsContainer.dataset.loaded = 'error';
                    const badge = document.getElementById('javbus-magnet-badge');
                    if (badge) {
                        badge.textContent = '0';
                        badge.style.display = 'flex';
                    }
                    return;
                }
                
                // 缓存未命中或正在加载，不等预加载，直接请求
                console.log('JavdbBuddy: JAVBUS磁力链数据未加载，开始加载');
                javbusMagnetsContainer.innerHTML = '<p>正在从JAVBUS加载磁力链...</p>';
                fetchJAVBUSMagnets(code, javbusMagnetsContainer);
            }
            
            // 更新JAVDB磁力链角标
            function updateJAVDBMagnetBadge() {
                const badge = document.getElementById('javdb-magnet-badge');
                if (!badge) return;
                // 计算原始磁力链数量
                const magnetLinks = magnetTabContent.querySelectorAll('a[href^="magnet:"]');
                const count = magnetLinks.length;
                if (count > 0) {
                    badge.textContent = count;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
            // 延迟更新，等待页面动态加载
            setTimeout(updateJAVDBMagnetBadge, 1000);
            // 监听磁力链区域变化
            const observer = new MutationObserver(updateJAVDBMagnetBadge);
            observer.observe(magnetTabContent, { childList: true, subtree: true });
            
            console.log('JavdbBuddy: 双标签磁力链已添加');
            
        } catch (error) {
            console.error('JavdbBuddy: 添加双标签磁力链失败:', error);
        }
    }
    
    // 从<script>标签中提取磁力链数据
    function extractMagnetDataFromScripts(htmlDoc) {
        const scripts = htmlDoc.querySelectorAll('script');
        console.log('JavdbBuddy: 检查脚本数量:', scripts.length);
        let magnetData = [];
        
        for (let script of scripts) {
            const scriptContent = script.textContent || script.innerText;
            
            // 尝试多种常见数据格式（JAVBUS特有模式）
            const patterns = [
                /var\s+magnets\s*=\s*(\[[\s\S]*?\]);/,  // var magnets = [...];
                /window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/,  // window.__INITIAL_STATE__ = {...};
                /magnets:\s*(\[[\s\S]*?\])/,  // magnets: [...]
                /"magnets"\s*:\s*(\[[\s\S]*?\])/,  // "magnets": [...]
                /magnetList:\s*(\[[\s\S]*?\])/,  // magnetList: [...]
                /"magnetList"\s*:\s*(\[[\s\S]*?\])/,   // "magnetList": [...]
                /var\s+data\s*=\s*({[\s\S]*?});\s*\/\/\s*JAVBUS/,  // var data = {...}; // JAVBUS
                /data\s*=\s*({[\s\S]*?});\s*console\.log/,  // data = {...}; console.log
                /var\s+movie\s*=\s*({[\s\S]*?});/,  // var movie = {...};
                /"magnet_links"\s*:\s*(\[[\s\S]*?\])/,  // "magnet_links": [...]
                /magnet_links:\s*(\[[\s\S]*?\])/,  // magnet_links: [...]
                /"torrents"\s*:\s*(\[[\s\S]*?\])/,  // "torrents": [...]
                /torrents:\s*(\[[\s\S]*?\])/  // torrents: [...]
            ];
            
            for (let pattern of patterns) {
                const match = scriptContent.match(pattern);
                if (match) {
                    try {
                        let dataStr = match[1];
                        // 如果是对象，尝试从中提取磁力链数组
                        if (dataStr.startsWith('{')) {
                            const dataObj = JSON.parse(dataStr);
                            // 尝试从对象中找到磁力链数组
                            if (dataObj.magnets) magnetData = dataObj.magnets;
                            else if (dataObj.magnetList) magnetData = dataObj.magnetList;
                            else if (dataObj.magnet_links) magnetData = dataObj.magnet_links;
                            else if (dataObj.torrents) magnetData = dataObj.torrents;
                            else if (dataObj.data && Array.isArray(dataObj.data)) magnetData = dataObj.data;
                        } else {
                            // 直接是数组
                            magnetData = JSON.parse(dataStr);
                        }
                        
                        if (Array.isArray(magnetData) && magnetData.length > 0) {
                            console.log('JavdbBuddy: 从脚本中找到磁力链数据，模式:', pattern.toString());
                            // 标准化数据格式
                            return magnetData.map(item => ({
                                name: item.name || item.title || item.text || item.magnet_name || '未知',
                                size: item.size || item.fileSize || item.file_size || item.size_text || '未知',
                                date: item.date || item.time || item.timestamp || item.date_added || '未知',
                                magnetUrl: item.magnetUrl || item.magnet || item.magnet_url || item.url || '',
                                hasSub: item.hasSub || item.has_subtitle || false
                            }));
                        }
                    } catch (e) {
                        // JSON解析失败，尝试下一个模式
                        console.log('JavdbBuddy: 解析失败，尝试下一个模式');
                    }
                }
            }
        }
        
        return magnetData;
    }
    
    // 直接从HTML中提取磁力链接（备用方法）
    function extractMagnetsFromHTML(htmlDoc) {
        console.log('JavdbBuddy: 尝试直接从HTML中提取磁力链接');
        const magnetLinks = [];
        
        // 查找所有包含magnet:的链接
        const allLinks = htmlDoc.querySelectorAll('a[href^="magnet:"]');
        console.log('JavdbBuddy: 找到', allLinks.length, '个磁力链接');
        
        if (allLinks.length === 0) {
            console.log('JavdbBuddy: 未找到任何磁力链接，可能数据是动态加载的');
            // 尝试查找可能包含磁力链接的元素
            const possibleContainers = [
                htmlDoc.querySelector('.magnet-list'),
                htmlDoc.querySelector('#magnets'),
                htmlDoc.querySelector('.torrent-list'),
                htmlDoc.querySelector('[class*="magnet"]'),
                htmlDoc.querySelector('[id*="magnet"]')
            ];
            
            for (let container of possibleContainers) {
                if (container) {
                    console.log('JavdbBuddy: 找到可能的磁力链容器:', container.className, '内容长度:', container.innerHTML.length);
                    // 尝试在容器内查找磁力链接
                    const containerLinks = container.querySelectorAll('a[href^="magnet:"]');
                    console.log('JavdbBuddy: 容器内找到', containerLinks.length, '个磁力链接');
                }
            }
        }
        
        allLinks.forEach((link, index) => {
            const magnetUrl = link.href;
            let name = link.textContent.trim() || link.title || '磁力链接 ' + (index + 1);
            
            console.log(`JavdbBuddy: 磁力链接 ${index + 1}:`, name.substring(0, 50) + '...');
            
            // 尝试从父元素或兄弟元素中提取更多信息
            let size = '未知';
            let date = '未知';
            
            // 查找父元素或相邻元素中的元数据
            let parent = link.parentElement;
            if (parent) {
                const parentText = parent.textContent;
                
                // 尝试提取大小（如 "1.5GB", "500MB"）
                const sizeMatch = parentText.match(/(\d+\.?\d*\s*[GMK]B)/i);
                if (sizeMatch) size = sizeMatch[1];
                
                // 尝试提取日期（如 "2024-01-15", "2024/01/15"）
                const dateMatch = parentText.match(/(\d{4}[-/]\d{2}[-/]\d{2})/);
                if (dateMatch) date = dateMatch[1];
            }
            
            magnetLinks.push({
                name: name,
                size: size,
                date: date,
                magnetUrl: magnetUrl,
                hasSub: false // 无法从HTML直接判断是否有字幕
            });
        });
        
        console.log('JavdbBuddy: 从HTML提取完成，共', magnetLinks.length, '个磁力链接');
        return magnetLinks;
    }
    
    // 渲染磁力链数据到容器
    function renderMagnetData(data, container) {
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 4px;">
                    <p>没有找到磁力链数据</p>
                    <p style="font-size: 12px; color: #999;">可能需要登录JAVBUS查看</p>
                </div>
            `;
            return;
        }
        
        // 创建现代化表格
        const table = document.createElement('table');
        table.style.cssText = `
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            font-size: 14px;
        `;
        
        // 表头
        const thead = document.createElement('thead');
        thead.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        `;
        const headerRow = document.createElement('tr');
        const headers = ['磁力名稱', '檔案大小', '分享日期', '操作'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            th.style.cssText = `
                padding: 12px 15px;
                text-align: left;
                font-weight: 600;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            `;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // 表体
        const tbody = document.createElement('tbody');
        data.forEach((magnet, index) => {
            const row = document.createElement('tr');
            row.style.cssText = `
                transition: background-color 0.2s;
                background-color: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};
            `;
            
            // 悬停效果
            row.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#f0f4ff';
            });
            row.addEventListener('mouseleave', function() {
                this.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
            });
            
            // 名称和标签
            const nameCell = document.createElement('td');
            nameCell.style.cssText = `
                padding: 12px 15px;
                border-bottom: 1px solid #e9ecef;
                max-width: 400px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-weight: 500;
            `;
            const nameSpan = document.createElement('span');
            nameSpan.textContent = magnet.name || magnet.title || magnet.text || '未知';
            nameSpan.style.marginRight = '6px';
            nameCell.appendChild(nameSpan);
            
            // 添加标签
            if (magnet.hasHD) {
                const hdTag = document.createElement('span');
                hdTag.textContent = '高清';
                hdTag.style.cssText = `
                    background: #4CAF50;
                    color: white;
                    padding: 3px 10px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    margin-right: 6px;
                    display: inline-block;
                    vertical-align: middle;
                    border: 1px solid #388E3C;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
                `;
                nameCell.appendChild(hdTag);
            }
            if (magnet.hasSub) {
                const subTag = document.createElement('span');
                subTag.textContent = '字幕';
                subTag.style.cssText = `
                    background: #2196F3;
                    color: white;
                    padding: 3px 10px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    display: inline-block;
                    vertical-align: middle;
                    border: 1px solid #1976D2;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
                `;
                nameCell.appendChild(subTag);
            }
            row.appendChild(nameCell);
            
            // 大小
            const sizeCell = document.createElement('td');
            sizeCell.textContent = magnet.size || magnet.fileSize || '未知';
            sizeCell.style.cssText = `
                padding: 12px 15px;
                border-bottom: 1px solid #e9ecef;
                color: #666;
            `;
            row.appendChild(sizeCell);
            
            // 日期
            const dateCell = document.createElement('td');
            dateCell.textContent = magnet.date || magnet.time || magnet.timestamp || '未知';
            dateCell.style.cssText = `
                padding: 12px 15px;
                border-bottom: 1px solid #e9ecef;
                color: #666;
            `;
            row.appendChild(dateCell);
            
            // 操作按钮
            const actionCell = document.createElement('td');
            actionCell.style.cssText = `
                padding: 12px 15px;
                border-bottom: 1px solid #e9ecef;
                text-align: center;
            `;
            
            // 复制按钮
            const copyBtn = document.createElement('button');
            copyBtn.textContent = '📋 复制';
            copyBtn.style.cssText = `
                padding: 6px 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.2s;
            `;
            copyBtn.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-1px)';
                this.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.3)';
            });
            copyBtn.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            });
            copyBtn.addEventListener('click', function() {
                const magnetUrl = magnet.magnetUrl || magnet.magnet || magnet.url;
                if (magnetUrl) {
                    navigator.clipboard.writeText(magnetUrl).then(() => {
                        const oldText = copyBtn.textContent;
                        copyBtn.textContent = '✅ 已复制';
                        copyBtn.style.background = '#28a745';
                        setTimeout(() => {
                            copyBtn.textContent = oldText;
                            copyBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                        }, 2000);
                    }).catch(() => {
                        // 备用复制方法
                        const textarea = document.createElement('textarea');
                        textarea.value = magnetUrl;
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textarea);
                        
                        const oldText = copyBtn.textContent;
                        copyBtn.textContent = '✅ 已复制';
                        copyBtn.style.background = '#28a745';
                        setTimeout(() => {
                            copyBtn.textContent = oldText;
                            copyBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                        }, 2000);
                    });
                }
            });
            
            actionCell.appendChild(copyBtn);
            row.appendChild(actionCell);
            
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        
        // 添加统计信息
        const statsDiv = document.createElement('div');
        statsDiv.style.cssText = `
            margin-top: 10px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
            border-left: 4px solid #667eea;
            font-size: 12px;
            color: #666;
        `;
        statsDiv.innerHTML = `
            共找到 <strong>${data.length}</strong> 个磁力链接
        `;
        
        container.innerHTML = '';
        container.appendChild(table);
        container.appendChild(statsDiv);
    }
    
    // 处理JAVBUS年龄验证
    function passAgeVerification() {
        return new Promise((resolve) => {
            console.log('JavdbBuddy: 尝试通过JAVBUS年龄验证');
            
            // JAVBUS年龄验证机制：需要设置特定的cookie
            // 尝试多个可能的cookie组合
            const cookieAttempts = [
                'existmag=all',
                'agegate=1',
                'over18=1',
                'age_verified=1',
                'agecheck=1',
                'age=18',
                'over18=yes',
                'adult=1',
                'agegate=1; existmag=all',
                'over18=1; existmag=all'
            ];
            
            let currentIndex = 0;
            let ageVerified = false;
            
            function tryNextCookie() {
                if (currentIndex >= cookieAttempts.length) {
                    console.log('JavdbBuddy: 所有cookie尝试完毕，年龄验证状态:', ageVerified ? '通过' : '未通过');
                    resolve(ageVerified);
                    return;
                }
                
                const cookies = cookieAttempts[currentIndex];
                console.log(`JavdbBuddy: 尝试cookie组合 ${currentIndex + 1}/${cookieAttempts.length}:`, cookies);
                
                // 使用一个简单的测试URL
                const testUrl = 'https://www.javbus.com/SSIS-795';
                
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: testUrl,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                        'Referer': 'https://www.javbus.com/',
                        'Cookie': cookies
                    },
                    onload: function(response) {
                        console.log(`JavdbBuddy: Cookie组合 ${currentIndex + 1} 响应状态:`, response.status);
                        
                        if (response.status !== 200) {
                            console.log(`JavdbBuddy: Cookie组合 ${currentIndex + 1} 响应状态码不是200，尝试下一个`);
                            currentIndex++;
                            tryNextCookie();
                            return;
                        }
                        
                        // 检查响应中是否包含年龄验证内容
                        const hasAgeVerify = response.responseText.includes('你是否已經成年') || 
                                           response.responseText.includes('年龄验证') ||
                                           response.responseText.includes('age verification') ||
                                           response.responseText.includes('请确认您已年满18岁');
                        
                        const hasMagnetTable = response.responseText.includes('磁力名稱') || 
                                             response.responseText.includes('檔案大小') ||
                                             response.responseText.includes('magnet:') ||
                                             response.responseText.includes('torrent');
                        
                        console.log(`JavdbBuddy: Cookie组合 ${currentIndex + 1} 年龄验证内容:`, hasAgeVerify);
                        console.log(`JavdbBuddy: Cookie组合 ${currentIndex + 1} 磁力链内容:`, hasMagnetTable);
                        
                        // 如果没有年龄验证内容或包含磁力链内容，认为年龄验证通过
                        if (!hasAgeVerify || hasMagnetTable) {
                            console.log(`JavdbBuddy: Cookie组合 ${currentIndex + 1} 年龄验证通过`);
                            ageVerified = true;
                            resolve(true);
                            return;
                        }
                        
                        // 尝试下一个cookie组合
                        currentIndex++;
                        tryNextCookie();
                    },
                    onerror: function(error) {
                        console.error(`JavdbBuddy: Cookie组合 ${currentIndex + 1} 请求失败:`, error);
                        currentIndex++;
                        tryNextCookie();
                    },
                    ontimeout: function() {
                        console.error(`JavdbBuddy: Cookie组合 ${currentIndex + 1} 请求超时`);
                        currentIndex++;
                        tryNextCookie();
                    }
                });
            }
            
            // 开始尝试cookie组合
            tryNextCookie();
        });
    }
    
    // 获取JAVBUS磁力链数据
    async function fetchJAVBUSMagnets(videoCode, container) {
        // ====== [优先] 检查缓存 ======
        const cached = JAVBUS_CACHE[videoCode];
        if (cached && cached.status === 'loaded' && cached.data && cached.data.length > 0) {
            renderMagnetData(cached.data, container);
            container.dataset.loaded = 'true';
            const badge = document.getElementById('javbus-magnet-badge');
            if (badge) {
                badge.textContent = cached.data.length;
                badge.style.display = 'flex';
            }
            return;
        }
        
        const url = `https://www.javbus.com/${videoCode}`;
        console.log('JavdbBuddy: fetchJAVBUSMagnets()函数被调用');
        console.log('JavdbBuddy: 番号:', videoCode);
        console.log('JavdbBuddy: 容器ID:', container.id);
        console.log('JavdbBuddy: 正在获取JAVBUS磁力链:', url);
        
        // 角标更新辅助函数
        function updateJavbusBadge(count) {
            const badge = document.getElementById('javbus-magnet-badge');
            if (badge) {
                badge.textContent = count;
                badge.style.display = 'flex';
            }
        }
        
        // 先显示加载中状态
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                <p>🔄 正在从JAVBUS加载磁力链...</p>
                <p style="font-size: 12px; color: #999;">请稍候，正在获取数据...</p>
            </div>
        `;
        
        // 获取JAVBUS页面
        console.log('JavdbBuddy: 开始发送GM_xmlhttpRequest请求到:', url);
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Referer': 'https://www.javbus.com/',
                'Cookie': 'existmag=all'
            },
            timeout: 20000,
            onload: function(response) {
                console.log('JavdbBuddy: GM_xmlhttpRequest onload回调被调用，状态码:', response.status);
                try {
                    console.log('JavdbBuddy: JAVBUS页面获取成功，状态码:', response.status);
                    console.log('JavdbBuddy: HTML长度:', response.responseText.length);
                    
                    if (response.status !== 200) {
                        container.innerHTML = `<div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 4px;">
                            <p style="font-weight: bold; margin-bottom: 8px;">暂无数据</p>
                            <p style="font-size: 12px;">JAVBUS 未收录该影片或暂无可用的磁力链</p>
                        </div>`;
                        container.dataset.loaded = 'error';
                        updateJavbusBadge(0);
                        return;
                    }
                    
                    // 解析HTML
                    const html = response.responseText;
                    console.log('JavdbBuddy: HTML内容前200字符:', html.substring(0, 200));
                    
                    // 提取 gid, uc, img 变量
                    const gidMatch = html.match(/var\s+gid\s*=\s*(\d+)\s*;/);
                    const ucMatch = html.match(/var\s+uc\s*=\s*(\d+)\s*;/);
                    const imgMatch = html.match(/var\s+img\s*=\s*'([^']+)'\s*;/);
                    
                    if (gidMatch && ucMatch && imgMatch) {
                        const gid = gidMatch[1];
                        const uc = ucMatch[1];
                        const img = imgMatch[1];
                        console.log('JavdbBuddy: 提取到变量 - gid:', gid, 'uc:', uc, 'img:', img);
                        
                        // 调用API获取磁力链数据
                        const apiUrl = `https://www.javbus.com/ajax/uncledatoolsbyajax.php?gid=${gid}&lang=zh&img=${encodeURIComponent(img)}&uc=${uc}`;
                        console.log('JavdbBuddy: 调用API:', apiUrl);
                        
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: apiUrl,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                                'Referer': url,
                                'Cookie': 'existmag=all',
                                'X-Requested-With': 'XMLHttpRequest'
                            },
                            timeout: 15000,
                            onload: function(apiResponse) {
                                console.log('JavdbBuddy: API响应状态码:', apiResponse.status);
                                if (apiResponse.status !== 200) {
                                    container.innerHTML = `<div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 4px;">
                                        <p style="font-weight: bold; margin-bottom: 8px;">暂无数据</p>
                                        <p style="font-size: 12px;">JAVBUS 未收录该影片或暂无可用的磁力链</p>
                                    </div>`;
                                    container.dataset.loaded = 'error';
                                    updateJavbusBadge(0);
                                    return;
                                }
                                
                                const apiHtml = apiResponse.responseText;
                                console.log('JavdbBuddy: API返回HTML长度:', apiHtml.length);
                                
                                // 解析API返回的HTML片段
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(`<table><tbody>${apiHtml}</tbody></table>`, 'text/html');
                                const rows = doc.querySelectorAll('tr');
                                
                                const magnetData = [];
                                rows.forEach(row => {
                                    const cells = row.querySelectorAll('td');
                                    if (cells.length >= 3) {
                                        const nameCell = cells[0];
                                        const sizeCell = cells[1];
                                        const dateCell = cells[2];
                                        
                                        // 提取名称和链接
                                        const nameLink = nameCell.querySelector('a');
                                        const sizeLink = sizeCell.querySelector('a');
                                        const dateLink = dateCell.querySelector('a');
                                        
                                        if (nameLink && nameLink.href.startsWith('magnet:')) {
                                            const nameText = nameLink.textContent.trim();
                                            const sizeText = sizeLink ? sizeLink.textContent.trim() : '';
                                            const dateText = dateLink ? dateLink.textContent.trim() : '';
                                            
                                            // 从nameCell的HTML中提取标签
                                            const nameHTML = nameCell.innerHTML;
                                            const hasHD = nameHTML.includes('高清') || nameText.includes('高清');
                                            const hasSub = nameHTML.includes('字幕') || nameText.includes('字幕');
                                            
                                            magnetData.push({
                                                name: nameText,
                                                size: sizeText,
                                                date: dateText,
                                                magnetUrl: nameLink.href,
                                                hasSub: hasSub,
                                                hasHD: hasHD
                                            });
                                        }
                                    }
                                });
                                
                                console.log('JavdbBuddy: 从API提取到磁力链数据数量:', magnetData.length);
                                
                                if (magnetData.length > 0) {
                                    // 对磁力链数据进行排序：有字幕的排在最前面
                                    magnetData.sort((a, b) => {
                                        if (a.hasSub && !b.hasSub) return -1;
                                        if (!a.hasSub && b.hasSub) return 1;
                                        return 0;
                                    });
                                    
                                    // ====== 保存到缓存 ======
                                    JAVBUS_CACHE[videoCode] = { status: 'loaded', data: magnetData };
                                    
                                    renderMagnetData(magnetData, container);
                                    container.dataset.loaded = 'true';
                                    
                                    // 更新JAVBUS磁力链角标
                                    const badge = document.getElementById('javbus-magnet-badge');
                                    if (badge) {
                                        badge.textContent = magnetData.length;
                                        badge.style.display = 'flex';
                                    }
                                } else {
                                    container.innerHTML = `<div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 4px;">
                                        <p style="font-weight: bold; margin-bottom: 8px;">暂无数据</p>
                                        <p style="font-size: 12px;">JAVBUS 未收录该影片或暂无可用的磁力链</p>
                                    </div>`;
                                    container.dataset.loaded = 'error';
                                    updateJavbusBadge(0);
                                }
                            },
                            onerror: function(error) {
                                console.error('JavdbBuddy: API请求失败:', error);
                                container.innerHTML = `<div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 4px;">
                                    <p style="font-weight: bold; margin-bottom: 8px;">暂无数据</p>
                                    <p style="font-size: 12px;">JAVBUS 未收录该影片或暂无可用的磁力链</p>
                                </div>`;
                                container.dataset.loaded = 'error';
                                updateJavbusBadge(0);
                            },
                            ontimeout: function() {
                                console.error('JavdbBuddy: API请求超时');
                                container.innerHTML = `<div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 4px;">
                                    <p style="font-weight: bold; margin-bottom: 8px;">暂无数据</p>
                                    <p style="font-size: 12px;">JAVBUS 未收录该影片或暂无可用的磁力链</p>
                                </div>`;
                                container.dataset.loaded = 'error';
                                updateJavbusBadge(0);
                            }
                        });
                        
                    } else {
                        console.warn('JavdbBuddy: 无法提取gid/uc/img，回退到HTML解析');
                        // 回退到原有的HTML解析逻辑
                        fallbackParseMagnetsFromHTML(html, url, container);
                    }
                    
                } catch (error) {
                    console.error('JavdbBuddy: 解析JAVBUS页面失败:', error);
                    container.innerHTML = `<div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 4px;">
                        <p style="font-weight: bold; margin-bottom: 8px;">暂无数据</p>
                        <p style="font-size: 12px;">JAVBUS 未收录该影片或暂无可用的磁力链</p>
                    </div>`;
                    container.dataset.loaded = 'error';
                    updateJavbusBadge(0);
                }
            },
            onerror: function(error) {
                console.error('JavdbBuddy: 获取JAVBUS页面失败:', error);
                container.innerHTML = `<div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 4px;">
                    <p style="font-weight: bold; margin-bottom: 8px;">暂无数据</p>
                    <p style="font-size: 12px;">JAVBUS 未收录该影片或暂无可用的磁力链</p>
                </div>`;
                container.dataset.loaded = 'error';
                updateJavbusBadge(0);
            },
            ontimeout: function() {
                console.error('JavdbBuddy: 获取JAVBUS页面超时');
                container.innerHTML = `<div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 4px;">
                    <p style="font-weight: bold; margin-bottom: 8px;">暂无数据</p>
                    <p style="font-size: 12px;">JAVBUS 未收录该影片或暂无可用的磁力链</p>
                </div>`;
                container.dataset.loaded = 'error';
                updateJavbusBadge(0);
            }
        });
        
        // 添加一个超时检查，如果请求长时间没有响应，显示错误
        setTimeout(() => {
            if (!container.dataset.loaded || container.dataset.loaded === 'false') {
                console.error('JavdbBuddy: GM_xmlhttpRequest请求长时间未响应，可能被阻止');
                container.innerHTML = `<div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 4px;">
                    <p style="font-weight: bold; margin-bottom: 8px;">暂无数据</p>
                    <p style="font-size: 12px;">JAVBUS 未收录该影片或暂无可用的磁力链</p>
                </div>`;
                container.dataset.loaded = 'error';
                updateJavbusBadge(0);
            }
        }, 30000);
    }
    
    // 回退函数：从HTML解析磁力链（原有逻辑）
    function fallbackParseMagnetsFromHTML(html, url, container) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // 直接从HTML中提取磁力链数据
        const magnetLinks = doc.querySelectorAll('a[href^="magnet:"]');
        console.log('JavdbBuddy: 回退解析 - 找到磁力链接数量:', magnetLinks.length);
        
        if (magnetLinks.length === 0) {
            console.error('JavdbBuddy: 回退解析 - 未找到任何磁力链接');
            container.innerHTML = `<div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 4px;">
                <p style="font-weight: bold; margin-bottom: 8px;">暂无数据</p>
                <p style="font-size: 12px;">JAVBUS 未收录该影片或暂无可用的磁力链</p>
            </div>`;
            container.dataset.loaded = 'error';
            const badge = document.getElementById('javbus-magnet-badge');
            if (badge) { badge.textContent = '0'; badge.style.display = 'flex'; }
            return;
        }
        
        // 提取磁力链数据
        const magnetData = [];
        
        for (let i = 0; i < magnetLinks.length; i++) {
            const magnetLink = magnetLinks[i];
            const row = magnetLink.closest('tr');
            
            if (row) {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 3) {
                    const nameCell = cells[0];
                    const sizeCell = cells[1];
                    const dateCell = cells[2];
                    
                    // 提取名称和标签
                    const nameText = nameCell.textContent.trim();
                    const sizeText = sizeCell.textContent.trim();
                    const dateText = dateCell.textContent.trim();
                    
                    // 检查是否有高清和字幕标签
                    const hasHD = nameText.includes('高清');
                    const hasSub = nameText.includes('字幕');
                    
                    magnetData.push({
                        name: nameText,
                        size: sizeText,
                        date: dateText,
                        magnetUrl: magnetLink.href,
                        hasSub: hasSub,
                        hasHD: hasHD
                    });
                }
            }
        }
        
        console.log('JavdbBuddy: 回退解析 - 提取到磁力链数据数量:', magnetData.length);
        
        if (magnetData.length > 0) {
            // 对磁力链数据进行排序：有字幕的排在最前面
            magnetData.sort((a, b) => {
                if (a.hasSub && !b.hasSub) return -1;
                if (!a.hasSub && b.hasSub) return 1;
                return 0;
            });
            
            renderMagnetData(magnetData, container);
            container.dataset.loaded = 'true';
            
            // 更新JAVBUS磁力链角标
            const badge = document.getElementById('javbus-magnet-badge');
            if (badge) {
                badge.textContent = magnetData.length;
                badge.style.display = 'flex';
            }
        } else {
            container.innerHTML = `<div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 4px;">
                <p style="font-weight: bold; margin-bottom: 8px;">暂无数据</p>
                <p style="font-size: 12px;">JAVBUS 未收录该影片或暂无可用的磁力链</p>
            </div>`;
            container.dataset.loaded = 'error';
            
            // 显示角标 0
            const badge = document.getElementById('javbus-magnet-badge');
            if (badge) {
                badge.textContent = '0';
                badge.style.display = 'flex';
            }
        }
    }
    
    // 延迟添加双标签磁力链（确保页面加载完成）
    addDualTabsForMagnets();

    // ================================================================
    // ========== JavdbBuddy 增强功能模块 ==========
    const JB_API_BASE = 'https://jdforrepam.com/api';

    // 照搬 JavdbBuddy 的签名函数：使用外部库 blueimp-md5（通过 @require 加载）
    function jbBuildSignature() {
        const curr = Math.floor(Date.now() / 1000);
        const stored = localStorage.getItem('jb_jdsignature');
        if (stored) {
            const parts = stored.split('.');
            if (parts.length === 3 && (curr - parseInt(parts[0])) <= 300) return stored;
        }
        const sign = `${curr}.lpw6vgqzsp.${md5(`${curr}71cf27bb3c0bcdf207b64abecddc970098c7421ee7203b9cdae54478478a199e7d5a6e1a57691123c1a931c057842fb73ba3b3c83bcd69c17ccf174081e3d8aa`)}`;
        localStorage.setItem('jb_jdsignature', sign);
        return sign;
    }

    // 照搬 JavdbBuddy 的 gmRequest：只检查 HTTP 状态码，不检查 data.success，带3次重试
    function jbApiGetOnce(url, params, headers) {
        return new Promise((resolve, reject) => {
            let fullUrl = url;
            if (params && Object.keys(params).length) {
                const qs = new URLSearchParams(params).toString();
                fullUrl += (url.includes('?') ? '&' : '?') + qs;
            }
            GM_xmlhttpRequest({
                method: 'GET',
                url: fullUrl,
                headers: headers || {},
                timeout: 8000,
                onload: (resp) => {
                    try {
                        if (resp.status >= 200 && resp.status < 300) {
                            if (resp.responseText) {
                                try {
                                    resolve(JSON.parse(resp.responseText));
                                } catch (e) {
                                    resolve(resp.responseText);
                                }
                            } else {
                                resolve(resp.responseText || resp);
                            }
                        } else {
                            try {
                                const errorData = JSON.parse(resp.responseText);
                                reject(errorData);
                            } catch (e) {
                                reject(new Error(resp.responseText || `请求发生错误 ${resp.status}`));
                            }
                        }
                    } catch (e) {
                        reject(e);
                    }
                },
                onerror: (err) => reject(new Error('请求失败')),
                ontimeout: () => reject(new Error('请求超时'))
            });
        });
    }
    async function jbApiGet(url, params, headers) {
        let lastError;
        for (let i = 0; i < 3; i++) {
            try {
                return await jbApiGetOnce(url, params, headers);
            } catch (e) {
                lastError = e;
                if (i < 2) await new Promise(r => setTimeout(r, 500));
            }
        }
        throw lastError;
    }

    // 外部API 接口
    const jbApi = {
        // 获取热播排行
        async playback(period = 'daily', filterBy = 'high_score') {
            const sign = await jbBuildSignature();
            const url = `${JB_API_BASE}/v1/rankings/playback?period=${period}&filter_by=${filterBy}`;
            const res = await jbApiGet(url, null, { jdSignature: sign });
            return res.data?.movies || [];
        },
        // 获取 Top250
        async top250(type = 'all', typeValue = '', page = 1, limit = 40) {
            const sign = await jbBuildSignature();
            const url = `${JB_API_BASE}/v1/movies/top?start_rank=1&type=${type}&type_value=${encodeURIComponent(typeValue)}&ignore_watched=false&page=${page}&limit=${limit}`;
            const res = await jbApiGet(url, null, {
                'user-agent': 'Dart/3.5 (dart:io)',
                'accept-language': 'zh-TW',
                'host': 'jdforrepam.com',
                authorization: 'Bearer ' + (localStorage.getItem('jb_appAuthorization') || ''),
                jdsignature: sign
            });
            return res;
        },
        // 获取所有评论（分页）—— 照搬 JavdbBuddy：只发 jdSignature，不发 authorization
        async getReviews(movieId, pageNum = 1, pageSize = 20) {
            const sign = await jbBuildSignature();
            const url = `${JB_API_BASE}/v1/movies/${movieId}/reviews`;
            console.log('%c[JB] getReviews 请求:', 'color:#9b59b6;', url, 'movieId:', movieId, 'sign:', sign);
            const res = await jbApiGet(url, { page: pageNum, sort_by: 'hotly', limit: pageSize }, {
                jdSignature: sign
            });
            console.log('%c[JB] getReviews 响应:', 'color:#9b59b6;', res);
            return res.data?.reviews || [];
        },
        // 获取相关清单 —— 照搬 JavdbBuddy：只发 jdSignature，不发 authorization
        async related(movieId, page = 1, limit = 20) {
            const sign = await jbBuildSignature();
            const url = `${JB_API_BASE}/v1/lists/related?movie_id=${movieId}&page=${page}&limit=${limit}`;
            console.log('%c[JB] related 请求:', 'color:#9b59b6;', url, 'movieId:', movieId, 'sign:', sign);
            const res = await jbApiGet(url, null, {
                jdSignature: sign
            });
            console.log('%c[JB] related 响应:', 'color:#9b59b6;', res);
            const dataList = [];
            if (res.data?.lists) {
                res.data.lists.forEach(item => {
                    dataList.push({
                        relatedId: item.id,
                        name: item.name,
                        movieCount: item.movies_count,
                        collectionCount: item.collections_count,
                        viewCount: item.views_count,
                        createTime: item.created_at ? (typeof item.created_at === 'number' ? new Date(item.created_at * 1000).toLocaleDateString('zh-CN') : String(item.created_at)) : ''
                    });
                });
            }
            return dataList;
        },
        // 搜索影片（用于获取 movieId）
        async searchMovie(keyword) {
            const sign = await jbBuildSignature();
            const url = `${JB_API_BASE}/v2/search`;
            const res = await jbApiGet(url, {
                q: keyword, page: 1, type: 'movie', limit: 1,
                movie_type: 'all', from_recent: 'false', movie_filter_by: 'all', movie_sort_by: 'relevance'
            }, {
                'user-agent': 'Dart/3.5 (dart:io)',
                'accept-language': 'zh-TW',
                host: 'jdforrepam.com',
                jdsignature: sign
            });
            return res.data?.movies || [];
        },
        // 获取影片详情
        async getMovieDetail(movieId) {
            const sign = await jbBuildSignature();
            const url = `${JB_API_BASE}/v4/movies/${movieId}`;
            const res = await jbApiGet(url, null, { jdSignature: sign });
            if (!res.data) throw new Error(res.message || '获取详情失败');
            const movie = res.data.movie;
            const imgList = [];
            if (movie.preview_images) {
                movie.preview_images.forEach(item => {
                    imgList.push(item.large_url?.replace(/https:\/\/.*?\/rhe951l4q/g, 'https://c0.jdbstatic.com') || '');
                });
            }
            return {
                movieId: movie.id,
                actors: movie.actors || [],
                duration: movie.duration,
                title: movie.origin_title,
                carNum: movie.number,
                score: movie.score,
                releaseDate: movie.release_date,
                watchedCount: movie.watched_count,
                imgList: imgList
            };
        },
        // 生成电影列表 HTML
        // 照搬 javdb 原生的 .box 卡片结构
        renderMovieListHtml(movies) {
            let html = '';
            movies.forEach(movie => {
                const coverUrl = (movie.cover_url || '').replace(/https:\/\/.*?\/rhe951l4q/g, 'https://c0.jdbstatic.com');
                const tagHtml = movie.has_cnsub ? '<span class="tag is-warning">中字</span>'
                    : (movie.magnets_count > 0 ? '<span class="tag is-success">含磁鏈</span>'
                    : '<span class="tag is-info">无磁链</span>');
                html += `
                <a href="/v/${movie.id}" class="box item" title="${movie.origin_title || movie.number}">
                    <div class="cover">
                        <img loading="lazy" src="${coverUrl}">
                    </div>
                    <div class="video-title"><strong>${movie.number}</strong> ${movie.origin_title || ''}</div>
                    <div class="meta">${movie.release_date || ''}</div>
                    <div class="tags has-addons">${tagHtml}</div>
                </a>`;
            });
            return html;
        }
    };



    // ---------- 免VIP查看热播（原网页方式） ----------
    async function jbHandlePlaybackPage() {
        if (!window.location.href.includes('handlePlayback=1')) return;

        const urlParams = new URLSearchParams(window.location.search);
        const period = urlParams.get('period') || 'daily';

        // 修改页面标题
        const h2 = document.querySelector('h2.section-title');
        if (h2) {
            const firstText = h2.childNodes[0];
            if (firstText && firstText.nodeType === 3) firstText.textContent = '热播';
            h2.style.marginBottom = '0';
        }

        // 清理原页面内容
        document.querySelectorAll('.empty-message, .section .container > .box, #sort-toggle-btn').forEach(el => el.remove());

        const container = document.querySelector('.section .container');
        if (!container || document.querySelector('.jb-playback-loaded')) return;

        // 添加筛选按钮
        const periodNames = { daily: '日榜', weekly: '周榜', monthly: '月榜' };
        let btnHtml = '<div class="buttons has-addons" style="margin-top:18px;margin-bottom:10px;">';
        ['daily', 'weekly', 'monthly'].forEach(p => {
            const isActive = p === period;
            btnHtml += `<a class="button is-small ${isActive ? 'is-info' : ''}" href="/advanced_search?handlePlayback=1&period=${p}" style="padding:8px 18px !important;">${periodNames[p]}</a>`;
        });
        btnHtml += '</div>';
        container.insertAdjacentHTML('beforeend', btnHtml);

        // 添加电影列表容器（使用 javdb 原生的 movie-list 布局，和 JavdbBuddy 一致）
        container.insertAdjacentHTML('beforeend', '<div class="movie-list h cols-4 vcols-8 jb-playback-loaded" style="margin-top:10px;"><div style="text-align:center;padding:40px;color:#999;grid-column:1/-1;">正在加载热播数据...</div></div>');

        try {
            const movies = await jbApi.playback(period);
            const gridEl = container.querySelector('.movie-list.jb-playback-loaded');
            if (!gridEl) return;
            if (movies.length === 0) {
                gridEl.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">暂无数据</div>';
                return;
            }
            gridEl.innerHTML = jbApi.renderMovieListHtml(movies);
        } catch (e) {
            const gridEl = container.querySelector('.movie-list.jb-playback-loaded');
            if (gridEl) gridEl.innerHTML = `<div style="text-align:center;padding:40px;color:#e74c3c;">加载失败: ${e.message}<br><small>请检查网络连接后重试</small></div>`;
        }
    }

    // ---------- Top250 排行榜（原网页方式） ----------
    async function jbHandleTop250Page() {
        if (!window.location.href.includes('handleTop=1')) return;

        const urlParams = new URLSearchParams(window.location.search);
        const handleType = urlParams.get('handleType') || 'all';
        const typeValue = urlParams.get('type_value') || '';
        const page = parseInt(urlParams.get('page')) || 1;

        // 检查是否需要登录，无 token 时先尝试自动登录
        if (!localStorage.getItem('jb_appAuthorization')) {
            const container = document.querySelector('.section .container');
            if (container) {
                container.innerHTML = '<div style="text-align:center;padding:60px;color:#999;font-size:15px;">🔐 Top250 需要登录<br><small style="color:#aaa;">正在尝试自动登录...</small></div>';
            }
            console.log('[JB] Token 不存在，尝试自动登录...');
            (async () => {
                const ok = await jbAutoLogin();
                console.log('[JB] 自动登录结果:', ok);
                if (ok) {
                    window.location.reload();
                } else {
                    jbShowLoginDialog();
                }
            })();
            return;
        }

        // 修改页面标题
        const h2 = document.querySelector('h2.section-title');
        if (h2) {
            const firstText = h2.childNodes[0];
            if (firstText && firstText.nodeType === 3) firstText.textContent = 'Top250';
            h2.style.marginBottom = '0';
        }

        // 清理原页面内容
        document.querySelectorAll('.empty-message, .section .container > .box, #sort-toggle-btn').forEach(el => el.remove());

        const container = document.querySelector('.section .container');
        if (!container || document.querySelector('.jb-top250-loaded')) return;

        // 添加筛选按钮
        const typeBtns = [
            { type: 'all', value: '', label: '全部' },
            { type: 'video_type', value: '0', label: '有码' },
            { type: 'video_type', value: '1', label: '无码' },
            { type: 'video_type', value: '2', label: '欧美' },
            { type: 'video_type', value: '3', label: 'Fc2' },
        ];
        let btnHtml = '<div class="buttons has-addons" style="margin-top:18px;margin-bottom:10px;flex-wrap:wrap;">';
        typeBtns.forEach(b => {
            const isActive = handleType === b.type && typeValue === b.value;
            btnHtml += `<a class="button is-small ${isActive ? 'is-info' : ''}" href="/advanced_search?handleTop=1&handleType=${b.type}&type_value=${b.value}&page=1" style="padding:8px 18px !important;">${b.label}</a>`;
        });
        // 年份按钮
        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year >= 2008; year--) {
            const isActive = handleType === 'year' && typeValue === String(year);
            btnHtml += `<a class="button is-small ${isActive ? 'is-info' : ''}" href="/advanced_search?handleTop=1&handleType=year&type_value=${year}&page=1" style="padding:8px 14px !important;font-size:12px;">${year}</a>`;
        }
        btnHtml += '</div>';
        container.insertAdjacentHTML('beforeend', btnHtml);

        // 添加电影列表容器（使用 javdb 原生的 movie-list 布局，和 JavdbBuddy 一致）
        container.insertAdjacentHTML('beforeend', '<div class="movie-list h cols-4 vcols-8 jb-top250-loaded" style="margin-top:10px;"><div style="text-align:center;padding:40px;color:#999;grid-column:1/-1;">正在加载 Top250 数据...</div></div>');

        // 添加分页
        const maxPage = 5;
        let pagHtml = '<nav class="pagination" style="margin-top:15px;">';
        if (page > 1) {
            pagHtml += `<a class="pagination-previous" href="/advanced_search?handleTop=1&handleType=${handleType}&type_value=${typeValue}&page=${page - 1}">上一页</a>`;
        }
        pagHtml += '<ul class="pagination-list">';
        for (let i = 1; i <= maxPage; i++) {
            const isActive = i === page;
            pagHtml += `<li><a class="pagination-link ${isActive ? 'is-current' : ''}" href="/advanced_search?handleTop=1&handleType=${handleType}&type_value=${typeValue}&page=${i}">${i}</a></li>`;
        }
        pagHtml += '</ul>';
        if (page < maxPage) {
            pagHtml += `<a class="pagination-next" href="/advanced_search?handleTop=1&handleType=${handleType}&type_value=${typeValue}&page=${page + 1}">下一页</a>`;
        }
        pagHtml += '</nav>';
        container.insertAdjacentHTML('beforeend', pagHtml);

        // 请求数据
        try {
            const res = await jbApi.top250(handleType, typeValue, page, 50);
            const gridEl = container.querySelector('.movie-list.jb-top250-loaded');
            if (!gridEl) return;

            if (res.success === 1 && res.data?.movies?.length > 0) {
                gridEl.innerHTML = jbApi.renderMovieListHtml(res.data.movies);
            } else {
                const msg = res.message || '暂无数据';
                gridEl.innerHTML = `<div style="text-align:center;padding:40px;color:#999;grid-column:1/-1;">${msg}</div>`;
                // JWT 验证失败，先尝试自动登录，失败再弹窗
                if (res.action === 'JWTVerificationError') {
                    localStorage.removeItem('jb_appAuthorization');
                    gridEl.innerHTML = '<div style="text-align:center;padding:40px;color:#999;grid-column:1/-1;">登录已过期，正在尝试自动登录...</div>';
                    (async () => {
                        const ok = await jbAutoLogin();
                        if (ok) {
                            window.location.reload();
                        } else {
                            jbShowLoginDialog(true);
                        }
                    })();
                    return;
                }
            }
        } catch (e) {
            const gridEl = container.querySelector('.movie-list.jb-top250-loaded');
            if (gridEl) gridEl.innerHTML = `<div style="text-align:center;padding:40px;color:#e74c3c;">加载失败: ${e.message}</div>`;
        }
    }

    // ---------- 自动登录 ----------
    async function jbAutoLogin() {
        const savedUser = localStorage.getItem('jb_saved_username');
        const savedPass = localStorage.getItem('jb_saved_password');
        if (!savedUser || !savedPass) {
            console.log('[JB] 没有保存的账号密码，无法自动登录');
            return false;
        }

        console.log('[JB] 正在用保存的账号自动登录:', savedUser);
        try {
            const sign = jbBuildSignature();
            const loginUrl = `${JB_API_BASE}/v1/sessions?username=${encodeURIComponent(savedUser)}&password=${encodeURIComponent(savedPass)}&device_uuid=04b9534d-5118-53de-9f87-2ddded77111e&device_name=iPhone&device_model=iPhone&platform=ios&system_version=17.4&app_version=official&app_version_number=1.9.29&app_channel=official`;
            const res = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: loginUrl,
                    headers: {
                        'Content-Type': 'multipart/form-data; boundary=--dio-boundary-2210433284',
                        'user-agent': 'Dart/3.5 (dart:io)',
                        'accept-language': 'zh-TW',
                        'jdSignature': sign
                    },
                    timeout: 15000,
                    onload: (resp) => {
                        console.log('[JB] 登录接口响应状态:', resp.status);
                        try { resolve(JSON.parse(resp.responseText)); }
                        catch (e) { reject(new Error('解析响应失败: ' + (resp.responseText || '').substring(0, 200))); }
                    },
                    onerror: () => reject(new Error('请求失败')),
                    ontimeout: () => reject(new Error('请求超时'))
                });
            });

            console.log('[JB] 登录接口返回:', res);
            if (res.success === 1 && res.data?.token) {
                localStorage.setItem('jb_appAuthorization', res.data.token);
                console.log('[JB] 自动登录成功');
                return true;
            } else {
                console.log('[JB] 自动登录失败:', res.message || '未知错误');
            }
        } catch (e) {
            console.error('[JB] 自动登录异常:', e);
        }
        return false;
    }

    // ---------- Top250 登录对话框 ----------
    function jbShowLoginDialog(autoLoginFailed) {
        const container = document.querySelector('.section .container');
        if (!container) return;

        // 清理页面
        document.querySelectorAll('.empty-message, .section .container > .box, #sort-toggle-btn').forEach(el => el.remove());

        const h2 = document.querySelector('h2.section-title');
        if (h2) {
            const firstText = h2.childNodes[0];
            if (firstText && firstText.nodeType === 3) firstText.textContent = 'Top250';
        }

        if (document.querySelector('.jb-login-panel')) return;

        const savedUser = localStorage.getItem('jb_saved_username') || '';
        const savedPass = localStorage.getItem('jb_saved_password') || '';

        const panel = document.createElement('div');
        panel.className = 'jb-login-panel';
        panel.style.cssText = 'max-width:400px;margin:40px auto;padding:30px;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);';
        panel.innerHTML = `
            <h3 style="margin:0 0 20px 0;color:#333;font-size:18px;text-align:center;">🔐 Top250 需要登录</h3>
            <p style="margin:0 0 15px 0;color:#666;font-size:13px;text-align:center;">该功能依赖移动端接口，请输入 JavDB 账号登录</p>
            ${autoLoginFailed ? '<p style="margin:0 0 15px 0;color:#e74c3c;font-size:13px;text-align:center;">自动登录失败，请手动登录</p>' : ''}
            <div style="margin-bottom:15px;">
                <input type="text" id="jb-login-user" placeholder="用户名 | 邮箱" value="${savedUser.replace(/"/g, '&quot;')}" style="width:100%;padding:12px 15px;border:1px solid #e0e0e0;border-radius:4px;box-sizing:border-box;font-size:14px;background:#f9f9f9;color:#333;">
            </div>
            <div style="margin-bottom:15px;">
                <input type="password" id="jb-login-pass" placeholder="密码" value="${savedPass.replace(/"/g, '&quot;')}" style="width:100%;padding:12px 15px;border:1px solid #e0e0e0;border-radius:4px;box-sizing:border-box;font-size:14px;background:#f9f9f9;color:#333;">
            </div>
            <div style="margin-bottom:15px;display:flex;align-items:center;gap:6px;">
                <input type="checkbox" id="jb-login-remember" checked style="cursor:pointer;">
                <label for="jb-login-remember" style="color:#666;font-size:13px;cursor:pointer;">记住密码（下次自动登录）</label>
            </div>
            <button id="jb-login-btn" style="width:100%;padding:12px;background:#4a8bfc;color:white;border:none;border-radius:4px;font-size:15px;cursor:pointer;">登录</button>
            <div id="jb-login-msg" style="margin-top:10px;text-align:center;color:#e74c3c;font-size:13px;display:none;"></div>
        `;
        container.appendChild(panel);

        document.getElementById('jb-login-btn')?.addEventListener('click', async () => {
            const username = document.getElementById('jb-login-user')?.value?.trim();
            const password = document.getElementById('jb-login-pass')?.value?.trim();
            const remember = document.getElementById('jb-login-remember')?.checked;
            const msgEl = document.getElementById('jb-login-msg');

            if (!username || !password) {
                if (msgEl) { msgEl.textContent = '请输入用户名和密码'; msgEl.style.display = 'block'; }
                return;
            }

            const btn = document.getElementById('jb-login-btn');
            if (btn) { btn.textContent = '登录中...'; btn.disabled = true; }

            try {
                const sign = jbBuildSignature();
                // 照搬 JavdbBuddy 的登录接口：/v1/sessions，参数通过 query string 传递
                const loginUrl = `${JB_API_BASE}/v1/sessions?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&device_uuid=04b9534d-5118-53de-9f87-2ddded77111e&device_name=iPhone&device_model=iPhone&platform=ios&system_version=17.4&app_version=official&app_version_number=1.9.29&app_channel=official`;
                const res = await new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: loginUrl,
                        headers: {
                            'Content-Type': 'multipart/form-data; boundary=--dio-boundary-2210433284',
                            'user-agent': 'Dart/3.5 (dart:io)',
                            'accept-language': 'zh-TW',
                            'jdSignature': sign
                        },
                        timeout: 15000,
                        onload: (resp) => {
                            try { resolve(JSON.parse(resp.responseText)); }
                            catch (e) { reject(new Error('解析响应失败: ' + (resp.responseText || '').substring(0, 200))); }
                        },
                        onerror: () => reject(new Error('请求失败')),
                        ontimeout: () => reject(new Error('请求超时'))
                    });
                });

                if (res.success === 1 && res.data?.token) {
                    localStorage.setItem('jb_appAuthorization', res.data.token);
                    if (remember) {
                        localStorage.setItem('jb_saved_username', username);
                        localStorage.setItem('jb_saved_password', password);
                    } else {
                        localStorage.removeItem('jb_saved_username');
                        localStorage.removeItem('jb_saved_password');
                    }
                    // 登录成功，刷新页面加载 Top250
                    window.location.reload();
                } else {
                    if (msgEl) { msgEl.textContent = res.message || '登录失败'; msgEl.style.display = 'block'; }
                    if (btn) { btn.textContent = '登录'; btn.disabled = false; }
                }
            } catch (e) {
                if (msgEl) { msgEl.textContent = e.message; msgEl.style.display = 'block'; }
                if (btn) { btn.textContent = '登录'; btn.disabled = false; }
            }
        });
    }

    // ---------- FC2PPV 增强 ----------
    function jbEnhanceFC2Page() {
        if (!window.location.href.includes('advanced_search?type=3')) return;
        const h2 = document.querySelector('h2.section-title');
        if (h2) {
            const firstText = h2.childNodes[0];
            if (firstText && firstText.nodeType === 3) {
                firstText.textContent = 'Fc2PPV';
            }
        }
        // 移除空的搜索结果提示，添加 FC2 第三方搜索入口
        const box = document.querySelector('.section .container > .box');
        if (box) box.remove();

        const container = document.querySelector('.section .container');
        if (container && !document.querySelector('.jb-fc2-panel')) {
            const panel = document.createElement('div');
            panel.className = 'jb-fc2-panel';
            panel.style.cssText = 'margin: 15px 0; padding: 15px; background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.1);';
            panel.innerHTML = `
                <h3 style="margin:0 0 12px 0;color:#9b59b6;font-size:16px;">🍑 FC2PPV 第三方资源</h3>
                <p style="margin:0 0 10px 0;color:#666;font-size:13px;">点击下方链接可查看 FC2 影片的详细信息、预览图和磁力链：</p>
                <div style="display:flex;flex-wrap:wrap;gap:8px;">
                    <a href="https://fc2ppvdb.com/" target="_blank" style="padding:8px 16px;background:linear-gradient(135deg,#9b59b6,#8e44ad);color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:bold;">FC2PPVDB</a>
                    <a href="https://adult.contents.fc2.com/" target="_blank" style="padding:8px 16px;background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:bold;">FC2官方</a>
                    <a href="https://123av.com/search?keyword=FC2-PPV" target="_blank" style="padding:8px 16px;background:linear-gradient(135deg,#3498db,#2980b9);color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:bold;">123AV</a>
                </div>
            `;
            container.insertBefore(panel, container.firstChild);
        }
    }

    // ---------- 增强功能启动入口 ----------
    function jbInit() {
        console.log('%c✅ JavdbBuddy 增强功能启动', 'color: #9b59b6; font-size: 14px; font-weight: bold;');

        try { jbAddNavigation(); } catch (e) { console.error('[JB] 导航增强失败:', e); }
        try { jbEnhanceFC2Page(); } catch (e) { console.error('[JB] FC2增强失败:', e); }
        try { jbHandlePlaybackPage(); } catch (e) { console.error('[JB] 热播失败:', e); }
        try { jbHandleTop250Page(); } catch (e) { console.error('[JB] Top250失败:', e); }

        // 详情页：短评 + 相关清单
        if (window.location.pathname.startsWith('/v/')) {
            jbSetupDetailTabs();
        }
    }

    // 设置详情页：短评 + 相关清单
    // 终极方案：彻底禁用 Stimulus movie-tab 控制器，在容器外部创建自定义标签栏
    // 核心修复：移除 data-controller 属性 → Stimulus 触发 disconnect() → 自动清除事件监听器
    function jbSetupDetailTabs() {
        const movieId = window.location.href.split("/").pop().split(/[?#]/)[0];
        if (!movieId) { console.error('[JB] 无法提取 movieId'); return; }
        console.log('%c[JB] movieId:', 'color:#9b59b6;', movieId);

        let retryCount = 0;
        const maxRetries = 80;
        const chk = setInterval(() => {
            retryCount++;
            const originalTabs = document.querySelector('.tabs.no-bottom');
            const tabsContainer = document.getElementById('tabs-container');
            const tabsUl = document.querySelector('.tabs ul');
            if (!originalTabs || !tabsContainer || !tabsUl) {
                if (retryCount >= maxRetries) { clearInterval(chk); console.error('[JB] 标签容器未找到'); }
                return;
            }
            clearInterval(chk);
            console.log('%c[JB] 标签容器就绪', 'color:#9b59b6;');

            // ① 先获取 Stimulus 控制器容器（必须在移除原始标签之前，因为移除后 originalTabs.parentElement 为 null）
            const movieTabContainer = document.querySelector('[data-controller*="movie-tab"]') || originalTabs.parentElement;

            // ② 从原始标签中提取文本信息（保留短评数量等）
            const origLis = tabsUl.querySelectorAll('li');
            let magnetsText = '磁鏈', reviewText = '短評', listsText = '相關清單';
            origLis.forEach(li => {
                const text = li.textContent.trim();
                if (text.includes('磁力') || text.includes('磁链') || text.includes('磁鏈')) magnetsText = text;
                else if (text.includes('短评') || text.includes('短評')) reviewText = text;
                else if (text.includes('相关') || text.includes('相關') || text.includes('清单') || text.includes('清單')) listsText = text;
            });

            // ③ 关键修复：彻底禁用 Stimulus movie-tab 控制器
            // 移除 data-controller 属性 → Stimulus 检测到属性变化 → 调用 disconnect() → 清除所有事件监听器
            // 同时移除所有子元素的 data-action 和 data-movie-tab-target 属性，防止事件委托匹配
            if (movieTabContainer) {
                movieTabContainer.removeAttribute('data-controller');
                movieTabContainer.querySelectorAll('[data-action]').forEach(el => el.removeAttribute('data-action'));
                movieTabContainer.querySelectorAll('[data-movie-tab-target]').forEach(el => el.removeAttribute('data-movie-tab-target'));
                console.log('%c[JB] Stimulus movie-tab 控制器已禁用（disconnect 触发）', 'color:#9b59b6;');
            }

            // ④ 彻底移除原始标签栏（不再仅隐藏，防止任何 JS 操作残留的原始标签）
            originalTabs.remove();
            console.log('%c[JB] 原始标签栏已从 DOM 移除', 'color:#9b59b6;');

            // ⑤ 在 movie-tab 控制器容器【外部】创建自定义标签栏
            // 使用 <span> 替代 <a>，避免 Turbo/Turbolinks 拦截 <a> 标签的点击事件
            const videoDetail = document.querySelector('div.video-detail') || movieTabContainer.parentElement;
            const newTabsBar = document.createElement('div');
            newTabsBar.id = 'jb-custom-tabs';
            newTabsBar.className = 'tabs no-bottom';
            newTabsBar.setAttribute('data-turbo', 'false');
            newTabsBar.setAttribute('data-turbolinks', 'false');
            // 注意：使用 <span> 替代 <a> 避免 Turbo 拦截，
            // 但必须加上 display:block;padding 来模拟 <a> 的样式，否则 JAVDB 的 CSS 不会应用在 span 上
            newTabsBar.innerHTML = `<ul>
                <li class="is-active" data-jb-tab="magnets"><span style="cursor:pointer;display:block;padding:12px 16px;">${magnetsText}</span></li>
                <li data-jb-tab="reviews"><span style="cursor:pointer;display:block;padding:12px 16px;">${reviewText}</span></li>
                <li data-jb-tab="lists"><span style="cursor:pointer;display:block;padding:12px 16px;">${listsText}</span></li>
            </ul>`;
            // 插入到 video-detail 下、movieTabContainer 之前（在 Stimulus 容器外部）
            videoDetail.insertBefore(newTabsBar, movieTabContainer);

            // 注入强制标签高亮样式：JAVDB 原版的 .tabs li.is-active a { border-bottom: 3px solid #0099e8; } 因使用 span 替代 a 而失效，
            // 改为在 li 本身上设置 border-bottom，添加 !important 确保不被覆盖
            const tabStyle = document.createElement('style');
            tabStyle.textContent = `
                #jb-custom-tabs.tabs.no-bottom ul li { border-bottom: 3px solid transparent !important; }
                #jb-custom-tabs.tabs.no-bottom ul li.is-active { border-bottom: 3px solid #0099e8 !important; }
                #jb-custom-tabs.tabs.no-bottom ul li.is-active span { color: #0099e8 !important; font-weight: 700 !important; }
            `;
            document.head.appendChild(tabStyle);
            console.log('%c[JB] 自定义标签栏已创建（在 movie-tab 容器外部，使用 span 替代 a）', 'color:#9b59b6;');

            // ⑥ 创建短评和相关清单的内容面板（插入到 tabs-container 中）
            const reviewPanel = document.getElementById('jb-review-area') || (() => {
                const div = document.createElement('div');
                div.id = 'jb-review-area';
                div.className = 'content-panel';
                div.style.display = 'none';
                tabsContainer.appendChild(div);
                return div;
            })();
            const relatedPanel = document.getElementById('jb-related-area') || (() => {
                const div = document.createElement('div');
                div.id = 'jb-related-area';
                div.className = 'content-panel';
                div.style.display = 'none';
                tabsContainer.appendChild(div);
                return div;
            })();

            // ⑦ 隐藏原始的 #reviews 和 #lists 面板（VIP专用的空面板）
            const origReviews = document.getElementById('reviews');
            const origLists = document.getElementById('lists');
            if (origReviews) origReviews.style.display = 'none';
            if (origLists) origLists.style.display = 'none';

            // ⑧ 懒加载标记
            let reviewsLoaded = false;
            let relatedLoaded = false;





            // ⑨ 标签切换逻辑
            const allNewTabs = newTabsBar.querySelectorAll('li');
            let currentTab = 'magnets'; // 记录当前激活的标签

            function switchTo(tabName) {
                currentTab = tabName;
                allNewTabs.forEach(t => t.classList.remove('is-active'));
                const activeTab = newTabsBar.querySelector(`[data-jb-tab="${tabName}"]`);
                if (activeTab) activeTab.classList.add('is-active');

                // 隐藏所有内容面板
                const magnetsContent = document.getElementById('magnets-content');
                const dualMagnetTabs = tabsContainer.querySelector('.javdb-dual-magnet-tabs');
                const magnetsDiv = document.getElementById('magnets');
                const javbusContainer = document.getElementById('javbus-magnet-container');
                [magnetsContent, dualMagnetTabs, magnetsDiv, javbusContainer, reviewPanel, relatedPanel, origReviews, origLists].forEach(el => {
                    if (el) el.style.display = 'none';
                });
                // 隐藏手动加载按钮
                const loadBtn = tabsContainer.querySelector('button');
                if (loadBtn) loadBtn.style.display = 'none';

                // 显示目标面板
                if (tabName === 'magnets') {
                    if (magnetsContent) magnetsContent.style.display = '';
                    if (dualMagnetTabs) dualMagnetTabs.style.display = '';
                    if (magnetsDiv) magnetsDiv.style.display = '';
                    if (javbusContainer) javbusContainer.style.display = '';
                    if (loadBtn) loadBtn.style.display = '';
                } else if (tabName === 'reviews') {
                    reviewPanel.style.display = 'block';
                    if (!reviewsLoaded) {
                        reviewsLoaded = true;
                        jbLoadReviews(reviewPanel, movieId);
                    }
                } else if (tabName === 'lists') {
                    relatedPanel.style.display = 'block';
                    if (!relatedLoaded) {
                        relatedLoaded = true;
                        jbLoadRelated(relatedPanel, movieId);
                    }
                }

                // 关键修复：延迟校验并强制纠正状态（防止其他 JS handler 覆盖我们的切换）
                forceVerifyState(tabName);
            }

            // 强制校验并纠正标签状态（延迟执行，确保在其他 handler 之后运行）
            // 使用 generation 计数器：只执行最新一次 switchTo 发出的校验，避免旧回调覆盖新切换状态
            let _verifyGen = 0;
            function forceVerifyState(expectedTab) {
                const gen = ++_verifyGen;
                const verify = () => {
                    // 只执行最新一次 switchTo 的校验，跳过旧回调
                    if (gen !== _verifyGen) return;

                    // 检查自定义标签栏的激活状态是否正确
                    const currentActive = newTabsBar.querySelector('li.is-active');
                    if (!currentActive || currentActive.dataset.jbTab !== expectedTab) {
                        console.log(`[JB] 状态被篡改，强制纠正: 期望=${expectedTab}, 实际=${currentActive?.dataset.jbTab}`);
                        allNewTabs.forEach(t => t.classList.remove('is-active'));
                        const correctTab = newTabsBar.querySelector(`[data-jb-tab="${expectedTab}"]`);
                        if (correctTab) correctTab.classList.add('is-active');
                    }

                    // 检查面板可见性是否正确
                    const magnetsDiv = document.getElementById('magnets');
                    if (expectedTab === 'magnets') {
                        if (magnetsDiv && magnetsDiv.style.display === 'none') magnetsDiv.style.display = '';
                        if (reviewPanel && reviewPanel.style.display !== 'none') reviewPanel.style.display = 'none';
                        if (relatedPanel && relatedPanel.style.display !== 'none') relatedPanel.style.display = 'none';
                    } else if (expectedTab === 'reviews') {
                        if (magnetsDiv && magnetsDiv.style.display !== 'none') magnetsDiv.style.display = 'none';
                        if (reviewPanel && reviewPanel.style.display !== 'block') reviewPanel.style.display = 'block';
                        if (relatedPanel && relatedPanel.style.display !== 'none') relatedPanel.style.display = 'none';
                    } else if (expectedTab === 'lists') {
                        if (magnetsDiv && magnetsDiv.style.display !== 'none') magnetsDiv.style.display = 'none';
                        if (reviewPanel && reviewPanel.style.display !== 'none') reviewPanel.style.display = 'none';
                        if (relatedPanel && relatedPanel.style.display !== 'block') relatedPanel.style.display = 'block';
                    }

                    // 隐藏原始残留面板
                    if (origReviews && origReviews.style.display !== 'none') origReviews.style.display = 'none';
                    if (origLists && origLists.style.display !== 'none') origLists.style.display = 'none';
                };

                // 多次延迟校验：10ms, 50ms, 150ms — 确保覆盖各种异步 handler 的时机
                setTimeout(verify, 10);
                setTimeout(verify, 50);
                setTimeout(verify, 150);
            }

            // ⑩ 给自定义标签绑定点击（capture 阶段 + span 冒泡兜底）
            allNewTabs.forEach(li => {
                li.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    if (li.classList.contains('is-active')) return; // 已经是激活标签，不重复切换
                    switchTo(li.dataset.jbTab);
                }, true);
                // span 兜底：防止某些浏览器/框架下 capture 不生效
                const span = li.querySelector('span');
                if (span) {
                    span.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        if (li.classList.contains('is-active')) return; // 已经是激活标签，不重复切换
                        switchTo(li.dataset.jbTab);
                    }, true);
                }
            });

            // ⑪ MutationObserver 监控：确保标签高亮 + 自定义标签栏始终可见 + Stimulus 属性不被恢复
            // 保护 is-active 类不被 JAVDB 原生 JS 移除
            function protectActiveTab() {
                const activeLi = newTabsBar.querySelector('li.is-active');
                if (!activeLi) {
                    // is-active 被完全清除了，恢复之
                    const correctLi = newTabsBar.querySelector(`[data-jb-tab="${currentTab}"]`);
                    if (correctLi) correctLi.classList.add('is-active');
                }
            }
            const observer = new MutationObserver(() => {
                protectActiveTab();
                if (newTabsBar.style.display === 'none') {
                    newTabsBar.style.display = '';
                }
                // 确保 Stimulus controller 属性不会被恢复
                if (movieTabContainer && movieTabContainer.hasAttribute('data-controller')) {
                    movieTabContainer.removeAttribute('data-controller');
                }
                // 确保原始残留面板始终隐藏
                if (origReviews && origReviews.style.display !== 'none') origReviews.style.display = 'none';
                if (origLists && origLists.style.display !== 'none') origLists.style.display = 'none';
            });
            // 监控自定义标签栏的所有属性变化（style + class + 子元素类变化）
            observer.observe(newTabsBar, { attributes: true, subtree: true, attributeFilter: ['style', 'class'] });
            if (movieTabContainer) {
                observer.observe(movieTabContainer, { attributes: true, attributeFilter: ['data-controller'] });
            }
            // 监控原始残留面板的可见性
            if (origReviews) observer.observe(origReviews, { attributes: true, attributeFilter: ['style'] });
            if (origLists) observer.observe(origLists, { attributes: true, attributeFilter: ['style'] });

            console.log('%c[JB] 标签接管完成（Stimulus 已禁用 + 外部自定义标签栏）', 'color:#9b59b6;');
        }, 500);
    }

    // 加载评论 —— 照搬 JavdbBuddy：直接请求外部API，limit=20，底部"加载更多"
    async function jbLoadReviews(panel, movieId) {
        if (!panel) return;
        panel.innerHTML = '<div id="reviewsLoading" style="margin-top:15px;background-color:#ffffff;padding:10px;">获取评论中...</div>';

        let dataList = null;
        try {
            dataList = await Promise.race([
                jbApi.getReviews(movieId, 1, 20),
                new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时')), 15000))
            ]);
        } catch (e) {
            console.error('获取评论失败:', e);
        } finally {
            const loading = panel.querySelector('#reviewsLoading');
            if (loading) loading.remove();
        }

        if (!dataList) {
            panel.innerHTML = `
                <div style="margin-top:15px;background-color:#ffffff;padding:10px;">
                    获取评论失败
                    <a id="retryFetchReviews" href="javascript:;" style="margin-left:10px;color:#1890ff;text-decoration:none;">重试</a>
                </div>
            `;
            const retryBtn = panel.querySelector('#retryFetchReviews');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    jbLoadReviews(panel, movieId);
                });
            }
            return;
        }
        if (dataList.length === 0) {
            panel.innerHTML = '<div style="margin-top:15px;background-color:#ffffff;padding:10px;">无评论</div>';
            return;
        }

        panel.innerHTML = '';
        let floorIndex = 1;
        jbDisplayReviews(dataList, panel, () => floorIndex++);

        // 更新标签上的短评数量
        const reviewTab = document.querySelector('#jb-custom-tabs li[data-jb-tab="reviews"] span');
        if (reviewTab) {
            const total = dataList.length < 20 ? dataList.length : dataList.length + '+';
            reviewTab.textContent = `短評(${total})`;
        }

        const reviewsFooter = document.createElement('div');
        reviewsFooter.id = 'jb-reviews-footer';
        panel.appendChild(reviewsFooter);

        if (dataList.length === 20) {
            reviewsFooter.innerHTML = `
                <button id="loadMoreReviews" style="width:100%;background-color:#e1f5fe;border:none;padding:10px;margin-top:10px;cursor:pointer;color:#0277bd;font-weight:bold;border-radius:4px;">
                    加载更多评论
                </button>
                <div id="reviewsEnd" style="display:none;text-align:center;padding:10px;color:#666;margin-top:10px;">已加载全部评论</div>
            `;
            let currentPage = 1;
            const loadMoreBtn = reviewsFooter.querySelector('#loadMoreReviews');
            loadMoreBtn.addEventListener('click', async () => {
                loadMoreBtn.textContent = '加载中...';
                loadMoreBtn.disabled = true;
                currentPage++;
                let moreData;
                try {
                    moreData = await jbApi.getReviews(movieId, currentPage, 20);
                } catch (e) {
                    console.error('加载更多评论失败:', e);
                } finally {
                    loadMoreBtn.textContent = '加载失败, 请点击重试';
                    loadMoreBtn.disabled = false;
                }
                if (moreData) {
                    jbDisplayReviews(moreData, panel, () => floorIndex++);
                    if (moreData.length < 20) {
                        loadMoreBtn.remove();
                        const endDiv = reviewsFooter.querySelector('#reviewsEnd');
                        if (endDiv) endDiv.style.display = '';
                    } else {
                        loadMoreBtn.textContent = '加载更多评论';
                        loadMoreBtn.disabled = false;
                    }
                }
            });
        } else {
            reviewsFooter.innerHTML = '<div style="text-align:center;padding:10px;color:#666;margin-top:10px;">已加载全部评论</div>';
        }
    }

    function jbDisplayReviews(dataList, container, getFloorIndex) {
        if (!dataList || !dataList.length) return;
        dataList.forEach(item => {
            const starsHtml = Array(item.score || 0).fill('<i class="icon-star"></i>').join('');
            const content = (item.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const dateStr = item.created_at ? new Date(item.created_at * 1000).toLocaleDateString('zh-CN') : '';
            const div = document.createElement('div');
            div.style.cssText = 'display:block;margin-top:6px;background-color:#ffffff;padding:10px;margin-left:-10px;word-break:break-word;position:relative;';
            div.innerHTML = `
                <span style="position:absolute;top:5px;right:10px;color:#999;font-size:12px;">#${getFloorIndex()}楼</span>
                ${(item.username || '匿名').replace(/</g, '&lt;').replace(/>/g, '&gt;')} &nbsp;&nbsp;
                <span class="score-stars" style="color:#f59e0b;">${starsHtml}</span>
                <span style="color:#999;font-size:12px;">${dateStr}</span>
                &nbsp;&nbsp; 点赞:${item.likes_count || 0}
                <p style="margin-top:5px;">${content}</p>
            `;
            container.appendChild(div);
        });
    }

    // 加载相关清单 —— 照搬 JavdbBuddy：直接请求外部API，limit=20，底部"加载更多"
    async function jbLoadRelated(panel, movieId) {
        if (!panel) return;
        panel.innerHTML = '<div id="relatedLoading" style="margin-top:15px;background-color:#ffffff;padding:10px;">获取清单中...</div>';

        let dataList = null;
        try {
            dataList = await Promise.race([
                jbApi.related(movieId, 1, 20),
                new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时')), 15000))
            ]);
        } catch (e) {
            console.error('获取清单失败:', e);
        } finally {
            const loading = panel.querySelector('#relatedLoading');
            if (loading) loading.remove();
        }

        if (!dataList) {
            panel.innerHTML = `
                <div style="margin-top:15px;background-color:#ffffff;padding:10px;">
                    获取清单失败
                    <a id="retryFetchRelateds" href="javascript:;" style="margin-left:10px;color:#1890ff;text-decoration:none;">重试</a>
                </div>
            `;
            const retryBtn = panel.querySelector('#retryFetchRelateds');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    jbLoadRelated(panel, movieId);
                });
            }
            return;
        }
        if (dataList.length === 0) {
            panel.innerHTML = '<div style="margin-top:15px;background-color:#ffffff;padding:10px;">无清单</div>';
            return;
        }

        panel.innerHTML = '';
        let floorIndex = 1;
        jbDisplayRelateds(dataList, panel, () => floorIndex++);

        const relatedFooter = document.createElement('div');
        relatedFooter.id = 'jb-related-footer';
        panel.appendChild(relatedFooter);

        if (dataList.length === 20) {
            relatedFooter.innerHTML = `
                <button id="loadMoreRelateds" style="width:100%;background-color:#e1f5fe;border:none;padding:10px;margin-top:10px;cursor:pointer;color:#0277bd;font-weight:bold;border-radius:4px;">
                    加载更多清单
                </button>
                <div id="relatedEnd" style="display:none;text-align:center;padding:10px;color:#666;margin-top:10px;">已加载全部清单</div>
            `;
            let currentPage = 1;
            const loadMoreBtn = relatedFooter.querySelector('#loadMoreRelateds');
            loadMoreBtn.addEventListener('click', async () => {
                loadMoreBtn.textContent = '加载中...';
                loadMoreBtn.disabled = true;
                currentPage++;
                let moreData;
                try {
                    moreData = await jbApi.related(movieId, currentPage, 20);
                } catch (e) {
                    console.error('加载更多清单失败:', e);
                } finally {
                    loadMoreBtn.textContent = '加载失败, 请点击重试';
                    loadMoreBtn.disabled = false;
                }
                if (moreData) {
                    jbDisplayRelateds(moreData, panel, () => floorIndex++);
                    if (moreData.length < 20) {
                        loadMoreBtn.remove();
                        const endDiv = relatedFooter.querySelector('#relatedEnd');
                        if (endDiv) endDiv.style.display = '';
                    } else {
                        loadMoreBtn.textContent = '加载更多清单';
                        loadMoreBtn.disabled = false;
                    }
                }
            });
        } else {
            relatedFooter.innerHTML = '<div style="text-align:center;padding:10px;color:#666;margin-top:10px;">已加载全部清单</div>';
        }
    }

    function jbDisplayRelateds(dataList, container, getFloorIndex) {
        if (!dataList || !dataList.length) return;
        dataList.forEach(item => {
            const div = document.createElement('div');
            div.style.cssText = 'display:block;margin-top:6px;background-color:#ffffff;padding:10px;margin-left:-10px;word-break:break-word;position:relative;';
            div.innerHTML = `
                <span style="position:absolute;top:5px;right:10px;color:#999;font-size:12px;">#${getFloorIndex()}</span>
                <span style="position:absolute;bottom:5px;right:10px;color:#999;font-size:12px;">创建时间: ${item.createTime || ''}</span>
                <p><a href="/lists/${item.relatedId}" target="_blank" style="color:#2e8abb">${(item.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</a></p>
                <p style="margin-top:5px;">视频个数: ${item.movieCount || 0}</p>
                <p style="margin-top:5px;">收藏次数: ${item.collectionCount || 0} 被查看次数: ${item.viewCount || 0}</p>
            `;
            container.appendChild(div);
        });
    }

    // ========== [新增] 列表页链接在新窗口打开 ==========
    function applyListPageLinkTarget() {
        const enabled = GM_getValue('jb_open_in_new_tab', false);
        document.querySelectorAll('.grid-item > a[href^="/v/"], .movie-list .item > a[href^="/v/"]').forEach(link => {
            if (enabled) {
                link.setAttribute('target', '_blank');
            } else {
                link.removeAttribute('target');
            }
        });
    }

    // ========== [新增] 所有链接在新窗口打开 ==========
    function applyAllLinksTarget() {
        const enabled = GM_getValue('jb_open_all_links_in_new_tab', false);
        document.querySelectorAll('a[href]:not([target]):not([href^="javascript:"]):not([href^="#"])').forEach(link => {
            if (enabled) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            } else {
                link.removeAttribute('target');
                link.removeAttribute('rel');
            }
        });
    }

    // ========== [新增] 弹窗方式打开详情页 ==========
    function showPopupModal(url) {
        if (document.getElementById('jb-popup-overlay')) {
            document.getElementById('jb-popup-overlay').remove();
        }
        const overlay = document.createElement('div');
        overlay.id = 'jb-popup-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(5px);';
        overlay.innerHTML = `
            <div style="background:white;width:90%;height:90%;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
                <div style="padding:10px 15px;background:#f8f9fa;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
                    <span style="font-weight:bold;font-size:14px;color:#333;">详情页弹窗</span>
                    <span id="jb-popup-close" style="cursor:pointer;font-size:24px;color:#999;line-height:1;">&times;</span>
                </div>
                <div style="flex:1;position:relative;overflow:hidden;">
                    <iframe src="${url}" style="width:100%;height:100%;border:none;" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"></iframe>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.querySelector('#jb-popup-close').onclick = () => overlay.remove();
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }

    function applyListPagePopup() {
        const enabled = GM_getValue('jb_open_in_popup', false);
        document.querySelectorAll('.grid-item > a[href^="/v/"], .movie-list .item > a[href^="/v/"]').forEach(link => {
            if (link.dataset.jbPopupBound) return;
            link.dataset.jbPopupBound = '1';
            link.addEventListener('click', function popupHandler(e) {
                if (GM_getValue('jb_open_in_popup', false)) {
                    e.preventDefault();
                    e.stopPropagation();
                    showPopupModal(link.href);
                }
            });
        });
    }

    // ========== [新增] 悬浮封面放大 ==========
    function initHoverZoom() {
        if (!GM_getValue('jb_enable_hover_zoom', false)) return;
        if (document.getElementById('jb-hover-zoom-el')) return;

        const zoomImg = document.createElement('img');
        zoomImg.id = 'jb-hover-zoom-el';
        zoomImg.className = 'jb-hover-zoom-img';
        document.body.appendChild(zoomImg);

        let currentSrc = '';

        document.addEventListener('mouseover', (e) => {
            const cover = e.target.closest('.grid-item .cover img, .grid-item .cover-image img, .grid-item img[src*="/covers/"], .movie-list .item .cover img, .movie-list .item .cover-image img, .movie-list .item img[src*="/covers/"]');
            if (!cover) {
                // 鼠标移到非封面图区域时隐藏放大图
                if (currentSrc) {
                    currentSrc = '';
                    zoomImg.classList.remove('visible');
                }
                return;
            }
            let src = cover.getAttribute('data-src') || cover.getAttribute('src') || '';
            if (!src) return;
            // 尝试获取高清图：去掉缩略图后缀和尺寸参数
            src = src.replace(/_s(\.[^.]+)$/, '$1').replace(/\?w=\d+&h=\d+/, '').replace(/\?width=\d+&height=\d+/, '');
            currentSrc = src;
            zoomImg.src = src;
            zoomImg.classList.add('visible');
        });

        document.addEventListener('mousemove', (e) => {
            if (!currentSrc) return;
            // 检查鼠标当前位置是否仍在封面图上，防止封面图之间的空隙导致放大图不消失
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const stillOnCover = el && el.closest('.grid-item .cover img, .grid-item .cover-image img, .grid-item img[src*="/covers/"], .movie-list .item .cover img, .movie-list .item .cover-image img, .movie-list .item img[src*="/covers/"]');
            if (!stillOnCover) {
                currentSrc = '';
                zoomImg.classList.remove('visible');
                return;
            }
            // 获取图片实际渲染尺寸（考虑 CSS max-width/max-height 和 scale）
            const imgW = zoomImg.offsetWidth || 650;
            const imgH = zoomImg.offsetHeight || 930;
            const margin = 15;
            let x = e.clientX + 20;
            let y = e.clientY + 20;
            // 如果右侧超出浏览器边界，显示在鼠标左侧
            if (x + imgW + margin > window.innerWidth) {
                x = e.clientX - imgW - 20;
            }
            // 如果底部超出浏览器边界，显示在鼠标上方
            if (y + imgH + margin > window.innerHeight) {
                y = e.clientY - imgH - 20;
            }
            // 确保不超出左边界和上边界
            x = Math.max(margin, x);
            y = Math.max(margin, y);
            // 再次检查右下边界（窗口缩小时）
            x = Math.min(x, window.innerWidth - imgW - margin);
            y = Math.min(y, window.innerHeight - imgH - margin);
            zoomImg.style.left = x + 'px';
            zoomImg.style.top = y + 'px';
        });

        document.addEventListener('mouseout', (e) => {
            const cover = e.target.closest('.grid-item .cover img, .grid-item .cover-image img, .grid-item img[src*="/covers/"], .movie-list .item .cover img, .movie-list .item .cover-image img, .movie-list .item img[src*="/covers/"]');
            if (!cover) return;
            currentSrc = '';
            zoomImg.classList.remove('visible');
        });
    }

    // ========== [新增] WebDAV 备份与恢复 ==========
    function prepareWebDAVUrl(rawUrl) {
        let url = rawUrl.replace(/\/$/, '');
        if (!url) return url;
        // 对中文路径进行编码（保留 : / 等保留字符）
        url = encodeURI(url);
        // Alist 智能修正：默认端口5244且路径缺少 /dav/ 时自动补全
        if (url.includes(':5244') && !url.includes('/dav/')) {
            url = url.replace(/(:\/\/[^/]+)(\/|$)/, '$1/dav$2');
        }
        return url;
    }

    async function testWebDAVConnection() {
        const rawUrl = GM_getValue('jb_webdav_url', '');
        const user = GM_getValue('jb_webdav_user', '');
        const pass = GM_getValue('jb_webdav_pass', '');
        if (!rawUrl || !user) return { success: false, message: '配置不完整' };

        const url = prepareWebDAVUrl(rawUrl);
        const auth = btoa(user + ':' + pass);

        // 先尝试 PROPFIND（WebDAV 标准检测目录方法）
        try {
            await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'PROPFIND',
                    url: url + '/',
                    headers: {
                        'Authorization': 'Basic ' + auth,
                        'Depth': '0'
                    },
                    timeout: 10000,
                    onload: (resp) => {
                        if (resp.status === 207 || (resp.status >= 200 && resp.status < 300)) resolve();
                        else reject(new Error('HTTP ' + resp.status));
                    },
                    onerror: () => reject(new Error('请求失败')),
                    ontimeout: () => reject(new Error('超时'))
                });
            });
            return { success: true, message: '连接成功' };
        } catch (e) {
            // PROPFIND 不支持（如部分 Alist），fallback 到 GET 备份文件（200/404 都算通）
            try {
                await new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: url + '/javdb-buddy-backup.json',
                        headers: {
                            'Authorization': 'Basic ' + auth
                        },
                        timeout: 10000,
                        onload: (resp) => {
                            if (resp.status === 200 || resp.status === 404) resolve();
                            else reject(new Error('HTTP ' + resp.status));
                        },
                        onerror: () => reject(new Error('请求失败')),
                        ontimeout: () => reject(new Error('超时'))
                    });
                });
                return { success: true, message: '连接成功' };
            } catch (e2) {
                console.error('[JBD] WebDAV 测试连接失败:', e2, '请求URL:', url + '/');
                return { success: false, message: e2.message || '未知错误' };
            }
        }
    }

    async function backupToWebDAV() {
        const rawUrl = GM_getValue('jb_webdav_url', '');
        const user = GM_getValue('jb_webdav_user', '');
        const pass = GM_getValue('jb_webdav_pass', '');
        if (!rawUrl || !user) return { success: false, message: '配置不完整' };

        const url = prepareWebDAVUrl(rawUrl);
        const config = {
            servers: getServers(),
            libraryIndex: LIBRARY_INDEX,
            jellyfinLibraryIndex: JELLYFIN_LIBRARY_INDEX,
            lastSyncTime: LAST_SYNC_TIME,
            jellyfinLastSyncTime: JELLYFIN_LAST_SYNC_TIME,
            backupTime: new Date().toISOString()
        };
        const json = JSON.stringify(config, null, 2);
        const auth = btoa(user + ':' + pass);

        try {
            await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'PUT',
                    url: url + '/javdb-buddy-backup.json',
                    headers: {
                        'Authorization': 'Basic ' + auth,
                        'Content-Type': 'application/octet-stream'
                    },
                    data: json,
                    timeout: 20000,
                    onload: (resp) => {
                        if (resp.status >= 200 && resp.status < 300) resolve();
                        else reject(new Error('HTTP ' + resp.status + ' | URL: ' + url + '/javdb-buddy-backup.json'));
                    },
                    onerror: (err) => reject(new Error('请求失败: ' + (err && err.error ? err.error : '未知错误'))),
                    ontimeout: () => reject(new Error('超时'))
                });
            });
            return { success: true, message: '备份成功' };
        } catch (e) {
            console.error('[JBD] WebDAV 备份失败:', e, '请求URL:', url + '/javdb-buddy-backup.json');
            let msg = e.message || '未知错误';
            if (msg.includes('405')) {
                msg += '（Alist 用户请检查地址是否包含 /dav/ 路径）';
            }
            return { success: false, message: msg };
        }
    }

    async function restoreFromWebDAV() {
        const rawUrl = GM_getValue('jb_webdav_url', '');
        const user = GM_getValue('jb_webdav_user', '');
        const pass = GM_getValue('jb_webdav_pass', '');
        if (!rawUrl || !user) return { success: false, message: '配置不完整' };

        const url = prepareWebDAVUrl(rawUrl);
        const auth = btoa(user + ':' + pass);
        try {
            const text = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url + '/javdb-buddy-backup.json',
                    headers: {
                        'Authorization': 'Basic ' + auth
                    },
                    timeout: 20000,
                    onload: (resp) => {
                        if (resp.status >= 200 && resp.status < 300) resolve(resp.responseText);
                        else reject(new Error('HTTP ' + resp.status));
                    },
                    onerror: () => reject(new Error('请求失败')),
                    ontimeout: () => reject(new Error('超时'))
                });
            });
            const config = JSON.parse(text);
            if (config.servers) {
                GM_setValue('emby_servers', JSON.stringify(config.servers));
            }
            if (config.libraryIndex) {
                GM_setValue('emby_library_index', JSON.stringify(config.libraryIndex));
                LIBRARY_INDEX = config.libraryIndex;
            }
            if (config.jellyfinLibraryIndex) {
                GM_setValue('jellyfin_library_index', JSON.stringify(config.jellyfinLibraryIndex));
                JELLYFIN_LIBRARY_INDEX = config.jellyfinLibraryIndex;
            }
            if (config.lastSyncTime) {
                GM_setValue('emby_last_sync', config.lastSyncTime);
                LAST_SYNC_TIME = config.lastSyncTime;
            }
            if (config.jellyfinLastSyncTime) {
                GM_setValue('jellyfin_last_sync', config.jellyfinLastSyncTime);
                JELLYFIN_LAST_SYNC_TIME = config.jellyfinLastSyncTime;
            }
            return { success: true, message: '恢复成功' };
        } catch (e) {
            console.error('[JBD] WebDAV 恢复失败:', e, '请求URL:', url + '/javdb-buddy-backup.json');
            let msg = e.message || '未知错误';
            if (msg.includes('405')) {
                msg += '（Alist 用户请检查地址是否包含 /dav/ 路径）';
            }
            return { success: false, message: msg };
        }
    }

    // 将设置对话框暴露到全局，供 initMainScript 外部访问
    window.showSettingsDialog = showSettingsDialog;

    // ========== [新增] 打赏弹窗 ==========
    function showDonateDialog() {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9999999;display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML = `
            <div style="background:white;padding:25px;border-radius:8px;max-width:520px;width:90%;text-align:center;font-family:sans-serif;">
                <h3 style="margin:0 0 10px 0;color:#333;">💖 感谢支持</h3>
                <p style="margin:0 0 15px 0;color:#666;font-size:13px;">如果觉得脚本好用，欢迎打赏一杯咖啡 ☕</p>
                <div style="display:flex;justify-content:center;gap:20px;flex-wrap:wrap;">
                    <div>
                        <img src="https://raw.githubusercontent.com/86168057/JavdbBuddy/main/%E6%94%B6%E6%AC%BE%E4%BA%8C%E7%BB%B4%E7%A0%81/%E5%BE%AE%E4%BF%A1%E6%94%B6%E6%AC%BE%E4%BA%8C%E7%BB%B4%E7%A0%81.png" style="width:200px;height:200px;object-fit:contain;border:1px solid #eee;border-radius:4px;" alt="微信">
                        <p style="margin:5px 0 0 0;color:#666;font-size:12px;">微信</p>
                    </div>
                    <div>
                        <img src="https://raw.githubusercontent.com/86168057/JavdbBuddy/main/%E6%94%B6%E6%AC%BE%E4%BA%8C%E7%BB%B4%E7%A0%81/%E6%94%AF%E4%BB%98%E5%AE%9D%E6%94%B6%E6%AC%BE%E4%BA%8C%E7%BB%B4%E7%A0%81.png" style="width:200px;height:200px;object-fit:contain;border:1px solid #eee;border-radius:4px;" alt="支付宝">
                        <p style="margin:5px 0 0 0;color:#666;font-size:12px;">支付宝</p>
                    </div>
                </div>
                <div style="margin-top:20px;display:flex;justify-content:center;gap:20px;flex-wrap:wrap;">
                    <a href="https://greasyfork.org/scripts?q=JavdbBuddy" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:#f7f7f7;border:1px solid #ddd;border-radius:4px;color:#333;text-decoration:none;font-size:13px;transition:all 0.2s;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                        <span>油猴脚本</span>
                    </a>
                    <a href="https://github.com/86168057/JavdbBuddy" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:#f7f7f7;border:1px solid #ddd;border-radius:4px;color:#333;text-decoration:none;font-size:13px;transition:all 0.2s;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"></path></svg>
                        <span>GitHub 仓库</span>
                    </a>
                </div>
                <button id="jb-donate-close" style="margin-top:20px;background:#666;color:white;border:none;padding:8px 30px;border-radius:4px;cursor:pointer;">关闭</button>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        document.getElementById('jb-donate-close')?.addEventListener('click', () => overlay.remove());
    }

    // 延迟启动增强功能
    // 缩短启动延迟，配合 setInterval 轮询即可在 DOM 就绪后尽快创建自定义标签
    // 同时临时禁用原始标签点击（仅限制无 id 的 .tabs.no-bottom，不影响自定义标签）
    (document.head || document.documentElement).appendChild(Object.assign(document.createElement('style'), {
        textContent: '.tabs.no-bottom:not(#jb-custom-tabs) { pointer-events: none; }'
    }));
    const isSpecialPage2 = window.location.search.includes('handlePlayback=1') || window.location.search.includes('handleTop=1') || window.location.search.includes('type=3');
    setTimeout(jbInit, isSpecialPage2 ? 100 : 100);

        window.__jb_init_done = true;
        console.log('[JB] initMainScript 执行完成');
    } catch (initErr) {
        console.error('[JB] initMainScript 执行出错:', initErr);
        // 不设置 __jb_init_done，允许下次重试
    }
    } // initMainScript 函数结束

})();
