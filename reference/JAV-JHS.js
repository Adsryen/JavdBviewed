// ==UserScript==
// @name         JAV-JHS
// @namespace    https://sleazyfork.org/zh-CN/scripts/533695-jav-jhs
// @version      2.6.9
// @author       xie bro
// @description  Jav-鉴黄师 收藏、屏蔽、标记已下载; 免VIP查看热榜、Top250排行榜、Fc2ppv等数据; 可查看所有评论信息; 支持云盘备份; 以图识图; 字幕搜索; JavBus|JavDb
// @license      MIT
// @icon         https://www.google.com/s2/favicons?sz=64&domain=javdb.com
// @match        https://javdb.com/*
// @match        https://www.javbus.com/*
// @include      https://javdb.com/*
// @include      https://115.com/*
// @include      https://javdb*.com/*
// @include      https://www.javbus.com/*
// @include      https://*bus*/*
// @include      https://*javsee*/*
// @include      https://*seejav*/*
// @include      https://javtrailers.com/*
// @include      https://subtitlecat.com/*
// @include      https://www.aliyundrive.com/*
// @include      https://www.alipan.com/*
// @include      https://5masterzzz.site/*
// @exclude      https://www.javbus.com/forum/*
// @exclude      https://www.javbus.com/*actresses
// @require      data:application/javascript,;(function%20hookBody()%20%7B%20try%20%7B%20if%20(document.readyState%20!%3D%3D%20%22loading%22)%20%7B%20return%3B%20%7D%20const%20initialHideStyle%20%3D%20document.createElement(%22style%22)%3B%20initialHideStyle.textContent%20%3D%20%60%20body%3A%3Abefore%20%7B%20content%3A%20%22%22%3B%20position%3A%20fixed%3B%20top%3A%200%3B%20left%3A%200%3B%20width%3A%20100%25%3B%20height%3A%20100%25%3B%20z-index%3A%209999999999%3B%20pointer-events%3A%20auto%3B%20display%3A%20block%3B%20%7D%20body.script-ready%3A%3Abefore%20%7B%20display%3A%20none%3B%20pointer-events%3A%20none%3B%20%7D%20%60%3B%20document.head.appendChild(initialHideStyle)%3B%20if%20(window.location.href.includes(%22hideNav%3D1%22))%20%7B%20const%20pollInterval%20%3D%20setInterval(()%20%3D%3E%20%7B%20const%20searchBar%20%3D%20document.querySelector(%22%23search-bar-container%22)%3B%20if%20(searchBar%20%26%26%20window.getComputedStyle(searchBar).display%20%3D%3D%3D%20%22none%22)%20%7B%20document.body.classList.add(%22script-ready%22)%3B%20clearInterval(pollInterval)%3B%20%7D%20const%20navBarDefault%20%3D%20document.querySelector(%22.navbar-default%22)%3B%20if%20(navBarDefault%20%26%26%20window.getComputedStyle(navBarDefault).display%20%3D%3D%3D%20%22none%22)%20%7B%20document.body.classList.add(%22script-ready%22)%3B%20clearInterval(pollInterval)%3B%20%7D%20%7D%2C%20200)%3B%20%7D%20else%20%7B%20setTimeout(()%20%3D%3E%20%7B%20document.body.classList.add(%22script-ready%22)%3B%20%7D%2C%201e3)%3B%20%7D%20%7D%20catch%20(e)%20%7B%20console.error(%22%5Cu6CE8%5Cu5165body%5Cu5931%5Cu8D25%22%2C%20e)%3B%20%7D%20%7D)()%3B
// @require      https://update.greasyfork.org/scripts/540597/1613170/parallel_GM_xmlhttpRequest.js
// @require      https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js
// @require      https://cdn.jsdelivr.net/npm/layui-layer@1.0.9/dist/layer.min.js
// @require      https://cdn.jsdelivr.net/npm/blueimp-md5@2.19.0/js/md5.min.js
// @require      https://cdn.jsdelivr.net/npm/toastify-js@1.12.0/src/toastify.min.js
// @require      https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js
// @require      https://cdn.jsdelivr.net/npm/viewerjs@1.11.1/dist/viewer.min.js
// @require      https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js
// @connect      xunlei.com
// @connect      geilijiasu.com
// @connect      aliyundrive.com
// @connect      aliyundrive.net
// @connect      ja.wikipedia.org
// @connect      beta.magnet.pics
// @connect      jdforrepam.com
// @connect      cc3001.dmm.co.jp
// @connect      cc3001.dmm.com
// @connect      www.dmm.co.jp
// @connect      special.dmm.co.jp
// @connect      adult.contents.fc2.com
// @connect      fc2ppvdb.com
// @connect      123av.com
// @connect      u3c3.com
// @connect      btsow.lol
// @connect      sukebei.nyaa.si
// @connect      javstore.net
// @connect      3xplanet.com
// @connect      javbest.net
// @connect      missav.live
// @connect      jable.tv
// @connect      www.av.gl
// @connect      javtrailers.com
// @connect      javdb.com
// @connect      javbus.com
// @connect      115.com
// @connect      *
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        unsafeWindow
// @run-at       document-start
// @downloadURL https://update.sleazyfork.org/scripts/533695/JAV-JHS.user.js
// @updateURL https://update.sleazyfork.org/scripts/533695/JAV-JHS.meta.js
// ==/UserScript==

var t, e, n, a, i, s = Object.defineProperty, o = t => {
    throw TypeError(t);
}, r = (t, e, n) => ((t, e, n) => e in t ? s(t, e, {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: n
}) : t[e] = n)(t, "symbol" != typeof e ? e + "" : e, n), l = (t, e, n) => e.has(t) ? o("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, n), c = (t, e, n) => (((t, e, n) => {
    e.has(t) || o("Cannot " + n);
})(t, e, "access private method"), n);

const d = window.location.href, h = d.includes("javdb"), g = d.includes("javbus") || d.includes("seejav") || d.includes("bus") || d.includes("javsee"), p = d.includes("/search?q") || d.includes("/search/") || d.includes("/users/"), m = "filter", u = "favorite", f = "hasDown", v = "hasWatch", w = "🚫 屏蔽", b = "🚫 已屏蔽", y = "#de3333", x = "⭐ 收藏", k = "⭐ 已收藏", S = "#25b1dc", C = "📥️ 已下载", _ = "#7bc73b", P = "🔍 已观看", B = "#d7a80c", I = "no", D = "yes", M = [ {
    id: "video-mmb",
    quality: "mmb",
    text: "中画质 (432p)"
}, {
    id: "video-mhb",
    quality: "mhb",
    text: "高画质 (576p)"
}, {
    id: "video-hmb",
    quality: "hmb",
    text: "HD (720p)"
}, {
    id: "video-hhb",
    quality: "hhb",
    text: "FullHD (1080p)"
}, {
    id: "video-hhbs",
    quality: "hhbs",
    text: "FullHD (1080p60fps)"
}, {
    id: "video-4k",
    quality: "4k",
    text: "4K (2160p)"
}, {
    id: "video-4ks",
    quality: "4ks",
    text: "4K (2160p60fps)"
} ];

let T = "";

window.location.href.includes("hideNav=1") && (T = "\n         .navbar-default {\n            display: none !important;\n        }\n        body {\n            padding-top:0px!important;\n        }\n    ");

const A = `\n<style>\n    \n    ${T}\n\n    .masonry {\n        height: 100% !important;\n        width: 100% !important;\n        padding: 0 15px !important;\n    }\n    .masonry {\n        display: grid;\n        column-gap: 10px; /* 列间距*/\n        row-gap: 10px; /* 行间距 */\n        grid-template-columns: repeat(4, minmax(0, 1fr));\n    }\n    .masonry .item {\n        /*position: initial !important;*/\n        top: initial !important;\n        left: initial !important;\n        float: none !important;\n        background-color:#c4b1b1;\n        position: relative !important;\n    }\n    \n    .masonry .item:hover {\n        box-shadow: 0 .5em 1em -.125em rgba(10, 10, 10, .1), 0 0 0 1px #485fc7;\n    }\n    .masonry .movie-box{\n        width: 100% !important;\n        height: 100% !important;\n        margin: 0 !important;\n        overflow: inherit !important;\n    }\n    .masonry .movie-box .photo-frame {\n        /*height: 70% !important;*/\n        height:auto !important;\n        margin: 0 !important;\n        position:relative; /* 方便预览视频定位*/\n    }\n    .masonry .movie-box img {\n        max-height: 500px;\n        height: 100% !important;\n        object-fit: contain;\n        object-position: top;\n    }\n    .masonry .movie-box img:hover {\n      transform: scale(1.04);\n      transition: transform 0.3s;\n    }\n    .masonry .photo-info{\n        /*height: 30% !important;*/\n    }\n    .masonry .photo-info span {\n      display: inline-block; /* 或者 block */\n      max-width: 100%;      /* 根据父容器限制宽度 */\n      white-space: nowrap;  /* 禁止换行 */\n      overflow: hidden;     /* 隐藏溢出内容 */\n      text-overflow: ellipsis; /* 显示省略号 */\n    }\n    \n    /* 无码页面的样式 */\n    .photo-frame .mheyzo,\n    .photo-frame .mcaribbeancom2{\n        margin-left: 0 !important;\n    }\n    .avatar-box{\n        width: 100% !important;\n        display: flex !important;\n        margin:0 !important;\n    }\n    .avatar-box .photo-info{\n        display: flex;\n        justify-content: center;\n        align-items: center;\n        gap: 30px;\n        flex-direction: row;\n        background-color:#fff !important;\n    }\n    /*.photo-info .item-tag{\n        position: relative;\n    }*/\n    footer,#related-waterfall{\n        display: none!important;\n    }\n    \n        \n    .video-title {\n        display: -webkit-box !important;\n        -webkit-box-orient: vertical;\n        -webkit-line-clamp: 2;  /* 限制显示2行 */\n        white-space: normal !important;\n        margin-bottom: 5px;\n    }\n    \n</style>\n`;

let L = "";

window.location.href.includes("hideNav=1") && (L = "\n        .main-nav,#search-bar-container {\n            display: none !important;\n        }\n        \n        html {\n            padding-top:0px!important;\n        }\n    ");

const E = `\n<style>\n    ${L}\n    \n    .navbar {\n        z-index: 12345679 !important;\n        padding: 0 0;\n    }\n    \n    .navbar-link:not(.is-arrowless) {\n        padding-right: 33px;\n    }\n    \n    .sub-header,\n    /*#search-bar-container, !*搜索框*!*/\n    #footer,\n    /*.search-recent-keywords, !*搜索框底部热搜词条*!*/\n    .app-desktop-banner,\n    div[data-controller="movie-tab"] .tabs,\n    h3.main-title,\n    div.video-detail > div:nth-child(4) > div > div.tabs.no-bottom > ul > li:nth-child(3), /* 相关清单*/\n    div.video-detail > div:nth-child(4) > div > div.tabs.no-bottom > ul > li:nth-child(2), /* 短评按钮*/\n    div.video-detail > div:nth-child(4) > div > div.tabs.no-bottom > ul > li:nth-child(1), /*磁力面板 按钮*/\n    .top-meta,\n    .float-buttons {\n        display: none !important;\n    }\n    \n    div.tabs.no-bottom,\n    .tabs ul {\n        border-bottom: none !important;\n    }\n    \n    \n    /* 视频列表项 相对相对 方便标签绝对定位*/\n    .movie-list .item {\n        position: relative !important;\n    }\n    \n    .video-title {\n      display: -webkit-box;\n      -webkit-box-orient: vertical;\n      -webkit-line-clamp: 2;  /* 限制显示2行 */\n      white-space: normal !important;\n    }\n</style>\n`;

function H(t) {
    if (t) if (t.includes("<style>")) document.head.insertAdjacentHTML("beforeend", t); else {
        const e = document.createElement("style");
        e.textContent = t, document.head.appendChild(e);
    }
}

g && H(A), h && H(E), H("\n<style>\n    .a-primary, /* 主按钮 - 浅蓝色 */\n    .a-success, /* 成功按钮 - 浅绿色 */\n    .a-danger, /* 危险按钮 - 浅粉色 */\n    .a-warning, /* 警告按钮 - 浅橙色 */\n    .a-info, /* 信息按钮 - 浅青色 */\n    .a-dark, /* 深色按钮 - 改为中等灰色（保持浅色系中的对比） */\n    .a-outline, /* 轮廓按钮 - 浅灰色边框 */\n    .a-disabled /* 禁用按钮 - 极浅灰色 */\n    {\n        display: inline-flex;\n        align-items: center;\n        justify-content: center;\n        padding: 6px 14px;\n        margin-left: 10px;\n        border-radius: 6px;\n        text-decoration: none;\n        font-size: 13px;\n        font-weight: 500;\n        transition: all 0.2s ease;\n        cursor: pointer;\n        border: 1px solid rgba(0, 0, 0, 0.08);\n        white-space: nowrap;\n    }\n    \n    .a-primary {\n        background: #e0f2fe;\n        color: #0369a1;\n        border-color: #bae6fd;\n    }\n    \n    .a-primary:hover {\n        background: #bae6fd;\n    }\n    \n    .a-success {\n        background: #dcfce7;\n        color: #166534;\n        border-color: #bbf7d0;\n    }\n    \n    .a-success:hover {\n        background: #bbf7d0;\n    }\n    \n    .a-danger {\n        background: #fee2e2;\n        color: #b91c1c;\n        border-color: #fecaca;\n    }\n    \n    .a-danger:hover {\n        background: #fecaca;\n    }\n    \n    .a-warning {\n        background: #ffedd5;\n        color: #9a3412;\n        border-color: #fed7aa;\n    }\n    \n    .a-warning:hover {\n        background: #fed7aa;\n    }\n    \n    .a-info {\n        background: #ccfbf1;\n        color: #0d9488;\n        border-color: #99f6e4;\n    }\n    \n    .a-info:hover {\n        background: #99f6e4;\n    }\n    \n    .a-dark {\n        background: #e2e8f0;\n        color: #334155;\n        border-color: #cbd5e1;\n    }\n    \n    .a-dark:hover {\n        background: #cbd5e1;\n    }\n    \n    .a-outline {\n        background: transparent;\n        color: #64748b;\n        border-color: #cbd5e1;\n    }\n    \n    .a-outline:hover {\n        background: #f8fafc;\n    }\n    \n    .a-disabled {\n        background: #f1f5f9;\n        color: #94a3b8;\n        border-color: #e2e8f0;\n        cursor: not-allowed;\n    }\n    \n    .a-disabled:hover {\n        transform: none;\n        box-shadow: none;\n        background: #f1f5f9;\n    }\n</style>\n"), 
H("\n<style>\n    /* 全局通用样式 */\n    .fr-btn {\n        float: right;\n        margin-left: 4px !important;\n    }\n    \n    .menu-box {\n        position: fixed;\n        right: 10px;\n        top: 50%;\n        transform: translateY(-50%);\n        display: flex;\n        flex-direction: column;\n        z-index: 1000;\n        gap: 6px;\n    }\n    \n    .menu-btn {\n        display: inline-block;\n        min-width: 80px;\n        padding: 7px 12px;\n        border-radius: 4px;\n        color: white !important;\n        text-decoration: none;\n        font-weight: bold;\n        font-size: 12px;\n        text-align: center;\n        cursor: pointer;\n        transition: all 0.3s ease;\n        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);\n        text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);\n        border: none;\n        line-height: 1.3;\n        margin: 0;\n    }\n    \n    .menu-btn:hover {\n        transform: translateY(-1px);\n        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);\n        opacity: 0.9;\n    }\n    \n    .menu-btn:active {\n        transform: translateY(0);\n        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);\n    }\n    \n    .do-hide {\n        display: none !important;\n    }\n    \n    \n    /* 悬浮提示 */\n    [data-tip] {\n        position: relative;\n        overflow:visible;\n    }\n    [data-tip]::after {\n        content: attr(data-tip);\n        position: absolute;\n        bottom: 100%;\n        left: 50%;\n        padding: 8px 15px;\n        border-radius: 4px;\n        white-space: nowrap;\n        opacity: 0;\n        pointer-events: none;\n        transform: translateX(-50%) translateY(10px);\n        font-size: 14px;\n        z-index: 9999999999;\n        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);\n        background: #F0FDF4;\n        color: #166534;\n        border: 1px solid #BBF7D0; \n        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);\n    }\n    [data-tip]:hover::after {\n        opacity: 1;\n        transform: translateX(-50%) translateY(0);\n    }\n</style>\n");

t = new WeakSet, e = async function() {
    window.location.hostname.includes("javdb") && ((await this.forage.keys()).forEach((t => t.startsWith("lastCleanupTime") && this.forage.removeItem(t))), 
    (await this.forage.keys()).forEach((t => t.startsWith("z_score_") && this.forage.removeItem(t))), 
    (await this.forage.keys()).forEach((t => t.startsWith("z_actress_") && this.forage.removeItem(t))));
}, n = async function(t, e, n) {
    let a;
    if (Array.isArray(t)) a = [ ...t ]; else {
        if (a = await this.forage.getItem(e) || [], a.includes(t)) {
            const e = `${t} ${n}已存在`;
            throw show.error(e), new Error(e);
        }
        a.push(t);
    }
    return await this.forage.setItem(e, a), a;
};

let j = class a {
    constructor() {
        if (l(this, t), r(this, "car_list_key", "car_list"), r(this, "title_filter_keyword_key", "title_filter_keyword"), 
        r(this, "review_filter_keyword_key", "review_filter_keyword"), r(this, "setting_key", "setting"), 
        r(this, "filter_actress_car_list_key", "car_list_actress_"), r(this, "filter_actor_car_list_key", "car_list_actor_"), 
        r(this, "filter_actor_actress_info_list_key", "filter_actor_actress_info_list"), 
        r(this, "fold_category_key", "foldCategory"), r(this, "highlighted_tags_key", "highlightedTags"), 
        r(this, "forage", localforage.createInstance({
            driver: localforage.INDEXEDDB,
            name: "JAV-JHS",
            version: 1,
            storeName: "appData"
        })), r(this, "interceptedKeys", [ this.car_list_key, this.title_filter_keyword_key, this.review_filter_keyword_key, this.setting_key ]), 
        a.instance) throw new Error("LocalStorageManager已被实例化过了!");
        a.instance = this, c(this, t, e).call(this).then();
    }
    async saveReviewFilterKeyword(e) {
        return c(this, t, n).call(this, e, this.review_filter_keyword_key, "评论关键词");
    }
    async saveTitleFilterKeyword(e) {
        return c(this, t, n).call(this, e, this.title_filter_keyword_key, "标题关键词");
    }
    async getTitleFilterKeyword() {
        return await this.forage.getItem(this.title_filter_keyword_key) || [];
    }
    async getSetting(t = null, e) {
        const n = await this.forage.getItem(this.setting_key) || {};
        if (null === t) return n;
        const a = n[t];
        return a ? "true" === a || "false" === a ? "true" === a.toLowerCase() : "string" != typeof a || isNaN(Number(a)) ? a : Number(a) : e;
    }
    async saveSetting(t) {
        t ? await this.forage.setItem(this.setting_key, t) : show.error("设置对象为空");
    }
    async saveSettingItem(t, e) {
        if (!t) return void show.error("key 不能为空");
        let n = await this.getSetting();
        n[t] = e, await this.saveSetting(n);
    }
    async getReviewFilterKeywordList() {
        return await this.forage.getItem(this.review_filter_keyword_key) || [];
    }
    async saveCar(t, e, n, a) {
        if (!t) throw show.error("番号为空!"), new Error("番号为空!");
        if (!e) throw show.error("url为空!"), new Error("url为空!");
        e.includes("http") || (e = window.location.origin + e), n && (n = n.trim());
        const i = await this.forage.getItem(this.car_list_key) || [];
        let s = i.find((e => e.carNum === t));
        switch (s ? (s.url = e, n && (s.actress = n), s.updateDate = utils.getNowStr()) : (s = {
            carNum: t,
            url: e,
            actress: n,
            status: "",
            updateDate: utils.getNowStr()
        }, i.push(s)), a) {
          case m:
            if (s.status === m) {
                const e = `${t} 已在屏蔽列表中`;
                throw show.error(e), new Error(e);
            }
            s.status = m;
            break;

          case u:
            if (s.status === u) {
                const e = `${t} 已在收藏列表中`;
                throw show.error(e), new Error(e);
            }
            s.status = u;
            break;

          case f:
            s.status = f;
            break;

          case v:
            s.status = v;
            break;

          default:
            const e = "actionType错误";
            throw show.error(e), new Error(e);
        }
        await this.forage.setItem(this.car_list_key, i);
    }
    async getCarList() {
        return (await this.forage.getItem(this.car_list_key) || []).sort(((t, e) => {
            if (!t || !e) return 0;
            const n = t.updateDate ? new Date(t.updateDate).getTime() : 0;
            return (e.updateDate ? new Date(e.updateDate).getTime() : 0) - n;
        }));
    }
    async getCar(t) {
        return (await this.getCarList()).find((e => e.carNum === t));
    }
    async getActorFilterCarList(t) {
        return (await this.forage.getItem(t) || []).sort(((t, e) => {
            if (!t || !e) return 0;
            const n = t.updateDate ? new Date(t.updateDate).getTime() : 0;
            return (e.updateDate ? new Date(e.updateDate).getTime() : 0) - n;
        }));
    }
    async getAllActorFilterCarList() {
        const t = [];
        return await this.forage.iterate(((e, n) => {
            n.startsWith("car_list_") && t.push(...e);
        })), t;
    }
    async getActorFilterCarMap() {
        const t = {};
        return await this.forage.iterate(((e, n) => {
            n.startsWith(this.filter_actor_car_list_key) && (t[n] = e);
        })), t;
    }
    async getActressFilterCarMap() {
        const t = {};
        return await this.forage.iterate(((e, n) => {
            n.startsWith(this.filter_actress_car_list_key) && (t[n] = e);
        })), t;
    }
    async getActorFilterCar(t, e) {
        return (await this.getActorFilterCarList(t)).find((t => t.carNum === e));
    }
    async saveActorFilterCar(t, e, n, a) {
        if (!e) throw show.error("番号为空!"), new Error("番号为空!");
        if (!n) throw show.error("url为空!"), new Error("url为空!");
        n.includes("http") || (n = window.location.origin + n), a && (a = a.trim());
        const i = await this.forage.getItem(t) || [];
        let s = i.find((t => t.carNum === e));
        s || (s = {
            carNum: e,
            url: n,
            actress: a,
            status: m,
            updateDate: utils.getNowStr()
        }, i.push(s), await this.forage.setItem(t, i));
    }
    async removeActorFilter(t) {
        if (!t.includes("car_list_")) throw new Error("非法操作:" + t);
        await this.forage.removeItem(t);
    }
    async removeCar(t) {
        const e = await this.getCarList(), n = e.length, a = e.filter((e => e.carNum !== t));
        return a.length === n ? (show.error(`${t} 不存在`), !1) : (await this.forage.setItem(this.car_list_key, a), 
        !0);
    }
    async overrideCarList(t) {
        if (!Array.isArray(t)) throw new TypeError("必须传入数组类型数据");
        const e = t.filter((t => !t || "object" != typeof t || !t.carNum));
        if (e.length > 0) throw new Error(`缺少必要字段 carNum 的数据项: ${e.length} 条`);
        const n = new Set, a = t.filter((t => !!n.has(t.carNum) || (n.add(t.carNum), !1)));
        if (a.length > 0) throw new Error(`发现重复: ${a.slice(0, 3).map((t => t.carNum)).join(", ")}${a.length > 3 ? "..." : ""}`);
        await this.forage.setItem(this.car_list_key, t);
    }
    async getItem(t) {
        if (this.interceptedKeys.includes(t)) {
            let e = `危险操作, 该key已有方法实现获取, 请用内部方法调用!  key: ${t}`;
            throw show.error(e), new Error(e);
        }
        const e = await this.forage.getItem(t);
        return null == e ? null : e;
    }
    async setItem(t, e) {
        if (!t || "undefined" === t || "null" === t) throw show.error("key错误:" + t), new Error("key错误:" + t);
        if (this.interceptedKeys.includes(t)) {
            let e = `危险操作, 该key已有方法实现获取, 请用内部方法调用!  key: ${t}`;
            throw show.error(e), new Error(e);
        }
        return await this.forage.setItem(t, e);
    }
    async removeItem(t) {
        if (this.interceptedKeys.includes(t)) {
            let e = `危险操作, 该key不可删除!  key: ${t}`;
            throw show.error(e), new Error(e);
        }
        return await this.forage.removeItem(t);
    }
    async importData(t) {
        let e = t.filterKeywordList;
        Array.isArray(e) && await this.forage.setItem(this.title_filter_keyword_key, e), 
        e = t.reviewKeywordList, Array.isArray(e) && await this.forage.setItem(this.review_filter_keyword_key, e), 
        t.dataList && await this.overrideCarList(t.dataList), e = t[this.title_filter_keyword_key], 
        Array.isArray(e) && await this.forage.setItem(this.title_filter_keyword_key, e), 
        e = t[this.review_filter_keyword_key], Array.isArray(e) && await this.forage.setItem(this.review_filter_keyword_key, e), 
        t[this.car_list_key] && await this.overrideCarList(t[this.car_list_key]), t.setting && await this.saveSetting(t.setting);
        const n = {
            ...await storageManager.getActressFilterCarMap(),
            ...await storageManager.getActorFilterCarMap()
        };
        for (const a of Object.keys(n)) console.log("移除key", a), await this.forage.removeItem(a);
        for (const a of Object.keys(t)) (a.startsWith(this.filter_actress_car_list_key) || a.startsWith(this.filter_actor_car_list_key)) && await this.forage.setItem(a, t[a]);
        t.highlightedTags && await storageManager.setItem(storageManager.highlighted_tags_key, t.highlightedTags);
    }
    async exportData() {
        return {
            car_list: await this.getCarList(),
            title_filter_keyword: await this.getTitleFilterKeyword(),
            review_filter_keyword: await this.getReviewFilterKeywordList(),
            setting: await this.getSetting(),
            ...await this.getActressFilterCarMap(),
            ...await this.getActorFilterCarMap(),
            highlightedTags: await storageManager.getItem(storageManager.highlighted_tags_key)
        };
    }
};

class N {
    constructor() {
        return r(this, "intervalContainer", {}), r(this, "mimeTypes", {
            txt: "text/plain",
            html: "text/html",
            css: "text/css",
            csv: "text/csv",
            json: "application/json",
            xml: "application/xml",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            gif: "image/gif",
            webp: "image/webp",
            svg: "image/svg+xml",
            pdf: "application/pdf",
            doc: "application/msword",
            docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            xls: "application/vnd.ms-excel",
            xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ppt: "application/vnd.ms-powerpoint",
            pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            zip: "application/zip",
            rar: "application/x-rar-compressed",
            "7z": "application/x-7z-compressed",
            mp3: "audio/mpeg",
            wav: "audio/wav",
            mp4: "video/mp4",
            webm: "video/webm",
            ogg: "audio/ogg"
        }), r(this, "insertStyle", (t => {
            t && (-1 === t.indexOf("<style>") && (t = "<style>" + t + "</style>"), $("head").append(t));
        })), N.instance || (N.instance = this), N.instance;
    }
    importResource(t) {
        let e;
        t.indexOf("css") >= 0 ? (e = document.createElement("link"), e.setAttribute("rel", "stylesheet"), 
        e.href = t) : (e = document.createElement("script"), e.setAttribute("type", "text/javascript"), 
        e.src = t), document.documentElement.appendChild(e);
    }
    openPage(t, e, n, a) {
        if (n || (n = !0), a && (a.ctrlKey || a.metaKey)) return void GM_openInTab(t.includes("http") ? t : window.location.origin + t, {
            insert: 0
        });
        const i = t.includes("?") ? `${t}&hideNav=1` : `${t}?hideNav=1`;
        layer.open({
            type: 2,
            title: e,
            content: i,
            scrollbar: !1,
            shadeClose: n,
            area: this.getResponsiveArea([ "85%", "90%" ]),
            isOutAnim: !1,
            anim: -1,
            success: (t, e) => {
                this.setupEscClose(e);
            }
        });
    }
    setupEscClose(t) {
        const e = e => {
            "Escape" !== e.key && 27 !== e.keyCode || layer.close(t);
        }, n = () => {
            $(document).off(`keydown.layerEsc${t}`);
            try {
                const e = $(`#layui-layer-iframe${t}`)[0];
                (null == e ? void 0 : e.contentDocument) && $(e.contentDocument).off(`keydown.layerEsc${t}`);
            } catch (e) {
                console.warn("清理iframe监听失败:", e);
            }
        };
        (() => {
            $(document).on(`keydown.layerEsc${t}`, e);
            try {
                const n = $(`#layui-layer-iframe${t}`)[0];
                (null == n ? void 0 : n.contentDocument) && $(n.contentDocument).on(`keydown.layerEsc${t}`, e);
            } catch (n) {
                console.warn("iframe监听失败:", n);
            }
        })();
        const a = setInterval((() => {
            try {
                const n = $(`#layui-layer-iframe${t}`)[0];
                n && !n.hasEscListener && ($(n.contentDocument).on(`keydown.layerEsc${t}`, e), n.hasEscListener = !0);
            } catch (n) {
                clearInterval(a);
            }
        }), 100);
        setTimeout((() => clearInterval(a)), 2e3);
        const i = layer.getChildFrame("", t);
        if (i) {
            const t = i.end;
            i.end = function() {
                n(), null == t || t.call(this);
            };
        } else layer.style(t, {
            end: n
        });
    }
    closePage() {
        storageManager.getSetting("needClosePage", "yes").then((t => {
            if ("yes" !== t) return;
            parent.document.documentElement.style.overflow = "auto";
            [ ".layui-layer-shade", ".layui-layer-move", ".layui-layer" ].forEach((function(t) {
                const e = parent.document.querySelectorAll(t);
                if (e.length > 0) {
                    const t = e.length > 1 ? e[e.length - 1] : e[0];
                    t.parentNode.removeChild(t);
                }
            })), window.close();
        }));
    }
    loopDetector(t, e, n = 20, a = 1e4, i = !0) {
        let s = !1;
        const o = Math.random(), r = (new Date).getTime();
        this.intervalContainer[o] = setInterval((() => {
            (new Date).getTime() - r > a && (console.warn("loopDetector timeout!", t, e), s = i), 
            (t() || s) && (clearInterval(this.intervalContainer[o]), e && e(), delete this.intervalContainer[o]);
        }), n);
    }
    rightClick(t, e) {
        t && (t.jquery ? t = t.toArray() : t instanceof HTMLElement ? t = [ t ] : Array.isArray(t) || (t = [ t ]), 
        t && 0 !== t.length ? t.forEach((t => {
            t && t.addEventListener("contextmenu", (t => {
                e(t);
            }));
        })) : console.error("rightClick(), 找不到元素"));
    }
    q(t, e, n, a) {
        let i, s;
        t ? (i = t.clientX - 130, s = t.clientY - 120) : (i = window.innerWidth / 2 - 120, 
        s = window.innerHeight / 2 - 120);
        let o = layer.confirm(e, {
            offset: [ s, i ],
            title: "提示",
            btn: [ "确定", "取消" ],
            shade: 0,
            zIndex: 999999991
        }, (function() {
            n && n(), layer.close(o);
        }), (function() {
            a && a();
        }));
    }
    getNowStr(t = "-", e = ":", n = null) {
        let a;
        a = n ? new Date(n) : new Date;
        const i = a.getFullYear(), s = String(a.getMonth() + 1).padStart(2, "0"), o = String(a.getDate()).padStart(2, "0"), r = String(a.getHours()).padStart(2, "0"), l = String(a.getMinutes()).padStart(2, "0"), c = String(a.getSeconds()).padStart(2, "0");
        return `${[ i, s, o ].join(t)} ${[ r, l, c ].join(e)}`;
    }
    formatDate(t, e = "-", n = ":") {
        let a;
        if (t instanceof Date) a = t; else {
            if ("string" != typeof t) throw new Error("Invalid date input: must be Date object or date string");
            if (a = new Date(t), isNaN(a.getTime())) throw new Error("Invalid date string");
        }
        const i = a.getFullYear(), s = String(a.getMonth() + 1).padStart(2, "0"), o = String(a.getDate()).padStart(2, "0"), r = String(a.getHours()).padStart(2, "0"), l = String(a.getMinutes()).padStart(2, "0"), c = String(a.getSeconds()).padStart(2, "0");
        return `${[ i, s, o ].join(e)} ${[ r, l, c ].join(n)}`;
    }
    download(t, e) {
        show.info("开始请求下载...");
        const n = e.split(".").pop().toLowerCase();
        let a, i = this.mimeTypes[n] || "application/octet-stream";
        if (t instanceof Blob) console.log("blob类型"), a = t; else if (t instanceof ArrayBuffer || ArrayBuffer.isView(t)) console.log("ArrayBuffer"), 
        a = new Blob([ t ], {
            type: i
        }); else if ("string" == typeof t && t.startsWith("data:")) {
            console.log("base64");
            const e = atob(t.split(",")[1]), n = new ArrayBuffer(e.length), s = new Uint8Array(n);
            for (let t = 0; t < e.length; t++) s[t] = e.charCodeAt(t);
            a = new Blob([ s ], {
                type: i
            });
        } else console.log("其他情况按文本处理"), a = new Blob([ t ], {
            type: i
        });
        const s = URL.createObjectURL(a), o = document.createElement("a");
        o.href = s, o.download = e, document.body.appendChild(o), o.click(), setTimeout((() => {
            document.body.removeChild(o), URL.revokeObjectURL(s);
        }), 100);
    }
    smoothScrollToTop(t = 500) {
        return new Promise((e => {
            const n = performance.now(), a = window.pageYOffset;
            window.requestAnimationFrame((function i(s) {
                const o = s - n, r = Math.min(o / t, 1), l = r < .5 ? 4 * r * r * r : 1 - Math.pow(-2 * r + 2, 3) / 2;
                window.scrollTo(0, a * (1 - l)), r < 1 ? window.requestAnimationFrame(i) : e();
            }));
        }));
    }
    simpleId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    log(...t) {
        console.groupCollapsed("📌", ...t);
        const e = (new Error).stack.split("\n").slice(2).map((t => t.trim())).filter((t => t.trim()));
        console.log(e.join("\n")), console.groupEnd();
    }
    isUrl(t) {
        try {
            return new URL(t), !0;
        } catch (e) {
            return !1;
        }
    }
    setHrefParam(t, e) {
        const n = new URL(window.location.href);
        n.searchParams.set(t, e), window.history.pushState({}, "", n.toString());
    }
    getResponsiveArea(t) {
        const e = window.innerWidth;
        return e >= 1200 ? t || this.getDefaultArea() : e >= 768 ? [ "70%", "90%" ] : [ "95%", "95%" ];
    }
    getDefaultArea() {
        return [ "85%", "90%" ];
    }
    isMobile() {
        const t = navigator.userAgent.toLowerCase();
        return [ "iphone", "ipod", "ipad", "android", "blackberry", "windows phone", "nokia", "webos", "opera mini", "mobile", "mobi", "tablet" ].some((e => t.includes(e)));
    }
    copyToClipboard(t, e) {
        navigator.clipboard.writeText(e).then((() => show.info(`${t}已复制到剪切板, ${e}`))).catch((t => console.error("复制失败: ", t)));
    }
    htmlTo$dom(t) {
        const e = new DOMParser;
        return $(e.parseFromString(t, "text/html"));
    }
    addCookie(t, e = {}) {
        const {maxAge: n = 1728e3, path: a = "/", domain: i = "", secure: s = !1, sameSite: o = ""} = e;
        t.split(";").forEach((t => {
            const e = t.trim();
            if (e) {
                const [t, r] = e.split("=");
                if (t && r) {
                    let e = [ `${t}=${r}`, `max-age=${n}`, `path=${a}` ];
                    i && e.push(`domain=${i}`), s && e.push("Secure"), o && e.push(`SameSite=${o}`), 
                    document.cookie = e.join("; ");
                }
            }
        }));
    }
    isHidden(t) {
        const e = t.jquery ? t[0] : t;
        return !e || (e.offsetWidth <= 0 && e.offsetHeight <= 0 || "none" === window.getComputedStyle(e).display);
    }
}

window.utils = new N, window.http = new class {
    get(t, e = {}, n = {}) {
        return this.jqueryRequest("GET", t, null, e, n);
    }
    post(t, e = {}, n = {}) {
        return this.jqueryRequest("POST", t, e, null, n);
    }
    put(t, e = {}, n = {}) {
        return this.jqueryRequest("PUT", t, e, null, n);
    }
    del(t, e = {}, n = {}) {
        return this.jqueryRequest("DELETE", t, null, e, n);
    }
    jqueryRequest(t, e, n = {}, a = {}, i = {}) {
        return "POST" === t && (i = {
            "Content-Type": "application/json",
            ...i
        }), new Promise(((s, o) => {
            $.ajax({
                method: t,
                url: e,
                timeout: 1e4,
                data: "GET" === t || "DELETE" === t ? a : JSON.stringify(n),
                headers: i,
                success: (t, e, n) => {
                    var a;
                    if (null == (a = n.getResponseHeader("Content-Type")) ? void 0 : a.includes("application/json")) try {
                        s("object" == typeof t ? t : JSON.parse(t));
                    } catch (i) {
                        s(t);
                    } else s(t);
                },
                error: (t, e, n) => {
                    let a = n;
                    if (t.responseText) try {
                        const e = JSON.parse(t.responseText);
                        a = e.message || e.msg || t.responseText;
                    } catch {
                        a = t.responseText;
                    }
                    o(new Error(a));
                }
            });
        }));
    }
}, window.gmHttp = new class {
    get(t, e = {}, n = {}, a) {
        return this.gmRequest("GET", t, null, e, n, a);
    }
    post(t, e = {}, n = {}, a) {
        n = {
            "Content-Type": "application/json",
            ...n
        };
        let i = JSON.stringify(e);
        return this.gmRequest("POST", t, i, null, n, a);
    }
    postForm(t, e = {}, n = {}, a) {
        n || (n = {}), n["Content-Type"] || (n["Content-Type"] = "application/x-www-form-urlencoded");
        let i = "";
        return e && Object.keys(e).length > 0 && (i = Object.entries(e).map((([t, e]) => `${t}=${e}`)).join("&")), 
        this.gmRequest("POST", t, i, null, n, a);
    }
    postFormData(t, e = {}, n = {}, a) {
        n || (n = {});
        const i = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
        n["Content-Type"] = `multipart/form-data; boundary=${i}`;
        let s = "";
        return e && Object.keys(e).length > 0 && (s = Object.entries(e).map((([t, e]) => `--${i}\r\nContent-Disposition: form-data; name="${t}"\r\n\r\n${e}\r\n`)).join("")), 
        s += `--${i}--`, this.gmRequest("POST", t, s, null, n, a);
    }
    checkUrlStatus(t, e = {}, n) {
        return new Promise(((a, i) => {
            GM_xmlhttpRequest({
                method: "HEAD",
                url: t,
                headers: e,
                timeout: n || 1e4,
                onload: t => {
                    a(t.status);
                },
                onerror: t => {
                    i(new Error(`请求失败: ${t}`));
                },
                ontimeout: () => {
                    i(new Error(`请求超时（${n}ms）`));
                }
            });
        }));
    }
    gmRequest(t, e, n = {}, a = {}, i = {}, s) {
        if (a && Object.keys(a).length) {
            const t = new URLSearchParams(a).toString();
            e += (e.includes("?") ? "&" : "?") + t;
        }
        return new Promise(((a, o) => {
            GM_xmlhttpRequest({
                method: t,
                url: e,
                headers: i,
                timeout: s || 1e4,
                data: n,
                onload: t => {
                    try {
                        if (t.status >= 200 && t.status < 300) if (t.responseText) try {
                            a(JSON.parse(t.responseText));
                        } catch (n) {
                            a(t.responseText);
                        } else a(t.responseText || t); else if (console.error("请求失败,状态码:", t.status, e), 
                        t.responseText) try {
                            const e = JSON.parse(t.responseText);
                            o(e);
                        } catch {
                            o(new Error(t.responseText || `HTTP Error ${t.status}`));
                        } else o(new Error(`HTTP Error ${t.status}`));
                    } catch (n) {
                        o(n);
                    }
                },
                onerror: t => {
                    console.error("网络错误:", e), o(new Error(t.error || "Network Error"));
                },
                ontimeout: () => {
                    o(new Error("Request Timeout"));
                }
            });
        }));
    }
}, window.storageManager = new j;

const F = new BroadcastChannel("channel-refresh");

window.refresh = function() {
    F.postMessage({
        type: "refresh"
    });
}, document.head.insertAdjacentHTML("beforeend", '\n        <style>\n            .loading-container {\n                position: fixed;\n                top: 0;\n                left: 0;\n                width: 100%;\n                height: 100%;\n                display: flex;\n                justify-content: center;\n                align-items: center;\n                background-color: rgba(0, 0, 0, 0.1);\n                z-index: 99999999;\n            }\n    \n            .loading-animation {\n                position: relative;\n                width: 60px;\n                height: 12px;\n                background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);\n                border-radius: 6px;\n                animation: loading-animate 1.8s ease-in-out infinite;\n                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);\n            }\n    \n            .loading-animation:before,\n            .loading-animation:after {\n                position: absolute;\n                display: block;\n                content: "";\n                animation: loading-animate 1.8s ease-in-out infinite;\n                height: 12px;\n                border-radius: 6px;\n                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);\n            }\n    \n            .loading-animation:before {\n                top: -20px;\n                left: 10px;\n                width: 40px;\n                background: linear-gradient(90deg, #ff758c 0%, #ff7eb3 100%);\n            }\n    \n            .loading-animation:after {\n                bottom: -20px;\n                width: 35px;\n                background: linear-gradient(90deg, #ff9a9e 0%, #fad0c4 100%);\n            }\n    \n            @keyframes loading-animate {\n                0% {\n                    transform: translateX(40px);\n                }\n                50% {\n                    transform: translateX(-30px);\n                }\n                100% {\n                    transform: translateX(40px);\n                }\n            }\n        </style>\n    '), 
window.loading = function() {
    const t = document.createElement("div");
    t.className = "loading-container";
    const e = document.createElement("div");
    return e.className = "loading-animation", t.appendChild(e), document.body.appendChild(t), 
    {
        close: () => {
            t && t.parentNode && t.parentNode.removeChild(t);
        }
    };
}, function() {
    document.head.insertAdjacentHTML("beforeend", "\n        <style>\n            .data-table-container {\n                flex: 1; /* 自动填充剩余空间 */\n                overflow-y: auto; /* 保留滚动条 */\n                border: 1px solid #e2e8f0;\n            }\n            \n            .data-table {\n                width: 100%;\n                border-collapse: separate;\n                border-spacing: 0;\n                font-family: 'Helvetica Neue', Arial, sans-serif;\n                background: #fff;\n                /*overflow: hidden;*/\n                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);\n                margin: 0 auto; /* 表格整体水平居中 */\n            }\n    \n            .data-table thead tr {\n                background: #f8fafc;\n            }\n            \n            /* 表头居中 */\n            .data-table th {\n                padding: 16px 20px;\n                text-align: center !important; /* 表头文字居中 */\n                color: #64748b;\n                font-weight: 500;\n                font-size: 14px;\n                text-transform: uppercase;\n                letter-spacing: 0.5px;\n                border-bottom: 1px solid #e2e8f0;\n            }\n            \n            /* 单元格内容居中 */\n            .data-table td {\n                padding: 14px 20px;\n                color: #334155;\n                font-size: 15px;\n                border-bottom: 1px solid #f1f5f9;\n                text-align: center !important; /* 单元格文字居中 */\n                vertical-align: middle; /* 垂直居中 */\n            }\n            \n            .data-table tbody tr:last-child td {\n                border-bottom: none;\n            }\n            \n            /* 行hover 变色*/\n            .data-table tbody tr {\n                transition: all 0.2s ease;\n            }\n            \n            .data-table tbody tr:hover {\n                background: #f8fafc;\n            }\n            \n            /* 可选：特定列左对齐/右对齐的示例 */\n            .data-table .text-left {\n                text-align: left;\n            }\n            \n            .data-table .text-right {\n                text-align: right;\n            }\n            \n            /* 添加.show-border时显示边框 */\n            .data-table.show-border {\n                border: 1px solid #e2e8f0;\n            }\n            \n            .data-table.show-border th,\n            .data-table.show-border td {\n                border: 1px solid #e2e8f0;\n            }\n            \n            \n            /* 滚动条美化 */\n            .data-table-container::-webkit-scrollbar {\n                width: 8px;\n                height: 8px;\n            }\n            \n            .data-table-container::-webkit-scrollbar-track {\n                background: #f1f1f1;\n            }\n            \n            .data-table-container::-webkit-scrollbar-thumb {\n                background: #c1c1c1;\n                border-radius: 4px;\n            }\n            \n            .data-table-container::-webkit-scrollbar-thumb:hover {\n                background: #a8a8a8;\n            }\n            \n            /* 最后一行底部边框 */\n            .data-table tbody tr:last-child td {\n                border-bottom: 1px solid #f1f5f9;\n            }\n            \n            .table-pagination {\n                display: flex;\n                align-items: center;\n                justify-content: flex-end;\n                padding: 20px 20px 0;\n                font-size: 14px;\n                flex-shrink: 0; /* 防止分页区域被压缩 */\n            }\n            \n            .pagination-info {\n                margin-right: auto;\n                color: #666;\n            }\n            \n            .pagination-controls {\n                display: flex;\n                align-items: center;\n                margin: 0 15px;\n            }\n            \n            .pagination-controls button {\n                padding: 5px 12px;\n                margin: 0 5px;\n                border: 1px solid #ddd;\n                background: #fff;\n                cursor: pointer;\n                border-radius: 4px;\n            }\n            \n            .pagination-controls button:disabled {\n                color: #ccc;\n                cursor: not-allowed;\n            }\n            \n            .pagination-current {\n                margin: 0 10px;\n            }\n            \n            .pagination-size-select {\n                padding: 5px;\n                border: 1px solid #ddd;\n                border-radius: 4px;\n            }\n\n            /* 复选框样式 */\n            .checkbox-container {\n                display: inline-block;\n                position: relative;\n                padding-left: 25px;\n                cursor: pointer;\n                user-select: none;\n            }\n            \n            .checkbox-container input {\n                position: absolute;\n                opacity: 0;\n                cursor: pointer;\n                height: 0;\n                width: 0;\n            }\n            \n            .checkmark {\n                position: absolute;\n                top: 50%;\n                left: 50%;\n                transform: translate(-50%, -50%);\n                height: 18px;\n                width: 18px;\n                background-color: #fff;\n                border: 1px solid #ddd;\n                border-radius: 3px;\n            }\n            \n            .checkbox-container:hover input ~ .checkmark {\n                background-color: #f1f1f1;\n            }\n            \n            .checkbox-container input:checked ~ .checkmark {\n                background-color: #2196F3;\n                border-color: #2196F3;\n            }\n            \n            .checkmark:after {\n                content: \"\";\n                position: absolute;\n                display: none;\n            }\n            \n            .checkbox-container input:checked ~ .checkmark:after {\n                display: block;\n            }\n            \n            .checkbox-container .checkmark:after {\n                left: 6px;\n                top: 2px;\n                width: 5px;\n                height: 10px;\n                border: solid white;\n                border-width: 0 2px 2px 0;\n                transform: rotate(45deg);\n            }\n        </style>\n    ");
    window.TableGenerator = class {
        constructor(t) {
            this.defaults = {
                tableClass: "data-table",
                showBorder: !1,
                buttons: [],
                selectable: !1,
                selectedRowKey: "id",
                onSelectChange: null,
                pagination: {
                    enable: !1,
                    pageSize: 10,
                    pageSizeOptions: [ 10, 20, 50, 100, 1e3 ],
                    currentPage: 1,
                    showTotal: !0,
                    showSizeChanger: !0,
                    showQuickJumper: !0
                }
            }, this.config = {
                ...this.defaults,
                ...t,
                pagination: {
                    ...this.defaults.pagination,
                    ...t.pagination || {}
                }
            }, this.selectedRows = new Set, this.validateConfig() && this.init();
        }
        validateConfig() {
            return this.config.containerId && this.config.columns && Array.isArray(this.config.columns) && Array.isArray(this.config.data) ? (this.container = document.getElementById(this.config.containerId), 
            !!this.container || (console.error(`未找到ID为${this.config.containerId}的容器`), !1)) : (console.error("缺少必要参数或参数类型不正确"), 
            !1);
        }
        init() {
            this.container.innerHTML = "", this.container.style.display = "flex", this.container.style.flexDirection = "column", 
            this.container.style.height = "90%";
            const t = document.createElement("div");
            t.className = "data-table-container", this.table = document.createElement("table"), 
            this.table.className = this.config.showBorder ? `${this.config.tableClass} show-border` : this.config.tableClass, 
            this.createHeader(), this.createBody(), t.appendChild(this.table), this.container.appendChild(t), 
            this.config.pagination.enable && this.createPagination();
        }
        createPagination() {
            const t = document.createElement("div");
            t.className = "table-pagination";
            const e = Math.ceil(this.config.data.length / this.config.pagination.pageSize);
            t.innerHTML = `\n                <div class="pagination-info">\n                    共 ${this.config.data.length} 条记录\n                </div>\n                <div class="pagination-controls">\n                    <button class="pagination-prev" ${this.config.pagination.currentPage <= 1 ? "disabled" : ""}>上一页</button>\n                    <span class="pagination-current">${this.config.pagination.currentPage}/${e}</span>\n                    <button class="pagination-next" ${this.config.pagination.currentPage >= e ? "disabled" : ""}>下一页</button>\n                </div>\n                ${this.config.pagination.showSizeChanger ? `\n                <div class="pagination-size">\n                    <select class="pagination-size-select">\n                        ${this.config.pagination.pageSizeOptions.map((t => `<option value="${t}" ${t === this.config.pagination.pageSize ? "selected" : ""}>${t}条/页</option>`)).join("")}\n                    </select>\n                </div>\n                ` : ""}\n            `, 
            t.querySelector(".pagination-prev").addEventListener("click", (() => {
                this.config.pagination.currentPage > 1 && (this.config.pagination.currentPage--, 
                this.update(this.config.data), this.clearSelection());
            })), t.querySelector(".pagination-next").addEventListener("click", (() => {
                this.config.pagination.currentPage < e && (this.config.pagination.currentPage++, 
                this.update(this.config.data), this.clearSelection());
            })), this.config.pagination.showSizeChanger && t.querySelector(".pagination-size-select").addEventListener("change", (t => {
                this.config.pagination.pageSize = parseInt(t.target.value), this.config.pagination.currentPage = 1, 
                this.update(this.config.data), this.clearSelection();
            })), this.container.appendChild(t);
        }
        createHeader() {
            const t = document.createElement("thead"), e = document.createElement("tr");
            if (this.config.selectable) {
                const t = document.createElement("th");
                t.className = "select-column";
                const n = document.createElement("label");
                n.className = "checkbox-container select-all-checkbox";
                const a = document.createElement("input");
                a.type = "checkbox", a.className = "select-all-checkbox", a.addEventListener("change", (t => {
                    this.toggleSelectAll(t.target.checked);
                }));
                const i = document.createElement("span");
                i.className = "checkmark", n.appendChild(a), n.appendChild(i), t.appendChild(n), 
                e.appendChild(t);
            }
            if (this.config.columns.forEach((t => {
                if ("_index" === t.key) {
                    const n = document.createElement("th");
                    return n.textContent = "序号", n.style.width = t.width ? t.width : "80px", void e.appendChild(n);
                }
                const n = document.createElement("th");
                n.textContent = t.title || t.key, t.width && (n.style.width = t.width), t.headerClass && (n.className = t.headerClass), 
                e.appendChild(n);
            })), this.config.buttons && this.config.buttons.length > 0) {
                const t = document.createElement("th");
                t.textContent = "操作", this.config.buttonColumnWidth && (t.style.width = this.config.buttonColumnWidth), 
                e.appendChild(t);
            }
            t.appendChild(e), this.table.appendChild(t);
        }
        createBody() {
            const t = document.createElement("tbody");
            0 === this.config.data.length ? this.renderEmptyData(t) : this.renderDataRows(t), 
            this.table.appendChild(t);
        }
        renderEmptyData(t) {
            const e = document.createElement("tr"), n = document.createElement("td");
            n.colSpan = this.config.columns.length + (this.config.buttons.length > 0 ? 1 : 0) + (this.config.selectable ? 1 : 0), 
            n.textContent = "暂无数据", n.style.textAlign = "center", e.appendChild(n), t.appendChild(e);
        }
        renderDataRows(t) {
            let e = this.config.data;
            if (this.config.pagination.enable) {
                const t = (this.config.pagination.currentPage - 1) * this.config.pagination.pageSize, n = t + this.config.pagination.pageSize;
                e = this.config.data.slice(t, n);
            }
            e.forEach(((e, n) => {
                const a = document.createElement("tr");
                this.config.selectable && this.renderSelectCell(a, e), this.renderDataCells(a, e, n), 
                this.config.buttons && this.config.buttons.length > 0 && this.renderButtonCells(a, e, n), 
                t.appendChild(a);
            }));
        }
        renderSelectCell(t, e) {
            const n = document.createElement("td");
            n.className = "select-column";
            const a = e[this.config.selectedRowKey];
            t.dataset.rowKey = a;
            const i = document.createElement("label");
            i.className = "checkbox-container";
            const s = document.createElement("input");
            s.type = "checkbox", s.checked = this.selectedRows.has(a), s.addEventListener("change", (t => {
                this.toggleRowSelection(a, t.target.checked);
            }));
            const o = document.createElement("span");
            o.className = "checkmark", i.appendChild(s), i.appendChild(o), n.appendChild(i), 
            t.appendChild(n);
        }
        toggleRowSelection(t, e) {
            e ? this.selectedRows.add(t) : this.selectedRows.delete(t), this.updateSelectAllCheckbox(), 
            "function" == typeof this.config.onSelectChange && this.config.onSelectChange({
                rowKey: t,
                selected: e,
                selectedRows: this.getSelectedRows(),
                selectedRowKeys: this.getSelectedRowKeys()
            });
        }
        toggleSelectAll(t) {
            this.getCurrentPageData().forEach((e => {
                const n = e[this.config.selectedRowKey];
                t ? this.selectedRows.add(n) : this.selectedRows.delete(n);
            }));
            this.table.querySelectorAll('tbody input[type="checkbox"]').forEach((e => {
                e.closest("tr").dataset.rowKey, e.checked = t;
            })), this.updateSelectAllCheckbox(), "function" == typeof this.config.onSelectChange && this.config.onSelectChange({
                selectAll: t,
                selectedRows: this.getSelectedRows(),
                selectedRowKeys: this.getSelectedRowKeys()
            });
        }
        updateSelectAllCheckbox() {
            const t = this.table.querySelector(".select-all-checkbox");
            if (!t) return;
            const e = this.getCurrentPageData(), n = e.length > 0 && e.every((t => this.selectedRows.has(t[this.config.selectedRowKey])));
            t.checked = n, t.indeterminate = !n && e.some((t => this.selectedRows.has(t[this.config.selectedRowKey])));
        }
        getCurrentPageData() {
            if (!this.config.pagination.enable) return this.config.data;
            const t = (this.config.pagination.currentPage - 1) * this.config.pagination.pageSize, e = t + this.config.pagination.pageSize;
            return this.config.data.slice(t, e);
        }
        renderDataCells(t, e, n) {
            this.config.columns.forEach((a => {
                if ("_index" === a.key) {
                    const e = document.createElement("td"), a = this.config.pagination.currentPage || 1, i = this.config.pagination.pageSize || 10;
                    return e.textContent = (a - 1) * i + n + 1, void t.appendChild(e);
                }
                const i = document.createElement("td");
                a.render ? i.innerHTML = a.render(e, n) : i.textContent = e[a.key] || "", a.cellClass && (i.className = a.cellClass), 
                t.appendChild(i);
            }));
        }
        renderButtonCells(t, e, n) {
            const a = document.createElement("td");
            this.config.buttons.forEach((t => {
                const i = document.createElement("a");
                i.textContent = t.text, i.className = t.class || "a-primary", i.addEventListener("click", (a => {
                    if (t.onClick) {
                        const i = t.onClick.length;
                        3 === i ? t.onClick(a, e, n) : 2 === i ? t.onClick(a, e) : t.onClick(e);
                    }
                })), a.appendChild(i);
            })), t.appendChild(a);
        }
        update(t, e) {
            this.config.data = t, e && (this.config.pagination.currentPage = e), this.init();
        }
        getTableElement() {
            return this.table;
        }
        getSelectedRows() {
            return this.config.data.filter((t => this.selectedRows.has(t[this.config.selectedRowKey])));
        }
        getSelectedRowKeys() {
            return Array.from(this.selectedRows);
        }
        clearSelection() {
            this.selectedRows.clear(), this.update(this.config.data);
        }
    };
}(), function() {
    const t = (t, e, n, a, i) => {
        let s;
        "object" == typeof n ? s = n : (s = "object" == typeof a ? a : i || {}, s.gravity = n || "top", 
        s.position = "string" == typeof a ? a : "center"), s.gravity && "center" !== s.gravity || (s.offset = {
            y: "calc(50vh - 150px)"
        });
        const o = "#60A5FA", r = "#93C5FD", l = "#10B981", c = "#6EE7B7", d = "#EF4444", h = "#FCA5A5", g = {
            borderRadius: "12px",
            color: "white",
            padding: "12px 16px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            minWidth: "150px",
            textAlign: "center",
            zIndex: 999999999
        }, p = {
            text: t,
            duration: 2e3,
            close: !1,
            gravity: "top",
            position: "center",
            style: {
                info: {
                    ...g,
                    background: `linear-gradient(to right, ${o}, ${r})`
                },
                success: {
                    ...g,
                    background: `linear-gradient(to right, ${l}, ${c})`
                },
                error: {
                    ...g,
                    background: `linear-gradient(to right, ${d}, ${h})`
                }
            }[e],
            stopOnFocus: !0,
            oldestFirst: !1,
            ...s
        };
        -1 === p.duration && (p.close = !0);
        const m = Toastify(p);
        return m.showToast(), m.closeShow = () => {
            m.toastElement.remove();
        }, m;
    };
    window.show = {
        ok: (e, n = "center", a, i) => t(e, "success", n, a, i),
        error: (e, n = "center", a, i) => t(e, "error", n, a, i),
        info: (e, n = "center", a, i) => t(e, "info", n, a, i)
    };
}(), document.head.insertAdjacentHTML("beforeend", "\n        <style>\n            .viewer-canvas {\n                overflow: auto !important;\n            }\n            \n            .viewer-close {\n                background: rgba(255,0,0,0.6) !important;\n            }\n            .viewer-close:hover {\n                background: rgba(255,0,0,0.8) !important;\n            }\n        </style>\n    "), 
window.showImageViewer = function(t, e = "") {
    let n = null, a = !1;
    "string" == typeof t || t instanceof String ? (n = $('<div class="temporary-container" style="display:none;">').append(`<img src="${t}" alt="${e}">`).appendTo("body"), 
    a = !0) : n = $(t);
    const i = {
        zIndex: 2147483647,
        navbar: !1,
        zoomOnWheel: !1,
        zoomRatio: .1,
        toggleOnDblclick: !1,
        toolbar: {
            zoomIn: 1,
            zoomOut: 1,
            reset: 1,
            rotateLeft: 0,
            rotateRight: 0,
            flipHorizontal: 0,
            flipVertical: 0
        },
        title: !1,
        keyboard: !1,
        viewed() {
            s.zoomTo(1.5);
            const t = (s.viewerData.width - s.imageData.width) / 2;
            s.moveTo(t, 0);
        },
        shown() {
            a && n.remove(), document.documentElement.style.overflow = "hidden", document.body.style.overflow = "hidden", 
            s.handleKeydown = function(t) {
                "Escape" !== t.key && " " !== t.key || (t.preventDefault(), s.destroy(), document.removeEventListener("keydown", s.handleKeydown), 
                document.documentElement.style.overflow = "", document.body.style.overflow = "");
            }, document.addEventListener("keydown", s.handleKeydown);
        },
        hidden() {
            s && s.handleKeydown && document.removeEventListener("keydown", s.handleKeydown), 
            s.destroy(), document.documentElement.style.overflow = "", document.body.style.overflow = "";
        }
    }, s = new Viewer(n[0], i);
    s.show();
}, window.ImageHoverPreview = class {
    constructor(t = {}) {
        this.config = {
            selector: ".hover-preview",
            dataAttribute: "data-full",
            maxWidth: 1e3,
            maxHeight: 1e3,
            offsetX: 20,
            offsetY: 20,
            zIndex: 9999999999,
            transition: .2,
            autoAdjustPosition: !0,
            ...t
        }, this.preview = null, this.currentTarget = null, this.timer = null, this.imgElement = null, 
        this.boundElements = new WeakSet, this.init();
    }
    init() {
        this.injectStyles(), this.createPreviewElement(), this.bindEvents();
    }
    injectStyles() {
        const t = `\n                <style>\n                    .image-hover-preview {\n                        position: fixed;\n                        display: none;\n                        z-index: ${this.config.zIndex};\n                        border-radius: 4px;\n                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);\n                        overflow: hidden;\n                        pointer-events: none;\n                        opacity: 0;\n                        transition: opacity ${this.config.transition}s ease;\n                        background-color: #fff;\n                    }\n                    \n                    .image-hover-preview.active {\n                        opacity: 1;\n                    }\n                    \n                    .image-hover-preview img {\n                        max-width: ${this.config.maxWidth}px;\n                        max-height: ${this.config.maxHeight}px;\n                        display: block;\n                        object-fit: contain;\n                    }\n                    \n                    .image-hover-preview::after {\n                        content: '';\n                        position: absolute;\n                        top: 0;\n                        left: 0;\n                        right: 0;\n                        bottom: 0;\n                        background: rgba(0, 0, 0, 0.03);\n                        pointer-events: none;\n                    }\n                    \n                    .image-hover-preview.loading::before {\n                        content: '加载中...';\n                        position: absolute;\n                        top: 50%;\n                        left: 50%;\n                        transform: translate(-50%, -50%);\n                        color: #666;\n                        font-size: 14px;\n                    }\n                </style>\n            `;
        document.head.insertAdjacentHTML("beforeend", t);
    }
    createPreviewElement() {
        this.preview = document.createElement("div"), this.preview.className = "image-hover-preview", 
        document.body.appendChild(this.preview);
    }
    bindEvents() {
        document.querySelectorAll(this.config.selector).forEach((t => {
            this.boundElements.has(t) || (t.addEventListener("mouseenter", (t => this.handleMouseEnter(t))), 
            t.addEventListener("mouseleave", (t => this.handleMouseLeave(t))), t.addEventListener("mousemove", (t => this.handleMouseMove(t))), 
            this.boundElements.add(t));
        }));
    }
    handleMouseEnter(t) {
        clearTimeout(this.timer), this.currentTarget = t.currentTarget;
        const e = this.currentTarget.getAttribute(this.config.dataAttribute) || this.currentTarget.src;
        if (!e) return;
        this.preview.innerHTML = "", this.preview.classList.add("loading"), this.preview.style.display = "block", 
        this.preview.classList.remove("active");
        const n = new Image;
        n.onload = () => {
            this.preview.classList.remove("loading"), this.preview.innerHTML = `<img src="${e}" alt="预览图">`, 
            this.imgElement = this.preview.querySelector("img");
            const {width: a, height: i} = this.calculateImageSize(n);
            this.preview.style.width = `${a}px`, this.preview.style.height = `${i}px`, this.preview.offsetHeight, 
            this.preview.classList.add("active"), this.handleMouseMove(t);
        }, n.onerror = () => {
            this.preview.classList.remove("loading"), this.preview.innerHTML = '<div style="padding:10px;color:#f00;">图片加载失败</div>';
        }, n.src = e;
    }
    calculateImageSize(t) {
        let e = t.naturalWidth, n = t.naturalHeight;
        if (e > this.config.maxWidth || n > this.config.maxHeight) {
            const t = Math.min(this.config.maxWidth / e, this.config.maxHeight / n);
            e *= t, n *= t;
        }
        return {
            width: e,
            height: n
        };
    }
    handleMouseMove(t) {
        if (!this.currentTarget || !this.preview.classList.contains("active")) return;
        let {offsetX: e, offsetY: n} = this.config, a = t.clientX + e, i = t.clientY + n;
        if (this.config.autoAdjustPosition) {
            const s = this.preview.offsetWidth, o = this.preview.offsetHeight;
            a + s > window.innerWidth && (a = t.clientX - s - e), i + o > window.innerHeight && (i = t.clientY - o - n), 
            a = Math.max(0, a), i = Math.max(0, i);
        }
        this.preview.style.left = `${a}px`, this.preview.style.top = `${i}px`;
    }
    handleMouseLeave() {
        this.preview.classList.remove("active"), this.preview.style.display = "none", this.currentTarget = null, 
        this.imgElement = null;
    }
    destroy() {
        document.querySelectorAll(this.config.selector).forEach((t => {
            this.boundElements.has(t) && (t.removeEventListener("mouseenter", this.handleMouseEnter), 
            t.removeEventListener("mouseleave", this.handleMouseLeave), t.removeEventListener("mousemove", this.handleMouseMove), 
            this.boundElements.delete(t));
        })), this.preview && this.preview.parentNode && this.preview.parentNode.removeChild(this.preview);
    }
};

class z {
    constructor() {
        this.plugins = new Map;
    }
    register(t) {
        if ("function" != typeof t) throw new Error("插件必须是一个类");
        const e = new t;
        e.pluginManager = this;
        const n = e.getName().toLowerCase();
        if (this.plugins.has(n)) throw new Error(`插件"${name}"已注册`);
        this.plugins.set(n, e);
    }
    getBean(t) {
        return this.plugins.get(t.toLowerCase());
    }
    _getDependencies(t) {
        const e = t.toString();
        return e.slice(e.indexOf("(") + 1, e.indexOf(")")).split(",").map((t => t.trim())).filter((t => t));
    }
    async process() {
        const t = (await Promise.allSettled(Array.from(this.plugins).map((async ([t, e]) => {
            try {
                if ("function" == typeof e.handle) {
                    const n = await e.initCss();
                    return utils.insertStyle(n), await e.handle(), {
                        name: t,
                        status: "fulfilled"
                    };
                }
                console.log("加载插件", t);
            } catch (n) {
                return console.error(`插件 ${t} 执行失败`, n), {
                    name: t,
                    status: "rejected",
                    error: n
                };
            }
        })))).filter((t => "rejected" === t.status));
        t.length && console.error("以下插件执行失败：", t.map((t => t.name))), document.body.classList.add("script-ready");
    }
}

class U {
    constructor() {
        r(this, "pluginManager", null);
    }
    getName() {
        throw new Error(`${this.constructor.name} 未显示getName()`);
    }
    getBean(t) {
        let e = this.pluginManager.getBean(t);
        if (!e) {
            let e = "容器中不存在: " + t;
            throw show.error(e), new Error(e);
        }
        return e;
    }
    async initCss() {
        return "";
    }
    async handle() {}
    getPageInfo() {
        let t, e, n, a, i = window.location.href;
        return h && (t = $('a[title="複製番號"]').attr("data-clipboard-text"), e = i.split("?")[0].split("#")[0], 
        n = $(".female").prev().map(((t, e) => $(e).text())).get().join(" "), a = $(".male").prev().map(((t, e) => $(e).text())).get().join(" ")), 
        g && (e = i.split("?")[0], t = e.split("/").filter(Boolean).pop(), n = $('span[onmouseover*="star_"] a').map(((t, e) => $(e).text())).get().join(" "), 
        a = ""), {
            carNum: t,
            url: e,
            actress: n,
            actors: a
        };
    }
    getSelector() {
        if (h) return {
            boxSelector: ".movie-list",
            itemSelector: ".movie-list .item",
            coverImgSelector: ".cover img",
            requestDomItemSelector: ".movie-list .item",
            nextPageSelector: ".pagination-next"
        };
        if (g) return {
            boxSelector: ".masonry",
            itemSelector: ".masonry .item",
            coverImgSelector: ".movie-box .photo-frame img",
            requestDomItemSelector: "#waterfall .item",
            nextPageSelector: "#next"
        };
        throw new Error("类型错误");
    }
    parseMovieId(t) {
        return t.split("/").pop().split(/[?#]/)[0];
    }
}

const O = async (t, e = "ja", n = "zh-CN") => {
    if (!t) throw new Error("翻译文本不能为空");
    const a = "https://translate-pa.googleapis.com/v1/translate?" + new URLSearchParams({
        "params.client": "gtx",
        dataTypes: "TRANSLATION",
        // key: "", 测试zaSyDLEeFI5OtFB是YBIoK_jj5m32rZK5CkCXA
        key: "",
        "query.sourceLanguage": e,
        "query.targetLanguage": n,
        "query.text": t
    }), i = await fetch(a);
    if (!i.ok) throw new Error(`${i.status} ${i.statusText}`);
    return (await i.json()).translation;
};

class R extends U {
    getName() {
        return "DetailPagePlugin";
    }
    constructor() {
        super();
    }
    async initCss() {
        return "\n            .translated-title {\n                margin-top: 5px;\n                color: #666;\n                font-size: 0.9em;\n                padding: 3px;\n                border-left: 3px solid #4CAF50;\n                background-color: #f8f8f8;\n            }\n        ";
    }
    handle() {
        window.isDetailPage && ($(".video-meta-panel a").each((function() {
            const t = $(this).attr("href");
            t && (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/")) && $(this).attr("target", "_blank");
        })), this.translate().then(), this.handleFancyBox());
    }
    handleFancyBox() {
        if (document.addEventListener("click", (function(t) {
            if (t.target.closest(".fancybox-button--thumbs")) {
                const t = !$(".fancybox-thumbs").is(":hidden");
                localStorage.setItem("jhs_fancyboxThumbs", t.toString()), unsafeWindow.$.fancybox.defaults.thumbs.autoStart = t;
            }
        })), void 0 !== unsafeWindow.$.fancybox) {
            const t = localStorage.getItem("jhs_fancyboxThumbs");
            unsafeWindow.$.fancybox.defaults.thumbs.autoStart = "true" === t;
        }
    }
    async translate() {
        if ("yes" !== await storageManager.getSetting("translateTitle", "yes")) return;
        let t = document.querySelector(".origin-title");
        t || (t = document.querySelector(".current-title"));
        const e = t.textContent.trim();
        if (!e) return void console.log(".current-title元素内容为空");
        const n = document.createElement("div");
        n.textContent = "翻译中...", n.className = "translated-title", t.parentNode.insertBefore(n, t.nextSibling);
        const a = this.getPageInfo().carNum, i = localStorage.getItem("jhs_translate") ? JSON.parse(localStorage.getItem("jhs_translate")) : {};
        i[a] ? n.textContent = i[a] : O(e, "ja", "zh-CN").then((t => {
            n.textContent = t;
        })).catch((t => {
            console.error("翻译失败:", t), n.textContent = "翻译失败: " + t.message, n.style.color = "red";
        }));
    }
}

const K = async (t, e = !0) => {
    const n = localStorage.getItem("jhs_dmm_video") ? JSON.parse(localStorage.getItem("jhs_dmm_video")) : {};
    if (n[t]) return n[t];
    const a = `https://www.dmm.co.jp/search/=/searchstr=${t}`, i = await gmHttp.get(a, null, {
        cookie: "age_check_done=1"
    });
    if (i.includes("このサービスはお住まいの地域からは")) return e && show.error("节点不可用，请将域名 cc3001.dmm.co.jp 及 dmm.co 分流到日本ip"), 
    null;
    const s = $(i), o = new Set, r = t.toLowerCase().replace("-", "");
    s.find(`a[href*="${r}"]`).each(((t, e) => {
        let n = $(e).attr("href");
        o.has(n) || o.add(n);
    }));
    let l = await async function(t) {
        let e;
        const n = Array.from(t).map((async t => {
            try {
                const e = await gmHttp.get(t), n = utils.htmlTo$dom(e).find("#sample-video1");
                if (n.length) {
                    const t = n.attr("onclick"), e = /gaEventVideoStart\('({.*?})'/, a = t.match(e);
                    if (a && a[1]) {
                        const t = a[1].replace(/&quot;/g, '"').replace(/\\(.)/g, "$1"), e = JSON.parse(t);
                        if (e.video_url) return e.video_url;
                    }
                }
            } catch (e) {
                console.error(`处理 ${t} 失败:`, e);
            }
            return null;
        })), a = await Promise.allSettled(n);
        for (const i of a) if ("fulfilled" === i.status && i.value) {
            e = i.value;
            break;
        }
        return e;
    }(o);
    if (!l && e) {
        const t = show.error("解析cid失败, 该番号可能没有预览视频, 点击将前往此网址: " + a, {
            onClick: () => {
                t.closeShow(), window.open(a);
            }
        });
        return null;
    }
    const c = l.lastIndexOf("/"), d = l.substring(0, c + 1), h = l.substring(c + 1), g = M.map((t => t.quality)), p = new RegExp(`(${g.join("|")}|_dmb_w)`);
    let m = h;
    p.test(h) && (m = h.replace(p, "{占位符}"));
    const u = {};
    for (const w of g) u[w] = d + m.replace("{占位符}", w);
    const f = {
        403: "节点不可用，请将域名 cc3001.dmm.co.jp 及 dmm.co 分流到日本ip",
        404: "无其它画质的预览视频",
        null: "网络错误"
    };
    try {
        const a = Object.entries(u).map((([t, e]) => gmHttp.checkUrlStatus(e).then((n => ({
            type: t,
            url: e,
            status: n
        }))).catch((n => (console.error(n), {
            type: t,
            url: e,
            status: null
        }))))), i = await Promise.all(a), s = {}, o = new Set;
        for (const {type: t, url: e, status: n} of i) if (200 === n) s[t] = e; else {
            const t = f[n] || `未知错误状态码: ${n}`;
            o.add(t);
        }
        let r = Object.keys(s).length;
        return 0 === r && o.size > 0 && o.forEach((t => {
            e && show.error(t);
        })), Object.values(s).some((t => "" !== t)) && (n[t] = s, localStorage.setItem("jhs_dmm_video", JSON.stringify(n))), 
        r > 0 ? s : null;
    } catch (v) {
        return console.error("并行检查URL时出错:", v), e && show.error(f.null), null;
    }
};

class W extends U {
    getName() {
        return "PreviewVideoPlugin";
    }
    async initCss() {
        return "\n            .video-control-btn {\n                position: absolute;\n                z-index: 99999999999;\n                min-width:120px;\n                padding: 8px 16px;\n                background: rgba(0,0,0,0.7);\n                color: white;\n                border: none;\n                border-radius: 4px;\n                cursor: pointer;\n            }\n            .video-control-btn.active {\n                background-color: #1890ff; /* 选中按钮的背景色 */\n                color: white;             /* 选中按钮的文字颜色 */\n                font-weight: bold;        /* 加粗显示 */\n                border: 2px solid #096dd9; /* 边框样式 */\n            }\n        ";
    }
    async handle() {
        if (!isDetailPage) return;
        let t = await storageManager.getSetting();
        this.filterHotKey = t.filterHotKey, this.favoriteHotKey = t.favoriteHotKey, this.speedVideoHotKey = t.speedVideoHotKey;
        let e = $(".preview-video-container");
        if (e.on("click", (t => {
            utils.loopDetector((() => $(".fancybox-content #preview-video").length > 0), (() => {
                this.handleVideo().then();
            }));
        })), e.length) {
            if ("yes" === await storageManager.getSetting("enableLoadPreviewVideo", "yes")) {
                let t = await storageManager.getSetting("videoQuality");
                K(this.getPageInfo().carNum, !1).then((e => {
                    if (e) {
                        if (!e[t]) {
                            const n = Object.keys(e);
                            t = n[n.length - 1];
                        }
                        let n = e[t];
                        $("#preview-video source").attr("src", n);
                    }
                }));
            }
        }
        let n = window.location.href;
        (n.includes("gallery-1") || n.includes("gallery-2")) && utils.loopDetector((() => $(".fancybox-content #preview-video").length > 0), (() => {
            $(".fancybox-content #preview-video").length > 0 && this.handleVideo().then();
        })), n.includes("autoPlay=1") && e[0].click();
    }
    async handleVideo() {
        const t = $("#preview-video"), e = t.parent();
        if (e.css("position", "relative"), !t.length) return;
        const n = t[0], a = localStorage.getItem("jhs_videoMuted");
        a && (n.muted = "yes" === a), n.addEventListener("volumechange", (function() {
            localStorage.setItem("jhs_videoMuted", n.muted ? "yes" : "no");
        })), n.play();
        let i = this.getPageInfo().carNum;
        const s = await K(i);
        let o = "";
        const r = "-133";
        if (s) {
            let e = await storageManager.getSetting("videoQuality");
            if (!s[e]) {
                const t = Object.keys(s);
                e = t[t.length - 1];
            }
            let a = s[e];
            t.attr("src", a), n.load(), n.play();
            let i = 0;
            M.forEach((t => {
                let n = s[t.quality];
                if (n) {
                    const a = e === t.quality;
                    o += `\n                    <button class="video-control-btn${a ? " active" : ""}" \n                            id="${t.id}" \n                            data-quality="${t.quality}"\n                            data-video-src="${n}"\n                            style="bottom: ${50 * i}px; right: ${r}px;">\n                        ${t.text}\n                    </button>\n                `, 
                    i++;
                }
            }));
        }
        let l = s ? Object.keys(s).length : 0;
        o = `<button class="menu-btn" id="speed-btn" style="position: absolute; min-width: 120px; background-color:#76b45d;bottom: ${50 * (l + 2)}px; right: ${r + "px"};">快进 ${this.speedVideoHotKey ? "(" + this.speedVideoHotKey + ")" : ""}</button>` + o, 
        o = `<button class="menu-btn" id="video-filterBtn" style="position: absolute; min-width: 120px; background-color:#de3333;bottom: ${50 * (l + 1)}px; right: ${r + "px"};">屏蔽 ${this.filterHotKey ? "(" + this.filterHotKey + ")" : ""}</button>` + o, 
        o = `<button class="menu-btn" id="video-favoriteBtn" style="position: absolute; min-width: 120px; background-color:#25b1dc;bottom: ${50 * l}px; right: ${r + "px"};">收藏 ${this.favoriteHotKey ? "(" + this.favoriteHotKey + ")" : ""}</button>` + o, 
        e.append(o);
        const c = e.find(".video-control-btn");
        e.on("click", ".video-control-btn", (async e => {
            const a = $(e.currentTarget), i = a.data("video-src");
            if (!a.hasClass("active")) try {
                t.attr("src", i), n.load(), await n.play(), c.removeClass("active"), a.addClass("active");
            } catch (s) {
                console.error("切换画质失败:", s);
            }
        })), $("#speed-btn").on("click", (() => {
            this.getBean("DetailPageButtonPlugin").speedVideo();
        })), utils.rightClick($("#speed-btn"), (t => {
            this.getBean("DetailPageButtonPlugin").filterOne(t);
        })), $("#video-filterBtn").on("click", (t => {
            this.getBean("DetailPageButtonPlugin").filterOne(t);
        })), $("#video-favoriteBtn").on("click", (t => {
            this.getBean("DetailPageButtonPlugin").favoriteOne(t);
        }));
    }
}

const q = class t {
    constructor() {
        if (new.target === t) throw new Error("HotkeyManager cannot be instantiated.");
    }
    static registerHotkey(t, e, n = null) {
        if (Array.isArray(t)) {
            let a = [];
            return t.forEach((t => {
                if (!this.isHotkeyFormat(t)) throw new Error("快捷键格式错误");
                let i = this.recordHotkey(t, e, n);
                a.push(i);
            })), a;
        }
        if (!this.isHotkeyFormat(t)) throw new Error("快捷键格式错误");
        return this.recordHotkey(t, e, n);
    }
    static recordHotkey(t, e, n) {
        let a = Math.random().toString(36).substr(2);
        return this.registerHotKeyMap.set(a, {
            hotkeyString: t,
            callback: e,
            keyupCallback: n
        }), a;
    }
    static unregisterHotkey(t) {
        this.registerHotKeyMap.has(t) && this.registerHotKeyMap.delete(t);
    }
    static isHotkeyFormat(t) {
        return t.toLowerCase().split("+").map((t => t.trim())).every((t => [ "ctrl", "shift", "alt" ].includes(t) || 1 === t.length));
    }
    static judgeHotkey(t, e) {
        const n = t.toLowerCase().split("+").map((t => t.trim())), a = n.includes("ctrl"), i = n.includes("shift"), s = n.includes("alt"), o = n.find((t => "ctrl" !== t && "shift" !== t && "alt" !== t));
        return (this.isMac ? e.metaKey : e.ctrlKey) === a && e.shiftKey === i && e.altKey === s && e.key.toLowerCase() === o;
    }
};

r(q, "isMac", 0 === navigator.platform.indexOf("Mac")), r(q, "registerHotKeyMap", new Map), 
r(q, "handleKeydown", (t => {
    for (const [e, n] of q.registerHotKeyMap) {
        let e = n.hotkeyString, a = n.callback;
        q.judgeHotkey(e, t) && a(t);
    }
})), r(q, "handleKeyup", (t => {
    for (const [e, n] of q.registerHotKeyMap) {
        let e = n.hotkeyString, a = n.keyupCallback;
        a && (q.judgeHotkey(e, t) && a(t));
    }
}));

let V = q;

document.addEventListener("keydown", (t => {
    V.handleKeydown(t);
})), document.addEventListener("keyup", (t => {
    V.handleKeyup(t);
}));

class J extends U {
    getName() {
        return "JavTrailersPlugin";
    }
    constructor() {
        super(), this.hasBand = !1;
    }
    handle() {
        let t = window.location.href;
        if (!t.includes("handle=1")) return;
        if ($("h1:contains('Page not found')").length) {
            console.log("番号无法匹配, 跳搜索");
            let e = t.split("?")[0].split("video/")[1].toLowerCase().replace("00", "-");
            return void (window.location.href = "/search/" + encodeURIComponent(e) + window.location.search);
        }
        let e = $(".videos-list .video-link").toArray();
        if (e.length) {
            const n = t.split("?")[0].split("search/")[1].toLowerCase(), a = e.find((t => $(t).find(".vid-title").text().toLowerCase().includes(n)));
            if (a) return void (window.location.href = $(a).attr("href") + window.location.search);
        }
        this.handlePlayJavTrailers(), $("#videoPlayerContainer").on("click", (() => {
            this.handlePlayJavTrailers();
        })), window.addEventListener("message", (t => {
            let e = document.getElementById("vjs_video_3_html5_api");
            e && (e.currentTime += 5);
        }));
        const n = new URLSearchParams(window.location.search), a = n.get("filterHotKey"), i = n.get("favoriteHotKey"), s = n.get("speedVideoHotKey");
        a && V.registerHotkey(a, (() => window.parent.postMessage(a, "*"))), i && V.registerHotkey(i, (() => window.parent.postMessage(i, "*"))), 
        s && V.registerHotkey(s, (() => {
            const t = document.getElementById("vjs_video_3_html5_api");
            t && (t.currentTime += 5);
        }));
    }
    handlePlayJavTrailers() {
        this.hasBand || (utils.loopDetector((() => 0 !== $("#vjs_video_3_html5_api").length), (() => {
            setTimeout((() => {
                this.hasBand = !0;
                let t = document.getElementById("vjs_video_3_html5_api");
                console.log(t), t.play(), t.currentTime = 5, t.addEventListener("timeupdate", (function() {
                    t.currentTime >= 14 && t.currentTime < 16 && (t.currentTime += 2);
                })), $("#vjs_video_3_html5_api").css({
                    position: "fixed",
                    width: "100vw",
                    height: "100vh",
                    objectFit: "cover",
                    zIndex: "999999999"
                }), $(".vjs-control-bar").css({
                    position: "fixed",
                    bottom: "20px",
                    zIndex: "999999999"
                });
            }), 100);
        })), utils.loopDetector((() => $("#vjs_video_3 canvas").length > 0), (() => {
            0 !== $("#vjs_video_3 canvas").length && $("#vjs_video_3 canvas").css({
                position: "fixed",
                width: "100vw",
                height: "100vh",
                objectFit: "cover",
                top: "0",
                right: "0",
                zIndex: "999999998"
            });
        })));
    }
}

class G extends U {
    getName() {
        return "SubTitleCatPlugin";
    }
    handle() {
        $(".t-banner-inner").hide(), $("#navbar").hide();
        let t = new URLSearchParams(window.location.search).get("search").toLowerCase(), e = $(".sub-table tr td a").toArray(), n = 0;
        e.forEach((e => {
            let a = $(e);
            a.text().toLowerCase().includes(t) ? n++ : a.parent().parent().hide();
        })), 0 === n && show.error("该番号无字幕!");
        const a = $(".sec-title"), i = a.html().replace(/^\d+/, n);
        a.html(i);
    }
}

const Y = "https://jdforrepam.com/api";

async function Q() {
    const t = "jhs_review_ts", e = "jhs_review_sign", n = Math.floor(Date.now() / 1e3);
    if (n - (localStorage.getItem(t) || 0) <= 20) return localStorage.getItem(e);
    const a = `${n}.lpw6vgqzsp.${md5(`${n}71cf27bb3c0bcdf207b64abecddc970098c7421ee7203b9cdae54478478a199e7d5a6e1a57691123c1a931c057842fb73ba3b3c83bcd69c17ccf174081e3d8aa`)}`;
    return localStorage.setItem(t, n), localStorage.setItem(e, a), a;
}

const X = async (t, e = 1, n = 20) => {
    let a = `${Y}/v1/movies/${t}/reviews`, i = {
        jdSignature: await Q()
    };
    return (await http.get(a, {
        page: e,
        sort_by: "hotly",
        limit: n
    }, i)).data.reviews;
}, Z = async t => {
    let e = `${Y}/v4/movies/${t}`, n = {
        jdSignature: await Q()
    };
    const a = await http.get(e, null, n);
    if (!a.data) throw show.error("获取视频详情失败: " + a.message), new Error(a.message);
    const i = a.data.movie, s = i.preview_images, o = [];
    return s.forEach((t => {
        o.push(t.large_url.replace("https://tp-iu.cmastd.com/rhe951l4q", "https://c0.jdbstatic.com"));
    })), {
        movieId: i.id,
        actors: i.actors,
        title: i.origin_title,
        carNum: i.number,
        score: i.score,
        releaseDate: i.release_date,
        watchedCount: i.watched_count,
        imgList: o
    };
}, tt = async (t, e = 1, n = 20) => {
    let a = `${Y}/v1/lists/related?movie_id=${t}&page=${e}&limit=${n}`, i = {
        jdSignature: await Q()
    };
    const s = await gmHttp.get(a, null, i, 3e3), o = [];
    return s.data.lists.forEach((t => {
        o.push({
            relatedId: t.id,
            name: t.name,
            movieCount: t.movies_count,
            collectionCount: t.collections_count,
            viewCount: t.views_count,
            createTime: utils.formatDate(t.created_at)
        });
    })), o;
};

class et extends U {
    getName() {
        return "Fc2Plugin";
    }
    async initCss() {
        return "\n            <style>\n                /* 弹层样式 */\n                .movie-detail-layer .layui-layer-title {\n                    font-size: 18px;\n                    color: #333;\n                    background: #f8f8f8;\n                }\n                \n                \n                /* 容器样式 */\n                .movie-detail-container {\n                    margin: 40px;\n                    height: 100%;\n                    background: #fff;\n                }\n                \n                .movie-poster-container {\n                    flex: 0 0 60%;\n                    padding: 15px;\n                }\n                \n                .right-box {\n                    flex: 1;\n                    padding: 20px;\n                    overflow-y: auto;\n                }\n                \n                /* 预告片iframe */\n                .movie-trailer {\n                    width: 100%;\n                    height: 100%;\n                    min-height: 400px;\n                    background: #000;\n                    border-radius: 4px;\n                }\n                \n                /* 电影信息样式 */\n                .movie-title {\n                    font-size: 24px;\n                    margin-bottom: 15px;\n                    color: #333;\n                }\n                \n                .movie-meta {\n                    margin-bottom: 20px;\n                    color: #666;\n                }\n                \n                .movie-meta span {\n                    margin-right: 15px;\n                }\n                \n                /* 演员列表 */\n                .actor-list {\n                    display: flex;\n                    flex-wrap: wrap;\n                    gap: 8px;\n                    margin-top: 10px;\n                }\n                \n                .actor-tag {\n                    padding: 4px 12px;\n                    background: #f0f0f0;\n                    border-radius: 15px;\n                    font-size: 12px;\n                    color: #555;\n                }\n                \n                /* 图片列表 */\n                .image-list {\n                    display: flex;\n                    flex-wrap: wrap;\n                    gap: 10px;\n                    margin-top: 10px;\n                }\n                \n                .movie-image-thumb {\n                    width: 120px;\n                    height: 80px;\n                    object-fit: cover;\n                    border-radius: 4px;\n                    cursor: pointer;\n                    transition: transform 0.3s;\n                }\n                \n                .movie-image-thumb:hover {\n                    transform: scale(1.05);\n                }\n                \n                /* 加载中和错误状态 */\n                .search-loading, .movie-error {\n                    padding: 40px;\n                    text-align: center;\n                    color: #999;\n                }\n                \n                .movie-error {\n                    color: #f56c6c;\n                }\n                \n                .fancybox-container{\n                    z-index:99999999\n                 }\n                 \n                 \n                 /* 错误提示样式 */\n                .movie-not-found, .movie-error {\n                    text-align: center;\n                    padding: 30px;\n                    color: #666;\n                }\n                \n                .movie-not-found h3, .movie-error h3 {\n                    color: #f56c6c;\n                    margin: 15px 0;\n                }\n                \n                .icon-warning, .icon-error {\n                    font-size: 50px;\n                    color: #e6a23c;\n                }\n                \n                .icon-error {\n                    color: #f56c6c;\n                }\n                \n                .fc2-movie-panel-info .panel-block {\n                    padding: 0 !important;\n                }\n            </style>\n        ";
    }
    handle() {
        let t = "/advanced_search?type=3&score_min=0&d=1";
        if ($('.navbar-item:contains("FC2")').attr("href", t), $('.tabs a:contains("FC2")').attr("href", t), 
        $("h2.section-title").contents().first().replaceWith("Fc2PPV"), $(".section .container > .box").remove(), 
        window.location.href.includes("collection_codes?movieId")) {
            $("section").html("");
            const t = new URLSearchParams(window.location.search);
            let e = t.get("movieId"), n = t.get("carNum"), a = t.get("url");
            e && n && a && this.openFc2Dialog(e, n, a);
        }
    }
    loadData(t, e) {
        let n = e.replace("FC2-", "");
        this.handleMovieDetail(t), this.handleLongImg(n), this.handleMagnets(t);
        this.getBean("reviewPlugin").showReview(t, $("#reviews-content")).then(), this.getBean("RelatedPlugin").showRelated($("#related-content")).then();
    }
    handleMovieDetail(t) {
        Z(t).then((t => {
            const e = t.actors || [], n = t.imgList || [];
            let a = "";
            if (e.length > 0) {
                let t = "";
                for (let n = 0; n < e.length; n++) {
                    let i = e[n];
                    a += `<span class="actor-tag"><a href="/actors/${i.id}" target="_blank">${i.name}</a></span>`, 
                    0 === i.gender && (t += i.name + " ");
                }
                $("#data-actress").text(t);
            } else a = '<span class="no-data">暂无演员信息</span>';
            let i = "";
            i = Array.isArray(n) && n.length > 0 ? n.map(((t, e) => `\n                <a href="${t}" data-fancybox="movie-gallery" data-caption="剧照 ${e + 1}">\n                    <img src="${t}" class="movie-image-thumb"  alt=""/>\n                </a>\n            `)).join("") : '<div class="no-data">暂无剧照</div>', 
            $(".movie-info-container").html(`\n                <h3 class="movie-title"><strong class="current-title">${t.title || "无标题"}</strong></h3>\n                <div class="movie-meta">\n                    <span><strong>番号: </strong>${t.carNum || "未知"}</span>\n                    <span><strong>年份: </strong>${t.releaseDate || "未知"}</span>\n                    <span><strong>评分: </strong>${t.score || "无"}</span>\n                </div>\n                <div class="movie-meta">\n                    <span>\n                        <strong>站点: </strong>\n                        <a href="https://fc2ppvdb.com/articles/${t.carNum.replace("FC2-", "")}" target="_blank">fc2ppvdb</a>\n                        <a style="margin-left: 5px;" href="https://adult.contents.fc2.com/article/${t.carNum.replace("FC2-", "")}/" target="_blank">fc2电子市场</a>\n                    </span>\n                </div>\n                <div class="movie-actors">\n                    <div class="actor-list"><strong>主演: </strong>${a}</div>\n                </div>\n                <div class="movie-gallery" style="margin-top:10px">\n                    <strong>剧照: </strong>\n                    <div class="image-list">${i}</div>\n                </div>\n            `), 
            this.getBean("DetailPagePlugin").translate().then();
        })).catch((t => {
            console.error(t), $(".movie-info-container").html(`\n                <div class="movie-error">加载失败: ${t.message}</div>\n            `);
        }));
    }
    handleLongImg(t) {
        utils.loopDetector((() => $(".movie-gallery .image-list").length > 0), (async () => {
            $(".movie-gallery .image-list").prepend(' <a class="tile-item screen-container" style="overflow:hidden;max-height: 150px;max-width:150px; text-align:center;"><div style="margin-top: 50px;color: #000;cursor: auto">正在加载缩略图</div></a> ');
            const e = await this.getBean("ScreenShotPlugin").getScreenshot(t);
            e && ($(".screen-container").html(`<img src="${e}" alt="" loading="lazy" style="width: 100%;">`), 
            $(".screen-container").on("click", (t => {
                t.stopPropagation(), t.preventDefault(), showImageViewer(t.currentTarget);
            })));
        }));
    }
    handleMagnets(t) {
        (async t => {
            let e = `${Y}/v1/movies/${t}/magnets`, n = {
                jdSignature: await Q()
            };
            return (await http.get(e, null, n)).data.magnets;
        })(t).then((t => {
            let e = "";
            if (t.length > 0) for (let n = 0; n < t.length; n++) {
                let a = t[n], i = "";
                n % 2 == 0 && (i = "odd"), e += `\n                        <div class="item columns is-desktop ${i}">\n                            <div class="magnet-name column is-four-fifths">\n                                <a href="magnet:?xt=urn:btih:${a.hash}" title="右鍵點擊並選擇「複製鏈接地址」">\n                                    <span class="name">${a.name}</span>\n                                    <br>\n                                    <span class="meta">\n                                        ${(a.size / 1024).toFixed(2)}GB, ${a.files_count}個文件 \n                                     </span>\n                                    <br>\n                                    <div class="tags">\n                                        ${a.hd ? '<span class="tag is-primary is-small is-light">高清</span>' : ""}\n                                        ${a.cnsub ? '<span class="tag is-warning is-small is-light">字幕</span>' : ""}\n                                    </div>\n                                </a>\n                            </div>\n                            <div class="buttons column">\n                                <button class="button is-info is-small copy-to-clipboard" data-clipboard-text="magnet:?xt=urn:btih:${a.hash}" type="button">&nbsp;複製&nbsp;</button>\n                            </div>\n                            <div class="date column"><span class="time">${a.created_at}</span></div>\n                        </div>\n                    `;
            } else e = '<span class="no-data">暂无磁力信息</span>';
            $("#magnets-content").html(e), $(".buttons button[data-clipboard-text*='magnet:']").each(((t, e) => {
                $(e).parent().append($("<button>").text("115离线下载").addClass("button is-info is-small").click((async t => {
                    t.stopPropagation(), t.preventDefault();
                    let n = loading();
                    try {
                        await this.getBean("WangPan115TaskPlugin").handleAddTask($(e).attr("data-clipboard-text"));
                    } catch (a) {
                        show.error("发生错误:" + a), console.error(a);
                    } finally {
                        n.close();
                    }
                })));
            }));
        })).catch((t => {
            console.error(t), $("#magnets-content").html(`\n                <div class="movie-error">加载失败: ${t.message}</div>\n            `);
        }));
    }
    async handleVideo(t) {
        const e = this.getBean("Fc2By123AvPlugin");
        let n = loading();
        try {
            const n = await e.getBaseUrl();
            let a = `${n}/search?keyword=${t}`;
            const i = await gmHttp.get(a);
            const s = $(i).find(".box-item");
            if (0 === s.length) throw new Error("搜索无结果");
            for (let o = 0; o < s.length; o++) {
                const a = $(s[o]);
                let i = a.find("img").attr("title");
                const r = a.find(".detail a").attr("href"), l = n + (r.startsWith("/") ? r : "/" + r);
                if (i && i.includes(t)) {
                    const {id: t, publishDate: n, title: a, moviePoster: i} = await e.get123AvVideoInfo(l), s = await e.getMovie(t, i);
                    if (s.length > 0) {
                        $(".movie-trailer").attr("src", s[0].url);
                        let t = '\n                            <div class="movie-gallery" style="margin-bottom: 10px"> \n                            <span>影片: </span> \n                            <div class="movie-parts-list">\n                        ';
                        s.forEach(((e, n) => {
                            t += `\n                                <a class="movie-part a-outline" data-url="${e.url}" style="margin-left: 0">\n                                    部分 ${n + 1}\n                                </a>\n                            `;
                        })), t += "</div> </div> ", $(".movie-gallery").after(t), $(".movie-parts-list").on("click", ".movie-part", (function() {
                            const t = $(this).data("url");
                            $(".movie-trailer").attr("src", t);
                        }));
                        break;
                    }
                }
            }
        } catch (a) {
            console.error(a);
            const e = this.getBean("OtherSitePlugin"), n = await e.getMissAvUrl();
            $(".movie-poster-container").html(`\n                <div class="movie-not-found">\n                    <i class="icon-warning"></i>\n                    <h3>未找到相关视频信息</h3>\n                    <p>123Av 中没有找到与当前番号相关的影片信息</p>\n                    <p style="margin:20px">请尝试以下网站</p>\n                    <p><a class="menu-btn" style="background:linear-gradient(to right, #d29494, rgb(254,98,142))" href="${n}/dm3/fc2-ppv-${t}" target="_blank">missav</a></p>\n                </div>\n            `), 
            $(".movie-trailer").hide();
        } finally {
            n.close();
        }
    }
    openFc2Dialog(t, e, n) {
        let a = e.replace("FC2-", "");
        if (n.includes("123av")) return void this.getBean("Fc2By123AvPlugin").open123AvFc2Dialog(e, n);
        let i = `\n            <div class="movie-detail-container">\n                \x3c!--<div class="movie-poster-container">\n                    <iframe class="movie-trailer" frameborder="0" allowfullscreen scrolling="no"></iframe>\n                </div>--\x3e\n               \x3c!-- <div class="right-box">--\x3e\n                    <div class="movie-info-container">\n                        <div class="search-loading">加载中...</div>\n                    </div>\n                    \n                    <div class="movie-panel-info fc2-movie-panel-info" style="margin-top:20px"><strong>第三方资源: </strong></div>\n                    \n                    <div style="margin: 30px 0">\n                        <a id="filterBtn" class="menu-btn" style="background-color:${y}"><span>${w}</span></a>\n                        <a id="favoriteBtn" class="menu-btn" style="background-color:${S}"><span>${x}</span></a>\n                        <a id="hasDownBtn" class="menu-btn" style="background-color:${_}"><span>${C}</span></a>\n                        <a id="hasWatchBtn" class="menu-btn" style="background-color:${B};"><span>${P}</span></a>\n                        \n                        <a id="search-subtitle-btn" class="menu-btn fr-btn" style="background:linear-gradient(to bottom, #8d5656, rgb(196,159,91))">\n                            <span>字幕 (SubTitleCat)</span>\n                        </a>\n                        <a id="xunLeiSubtitleBtn" class="menu-btn fr-btn" style="background:linear-gradient(to left, #375f7c, #2196F3)">\n                            <span>字幕 (迅雷)</span>\n                        </a>\n                        <a id="magnetSearchBtn" class="menu-btn fr-btn" style="width: 120px; background: linear-gradient(to right, rgb(245,140,1), rgb(84,161,29)); color: white; text-align: center; padding: 8px 0;">\n                            <span>磁力搜索</span>\n                        </a>\n                    </div>\n                    <div class="message video-panel" style="margin-top:20px">\n                        <div id="magnets-content" class="magnet-links" style="margin: 0 0.75rem">\n                            <div class="search-loading">加载中...</div>\n                        </div>\n                    </div>\n                    <div id="reviews-content">\n                    </div>\n                    <div id="related-content">\n                    </div>\n                    <span id="data-actress" style="display: none"></span>\n                \x3c!--</div>--\x3e\n            </div>\n        `;
        layer.open({
            type: 1,
            title: e,
            content: i,
            area: utils.getResponsiveArea([ "70%", "90%" ]),
            skin: "movie-detail-layer",
            scrollbar: !1,
            success: (i, s) => {
                this.loadData(t, e), $("#favoriteBtn").on("click", (async t => {
                    const a = $("#data-actress").text();
                    await storageManager.saveCar(e, n, a, u), window.refresh(), layer.closeAll();
                })), $("#filterBtn").on("click", (t => {
                    utils.q(t, `是否屏蔽${e}?`, (async () => {
                        const t = $("#data-actress").text();
                        await storageManager.saveCar(e, n, t, m), window.refresh(), layer.closeAll(), window.location.href.includes("collection_codes?movieId") && utils.closePage();
                    }));
                })), $("#hasDownBtn").on("click", (async t => {
                    const a = $("#data-actress").text();
                    await storageManager.saveCar(e, n, a, f), window.refresh(), layer.closeAll();
                })), $("#hasWatchBtn").on("click", (async t => {
                    const a = $("#data-actress").text();
                    await storageManager.saveCar(e, n, a, v), window.refresh(), layer.closeAll();
                })), $("#search-subtitle-btn").on("click", (t => utils.openPage(`https://subtitlecat.com/index.php?search=${e}`, e, !1, t))), 
                $("#xunLeiSubtitleBtn").on("click", (() => this.getBean("DetailPageButtonPlugin").searchXunLeiSubtitle(e))), 
                $("#magnetSearchBtn").on("click", (() => {
                    let t = this.getBean("MagnetHubPlugin").createMagnetHub(e);
                    layer.open({
                        type: 1,
                        title: "磁力搜索",
                        content: '<div id="magnetHubBox"></div>',
                        area: utils.getResponsiveArea([ "60%", "80%" ]),
                        scrollbar: !1,
                        success: () => {
                            $("#magnetHubBox").append(t);
                        }
                    });
                })), this.getBean("OtherSitePlugin").loadOtherSite(a).then(), utils.setupEscClose(s);
            },
            end() {
                window.location.href.includes("collection_codes?movieId") && utils.closePage();
            }
        });
    }
    async openFc2Page(t, e, n) {
        const a = this.getBean("OtherSitePlugin");
        let i = await a.getJavDbUrl();
        window.open(`${i}/users/collection_codes?movieId=${t}&carNum=${e}&url=${n}`);
    }
}

class nt extends U {
    getName() {
        return "HighlightMagnetPlugin";
    }
    doFilterMagnet() {
        this.handleDb(), this.handleBus();
    }
    handleDb() {
        if (!h) return;
        let t = $("#magnets-content .name");
        if (0 === t.length) return;
        const e = [ "4k", "-c", "-u", "-uc" ];
        let n = !1;
        t.each(((t, a) => {
            const i = $(a), s = i.text().toLowerCase(), o = e.some((t => s.includes(t)));
            i.parent().parent().parent().addClass("magnet-row"), s.includes("4k") && i.css("color", "#f40"), 
            o && (n = !0, i.parent().parent().parent().addClass("high-quality"));
        })), n ? $("#magnets-content .magnet-row").not(".high-quality").hide() : $("#enable-magnets-filter").addClass("do-hide");
    }
    handleBus() {
        g && isDetailPage && utils.loopDetector((() => $("#magnet-table td a").length > 0), (() => {
            const t = $("#magnet-table tr"), e = [ "4k", "-c", "-u", "-uc" ];
            let n = !1;
            t.each(((t, a) => {
                const i = $(a), s = i.find("td:first-child"), o = s.find("a:first-child"), r = s.find("a:nth-child(2)"), l = o.text().toLowerCase();
                l.includes("4k") && o.css("color", "#f40");
                (e.some((t => l.includes(t))) || r.length && r.text().includes("字幕")) && (n = !0, 
                i.addClass("high-quality"));
            })), n ? t.each(((t, e) => {
                const n = $(e);
                n.hasClass("high-quality") || n.hide();
            })) : $("#enable-magnets-filter").addClass("do-hide");
        }));
    }
    showAll() {
        if (h) {
            $("#magnets-content .item").toArray().forEach((t => $(t).show()));
        }
        g && $("#magnet-table tr").toArray().forEach((t => $(t).show()));
    }
}

class at extends U {
    getName() {
        return "FoldCategoryPlugin";
    }
    async initCss() {
        const t = await storageManager.getSetting();
        return `\n            <style>\n                #tags a.tag, .tags a.tag {\n                    position:relative;\n                }\n                .highlight-btn {\n                    position: absolute;\n                    top: -10px;\n                    right: -10px;\n                    background-color: #4CAF50;\n                    color: white;\n                    border: none;\n                    border-radius: 50%;\n                    width: 24px;\n                    height: 24px;\n                    font-size: 14px;\n                    line-height: 24px;\n                    text-align: center;\n                    cursor: pointer;\n                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);\n                    display: none;\n                    z-index: 999;\n                }\n                /* 当父元素被高亮时，按钮变为其他颜色 */\n                .highlighted .highlight-btn {\n                    background-color: #FF5722;\n                }\n                /* 高亮状态下的标签样式 */\n                .highlighted {\n                    /* 浅黄色 */\n                    border: ${t.highlightedTagNumber || 1}px solid ${t.highlightedTagColor || "#ce2222"};\n                }\n            </style>\n        `;
    }
    async handle() {
        if (this.highlightTag(), !window.isListPage) return;
        if (d.includes("advanced_search")) return;
        let t, e = $(".tabs ul");
        if (e.length > 0) {
            t = $("#tags");
            let n = $("#tags dl div.tag.is-info").map((function() {
                return $(this).text().replaceAll("\n", "").replaceAll(" ", "");
            })).get().join(" ");
            if (!n) return;
            e.append('\n                <li class="is-active" id="foldCategoryBtn">\n                    <a class="menu-btn" style="background-color:#d23e60 !important;margin-left: 20px;border-bottom:none !important;border-radius:3px;">\n                        <span></span>\n                        <i style="margin-left: 10px"></i>\n                    </a>\n                </li>\n            '), 
            $(".tabs").append(`<div style="padding-top:10px"><span>已选分类: ${n}</span></div>`);
        }
        let n = $("h2.section-title");
        if (n.length > 0 && (n.append('\n                <div id="foldCategoryBtn">\n                    <a class="menu-btn" style="background-color:#d23e60 !important;margin-left: 20px;border-bottom:none !important;border-radius:3px;">\n                        <span></span>\n                        <i style="margin-left: 10px"></i>\n                    </a>\n                </div>\n            '), 
        t = $("section > div > div.box")), !t) return;
        let a = $("#foldCategoryBtn"), i = "yes" === await storageManager.getItem(storageManager.fold_category_key), [s, o] = i ? [ "展开", "icon-angle-double-down" ] : [ "折叠", "icon-angle-double-up" ];
        a.find("span").text(s).end().find("i").attr("class", o), window.location.href.includes("noFold=1") || t[i ? "hide" : "show"](), 
        a.on("click", (async e => {
            e.preventDefault(), i = !i, await storageManager.setItem(storageManager.fold_category_key, i ? "yes" : "no");
            const [n, s] = i ? [ "展开", "icon-angle-double-down" ] : [ "折叠", "icon-angle-double-up" ];
            a.find("span").text(n).end().find("i").attr("class", s), t[i ? "hide" : "show"]();
        }));
    }
    highlightTag() {
        const t = async () => await storageManager.getItem(storageManager.highlighted_tags_key) || [];
        (async () => {
            (await t()).forEach((t => {
                $(`#tags a.tag:contains(${t})`).addClass("highlighted"), $(`.tags a.tag:contains(${t})`).addClass("highlighted");
            }));
        })().then(), $("#tags a.tag, .tags a.tag").hover((function() {
            const t = $(this), e = $('<button class="highlight-btn" title="高亮显示">★</button>');
            t.append(e), e.fadeIn(0);
        }), (function() {
            $(this).find(".highlight-btn").fadeOut(0, (function() {
                $(this).remove();
            }));
        })), $(document).on("click", ".highlight-btn", (async function(e) {
            e.stopPropagation(), e.preventDefault();
            const n = $(this).closest("a.tag"), a = n.clone();
            a.find(".highlight-btn").remove();
            const i = a.text().trim().replace(/\s*\(\d+\)$/, "");
            let s = await t();
            s.includes(i) ? (s = s.filter((t => t !== i)), n.removeClass("highlighted")) : (s.push(i), 
            n.addClass("highlighted")), await storageManager.setItem(storageManager.highlighted_tags_key, s);
        }));
    }
}

class it extends U {
    constructor() {
        super(...arguments), r(this, "apiUrl", "https://ja.wikipedia.org/wiki/");
    }
    getName() {
        return "ActressInfoPlugin";
    }
    async handle() {
        "yes" === await storageManager.getSetting("enableLoadActressInfo", "yes") && this.loadActressInfo();
    }
    loadActressInfo() {
        this.handleDetailPage().then(), this.handleStarPage().then();
    }
    async initCss() {
        return "\n            <style>\n                .info-tag {\n                    background-color: #ecf5ff;\n                    display: inline-block;\n                    height: 32px;\n                    padding: 0 10px;\n                    line-height: 30px;\n                    font-size: 12px;\n                    color: #409eff;\n                    border: 1px solid #d9ecff;\n                    border-radius: 4px;\n                    box-sizing: border-box;\n                    white-space: nowrap;\n                }\n            </style>\n        ";
    }
    async handleDetailPage() {
        if ($(".actress-info").length > 0) return;
        let t = $(".female").prev().map(((t, e) => $(e).text().trim())).get();
        if (!t.length) return;
        const e = "jhs_actress_info", n = localStorage.getItem(e) ? JSON.parse(localStorage.getItem(e)) : {};
        let a = null, i = "";
        for (let o = 0; o < t.length; o++) {
            let e = t[o];
            if (a = n[e], !a) try {
                a = await this.searchInfo(e), a && (n[e] = a);
            } catch (s) {
                console.error("该名称查询失败,尝试其它名称");
            }
            let r = "";
            r = a ? `\n                    <div class="panel-block actress-info">\n                        <strong>${e}:</strong>\n                        <a href="${a.url}" style="margin-left: 5px" target="_blank">\n                            <span class="info-tag">${a.birthday} ${a.age}</span>\n                            <span class="info-tag">${a.height} ${a.weight}</span>\n                            <span class="info-tag">${a.threeSizeText} ${a.braSize}</span>\n                        </a>\n                    </div>\n                ` : `<div class="panel-block actress-info"><a href="${this.apiUrl + e}" target="_blank"><strong>${e}:</strong></a></div> `, 
            i += r;
        }
        $('strong:contains("演員")').parent().after(i), localStorage.setItem(e, JSON.stringify(n));
    }
    async handleStarPage() {
        if ($(".actress-info").length > 0) return;
        let t = [], e = $(".actor-section-name");
        e.length && e.text().trim().split(",").forEach((e => {
            t.push(e.trim());
        }));
        let n = $(".section-meta:not(:contains('影片'))");
        if (n.length && n.text().trim().split(",").forEach((e => {
            t.push(e.trim());
        })), !t.length) return;
        const a = "jhs_actress_info", i = localStorage.getItem(a) ? JSON.parse(localStorage.getItem(a)) : {};
        let s = null;
        for (let l = 0; l < t.length; l++) {
            let e = t[l];
            if (s = i[e], s) break;
            try {
                s = await this.searchInfo(e);
            } catch (r) {
                console.error("该名称查询失败,尝试其它名称");
            }
            if (s) break;
        }
        s && t.forEach((t => {
            i[t] = s;
        }));
        let o = '<div class="actress-info" style="font-size: 17px; font-weight: normal; margin-top: 5px;">无此相关演员信息</div>';
        s && (o = `\n                <a class="actress-info" href="${s.url}" target="_blank">\n                    <div style="font-size: 17px; font-weight: normal; margin-top: 5px;">\n                        <div style="display: flex; margin-bottom: 10px;">\n                            <span style="width: 300px;">出生日期: ${s.birthday}</span>\n                            <span style="width: 200px;">年龄: ${s.age}</span>\n                            <span style="width: 200px;">身高: ${s.height}</span>\n                        </div>\n                        <div style="display: flex; margin-bottom: 10px;">\n                            <span style="width: 300px;">体重: ${s.weight}</span>\n                            <span style="width: 200px;">三围: ${s.threeSizeText}</span>\n                            <span style="width: 200px;">罩杯: ${s.braSize}</span>\n                        </div>\n                    </div>\n                </a>\n            `), 
        e.parent().append(o), localStorage.setItem(a, JSON.stringify(i));
    }
    async searchInfo(t) {
        "三上悠亞" === t && (t = "三上悠亜");
        let e = this.apiUrl + t;
        const n = await gmHttp.get(e), a = new DOMParser, i = $(a.parseFromString(n, "text/html"));
        let s = i.find('a[title="誕生日"]').parent().parent().find("td").text().trim(), o = i.find("th:contains('現年齢')").parent().find("td").text().trim() ? parseInt(i.find("th:contains('現年齢')").parent().find("td").text().trim()) + "岁" : "", r = i.find('tr:has(a[title="身長"]) td').text().trim().split(" ")[0] + "cm", l = i.find('tr:has(a[title="体重"]) td').text().trim().split("/")[1].trim();
        return "― kg" === l && (l = ""), {
            birthday: s,
            age: o,
            height: r,
            weight: l,
            threeSizeText: i.find('a[title="スリーサイズ"]').closest("tr").find("td").text().replace("cm", "").trim(),
            braSize: i.find('th:contains("ブラサイズ")').next("td").contents().first().text().trim(),
            url: e
        };
    }
}

class st extends U {
    getName() {
        return "AliyunPanPlugin";
    }
    handle() {
        $("body").append('<a class="a-success" id="refresh-token-btn" style="position:fixed; right: 0; top:50%;z-index:99999">获取refresh_token</a>'), 
        $("#refresh-token-btn").on("click", (t => {
            let e = localStorage.getItem("token");
            if (!e) return void alert("请先登录!");
            let n = JSON.parse(e).refresh_token;
            navigator.clipboard.writeText(n).then((() => {
                alert("已复制到剪切板 如失败, 请手动复制: " + n);
            })).catch((t => {
                console.error("Failed to copy refresh token: ", t);
            }));
        }));
    }
}

class ot extends U {
    constructor() {
        super(), r(this, "$contentBox", $(".section .container"));
    }
    getName() {
        return "HitShowPlugin";
    }
    handle() {
        $('a[href*="rankings/playback"]').on("click", (t => {
            t.preventDefault(), t.stopPropagation(), window.location.href = "/advanced_search?handlePlayback=1&period=daily";
        })), this.handlePlayback().then();
    }
    hookPage() {
        let t = $("h2.section-title");
        t.contents().first().replaceWith("热播"), t.css("marginBottom", "0"), $(".empty-message").remove(), 
        $(".section .container .box").remove(), $("#sort-toggle-btn").remove(), this.$contentBox.append('<div class="tool-box" style="margin-top: 10px"></div>'), 
        this.$contentBox.append('<div class="movie-list h cols-4 vcols-8" style="margin-top: 10px"></div>');
    }
    async handlePlayback() {
        if (!window.location.href.includes("handlePlayback=1")) return;
        let t = new URLSearchParams(window.location.search).get("period");
        this.toolBar(t), this.hookPage();
        let e = $(".movie-list");
        e.html("");
        let n = loading();
        try {
            const n = await (async (t = "daily", e = "high_score") => {
                let n = `${Y}/v1/rankings/playback?period=${t}&filter_by=${e}`, a = {
                    jdSignature: await Q()
                };
                return (await http.get(n, null, a)).data.movies;
            })(t);
            let a = this.markDataListHtml(n);
            e.html(a), this.loadScore(n);
        } finally {
            n.close();
        }
    }
    toolBar(t) {
        let e = `\n            <div class="button-group" style="margin-top:18px">\n                <div class="buttons has-addons" id="conditionBox">\n                    <a style="padding:18px 18px !important;" class="button is-small ${"daily" === t ? "is-info" : ""}" href="/advanced_search?handlePlayback=1&period=daily">日榜</a>\n                    <a style="padding:18px 18px !important;" class="button is-small ${"weekly" === t ? "is-info" : ""}" href="/advanced_search?handlePlayback=1&period=weekly">周榜</a>\n                    <a style="padding:18px 18px !important;" class="button is-small ${"monthly" === t ? "is-info" : ""}" href="/advanced_search?handlePlayback=1&period=monthly">月榜</a>\n                </div>\n            </div>\n        `;
        this.$contentBox.append(e);
    }
    getStarRating(t) {
        let e = "";
        const n = Math.floor(t);
        for (let a = 0; a < n; a++) e += '<i class="icon-star"></i>';
        for (let a = 0; a < 5 - n; a++) e += '<i class="icon-star gray"></i>';
        return e;
    }
    loadScore(t) {
        if (0 === t.length) return;
        (async () => {
            const e = [];
            let n = "jhs_score_info";
            for (const i of t) try {
                const t = i.id;
                if ($(`#${t}`).is(":hidden")) continue;
                const e = localStorage.getItem(n) ? JSON.parse(localStorage.getItem(n)) : {}, a = e[t];
                if (a) {
                    this.appendScoreHtml(t, a);
                    continue;
                }
                for (;!document.hasFocus(); ) await new Promise((t => setTimeout(t, 500)));
                const s = await Z(t);
                let o = s.score, r = s.watchedCount, l = `\n                        <span class="value">\n                            <span class="score-stars">${this.getStarRating(o)}</span> \n                            &nbsp; ${o}分，由${r}人評價\n                        </span>\n                    `;
                this.appendScoreHtml(t, l), e[t] = l, localStorage.setItem(n, JSON.stringify(e)), 
                await new Promise((t => setTimeout(t, 500)));
            } catch (a) {
                e.push({
                    carNum: i.number,
                    error: a.message,
                    stack: a.stack
                }), console.error(`🚨 解析评分数据失败 | 编号: ${i.number}\n`, `错误详情: ${a.message}\n`, a.stack ? `调用栈:\n${a.stack}` : "");
            }
            e.length > 0 && (show.error("解析评分数据失败, 个数:", e.length), console.table(e));
        })();
    }
    appendScoreHtml(t, e) {
        let n = $(`#score_${t}`);
        "" === n.html().trim() && n.slideUp(0, (function() {
            $(this).html(e).slideDown(500);
        }));
    }
    markDataListHtml(t) {
        let e = "";
        return t.forEach((t => {
            e += `\n                <div class="item" id="${t.id}">\n                    <a href="/v/${t.id}" class="box" title="${t.origin_title}">\n                        <div class="cover ">\n                            <img loading="lazy" src="${t.cover_url.replace("https://tp-iu.cmastd.com/rhe951l4q", "https://c0.jdbstatic.com")}" alt="">\n                        </div>\n                        <div class="video-title"><strong>${t.number}</strong> ${t.origin_title}</div>\n                        <div class="score" id="score_${t.id}">\n                        </div>\n                        <div class="meta">\n                            ${t.release_date}\n                        </div>\n                        <div class="tags has-addons">\n                           ${t.has_cnsub ? '<span class="tag is-warning">含中字磁鏈</span>' : t.magnets_count > 0 ? '<span class="tag is-success">含磁鏈</span>' : '<span class="tag is-info">无磁鏈</span>'}\n                           ${t.new_magnets ? '<span class="tag is-info">今日新種</span>' : ""}\n                        </div>\n                    </a>\n                </div>\n            `;
        })), e;
    }
}

class rt extends U {
    constructor() {
        super(), r(this, "has_cnsub", ""), r(this, "movies", []), r(this, "$contentBox", $(".section .container"));
    }
    getName() {
        return "TOP250Plugin";
    }
    handle() {
        $('.main-tabs ul li:contains("猜你喜歡")').html('<a href="/rankings/top"><span>Top250</span></a>'), 
        $('a[href*="rankings/top"]').on("click", (t => {
            t.preventDefault(), t.stopPropagation();
            const e = $(t.target), n = (e.is("a") ? e : e.closest("a")).attr("href");
            let a = n.includes("?") ? n.split("?")[1] : n;
            const i = new URLSearchParams(a);
            this.checkLogin(t, i);
        })), this.handleTop().then();
    }
    hookPage() {
        $("h2.section-title").contents().first().replaceWith("Top250"), $(".empty-message").remove(), 
        $(".section .container .box").remove(), $("#sort-toggle-btn").remove(), this.$contentBox.append('<div class="tool-box" style="margin-top: 10px"></div>'), 
        this.$contentBox.append('<div class="movie-list h cols-4 vcols-8" style="margin-top: 10px"></div>'), 
        this.renderPagination();
    }
    renderPagination() {
        const t = new URLSearchParams(window.location.search);
        let e = parseInt(t.get("page")) || 1;
        this.$contentBox.append((t => {
            const e = t >= 5;
            let n = "";
            for (let a = 1; a <= 5; a++) {
                n += `<li><a class="pagination-link ${t === a ? "is-current" : ""}" data-page="${a}">${a}</a></li>`;
            }
            return `\n                <nav class="pagination">\n                    <a class="pagination-previous ${t <= 1 ? "do-hide" : ""}" data-page="${t - 1}">上一頁</a>\n                    <a class="pagination-next ${e ? "do-hide" : ""}" data-page="${t + 1}">下一頁</a>\n                    \n                    <ul class="pagination-list">\n                        ${n}\n                    </ul>\n                </nav>\n            `;
        })(e)), this.$contentBox.on("click", ".pagination-link, .pagination-previous, .pagination-next", (e => {
            e.preventDefault();
            const n = parseInt($(e.currentTarget).data("page"));
            !isNaN(n) && n > 0 && (e => {
                t.set("page", e), window.history.pushState({}, "", "?" + t.toString()), window.location.reload();
            })(n);
        }));
    }
    async handleTop() {
        if (!window.location.href.includes("handleTop=1")) return;
        const t = new URLSearchParams(window.location.search);
        let e = t.get("handleType") || "all", n = t.get("type_value") || "";
        this.has_cnsub = t.get("has_cnsub") || "";
        let a = t.get("page") || 1;
        this.toolBar(e, n, a), this.hookPage();
        let i = $(".movie-list");
        i.html("");
        let s = loading();
        try {
            const t = await (async (t = "all", e = "", n = 1, a = 40) => {
                let i = `${Y}/v1/movies/top?start_rank=1&type=${t}&type_value=${e}&ignore_watched=false&page=${n}&limit=${a}`, s = {
                    "user-agent": "Dart/3.5 (dart:io)",
                    "accept-language": "zh-TW",
                    host: "jdforrepam.com",
                    authorization: "Bearer " + await storageManager.getItem("appAuthorization"),
                    jdsignature: await Q()
                };
                return await gmHttp.get(i, null, s);
            })(e, n, a, 50);
            let s = t.success, o = t.message, r = t.action;
            if (1 === s) {
                let e = t.data.movies;
                if (0 === e.length) return void show.error("无数据");
                this.movies = e;
                const n = this.getBean("hitShowPlugin");
                let a = n.markDataListHtml(e);
                i.html(a), window.refresh(), "1" === this.has_cnsub ? ($(".item:contains('含中字磁鏈')").show(), 
                $(".item:contains('含磁鏈')").hide()) : "0" === this.has_cnsub ? ($(".item:contains('含中字磁鏈')").hide(), 
                $(".item:contains('含磁鏈')").show()) : ($(".item:contains('含中字磁鏈')").show(), $(".item:contains('含磁鏈')").show()), 
                n.loadScore(e);
            } else console.error(t), i.html(`<h3>${o}</h3>`), show.error(o);
            "JWTVerificationError" === r && (await storageManager.removeItem("appAuthorization"), 
            await this.checkLogin(null, new URLSearchParams(window.location.search)));
        } catch (o) {
            console.error("获取Top数据失败:", o), show.error(`获取Top数据失败: ${o ? o.message : o}`);
        } finally {
            s.close();
        }
    }
    toolBar(t, e, n) {
        "5" === n.toString() && $(".pagination-next").remove(), $(".pagination-ellipsis").closest("li").remove(), 
        $(".pagination-list li a").each((function() {
            parseInt($(this).text()) > 5 && $(this).closest("li").remove();
        }));
        let a = "";
        for (let s = (new Date).getFullYear(); s >= 2008; s--) a += `\n                <a style="padding:18px 18px !important;" \n                   class="button is-small ${e === s.toString() ? "is-info" : ""}" \n                   href="/advanced_search?handleTop=1&handleType=year&type_value=${s}&has_cnsub=${this.has_cnsub}">\n                  ${s}\n                </a>\n            `;
        let i = `\n            <div class="button-group">\n                <div class="buttons has-addons" id="conditionBox" style="margin-bottom: 0!important;">\n                    <a style="padding:18px 18px !important;" class="button is-small ${"all" === t ? "is-info" : ""}" href="/advanced_search?handleTop=1&handleType=all&type_value=&has_cnsub=${this.has_cnsub}">全部</a>\n                    <a style="padding:18px 18px !important;" class="button is-small ${"0" === e ? "is-info" : ""}" href="/advanced_search?handleTop=1&handleType=video_type&type_value=0&has_cnsub=${this.has_cnsub}">有码</a>\n                    <a style="padding:18px 18px !important;" class="button is-small ${"1" === e ? "is-info" : ""}" href="/advanced_search?handleTop=1&handleType=video_type&type_value=1&has_cnsub=${this.has_cnsub}">无码</a>\n                    <a style="padding:18px 18px !important;" class="button is-small ${"2" === e ? "is-info" : ""}" href="/advanced_search?handleTop=1&handleType=video_type&type_value=2&has_cnsub=${this.has_cnsub}">欧美</a>\n                    <a style="padding:18px 18px !important;" class="button is-small ${"3" === e ? "is-info" : ""}" href="/advanced_search?handleTop=1&handleType=video_type&type_value=3&has_cnsub=${this.has_cnsub}">Fc2</a>\n                    \n                    <a style="padding:18px 18px !important;margin-left: 50px" class="button is-small ${"1" === this.has_cnsub ? "is-info" : ""}" data-cnsub-value="1">含中字磁鏈</a>\n                    <a style="padding:18px 18px !important;" class="button is-small ${"0" === this.has_cnsub ? "is-info" : ""}" data-cnsub-value="0">无字幕</a>\n                    <a style="padding:18px 18px !important;" class="button is-small" data-cnsub-value="">重置</a>\n                </div>\n                \n                <div class="buttons has-addons" id="conditionBox">\n                    ${a}\n                </div>\n            </div>\n        `;
        this.$contentBox.append(i), $("a[data-cnsub-value]").on("click", (t => {
            const e = $(t.currentTarget).data("cnsub-value");
            this.has_cnsub = e.toString(), $("a[data-cnsub-value]").removeClass("is-info"), 
            $(t.currentTarget).addClass("is-info"), $(".toolbar a.button").not("[data-cnsub-value]").each(((t, n) => {
                const a = $(n), i = new URL(a.attr("href"), window.location.origin);
                i.searchParams.set("has_cnsub", e), a.attr("href", i.toString());
            }));
            const n = new URL(window.location.href);
            n.searchParams.set("has_cnsub", e), history.pushState({}, "", n.toString()), "1" === this.has_cnsub ? ($(".item:contains('含中字磁鏈')").show(), 
            $(".item:contains('含磁鏈')").hide()) : "0" === this.has_cnsub ? ($(".item:contains('含中字磁鏈')").hide(), 
            $(".item:contains('含磁鏈')").show()) : ($(".item:contains('含中字磁鏈')").show(), $(".item:contains('含磁鏈')").show());
            this.getBean("hitShowPlugin").loadScore(this.movies);
        }));
    }
    async checkLogin(t, e) {
        if (!(await storageManager.getItem("appAuthorization"))) return show.error("该类别依赖移动端接口，请先完成登录"), 
        void this.openLoginDialog();
        let n = "all", a = "", i = e.get("t") || "";
        /^y\d+$/.test(i) ? (n = "year", a = i.substring(1)) : "" !== i && (n = "video_type", 
        a = i);
        let s = `/advanced_search?handleTop=1&handleType=${n}&type_value=${a}`;
        t && (t.ctrlKey || t.metaKey) ? GM_openInTab(window.location.origin + s, {
            insert: 0
        }) : window.location.href = s;
    }
    openLoginDialog() {
        layer.open({
            type: 1,
            title: "JavDB",
            closeBtn: 1,
            area: [ "360px", "auto" ],
            shadeClose: !1,
            content: '\n                <div style="padding: 30px; font-family: \'Helvetica Neue\', Arial, sans-serif;">\n                    <div style="margin-bottom: 25px;">\n                        <input type="text" id="username" name="username" \n                            style="width: 100%; padding: 12px 15px; border: 1px solid #e0e0e0; border-radius: 4px; \n                                   box-sizing: border-box; transition: all 0.3s; font-size: 14px;\n                                   background: #f9f9f9; color: #333;"\n                            placeholder="用户名 | 邮箱"\n                            onfocus="this.style.borderColor=\'#4a8bfc\'; this.style.background=\'#fff\'"\n                            onblur="this.style.borderColor=\'#e0e0e0\'; this.style.background=\'#f9f9f9\'">\n                    </div>\n                    \n                    <div style="margin-bottom: 15px;">\n                        <input type="password" id="password" name="password" \n                            style="width: 100%; padding: 12px 15px; border: 1px solid #e0e0e0; border-radius: 4px; \n                                   box-sizing: border-box; transition: all 0.3s; font-size: 14px;\n                                   background: #f9f9f9; color: #333;"\n                            placeholder="密码"\n                            onfocus="this.style.borderColor=\'#4a8bfc\'; this.style.background=\'#fff\'"\n                            onblur="this.style.borderColor=\'#e0e0e0\'; this.style.background=\'#f9f9f9\'">\n                    </div>\n                    \n                    <button id="loginBtn" \n                            style="width: 100%; padding: 12px; background: #4a8bfc; color: white; \n                                   border: none; border-radius: 4px; font-size: 15px; cursor: pointer;\n                                   transition: background 0.3s;"\n                            onmouseover="this.style.background=\'#3a7be0\'"\n                            onmouseout="this.style.background=\'#4a8bfc\'">\n                        登录\n                    </button>\n                </div>\n            ',
            success: (t, e) => {
                $("#loginBtn").click((function() {
                    const t = $("#username").val(), n = $("#password").val();
                    if (!t || !n) return void show.error("请输入用户名和密码");
                    let a = loading();
                    (async (t, e) => {
                        let n = `${Y}//v1/sessions?username=${encodeURIComponent(t)}&password=${encodeURIComponent(e)}&device_uuid=04b9534d-5118-53de-9f87-2ddded77111e&device_name=iPhone&device_model=iPhone&platform=ios&system_version=17.4&app_version=official&app_version_number=1.9.29&app_channel=official`, a = {
                            "user-agent": "Dart/3.5 (dart:io)",
                            "accept-language": "zh-TW",
                            "content-type": "multipart/form-data; boundary=--dio-boundary-2210433284",
                            jdsignature: await Q()
                        };
                        return await gmHttp.post(n, null, a);
                    })(t, n).then((async t => {
                        let n = t.success;
                        if (0 === n) show.error(t.message); else {
                            if (1 !== n) throw console.error("登录失败", t), new Error(t.message);
                            {
                                let n = t.data.token;
                                await storageManager.setItem("appAuthorization", n), await storageManager.setItem("appUser", t.data), 
                                show.ok("登录成功"), layer.close(e), window.location.href = "/advanced_search?handleTop=1&period=daily";
                            }
                        }
                    })).catch((t => {
                        console.error("登录异常:", t), show.error(t.message);
                    })).finally((() => {
                        a.close();
                    }));
                }));
            }
        });
    }
}

class lt extends U {
    getName() {
        return "NavBarPlugin";
    }
    handle() {
        if (this.margeNav(), this.hookSearch(), this.hookOldSearch(), this.toggleOtherNavItem(), 
        $(window).resize(this.toggleOtherNavItem), window.location.href.includes("/search?q")) {
            const t = new URLSearchParams(window.location.search);
            let e = t.get("q"), n = t.get("f");
            $("#search-keyword").val(e), $("#search-type").val(n);
        }
    }
    hookSearch() {
        $("#navbar-menu-hero").after('\n            <div class="navbar-menu" id="search-box">\n                <div class="navbar-start" style="display: flex; align-items: center; gap: 5px;">\n                    <select id="search-type" style="padding: 8px 12px; border: 1px solid #555; border-radius: 4px; background-color: #333; color: #eee; font-size: 14px; outline: none;">\n                        <option value="all">影片</option>\n                        <option value="actor">演員</option>\n                        <option value="series">系列</option>\n                        <option value="maker">片商</option>\n                        <option value="director">導演</option>\n                        <option value="code">番號</option>\n                        <option value="list">清單</option>\n                    </select>\n                    <input id="search-keyword" type="text" placeholder="輸入影片番號，演員名等關鍵字進行檢索" style="padding: 8px 12px; border: 1px solid #555; border-radius: 4px; flex-grow: 1; font-size: 14px; background-color: #333; color: #eee; outline: none;">\n                    <a href="/advanced_search?noFold=1" title="進階檢索" style="padding: 6px 12px; background-color: #444; border-radius: 4px; text-decoration: none; color: #ddd; font-size: 14px; border: 1px solid #555;"><span>...</span></a>\n                    <a id="search-img-btn" style="padding: 6px 16px; background-color: #444; color: #fff; border-radius: 4px; text-decoration: none; font-weight: 500; cursor: pointer; border: 1px solid #555;">识图</a>\n                    <a id="search-btn" style="padding: 6px 16px; background-color: #444; color: #fff; border-radius: 4px; text-decoration: none; font-weight: 500; cursor: pointer; border: 1px solid #555;">檢索</a>\n                </div>\n            </div>\n        '), 
        $("#search-keyword").on("paste", (t => {
            setTimeout((() => {
                $("#search-btn").click();
            }), 0);
        })).on("keypress", (t => {
            "Enter" === t.key && setTimeout((() => {
                $("#search-btn").click();
            }), 0);
        })), $("#search-btn").on("click", (t => {
            let e = $("#search-keyword").val(), n = $("#search-type option:selected").val();
            "" !== e && (window.location.href.includes("/search?q") ? window.location.href = "/search?q=" + e + "&f=" + n : window.open("/search?q=" + e + "&f=" + n));
        })), $("#search-img-btn").on("click", (() => {
            this.getBean("SearchByImagePlugin").open();
        }));
    }
    hookOldSearch() {
        const t = document.querySelector(".search-image");
        if (!t) return;
        const e = t.cloneNode(!0);
        t.parentNode.replaceChild(e, t), $("#button-search-image").attr("data-tooltip", "以图识图"), 
        $(".search-image").on("click", (t => {
            this.getBean("SearchByImagePlugin").open();
        }));
    }
    margeNav() {
        $('a[href*="/feedbacks/new"]').remove(), $('a[href*="theporndude.com"]').remove(), 
        $('a.navbar-link[href="/makers"]').parent().after('\n            <div class="navbar-item has-dropdown is-hoverable">\n                <a class="navbar-link">其它</a>\n                <div class="navbar-dropdown is-boxed">\n                  <a class="navbar-item" href="/feedbacks/new" target="_blank" >反饋</a>\n                  <a class="navbar-item" rel="nofollow noopener" target="_blank" href="https://theporndude.com/zh">ThePornDude</a>\n                </div>\n              </div>\n        ');
    }
    toggleOtherNavItem() {
        let t = $("#search-box"), e = $("#search-bar-container");
        $(window).width() < 1600 && $(window).width() > 1023 && (t.hide(), e.show()), $(window).width() > 1600 && (t.show(), 
        e.hide());
    }
}

class ct {
    constructor() {
        this.queue = Promise.resolve();
    }
    addTask(t) {
        this.queue = this.queue.then((() => t())).catch((t => {
            console.error("执行异步任务失败:", t);
        }));
    }
}

class dt extends U {
    constructor() {
        super(...arguments), r(this, "okBackgroundColor", "#7bc73b"), r(this, "errorBackgroundColor", "#de3333"), 
        r(this, "timeout", "2000"), r(this, "retry", 10), r(this, "settingCache", null), 
        r(this, "lastFetchTime", 0), r(this, "CACHE_DURATION", 1e4);
    }
    getName() {
        return "OtherSitePlugin";
    }
    async initCss() {
        return "\n            <style>\n                .site-btn {\n                    position: relative !important;\n                    min-width: 80px;\n                    display: inline-block !important;\n                    padding: 5px 10px;\n                    color: white !important;\n                    background-color:#938585;\n                    text-decoration: none;\n                    border-radius: 4px;\n                    text-align: center;\n                    margin-bottom: 5px;\n                }\n                .site-btn:hover {\n                    color: white;\n                    transform: translateY(-2px);\n                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);\n                }\n                .site-tag {\n                    position: absolute; \n                    top: -15px; \n                    right: 0; \n                    background-color: #ffc107; \n                    color: #333; \n                    font-size: 12px; \n                    padding: 2px 6px; \n                    border-radius: 4px;\n                }\n            </style>\n        ";
    }
    async handle() {
        isDetailPage && this.loadOtherSite().then();
    }
    async loadOtherSite(t) {
        if ("yes" !== await storageManager.getSetting("enableLoadOtherSite", "yes")) return;
        const e = [ {
            id: "javTrailersBtn",
            getUrl: async () => await this.getJavTrailersUrl(),
            boxSelector: ".videos-list .video-link",
            searchPath: (t, e) => `${t}/search/${e}`,
            getHref: t => t.attr("href"),
            getTitle: t => t.find("p.card-text").text()
        }, {
            id: "missAvBtn",
            getUrl: async () => await this.getMissAvUrl(),
            boxSelector: ".text-secondary",
            searchPath: (t, e) => `${t}/search/${e}`,
            getHref: t => t.attr("href"),
            getTitle: t => t.text()
        }, {
            id: "123AvBtn",
            getUrl: async () => await this.getAv123Url() + "/ja",
            boxSelector: ".box-item",
            searchPath: (t, e) => `${t}/search?keyword=${e}`,
            getHref: t => t.find(".detail a").attr("href"),
            getTitle: t => t.find("img").attr("title")
        }, {
            id: "jableBtn",
            getUrl: async () => await this.getjableUrl(),
            boxSelector: "#list_videos_videos_list_search_result .detail .title a",
            searchPath: (t, e) => `${t}/search/${e}/`,
            getHref: t => t.attr("href"),
            getTitle: t => t.text()
        }, {
            id: "avgleBtn",
            getUrl: async () => await this.getAvgleUrl(),
            boxSelector: ".text-secondary",
            searchPath: (t, e) => `${t}/vod/search.html?wd=${e}`,
            getHref: t => t.attr("href"),
            getTitle: t => t.text()
        }, {
            id: "javDbBtn",
            getUrl: async () => await this.getJavDbUrl(),
            boxSelector: ".movie-list .item",
            searchPath: (t, e) => `${t}/search?q=${e}`,
            getHref: t => t.find("a").attr("href"),
            getTitle: t => t.find(".video-title").text(),
            condition: t => g
        }, {
            id: "javBusBtn",
            getUrl: async () => await this.getJavBusUrl(),
            boxSelector: ".container h3",
            searchPath: (t, e) => `${t}/${e}`,
            getHref: (e, n) => `${n}/${t}`,
            getTitle: t => t.text(),
            condition: t => h && !t.toLowerCase().includes("fc2")
        } ];
        t || (t = this.getPageInfo().carNum);
        const n = `\n            <div id="otherSiteBox" class="panel-block" style="${h ? "margin-top:8px;font-size:13px" : "margin-top:10px;font-size:13px"}">\n                <div style="display: flex;gap: 5px;flex-wrap: wrap">\n                    ${e.map((e => e.condition && !1 === e.condition(t) ? "" : `<a target="_blank" class="site-btn" id="${e.id}"><span>${e.id.replace("Btn", "")}</span></a>`)).join("")}\n                </div>\n            </div>\n        `;
        $(".movie-panel-info").append(n), $(".container .info").append(n), $("#javTrailersBtn").on("click", (async e => {
            e.preventDefault();
            let n = await storageManager.getSetting();
            const a = n.filterHotKey, i = n.favoriteHotKey, s = n.speedVideoHotKey;
            let o = $("#javTrailersBtn").attr("href"), r = o + `?handle=1&filterHotKey=${a}&favoriteHotKey=${i}&speedVideoHotKey=${s}`;
            e && (e.ctrlKey || e.metaKey) && (r = o), utils.openPage(r, t, !1, e);
        })), await Promise.all(e.map((async e => {
            e.condition && !1 === e.condition(t) || await this.handleSite(t, e);
        })));
    }
    async handleSite(t, e) {
        const n = $(`#${e.id}`);
        try {
            const a = "jhs_other_site", i = localStorage.getItem(a) ? JSON.parse(localStorage.getItem(a)) : {}, s = t + "_" + e.id.replace("Btn", ""), o = i[s];
            if (o) return void ("single" === o.type ? (n.attr("href", o.url), n.css("backgroundColor", this.okBackgroundColor)) : "multiple" === o.type && (n.attr("href", o.url), 
            n.append('<span class="site-tag" style="top:-15px">多结果</span>'), n.css("backgroundColor", this.okBackgroundColor)));
            const r = await e.getUrl(), l = e.searchPath(r, t);
            n.attr("href", l);
            const c = await this.retryWithTimeout((() => gmHttp.get(l, null, null, this.timeout)), this.retry, e), d = utils.htmlTo$dom(c), h = [];
            d.find(e.boxSelector).each(((n, a) => {
                const i = $(a);
                if (!e.getTitle(i).toLowerCase().includes(t.toLowerCase())) return;
                let s = e.getHref(i, r);
                if (!s) throw new Error("解析href失败");
                s.includes("http") || (s = r + (s.startsWith("/") ? s : "/" + s)), h.push(s);
            }));
            let g = "", p = null;
            if (1 === h.length) {
                let t = h[0];
                n.attr("href", t), n.css("backgroundColor", this.okBackgroundColor), p = {
                    type: "single",
                    url: t
                };
            } else h.length > 1 ? (n.attr("href", l), g += '<span class="site-tag" style="top:-15px">多结果</span>', 
            n.css("backgroundColor", this.okBackgroundColor), p = {
                type: "multiple",
                url: l
            }) : (n.attr("href", l), n.css("backgroundColor", this.errorBackgroundColor));
            p && (new ct).addTask((() => {
                const t = localStorage.getItem(a) ? JSON.parse(localStorage.getItem(a)) : {};
                t[s] = p, localStorage.setItem(a, JSON.stringify(t));
            })), g && n.append(g);
        } catch (a) {
            console.error("请求失败:", e), n.css("backgroundColor", this.errorBackgroundColor);
        }
    }
    async getSettingCache() {
        const t = Date.now();
        return (!this.settingCache || t - this.lastFetchTime > this.CACHE_DURATION) && (this.settingCache = await storageManager.getSetting(), 
        this.lastFetchTime = t), this.settingCache;
    }
    async getMissAvUrl() {
        return (await this.getSettingCache()).missAvUrl || "https://missav.live";
    }
    async getjableUrl() {
        return (await this.getSettingCache()).jableUrl || "https://jable.tv";
    }
    async getAvgleUrl() {
        return (await this.getSettingCache()).avgleUrl || "https://www.av.gl";
    }
    async getJavTrailersUrl() {
        return (await this.getSettingCache()).javTrailersUrl || "https://javtrailers.com";
    }
    async getAv123Url() {
        return (await this.getSettingCache()).av123Url || "https://123av.com";
    }
    async getJavDbUrl() {
        return (await this.getSettingCache()).javDbUrl || "https://javdb.com";
    }
    async getJavBusUrl() {
        return (await this.getSettingCache()).javBusUrl || "https://www.javbus.com";
    }
    async retryWithTimeout(t, e, n) {
        let a = 0;
        for (;a < e; ) try {
            return await Promise.race([ t() ]);
        } catch (i) {
            if (console.log("请求失败", n.id), a++, a === e) throw i;
        }
    }
}

class ht extends U {
    getName() {
        return "BusDetailPagePlugin";
    }
    async initCss() {
        return window.isDetailPage ? ($("h4:contains('論壇熱帖')").hide(), $("h4:contains('同類影片')").hide(), 
        $("h4:contains('推薦')").hide(), "\n            .translated-title {\n                margin-top: 5px;\n                color: #666;\n                padding: 3px;\n                border-left: 3px solid #4CAF50;\n                background-color: #f8f8f8;\n            }\n        ") : "";
    }
    async handle() {
        if (window.location.href.includes("/star/")) {
            const t = $(".avatar-box");
            if (t.length > 0) {
                let e = t.parent();
                e.css("position", "initial"), e.insertBefore(e.parent());
            }
        }
        $(".genre a").each((function() {
            const t = $(this).attr("href");
            t && (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/")) && $(this).attr("target", "_blank");
        })), this.translate().then();
    }
    async translate() {
        if (!isDetailPage) return;
        if ("yes" !== await storageManager.getSetting("translateTitle", "yes")) return;
        let t = document.querySelector("h3");
        const e = t.textContent.trim();
        if (!e) return void console.log(".current-title元素内容为空");
        const n = document.createElement("h4");
        n.textContent = "翻译中...", n.className = "translated-title", t.parentNode.insertBefore(n, t.nextSibling);
        const a = this.getPageInfo().carNum, i = localStorage.getItem("jhs_translate") ? JSON.parse(localStorage.getItem("jhs_translate")) : {};
        i[a] ? n.textContent = i[a] : O(e, "ja", "zh-CN").then((t => {
            n.textContent = t;
        })).catch((t => {
            console.error("翻译失败:", t), n.textContent = "翻译失败: " + t.message, n.style.color = "red";
        }));
    }
}

class gt extends U {
    getName() {
        return "DetailPageButtonPlugin";
    }
    constructor() {
        super(), this.answerCount = 1;
    }
    async handle() {
        let t = await storageManager.getSetting();
        this.filterHotKey = t.filterHotKey, this.favoriteHotKey = t.favoriteHotKey, this.hasDownHotKey = t.hasDownHotKey, 
        this.hasWatchHotKey = t.hasWatchHotKey, this.speedVideoHotKey = t.speedVideoHotKey, 
        this.bindHotkey().then(), this.hideVideoControls(), window.isDetailPage && this.createMenuBtn();
    }
    async createMenuBtn() {
        const t = this.getPageInfo(), e = t.carNum, n = `\n            <div style="margin: 10px auto; display: flex; justify-content: space-between; align-items: center; flex-wrap:wrap;gap: 20px;">\n                <div style="display: flex; gap: 10px; flex-wrap:wrap;">\n                    <a id="filterBtn" class="menu-btn" style="width: 120px; background-color:${y}; color: white; text-align: center; padding: 8px 0;">\n                        <span>${w}</span>\n                    </a>\n                    <a id="favoriteBtn" class="menu-btn" style="width: 120px; background-color:${S}; color: white; text-align: center; padding: 8px 0;">\n                        <span>${x}</span>\n                    </a>\n                    <a id="hasDownBtn" class="menu-btn" style="width: 120px; background-color:${_}; color: white; text-align: center; padding: 8px 0;">\n                        <span>${C}</span>\n                    </a>\n                    <a id="hasWatchBtn" class="menu-btn" style="width: 120px; background-color:${B}; color: white; text-align: center; padding: 8px 0;">\n                        <span>${P}</span>\n                    </a>\n                </div>\n        \n                <div style="display: flex; gap: 10px; flex-wrap:wrap;">\n                    <a id="enable-magnets-filter" class="menu-btn" style="width: 140px; background-color: #c2bd4c; color: white; text-align: center; padding: 8px 0;">\n                        <span id="magnets-span">关闭磁力过滤</span>\n                    </a>\n                    <a id="magnetSearchBtn" class="menu-btn" style="width: 120px; background: linear-gradient(to right, rgb(245,140,1), rgb(84,161,29)); color: white; text-align: center; padding: 8px 0;">\n                        <span>磁力搜索</span>\n                    </a>\n                    <a id="xunLeiSubtitleBtn" class="menu-btn" style="width: 120px; background: linear-gradient(to left, #375f7c, #2196F3); color: white; text-align: center; padding: 8px 0;">\n                        <span>字幕 (迅雷)</span>\n                    </a>\n                    <a id="search-subtitle-btn" class="menu-btn" style="width: 160px; background: linear-gradient(to bottom, #8d5656, rgb(196,159,91)); color: white; text-align: center; padding: 8px 0;">\n                        <span>字幕 (SubTitleCat)</span>\n                    </a>\n                </div>\n            </div>\n        `;
        h && $(".tabs").after(n), g && $("#mag-submit-show").before(n), $("#favoriteBtn").on("click", (() => this.favoriteOne())), 
        $("#filterBtn").on("click", (t => this.filterOne(t))), $("#hasDownBtn").on("click", (async () => this.hasDownOne())), 
        $("#hasWatchBtn").on("click", (async () => this.hasWatchOne())), $("#magnetSearchBtn").on("click", (() => {
            let e = this.getBean("MagnetHubPlugin").createMagnetHub(t.carNum);
            layer.open({
                type: 1,
                title: "磁力搜索",
                content: '<div id="magnetHubBox"></div>',
                area: utils.getResponsiveArea([ "60%", "80%" ]),
                scrollbar: !1,
                success: () => {
                    $("#magnetHubBox").append(e);
                }
            });
        }));
        const a = this.getBean("HighlightMagnetPlugin"), i = await storageManager.getSetting("enableMagnetsFilter", D);
        $("#magnets-span").text(i === D ? "关闭磁力过滤" : "开启磁力过滤"), i === D && a.doFilterMagnet(), 
        $("#enable-magnets-filter").on("click", (t => {
            let e = $("#magnets-span");
            "关闭磁力过滤" === e.text() ? (a.showAll(), e.text("开启磁力过滤"), storageManager.saveSettingItem("enableMagnetsFilter", I)) : (a.doFilterMagnet(), 
            e.text("关闭磁力过滤"), storageManager.saveSettingItem("enableMagnetsFilter", D));
        })), $("#search-subtitle-btn").on("click", (t => utils.openPage(`https://subtitlecat.com/index.php?search=${e}`, e, !1, t))), 
        $("#xunLeiSubtitleBtn").on("click", (() => this.searchXunLeiSubtitle(e))), this.showStatus(e).then();
    }
    async showStatus(t) {
        const e = $("#filterBtn span"), n = $("#favoriteBtn span"), a = $("#hasDownBtn span"), i = $("#hasWatchBtn span"), s = t => t ? `(${t})` : "";
        e.text(`${w} ${s(this.filterHotKey)}`), n.text(`${x} ${s(this.favoriteHotKey)}`), 
        a.text(`${C} ${s(this.hasDownHotKey)}`), i.text(`${P} ${s(this.hasWatchHotKey)}`);
        const o = await storageManager.getCar(t);
        if (o) switch (o.status) {
          case m:
            e.text(`${b} ${s(this.filterHotKey)}`);
            break;

          case u:
            n.text(`${k} ${s(this.favoriteHotKey)}`);
            break;

          case f:
            a.text(`📥️ 已标记下载 ${s(this.hasDownHotKey)}`);
            break;

          case v:
            i.text(`🔍 已标记观看 ${s(this.hasWatchHotKey)}`);
        }
    }
    async favoriteOne() {
        let t = this.getPageInfo();
        await storageManager.saveCar(t.carNum, t.url, t.actress, u), this.showStatus(t.carNum).then(), 
        window.refresh(), utils.closePage();
    }
    async hasDownOne() {
        let t = this.getPageInfo();
        await storageManager.saveCar(t.carNum, t.url, t.actress, f), this.showStatus(t.carNum).then(), 
        window.refresh(), utils.closePage();
    }
    async hasWatchOne() {
        let t = this.getPageInfo();
        await storageManager.saveCar(t.carNum, t.url, t.actress, v), this.showStatus(t.carNum).then(), 
        window.refresh(), utils.closePage();
    }
    searchXunLeiSubtitle(t) {
        let e = loading();
        gmHttp.get(`https://api-shoulei-ssl.xunlei.com/oracle/subtitle?gcid=&cid=&name=${t}`).then((e => {
            let n = e.data;
            n && 0 !== n.length ? layer.open({
                type: 1,
                title: "迅雷字幕",
                content: '<div id="table-container"></div>',
                area: utils.getResponsiveArea([ "50%", "70%" ]),
                success: e => {
                    new TableGenerator({
                        containerId: "table-container",
                        columns: [ {
                            key: "name",
                            title: "文件名"
                        }, {
                            key: "ext",
                            title: "类型"
                        } ],
                        data: n,
                        buttons: [ {
                            text: "预览",
                            class: "a-primary",
                            onClick: e => {
                                let n = e.url, a = t + "." + e.ext;
                                this.previewSubtitle(n, a);
                            }
                        }, {
                            text: "下载",
                            class: "a-success",
                            onClick: async e => {
                                let n = e.url, a = t + "." + e.ext, i = await gmHttp.get(n);
                                utils.download(i, a);
                            }
                        } ]
                    });
                }
            }) : show.error("迅雷中找不到相关字幕!");
        })).catch((t => {
            console.error(t), show.error(t);
        })).finally((() => {
            e.close();
        }));
    }
    async filterOne(t, e) {
        t && t.preventDefault();
        let n = this.getPageInfo();
        e ? (await storageManager.saveCar(n.carNum, n.url, n.actress, m), this.showStatus(n.carNum).then(), 
        window.refresh(), utils.closePage(), layer.closeAll(), this.answerCount = 1) : utils.q(t, `是否屏蔽${n.carNum}?`, (async () => {
            await storageManager.saveCar(n.carNum, n.url, n.actress, m), this.showStatus(n.carNum).then(), 
            window.refresh(), utils.closePage();
        }), (() => {
            this.answerCount = 1;
        }));
    }
    speedVideo() {
        if ($("#preview-video").is(":visible")) {
            const t = document.getElementById("preview-video");
            return void (t && (t.muted = !1, t.controls = !1, t.currentTime + 5 < t.duration ? t.currentTime += 5 : (show.info("预览视频结束, 已回到开头"), 
            t.currentTime = 1)));
        }
        const t = $('iframe[id^="layui-layer-iframe"]');
        if (t.length > 0) return void t[0].contentWindow.postMessage("speedVideo", "*");
        let e = $(".preview-video-container");
        if (e.length > 0) {
            e[0].click();
            const t = document.getElementById("preview-video");
            t && (t.currentTime += 5, t.muted = !1);
        } else $("#javTrailersBtn").click();
    }
    hideVideoControls() {
        $(document).on("mouseenter", "#preview-video", (function() {
            $(this).prop("controls", !0);
        }));
    }
    async bindHotkey() {
        const t = {};
        this.filterHotKey && (t[this.filterHotKey] = () => {
            this.answerCount >= 2 ? this.filterOne(null, !0) : this.filterOne(null), this.answerCount++;
        }), this.favoriteHotKey && (t[this.favoriteHotKey] = () => this.favoriteOne(null)), 
        this.hasDownHotKey && (t[this.hasDownHotKey] = () => this.hasDownOne()), this.hasWatchHotKey && (t[this.hasWatchHotKey] = () => this.hasWatchOne()), 
        this.speedVideoHotKey && (t[this.speedVideoHotKey] = () => this.speedVideo());
        const e = (t, e) => {
            V.registerHotkey(t, (n => {
                const a = document.activeElement;
                "INPUT" === a.tagName || "TEXTAREA" === a.tagName || a.isContentEditable || (window.isDetailPage ? e() : (t => {
                    const e = $(".layui-layer-content iframe");
                    0 !== e.length && e[0].contentWindow.postMessage(t, "*");
                })(t));
            }));
        };
        window.isDetailPage && window.addEventListener("message", (e => {
            t[e.data] && t[e.data]();
        })), Object.entries(t).forEach((([t, n]) => {
            e(t, n);
        }));
    }
    previewSubtitle(t, e) {
        if (!t) return void console.error("未提供文件URL");
        const n = t.split(".").pop().toLowerCase();
        "ass" === n || "srt" === n ? gmHttp.get(t).then((t => {
            let a = t, i = "字幕预览";
            if ("ass" === n) {
                i = "ASS字幕预览 - " + e;
                const n = t.match(/\[Events][\s\S]*?(?=\[|$)/i);
                n && (a = n[0]);
            } else "srt" === n && (i = "SRT字幕预览 - " + e);
            layer.open({
                type: 1,
                title: i,
                area: [ "80%", "80%" ],
                scrollbar: !1,
                content: `<div style="padding:15px;background:#1E1E1E;color:#FFF;font-family:Consolas,Monaco,monospace;white-space:pre-wrap;overflow:auto;height:100%;">${a}</div>`,
                btn: [ "下载", "关闭" ],
                btn1: function(n, a, i) {
                    return utils.download(t, e), !1;
                }
            });
        })).catch((t => {
            show.error(`预览失败: ${t.message}`), console.error("预览字幕文件出错:", t);
        })) : alert("仅支持预览ASS和SRT字幕文件");
    }
}

class pt extends U {
    constructor() {
        super(...arguments), r(this, "dataType", "all"), r(this, "tableObj", null);
    }
    getName() {
        return "HistoryPlugin";
    }
    async initCss() {
        return "\n            .history-btn.active {\n                border: 2px solid #333;\n            }\n            \n            /* 下拉菜单容器（相对定位） */\n            .sub-btns {\n                position: relative;\n                display: inline-block;\n            }\n            \n            /* 下拉菜单内容（默认隐藏） */\n            .sub-btns-menu {\n                display: none;\n                position: absolute;\n                right: 80px;\n                top:-10px;\n                background: white;\n                padding:10px;\n                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);\n                z-index: 100;\n                border-radius: 4px;\n                overflow: hidden;\n            }\n            \n            \n            /* 点击后显示菜单（JS 控制） */\n            .sub-btns-menu.show {\n                display: block;\n            }\n        ";
    }
    handle() {
        if (h) {
            let t = function() {
                $(".navbar-search").is(":hidden") ? ($(".historyBtnBox").show(), $(".miniHistoryBtnBox").hide()) : ($(".historyBtnBox").hide(), 
                $(".miniHistoryBtnBox").show());
            };
            $(".navbar-end").prepend('<div class="navbar-item has-sub-btns is-hoverable historyBtnBox">\n                    <a id="historyBtn" class="navbar-link nav-btn" style="color: #aade66 !important;padding-right:15px !important;">\n                        历史列表\n                    </a>\n                </div>'), 
            $(".navbar-search").css("margin-left", "0").before('\n                <div class="navbar-item miniHistoryBtnBox">\n                    <a id="miniHistoryBtn" class="navbar-link nav-btn" style="color: #aade66 !important;padding-left:0 !important;padding-right:0 !important;">\n                        历史列表\n                    </a>\n                </div>\n            '), 
            t(), $(window).resize(t);
        }
        g && $("#navbar").append('\n                <ul class="nav navbar-nav navbar-right" style="margin-right: 10px">\n                    <li><a id="historyBtn" style="color: #86e114 !important;padding-right:15px !important;" role="button">历史列表</a></li>\n                </ul>\n           '), 
        $("#historyBtn,#miniHistoryBtn").on("click", (t => this.openHistory())), this.bindClick();
    }
    bindClick() {
        document.addEventListener("click", (function(t) {
            if (t.target.closest(".sub-btns-toggle")) {
                const e = t.target.closest(".sub-btns").querySelector(".sub-btns-menu");
                document.querySelectorAll(".sub-btns-menu.show").forEach((t => {
                    t !== e && t.classList.remove("show");
                })), e.classList.toggle("show");
            } else document.querySelectorAll(".sub-btns-menu.show").forEach((t => {
                t.classList.remove("show");
            }));
        })), this.getBean("ListPagePlugin"), $(document).on("click", ".histroy-deleteBtn, .histroy-filterBtn, .histroy-favoriteBtn, .histroy-hasDownBtn, .histroy-hasWatchBtn, .histroy-detailBtn", (t => {
            t.preventDefault(), t.stopPropagation();
            const e = $(t.currentTarget), n = e.closest(".action-btns"), a = n.attr("data-car-num"), i = n.attr("data-href"), s = async t => {
                await storageManager.saveCar(a, i, null, t), window.refresh(), await this.reloadTable(null);
            };
            e.hasClass("histroy-filterBtn") ? utils.q(t, `是否屏蔽${a}?`, (() => s(m))) : e.hasClass("histroy-favoriteBtn") ? s(u).then() : e.hasClass("histroy-hasDownBtn") ? s(f).then() : e.hasClass("histroy-hasWatchBtn") ? s(v).then() : e.hasClass("histroy-deleteBtn") ? this.handleDelete(t, a) : e.hasClass("histroy-detailBtn") && this.handleClickDetail(t, {
                carNum: a,
                url: i
            }).then();
        })), $(document).on("click", ".multiple-histroy-deleteBtn, .multiple-histroy-filterBtn, .multiple-histroy-favoriteBtn, .multiple-histroy-hasDownBtn, .multiple-histroy-hasWatchBtn", (t => {
            t.preventDefault(), t.stopPropagation();
            const e = async (t, e, n) => {
                await storageManager.saveCar(t, e, null, n), window.refresh(), await this.reloadTable(null);
            }, n = $(t.currentTarget), a = this.tableObj.getSelectedRows();
            if (0 === a.length) return void $("#allSelectBox").hide();
            let i = "", s = "";
            n.hasClass("multiple-histroy-filterBtn") ? (i = "屏蔽", s = m) : n.hasClass("multiple-histroy-favoriteBtn") ? (i = "收藏", 
            s = u) : n.hasClass("multiple-histroy-hasDownBtn") ? (i = "已下载", s = f) : n.hasClass("multiple-histroy-hasWatchBtn") ? (i = "已观看", 
            s = v) : n.hasClass("multiple-histroy-deleteBtn") && (i = "移除", s = "delete"), utils.q(t, `当前已勾选${a.length}条数据, 是否全标记为 ${i}?`, (async () => {
                for (const t of a) "delete" === s ? await storageManager.removeCar(t.carNum) : await e(t.carNum, t.url, s);
                this.tableObj.clearSelection(), this.reloadTable(null).then();
            }));
        }));
    }
    openHistory() {
        let t = `\n            <div style="margin: 10px;display: flex;gap: 5px;">\n                <a class="menu-btn history-btn active" data-action="all" style="background-color:#d3c8a5">所有</a>\n                <a class="menu-btn history-btn" data-action="filter" style="background-color:${y}">${b}</a>\n                <a class="menu-btn history-btn" data-action="favorite" style="background-color:${S};">${k}</a>\n                <a class="menu-btn history-btn" data-action="hasDown" style="background-color:${_};">${C}</a>\n                <a class="menu-btn history-btn" data-action="hasWatch" style="background-color:${B};">${P}</a>\n                <input id="searchCarNum" type="text" placeholder="搜索番号|演员" style="padding: 4px 5px;margin-left: auto; margin-right: 0">\n                <a id="clearSearchbtn" class="a-dark" style="margin-left: 0">重置</a>\n            </div>\n            <div id="allSelectBox" style="margin-left: 10px;margin-bottom: 5px;display: none">\n                <a class="menu-btn multiple-histroy-deleteBtn" style="background-color:#c63b3b; color:white; margin-bottom: 5px;"> <span>✂️ 移除</span> </a>\n                <a class="menu-btn multiple-histroy-hasWatchBtn" style="background-color:${B};margin-bottom: 5px">${P}</a>\n                <a class="menu-btn multiple-histroy-hasDownBtn" style="background-color:${_};margin-bottom: 5px">${C}</a>\n                <a class="menu-btn multiple-histroy-favoriteBtn" style="background-color:${S};margin-bottom: 5px">${x}</a>\n                <a class="menu-btn multiple-histroy-filterBtn" style="background-color:${y};margin-bottom: 5px">${w}</a>\n            </div>\n            <div id="table-container"></div>\n        `;
        layer.open({
            type: 1,
            title: "历史列表",
            content: t,
            scrollbar: !1,
            area: utils.getResponsiveArea([ "70%", "90%" ]),
            success: async t => {
                const e = await this.getDataList();
                this.loadTableData(e), $(".layui-layer-content").on("click", ".history-btn", (async t => {
                    $(".history-btn").removeClass("active"), $(t.currentTarget).addClass("active"), 
                    this.dataType = $(t.target).data("action"), await this.reloadTable(1), this.tableObj.clearSelection();
                })).on("click", "#clearSearchbtn", (async t => {
                    $("#searchCarNum").val(""), await this.reloadTable(1), this.tableObj.clearSelection(), 
                    $("#allSelectBox").hide();
                })).on("keydown", "#searchCarNum", (async t => {
                    await this.reloadTable(1), this.tableObj.clearSelection();
                })).on("click", ".table-actress", (async t => {
                    let e = $(t.currentTarget);
                    $("#searchCarNum").val(e.text()), await this.reloadTable(1), this.tableObj.clearSelection();
                }));
            },
            end: async () => window.refresh()
        });
    }
    async handleClickDetail(t, e) {
        if (h) if (e.carNum.includes("FC2-")) {
            const t = this.parseMovieId(e.url);
            this.getBean("fc2Plugin").openFc2Dialog(t, e.carNum, e.url);
        } else utils.openPage(e.url, e.carNum, !1, t);
        if (g) {
            let n = e.url;
            if (n.includes("javdb")) if (e.carNum.includes("FC2-")) {
                const t = this.parseMovieId(n);
                await this.getBean("Fc2Plugin").openFc2Page(t, e.carNum, n);
            } else window.open(n, "_blank"); else utils.openPage(e.url, e.carNum, !1, t);
        }
    }
    async reloadTable(t) {
        const e = await this.getDataList();
        console.log("页码", t), this.tableObj.update(e, t);
    }
    handleDelete(t, e) {
        utils.q(t, `是否移除${e}?`, (async () => {
            await storageManager.removeCar(e), this.getBean("listPagePlugin").showCarNumBox(e), 
            this.reloadTable(null).then();
        }));
    }
    async getDataList() {
        let t = await storageManager.getCarList();
        this.allCount = t.length, this.filterCount = 0, this.favoriteCount = 0, this.hasDownCount = 0, 
        this.hasWatchCount = 0, t.forEach((t => {
            switch (t.status) {
              case m:
                this.filterCount++;
                break;

              case u:
                this.favoriteCount++;
                break;

              case f:
                this.hasDownCount++;
                break;

              case v:
                this.hasWatchCount++;
            }
        })), $('a[data-action="all"]').text(`所有 (${this.allCount})`), $('a[data-action="filter"]').text(`${b} (${this.filterCount})`), 
        $('a[data-action="favorite"]').text(`${k} (${this.favoriteCount})`), $('a[data-action="hasDown"]').text(`${C} (${this.hasDownCount})`), 
        $('a[data-action="hasWatch"]').text(`${P} (${this.hasWatchCount})`);
        const e = "all" === this.dataType ? t : t.filter((t => t.status === this.dataType)), n = $("#searchCarNum").val().trim();
        if (n) {
            let t = n.toLowerCase().replace("-c", "").replace("-uc", "").replace("-4k", "");
            return e.filter((e => {
                const n = e.carNum.toLowerCase().includes(t);
                const a = (e.actress ? e.actress : "").toLowerCase().includes(t);
                return n || a;
            }));
        }
        return e;
    }
    loadTableData(t) {
        this.tableObj = new TableGenerator({
            containerId: "table-container",
            columns: [ {
                key: "carNum",
                title: "番号"
            }, {
                key: "actress",
                title: "演员",
                width: "500px",
                render: t => `<a class="table-actress">${t.actress ? t.actress : ""}</a>`
            }, {
                key: "updateDate",
                title: "操作日期",
                width: "185px"
            }, {
                key: "url",
                title: "来源",
                render: t => {
                    let e = t.url;
                    return e.includes("javdb") ? '<span style="color:#d34f9e">Javdb</span>' : e.includes("javbus") ? '<span style="color:#eaa813">JavBus</span>' : e.includes("123av") ? '<span style="color:#eaa813">123Av</span>' : `<span style="color:#050505">${e}</span>`;
                }
            }, {
                key: "status",
                title: "状态",
                width: "250px",
                render: t => {
                    let e, n = "";
                    switch (t.status) {
                      case "filter":
                        e = y, n = b;
                        break;

                      case "favorite":
                        e = S, n = k;
                        break;

                      case "hasDown":
                        e = _, n = C;
                        break;

                      case "hasWatch":
                        e = B, n = P;
                    }
                    return `<span style="color:${e}">${n}</span>`;
                }
            }, {
                key: "change",
                title: "操作",
                render: t => `\n                            <div class="action-btns" style="display: flex; gap: 5px;justify-content:center" data-car-num="${t.carNum}" data-href="${t.url}">\n                                <div class="sub-btns">\n                                    <button class="menu-btn sub-btns-toggle" style="background-color:#c59d36; color:white; margin-bottom: 5px;">\n                                        <span>✏️ 变更</span>\n                                    </button>\n                                    <div class="sub-btns-menu">\n                                        <a class="menu-btn histroy-deleteBtn" style="background-color:#c63b3b; color:white; margin-bottom: 5px;"> <span>✂️ 移除</span> </a>\n                                        <a class="menu-btn histroy-hasWatchBtn" style="background-color:${B};margin-bottom: 5px">${P}</a>\n                                        <a class="menu-btn histroy-hasDownBtn" style="background-color:${_};margin-bottom: 5px">${C}</a>\n                                        <a class="menu-btn histroy-favoriteBtn" style="background-color:${S};margin-bottom: 5px">${x}</a>\n                                        <a class="menu-btn histroy-filterBtn" style="background-color:${y};margin-bottom: 5px">${w}</a>\n                                    </div>\n                                </div>\n                                \n                                <a class="menu-btn histroy-detailBtn" style="background-color:#3397de; color:white; margin-bottom: 5px;"> <span>📄 详情页</span> </a>\n                                \n                            </div>\n                        `
            } ],
            data: t,
            selectable: !0,
            selectedRowKey: "carNum",
            onSelectChange: t => {
                console.log("选中状态变化:", t);
                const e = t.selectedRowKeys, n = $("#allSelectBox");
                e.length ? n.show() : n.hide();
            },
            pagination: {
                enable: !0,
                pageSize: 10,
                pageSizeOptions: [ 10, 20, 50, 100, 1e3 ],
                currentPage: 1,
                showTotal: !0,
                showSizeChanger: !0,
                showQuickJumper: !0
            }
        });
    }
}

class mt extends U {
    constructor() {
        super(...arguments), r(this, "floorIndex", 1), r(this, "isInit", !1);
    }
    getName() {
        return "ReviewPlugin";
    }
    async handle() {
        if ($(document).on("click", ".down-115", (async t => {
            const e = $(t.currentTarget).data("magnet");
            let n = loading();
            try {
                await this.getBean("WangPan115TaskPlugin").handleAddTask(e);
            } catch (a) {
                show.error("发生错误:" + a), console.error(a);
            } finally {
                n.close();
            }
        })), window.isDetailPage) {
            if (h) {
                const t = this.parseMovieId(window.location.href);
                await this.showReview(t), await this.getBean("RelatedPlugin").showRelated();
            }
            if (g) {
                let t = this.getPageInfo().carNum;
                const e = await (async t => {
                    let e = `${Y}/v2/search`, n = {
                        "user-agent": "Dart/3.5 (dart:io)",
                        "accept-language": "zh-TW",
                        host: "jdforrepam.com",
                        jdsignature: await Q()
                    }, a = {
                        q: t,
                        page: 1,
                        type: "movie",
                        limit: 1,
                        movie_type: "all",
                        from_recent: "false",
                        movie_filter_by: "all",
                        movie_sort_by: "relevance"
                    };
                    return (await gmHttp.get(e, a, n)).data.movies;
                })(t);
                let n = null;
                for (let a = 0; a < e.length; a++) {
                    let i = e[a];
                    if (i.number.toLowerCase() === t.toLowerCase()) {
                        n = i.id;
                        break;
                    }
                }
                if (!n) return;
                this.showReview(n, $("#sample-waterfall")).then();
            }
        }
    }
    async showReview(t, e) {
        const n = await storageManager.getSetting("enableLoadReview", D), a = e || $("#magnets-content");
        a.append(`\n            <div style="display: flex; align-items: center; margin: 16px 0; color: #666; font-size: 14px;">\n                <span style="flex: 1; height: 1px; background: linear-gradient(to right, transparent, #999, transparent);"></span>\n                <span style="padding: 0 10px;">评论区</span>\n                <a id="reviewsFold" style="margin-left: 8px; color: #1890ff; text-decoration: none; display: flex; align-items: center;">\n                    <span class="toggle-text">${n === D ? "折叠" : "展开"}</span>\n                    <span class="toggle-icon" style="margin-left: 4px;">${n === D ? "▲" : "▼"}</span>\n                </a>\n                <span style="flex: 1; height: 1px; background: linear-gradient(to right, transparent, #999, transparent);"></span>\n            </div>\n        `), 
        $("#reviewsFold").on("click", (e => {
            e.preventDefault(), e.stopPropagation();
            const n = $("#reviewsFold .toggle-text"), a = $("#reviewsFold .toggle-icon"), i = "展开" === n.text();
            n.text(i ? "折叠" : "展开"), a.text(i ? "▲" : "▼"), i ? ($("#reviewsContainer").show(), 
            $("#reviewsFooter").show(), this.isInit || (this.fetchAndDisplayReviews(t), this.isInit = !0), 
            storageManager.saveSettingItem("enableLoadReview", D)) : ($("#reviewsContainer").hide(), 
            $("#reviewsFooter").hide(), storageManager.saveSettingItem("enableLoadReview", I));
        })), a.append('<div id="reviewsContainer"></div>'), a.append('<div id="reviewsFooter"></div>'), 
        n === D && await this.fetchAndDisplayReviews(t);
    }
    async fetchAndDisplayReviews(t) {
        const e = $("#reviewsContainer"), n = $("#reviewsFooter");
        e.append('<div id="reviewsLoading" style="margin-top:15px;background-color:#ffffff;padding:10px;margin-left: -10px;">获取评论中...</div>');
        const a = await storageManager.getSetting("reviewCount", 20);
        let i = null;
        try {
            i = await X(t, 1, a);
        } catch (o) {
            console.error("获取评论失败:", o);
        } finally {
            $("#reviewsLoading").remove();
        }
        if (!i) return e.append('\n                <div style="margin-top:15px;background-color:#ffffff;padding:10px;margin-left: -10px;">\n                    获取评论失败\n                    <a id="retryFetchReviews" href="javascript:;" style="margin-left: 10px; color: #1890ff; text-decoration: none;">重试</a>\n                </div>\n            '), 
        void $("#retryFetchReviews").on("click", (async () => {
            $("#retryFetchReviews").parent().remove(), await this.fetchAndDisplayReviews(t);
        }));
        if (0 === i.length) return void e.append('<div style="margin-top:15px;background-color:#ffffff;padding:10px;margin-left: -10px;">无评论</div>');
        const s = await storageManager.getReviewFilterKeywordList();
        if (this.displayReviews(i, e, s), i.length === a) {
            n.html('\n                <button id="loadMoreReviews" style="width:100%; background-color: #e1f5fe; border:none; padding:10px; margin-top:10px; cursor:pointer; color:#0277bd; font-weight:bold; border-radius:4px;">\n                    加载更多评论\n                </button>\n                <div id="reviewsEnd" style="display:none; text-align:center; padding:10px; color:#666; margin-top:10px;">已加载全部评论</div>\n            ');
            let i = 1, r = $("#loadMoreReviews");
            r.on("click", (async () => {
                let n;
                r.text("加载中...").prop("disabled", !0), i++;
                try {
                    n = await X(t, i, a);
                } catch (o) {
                    console.error("加载更多评论失败:", o);
                } finally {
                    r.text("加载失败, 请点击重试").prop("disabled", !1);
                }
                n && (this.displayReviews(n, e, s), n.length < a ? (r.remove(), $("#reviewsEnd").show()) : r.text("加载更多评论").prop("disabled", !1));
            }));
        } else n.html('<div style="text-align:center; padding:10px; color:#666; margin-top:10px;">已加载全部评论</div>');
    }
    displayReviews(t, e, n) {
        t.length && (t.forEach((t => {
            if (n.some((e => t.content.includes(e)))) return;
            const a = Array(t.score).fill('<i class="icon-star"></i>').join(""), i = t.content.replace(/(ed2k?:\/\/[^\s]+|magnet:\?[^\s"'\u4e00-\u9fa5，。？！（）【】]+|https?:\/\/[^\s"'\u4e00-\u9fa5，。？！（）【】]+)/gi, (t => t.startsWith("ed2k://") ? `\n                            <span style="word-break: break-all;background: #e0f2fe;color: #0369a1;">${t}</span>\n                            <button class="button is-info down-115" data-magnet="${t}" style="font-size: 11px">115离线下载</button>\n                        ` : t.startsWith("magnet:") ? `\n                            <a href="${t}" class="a-primary" style="padding:0; word-break: break-all; white-space: pre-wrap;" target="_blank" rel="noopener noreferrer">${t}</a>\n                            <button class="button is-info down-115" data-magnet="${t}" style="font-size: 11px">115离线下载</button>\n                        ` : t.startsWith("http://") || t.startsWith("https://") ? `\n                            <a href="${t}" class="a-primary" style="padding:0; word-break: break-all; white-space: pre-wrap;" target="_blank" rel="noopener noreferrer">${t}</a>\n                        ` : t)), s = `\n                <div class="item columns is-desktop" style="display:block;margin-top:6px;background-color:#ffffff;padding:10px;margin-left: -10px;word-break: break-word;position:relative;">\n                    <span style="position:absolute;top:5px;right:10px;color:#999;font-size:12px;">#${this.floorIndex++}楼</span>\n                    ${t.username} &nbsp;&nbsp; <span class="score-stars">${a}</span> \n                    <span class="time">${utils.formatDate(t.created_at)}</span> \n                    &nbsp;&nbsp; 点赞:${t.likes_count}\n                    <p class="review-content" style="margin-top: 5px;"> ${i} </p>\n                </div>\n            `;
            e.append(s);
        })), utils.rightClick($(".review-content"), (async t => {
            const e = window.getSelection().toString();
            e && (t.preventDefault(), await utils.q(t, `是否将 '${e}' 加入评论区关键词?`, (async () => {
                await storageManager.saveReviewFilterKeyword(e), show.ok("操作成功, 刷新页面后生效");
            })));
        })));
    }
}

class ut extends U {
    getName() {
        return "FilterTitleKeywordPlugin";
    }
    async handle() {
        if (!window.isDetailPage) return;
        if (await storageManager.getSetting("enableTitleSelectFilter", D) !== D) return;
        let t;
        h && (t = $("h2"), $(".male").prev()), g && (t = $("h3")), utils.rightClick(t, (t => {
            const e = window.getSelection().toString();
            if (e) {
                t.preventDefault();
                let n = {
                    clientX: t.clientX,
                    clientY: t.clientY + 80
                };
                utils.q(n, `是否屏蔽标题关键词 ${e}?`, (async () => {
                    await storageManager.saveTitleFilterKeyword(e), window.refresh(), utils.closePage();
                }));
            }
        }));
    }
}

class ft extends U {
    getName() {
        return "ListPageButtonPlugin";
    }
    async handle() {
        if (!window.isListPage) return;
        this.createMenuBtn();
        await storageManager.getSetting("autoPage") === D && $("#sort-toggle-btn").hide();
    }
    createMenuBtn() {
        if (h) {
            if (window.location.href.includes("/actors/")) $(".toolbar .buttons").append('\n                    <a class="menu-btn" id="waitCheckBtn" \n                       style="background-color:#56c938 !important;; margin-left: 40px;margin-bottom: 8px; border-bottom:none !important; border-radius:3px;">\n                        <span>打开待鉴定</span>\n                    </a>\n                    <a class="menu-btn" id="waitDownBtn" \n                       style="background-color:#2caac0 !important;; margin-left: 10px;margin-bottom: 8px; border-bottom:none !important; border-radius:3px;">\n                      <span>打开已收藏</span>\n                    </a>\n                '), 
            p || $(".toolbar .buttons").append(`\n                        <a class="menu-btn" id="sort-toggle-btn" \n                           style="background-color:#8783ab !important; margin-left: 50px;margin-bottom: 8px; border-bottom:none !important; border-radius:3px;">当前排序方式: ${"rateCount" === localStorage.getItem("sortMethod") ? "评价人数" : "date" === localStorage.getItem("sortMethod") ? "时间" : "默认"}</a>\n                    `); else if (window.location.href.includes("advanced_search")) {
                let t = $("h2.section-title");
                t.css({
                    display: "grid",
                    "grid-template-columns": "auto auto 1fr",
                    width: "100%"
                }), t.append('\n                    <div>\n                        <a class="menu-btn" id="waitCheckBtn" \n                           style="background-color:#56c938 !important;; margin-left: 10px;border-bottom:none !important; border-radius:3px;">\n                            <span>打开待鉴定</span>\n                        </a>\n                        <a class="menu-btn" id="waitDownBtn" \n                           style="background-color:#2caac0 !important;; margin-left: 10px;border-bottom:none !important; border-radius:3px;">\n                          <span>打开已收藏</span>\n                        </a>\n                    </div>\n                ');
            } else $(".tabs ul").append('\n                    <li class="is-active" id="waitCheckBtn">\n                        <a class="menu-btn" style="background-color:#56c938 !important;margin-left: 20px;border-bottom:none !important;border-radius:3px;">\n                            <span>打开待鉴定</span>\n                        </a>\n                    </li>\n                     <li class="is-active" id="waitDownBtn">\n                        <a class="menu-btn" style="background-color:#2caac0 !important;margin-left: 20px;border-bottom:none !important;border-radius:3px;">\n                            <span>打开已收藏</span>\n                        </a>\n                    </li>\n                '), 
            p || $(".tabs ul").after(`\n                      <div style="padding:10px">\n                        <a class="menu-btn" id="sort-toggle-btn" \n                           style="background-color:#8783ab !important; margin-left: 20px; border-bottom:none !important; border-radius:3px;">\n                          当前排序方式: ${"rateCount" === localStorage.getItem("sortMethod") ? "评价人数" : "date" === localStorage.getItem("sortMethod") ? "时间" : "默认"}\n                        </a>\n                      </div>\n                    `);
            this.sortItems();
        }
        if (g) {
            const t = '\n                <div style="margin-top: 10px">\n                    <a id="waitCheckBtn" class="menu-btn" style="background-color:#56c938 !important;margin-left: 14px;border-bottom:none !important;border-radius:3px;">\n                        <span>打开待鉴定</span>\n                    </a>\n                    <a id="waitDownBtn" class="menu-btn" style="background-color:#2caac0 !important;margin-left: 5px;border-bottom:none !important;border-radius:3px;">\n                        <span>打开已收藏</span>\n                    </a>\n                </div>\n            ';
            $(".masonry").parent().prepend(t);
        }
        $("#waitCheckBtn").on("click", (t => {
            this.openWaitCheck(t).then();
        })), $("#waitDownBtn").on("click", (t => {
            this.openFavorite(t).then();
        })), $("#sort-toggle-btn").on("click", (t => {
            const e = localStorage.getItem("sortMethod");
            let n;
            n = e && "default" !== e ? "rateCount" === e ? "date" : "default" : "rateCount";
            const a = {
                default: "默认",
                rateCount: "评价人数",
                date: "时间"
            }[n];
            $(t.target).text(`当前排序方式: ${a}`), localStorage.setItem("sortMethod", n), this.sortItems();
        }));
    }
    async sortItems() {
        if (d.includes("handle") || d.includes("advanced_search")) return;
        const t = await storageManager.getSetting("autoPage");
        if (p || t === D) return;
        const e = localStorage.getItem("sortMethod");
        if (!e) return;
        $(".movie-list .item").each((function(t) {
            $(this).attr("data-original-index") || $(this).attr("data-original-index", t);
        }));
        const n = $(".movie-list"), a = $(".item", n);
        if ("default" === e) a.sort((function(t, e) {
            return $(t).data("original-index") - $(e).data("original-index");
        })).appendTo(n); else {
            const t = a.get();
            t.sort((function(t, n) {
                if ("rateCount" === e) {
                    const e = t => {
                        const e = $(t).find(".score .value").text().match(/由(\d+)人/);
                        return e ? parseFloat(e[1]) : 0;
                    };
                    return e(n) - e(t);
                }
                {
                    const e = t => {
                        const e = $(t).find(".meta").text().trim();
                        return new Date(e);
                    };
                    return e(n) - e(t);
                }
            })), n.empty().append(t);
        }
    }
    async openWaitCheck() {
        let t = this.getSelector();
        const e = await storageManager.getSetting("waitCheckCount", 5), n = [ b, k, C, P ];
        let a = 0;
        $(`${t.itemSelector}:visible`).each(((t, i) => {
            if (a >= e) return !1;
            const s = $(i);
            if (n.some((t => s.find(`span.tag:contains('${t}')`).length > 0))) return;
            const {carNum: o, aHref: r, title: l} = this.getBean("ListPagePlugin").findCarNumAndHref(s);
            if (o.includes("FC2-")) {
                const t = this.parseMovieId(r);
                this.getBean("Fc2Plugin").openFc2Page(t, o, r);
            } else {
                let t = r + (r.includes("?") ? "&autoPlay=1" : "?autoPlay=1");
                window.open(t);
            }
            a++;
        })), 0 === a && show.info("没有需鉴定的视频");
    }
    async openFavorite() {
        let t = await storageManager.getSetting("waitCheckCount", 5);
        const e = (await storageManager.getCarList()).filter((t => t.status === u));
        for (let n = 0; n < t; n++) {
            if (n >= e.length) return;
            let t = e[n], a = t.carNum, i = t.url;
            if (a.includes("FC2-")) {
                const t = this.parseMovieId(i);
                await this.getBean("Fc2Plugin").openFc2Page(t, a, i);
            } else window.open(i);
        }
    }
}

class vt extends U {
    constructor() {
        super(...arguments), r(this, "cache", localStorage.getItem("jhs_translate") ? JSON.parse(localStorage.getItem("jhs_translate")) : {}), 
        r(this, "writeQueue", Promise.resolve());
    }
    getName() {
        return "ListPagePlugin";
    }
    async handle() {
        new BroadcastChannel("channel-refresh").addEventListener("message", (async t => {
            "refresh" === t.data.type && await this.doFilter();
        })), this.cleanRepeatId(), this.replaceHdImg(), this.fixBusTitleBox(), await this.doFilter(), 
        this.bindClick().then(), this.bindListPageHotKey().then(), $(this.getSelector().itemSelector + " a").attr("target", "_blank"), 
        this.checkDom();
    }
    checkDom() {
        if (!window.isListPage) return;
        const t = this.getSelector(), e = document.querySelector(t.boxSelector), n = new MutationObserver((async t => {
            n.disconnect();
            try {
                this.replaceHdImg(), this.fixBusTitleBox(), await this.doFilter(), await this.getBean("ListPageButtonPlugin").sortItems(), 
                this.getBean("CopyTitleOrDownImgPlugin").addSvgBtn(), $(this.getSelector().itemSelector + " a").attr("target", "_blank");
            } finally {
                n.observe(e, a);
            }
        })), a = {
            childList: !0,
            subtree: !1
        };
        n.observe(e, a);
    }
    fixBusTitleBox() {
        if (!g) return;
        $(this.getSelector().itemSelector).toArray().forEach((t => {
            var e;
            let n = $(t);
            if (n.find(".avatar-box").length > 0) return;
            const a = (null == (e = n.find("img").attr("title")) ? void 0 : e.trim()) || "";
            n.find(".photo-info span:first").contents().first().wrap(`<span class="video-title" title="${a}">${a}</span>`), 
            n.find("br").remove();
        }));
    }
    cleanRepeatId() {
        if (!g) return;
        $("#waterfall_h").removeAttr("id").attr("id", "no-page");
        const t = $('[id="waterfall"]');
        0 !== t.length && t.each((function() {
            const t = $(this);
            if (!t.hasClass("masonry")) {
                t.children().insertAfter(t), t.remove();
            }
        }));
    }
    async doFilter() {
        if (!window.isListPage) return;
        let t = $(this.getSelector().itemSelector).toArray();
        t.length && (await this.filterMovieList(t), await this.getBean("WangPan115MatchPlugin").matchMovieList(t));
    }
    async filterMovieList(t) {
        const e = await storageManager.getCarList(), n = await storageManager.getTitleFilterKeyword(), a = e.filter((t => t.status === m)).map((t => t.carNum)), i = e.filter((t => t.status === u)).map((t => t.carNum)), s = e.filter((t => t.status === f)).map((t => t.carNum)), o = e.filter((t => t.status === v)).map((t => t.carNum)), r = await storageManager.getActorFilterCarMap(), l = await storageManager.getActressFilterCarMap(), c = Object.values(l).flatMap((t => t.map((t => t.carNum)))), d = Object.values(r).flatMap((t => t.map((t => t.carNum))));
        let w = await storageManager.getSetting("showFilterItem", I), x = await storageManager.getSetting("showFavoriteItem", D), M = await storageManager.getSetting("showHasDownItem", D), T = await storageManager.getSetting("showHasWatchItem", D);
        t.forEach((t => {
            let e = $(t);
            if (g && e.find(".avatar-box").length > 0) return;
            const {carNum: r, title: l} = this.findCarNumAndHref(e);
            if (!p) {
                const t = w === I && (a.includes(r) || n.some((t => l.includes(t) || r.includes(t))) || d.includes(r) || c.includes(r)) && !i.includes(r) && !s.includes(r) && !o.includes(r), h = x === I && i.includes(r) || M === I && s.includes(r) || T === I && o.includes(r) || t;
                e.attr("data-hide") === D ? h || e.show().removeAttr("data-hide") : h && e.hide().attr("data-hide", D);
            }
            let m = "", u = "";
            if (a.includes(r) ? (m = b, u = y) : i.includes(r) ? (m = k, u = S) : s.includes(r) ? (m = C, 
            u = _) : o.includes(r) ? (m = P, u = B) : n.some((t => l.includes(t) || r.includes(t))) ? (m = "关键词屏蔽", 
            u = y) : d.includes(r) ? (m = "男演员屏蔽", u = y) : c.includes(r) && (m = "女演员屏蔽", u = y), 
            e.find(".status-tag").remove(), m && (h && e.find(".tags").append(`\n                    <span class="tag is-success status-tag" \n                        style="margin-right: 5px; border-radius:10px; position:absolute; right: 0; top:5px;z-index:10;background-color: ${u} !important;">\n                        ${m}\n                    </span>`), 
            g)) {
                let t = `\n                        <a class="a-primary status-tag" style="margin-right: 5px; padding: 0 5px;color: #fff !important; border-radius:10px; position:absolute; right: 0; top:5px;z-index:10;background-color: ${u} !important;">\n                            <span class="tag" style="color:#fff !important;">${m}</span>\n                        </a>`;
                e.find(".item-tag").append(t);
            }
            this.translate(e);
        })), $("#waitDownBtn span").text(`打开已收藏 (${i.length})`);
    }
    async bindClick() {
        let t = this.getSelector();
        $(t.boxSelector).on("click", ".item img", (async t => {
            if (t.preventDefault(), t.stopPropagation(), $(t.target).closest("div.meta-buttons").length) return;
            const e = $(t.target).closest(".item"), {carNum: n, aHref: a} = this.findCarNumAndHref(e);
            let i = await storageManager.getSetting("dialogOpenDetail", D);
            if (n.includes("FC2-")) {
                let t = this.parseMovieId(a);
                this.getBean("fc2Plugin").openFc2Dialog(t, n, a);
            } else i === D ? utils.openPage(a, n, !1, t) : window.open(a);
        })), $(t.boxSelector).on("click", ".item video", (async t => {
            const e = t.currentTarget;
            e.paused ? e.play().catch((t => console.error("播放失败:", t))) : e.pause(), t.preventDefault(), 
            t.stopPropagation();
        })), $(t.boxSelector).on("click", ".item .video-title", (async t => {
            if ($(t.target).closest('[class^="jhs-match-"]').length) return;
            const e = $(t.currentTarget).closest(".item"), {carNum: n, aHref: a} = this.findCarNumAndHref(e);
            if (n.includes("FC2-")) {
                t.preventDefault();
                let e = this.parseMovieId(a);
                this.getBean("fc2Plugin").openFc2Dialog(e, n, a);
            }
        })), $(t.boxSelector).on("contextmenu", ".item img, .item video", (t => {
            t.preventDefault();
            const e = $(t.target).closest(".item"), {carNum: n, aHref: a} = this.findCarNumAndHref(e);
            utils.q(t, `是否屏蔽番号 ${n}?`, (async () => {
                await storageManager.saveCar(n, a, "", m), window.refresh(), show.ok("操作成功");
            }));
        }));
    }
    async bindListPageHotKey() {
        let t = null;
        $(this.getSelector().coverImgSelector).on("mouseenter", (function() {
            t = $(this);
        })).on("mouseleave", (function() {
            t = null;
        }));
        let e = await storageManager.getSetting();
        if (this.filterHotKey = e.filterHotKey, this.favoriteHotKey = e.favoriteHotKey, 
        this.hasDownHotKey = e.hasDownHotKey, this.hasWatchHotKey = e.hasWatchHotKey, this.enableImageHotKey = e.enableImageHotKey || I, 
        this.enableImageHotKey === I) return;
        const n = async (t, e, n) => {
            await storageManager.saveCar(t, e, null, n), window.refresh();
        }, a = {};
        this.filterHotKey && (a[this.filterHotKey] = (t, e) => {
            n(t, e, m);
        }), this.favoriteHotKey && (a[this.favoriteHotKey] = (t, e) => {
            n(t, e, u);
        }), this.hasDownHotKey && (a[this.hasDownHotKey] = (t, e) => {
            n(t, e, f);
        }), this.hasWatchHotKey && (a[this.hasWatchHotKey] = (t, e) => {
            n(t, e, v);
        });
        const i = (e, n) => {
            V.registerHotkey(e, (e => {
                const a = document.activeElement;
                if (!("INPUT" === a.tagName || "TEXTAREA" === a.tagName || a.isContentEditable) && t) {
                    const e = t.closest(".item"), {carNum: a, aHref: i} = this.findCarNumAndHref(e);
                    n(a, i);
                }
            }));
        };
        Object.entries(a).forEach((([t, e]) => {
            i(t, e);
        }));
    }
    findCarNumAndHref(t) {
        var e;
        let n, a, i = t.find("a"), s = i.attr("href");
        if (h) {
            n = t.find(".video-title").find("strong").text().trim(), a = i.attr("title").trim();
        }
        if (g && (n = s.split("/").filter(Boolean).pop().trim(), a = t.find("img").attr("title").trim() || (null == (e = t.find("img").attr("data-title")) ? void 0 : e.trim())), 
        !n) {
            const t = "提取番号信息失败";
            throw show.error(t), new Error(t);
        }
        return {
            carNum: n,
            aHref: s,
            title: a
        };
    }
    showCarNumBox(t) {
        const e = $(".movie-list .item").toArray().find((e => $(e).find(".video-title strong").text() === t));
        if (e) {
            const n = $(e);
            n.attr("data-hide") === `${t}-hide` && (n.show(), n.removeAttr("data-hide"));
        }
    }
    replaceHdImg(t) {
        if (t || (t = document.querySelectorAll(this.getSelector().coverImgSelector)), h && t.forEach((t => {
            t.src = t.src.replace("thumbs", "covers"), t.title = "";
        })), g) {
            const e = /\/(imgs|pics)\/(thumb|thumbs)\//, n = /(\.jpg|\.jpeg|\.png)$/i, a = t => {
                t.src && e.test(t.src) && "true" !== t.dataset.hdReplaced && (t.src = t.src.replace(e, "/$1/cover/").replace(n, "_b$1"), 
                t.dataset.hdReplaced = "true", t.loading = "lazy", t.dataset.title = t.title, t.title = "");
            };
            t.forEach((t => {
                a(t);
            }));
        }
        storageManager.getSetting("hoverBigImg", "yes").then((t => {
            "yes" === t && (window.imageHoverPreviewObj ? window.imageHoverPreviewObj.bindEvents() : window.imageHoverPreviewObj = new ImageHoverPreview({
                selector: this.getSelector().coverImgSelector
            }));
        }));
    }
    async translate(t) {
        if (await storageManager.getSetting("translateTitle", D) !== D) return;
        let e, n, a = t.find(".video-title");
        if (h ? (e = a.contents().filter(((t, e) => 3 === e.nodeType && "" !== e.textContent.trim())).text().trim(), 
        n = t.find(".video-title strong").text().trim()) : (e = t.find("img").attr("data-title").trim(), 
        n = t.find("a").attr("href").split("/").filter(Boolean).pop().trim()), this.cache[n]) {
            let t = this;
            a.contents().each((function() {
                3 === this.nodeType && "" !== this.textContent.trim() && (this.textContent = " " + t.cache[n] + " ");
            }));
        } else O(e).then((t => {
            h ? a.contents().each((function() {
                3 !== this.nodeType || "" === this.textContent.trim() || this.textContent.includes(n) || (this.textContent = " " + t + " ");
            })) : a.text(t), this.writeQueue = this.writeQueue.then((() => {
                this.cache[n] = t, localStorage.setItem("jhs_translate", JSON.stringify(this.cache));
            }));
        })).catch((t => {
            console.error("翻译失败:", t);
        }));
    }
    async revertTranslation() {
        $(this.getSelector().itemSelector).toArray().forEach((t => {
            let e = $(t);
            const n = e.find(".box").attr("title") || e.find(".video-title").attr("title") || e.find("img").attr("data-title");
            let a;
            h && (a = e.find(".video-title strong").text().trim());
            e.find(".video-title").contents().each((function() {
                3 !== this.nodeType || "" === this.textContent.trim() || this.textContent.includes(a) || (this.textContent = " " + n + " ");
            }));
        }));
    }
}

class wt extends U {
    constructor() {
        super(...arguments), r(this, "preloadDistance", 500), r(this, "currentPage", this.getInitialPageNumber()), 
        r(this, "pageItems", []);
    }
    getName() {
        return "AutoPagePlugin";
    }
    async initCss() {
        return "\n            <style>\n                .jhs-scroll {\n                    text-align: center;\n                    padding-top: 20px;\n                    font-size: 14px;\n                }\n                .jhs-scroll.waterfall-loading { color: #000; }\n                .jhs-scroll.waterfall-error { color: #f44336; cursor: pointer; }\n                .jhs-scroll.waterfall-no-more { color: #4CAF50; }\n            </style>\n        ";
    }
    async handle() {
        this.waterfall().then();
    }
    getInitialPageNumber() {
        if (g) {
            const t = d.match(/\/(page|star\/[^/]+)\/(\d+)/);
            return t ? parseInt(t[2], 10) : 1;
        }
        if (h) {
            const t = d.match(/[?&]page=(\d+)/);
            return t ? parseInt(t[1], 10) : 1;
        }
        return 1;
    }
    async waterfall() {
        if (await storageManager.getSetting("autoPage", D) === I) return;
        if (await this.shouldDisablePaging()) return;
        const t = this.getSelector();
        this.container = document.querySelector(t.boxSelector), this.loader = document.createElement("div"), 
        this.loader.className = "jhs-scroll", this.container.parentNode.insertBefore(this.loader, this.container.nextSibling), 
        this.pageItems.push({
            page: this.currentPage,
            top: 0,
            url: window.location.href
        }), this.loader.addEventListener("click", (() => {
            this.loader.classList.contains("waterfall-error") && this.loadNextPage().then();
        })), window.addEventListener("scroll", (() => {
            this.checkLoad(), this.checkScrollPosition();
        }));
        const e = document.querySelector(t.nextPageSelector);
        this.nextUrl = null == e ? void 0 : e.href, this.hasMore = !!this.nextUrl, setTimeout((() => {
            this.checkLoad();
        }), 1e3), this.hasMore || this.setState("waterfall-no-more", "已经到底了");
    }
    async loadNextPage() {
        var t;
        if (await storageManager.getSetting("autoPage", D) === I) return void this.setState("waterfall-loading", "");
        if (this.isLoading || !this.nextUrl) return;
        this.isLoading = !0, this.setState("waterfall-loading", "加载中...");
        const e = this.getSelector();
        try {
            console.log("请求下一页内容:", this.nextUrl);
            const n = await gmHttp.get(this.nextUrl), a = (new DOMParser).parseFromString(n, "text/html");
            g && $(a).find(".avatar-box").length > 0 && $(a).find(".avatar-box").parent().remove();
            let i = a.querySelectorAll(this.getSelector().requestDomItemSelector);
            const s = this.container.scrollHeight;
            this.pageItems.push({
                page: this.currentPage + 1,
                top: s,
                url: this.nextUrl
            });
            const o = this.getBean("listPagePlugin");
            await o.filterMovieList(i);
            let r = a.querySelectorAll(this.getSelector().coverImgSelector);
            o.replaceHdImg(r), $(this.getSelector().boxSelector).append(i), this.nextUrl = null == (t = a.querySelector(e.nextPageSelector)) ? void 0 : t.href, 
            this.hasMore = !!this.nextUrl;
            let l = a.querySelectorAll(".pagination");
            $(".pagination").replaceWith(l), this.setState("waterfall-loading", ""), this.hasMore || this.setState("waterfall-no-more", "已经到底了");
        } catch (n) {
            console.error("加载失败:", n), this.setState("waterfall-error", "加载失败，点击重试");
        } finally {
            this.isLoading = !1, this.checkLoad();
        }
    }
    checkScrollPosition() {
        const t = window.scrollY;
        for (let e = this.pageItems.length - 1; e >= 0; e--) {
            const n = this.pageItems[e];
            if (t >= n.top) {
                this.currentPage !== n.page && (this.currentPage = n.page, this.updatePageUrl(n.url));
                break;
            }
        }
    }
    checkLoad() {
        this.loader.getBoundingClientRect().top < window.innerHeight + this.preloadDistance && this.loadNextPage();
    }
    async shouldDisablePaging() {
        if (!window.isListPage) return !0;
        if (d.includes("/actors/") || d.includes("/star/")) {
            let t = h ? $(".actor-section-name") : $(".avatar-box .photo-info .pb10");
            if (0 === t.length) return void show.error("获取演员名称失败");
            let e = t.text().trim().split(",")[0];
            const n = {
                ...await storageManager.getActressFilterCarMap(),
                ...await storageManager.getActorFilterCarMap()
            }, a = Object.keys(n);
            for (const i of a) {
                if (e === i.split("_").pop()) return show.info("该演员已屏蔽, 停止瀑布流加载"), !0;
            }
        }
        return [ "search?q", "handlePlayback=1", "handleTop=1", "/want_watch_videos", "/watched_videos", "/advanced_search?type=100" ].some((t => d.includes(t)));
    }
    updatePageUrl_old(t) {
        if (window.history.pushState({}, "", t), g) {
            const e = t.match(/\/(page|star\/.*?)\/(\d+)/), n = e ? parseInt(e[2], 10) : null;
            document.title = document.title.replace(/第\d+頁/, "第" + n + "頁");
        }
    }
    updatePageUrl(t) {
        window.history.replaceState({}, "", t), g && (document.title = document.title.replace(/第\d+頁/, `第${this.currentPage}頁`));
    }
    setState(t, e) {
        this.loader.className = `jhs-scroll ${t}`, this.loader.textContent = e;
    }
}

class bt {
    constructor(t) {
        this.baseApiUrl = "https://api.aliyundrive.com", this.refresh_token = t, this.authorization = null, 
        this.default_drive_id = null, this.backupFolderId = null;
    }
    async getDefaultDriveId() {
        return this.default_drive_id || (this.userInfo = await this.getUserInfo(), this.default_drive_id = this.userInfo.default_drive_id), 
        this.default_drive_id;
    }
    async getHeaders() {
        return this.authorization || (this.authorization = await this.getAuthorization()), 
        {
            authorization: this.authorization
        };
    }
    async getAuthorization() {
        let t = this.baseApiUrl + "/v2/account/token", e = {
            refresh_token: this.refresh_token,
            grant_type: "refresh_token"
        };
        try {
            return "Bearer " + (await http.post(t, e)).access_token;
        } catch (n) {
            throw n.message.includes("is not valid") ? new Error("refresh_token无效, 请重新填写并保存") : n;
        }
    }
    async getUserInfo() {
        const t = await this.getHeaders();
        let e = this.baseApiUrl + "/v2/user/get";
        return await http.post(e, {}, t);
    }
    async deleteFile(t, e = null) {
        if (!t) throw new Error("未传入file_id");
        e || (e = await this.getDefaultDriveId());
        let n = {
            file_id: t,
            drive_id: e
        }, a = this.baseApiUrl + "/v2/recyclebin/trash";
        const i = await this.getHeaders();
        return await gmHttp.post(a, n, i), {};
    }
    async createFolder(t, e = null, n = "root") {
        e || (e = await this.getDefaultDriveId());
        let a = this.baseApiUrl + "/adrive/v2/file/createWithFolders", i = {
            name: t,
            type: "folder",
            parent_file_id: n,
            check_name_mode: "auto_rename",
            content_hash_name: "sha1",
            drive_id: e
        };
        const s = await this.getHeaders();
        return await gmHttp.post(a, i, s);
    }
    async getFileList(t = "root", e = null) {
        e || (e = await this.getDefaultDriveId());
        let n = this.baseApiUrl + "/adrive/v3/file/list";
        const a = {
            drive_id: e,
            parent_file_id: t,
            limit: 200,
            all: !1,
            url_expire_sec: 14400,
            image_thumbnail_process: "image/resize,w_256/format,avif",
            image_url_process: "image/resize,w_1920/format,avif",
            video_thumbnail_process: "video/snapshot,t_120000,f_jpg,m_lfit,w_256,ar_auto,m_fast",
            fields: "*",
            order_by: "updated_at",
            order_direction: "DESC"
        }, i = await this.getHeaders();
        return (await gmHttp.post(n, a, i)).items;
    }
    async uploadFile(t, e, n, a = null) {
        let i = this.baseApiUrl + "/adrive/v2/file/createWithFolders";
        a || (a = await this.getDefaultDriveId());
        let s = {
            drive_id: a,
            part_info_list: [ {
                part_number: 1
            } ],
            parent_file_id: t,
            name: e,
            type: "file",
            check_name_mode: "auto_rename"
        };
        const o = await this.getHeaders(), r = await gmHttp.post(i, s, o), l = r.upload_id, c = r.file_id, d = r.part_info_list[0].upload_url;
        console.log("创建完成: ", r), await this._doUpload(d, n);
        const h = await gmHttp.post("https://api.aliyundrive.com/v2/file/complete", s = {
            drive_id: a,
            file_id: c,
            upload_id: l
        }, o);
        console.log("标记完成:", h);
    }
    _doUpload(t, e) {
        return new Promise(((n, a) => {
            $.ajax({
                type: "PUT",
                url: t,
                data: e,
                contentType: " ",
                processData: !1,
                success: (t, e, i) => {
                    200 === i.status ? (console.log("上传成功:", t), n({})) : a(i);
                },
                error: t => {
                    console.error("上传失败", t.responseText), a(t);
                }
            });
        }));
    }
    async getDownloadUrl(t, e = null) {
        e || (e = await this.getDefaultDriveId());
        let n = this.baseApiUrl + "/v2/file/get_download_url";
        const a = await this.getHeaders();
        let i = {
            file_id: t,
            drive_id: e
        };
        return (await gmHttp.post(n, i, a)).url;
    }
    async _createBackupFolder(t) {
        const e = await this.getFileList();
        let n = null;
        for (let a = 0; a < e.length; a++) {
            let i = e[a];
            if (i.name === t) {
                n = i;
                break;
            }
        }
        n || (console.log("不存在目录, 进行创建"), n = await this.createFolder(t)), this.backupFolderId = n.file_id;
    }
    async backup(t, e, n) {
        this.backupFolderId || await this._createBackupFolder(t), await this.uploadFile(this.backupFolderId, e, n);
    }
    async getBackupList(t) {
        let e;
        this.backupFolderId || await this._createBackupFolder(t), e = await this.getFileList(this.backupFolderId);
        const n = [];
        return e.forEach((t => {
            n.push({
                name: t.name,
                fileId: t.file_id,
                createTime: t.created_at,
                size: t.size
            });
        })), n;
    }
}

class yt {
    constructor(t, e, n) {
        this.davUrl = t.endsWith("/") ? t : t + "/", this.username = e, this.password = n, 
        this.folderName = null;
    }
    _getAuthHeaders() {
        return {
            Authorization: `Basic ${btoa(`${this.username}:${this.password}`)}`,
            Depth: "1"
        };
    }
    _sendRequest(t, e, n = {}, a) {
        return new Promise(((i, s) => {
            const o = this.davUrl + e, r = {
                ...this._getAuthHeaders(),
                ...n
            };
            GM_xmlhttpRequest({
                method: t,
                url: o,
                headers: r,
                data: a,
                onload: t => {
                    t.status >= 200 && t.status < 300 ? i(t) : (console.error(t), s(new Error(`请求失败 ${t.status}: ${t.statusText}`)));
                },
                onerror: t => {
                    console.error("请求WebDav发生错误:", t), s(new Error("请求WebDav失败, 请检查服务是否启动, 凭证是否正确"));
                }
            });
        }));
    }
    async backup(t, e, n) {
        await this._sendRequest("MKCOL", t);
        const a = t + "/" + e;
        await this._sendRequest("PUT", a, {
            "Content-Type": "text/plain"
        }, n);
    }
    async getFileList(t) {
        var e, n, a;
        const i = (await this._sendRequest("PROPFIND", t, {
            "Content-Type": "application/xml"
        }, '<?xml version="1.0"?>\n                <d:propfind xmlns:d="DAV:">\n                    <d:prop>\n                        <d:displayname />\n                        <d:getcontentlength />\n                        <d:creationdate />\n                        <d:getlastmodified />\n                        <d:iscollection />\n                    </d:prop>\n                </d:propfind>\n            ')).responseText, s = (new DOMParser).parseFromString(i, "text/xml").getElementsByTagNameNS("DAV:", "response"), o = [];
        for (let r = 0; r < s.length; r++) {
            if (0 === r) continue;
            let t = s[r];
            console.log(t);
            const i = t.getElementsByTagNameNS("DAV:", "displayname")[0].textContent, l = (null == (e = t.getElementsByTagNameNS("DAV:", "getcontentlength")[0]) ? void 0 : e.textContent) || "0", c = (null == (n = t.getElementsByTagNameNS("DAV:", "creationdate")[0]) ? void 0 : n.textContent) || (null == (a = t.getElementsByTagNameNS("DAV:", "getlastmodified")[0]) ? void 0 : a.textContent) || "";
            "0" !== l && o.push({
                fileId: i,
                name: i,
                size: Number(l),
                createTime: c
            });
        }
        return o.reverse(), o;
    }
    async deleteFile(t) {
        let e = this.folderName + "/" + encodeURI(t);
        await this._sendRequest("DELETE", e, {
            "Cache-Control": "no-cache"
        });
    }
    async getBackupList(t) {
        return this.folderName = t, await this._sendRequest("MKCOL", t), this.getFileList(t);
    }
    async getFileContent(t) {
        let e = this.folderName + "/" + t;
        return (await this._sendRequest("GET", e, {
            Accept: "application/octet-stream"
        })).responseText;
    }
}

const xt = async (t, e = 0, n = 30) => {
    const a = `https://webapi.115.com/files/search?search_value=${encodeURIComponent(t)}&offset=${e}&limit=${n}`;
    return await gmHttp.get(a);
};

class $t extends U {
    constructor() {
        super(...arguments), l(this, a), r(this, "folderName", "JHS-数据备份"), r(this, "cacheItems", [ {
            key: "jhs_dmm_video",
            text: "🎥 预览视频缓存",
            title: "预览视频缓存"
        }, {
            key: "jhs_other_site",
            text: "🌍 第三方站点缓存",
            title: "第三方站点资源检测结果, 如missav,123Av等"
        }, {
            key: "jhs_screenShot",
            text: "🖼️ 缩略图缓存",
            title: "缩略图缓存"
        }, {
            key: "jhs_translate",
            text: "🆎 标题翻译",
            title: "标题翻译"
        }, {
            key: "jhs_actress_info",
            text: "👩 演员信息",
            title: "演员的年龄三围等数据信息"
        }, {
            key: "jhs_score_info",
            text: "⭐ Top250|热播 评分数据",
            title: "Top250及热播的评分数据"
        } ]);
    }
    getName() {
        return "SettingPlugin";
    }
    getDefaultGridColumns() {
        return window.innerWidth < 600 ? 1 : window.innerWidth < 900 ? 2 : window.innerWidth < 1e3 ? 3 : window.innerWidth < 1200 ? 4 : 5;
    }
    async initCss() {
        let t = await storageManager.getSetting("containerWidth", "100"), e = await storageManager.getSetting("containerColumns", this.getDefaultGridColumns());
        this.applyImageMode(e);
        let n = `\n            section .container{\n                max-width: 1000px !important;\n                min-width: ${t}%;\n            }\n            .movie-list{\n                grid-template-columns: repeat(${e}, minmax(0, 1fr));\n            }\n        `;
        return g && (n = `\n                .container-fluid .row{\n                    max-width: 1000px !important;\n                    min-width: ${t}%;\n                    margin: auto auto;\n                }\n                \n                .container {\n                    max-width: 1000px !important;\n                    min-width: 80%;\n                    margin: auto auto;\n                }\n                \n                .masonry {\n                    grid-template-columns: repeat(${e}, minmax(0, 1fr));\n                }\n            `), 
        `\n            <style>\n                ${n}\n                .nav-btn::after {\n                    content:none !important;\n                }\n                \n                #cache-data-display pre {\n                    font-family: Consolas, Monaco, 'Andale Mono', monospace;\n                    white-space: pre-wrap;\n                    word-wrap: break-word;\n                    line-height: 1.5;\n                    color: #333;\n                    border: 1px solid #ddd;\n                }\n                \n                .cache-item {\n                    transition: all 0.2s ease;\n                }\n                .cache-item:hover {\n                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);\n                    transform: translateY(-2px);\n                }\n\n                .tooltip-icon {\n                    display: inline-block;\n                    width: 16px;\n                    height: 16px;\n                    line-height: 16px;\n                    text-align: center;\n                    border-radius: 50%;\n                    background-color: #ccc;\n                    color: white;\n                    font-size: 12px;\n                    margin-right: 5px;\n                    cursor: help;\n                }\n                .setting-item {\n                    display: flex;\n                    align-items: baseline;\n                    justify-content: space-between;\n                    margin-bottom: 10px;\n                    padding: 5px;\n                    /*border: 1px solid #ddd;\n                    border-radius: 5px;*/\n                }\n                .simple-setting .setting-item{\n                    align-items:center;\n                }\n                .setting-label {\n                    font-size: 14px;\n                    min-width: 240px;\n                    font-weight: bold;\n                    margin-right: 10px;\n                }\n                .form-content{\n                    max-width: 160px;\n                    min-width: 160px;\n                }\n                .form-content * {\n                    width: 100%;\n                    padding: 5px;\n                    margin-right: 10px;\n                    text-align: center;\n                }\n                .keyword-label {\n                    display: inline-flex;\n                    align-items: center;\n                    padding: 4px 8px;\n                    border-radius: 4px;\n                    color: white;\n                    font-size: 14px;\n                    position: relative;\n                    margin-left: 8px;\n                    margin-bottom: 2px;\n                }\n                \n                .keyword-remove {\n                    margin-left: 6px;\n                    cursor: pointer;\n                    font-size: 12px;\n                    line-height: 1;\n                }\n                \n                .keyword-input {\n                    padding: 6px 12px;\n                    border: 1px solid #ccc;\n                    border-radius: 4px;\n                    font-size: 14px;\n                    float:right;\n                }\n                \n                .add-tag-btn {\n                    padding: 6px 12px;\n                    background-color: #45d0b6;\n                    color: white;\n                    border: none;\n                    border-radius: 4px;\n                    cursor: pointer;\n                    font-size: 14px;\n                    margin-left: 8px;\n                    float:right;\n                }\n                \n                .add-tag-btn:hover {\n                    background-color: #3fceb7;\n                }\n                #saveBtn,#moreBtn,#helpBtn,#clean-all {\n                    padding: 8px 20px;\n                    background-color: #4CAF50;\n                    color: white;\n                    border: none;\n                    border-radius: 4px;\n                    cursor: pointer;\n                    font-size: 16px;\n                    margin-top: 10px;\n                }\n                #saveBtn:hover {\n                    background-color: #45a049;\n                }\n                #moreBtn {\n                    background-color: #5cb85c;\n                    color: white;\n                }\n                #moreBtn:hover {\n                    background-color: #4cae4c;\n                }\n                #helpBtn {\n                    background-color: #e67e22;\n                    color: white;\n                }\n                #helpBtn:hover {\n                    background-color: #d35400;\n                }\n                .simple-setting, .mini-simple-setting {\n                    display: none; /* 默认隐藏 */\n                    background: rgba(255,255,255,1); \n                    position: absolute;\n                    top: 35px; /* 在按钮正下方显示 */\n                    right: -300%;\n                    z-index: 1000;\n                    border: 1px solid #ddd;\n                    border-radius: 4px;\n                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);\n                    padding: 0;\n                    margin-top: 5px; /* 稍微拉开一点距离 */\n                    color: #363131;\n                }\n                \n                .mini-switch {\n                  appearance: none;\n                  -webkit-appearance: none;\n                  width: 40px;\n                  height: 20px;\n                  background: #e0e0e0;\n                  border-radius: 20px;\n                  position: relative;\n                  cursor: pointer;\n                  outline: none;\n                  /*transition: all 0.2s ease;*/\n                }\n                \n                .mini-switch:checked {\n                  background: #4CAF50;\n                }\n                \n                .mini-switch::before {\n                  content: "";\n                  position: absolute;\n                  width: 16px;\n                  height: 16px;\n                  border-radius: 50%;\n                  background: white;\n                  top: 2px;\n                  left: 2px;\n                  box-shadow: 0 1px 3px rgba(0,0,0,0.2);\n                  /*transition: all 0.2s ease;*/\n                }\n                \n                .mini-switch:checked::before {\n                  left: calc(100% - 18px);\n                }\n                \n                .side-menu-item {\n                    padding: 12px 12px;\n                    cursor: pointer;\n                    color: #333;\n                    border-left: 3px solid transparent;\n                    transition: all 0.2s;\n                }\n                \n                .side-menu-item:hover {\n                    background-color: #e9e9e9;\n                }\n                \n                .side-menu-item.active {\n                    background-color: #e0e0e0;\n                    border-left: 3px solid #5d87c2;\n                    font-weight: bold;\n                }\n                \n                .content-panel {\n                    display: none;\n                    margin-top:20px;\n                }\n                \n                .content-panel.active {\n                    display: block;\n                }\n            </style\n        `;
    }
    async handle() {
        if (h) {
            let t = function() {
                $(".navbar-search").is(":hidden") ? ($(".mini-setting-box").hide(), $(".setting-box").show()) : ($(".mini-setting-box").show(), 
                $(".setting-box").hide());
            };
            $("#navbar-menu-user .navbar-end").prepend('<div class="navbar-item has-dropdown is-hoverable setting-box" style="position:relative;">\n                    <a id="setting-btn" class="navbar-link nav-btn" style="color: #ff8400 !important;padding-right:15px !important;">\n                        设置\n                    </a>\n                    <div class="simple-setting"></div>\n                </div>'), 
            utils.loopDetector((() => $("#miniHistoryBtn").length > 0), (() => {
                $(".miniHistoryBtnBox").before('\n                    <div class="navbar-item mini-setting-box" style="position:relative;margin-left: auto;">\n                        <a id="mini-setting-btn" class="navbar-link nav-btn" style="color: #ff8400 !important;padding-left:0 !important;padding-right:0 !important;">\n                            设置\n                        </a>\n                        <div class="mini-simple-setting"></div>\n                    </div>\n                '), 
                t();
            })), $(window).resize(t);
        }
        g && $("#navbar").append(`\n                <ul class="nav navbar-nav navbar-right setting-box">\n                    <li><a id="setting-btn" style="color: #ff8400 !important;padding-right:15px !important;" role="button">设置</a><div class="simple-setting">${this.simpleSetting()}</div></li>\n                </ul>\n           `), 
        $(".main-nav, .top-bar").on("click", "#setting-btn, #mini-setting-btn", (() => {
            this.openSettingDialog();
        })), $(".main-nav, .top-bar").on("mouseenter", ".setting-box", (() => {
            $(".simple-setting").html(this.simpleSetting()).show(), this.initSimpleSettingForm().then();
        })).on("mouseleave", ".setting-box", (() => {
            $(".simple-setting").html("").hide();
        })), $(".main-nav, .top-bar").on("mouseenter", ".mini-setting-box", (() => {
            $(".mini-simple-setting").html(this.simpleSetting()).show(), this.initSimpleSettingForm().then();
        })).on("mouseleave", ".mini-setting-box", (() => {
            $(".mini-simple-setting").html("").hide();
        }));
    }
    async openSettingDialog(t = "backup-panel") {
        const e = await storageManager.getActressFilterCarMap(), n = await storageManager.getActorFilterCarMap(), a = Object.values(e).reduce(((t, e) => t + e.length), 0), i = Object.values(n).reduce(((t, e) => t + e.length), 0), s = this.cacheItems.map((t => `\n            <div class="cache-item" style="border: 1px solid #eee; border-radius: 8px; padding: 12px;">\n                <div style="font-weight: bold; margin-bottom: 8px;">${t.text}</div>\n                <div style="display: flex; gap: 8px;">\n                    <a class="menu-btn clean-btn" data-key="${t.key}" style="background-color:#448cc2; flex:1; text-align:center;" title="${t.title}">\n                        <span>清理</span>\n                    </a>\n                    <a class="menu-btn view-btn" data-key="${t.key}" style="background-color:#b2bec0; flex:1; text-align:center;" >\n                        <span>查看</span>\n                    </a>\n                </div>\n            </div>\n        `)).join("");
        let o = "";
        M.forEach((t => {
            o += `<option value="${t.quality}">${t.text}</option>`;
        }));
        let r = `\n            <div style="display: flex; height: 100%;">\n                <div style="width: 140px; flex-shrink: 0; padding: 15px 0; background: #f5f5f5; border-right: 1px solid #ddd;">\n                    <div class="side-menu-item ${"backup-panel" === t ? "active" : ""}" data-panel="backup-panel">💾 数据备份</div>\n                    <div class="side-menu-item ${"base-panel" === t ? "active" : ""}" data-panel="base-panel">⚙️ 基础配置</div>\n                    <div class="side-menu-item ${"filter-panel" === t ? "active" : ""}" data-panel="filter-panel">🚫 屏蔽配置</div>\n                    <div class="side-menu-item ${"domain-panel" === t ? "active" : ""}" data-panel="domain-panel">🌐 域名设置</div>\n                    <div class="side-menu-item ${"hotkey-panel" === t ? "active" : ""}" data-panel="hotkey-panel">⌨️ 快捷键配置</div>\n                    <div class="side-menu-item ${"netdisk115-panel" === t ? "active" : ""}" data-panel="netdisk115-panel">☁️ 115网盘</div>\n                    <div class="side-menu-item ${"cache-panel" === t ? "active" : ""}" data-panel="cache-panel">🧹 清理缓存</div>\n                </div>\n        \n                \x3c!-- 右侧内容区域 --\x3e\n                <div style="flex: 1; display: flex; flex-direction: column; height: 100%; ">\n                    \x3c!-- 内容面板容器 --\x3e\n                    <div style="flex: 1; margin: 0 20px; padding-bottom: 20px;">\n                        \x3c!-- 阿里云盘面板 --\x3e\n                        <div id="backup-panel" class="content-panel" style="display: ${"backup-panel" === t ? "block" : "none"};">\n                            <div style="margin-bottom: 20px">\n                                <a id="importBtn" class="menu-btn" style="background-color:#d25a88"><span>导入数据</span></a>\n                                <a id="exportBtn" class="menu-btn" style="background-color:#85d0a3"><span>导出数据</span></a>\n                                <a id="syncDataBtn" class="menu-btn" style="background-color:#387ca9"><span>合并数据</span></a>\n                                <a id="getRefreshTokenBtn" class="menu-btn fr-btn" style="background-color:#c4a35e"><span>获取refresh_token</span></a>\n                            </div>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label">阿里云盘备份</span>\n                                <div>\n                                    <a id="backupListBtn" class="menu-btn" style="background-color:#5d87c2"><span>查看备份</span></a>\n                                    <a id="backupBtn" class="menu-btn" style="background-color:#64bb69"><span>备份数据</span></a>\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">refresh_token:</span>\n                                <div class="form-content">\n                                    <input id="refresh_token">\n                                </div>\n                            </div>\n                            \n                            <hr style="border: 0; height: 1px; margin:20px 0;background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(159,137,137,0.75), rgba(0,0,0,0));"/>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label">WebDav备份</span>\n                                <div>\n                                    <a id="webdavBackupListBtn" class="menu-btn" style="background-color:#5d87c2"><span>查看备份</span></a>\n                                    <a id="webdavBackupBtn" class="menu-btn" style="background-color:#64bb69"><span>备份数据</span></a>\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">服务地址:</span>\n                                <div class="form-content">\n                                    <input id="webDavUrl">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">用户名:</span>\n                                <div class="form-content">\n                                    <input id="webDavUsername">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">密码:</span>\n                                <div class="form-content">\n                                    <input id="webDavPassword">\n                                </div>\n                            </div>\n                        </div>\n                        \n                        \x3c!-- 115网盘面板 --\x3e\n                        <div id="netdisk115-panel" class="content-panel" style="display: ${"netdisk115-panel" === t ? "block" : "none"};">\n                            <div class="setting-item">\n                                <span class="setting-label"> 扫码获取cookie </span>\n                                <div class="form-content">\n                                    <select id="login-115-type">\n                                        <option value="">请选择登录方式</option>\n                                        <option value="wechatmini">微信小程序</option>\n                                        <option value="alipaymini">支付宝小程序</option>\n                                    </select>\n                                </div>\n                            </div>\n                            <div class="setting-item" id="qrcode-box" style="display: none">\n                                \n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">115网盘-cookie (快捷登录,需包含"UID", "CID", "KID", "SEID"):</span>\n                                <div class="form-content">\n                                    <input id="cookie115">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">\n                                    <div id="cookie-script" style="display: none;">\n                                        <div style="padding:10px; background: #f5f5f5; overflow-wrap: anywhere;"></div>\n                                        <br/>复制此脚本代码, 到浏览器控制台中运行\n                                    </div>\n                                </span>\n                                <div class="form-content">\n                                    <a class="a-primary" id="otherExplorer115" style="margin-left: 0">用其它浏览器打开115</a>\n                                </div>\n                            </div>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label">启用115视频匹配: </span>\n                                <div class="form-content">\n                                    <input type="checkbox" id="enable115Match" class="mini-switch">\n                                </div>\n                            </div>\n                            \n                            \x3c!--<div class="setting-item">\n                                <span class="setting-label"></span>\n                                <div class="form-content">\n                                    <a class="a-primary" style="margin-left: 0">打开115 </a>\n                                </div>\n                            </div>--\x3e\n                            \n                            <div class="setting-item do-hide">\n                                <span class="setting-label">\n                                    离线下载目录: <br/>\n                                    <div style="font-size: 13px;font-weight: normal">\n                                        子目录用/分隔; 支持占位符,女优名字{ny} 日期{date}<br/>\n                                        如: 云下载/有码/{ny}\n                                    </div>\n                                </span>\n                                <div class="form-content">\n                                    <input id="savePath115">\n                                </div>\n                            </div>\n                        </div>\n                        \n                        \x3c!-- 基础设置面板 --\x3e\n                        <div id="base-panel" class="content-panel" style="display: ${"base-panel" === t ? "block" : "none"};">\n                            <div class="setting-item">\n                                <span class="setting-label">预览视频默认画质:</span>\n                                <div class="form-content">\n                                    <select id="videoQuality">\n                                        ${o}\n                                    </select>\n                                </div>\n                            </div>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label">评论区条数:</span>\n                                <div class="form-content">\n                                    <select id="reviewCount">\n                                        <option value="10">10条</option>\n                                        <option value="20">20条</option>\n                                        <option value="30">30条</option>\n                                        <option value="40">40条</option>\n                                        <option value="50">50条</option>\n                                    </select>\n                                </div>\n                            </div>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label">每次打开待鉴定待下载数量:</span>\n                                <div class="form-content">\n                                    <input type="number" id="waitCheckCount" min="1" max="20" style="width: 100%;">\n                                </div>\n                            </div>\n\n                            <div class="setting-item">\n                                <span class="setting-label">\n                                    <span data-tip="详情页, 标题选中文字后可快捷加入屏蔽词">❓ </span> 启用标题划词屏蔽:\n                                </span>\n                                <div class="form-content">\n                                    <input type="checkbox" id="enableTitleSelectFilter" class="mini-switch">\n                                </div>\n                            </div>\n                            \n                            <div class="setting-item">\n                                <span id="highlightedTagLabel" class="setting-label">\n                                    分类标签边框样式:\n                                </span>\n                                <div class="form-content" style="display: flex; align-items: center;">\n                                    <input type="number" id="highlightedTagNumber" min="0" max="20">\n                                    <input type="color" id="highlightedTagColor">\n                                </div>\n                            </div>\n                        </div>\n                        \n                        \x3c!-- 域名设置面板 --\x3e\n                        <div id="domain-panel" class="content-panel" style="display: ${"domain-panel" === t ? "block" : "none"};">\n                            <div class="setting-item">\n                                <span class="setting-label">域名-MissAv:</span>\n                                <div class="form-content">\n                                    <input id="missAvUrl">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">域名-Jable:</span>\n                                <div class="form-content">\n                                    <input id="jableUrl">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">域名-Avgle:</span>\n                                <div class="form-content">\n                                    <input id="avgleUrl">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">域名-JavTrailer:</span>\n                                <div class="form-content">\n                                    <input id="javTrailersUrl">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">域名-123Av:</span>\n                                <div class="form-content">\n                                    <input id="av123Url">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">域名-JavDb:</span>\n                                <div class="form-content">\n                                    <input id="javDbUrl">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">域名-JavBus:</span>\n                                <div class="form-content">\n                                    <input id="javBusUrl">\n                                </div>\n                            </div>\n                        </div>\n                         \n                         \x3c!-- 快捷键 --\x3e\n                        <div id="hotkey-panel" class="content-panel" style="display: ${"hotkey-panel" === t ? "block" : "none"};">\n                            <div class="setting-item">\n                                <span class="setting-label">${w}:</span>\n                                <div class="form-content">\n                                    <input id="filterHotKey" placeholder="录入快捷键" data-default-hotkey="a">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">${x}:</span>\n                                <div class="form-content">\n                                    <input id="favoriteHotKey" placeholder="录入快捷键" data-default-hotkey="s">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">${C}:</span>\n                                <div class="form-content">\n                                    <input id="hasDownHotKey" placeholder="录入快捷键">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">${P}:</span>\n                                <div class="form-content">\n                                    <input id="hasWatchHotKey" placeholder="录入快捷键">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">⏩ 快进:</span>\n                                <div class="form-content">\n                                    <input id="speedVideoHotKey" placeholder="录入快捷键" data-default-hotkey="z">\n                                </div>\n                            </div>\n                            \n                            <hr style="border: 0; height: 1px; margin:20px 0;background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(159,137,137,0.75), rgba(0,0,0,0));"/>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label">\n                                    <span data-tip="列表页,鼠标放置图片上时可使用快捷键">❓ </span> 对视频列表页启用快捷键:\n                                </span>\n                                <div class="form-content">\n                                    <input type="checkbox" id="enableImageHotKey" class="mini-switch">\n                                </div>\n                            </div>\n\n                        </div>\n                        \n                        \x3c!-- 屏蔽设置面板 --\x3e\n                        <div id="filter-panel" class="content-panel" style="display: ${"filter-panel" === t ? "block" : "none"};">\n                            <div class="setting-item">\n                                <span class="setting-label">评论区屏蔽词:</span>\n                                <div id="reviewKeywordContainer" style="width:100%">\n                                    <div class="tag-box"></div>\n                                    <div style="margin-top: 10px;">\n                                        <button class="add-tag-btn">添加</button>\n                                        <input type="text" class="keyword-input" placeholder="添加屏蔽词">\n                                    </div>\n                                </div>\n                            </div>\n                            \n                            <hr style="border: 0; height: 1px; margin:20px 0;background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(159,137,137,0.75), rgba(0,0,0,0));"/>\n                             \n                            <div class="setting-item">\n                                <span class="setting-label">视频标题屏蔽词:</span>\n                                <div id="filterKeywordContainer" style="width:100%">\n                                    <div class="tag-box">\n                                    </div>\n                                    <div style="margin-top: 10px;">\n                                        <button class="add-tag-btn">添加</button>\n                                        <input type="text" class="keyword-input" placeholder="添加屏蔽词">\n                                    </div>\n                                </div>\n                            </div>\n                            \n                            <hr style="border: 0; height: 1px; margin:20px 0;background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(159,137,137,0.75), rgba(0,0,0,0));"/>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label">屏蔽男演员(番号总屏蔽数-${i}):</span>\n                                <div id="filterActorContainer" style="width:100%">\n                                    <div class="tag-box"></div>\n                                </div>\n                            </div>\n                            \n                            <hr style="border: 0; height: 1px; margin:20px 0;background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(159,137,137,0.75), rgba(0,0,0,0));"/>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label">屏蔽女演员(番号总屏蔽数-${a}):</span>\n                                <div id="filterActressContainer" style="width:100%">\n                                    <div class="tag-box"></div>\n                                </div>\n                            </div>\n                        </div>\n                        \n                         \x3c!-- 清理缓存 --\x3e\n                        <div id="cache-panel" class="content-panel" style="display: ${"cache-panel" === t ? "block" : "none"};">\n                            <h1 style="text-align:center;font-size: 20px;font-weight: bold">以下操作, 不会对核心数据造成影响</h1>\n                            <br/>               \n                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 20px;">\n                                ${s}\n                            </div>    \n                            <div id="cache-data-display" style="margin-top: 20px; display: none;">\n                                <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; max-height: 400px; overflow: auto;"></pre>\n                            </div>\n                        </div>\n                    </div>\n                    \n                    \x3c!-- 底部保存按钮 --\x3e\n                    <div style="flex-shrink: 0; padding: 15px 20px; text-align: right; border-top: 1px solid #eee; background: white;">   \n                        <button id="saveBtn">保存设置</button>\n                        <button id="clean-all" style="display: none">♾️ 清理全部缓存</button>\n                    </div>\n                </div>\n            </div>\n        `;
        layer.open({
            type: 1,
            title: "设置",
            content: r,
            area: utils.getResponsiveArea([ "55%", "90%" ]),
            scrollbar: !1,
            success: (t, e) => {
                $(t).find(".layui-layer-content").css("position", "relative"), this.loadForm(), 
                this.bindClick();
            }
        });
    }
    simpleSetting() {
        return `\n             <div style="display: flex; flex-direction: column; height: 100%;margin-top:20px">\n                <div style=" flex: 1; margin: 0 10px; ">\n                    <div class="setting-item">\n                        <span class="setting-label">\n                            显示已鉴定内容:\n                        </span>\n                        <div class="form-content">\n                            <span style="display:inline-block; width: 65px; font-size:13px; font-weight:bold; text-align: left">屏蔽: </span><input type="checkbox" id="showFilterItem" class="mini-switch"><br/>\n                            <span style="display:inline-block; width: 65px; font-size:13px; font-weight:bold; text-align: left">收藏: </span><input type="checkbox" id="showFavoriteItem" class="mini-switch"><br/>\n                            <span style="display:inline-block; width: 65px; font-size:13px; font-weight:bold; text-align: left">已下载: </span><input type="checkbox" id="showHasDownItem" class="mini-switch"><br/>\n                            <span style="display:inline-block; width: 65px; font-size:13px; font-weight:bold; text-align: left">已观看: </span><input type="checkbox" id="showHasWatchItem" class="mini-switch"><br/>\n                        </div>\n                    </div>\n                    \n                    <div class="setting-item">\n                        <span class="setting-label">\n                            <span data-tip="点击封面的打开方式,弹窗|新窗口">❓ </span>弹窗方式打开页面:\n                        </span>\n                        <div class="form-content">\n                             <input type="checkbox" id="dialogOpenDetail" class="mini-switch">\n                        </div>\n                    </div>      \n                    \n                    <div class="setting-item">\n                        <span class="setting-label">鉴定后立即关闭当前页面:</span>\n                        <div class="form-content">\n                            <input type="checkbox" id="needClosePage" class="mini-switch">\n                        </div>\n                    </div>\n                    \n                    <div class="setting-item">\n                        <span class="setting-label">\n                             <span data-tip="使用瀑布流模式, 请将排序方式改为默认, 否则会出现排序错乱问题">❓ </span>瀑布流模式:\n                        </span>\n                        <div class="form-content">\n                            <input type="checkbox" id="autoPage" class="mini-switch">\n                        </div>\n                    </div>\n       \n                    <div class="setting-item">\n                        <span class="setting-label">启用标题翻译:</span>\n                        <div class="form-content">\n                            <input type="checkbox" id="translateTitle" class="mini-switch">\n                        </div>\n                    </div>\n                    \n                    <div class="setting-item">\n                        <span class="setting-label">启用悬浮大图:</span>\n                        <div class="form-content">\n                            <input type="checkbox" id="hoverBigImg" class="mini-switch">\n                        </div>\n                    </div>\n                    \n                    ${h ? '\n                    <div class="setting-item">\n                        <span class="setting-label">\n                            <span data-tip="详情页是否展示女优年龄、三围等信息">❓ </span>加载女优信息:\n                        </span>\n                        <div class="form-content">\n                            <input type="checkbox" id="enableLoadActressInfo" class="mini-switch">\n                        </div>\n                    </div>' : ""}\n                    \n                    <div class="setting-item">\n                        <span class="setting-label">\n                            <span data-tip="详情页第三方资源检测,如missAv,123AV">❓ </span>加载第三方视频资源:\n                        </span>\n                        <div class="form-content">\n                            <input type="checkbox" id="enableLoadOtherSite" class="mini-switch">\n                        </div>\n                    </div>\n                    \n                    <div class="setting-item">\n                        <span class="setting-label">\n                            <span data-tip="详情页图片区首列位置加载长缩略图">❓ </span>加载长缩略图:\n                        </span>\n                        <div class="form-content">\n                            <input type="checkbox" id="enableLoadScreenShot" class="mini-switch">\n                        </div>\n                    </div>\n                    \n                     <div class="setting-item">\n                        <span class="setting-label">\n                            <span data-tip="详情页提前加载是否有其它画质的预览视频">❓ </span>详情页预加载预览视频:\n                        </span>\n                        <div class="form-content">\n                            <input type="checkbox" id="enableLoadPreviewVideo" class="mini-switch">\n                        </div>\n                    </div>\n                                    \n                    <div class="setting-item">\n                        <span class="setting-label">页面列数: <span id="showContainerColumns"></span></span>\n                        <div class="form-content">\n                            <input type="range" id="containerColumns" min="2" max="10" step="1" style="padding:5px 0">\n                        </div>\n                    </div>\n                    \n                    <div class="setting-item">\n                        <span class="setting-label">页面宽度: <span id="showContainerWidth"></span></span>\n                        <div class="form-content">\n                            <input type="range" id="containerWidth" min="0" max="30" step="1" style="padding:5px 0">\n                        </div>\n                    </div>\n                </div>\n                <div style="flex-shrink: 0; padding: 0 20px 15px; text-align: right; border-top: 1px solid #eee;">   \n                    <button id="helpBtn" style="float:left;">常见问题</button>\n                    <button id="moreBtn">更多设置</button>\n                </div>\n            </div>\n        `;
    }
    async loadForm() {
        let t = await storageManager.getSetting();
        $("#videoQuality").val(t.videoQuality), $("#reviewCount").val(t.reviewCount || 20), 
        $("#waitCheckCount").val(t.waitCheckCount || 5);
        const e = t.highlightedTagNumber || 1, n = t.highlightedTagColor || "#ce2222";
        $("#highlightedTagNumber").val(t.highlightedTagNumber || 1), $("#highlightedTagColor").val(t.highlightedTagColor || "#ce2222"), 
        $("#highlightedTagLabel").css("border", `${e}px solid ${n}`), $("#refresh_token").val(t.refresh_token || ""), 
        $("#webDavUrl").val(t.webDavUrl || ""), $("#webDavUsername").val(t.webDavUsername || ""), 
        $("#webDavPassword").val(t.webDavPassword || ""), $("#cookie115").val(t.cookie115 || ""), 
        $("#savePath115").val(t.savePath115 || "云下载"), $("#enable115Match").prop("checked", !!t.enable115Match && "yes" === t.enable115Match);
        let a = null;
        $("#login-115-type").on("change", (async t => {
            let e = $("#login-115-type").val();
            if (!e) return;
            const n = (await (async t => {
                let e = `https://qrcodeapi.115.com/api/1.0/${t}/1.0/token/`;
                return await gmHttp.get(e);
            })(e)).data, i = n.qrcode, s = n.sign, o = n.time, r = n.uid;
            console.log(n);
            const l = $("#qrcode-box");
            l.show(), l.html(""), new QRCode(l[0], {
                text: i,
                width: 150,
                height: 150,
                correctLevel: QRCode.CorrectLevel.H
            }), a && clearTimeout(a);
            const c = async () => {
                try {
                    const t = await (async (t, e, n) => {
                        let a = `https://qrcodeapi.115.com/get/status/?uid=${t}&time=${e}&sign=${n}`;
                        return await gmHttp.get(a);
                    })(r, o, s);
                    console.log(t);
                    let n = t.data, i = n.msg, l = n.status;
                    if (i && show.info(i), 2 === l) {
                        show.ok("扫码登录成功");
                        const t = await (async (t, e) => {
                            const n = {
                                app: t,
                                account: e
                            }, a = `https://passportapi.115.com/app/1.0/${t}/1.0/login/qrcode/`;
                            return await gmHttp.postFormData(a, n);
                        })(e, r);
                        if (console.log(t), t.data && t.data.cookie) {
                            const e = t.data.cookie, n = e.CID, a = e.UID, i = e.SEID, s = `UID=${a}; CID=${n}; SEID=${i}; KID=${e.KID}`;
                            $("#cookie115").val(s), await this.saveForm();
                        }
                        return;
                    }
                    a = setTimeout(c, 500);
                } catch (t) {
                    console.error("登录检查失败:", t);
                }
            };
            await c();
        })), $("#enableTitleSelectFilter").prop("checked", !t.enableTitleSelectFilter || "yes" === t.enableTitleSelectFilter);
        const i = this.getBean("OtherSitePlugin"), s = await i.getMissAvUrl(), o = await i.getjableUrl(), r = await i.getAvgleUrl(), l = await i.getJavTrailersUrl(), c = await i.getAv123Url(), d = await i.getJavDbUrl(), h = await i.getJavBusUrl();
        $("#missAvUrl").val(s), $("#jableUrl").val(o), $("#avgleUrl").val(r), $("#javTrailersUrl").val(l), 
        $("#av123Url").val(c), $("#javDbUrl").val(d), $("#javBusUrl").val(h);
        const g = await storageManager.getItem(storageManager.filter_actor_actress_info_list_key) || [], p = t => t.sort(((t, e) => {
            var n, a;
            const i = null == (n = g.find((e => e.key === t))) ? void 0 : n.recordTime, s = null == (a = g.find((t => t.key === e))) ? void 0 : a.recordTime;
            if (!i) return -1;
            if (!s) return 1;
            return new Date(i) - new Date(s);
        })), m = await storageManager.getActressFilterCarMap();
        p(Object.keys(m)).forEach((t => {
            var e;
            const n = m[t].length, a = t.split("_").filter(Boolean).pop(), i = null == (e = g.find((e => e.key === t))) ? void 0 : e.url;
            this.addLabelTag("#filterActressContainer", `${a} (${n})`, `当前已屏蔽数量:${n}`, t, i);
        }));
        const u = await storageManager.getActorFilterCarMap();
        p(Object.keys(u)).forEach((t => {
            var e;
            const n = u[t].length, a = t.split("_").filter(Boolean).pop(), i = null == (e = g.find((e => e.key === t))) ? void 0 : e.url;
            this.addLabelTag("#filterActorContainer", `${a} (${n})`, `当前已屏蔽数量:${n}`, t, i);
        }));
        let f = await storageManager.getReviewFilterKeywordList(), v = await storageManager.getTitleFilterKeyword();
        f && f.forEach((t => {
            this.addLabelTag("#reviewKeywordContainer", t);
        })), v && v.forEach((t => {
            this.addLabelTag("#filterKeywordContainer", t);
        })), [ "#reviewKeywordContainer", "#filterKeywordContainer", "#filterActorContainer", "#filterActressContainer" ].forEach((t => {
            $(`${t} .add-tag-btn`).on("click", (e => this.addKeyword(e, t))), $(`${t} .keyword-input`).on("keypress", (e => {
                "Enter" === e.key && this.addKeyword(e, t);
            }));
        })), $("#hotkey-panel [id]").map(((t, e) => e.id)).get().forEach((e => {
            const n = $(`#${e}`), a = void 0 !== t[e] ? t[e] : n.attr("data-default-hotkey") || "";
            n.val(a).on("input", (t => {
                let e = $(t.target).val();
                (/[\u4e00-\u9fa5]/.test(e) || /^Shift[a-zA-Z0-9]+$/.test(e)) && ($(t.target).val(""), 
                show.error("非法输入：不能输入中文或输入法转换错误"));
            })).on("keydown", (t => this.handleHotkeyInput(t, n)));
        })), $("#enableImageHotKey").prop("checked", !!t.enableImageHotKey && "yes" === t.enableImageHotKey);
    }
    handleHotkeyInput(t, e) {
        t.preventDefault();
        const n = this.parseHotkey(t);
        "" !== n ? this.isDuplicateHotkey(n, e.attr("id")) ? show.error("该快捷键已被其他功能使用！") : e.val(n) : e.val("");
    }
    parseHotkey(t) {
        if ("Backspace" === t.key || "Process" === t.key) return "";
        const e = [];
        t.ctrlKey && e.push("Ctrl"), t.shiftKey && e.push("Shift"), t.altKey && e.push("Alt"), 
        t.metaKey && e.push("Cmd");
        const n = {
            " ": "Space",
            Control: "Ctrl",
            Meta: "Cmd",
            ArrowUp: "Up",
            ArrowDown: "Down",
            ArrowLeft: "Left",
            ArrowRight: "Right"
        }[t.key] || (t.key.length > 1 ? t.key.replace("Arrow", "") : t.key);
        return [ "Control", "Shift", "Alt", "Meta" ].includes(t.key) || e.push(n), e.length > 0 ? e.join("+") : "";
    }
    isDuplicateHotkey(t, e) {
        let n = !1;
        return $("#hotkey-panel [id]").each(((a, i) => {
            if (i.id !== e && t && t === $(i).val()) return n = !0, !1;
        })), n;
    }
    async initSimpleSettingForm() {
        let t = await storageManager.getSetting();
        $("#containerColumns").val(t.containerColumns || 4), $("#showContainerColumns").text(t.containerColumns || 4), 
        $("#containerWidth").val((t.containerWidth || 100) - 70), $("#showContainerWidth").text((t.containerWidth || 100) + "%"), 
        $("#dialogOpenDetail").prop("checked", !t.dialogOpenDetail || "yes" === t.dialogOpenDetail), 
        $("#needClosePage").prop("checked", !t.needClosePage || "yes" === t.needClosePage), 
        $("#autoPage").prop("checked", !t.autoPage || "yes" === t.autoPage), $("#translateTitle").prop("checked", !t.translateTitle || "yes" === t.translateTitle), 
        $("#enableLoadActressInfo").prop("checked", !t.enableLoadActressInfo || "yes" === t.enableLoadActressInfo), 
        $("#enableLoadOtherSite").prop("checked", !t.enableLoadOtherSite || "yes" === t.enableLoadOtherSite), 
        $("#containerColumns").on("input", (t => {
            let e = $("#containerColumns").val();
            if ($("#showContainerColumns").text(e), h) {
                document.querySelector(".movie-list").style.gridTemplateColumns = `repeat(${e}, minmax(0, 1fr))`;
            }
            if (g) {
                document.querySelector(".masonry").style.gridTemplateColumns = `repeat(${e}, minmax(0, 1fr))`;
            }
            storageManager.saveSettingItem("containerColumns", e), this.applyImageMode(parseInt(e));
        })), $("#containerWidth").on("input", (t => {
            let e = parseInt($(t.target).val());
            const n = e + 70 + "%";
            if ($("#showContainerWidth").text(n), h) {
                document.querySelector("section .container").style.minWidth = n;
            }
            if (g) {
                document.querySelector(".container-fluid .row").style.minWidth = n;
            }
            storageManager.saveSettingItem("containerWidth", e + 70);
        })), $("#dialogOpenDetail").on("change", (t => {
            let e = $("#dialogOpenDetail").is(":checked") ? "yes" : "no";
            storageManager.saveSettingItem("dialogOpenDetail", e);
        })), $("#showFilterItem").prop("checked", !!t.showFilterItem && "yes" === t.showFilterItem), 
        $("#showFavoriteItem").prop("checked", !t.showFavoriteItem || "yes" === t.showFavoriteItem), 
        $("#showHasDownItem").prop("checked", !t.showHasDownItem || "yes" === t.showHasDownItem), 
        $("#showHasWatchItem").prop("checked", !t.showHasWatchItem || "yes" === t.showHasWatchItem), 
        $("#showFilterItem").on("change", (t => {
            let e = $("#showFilterItem").is(":checked") ? "yes" : "no";
            storageManager.saveSettingItem("showFilterItem", e), window.refresh();
        })), $("#showFavoriteItem").on("change", (t => {
            let e = $("#showFavoriteItem").is(":checked") ? "yes" : "no";
            storageManager.saveSettingItem("showFavoriteItem", e), window.refresh();
        })), $("#showHasDownItem").on("change", (t => {
            let e = $("#showHasDownItem").is(":checked") ? "yes" : "no";
            storageManager.saveSettingItem("showHasDownItem", e), window.refresh();
        })), $("#showHasWatchItem").on("change", (t => {
            let e = $("#showHasWatchItem").is(":checked") ? "yes" : "no";
            storageManager.saveSettingItem("showHasWatchItem", e), window.refresh();
        })), $("#needClosePage").on("change", (t => {
            storageManager.saveSettingItem("needClosePage", $("#needClosePage").is(":checked") ? "yes" : "no"), 
            window.refresh();
        })), $("#autoPage").on("change", (async t => {
            const e = $("#autoPage").is(":checked") ? "yes" : "no";
            await storageManager.saveSettingItem("autoPage", e), e === D ? $("#sort-toggle-btn").hide() : $("#sort-toggle-btn").show();
        })), $("#translateTitle").on("change", (async t => {
            const e = $("#translateTitle").is(":checked") ? "yes" : "no";
            await storageManager.saveSettingItem("translateTitle", e), "yes" === e ? (await this.getBean("ListPagePlugin").doFilter(), 
            isDetailPage && (h ? await this.getBean("DetailPagePlugin").translate() : await this.getBean("BusDetailPagePlugin").translate())) : (await this.getBean("ListPagePlugin").revertTranslation(), 
            $(".translated-title").remove());
        })), $("#hoverBigImg").prop("checked", !t.hoverBigImg || "yes" === t.hoverBigImg), 
        $("#hoverBigImg").on("change", (async t => {
            const e = $("#hoverBigImg").is(":checked") ? "yes" : "no";
            await storageManager.saveSettingItem("hoverBigImg", e), "yes" === e ? window.imageHoverPreviewObj = new ImageHoverPreview({
                selector: this.getSelector().coverImgSelector
            }) : window.imageHoverPreviewObj && window.imageHoverPreviewObj.destroy();
        })), $("#enableLoadActressInfo").on("change", (async t => {
            const e = $("#enableLoadActressInfo").is(":checked") ? "yes" : "no";
            await storageManager.saveSettingItem("enableLoadActressInfo", e), "yes" === e ? this.getBean("ActressInfoPlugin").loadActressInfo() : $(".actress-info").remove();
        })), $("#enableLoadOtherSite").on("change", (async t => {
            const e = $("#enableLoadOtherSite").is(":checked") ? "yes" : "no";
            await storageManager.saveSettingItem("enableLoadOtherSite", e), "yes" === e ? this.getBean("OtherSitePlugin").loadOtherSite().then() : $("#otherSiteBox").remove();
        })), $("#enableLoadScreenShot").prop("checked", !t.enableLoadScreenShot || "yes" === t.enableLoadScreenShot), 
        $("#enableLoadScreenShot").on("change", (async t => {
            const e = $("#enableLoadScreenShot").is(":checked") ? "yes" : "no";
            await storageManager.saveSettingItem("enableLoadScreenShot", e), "yes" === e ? this.getBean("ScreenShotPlugin").loadScreenShot().then() : $(".screen-container").remove();
        })), $("#enableLoadPreviewVideo").prop("checked", !t.enableLoadPreviewVideo || "yes" === t.enableLoadPreviewVideo), 
        $("#enableLoadPreviewVideo").on("change", (async t => {
            const e = $("#enableLoadPreviewVideo").is(":checked") ? "yes" : "no";
            await storageManager.saveSettingItem("enableLoadPreviewVideo", e);
        })), $("#moreBtn").on("click", (() => {
            $(".simple-setting").html("").hide(), this.openSettingDialog("base-panel");
        })), $("#helpBtn").on("click", (() => {
            layer.open({
                type: 1,
                title: "",
                shadeClose: !0,
                scrollbar: !1,
                content: '\n<style>\n    .help-container {\n        font-family: \'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif;\n        color: #333;\n        padding: 15px;\n        max-height: 100%;\n        overflow-y: auto;\n    }\n    \n    .help-section {\n        margin-bottom: 25px;\n    }\n    \n    .help-section h1 {\n        font-size: 18px;\n        color: #3498db;\n        margin-bottom: 12px;\n    }\n    \n    .help-content {\n        background-color: #f9f9f9;\n        border-radius: 5px;\n        padding: 15px;\n        border-left: 4px solid #3498db;\n    }\n    \n    .help-content p {\n        line-height: 1.6;\n        margin-bottom: 10px;\n    }\n    .help-section img {\n        max-width: 100%;\n        height: auto;\n        border: 1px solid #ddd;\n        border-radius: 4px;\n        box-shadow: 0 2px 4px rgba(0,0,0,0.1);\n    }\n</style>\n\n<div class="help-container">\n    <h1 style="font-size: 22px; margin-bottom: 20px; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px;">使用说明</h1>\n    \n    <div class="help-section">\n        <h1>1. 无法查看预览视频，提示分流</h1>\n        <div class="help-content">\n            <p>JavDB限制日本IP的访问，而预览视频来自DMM，需要日本IP才能访问。</p>\n            <p>这样会导致二者无法同时使用，需要对其一进行代理转发。</p>\n            <p>将 cc3001.dmm.co.jp 及 dmm.co 分流到日本ip。</p>\n            <p><a href="https://youtu.be/wQUK8z_YeU4?t=121" target="_blank">Clash Verge分流规则设置 </a> (如果你是别的代理软件，自行搜索如何分流)</p>\n        </div>\n    </div>\n    \n    <div class="help-section">\n        <h1>2. 如何屏蔽某一系列的番号</h1>\n        <div class="help-content">\n            <p>方法一：设置中-添加视频标题关键词，如: VENX-</p>\n            <p>方法二：进入详情页，选中标题文字，右键可加入</p>\n            <img src="https://i.imgur.com/lVnhK5A.png" alt="进入详情页，选中标题，进行右键"/>\n        </div>\n    </div>\n\n    <div class="help-section">\n        <h1>3. 屏蔽某演员，如何只屏蔽单体影片</h1>\n        <div class="help-content">\n            <p>屏蔽演员前，先筛选分类，再点屏蔽</p>\n            <img src="https://i.imgur.com/nr3Dwb8.png" alt="屏蔽演员前，先筛选分类，再点屏蔽"/>\n        </div>\n    </div>\n</div>\n',
                area: utils.getResponsiveArea([ "50%", "90%" ])
            });
        }));
    }
    applyImageMode(t) {
        if ($("#verticalImgStyle").remove(), t >= 6) {
            let t = "100% 50% !important";
            window.location.href.includes("/advanced_search?type=100") && (t = "50% 50% !important");
            const e = `\n                .cover {\n                    min-height: 350px !important;\n                    overflow: hidden !important;\n                }\n                \n                .cover img {\n                    object-fit: cover !important;\n                    object-position: ${t};\n                }\n                \n                /* bus的 */\n                .masonry .movie-box img {\n                    min-height: 300px;\n                    object-fit: cover !important;\n                    object-position: top right;\n                }\n            `;
            $("<style>").attr("id", "verticalImgStyle").text(e).appendTo("head");
        } else {
            const t = "\n                .cover {\n                    min-height:auto !important;\n                }\n                .cover img {\n                    object-fit: contain !important;\n                    object-position: 50% 50% !important\n                }\n                \n                /* bus的 */\n                 .masonry .movie-box img {\n                    min-height:auto !important;\n                    object-fit: contain !important;\n                    object-position: top;\n                }\n            ";
            $("<style>").attr("id", "verticalImgStyle").text(t).appendTo("head");
        }
    }
    bindClick() {
        $(".side-menu-item").on("click", (function() {
            $(".side-menu-item").removeClass("active"), $(this).addClass("active"), $(".content-panel").hide();
            const t = $(this).data("panel");
            $("#" + t).show(), "cache-panel" === t ? ($("#saveBtn").hide(), $("#clean-all").show()) : ($("#saveBtn").show(), 
            $("#clean-all").hide());
        })), $("#importBtn").on("click", (t => this.importData(t))), $("#exportBtn").on("click", (t => this.exportData(t))), 
        $("#syncDataBtn").on("click", (t => this.syncData(t))), $("#backupBtn").on("click", (t => this.backupData(t))), 
        $("#backupListBtn").on("click", (t => this.backupListBtn(t))), $("#webdavBackupBtn").on("click", (t => this.backupDataByWebDav(t))), 
        $("#webdavBackupListBtn").on("click", (t => this.backupListBtnByWebDav(t))), $("#getRefreshTokenBtn").on("click", (t => layer.alert("即将跳转阿里云盘, 请登录后, 点击最右侧悬浮按钮获取refresh_token", {
            yes: function(t, e, n) {
                window.open("https://www.aliyundrive.com/drive/home"), layer.close(t);
            }
        }))), $("#saveBtn").on("click", (() => this.saveForm())), $(".clean-btn").on("click", (t => {
            const e = $(t.currentTarget).data("key"), n = this.cacheItems.find((t => t.key === e));
            localStorage.removeItem(e), show.ok(`${n.text} 清理成功`), $("#cache-data-display").hide();
        })), $("#clean-all").on("click", (() => {
            this.cacheItems.forEach((t => localStorage.removeItem(t.key))), show.ok("全部缓存已清理"), 
            $("#cache-data-display").hide();
        })), $(".view-btn").on("click", (t => {
            const e = $(t.currentTarget).data("key"), n = localStorage.getItem(e), a = $("#cache-data-display"), i = a.find("pre");
            if (a.show(), n) try {
                const t = JSON.parse(n);
                i.text(JSON.stringify(t, null, 2));
            } catch {
                i.text(n);
            } else i.text("无数据");
        })), $("#otherExplorer115").on("click", (t => {
            let e = "";
            $("#cookie115").val().split(";").forEach((t => {
                const n = t.trim();
                if (n) {
                    const [t, a] = n.split("=");
                    if (t && a) {
                        e += 'document.cookie="' + [ `${t}=${a}`, "path=/", "domain=.115.com" ].join("; ") + '";\n';
                    }
                }
            })), $("#cookie-script").show(), $("#cookie-script div").text(e);
        }));
        const t = $("#highlightedTagNumber"), e = $("#highlightedTagColor"), n = $("#highlightedTagLabel");
        function a() {
            const a = t.val(), i = e.val();
            n.css("border", `${a}px solid ${i}`);
        }
        t.on("input", a), e.on("input", a);
    }
    async saveForm() {
        let t = await storageManager.getSetting();
        t.videoQuality = $("#videoQuality").val(), t.reviewCount = $("#reviewCount").val(), 
        t.waitCheckCount = $("#waitCheckCount").val(), t.refresh_token = $("#refresh_token").val(), 
        t.highlightedTagNumber = $("#highlightedTagNumber").val(), t.highlightedTagColor = $("#highlightedTagColor").val(), 
        t.webDavUrl = $("#webDavUrl").val(), t.webDavUsername = $("#webDavUsername").val(), 
        t.webDavPassword = $("#webDavPassword").val(), t.missAvUrl = $("#missAvUrl").val(), 
        t.jableUrl = $("#jableUrl").val(), t.avgleUrl = $("#avgleUrl").val(), t.javTrailersUrl = $("#javTrailersUrl").val(), 
        t.av123Url = $("#av123Url").val(), t.javDbUrl = $("#javDbUrl").val(), t.javBusUrl = $("#javBusUrl").val(), 
        t.cookie115 = $("#cookie115").val(), t.savePath115 = $("#savePath115").val(), t.enable115Match = $("#enable115Match").is(":checked") ? "yes" : "no", 
        t.enableTitleSelectFilter = $("#enableTitleSelectFilter").is(":checked") ? "yes" : "no", 
        $("#hotkey-panel [id]").map(((t, e) => e.id)).get().forEach((e => {
            t[e] = $(`#${e}`).val();
        })), t.enableImageHotKey = $("#enableImageHotKey").is(":checked") ? "yes" : "no", 
        await storageManager.saveSetting(t);
        let e = [];
        $("#reviewKeywordContainer .keyword-label").toArray().forEach((t => {
            let n = $(t).text().replace("×", "").replace(/[\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim();
            e.push(n);
        })), await storageManager.saveReviewFilterKeyword(e);
        let n = [];
        $("#filterKeywordContainer .keyword-label").toArray().forEach((t => {
            let e = $(t).text().replace("×", "").replace(/[\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim();
            n.push(e);
        })), await storageManager.saveTitleFilterKeyword(n), show.ok("保存成功"), window.refresh();
    }
    addLabelTag(t, e, n, a, i) {
        const s = $(`${t} .tag-box`);
        let o = "div", r = "#c9a561";
        i && (o = "a"), i && i.includes("?") && (r = "#c5b9a0", n = "该屏蔽为分类过滤型, " + n);
        const l = $(`\n            <${o} class="keyword-label" data-keyword="${e}" data-key="${a}" style="background-color: ${r}" title="${n || ""}" href="${i}" target="_blank">\n                ${e}\n                <span class="keyword-remove">×</span>\n            </${o}>\n        `);
        l.find(".keyword-remove").click((t => {
            t.stopPropagation(), t.preventDefault();
            const e = $(t.currentTarget);
            if (e.closest("#filterActressContainer, #filterActorContainer").length > 0) {
                let n = e.closest(".keyword-label");
                const a = n.attr("data-keyword").split(" ")[0], i = n.attr("data-key");
                utils.q(t, `是否移除对 ${a} 的屏蔽?  <br/>注意:该操作即时生效, 无需保存设置`, (async () => {
                    await storageManager.removeActorFilter(i);
                    const t = (await storageManager.getItem(storageManager.filter_actor_actress_info_list_key) || []).filter((t => t.key !== i));
                    await storageManager.setItem(storageManager.filter_actor_actress_info_list_key, t), 
                    e.parent().remove();
                }));
            } else e.parent().remove();
        })), s.append(l);
    }
    addKeyword(t, e) {
        let n = $(`${e} .keyword-input`);
        const a = n.val().trim();
        a && (this.addLabelTag(e, a), n.val(""));
    }
    importData() {
        try {
            const t = document.createElement("input");
            t.type = "file", t.accept = ".json", t.onchange = t => {
                const e = t.target.files[0];
                if (!e) return;
                const n = new FileReader;
                n.onload = t => {
                    try {
                        const e = t.target.result.toString(), n = JSON.parse(e);
                        layer.confirm("确定是否要覆盖导入？", {
                            icon: 3,
                            title: "确认覆盖",
                            btn: [ "确定", "取消" ]
                        }, (async function(t) {
                            await storageManager.importData(n), show.ok("数据导入成功"), layer.close(t), location.reload();
                        }));
                    } catch (e) {
                        console.error(e), show.error("导入失败：文件内容不是有效的JSON格式 " + e);
                    }
                }, n.onerror = () => {
                    show.error("读取文件时出错");
                }, n.readAsText(e);
            }, document.body.appendChild(t), t.click(), setTimeout((() => document.body.removeChild(t)), 1e3);
        } catch (t) {
            console.error(t), show.error("导入数据时出错: " + t.message);
        }
    }
    async backupData(t) {
        const e = await storageManager.getSetting("refresh_token");
        if (!e) return void show.error("请填写refresh_token并保存后, 再试此功能");
        let n = utils.getNowStr("_", "_") + ".json", a = JSON.stringify(await storageManager.exportData());
        a = St(a);
        let i = loading();
        try {
            const t = new bt(e);
            await t.backup(this.folderName, n, a), show.ok("备份完成");
        } catch (s) {
            console.error(s), show.error(s.toString());
        } finally {
            i.close();
        }
    }
    async backupListBtn(t) {
        const e = await storageManager.getSetting("refresh_token");
        if (!e) return void show.error("请填写refresh_token并保存后, 再试此功能");
        let n = loading();
        try {
            const t = new bt(e), n = await t.getBackupList(this.folderName);
            this.openFileListDialog(n, t, "阿里云盘");
        } catch (a) {
            console.error(a), show.error(`发生错误: ${a ? a.message : a}`);
        } finally {
            n.close();
        }
    }
    async backupDataByWebDav(t) {
        const e = await storageManager.getSetting(), n = e.webDavUrl;
        if (!n) return void show.error("请填写webDav服务地址并保存后, 再试此功能");
        const a = e.webDavUsername;
        if (!a) return void show.error("请填写webDav用户名并保存后, 再试此功能");
        const i = e.webDavPassword;
        if (!i) return void show.error("请填写webDav密码并保存后, 再试此功能");
        let s = utils.getNowStr("_", "_") + ".json", o = JSON.stringify(await storageManager.exportData());
        o = St(o);
        let r = loading();
        try {
            const t = new yt(n, a, i);
            await t.backup(this.folderName, s, o), show.ok("备份完成");
        } catch (l) {
            console.error(l), show.error(l.toString());
        } finally {
            r.close();
        }
    }
    async backupListBtnByWebDav(t) {
        const e = await storageManager.getSetting(), n = e.webDavUrl;
        if (!n) return void show.error("请填写webDav服务地址并保存后, 再试此功能");
        const a = e.webDavUsername;
        if (!a) return void show.error("请填写webDav用户名并保存后, 再试此功能");
        const i = e.webDavPassword;
        if (!i) return void show.error("请填写webDav密码并保存后, 再试此功能");
        let s = loading();
        try {
            const t = new yt(n, a, i), e = await t.getBackupList(this.folderName);
            this.openFileListDialog(e, t, "WebDav");
        } catch (o) {
            console.error(o), show.error(`发生错误: ${o ? o.message : o}`);
        } finally {
            s.close();
        }
    }
    openFileListDialog(t, e, n) {
        layer.open({
            type: 1,
            title: n + "备份文件",
            content: '<div id="table-container"></div>',
            area: [ "40%", "70%" ],
            success: a => {
                const i = new TableGenerator({
                    containerId: "table-container",
                    columns: [ {
                        key: "name",
                        title: "文件名"
                    }, {
                        key: "createTime",
                        title: "备份日期",
                        render: t => `${utils.getNowStr("-", ":", t.createTime)}`
                    }, {
                        key: "size",
                        title: "文件大小",
                        render: t => {
                            const e = [ "B", "KB", "MB", "GB", "TB", "PB" ];
                            let n = 0, a = t.size;
                            for (;a >= 1024 && n < e.length - 1; ) a /= 1024, n++;
                            return `${a % 1 == 0 ? a.toFixed(0) : a.toFixed(2)} ${e[n]}`;
                        }
                    } ],
                    data: t,
                    buttons: [ {
                        text: "删除",
                        class: "a-danger",
                        onClick: async (t, a) => {
                            layer.confirm(`是否删除 ${a.name} ?`, {
                                icon: 3,
                                title: "提示",
                                btn: [ "确定", "取消" ]
                            }, (async t => {
                                layer.close(t);
                                let s = loading();
                                try {
                                    await e.deleteFile(a.fileId);
                                    let t = await e.getBackupList(this.folderName);
                                    i.update(t), "阿里云盘" === n ? layer.alert("已移至回收站, 请到阿里云盘回收站二次删除") : layer.alert("删除成功");
                                } catch (o) {
                                    console.error(o), show.error(`发生错误: ${o ? o.message : o}`);
                                } finally {
                                    s.close();
                                }
                            }));
                        }
                    }, {
                        text: "下载",
                        class: "a-primary",
                        onClick: t => {
                            let a = loading();
                            try {
                                "阿里云盘" === n ? e.getDownloadUrl(t.fileId).then((e => {
                                    gmHttp.get(e, null, {
                                        Referer: "https://www.aliyundrive.com/"
                                    }).then((e => {
                                        e = Ct(e), utils.download(e, t.name);
                                    }));
                                })).catch((t => {
                                    console.error(t), show.error("下载失败: " + t);
                                })) : e.getFileContent(t.fileId).then((e => {
                                    e = Ct(e), utils.download(e, t.name);
                                }));
                            } catch (i) {
                                console.error(i), show.error("下载失败: " + i);
                            } finally {
                                a.close();
                            }
                        }
                    }, {
                        text: "导入",
                        class: "a-success",
                        onClick: t => {
                            layer.confirm(`是否将该云备份数据 ${t.name} 导入?`, {
                                icon: 3,
                                title: "提示",
                                btn: [ "确定", "取消" ]
                            }, (async a => {
                                layer.close(a);
                                let i = loading();
                                try {
                                    let a;
                                    if ("阿里云盘" === n) {
                                        const n = await e.getDownloadUrl(t.fileId);
                                        a = await gmHttp.get(n, null, {
                                            Referer: "https://www.aliyundrive.com/"
                                        });
                                    } else a = await e.getFileContent(t.fileId);
                                    a = Ct(a);
                                    const i = JSON.parse(a);
                                    await storageManager.importData(i), show.ok("导入成功!"), window.location.reload();
                                } catch (s) {
                                    console.error(s), show.error(s);
                                } finally {
                                    i.close();
                                }
                            }));
                        }
                    } ]
                });
            }
        });
    }
    async exportData(t) {
        try {
            const t = JSON.stringify(await storageManager.exportData()), e = `${utils.getNowStr("_", "_")}.json`;
            utils.download(t, e), show.ok("数据导出成功");
        } catch (e) {
            console.error(e), show.error("导出数据时出错: " + e.message);
        }
    }
    async syncData(t) {
        let e = null, n = null;
        const s = this.getBean("OtherSitePlugin");
        h && (e = "是否将JavBus的数据及配置合并到本站中? 请做好数据备份, 避免出错", n = await s.getJavBusUrl() + "/temp?syncData=1"), 
        g && (e = "是否将JavDB的数据及配置合并到本站中? 请做好数据备份, 避免出错", n = await s.getJavDbUrl() + "/feedbacks/new?syncData=1"), 
        utils.q(t, e, (() => {
            const t = window.open(n);
            let e = new URL(n).origin;
            console.log("开始连接接受方:", e);
            let s, o = 0;
            this.hasListenMsg || (window.addEventListener("message", (n => {
                if (n.origin === e) if ("ok" === n.data) clearInterval(s), console.log("连接确认，开始合并数据"), 
                t.postMessage("syncData", e); else {
                    const t = n.data;
                    console.log("收到数据", t), c(this, a, i).call(this, t);
                }
            })), this.hasListenMsg = !0);
            const r = () => {
                if (o >= 8) return clearInterval(s), console.log("超过最大重试次数，停止尝试"), void show.error("合并失败, 目标网站已中断, 请检查是否登录后再试!", {
                    close: !0,
                    duration: -1
                });
                console.log(`第 ${o + 1} 次ping...`), t.postMessage("ping", e), o++;
            };
            s = setInterval(r, 1e3), r();
        }));
    }
}

a = new WeakSet, i = async function(t) {
    try {
        const e = t.carList || [], n = t.titleFilterKeyword || [], a = t.reviewFilterKeyword || [], i = t.setting || {}, s = await storageManager.getCarList() || [], o = await storageManager.getTitleFilterKeyword() || [], r = await storageManager.getReviewFilterKeywordList() || [], l = await storageManager.getSetting() || {}, c = [ ...s ];
        e.forEach((t => {
            s.some((e => e.carNum === t.carNum)) || c.push(t);
        }));
        const d = [ ...new Set([ ...o, ...n ]) ], h = [ ...new Set([ ...r, ...a ]) ], g = {
            ...l
        };
        Object.keys(i).forEach((t => {
            Array.isArray(i[t]) ? g[t] && Array.isArray(g[t]) && 0 !== g[t].length ? g[t] = [ ...new Set([ ...g[t], ...i[t] ]) ] : g[t] = [ ...i[t] ] : t in g && g[t] || (g[t] = i[t]);
        })), await storageManager.overrideCarList(c), await storageManager.saveTitleFilterKeyword(d), 
        await storageManager.saveReviewFilterKeyword(h), await storageManager.saveSetting(g);
        const p = await storageManager.getActressFilterCarMap(), m = await storageManager.getActorFilterCarMap(), u = {
            ...p,
            ...m
        };
        for (const f of Object.keys(t)) if (f.startsWith("car_list_")) {
            let e = [];
            u[f] && u[f].length > 0 ? (e = [ ...u[f] ], t[f].forEach((t => {
                s.some((e => e.carNum === t.carNum)) || e.push(t);
            }))) : e = t[f], await storageManager.setItem(f, e);
        }
        show.ok("合并完成, 关闭提示后, 将重载数据", {
            close: !0,
            duration: -1,
            callback: () => {
                window.location.reload();
            }
        });
    } catch (e) {
        console.error(e), show.error("合并数据时出错:", e);
    }
};

const kt = "x7k9p3";

function St(t) {
    return (kt + t + kt).split("").map((t => {
        const e = t.codePointAt(0);
        return String.fromCodePoint(e + 5);
    })).join("");
}

function Ct(t) {
    return t.split("").map((t => {
        const e = t.codePointAt(0);
        return String.fromCodePoint(e - 5);
    })).join("").slice(kt.length, -kt.length);
}

class _t extends U {
    getName() {
        return "SyncDataPlugin";
    }
    async handle() {
        if (!window.location.href.includes("syncData=1")) return;
        g && $("h4").html("临时页面, 用于合并数据");
        let t = null;
        const e = this.getBean("OtherSitePlugin");
        h && (t = await e.getJavBusUrl()), g && (t = await e.getJavDbUrl()), console.log("等待发送方:", t), 
        window.addEventListener("message", (async e => {
            if (e.origin === t) if ("ping" === e.data) console.log("收到 ping，发送确认"), e.source.postMessage("ok", e.origin); else if ("syncData" === e.data) {
                console.log("开始发送数据...");
                const t = await storageManager.getCarList(), n = await storageManager.getTitleFilterKeyword(), a = await storageManager.getReviewFilterKeywordList(), i = await storageManager.getSetting(), s = await storageManager.getActressFilterCarMap(), o = await storageManager.getActorFilterCarMap();
                e.source.postMessage({
                    carList: t,
                    titleFilterKeyword: n,
                    reviewFilterKeyword: a,
                    setting: i,
                    ...s,
                    ...o
                }, e.origin), show.ok("数据已传输, 即将关闭页面...", {
                    callback: () => {
                        window.close();
                    }
                });
            }
        }));
    }
}

class Pt extends U {
    getName() {
        return "BusPreviewVideoPlugin";
    }
    async initCss() {
        return "\n            .video-control-btn {\n                min-width:100px;\n                padding: 8px 16px;\n                background: rgba(0,0,0,0.7);\n                color: white;\n                border: none;\n                border-radius: 4px;\n                cursor: pointer;\n            }\n            .video-control-btn.active {\n                background-color: #1890ff; /* 选中按钮的背景色 */\n                color: white;             /* 选中按钮的文字颜色 */\n                font-weight: bold;        /* 加粗显示 */\n                border: 2px solid #096dd9; /* 边框样式 */\n            }\n        ";
    }
    async handle() {
        if (!isDetailPage) return;
        const t = $("#sample-waterfall a:first").attr("href"), e = $(`\n            <a class="preview-video-container sample-box" style="cursor: pointer">\n                <div class="photo-frame" style="position:relative;">\n                    <img src="${t}" class="video-cover" alt="">\n                    <div class="play-icon" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); \n                            color:white; font-size:40px; text-shadow:0 0 10px rgba(0,0,0,0.5);">\n                        ▶\n                    </div>\n                </div>\n            </a>`);
        $("#sample-waterfall").prepend(e);
        "yes" === await storageManager.getSetting("enableLoadPreviewVideo", "yes") && K(this.getPageInfo().carNum, !1).then();
        let n = !1, a = $(".preview-video-container");
        a.on("click", (async t => {
            if (t.preventDefault(), t.stopPropagation(), n) show.info("正在加载中, 勿重复点击"); else {
                n = !0;
                try {
                    await this.handleVideo();
                } finally {
                    n = !1;
                }
            }
        })), window.location.href.includes("autoPlay=1") && a[0].click();
    }
    async handleVideo() {
        const t = $("#preview-video");
        if (t.length > 0) return void (t.is(":visible") ? ($("#videoBox").hide(), t[0].pause()) : ($("#videoBox").show(), 
        t[0].play().catch((t => console.error("切换播放失败:", t)))));
        let e = this.getPageInfo().carNum;
        const n = await K(e);
        await this.createQualityBtn(n);
        const a = document.getElementById("preview-video");
        if (a) {
            const t = a.getBoundingClientRect();
            window.scrollTo({
                top: window.scrollY + t.top - 100,
                behavior: "smooth"
            });
        }
    }
    async createQualityBtn(t) {
        let e = await storageManager.getSetting("videoQuality");
        if (!t[e]) {
            const n = Object.keys(t);
            e = n[n.length - 1];
        }
        let n = t[e];
        $("#magneturlpost").next().after(`<div id="videoBox"><video id="preview-video" controls style="width: 100%;margin-top: 5px;"><source src="${n}" /></video></div>`);
        const a = $("#preview-video"), i = a.find("source"), s = a.parent();
        if (!a.length || !i.length) return;
        const o = a[0], r = localStorage.getItem("jhs_videoMuted");
        r && (o.muted = "yes" === r), o.addEventListener("volumechange", (function() {
            localStorage.setItem("jhs_videoMuted", o.muted ? "yes" : "no");
        })), o.play();
        let l = "";
        M.forEach(((n, a) => {
            let i = t[n.quality];
            if (i) {
                const t = e === n.quality;
                l += `\n                    <button class="video-control-btn${t ? " active" : ""}" \n                            id="${n.id}" \n                            data-quality="${n.quality}"\n                            data-video-src = "${i}"\n                            style="bottom: ${40 * a}px; right: -105px;">\n                        ${n.text}\n                    </button>\n                `;
            }
        })), s.append(l);
        const c = s.find(".video-control-btn");
        s.on("click", ".video-control-btn", (async t => {
            try {
                const e = $(t.currentTarget);
                if (e.hasClass("active")) return;
                let n = e.attr("data-video-src");
                i.attr("src", n), o.load(), await o.play(), c.removeClass("active"), e.addClass("active");
            } catch (e) {
                show.error("切换画质失败"), console.error("切换画质失败:", e);
            }
        }));
    }
}

class Bt extends U {
    constructor() {
        super(...arguments), r(this, "siteList", [ {
            name: "Google旧版",
            url: "https://www.google.com/searchbyimage?image_url={占位符}&client=firefox-b-d",
            ico: "https://www.google.com/favicon.ico"
        }, {
            name: "Google",
            url: "https://lens.google.com/uploadbyurl?url={占位符}",
            ico: "https://www.google.com/favicon.ico"
        }, {
            name: "Yandex",
            url: "https://yandex.ru/images/search?rpt=imageview&url={占位符}",
            ico: "https://yandex.ru/favicon.ico"
        } ]), r(this, "isUploading", !1);
    }
    getName() {
        return "SearchByImagePlugin";
    }
    async initCss() {
        return "\n            <style>\n                #upload-area {\n                    border: 2px dashed #85af68;\n                    border-radius: 8px;\n                    padding: 40px;\n                    text-align: center;\n                    margin-bottom: 20px;\n                    transition: all 0.3s;\n                    background-color: #f9f9f9;\n                }\n                #upload-area:hover {\n                    border-color: #76b947;\n                    background-color: #f0f0f0;\n                }\n                /* 拖拽进入 */\n                #upload-area.highlight {\n                    border-color: #2196F3;\n                    background-color: #e3f2fd;\n                }\n                \n                \n                #select-image-btn {\n                    background-color: #4CAF50;\n                    color: white;\n                    border: none;\n                    padding: 10px 20px;\n                    border-radius: 4px;\n                    cursor: pointer;\n                    font-size: 16px;\n                    transition: background-color 0.3s;\n                }\n                #select-image-btn:hover {\n                    background-color: #45a049;\n                }\n                \n                \n                #handle-btn, #cancel-btn {\n                    padding: 8px 16px;\n                    border-radius: 4px;\n                    cursor: pointer;\n                    font-size: 14px;\n                    border: none;\n                    transition: opacity 0.3s;\n                }\n                #handle-btn {\n                    background-color: #2196F3;\n                    color: white;\n                }\n                #handle-btn:hover {\n                    opacity: 0.9;\n                }\n                #cancel-btn {\n                    background-color: #f44336;\n                    color: white;\n                }\n                #cancel-btn:hover {\n                    opacity: 0.9;\n                }\n                \n                .search-img-site-btns-container {\n                    display: flex;\n                    flex-wrap: wrap;\n                    gap: 10px;\n                    margin-top: 15px;\n                }\n                .search-img-site-btn {\n                    display: flex;\n                    align-items: center;\n                    padding: 8px 12px;\n                    background-color: #f5f5f5;\n                    border-radius: 4px;\n                    text-decoration: none;\n                    color: #333;\n                    transition: all 0.2s;\n                    font-size: 14px;\n                    border: 1px solid #ddd;\n                }\n                .search-img-site-btn:hover {\n                    background-color: #e0e0e0;\n                    transform: translateY(-2px);\n                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);\n                }\n                .search-img-site-btn img {\n                    width: 16px;\n                    height: 16px;\n                    margin-right: 6px;\n                }\n                .search-img-site-btn span {\n                    white-space: nowrap;\n                }\n            </style>\n        ";
    }
    open() {
        layer.open({
            type: 1,
            title: "以图识图",
            content: '\n            <div style="padding: 20px">\n                <div id="upload-area">\n                    <div style="color: #555;margin-bottom: 15px;">\n                        <p>拖拽图片到此处 或 点击按钮选择图片</p>\n                        <p>也可以直接 Ctrl+V 粘贴图片或 图片URL</p>\n                    </div>\n                    <button id="select-image-btn">选择图片</button>\n                    <input type="file" style="display: none" id="image-file" accept="image/*">\n                </div>\n                \n                <div id="url-input-container" style="margin-top: 15px;display: none;">\n                    <input type="text" id="image-url" placeholder="粘贴图片URL地址..." style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">\n                </div>\n                \n                <div id="preview-area" style="margin-bottom: 20px; text-align: center; display: none;">\n                    <img id="preview-image" alt="" src="" style="max-width: 100%; max-height: 300px; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">\n                    <div style="margin-top: 15px; display: flex; justify-content: center; gap: 10px;" id="action-btns">\n                        <button id="handle-btn">搜索图片</button>\n                        <button id="cancel-btn">取消</button>\n                    </div>\n                    \n                    <div id="search-results" style="display: none;">\n                        <p style="margin: 20px auto">请选择识图网站：<a id="openAll" style="cursor: pointer">全部打开</a></p>\n                        <div class="search-img-site-btns-container" id="search-img-site-btns-container"></div>\n                    </div>\n                </div>\n                \n            </div>\n        ',
            area: utils.isMobile() ? utils.getResponsiveArea() : [ "40%", "80%" ],
            success: async t => {
                this.initEventListeners();
            }
        });
    }
    initEventListeners() {
        const t = $("#upload-area"), e = $("#image-file"), n = $("#select-image-btn"), a = $("#preview-area"), i = $("#preview-image"), s = $("#action-btns"), o = $("#handle-btn"), r = $("#cancel-btn"), l = $("#url-input-container"), c = $("#image-url"), d = $("#search-results"), h = $("#search-img-site-btns-container");
        t.on("dragover", (e => {
            e.preventDefault(), t.addClass("highlight");
        })).on("dragleave", (() => {
            t.removeClass("highlight");
        })).on("drop", (e => {
            e.preventDefault(), t.removeClass("highlight"), e.originalEvent.dataTransfer.files && e.originalEvent.dataTransfer.files[0] && (this.handleImageFile(e.originalEvent.dataTransfer.files[0]), 
            this.resetSearchUI());
        })), n.on("click", (() => {
            e.trigger("click");
        })), e.on("change", (t => {
            t.target.files && t.target.files[0] && (this.handleImageFile(t.target.files[0]), 
            this.resetSearchUI());
        })), $(document).on("paste", (async t => {
            const e = t.originalEvent.clipboardData.items;
            for (let a = 0; a < e.length; a++) if (-1 !== e[a].type.indexOf("image")) {
                const t = e[a].getAsFile();
                return this.handleImageFile(t), void this.resetSearchUI();
            }
            const n = t.originalEvent.clipboardData.getData("text");
            n && utils.isUrl(n) && (l.show(), c.val(n), i.attr("src", n), a.show(), this.resetSearchUI());
        })), o.on("click", (async () => {
            const t = i.attr("src");
            if (t) {
                if (!this.isUploading) {
                    this.isUploading = !0;
                    try {
                        const e = await this.searchByImage(t);
                        s.hide(), d.show(), h.empty();
                        const n = "jhs_selectedSites", a = JSON.parse(localStorage.getItem(n) || "{}");
                        this.siteList.forEach((t => {
                            const n = t.url.replace("{占位符}", encodeURIComponent(e)), i = !1 !== a[t.name];
                            h.append(`\n                        <a href="${n}" class="search-img-site-btn" target="_blank" title="${t.name}">\n                        <input type="checkbox" \n                               class="site-checkbox" \n                               data-site-name="${t.name}" \n                               style="margin-right: 5px"\n                               ${i ? "checked" : ""}>\n                            <img src="${t.ico}" alt="${t.name}">\n                            <span>${t.name}</span>\n                        </a>\n                    `);
                        })), h.on("change", ".site-checkbox", (function() {
                            const t = $(this).data("site-name");
                            a[t] = $(this).is(":checked"), localStorage.setItem(n, JSON.stringify(a));
                        })), h.show();
                    } finally {
                        this.isUploading = !1;
                    }
                }
            } else show.info("请粘贴或上传图片");
        })), r.on("click", (() => {
            a.hide(), l.hide(), e.val(""), c.val("");
        })), c.on("change", (() => {
            utils.isUrl(c.val()) && (i.attr("src", c.val()), a.show());
        })), $("#openAll").on("click", (() => {
            $(".search-img-site-btn").each((function() {
                $(this).find(".site-checkbox").is(":checked") && window.open($(this).attr("href"));
            }));
        }));
    }
    resetSearchUI() {
        $("#action-btns").show(), $("#search-results").hide(), $("#search-img-site-btns-container").hide().empty();
    }
    handleImageFile(t) {
        const e = document.getElementById("preview-image"), n = document.getElementById("preview-area"), a = document.getElementById("url-input-container");
        if (!t.type.match("image.*")) return void show.info("请选择图片文件");
        const i = new FileReader;
        i.onload = t => {
            e.src = t.target.result, n.style.display = "block", a.style.display = "none", $("#handle-btn")[0].click();
        }, i.readAsDataURL(t);
    }
    async searchByImage(t) {
        let e = loading();
        try {
            let e = t;
            if (t.startsWith("data:")) {
                show.info("开始上传图片...");
                const n = await async function(t) {
                    var e;
                    const n = t.match(/^data:(.+);base64,(.+)$/);
                    if (!n || n.length < 3) throw new Error("无效的Base64图片数据");
                    const a = n[1], i = n[2], s = atob(i), o = new Array(s.length);
                    for (let g = 0; g < s.length; g++) o[g] = s.charCodeAt(g);
                    const r = new Uint8Array(o), l = new Blob([ r ], {
                        type: a
                    }), c = new FormData;
                    c.append("image", l);
                    const d = await fetch("https://api.imgur.com/3/image", {
                        method: "POST",
                        headers: {
                            Authorization: "Client-ID d70305e7c3ac5c6"
                        },
                        body: c
                    }), h = await d.json();
                    if (h.success && h.data && h.data.link) return h.data.link;
                    throw new Error((null == (e = h.data) ? void 0 : e.error) || "上传到Imgur失败");
                }(t);
                if (!n) return void show.error("上传到失败");
                e = n;
            }
            return e;
        } catch (n) {
            show.error(`搜索失败: ${n.message}`), console.error("搜索失败:", n);
        } finally {
            e.close();
        }
    }
}

class It extends U {
    getName() {
        return "BusNavBarPlugin";
    }
    handle() {
        $("#navbar > div > div > span").append('\n            <button class="btn btn-default" style="color: #0d9488" id="search-img-btn">识图</button>\n       '), 
        $("#search-img-btn").on("click", (() => {
            this.getBean("SearchByImagePlugin").open();
        }));
    }
}

class Dt extends U {
    constructor() {
        super(...arguments), r(this, "floorIndex", 1), r(this, "isInit", !1);
    }
    getName() {
        return "RelatedPlugin";
    }
    async showRelated(t) {
        const e = await storageManager.getSetting("enableLoadRelated", I), n = t || $("#magnets-content");
        let a = this.parseMovieId(window.location.href);
        n.append(`\n            <div style="display: flex; align-items: center; margin: 16px 0; color: #666; font-size: 14px;">\n                <span style="flex: 1; height: 1px; background: linear-gradient(to right, transparent, #999, transparent);"></span>\n                <span style="padding: 0 10px;">相关清单</span>\n                <a id="relatedFold" style="margin-left: 8px; color: #1890ff; text-decoration: none; display: flex; align-items: center;">\n                    <span class="toggle-text">${e === D ? "折叠" : "展开"}</span>\n                    <span class="toggle-icon" style="margin-left: 4px;">${e === D ? "▲" : "▼"}</span>\n                </a>\n                <span style="flex: 1; height: 1px; background: linear-gradient(to right, transparent, #999, transparent);"></span>\n            </div>\n        `), 
        $("#relatedFold").on("click", (t => {
            t.preventDefault(), t.stopPropagation();
            const e = $("#relatedFold .toggle-text"), n = $("#relatedFold .toggle-icon"), i = "展开" === e.text();
            e.text(i ? "折叠" : "展开"), n.text(i ? "▲" : "▼"), i ? ($("#relatedContainer").show(), 
            $("#relatedFooter").show(), this.isInit || (this.fetchAndDisplayRelateds(a), this.isInit = !0), 
            storageManager.saveSettingItem("enableLoadRelated", D)) : ($("#relatedContainer").hide(), 
            $("#relatedFooter").hide(), storageManager.saveSettingItem("enableLoadRelated", I));
        })), n.append('<div id="relatedContainer"></div>'), n.append('<div id="relatedFooter"></div>'), 
        e === D && await this.fetchAndDisplayRelateds(a);
    }
    async fetchAndDisplayRelateds(t) {
        const e = $("#relatedContainer"), n = $("#relatedFooter");
        e.append('<div id="relatedLoading" style="margin-top:15px;background-color:#ffffff;padding:10px;margin-left: -10px;">获取清单中...</div>');
        let a = null;
        try {
            a = await tt(t, 1, 20);
        } catch (i) {
            console.error("获取清单失败:", i);
        } finally {
            $("#relatedLoading").remove();
        }
        if (!a) return e.append('\n                <div style="margin-top:15px;background-color:#ffffff;padding:10px;margin-left: -10px;">\n                    获取清单失败\n                    <a id="retryFetchRelateds" href="javascript:;" style="margin-left: 10px; color: #1890ff; text-decoration: none;">重试</a>\n                </div>\n            '), 
        void $("#retryFetchRelateds").on("click", (async () => {
            $("#retryFetchRelateds").parent().remove(), await this.fetchAndDisplayRelateds(t);
        }));
        if (0 !== a.length) if (this.displayRelateds(a, e), 20 === a.length) {
            n.html('\n                <button id="loadMoreRelateds" style="width:100%; background-color: #e1f5fe; border:none; padding:10px; margin-top:10px; cursor:pointer; color:#0277bd; font-weight:bold; border-radius:4px;">\n                    加载更多清单\n                </button>\n                <div id="relatedEnd" style="display:none; text-align:center; padding:10px; color:#666; margin-top:10px;">已加载全部清单</div>\n            ');
            let a = 1, s = $("#loadMoreRelateds");
            s.on("click", (async () => {
                let n;
                s.text("加载中...").prop("disabled", !0), a++;
                try {
                    n = await tt(t, a, 20);
                } catch (i) {
                    console.error("加载更多清单失败:", i);
                } finally {
                    s.text("加载失败, 请点击重试").prop("disabled", !1);
                }
                n && (this.displayRelateds(n, e), n.length < 20 ? (s.remove(), $("#relatedEnd").show()) : s.text("加载更多清单").prop("disabled", !1));
            }));
        } else n.html('<div style="text-align:center; padding:10px; color:#666; margin-top:10px;">已加载全部清单</div>'); else e.append('<div style="margin-top:15px;background-color:#ffffff;padding:10px;margin-left: -10px;">无清单</div>');
    }
    displayRelateds(t, e) {
        t.length && t.forEach((t => {
            let n = `\n                <div class="item columns is-desktop" style="display:block;margin-top:6px;background-color:#ffffff;padding:10px;margin-left: -10px;word-break: break-word;position:relative;">\n                   <span style="position:absolute;top:5px;right:10px;color:#999;font-size:12px;">#${this.floorIndex++}</span>\n                   <span style="position:absolute;bottom:5px;right:10px;color:#999;font-size:12px;">创建时间: ${t.createTime}</span>\n                   <p><a href="/lists/${t.relatedId}" target="_blank" style="color:#2e8abb">${t.name}</a></p>\n                   <p style="margin-top: 5px;">视频个数: ${t.movieCount}</p>\n                   <p style="margin-top: 5px;">收藏次数: ${t.collectionCount} 被查看次数: ${t.viewCount}</p>\n                </div>\n            `;
            e.append(n);
        }));
    }
}

class Mt extends U {
    constructor() {
        super(...arguments), r(this, "type", null);
    }
    getName() {
        return "WantAndWatchedVideosPlugin";
    }
    async handle() {
        window.location.href.includes("/want_watch_videos") && ($("h3").append('<a class="a-primary" id="wantWatchBtn" style="padding:10px;">导入至 JHS</a>'), 
        $("#wantWatchBtn").on("click", (t => {
            this.type = u, this.importWantWatchVideos(t, "是否将 想看的影片 导入到 JHS-收藏?");
        }))), window.location.href.includes("/watched_videos") && ($("h3").append('<a class="a-success" id="wantWatchBtn" style="padding:10px;">导入至 JHS</a>'), 
        $("#wantWatchBtn").on("click", (t => {
            this.type = f, this.importWantWatchVideos(t, "是否将 看过的影片 导入到 JHS-已下载?");
        })));
    }
    importWantWatchVideos(t, e) {
        utils.q(null, `${e} <br/> <span style='color: #f40'>执行此功能前请记得备份数据</span>`, (async () => {
            let t = loading();
            try {
                await this.parseMovieList();
            } catch (e) {
                console.error(e);
            } finally {
                t.close();
            }
        }));
    }
    async parseMovieList(t) {
        let e, n;
        t ? (e = t.find(this.getSelector().itemSelector), n = t.find(".pagination-next").attr("href")) : (e = $(this.getSelector().itemSelector), 
        n = $(".pagination-next").attr("href"));
        for (const i of e) {
            const t = $(i), e = t.find("a").attr("href"), n = t.find(".video-title strong").text().trim();
            if (e && n) try {
                if (await storageManager.getCar(n)) {
                    show.info(`${n} 已存在, 跳过`);
                    continue;
                }
                await storageManager.saveCar(n, e, "", this.type);
            } catch (a) {
                console.error(`保存失败 [${n}]:`, a);
            }
        }
        n ? (show.info("发现下一页，正在解析:", n), await new Promise((t => setTimeout(t, 1e3))), 
        $.ajax({
            url: n,
            method: "GET",
            success: t => {
                const e = new DOMParser, n = $(e.parseFromString(t, "text/html"));
                this.parseMovieList(n);
            },
            error: function(t) {
                console.error(t), show.error("加载下一页失败:" + t.message);
            }
        })) : (show.ok("导入结束!"), window.refresh());
    }
}

class Tt extends U {
    constructor() {
        super(...arguments), r(this, "moreSvg", '<svg t="1749017229420" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9184" width="200" height="200"><path d="M512 74.666667C270.933333 74.666667 74.666667 270.933333 74.666667 512S270.933333 949.333333 512 949.333333 949.333333 753.066667 949.333333 512 753.066667 74.666667 512 74.666667z m0 810.666666c-204.8 0-373.333333-168.533333-373.333333-373.333333S307.2 138.666667 512 138.666667 885.333333 307.2 885.333333 512 716.8 885.333333 512 885.333333z" fill="#666666" p-id="9185"></path><path d="M512 512m-42.666667 0a42.666667 42.666667 0 1 0 85.333334 0 42.666667 42.666667 0 1 0-85.333334 0Z" fill="#666666" p-id="9186"></path><path d="M341.333333 512m-42.666666 0a42.666667 42.666667 0 1 0 85.333333 0 42.666667 42.666667 0 1 0-85.333333 0Z" fill="#666666" p-id="9187"></path><path d="M682.666667 512m-42.666667 0a42.666667 42.666667 0 1 0 85.333333 0 42.666667 42.666667 0 1 0-85.333333 0Z" fill="#666666" p-id="9188"></path></svg>'), 
        r(this, "titleSvg", '<svg t="1747553289744" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7507" width="200" height="200"><path d="M959.8 150.8c0-2.3-1.9-4.2-4.2-4.2H253.3c-2.3 0-4.2 1.9-4.2 4.2v115.9c0 2.3 1.9 4.2 4.2 4.2h702.3c2.3 0 4.2-1.9 4.2-4.2V150.8z" fill="" p-id="7508"></path><path d="M126.4 208.8m-62.2 0a62.2 62.2 0 1 0 124.4 0 62.2 62.2 0 1 0-124.4 0Z" fill="" p-id="7509"></path><path d="M851.5 453.7c0-2.1-1.8-3.9-3.9-3.9H252.9c-2.1 0-3.9 1.7-3.9 3.9v116.6c0 2.1 1.7 3.9 3.9 3.9h594.7c2.1 0 3.9-1.7 3.9-3.9V453.7z" fill="" p-id="7510"></path><path d="M126.4 512m-62.2 0a62.2 62.2 0 1 0 124.4 0 62.2 62.2 0 1 0-124.4 0Z" fill="" p-id="7511"></path><path d="M851.5 756.9c0-2.1-1.8-3.9-3.9-3.9H252.9c-2.1 0-3.9 1.8-3.9 3.9v116.6c0 2.1 1.7 3.9 3.9 3.9h594.7c2.1 0 3.9-1.7 3.9-3.9V756.9z" fill="" p-id="7512"></path><path d="M126.4 815.2m-62.2 0a62.2 62.2 0 1 0 124.4 0 62.2 62.2 0 1 0-124.4 0Z" fill="" p-id="7513"></path></svg>'), 
        r(this, "carNumSvg", '<svg t="1747552574854" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3539" width="200" height="200"><path d="M920.337035 447.804932c-6.067182-6.067182-10.918677-11.643178-16.985859-17.71036l48.536436-30.334889-42.469254-109.207238-121.340579 12.134365c-6.067182-6.067182-6.067182-12.134365-12.134365-18.201547-12.134365-12.134365-18.201547-24.267706-24.267706-30.334889-24.26873-36.402071-30.334889-42.469254-54.603619-42.469254H339.116511c-18.201547 0-24.267706 6.067182-54.603619 42.469254-6.067182 6.067182-12.134365 18.201547-24.267706 30.334889 0 0-6.067182 6.067182-12.134365 18.201547l-115.27442-12.134365-48.536436 109.207238 51.090608 24.378223c-6.067182 6.067182-30.334889 34.660404-30.334889 34.660405l-15.542998 22.280446-12.282744 17.018605c-6.067182 12.134365-5.064342 10.868535-5.064342 29.070082v224.480635c0 36.402071 18.201547 60.670801 54.603618 60.670801h115.273397c36.402071 0 54.603619-24.267706 54.603619-54.603619v-18.201547h424.693562v18.201547c0 30.334889 18.201547 54.603619 54.603618 54.603619h115.273397c36.402071 0 60.670801-24.267706 60.670801-60.670801V539.300786c0-42.469254 0.685615-46.662763-11.44875-64.863287-4.731768-6.744611-11.94403-16.196891-20.101827-26.632567z m-35.186383-78.381161l-30.334889 18.201547-12.134365-12.134365c-6.067182-8.899694-12.134365-12.134365-12.134365-18.201547l42.469254-6.067183 12.134365 18.201548z m-533.899776-97.072873h339.755054l78.871325 103.140055H272.378527l78.872349-103.140055zM175.305655 357.290429h36.402071c-6.067182 6.067182-6.067182 12.134365-12.134365 18.201547l-18.201547 6.067183-18.201547-12.134365 12.135388-12.134365z m667.375743 394.35765h-54.603619V678.843936H242.043638v72.804143H132.837424V527.167444c0-12.134365-0.041956-20.662599 1.216711-23.556508 1.258667-2.89391 9.955746-16.924461 21.193695-29.173437l35.722596-38.276768h639.576607l21.917172 20.938891c6.067182 6.067182 21.847587 21.366633 25.712615 28.732392 7.621585 9.996678 6.973832 10.999518 13.041014 23.133883v242.682182h-48.536436zM242.043638 533.234627h133.474944v60.670801H242.043638v-60.670801z m412.559197 0h133.474944v60.670801H654.602835v-60.670801z" p-id="3540"></path></svg>'), 
        r(this, "downSvg", '<svg t="1747552626242" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4551" width="200" height="200"><path d="M641.6 660l-8.64-64 32-4.32a211.2 211.2 0 0 0-26.72-420.32 215.36 215.36 0 0 0-213.12 192 94.56 94.56 0 0 0 0 11.52v41.28h-64V384v-7.04a153.12 153.12 0 0 1 0-19.52A279.84 279.84 0 0 1 636.16 108H640A275.2 275.2 0 0 1 673.28 656z" fill="#333333" p-id="4552"></path><path d="M490.4 446.24l-7.52-39.84a182.4 182.4 0 0 1 107.52-162.88l29.12-13.28L646.08 288l-29.12 13.28a117.92 117.92 0 0 0-70.08 101.28l6.24 30.4zM392.96 652.32h-78.72A202.24 202.24 0 0 1 256 256l30.72-9.12 18.24 61.28-30.72 9.12a138.24 138.24 0 0 0 39.68 270.72h78.72zM479.2 512h64v320h-64z" fill="#333333" p-id="4553"></path><path d="M510.4 908l-156.32-147.68 43.84-46.4 112.48 106.08 112.8-106.08 43.84 46.56-156.64 147.52z" fill="#333333" p-id="4554"></path></svg>'), 
        r(this, "handleSvg", '<svg t="1749106236917" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2628" width="200" height="200"><path d="M838 989.48a32 32 0 0 1-22.5-9.22L519.3 687.6 207.48 980.8a32 32 0 0 1-54-23.32V136.52A98.54 98.54 0 0 1 252 38.1h519.6A98.52 98.52 0 0 1 870 136.52v820.96a32 32 0 0 1-32 32zM252 102.1a34.46 34.46 0 0 0-34.42 34.42v746.96L498 619.84a32 32 0 0 1 44.42 0.56L806 880.88V136.52a34.46 34.46 0 0 0-34.4-34.42z" p-id="2629"></path><path d="M648 604.92a28 28 0 0 1-16.46-5.34l-112.84-82-112.84 82a28 28 0 0 1-43.08-31.32l43.1-132.64-112.84-82a28 28 0 0 1 16.46-50.66h139.48L492 170.34a28 28 0 0 1 53.26 0l43.1 132.64h139.48a28 28 0 0 1 16.46 50.66l-112.84 82 43.1 132.64A28 28 0 0 1 648 604.92z m-129.3-150a27.86 27.86 0 0 1 16.46 5.36l59.58 43.28-22.76-70a28 28 0 0 1 10.02-31.28l59.58-43.3H568a28 28 0 0 1-26.64-19.34l-22.76-70-22.76 70a28 28 0 0 1-26.62 19.34h-73.64l59.58 43.3a28 28 0 0 1 10.16 31.3l-22.76 70 59.58-43.28a28 28 0 0 1 16.46-5.32z" p-id="2630"></path></svg>'), 
        r(this, "siteSvg", '<svg t="1749107903569" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="12439" width="200" height="200"><path d="M882.758621 133.674884C882.758621 59.84828 822.91034 0 749.083736 0 675.25715 0 615.40887 59.84828 615.40887 133.674884 615.40887 163.358402 625.152318 191.656395 642.813352 214.773283L670.872117 193.336726 648.314739 166.170836 253.911693 493.666092 276.469054 520.831982 302.371681 496.834595C277.256669 469.725608 241.995388 453.990153 204.295574 453.990153 130.46897 453.990153 70.62069 513.838433 70.62069 587.66502 70.62069 661.491624 130.46897 721.339904 204.295574 721.339904 255.555319 721.339904 301.619094 692.208675 324.036714 647.136344L276.646223 663.002394 706.082022 877.440106 721.856794 845.849335 690.37312 829.861888C680.932829 848.452414 675.940882 869.068818 675.940882 890.325116 675.940882 964.15172 735.789162 1024 809.615766 1024 883.442353 1024 943.290633 964.15172 943.290633 890.325116 943.290633 874.050807 940.36533 858.125365 934.723584 843.16446L868.645076 868.0826C871.294817 875.109252 872.669943 882.595452 872.669943 890.325116 872.669943 925.14899 844.439623 953.37931 809.615766 953.37931 774.791892 953.37931 746.561571 925.14899 746.561571 890.325116 746.561571 880.245089 748.902894 870.575616 753.340487 861.836782L769.436089 830.140063 737.631567 814.258564 308.195769 599.820853 276.554929 584.02108 260.805279 615.686903C250.212352 636.984797 228.494795 650.719214 204.295574 650.719214 169.4717 650.719214 141.241379 622.488894 141.241379 587.66502 141.241379 552.841163 169.4717 524.610842 204.295574 524.610842 222.12269 524.610842 238.680594 531.99985 250.566444 544.829369L273.29589 569.363385 299.026432 547.997855 693.429478 220.502616 719.514606 198.84265 698.930882 171.900169C690.596687 160.991373 686.029559 147.727007 686.029559 133.674884 686.029559 98.85101 714.25988 70.62069 749.083736 70.62069 783.90761 70.62069 812.137931 98.85101 812.137931 133.674884 812.137931 148.208022 807.249885 161.899255 798.379608 172.996785L853.543883 217.089695C872.331935 193.584128 882.758621 164.379366 882.758621 133.674884ZM749.083736 196.729062C729.149334 196.729062 710.818745 187.460449 698.930882 171.900169L642.813352 214.773283C667.922573 247.639305 706.904064 267.349751 749.083736 267.349751 790.225902 267.349751 828.357809 248.599782 853.543883 217.089695L798.379608 172.996785C786.455411 187.915034 768.530291 196.729062 749.083736 196.729062ZM337.970441 587.66502C337.970441 553.551854 325.093782 521.360666 302.371681 496.834595L250.566444 544.829369C261.309069 556.424898 267.349751 571.526356 267.349751 587.66502 267.349751 597.565263 265.091478 607.069184 260.805279 615.686903L324.036714 647.136344C333.156105 628.801148 337.970441 608.540036 337.970441 587.66502ZM809.615766 756.650249C758.753986 756.650249 712.986006 785.330865 690.37312 829.861888L753.340487 861.836782C764.027215 840.791658 785.603302 827.270938 809.615766 827.270938 836.08553 827.270938 859.461862 843.730308 868.645076 868.0826L934.723584 843.16446C915.252259 791.529949 865.714547 756.650249 809.615766 756.650249Z" fill="#389BFF" p-id="12440"></path></svg>'), 
        r(this, "videoSvg", '<svg t="1749003664455" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1952" width="200" height="200"><path d="M825.6 153.6H198.4C124.5 153.6 64 214.1 64 288v448c0 73.9 60.5 134.4 134.4 134.4h627.2c73.9 0 134.4-60.5 134.4-134.4V288c0-73.9-60.5-134.4-134.4-134.4z m-138.2 44.8l112 112H706l-112-112h93.4z m-156.8 0l112 112H526.7l-112-112h115.9z m-179.2 0l112 112H347.5l-112-112h115.9zM108.8 288c0-41.4 28.4-76.1 66.7-86.3l108.7 108.7H108.8V288z m806.4 448c0 49.4-40.2 89.6-89.6 89.6H198.4c-49.4 0-89.6-40.2-89.6-89.6V355.2h806.4V736z m0-425.6h-52.5l-112-112h74.9c49.4 0 89.6 40.2 89.6 89.6v22.4z" p-id="1953"></path><path d="M454 687.2l149.3-77.6c27.5-13.8 27.5-53 0-66.8L468 472.2c-31.2-15.6-68 7.1-68 42v139.6c0 27.8 29.2 45.8 54 33.4zM444.8 512l134.4 67.2-134.4 67.2V512z" p-id="1954"></path></svg>'), 
        r(this, "screenSvg", '<svg t="1750691468062" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2693" width="200" height="200"><path d="M288 160a64 64 0 0 0-64 64v576a64 64 0 0 0 64 64h448a64 64 0 0 0 64-64v-576a64 64 0 0 0-64-64h-448m0-64h448a128 128 0 0 1 128 128v576a128 128 0 0 1-128 128h-448a128 128 0 0 1-128-128v-576a128 128 0 0 1 128-128z" fill="#4078FD" p-id="2694"></path><path d="M416 352m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z" fill="#FE9C23" p-id="2695"></path><path d="M352 732.448a32 32 0 0 1-32-32v-160a32 32 0 0 1 44.224-29.568l130.112 53.632 153.952-169.984a32 32 0 0 1 55.712 21.472v284.448a32 32 0 0 1-32 32z m0-32h320z" fill="#4078FD" opacity=".2" p-id="2696"></path><path d="M672 416l-169.088 186.656-150.912-62.208v160h320V416m0-32a32 32 0 0 1 32 32v284.448a32 32 0 0 1-32 32h-320a32 32 0 0 1-32-32v-160a32 32 0 0 1 44.192-29.6l130.112 53.632 153.984-169.984a32 32 0 0 1 23.712-10.496z" fill="#4078FD" p-id="2697"></path></svg>'), 
        r(this, "recoveryVideoSvg", '<svg t="1749003779161" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8204" width="200" height="200"><path d="M938.666667 553.92V768c0 64.8-52.533333 117.333333-117.333334 117.333333H202.666667c-64.8 0-117.333333-52.533333-117.333334-117.333333V256c0-64.8 52.533333-117.333333 117.333334-117.333333h618.666666c64.8 0 117.333333 52.533333 117.333334 117.333333v297.92z m-64-74.624V256a53.333333 53.333333 0 0 0-53.333334-53.333333H202.666667a53.333333 53.333333 0 0 0-53.333334 53.333333v344.48A290.090667 290.090667 0 0 1 192 597.333333a286.88 286.88 0 0 1 183.296 65.845334C427.029333 528.384 556.906667 437.333333 704 437.333333c65.706667 0 126.997333 16.778667 170.666667 41.962667z m0 82.24c-5.333333-8.32-21.130667-21.653333-43.648-32.917333C796.768 511.488 753.045333 501.333333 704 501.333333c-121.770667 0-229.130667 76.266667-270.432 188.693334-2.730667 7.445333-7.402667 20.32-13.994667 38.581333-7.68 21.301333-34.453333 28.106667-51.370666 13.056-16.437333-14.634667-28.554667-25.066667-36.138667-31.146667A222.890667 222.890667 0 0 0 192 661.333333c-14.464 0-28.725333 1.365333-42.666667 4.053334V768a53.333333 53.333333 0 0 0 53.333334 53.333333h618.666666a53.333333 53.333333 0 0 0 53.333334-53.333333V561.525333zM320 480a96 96 0 1 1 0-192 96 96 0 0 1 0 192z m0-64a32 32 0 1 0 0-64 32 32 0 0 0 0 64z" fill="#000000" p-id="8205"></path></svg>');
    }
    getName() {
        return "CopyTitleOrDownImgPlugin";
    }
    async initCss() {
        return `\n            <style>\n                .box .tags {\n                    justify-content: space-between;\n                }\n                .tool-box span{\n                    opacity:.3\n                }\n                .tool-box span:hover{\n                    opacity:1\n                }\n                ${g ? ".tool-box .icon{ height: 24px; width: 24px; }" : ""}\n                .tool-box svg path {\n                  fill: blue;\n                }\n                [data-theme="dark"] .tool-box svg path {\n                  fill: white;\n                }\n                \n                \n                /* 鼠标移入时的弹性动画 */\n                .elastic-in {\n                    animation: elasticIn 0.2s ease-out forwards;  /* 动画名称 | 时长 | 缓动函数 | 保持最终状态 */\n                }\n                \n                /* 鼠标移出时的弹性动画 */\n                .elastic-out {\n                    animation: elasticOut 0.2s ease-in forwards;\n                }\n                /* 弹性进入动画（像果冻弹入） */\n                @keyframes elasticIn {\n                    0% {\n                        opacity: 0;\n                        transform: scale(0.8);  /* 起始状态：80% 大小 */\n                    }\n                    50% {\n                        opacity: 1;\n                        transform: scale(1.1);  /* 弹到 110%（超调一点） */\n                    }\n                    70% {\n                        transform: scale(0.95); /* 回弹到 95%（模拟弹性阻尼） */\n                    }\n                    100% {\n                        opacity: 1;\n                        transform: scale(1);    /* 最终恢复正常大小 */\n                    }\n                }\n                /* 弹性离开动画（像果冻弹出） */\n                @keyframes elasticOut {\n                    0% {\n                        opacity: 1;\n                        transform: scale(1);    /* 起始状态：正常大小 */\n                    }\n                    30% {\n                        transform: scale(1.05); /* 先弹大一点（105%） */\n                    }\n                    100% {\n                        opacity: 0;\n                        transform: scale(0.8);  /* 最终缩小并消失 */\n                    }\n                }\n                \n                \n                .loading {\n                    opacity: 0.7;\n                    filter: blur(1px);\n                }\n                .loading-spinner {\n                    position: absolute;\n                    top: 50%;\n                    left: 50%;\n                    transform: translate(-50%, -50%);\n                    width: 40px;\n                    height: 40px;\n                    border: 3px solid rgba(255,255,255,.3);\n                    border-radius: 50%;\n                    border-top-color: #fff;\n                    animation: spin 1s ease-in-out infinite;\n                    z-index: 20;\n                }\n                @keyframes spin {\n                    to { transform: translate(-50%, -50%) rotate(360deg); }\n                }\n            </style>\n        `;
    }
    handle() {
        window.isListPage && (this.addSvgBtn(), this.bindClick().then());
    }
    addSvgBtn() {
        $(this.getSelector().itemSelector).toArray().forEach((t => {
            let e = $(t);
            if (!(e.find(".tool-box").length > 0) && (h && e.find(".tags").append(`\n                    <div class="tool-box" style="margin-left: auto; display: flex; align-items: center">\n                        <span class="screenSvg" title="长缩略图" style="margin-right: 15px;">${this.screenSvg}</span>\n                        \n                        <span class="videoSvg" title="播放视频" style="margin-right: 15px;">${this.videoSvg}</span>\n                        \n                        <div class="more-tools-container" style="position: relative; margin-right: 15px;">\n                            <div title="鉴定处理" style="padding: 5px; margin: -5px;opacity:.3">${this.handleSvg}</div>\n                            \n                            <div class="more-tools" style=" position: absolute; bottom: 33px; right: -30px; display: none;\n                                background-color: rgba(255, 255, 255, 0);z-index: 10;">\n                                <a class="menu-btn hasWatchBtn" style="background-color:${B};color:white !important;margin-bottom: 5px"><span style="opacity: 1;">${P}</span></a>\n                                <a class="menu-btn hasDownBtn" style="background-color:${_}; color:white !important;margin-bottom: 5px"><span style="opacity: 1;">${C}</span></a>\n                                <a class="menu-btn favoriteBtn" style="background-color:${S}; color:white !important;margin-bottom: 5px"><span style="opacity: 1;">${x}</span></a>\n                                <a class="menu-btn filterBtn" style="background-color:${y};   color:white !important;margin-bottom: 5px"><span style="opacity: 1;">${w}</span></a>\n                            </div>\n                        </div>\n                        \n                        <div class="more-tools-container" style="position: relative; margin-right: 15px;">\n                            <div title="第三方网站" style="padding: 5px; margin: -5px;opacity:.3">${this.siteSvg}</div>\n                            \n                             <div class="more-tools" style=" position: absolute; bottom: 33px; right: -30px; display: none;\n                                background-color: rgba(255, 255, 255, 0);z-index: 10;">\n                                <a class="site-btn site-jable" style="color:white !important;margin-bottom: 5px;background-color:#71bb59;">\n                                    <span style="opacity: 1;">Jable</span>\n                                </a>\n                                <a class="site-btn site-avgle" style="margin-bottom: 5px;background-color:#71bb59;">\n                                    <span style="opacity: 1;">Avgle</span>\n                                </a>\n                                <a class="site-btn site-miss-av" style="color:white !important;margin-bottom: 5px;background-color:#71bb59;">\n                                    <span style="opacity: 1;">MissAv</span>\n                                </a>\n                                <a class="site-btn site-123-av" style="color:white !important;margin-bottom: 5px;background-color:#71bb59;">\n                                    <span style="opacity: 1;">123Av</span>\n                                </a>\n                            </div>\n                        </div>\n                        \n                        <div class="more-tools-container" style="position: relative; margin-right: 15px;">\n                            <div title="复制按钮" style="padding: 5px; margin: -5px;opacity:.3">${this.moreSvg}</div>\n                            \n                            <div class="more-tools" style="\n                                position: absolute;\n                                bottom: 20px;\n                                right: -10px;\n                                display: none;\n                                background: white;\n                                box-shadow: 0 2px 8px rgba(0,0,0,0.15);\n                                border-radius: 20px;\n                                padding: 10px 0;\n                                margin-bottom: 15px;\n                                z-index: 10;\n                            ">\n                                <span class="carNumSvg" title="复制番号" style="padding: 5px 10px; white-space: nowrap;">${this.carNumSvg}</span>\n                                <span class="titleSvg" title="复制标题" style="padding: 5px 10px; white-space: nowrap;">${this.titleSvg}</span>\n                                <span class="downSvg" title="下载封面" style="padding: 5px 10px; white-space: nowrap;">${this.downSvg}</span>\n                            </div>\n                        </div>\n                    </div>\n                `), 
            g)) {
                if (e.find(".avatar-box").length > 0) return;
                e.find(".photo-info").append(`\n                    <div class="tool-box" style="display: flex; align-items: center;justify-content: flex-end">\n                        <span class="screenSvg" title="长缩略图" style="margin-right: 15px;">${this.screenSvg}</span>\n\n                        <span class="videoSvg" title="播放视频" style="margin-right: 15px;">${this.videoSvg}</span>\n                        \n                        <div class="more-tools-container" style="position: relative; margin-right: 15px;">\n                            <div title="鉴定处理" style="padding: 5px; margin: -5px;opacity:.3">${this.handleSvg}</div>\n                            \n                            <div class="more-tools" style=" position: absolute; bottom: 33px; right: -30px; display: none;\n                                background-color: rgba(255, 255, 255, 0);z-index: 10;">\n                                <a class="menu-btn hasWatchBtn" style="background-color:${B};color:white;margin-bottom: 5px"><span style="opacity: 1;display: inline; color:white !important">${P}</span></a>\n                                <a class="menu-btn hasDownBtn" style="background-color:${_}; color:white;margin-bottom: 5px"><span style="opacity: 1;display: inline; color:white !important">${C}</span></a>\n                                <a class="menu-btn favoriteBtn" style="background-color:${S}; color:white;margin-bottom: 5px"><span style="opacity: 1;display: inline; color:white !important">${x}</span></a>\n                                <a class="menu-btn filterBtn" style="background-color:${y};   color:white;margin-bottom: 5px"><span style="opacity: 1;display: inline; color:white !important">${w}</span></a>\n                            </div>\n                        </div>\n                        \n                        <div class="more-tools-container" style="position: relative; margin-right: 15px;">\n                            <div title="第三方网站" style="padding: 5px; margin: -5px;opacity:.3">${this.siteSvg}</div>\n                            \n                             <div class="more-tools" style=" position: absolute; bottom: 33px; right: -30px; display: none;\n                                background-color: rgba(255, 255, 255, 0);z-index: 10;">\n                                <a class="site-btn site-jable" style="color:white;margin-bottom: 5px;background-color:#71bb59;">\n                                    <span style="opacity: 1;display: inline; color:white !important">Jable</span>\n                                </a>\n                                <a class="site-btn site-avgle" style="margin-bottom: 5px;background-color:#71bb59;">\n                                    <span style="opacity: 1;display: inline; color:white !important">Avgle</span>\n                                </a>\n                                <a class="site-btn site-miss-av" style="color:white;margin-bottom: 5px;background-color:#71bb59;">\n                                    <span style="opacity: 1;display: inline; color:white !important">MissAv</span>\n                                </a>\n                                <a class="site-btn site-123-av" style="color:white;margin-bottom: 5px;background-color:#71bb59;">\n                                    <span style="opacity: 1;display: inline; color:white !important">123Av</span>\n                                </a>\n                            </div>\n                        </div>\n                      \n                        <div class="more-tools-container" style="position: relative;">\n                            <div title="复制按钮" style="padding: 5px; margin: -5px;opacity:.3">${this.moreSvg}</div>\n                            \n                            <div class="more-tools" style="\n                                max-width: 44px;\n                                position: absolute;\n                                bottom: 20px;\n                                right: -10px;\n                                display: none;\n                                background: white;\n                                box-shadow: 0 2px 8px rgba(0,0,0,0.15);\n                                border-radius: 20px;\n                                padding: 10px 0;\n                                margin-bottom: 15px;\n                                z-index: 10;\n                                text-align: center;\n                            ">\n                                <span class="carNumSvg" title="复制番号" style="padding: 5px 10px; white-space: nowrap;display: inline">${this.carNumSvg}</span>\n                                <span class="titleSvg" title="复制标题"  style="padding: 5px 10px; white-space: nowrap;display: inline">${this.titleSvg}</span>\n                                <span class="downSvg" title="下载封面"   style="padding: 5px 10px; white-space: nowrap;display: inline">${this.downSvg}</span>\n                            </div>\n                        </div>\n                    </div>\n                `);
            }
        }));
    }
    async bindClick() {
        const t = this.getSelector(), e = this.getBean("ListPagePlugin");
        $(document).on("click", ".more-tools-container", (t => {
            t.preventDefault();
            var e = $(t.target).closest(".more-tools-container").find(".more-tools");
            $(".more-tools").not(e).stop(!0, !0).removeClass("elastic-in").addClass("elastic-out").hide(), 
            e.is(":visible") ? e.stop(!0, !0).removeClass("elastic-in").addClass("elastic-out").hide() : e.stop(!0, !0).removeClass("elastic-out").addClass("elastic-in").show();
        })), $(document).on("click", (function(t) {
            $(t.target).closest(".more-tools-container").length || $(".more-tools").stop(!0, !0).removeClass("elastic-in").addClass("elastic-out").hide();
        })), $(document).on("click", ".videoSvg", (n => {
            n.preventDefault(), $('.videoSvg[title!="播放视频"]').each(((n, a) => {
                const i = $(a);
                let s = i.closest(".item"), o = s.find(t.coverImgSelector), {carNum: r} = e.findCarNumAndHref(s);
                this.showImg(i, o, r), i.html(this.videoSvg).attr("title", "播放视频");
            }));
            const a = $(n.target).closest(".item"), i = a.find(".videoSvg");
            if ("播放视频" === i.attr("title")) {
                i.html(this.recoveryVideoSvg).attr("title", "切回封面");
                const {carNum: n} = e.findCarNumAndHref(a);
                let s = a.find(t.coverImgSelector);
                s.length || show.error("没有找到图片"), this.showVideo(i, s, n).then();
            }
        })), $(document).on("click", ".screenSvg", (async t => {
            t.preventDefault();
            let n = loading();
            try {
                const a = $(t.currentTarget).closest(".item");
                let {carNum: i, aHref: s, title: o} = e.findCarNumAndHref(a);
                i = i.replace("FC2-", "");
                const r = await this.getBean("ScreenShotPlugin").getScreenshot(i);
                n.close(), showImageViewer(r);
            } catch (a) {
                console.error("图片预览出错:", a), show.error("图片预览出错:" + a);
            } finally {
                n.close();
            }
        })), $(document).on("click", ".filterBtn, .favoriteBtn, .hasDownBtn, .hasWatchBtn", (t => {
            t.preventDefault(), t.stopPropagation();
            const n = $(t.target).closest(".menu-btn"), a = n.closest(".item"), {carNum: i, aHref: s, title: o} = e.findCarNumAndHref(a), r = async t => {
                await storageManager.saveCar(i, s, null, t), window.refresh();
            };
            n.hasClass("filterBtn") ? utils.q(t, `是否屏蔽${i}?`, (() => r(m))) : n.hasClass("favoriteBtn") ? r(u).then() : n.hasClass("hasDownBtn") ? r(f).then() : n.hasClass("hasWatchBtn") && r(v).then();
        }));
        const n = this.getBean("OtherSitePlugin"), a = await n.getMissAvUrl(), i = await n.getjableUrl(), s = await n.getAvgleUrl(), o = await n.getAv123Url();
        $(document).on("click", ".site-jable, .site-avgle, .site-miss-av, .site-123-av", (t => {
            t.preventDefault(), t.stopPropagation();
            const n = $(t.currentTarget), r = n.closest(".item"), {carNum: l, aHref: c, title: d} = e.findCarNumAndHref(r);
            let h = null;
            n.hasClass("site-jable") ? h = `${i}/search/${l}/` : n.hasClass("site-avgle") ? h = `${s}/vod/search.html?wd=${l}` : n.hasClass("site-miss-av") ? h = `${a}/search/${l}` : n.hasClass("site-123-av") && (h = `${o}/ja/search?keyword=${l}`), 
            t && (t.ctrlKey || t.metaKey) ? GM_openInTab(h, {
                insert: 0
            }) : window.open(h);
        })), $(document).on("click", ".titleSvg, .carNumSvg, .downSvg", (t => {
            t.preventDefault(), t.stopPropagation();
            const n = $(t.currentTarget).closest(".item"), {carNum: a, aHref: i, title: s} = e.findCarNumAndHref(n), o = n.find(g ? ".photo-frame img" : ".cover img");
            $(t.currentTarget).hasClass("titleSvg") ? utils.copyToClipboard("标题", s) : $(t.currentTarget).hasClass("carNumSvg") ? utils.copyToClipboard("番号", a) : $(t.currentTarget).hasClass("downSvg") && fetch(o.attr("src")).then((t => t.blob())).then((t => {
                utils.download(t, s + ".jpg");
            }));
        }));
    }
    showImg(t, e, n) {
        t.html(this.videoSvg).attr("title", "播放视频");
        let a = $(`#${`${n}_preview_video`}`);
        a.length > 0 && (a[0].pause(), a.parent().hide()), e.show(), e.removeClass("loading"), 
        e.next(".loading-spinner").remove();
    }
    async showVideo(t, e, n) {
        const a = `${n}_preview_video`;
        let i = $(`#${a}`);
        if (i.length > 0) return i.parent().show(), i[0].play(), void e.hide();
        e.addClass("loading"), e.after('<div class="loading-spinner"></div>');
        const s = e.attr("src"), o = await K(n);
        if (!o) return void this.showImg(t, e, n);
        let r = await storageManager.getSetting("videoQuality");
        if (!o[r]) {
            const t = Object.keys(o);
            r = t[t.length - 1];
        }
        let l = o[r], c = `\n            <div style="display: flex; justify-content: center; align-items: center; position: absolute; top:0; left:0; height: 100%; width: 100%; z-index: 10; overflow: hidden">\n                <video \n                    src="${l}" \n                    poster="${s}" \n                    id="${a}" \n                    controls \n                    loop \n                    muted \n                    playsinline\n                    style="max-height: 100%; max-width: 100%; object-fit: contain"\n                ></video>\n            </div>\n        `;
        g && (c = `\n                <div>\n                    <video \n                        src="${l}" \n                        poster="${s}" \n                        id="${a}" \n                        controls \n                        loop \n                        muted \n                        playsinline\n                        style="max-height: 100%; max-width: 100%; object-fit: contain"\n                    ></video>\n                </div>\n            `), 
        e.parent().append(c), e.hide(), e.removeClass("loading"), e.next(".loading-spinner").remove(), 
        i = $(`#${a}`);
        let d = i[0];
        d.load(), d.muted = !1, d.play(), i.trigger("focus");
    }
}

class At extends U {
    constructor() {
        super(...arguments), r(this, "$contentBox", $(".section .container")), r(this, "urlParams", new URLSearchParams(window.location.search)), 
        r(this, "sortVal", this.urlParams.get("sort") || "release_date"), r(this, "currentPage", this.urlParams.get("page") ? parseInt(this.urlParams.get("page")) : 1), 
        r(this, "maxPage", null), r(this, "keyword", this.urlParams.get("keyword") || null);
    }
    getName() {
        return "Fc2By123AvPlugin";
    }
    async getBaseUrl() {
        const t = this.getBean("OtherSitePlugin");
        return await t.getAv123Url() + "/ja";
    }
    handle() {
        $("#navbar-menu-hero > div > div:nth-child(1) > div > a:nth-child(4)").after('<a class="navbar-item" href="/advanced_search?type=100&released_start=2099-09">123Av-Fc2</a>'), 
        $('.tabs li:contains("FC2")').after('<li><a href="/advanced_search?type=100&released_start=2099-09"><span>123Av-Fc2</span></a></li>'), 
        d.includes("/advanced_search?type=100") && (this.hookPage(), this.handleQuery().then());
    }
    hookPage() {
        let t = $("h2.section-title");
        t.contents().first().replaceWith("123Av"), t.css("marginBottom", "0"), t.append('\n            <div style="margin-left: 100px; width: 400px;">\n                <input id="search-123av-keyword" type="text" placeholder="搜索123Av Fc2ppv内容" style="padding: 4px 5px;margin-right: 0">\n                <a id="search-123av-btn" class="a-primary" style="margin-left: 0">搜索</a>\n                <a id="clear-123av-btn" class="a-dark" style="margin-left: 0">重置</a>\n            </div>\n        '), 
        $("#search-123av-keyword").val(this.keyword), $("#search-123av-btn").on("click", (async () => {
            let t = $("#search-123av-keyword").val().trim();
            t && (this.keyword = t, utils.setHrefParam("keyword", t), await this.handleQuery());
        })), $("#clear-123av-btn").on("click", (async () => {
            $("#search-123av-keyword").val(""), this.keyword = "", utils.setHrefParam("keyword", ""), 
            $(".page-box").show(), $(".tool-box").show(), await this.handleQuery();
        })), $(".empty-message").remove(), $("#foldCategoryBtn").remove(), $(".section .container .box").remove(), 
        $("#sort-toggle-btn").remove(), this.$contentBox.append('<div class="tool-box" style="margin-top: 10px"></div>'), 
        this.$contentBox.append('<div class="movie-list h cols-4 vcols-8" style="margin-top: 10px"></div>'), 
        this.$contentBox.append('<div class="page-box"></div>');
        $(".tool-box").append('\n            <div class="button-group">\n                <div class="buttons has-addons" id="conditionBox">\n                    <a style="padding:18px 18px !important;" class="button is-small" data-sort="release_date">发布日期</a>\n                    <a style="padding:18px 18px !important;" class="button is-small" data-sort="recent_update">最近更新</a>\n                    <a style="padding:18px 18px !important;" class="button is-small" data-sort="trending">热门</a>\n                    <a style="padding:18px 18px !important;" class="button is-small" data-sort="most_viewed_today">今天最多观看</a>\n                    <a style="padding:18px 18px !important;" class="button is-small" data-sort="most_viewed_week">本周最多观看</a>\n                    <a style="padding:18px 18px !important;" class="button is-small" data-sort="most_viewed_month">本月最多观看</a>\n                    <a style="padding:18px 18px !important;" class="button is-small" data-sort="most_viewed">最多观看</a>\n                    <a style="padding:18px 18px !important;" class="button is-small" data-sort="most_favourited">最受欢迎</a>\n                </div>\n            </div>\n        '), 
        $(`#conditionBox a[data-sort="${this.sortVal}"]`).addClass("is-info"), utils.setHrefParam("sort", this.sortVal), 
        utils.setHrefParam("page", this.currentPage), $("#conditionBox").on("click", "a.button", (t => {
            let e = $(t.target);
            this.sortVal = e.data("sort"), utils.setHrefParam("sort", this.sortVal), e.siblings().removeClass("is-info"), 
            e.addClass("is-info"), this.handleQuery();
        }));
        $(".page-box").append('\n            <nav class="pagination">\n                <a class="pagination-previous">上一页</a>\n                <ul class="pagination-list"></ul>\n                <a class="pagination-next">下一页</a>\n            </nav>\n        '), 
        $(document).on("click", ".pagination-link", (t => {
            t.preventDefault(), this.currentPage = parseInt($(t.target).data("page")), utils.setHrefParam("page", this.currentPage), 
            this.renderPagination(), this.handleQuery();
        })), $(".pagination-previous").on("click", (t => {
            t.preventDefault(), this.currentPage > 1 && (this.currentPage--, utils.setHrefParam("page", this.currentPage), 
            this.renderPagination(), this.handleQuery());
        })), $(".pagination-next").on("click", (t => {
            t.preventDefault(), this.currentPage < this.maxPage && (this.currentPage++, utils.setHrefParam("page", this.currentPage), 
            this.renderPagination(), this.handleQuery());
        }));
    }
    renderPagination() {
        const t = $(".pagination-list");
        t.empty();
        let e = Math.max(1, this.currentPage - 2), n = Math.min(this.maxPage, this.currentPage + 2);
        this.currentPage <= 3 ? n = Math.min(6, this.maxPage) : this.currentPage >= this.maxPage - 2 && (e = Math.max(this.maxPage - 5, 1)), 
        e > 1 && (t.append('<li><a class="pagination-link" data-page="1">1</a></li>'), e > 2 && t.append('<li><span class="pagination-ellipsis">…</span></li>'));
        for (let a = e; a <= n; a++) {
            const e = a === this.currentPage ? " is-current" : "";
            t.append(`<li><a class="pagination-link${e}" data-page="${a}">${a}</a></li>`);
        }
        n < this.maxPage && (n < this.maxPage - 1 && t.append('<li><span class="pagination-ellipsis">…</span></li>'), 
        t.append(`<li><a class="pagination-link" data-page="${this.maxPage}">${this.maxPage}</a></li>`));
    }
    async handleQuery() {
        let t = loading();
        try {
            let t = [];
            t = 1 === this.currentPage ? [ 1, 2 ] : [ 2 * this.currentPage - 1, 2 * this.currentPage ], 
            this.keyword && (t = [ 1 ], $(".page-box").hide(), $(".tool-box").hide());
            const e = await this.getBaseUrl(), n = t.map((t => {
                let n = `${e}/tags/fc2?sort=${this.sortVal}&page=${t}`;
                return this.keyword && (n = `${e}/search?keyword=${this.keyword}`), gmHttp.get(n);
            })), a = await Promise.all(n);
            let i = [];
            for (const o of a) {
                let t = $(o);
                if (t.find(".box-item").each(((t, n) => {
                    const a = $(n), s = a.find("img").attr("data-src");
                    let o = a.find("img").attr("title");
                    const r = a.find(".detail a"), l = r.attr("href"), c = e + (l.startsWith("/") ? l : "/" + l), d = r.text().trim().replace(o + " - ", "");
                    o = o.replace("FC2-PPV", "FC2"), i.push({
                        imgSrc: s,
                        carNum: o,
                        href: c,
                        title: d
                    });
                })), !this.maxPage) {
                    let e, n = t.find(".page-item:not(.disabled)").last();
                    if (n.find("a.page-link").length) {
                        let t = n.find("a.page-link").attr("href");
                        e = parseInt(t.split("page=")[1]);
                    } else e = parseInt(n.find("span.page-link").text());
                    this.maxPage = Math.ceil(e / 2), this.renderPagination();
                }
            }
            if (0 === i.length) {
                console.log(i), show.error("无结果");
                let t = `${e}/dm4/tags/fc2?sort=${this.sortVal}`;
                this.keyword && (t = `${e}/search?keyword=${this.keyword}`), console.error("获取数据失败!", t);
            }
            let s = this.markDataListHtml(i);
            $(".movie-list").html(s), await utils.smoothScrollToTop();
        } catch (e) {
            console.error(e);
        } finally {
            t.close();
        }
    }
    open123AvFc2Dialog(t, e) {
        let n = `\n            <div class="movie-detail-container">\n               \x3c!-- <div class="movie-poster-container">\n                    <iframe class="movie-trailer" frameborder="0" allowfullscreen scrolling="no"></iframe>\n                </div>\n                <div class="right-box">--\x3e\n                    <div class="movie-info-container">\n                        <div class="search-loading">加载中...</div>\n                    </div>\n                    \n                    <div class="movie-panel-info fc2-movie-panel-info" style="margin-top:20px"><strong>第三方资源: </strong></div>\n                    \n                    <div style="margin: 10px 0">\n                        <a id="filterBtn" class="menu-btn" style="background-color:${y}"><span>${w}</span></a>\n                        <a id="favoriteBtn" class="menu-btn" style="background-color:${S}"><span>${x}</span></a>\n                        <a id="hasDownBtn" class="menu-btn" style="background-color:${_}"><span>${C}</span></a>\n                        <a id="hasWatchBtn" class="menu-btn" style="background-color:${B};"><span>${P}</span></a>\n                        \n                        <a id="search-subtitle-btn" class="menu-btn fr-btn" style="background:linear-gradient(to bottom, #8d5656, rgb(196,159,91))">\n                            <span>字幕 (SubTitleCat)</span>\n                        </a>\n                        <a id="xunLeiSubtitleBtn" class="menu-btn fr-btn" style="background:linear-gradient(to left, #375f7c, #2196F3)">\n                            <span>字幕 (迅雷)</span>\n                        </a>\n                    </div>\n                    <div class="message video-panel" style="margin-top:20px">\n                        <div id="magnets-content" class="magnet-links">\n                        </div>\n                    </div>\n                    <div id="reviews-content">\n                    </div>\n                    <div id="related-content">\n                    </div>\n                    <span id="data-actress" style="display: none"></span>\n               \x3c!-- </div>--\x3e\n            </div>\n        `;
        layer.open({
            type: 1,
            title: t,
            content: n,
            area: utils.getDefaultArea(),
            skin: "movie-detail-layer",
            scrollbar: !1,
            success: (n, a) => {
                utils.setupEscClose(a), this.loadData(t, e);
                let i = t.replace("FC2-", "");
                $("#magnets-content").append(this.getBean("MagnetHubPlugin").createMagnetHub(i)), 
                $("#favoriteBtn").on("click", (async n => {
                    const a = $("#data-actress").text();
                    await storageManager.saveCar(t, e, a, u), window.refresh(), layer.closeAll();
                })), $("#filterBtn").on("click", (n => {
                    utils.q(n, `是否屏蔽${t}?`, (async () => {
                        const n = $("#data-actress").text();
                        await storageManager.saveCar(t, e, n, m), window.refresh(), layer.closeAll(), window.location.href.includes("collection_codes?movieId") && utils.closePage();
                    }));
                })), $("#hasDownBtn").on("click", (async n => {
                    const a = $("#data-actress").text();
                    await storageManager.saveCar(t, e, a, f), window.refresh(), layer.closeAll();
                })), $("#hasWatchBtn").on("click", (async n => {
                    const a = $("#data-actress").text();
                    await storageManager.saveCar(t, e, a, v), window.refresh(), layer.closeAll();
                })), $("#search-subtitle-btn").on("click", (e => utils.openPage(`https://subtitlecat.com/index.php?search=${t}`, t, !1, e))), 
                $("#xunLeiSubtitleBtn").on("click", (() => this.getBean("DetailPageButtonPlugin").searchXunLeiSubtitle(t)));
                let s = t.replace("FC2-", "");
                this.getBean("OtherSitePlugin").loadOtherSite(s).then();
            }
        });
    }
    async loadData(t, e) {
        let n = loading();
        try {
            const {id: n, publishDate: a, title: i, moviePoster: s} = await this.get123AvVideoInfo(e);
            $(".movie-info-container").html(`\n                    <h3 class="movie-title" style="margin-bottom: 10px"><strong class="current-title">${i || "无标题"}</strong></h3>\n                    <div class="movie-meta" style="margin-bottom: 10px">\n                        <span><strong>番号: </strong>${t || "未知"}</span>\n                        <span><strong>年份: </strong>${a || "未知"}</span>\n                        <span>\n                            <strong>站点: </strong>\n                            <a href="https://fc2ppvdb.com/articles/${t.replace("FC2-", "")}" target="_blank">fc2ppvdb</a>\n                            <a style="margin-left: 5px;" href="https://adult.contents.fc2.com/article/${t.replace("FC2-", "")}/" target="_blank">fc2电子市场</a>\n                        </span>\n                    </div>\n                    <div class="movie-actors" style="margin-bottom: 10px">\n                        <div class="actor-list"><strong>主演: </strong></div>\n                    </div>\n                    <div class="movie-seller" style="margin-bottom: 10px">\n                        <span><strong>販売者: </strong></span>\n                    </div>\n                    <div class="movie-gallery" style="margin-bottom: 10px">\n                        <strong>剧照: </strong>\n                        <div class="image-list"></div>\n                    </div>\n                `), 
            this.getImgList(t).then(), this.getActressInfo(t).then(), this.getBean("DetailPagePlugin").translate().then();
        } catch (a) {
            console.error(a);
        } finally {
            n.close();
        }
    }
    handleLongImg(t) {
        console.log($(".movie-gallery .image-list")), utils.loopDetector((() => $(".movie-gallery .image-list").length > 0), (async () => {
            $(".movie-gallery .image-list").prepend(' <a class="tile-item screen-container" style="overflow:hidden;max-height: 150px;max-width:150px; text-align:center;"><div style="margin-top: 50px;color: #000;cursor: auto">正在加载缩略图</div></a> ');
            const e = await this.getBean("ScreenShotPlugin").getScreenshot(t);
            e && ($(".screen-container").html(`<img src="${e}" alt="" loading="lazy" style="width: 100%;">`), 
            $(".screen-container").on("click", (t => {
                t.stopPropagation(), t.preventDefault(), showImageViewer(t.currentTarget);
            })));
        }));
    }
    async get123AvVideoInfo(t) {
        const e = await gmHttp.get(t), n = e.match(/v-scope="Movie\({id:\s*(\d+),/), a = n ? n[1] : null, i = $(e);
        return {
            id: a,
            publishDate: i.find('span:contains("リリース日:")').next("span").text(),
            title: i.find("h1").text().trim(),
            moviePoster: i.find("#player").attr("data-poster")
        };
    }
    async getActressInfo(t) {
        let e = `https://fc2ppvdb.com/articles/${t.replace("FC2-", "")}`;
        const n = await gmHttp.get(e), a = $(n), i = a.find("div").filter((function() {
            return 0 === $(this).text().trim().indexOf("女優：");
        }));
        if (0 === i.length || i.length > 1) return void show.error("解析女优信息失败");
        const s = $(i[0]).find("a");
        let o = "<strong>主演: </strong>";
        if (s.length > 0) {
            let t = "";
            s.each(((e, n) => {
                let a = $(n), i = a.text(), s = a.attr("href");
                o += `<span class="actor-tag"><a href="https://fc2ppvdb.com${s}" target="_blank">${i}</a></span>`, 
                t += i + " ";
            })), $("#data-actress").text(t);
        } else o += "<span>暂无演员信息</span>";
        $(".actor-list").html(o);
        const r = a.find("div").filter((function() {
            return 0 === $(this).text().trim().indexOf("販売者：");
        }));
        if (r.length > 0) {
            const t = $(r[0]).find("a");
            if (t.length > 0) {
                const e = $(t[0]);
                let n = e.text(), a = e.attr("href");
                $(".movie-seller").html(`<span><strong>販売者: </strong><a href="https://fc2ppvdb.com${a}" target="_blank">${n}</a></span>`);
            }
        }
    }
    async getImgList(t) {
        let e = t.replace("FC2-", ""), n = `https://adult.contents.fc2.com/article/${t.replace("FC2-", "")}/`;
        const a = await gmHttp.get(n, null, {
            referer: n
        });
        let i = $(a).find(".items_article_SampleImagesArea img").map((function() {
            return $(this).attr("src");
        })).get(), s = "";
        Array.isArray(i) && i.length > 0 ? s = i.map(((t, e) => `\n                <a href="${t}" data-fancybox="movie-gallery" data-caption="剧照 ${e + 1}">\n                    <img src="${t}" class="movie-image-thumb"  alt=""/>\n                </a>\n            `)).join("") : $(".movie-gallery").html("<h4>剧照: 暂无剧照</h4>"), 
        $(".image-list").html(s), this.handleLongImg(e);
    }
    async getMovie(t, e) {
        let n = `${await this.getBaseUrl()}/ajax/v/${t}/videos`, a = loading();
        try {
            let t = (await gmHttp.get(n)).result.watch;
            return t.length > 0 ? (t.forEach((t => {
                t.url = t.url + "?poster=" + e;
            })), t) : null;
        } catch (i) {
            console.error(i);
        } finally {
            a.close();
        }
    }
    markDataListHtml(t) {
        let e = "";
        return t.forEach((t => {
            e += `\n                <div class="item">\n                    <a href="${t.href}" class="box" title="${t.title}">\n                        <div class="cover ">\n                            <img loading="lazy" src="${t.imgSrc.replace("/s360", "")}" alt="">\n                        </div>\n                        <div class="video-title"><strong>${t.carNum}</strong> ${t.title}</div>\n                        <div class="score">\n                        </div>\n                        <div class="meta">\n                        </div>\n                        <div class="tags has-addons">\n                        </div>\n                    </a>\n                </div>\n            `;
        })), e;
    }
}

class Lt extends U {
    getName() {
        return "video123AvPlugin";
    }
    async handle() {
        if (!d.includes("5masterzzz")) return;
        localStorage.setItem("__pul", Date.now().toString()), setInterval((() => {
            localStorage.setItem("__pul", Date.now().toString());
        }), 5e3);
        document.querySelector("video").play().then();
    }
}

class Et extends U {
    constructor() {
        super(...arguments), r(this, "currentEngine", null), r(this, "searchEngines", [ {
            name: "U3C3",
            id: "u3c3",
            url: "https://u3c3.com/?search2=eelj1a3lfe1a1&search={keyword}",
            parseHtml: this.parseU3C3
        }, {
            name: "BTSOW",
            id: "BTSOW",
            url: "https://btsow.lol/bts/data/api/search",
            parseJson: this.parseBTSOW
        }, {
            name: "Sukebei",
            id: "Sukebei",
            url: "https://sukebei.nyaa.si/?f=0&c=0_0&q={keyword}",
            parseHtml: this.parseSukebei
        } ]);
    }
    getName() {
        return "MagnetHubPlugin";
    }
    async initCss() {
        return "\n            <style>\n                .magnet-container {\n                    margin: 20px auto;\n                    width: 100%;\n                    font-family: Arial, sans-serif;\n                }\n                .magnet-tabs {\n                    display: flex;\n                    border-bottom: 1px solid #ddd;\n                    margin-bottom: 15px;\n                }\n                .magnet-tab {\n                    padding: 5px 12px;\n                    cursor: pointer;\n                    border: 1px solid transparent;\n                    border-bottom: none;\n                    margin-right: 5px;\n                    background: #f5f5f5;\n                    border-radius: 5px 5px 0 0;\n                }\n                .magnet-tab.active {\n                    background: #fff;\n                    border-color: #ddd;\n                    border-bottom: 1px solid #fff;\n                    margin-bottom: -1px;\n                    font-weight: bold;\n                }\n                .magnet-tab:hover:not(.active) {\n                    background: #e9e9e9;\n                }\n                \n                .magnet-results {\n                    min-height: 200px;\n                }\n                .magnet-result {\n                    padding: 15px;\n                    border-bottom: 1px solid #eee;\n                    position: relative; \n                }\n                .magnet-result:hover {\n                    background-color: #f9f9f9;\n                }\n                .magnet-title {\n                    font-weight: bold;\n                    margin-bottom: 5px;\n                    white-space: nowrap;\n                    overflow: hidden; \n                    text-overflow: ellipsis;\n                    padding-right: 80px; \n                }\n                .magnet-info {\n                    display: flex;\n                    justify-content: space-between;\n                    font-size: 12px;\n                    color: #666;\n                    margin-bottom: 5px;\n                }\n                .magnet-loading {\n                    text-align: center;\n                    padding: 20px;\n                }\n                .magnet-error {\n                    color: #f44336;\n                    padding: 10px;\n                }\n                \n                .magnet-copy {\n                    position: absolute;\n                    right: 15px;\n                    top: 12px;\n                }\n                .magnet-hub-btn {\n                    background-color: #f0f0f0;\n                    color: #555;\n                    border: 1px solid #ddd;\n                    padding: 3px 8px;\n                    border-radius: 3px;\n                    cursor: pointer;\n                    font-size: 12px;\n                    transition: all 0.2s;\n                    margin-left: 10px;\n                }\n                .magnet-hub-btn:hover {\n                    background-color: #e0e0e0;\n                    border-color: #ccc;\n                }\n                .magnet-hub-btn.copied {\n                    background-color: #4CAF50;\n                    color: white;\n                    border-color: #4CAF50;\n                }\n            </style>\n        ";
    }
    createMagnetHub(t) {
        const e = $('<div class="magnet-container"></div>'), n = $('<div class="magnet-tabs"></div>'), a = "jhs_magnetHub_selectedEngine", i = localStorage.getItem(a);
        let s = 0;
        this.searchEngines.forEach(((t, e) => {
            const a = $(`<div class="magnet-tab" data-engine="${t.id}">${t.name}</div>`);
            i && t.id === i ? (a.addClass("active"), this.currentEngine = t, s = e) : 0 !== e || i || (a.addClass("active"), 
            this.currentEngine = t), n.append(a);
        })), e.append(n);
        const o = $('<div class="magnet-results"></div>');
        return e.append(o), e.on("click", ".magnet-tab", (n => {
            const i = $(n.target).data("engine");
            this.currentEngine = this.searchEngines.find((t => t.id === i)), localStorage.setItem(a, i), 
            e.find(".magnet-tab").removeClass("active"), $(n.target).addClass("active"), this.searchEngine(o, this.currentEngine, t);
        })), this.searchEngine(o, this.currentEngine || this.searchEngines[s], t), e;
    }
    searchEngine(t, e, n) {
        t.html(`<div class="magnet-loading">正在从 ${e.name} 搜索 "${n}"...</div>`);
        const a = `${e.name}_${n}`, i = sessionStorage.getItem(a);
        if (i) try {
            const n = JSON.parse(i);
            return void this.displayResults(t, n, e.name);
        } catch (o) {
            t.html(`<div class="magnet-error">解析 ${e.name} 缓存结果失败: ${o.message}</div>`);
        }
        const s = e.url.replace("{keyword}", encodeURIComponent(n));
        e.parseHtml && GM_xmlhttpRequest({
            method: "GET",
            url: s,
            onload: n => {
                try {
                    const i = e.parseHtml.call(this, n.responseText);
                    i.length > 0 && sessionStorage.setItem(a, JSON.stringify(i)), this.displayResults(t, i, e.name);
                } catch (o) {
                    t.html(`<div class="magnet-error">解析 ${e.name} 结果失败: ${o.message}</div>`);
                }
            },
            onerror: n => {
                t.html(`<div class="magnet-error">从 ${e.name} 获取数据失败: ${n.statusText}</div>`);
            }
        }), e.parseJson && e.parseJson.call(this, t, e, n, a);
    }
    displayResults(t, e, n) {
        function a(t) {
            const e = t.text();
            t.addClass("copied").text("已复制"), setTimeout((() => {
                t.removeClass("copied").text(e);
            }), 2e3);
        }
        function i(t, e) {
            const n = document.createElement("textarea");
            n.value = t, n.style.position = "fixed", document.body.appendChild(n), n.select();
            try {
                document.execCommand("copy"), a(e);
            } catch (i) {
                console.error("复制失败:", i), alert("复制失败，请手动复制链接");
            }
            document.body.removeChild(n);
        }
        t.empty(), 0 !== e.length ? (e.forEach((e => {
            const n = $(`\n                <div class="magnet-result">\n                    <div class="magnet-title"><a href="${e.magnet}">${e.title}</a></div>\n                    <div class="magnet-info">\n                        <span>大小: ${e.size || "未知"}</span>\n                        <span>日期: ${e.date || "未知"}</span>\n                    </div>\n                    <div class="magnet-copy">\n                        <button class="magnet-hub-btn copy-btn" data-magnet="${e.magnet}">复制链接</button>\n                        <button class="magnet-hub-btn down-115" data-magnet="${e.magnet}">115离线下载</button>\n                    </div>\n                </div>\n            `);
            t.append(n);
        })), t.on("click", ".copy-btn", (function() {
            const t = $(this), e = t.data("magnet");
            navigator.clipboard ? navigator.clipboard.writeText(e).then((() => {
                a(t);
            })).catch((n => {
                i(e, t);
            })) : i(e, t);
        })), t.on("click", ".down-115", (async t => {
            const e = $(t.currentTarget).data("magnet");
            let n = loading();
            try {
                await this.getBean("WangPan115TaskPlugin").handleAddTask(e);
            } catch (a) {
                show.error("发生错误:" + a), console.error(a);
            } finally {
                n.close();
            }
        }))) : t.append('<div class="magnet-error">没有找到相关结果</div>');
    }
    parseBTSOW(t, e, n, a) {
        const i = this;
        GM_xmlhttpRequest({
            method: "POST",
            url: e.url,
            headers: {
                "Content-Type": "application/json"
            },
            data: `[{"search":"${n}"},50,1]`,
            onload: n => {
                try {
                    const s = JSON.parse(n.responseText).data, o = [];
                    for (let t = 0; t < s.length; t++) {
                        let e = s[t];
                        o.push({
                            title: e.name,
                            magnet: "magnet:?xt=urn:btih:" + e.hash,
                            size: (e.size / 1073741824).toFixed(2) + " GB",
                            date: utils.formatDate(new Date(1e3 * e.lastUpdateTime))
                        });
                    }
                    o.length > 0 && sessionStorage.setItem(a, JSON.stringify(o)), i.displayResults(t, o, e.name);
                } catch (s) {
                    t.html(`<div class="magnet-error">解析 ${e.name} 结果失败: ${s.message}</div>`);
                }
            },
            onerror: n => {
                t.html(`<div class="magnet-error">从 ${e.name} 获取数据失败: ${n.statusText}</div>`);
            }
        });
    }
    parseU3C3(t) {
        const e = utils.htmlTo$dom(t), n = [];
        return e.find(".torrent-list tbody tr").each(((t, e) => {
            const a = $(e);
            if (a.text().includes("置顶")) return;
            const i = a.find("td:nth-child(2) a").attr("title") || a.find("td:nth-child(2) a").text().trim(), s = a.find("td:nth-child(3) a[href^='magnet:']").attr("href"), o = a.find("td:nth-child(4)").text().trim(), r = a.find("td:nth-child(5)").text().trim();
            s && n.push({
                title: i,
                magnet: s,
                size: o,
                date: r
            });
        })), n;
    }
    parseSukebei(t) {
        const e = utils.htmlTo$dom(t), n = [];
        return e.find(".torrent-list tbody tr").each(((t, e) => {
            const a = $(e);
            if (a.text().includes("置顶")) return;
            const i = a.find("td:nth-child(2) a").attr("title") || a.find("td:nth-child(2) a").text().trim(), s = a.find("td:nth-child(3) a[href^='magnet:']").attr("href"), o = a.find("td:nth-child(4)").text().trim(), r = a.find("td:nth-child(5)").text().trim();
            s && n.push({
                title: i,
                magnet: s,
                size: o,
                date: r
            });
        })), n;
    }
}

class Ht extends U {
    getName() {
        return "ScreenShotPlugin";
    }
    async handle() {
        this.loadScreenShot().then();
    }
    async loadScreenShot() {
        if (!isDetailPage) return;
        if ("yes" !== await storageManager.getSetting("enableLoadScreenShot", "yes")) return;
        let t = this.getPageInfo().carNum;
        h && $(".tile-item").first().before(' <a class="tile-item screen-container" style="overflow:hidden;max-height: 215px;text-align:center;"><div style="margin-top: 50px;color: #000;cursor: auto">正在加载缩略图</div></a> '), 
        g && $("#sample-waterfall .sample-box:first").after(' <a class="sample-box screen-container" style="overflow:hidden; height: 110px; text-align:center;"><div style="margin-top: 30px;color: #000;cursor: auto">正在加载缩略图</div></a> ');
        try {
            const e = await this.getScreenshot(t);
            this.addImg("缩略图", e);
        } catch (e) {
            this.showErrorFallback(t, e);
        }
    }
    async getScreenshot(t) {
        const e = localStorage.getItem("jhs_screenShot") ? JSON.parse(localStorage.getItem("jhs_screenShot")) : {};
        if (e[t]) return e[t];
        let n;
        try {
            n = await Promise.any([ this.getJavStoreScreenShot(t), this.getJavBestScreenShot(t) ]);
        } catch (i) {
            console.error("获取缩略图资源失败:", i.errors), show.error("获取缩略图资源失败");
        }
        const a = n.indexOf("https://");
        return -1 !== a && (n = n.substring(a)), e[t] = n, localStorage.setItem("jhs_screenShot", JSON.stringify(e)), 
        n;
    }
    async getJavStoreScreenShot(t) {
        let e = `https://javstore.net/search/${t}.html`, n = await gmHttp.get(e);
        const a = utils.htmlTo$dom(n);
        let i = null;
        if (a.find("#content_news h3 span a").each((function() {
            if ($(this).attr("title").toLowerCase().includes(t.toLowerCase())) return i = $(this).attr("href"), 
            !1;
        })), !i) throw new Error("查询番号失败: " + e);
        let s = await gmHttp.get(i);
        const o = utils.htmlTo$dom(s);
        let r = o.find("a:contains('CLICK HERE')").attr("href") || o.find("img[src*='_s.jpg']").attr("src");
        if (!r) throw new Error("解析预览图失败");
        return r.replace(".th", "");
    }
    addImg(t, e) {
        e && (h && $(".screen-container").html(`<img src="${e}" alt="${t}" loading="lazy" style="width: 100%;">`), 
        g && $(".screen-container").html(`<div class="photo-frame"><img src="${e}" style="height: inherit;width: 100%;" title="${t}" alt="${t}"></div>`), 
        $(".screen-container").on("click", (t => {
            t.stopPropagation(), t.preventDefault(), showImageViewer(t.currentTarget);
        })));
    }
    showErrorFallback(t, e) {
        console.error("获取缩略图失败:", e.message.substring(0, 100));
        let n = g ? "margin-top: 30px" : "margin-top: 50px";
        $(".screen-container").html(`<div style="${n}; cursor:auto;color:#000;">获取缩略图失败</div><br/><a href='#' class='retry-link'>点击重试</a> 或 <a class="check-link" href='https://javstore.net/search/${t}.html' target='_blank'>前往确认</a>`).on("click", ".retry-link", (async e => {
            e.stopPropagation(), e.preventDefault(), $(".screen-container").html(`<div style="${n};cursor:auto;color:#000;">正在重新加载...</div>`);
            try {
                const e = await this.getScreenshot(t);
                this.addImg("缩略图", e);
            } catch (a) {
                this.showErrorFallback(t, a);
            }
        })).on("click", ".check-link", (async e => {
            e.stopPropagation(), e.preventDefault(), window.open(`https://javstore.net/search/${t}.html`, "_blank");
        }));
    }
    async getJavBestScreenShot(t) {
        let e = `https://javbest.net/?s=${t}`, n = await gmHttp.get(e);
        const a = utils.htmlTo$dom(n), i = a.find(".app_loop_thumb a").first().attr("href");
        if (!i) throw console.error("解析JavBest搜索页失败:", e), new Error("解析JavBest搜索页失败");
        const s = a.find(".app_loop_thumb a").first().attr("title");
        if (!s.toLowerCase().includes(t.toLowerCase())) throw console.error("解析JavBest搜索页失败:", s), 
        new Error("解析JavBest搜索页失败");
        const o = await gmHttp.get(i);
        let r = $(o).find('#content a img[src*="_t.jpg"]').attr("src");
        if (!r) throw console.error("解析JavBest缩略图失败:", e), new Error("解析JavBest缩略图失败");
        return r = r.replace("_t", "").replace("http:", "https:"), r;
    }
}

class jt extends U {
    getName() {
        return "FilterActorVideoPlugin";
    }
    async handle() {
        d.includes("/actors/") && ($("h2").append('<a class="a-danger" id="filterActorVideo" style="padding:8px;" data-tip="屏蔽已选分类的视频列表, 屏蔽该演员后, 有新作品也会纳入屏蔽中" >屏蔽该演员所有作品</a>'), 
        $("h2").append('<a class="a-warning" id="filterAllVideo" style="padding:8px;" data-tip="一键屏蔽已选分类的视频列表">一键屏蔽所有作品</a>')), 
        d.includes("/star/") && $("#waitDownBtn").after(' \n                <a id="filterActorVideo" title="屏蔽该演员后, 有新作品也会纳入屏蔽中" class="menu-btn" style="background-color:#fee2e2 !important; color: #b91c1c !important; margin-left: 5px;border-bottom:none !important;border-radius:3px;">\n                    <span>屏蔽该演员所有作品</span>\n                </a>\n                <a id="filterAllVideo" title="一键屏蔽所有视频, 不屏蔽演员" class="menu-btn" style="background-color:#ffedd5 !important; color: #9a3412 !important;margin-left: 5px;border-bottom:none !important;border-radius:3px;">\n                    <span>一键屏蔽所有视频</span>\n                </a>\n            '), 
        $("#filterActorVideo").on("click", (async t => {
            let e = {
                clientX: t.clientX,
                clientY: t.clientY + 80
            }, n = h ? $(".actor-section-name") : $(".avatar-box .photo-info .pb10");
            if (0 === n.length) return void show.error("获取演员名称失败");
            let a, i = n.text().trim().split(",")[0], s = $(".section-meta:contains('男優')").length > 0;
            a = s ? storageManager.filter_actor_car_list_key + i : storageManager.filter_actress_car_list_key + i;
            let o = "是否屏蔽该演员下的所有作品?";
            (await storageManager.getActorFilterCarList(a)).length > 0 && (o = "该演员已屏蔽过, 是否清空该数据并重新屏蔽?"), 
            utils.q(e, o, (async () => {
                this.loadObj = loading();
                try {
                    await storageManager.removeActorFilter(a);
                    const t = await storageManager.getItem(storageManager.filter_actor_actress_info_list_key) || [], e = this.getCurrentStarUrl(), n = t.find((t => t.name === i));
                    n ? (n.recordTime = utils.getNowStr(), n.url = e) : t.push({
                        name: i,
                        key: a,
                        url: e,
                        isActor: s,
                        recordTime: utils.getNowStr(),
                        checkTime: ""
                    }), await storageManager.setItem(storageManager.filter_actor_actress_info_list_key, t), 
                    await this.filterActorVideo(a, i);
                } catch (t) {
                    console.error(t), this.loadObj.close();
                } finally {
                    this.loadObj.close();
                }
            }));
        })), $("#filterAllVideo").on("click", (async t => {
            let e = {
                clientX: t.clientX,
                clientY: t.clientY + 80
            }, n = h ? $(".actor-section-name") : $(".avatar-box .photo-info .pb10");
            if (0 === n.length) return void show.error("获取演员名称失败");
            let a = n.text().trim().split(",")[0];
            utils.q(e, "一键屏蔽视频列表?", (async () => {
                this.loadObj = loading();
                try {
                    await this.filterAllVideo(a), window.refresh();
                } catch (t) {
                    console.error(t);
                } finally {
                    this.loadObj.close();
                }
            }));
        })), this.checkNewActressActorFilterCar().then();
    }
    getCurrentStarUrl() {
        let t = d.replace(/([&?])page=\d+(&|$)/, "$1");
        return t = t.replace(/[&?]$/, ""), t = t.replace(/\?&/, "?"), t = t.replace(/\/(\d+)(?:\/(\d+))?(\?|$)/, ((t, e, n, a) => void 0 !== n ? `/${e}${a}` : t)), 
        t;
    }
    async filterAllVideo(t, e) {
        let n, a;
        if (e ? (g && e.find(".avatar-box").length > 0 && e.find(".avatar-box").parent().remove(), 
        n = e.find(this.getSelector().requestDomItemSelector), a = e.find(this.getSelector().nextPageSelector).attr("href")) : (n = $(this.getSelector().itemSelector), 
        a = $(this.getSelector().nextPageSelector).attr("href")), a && 0 === n.length) throw show.error("解析列表失败"), 
        new Error("解析列表失败");
        for (const s of n) {
            const e = $(s), {carNum: n, aHref: a} = this.getBean("ListPagePlugin").findCarNumAndHref(e);
            if (a && n) try {
                if (await storageManager.getCar(n)) continue;
                await storageManager.saveCar(n, a, t, m), console.log("屏蔽演员番号", t, n);
            } catch (i) {
                console.error(`保存失败 [${n}]:`, i);
            }
        }
        if (a) {
            show.info("请不要关闭窗口, 正在解析下一页:" + a), await new Promise((t => setTimeout(t, 500)));
            const e = await http.get(a), n = new DOMParser, i = $(n.parseFromString(e, "text/html"));
            await this.filterAllVideo(t, i);
        } else show.ok("执行结束!"), window.refresh();
    }
    async filterActorVideo(t, e, n) {
        let a = await this.parseAndSaveFilterInfo(n, t, e);
        if (a) {
            show.info("请不要关闭窗口, 正在解析下一页:" + a), await new Promise((t => setTimeout(t, 500)));
            const n = await http.get(a), i = new DOMParser, s = $(i.parseFromString(n, "text/html"));
            await this.filterActorVideo(t, e, s);
        } else show.ok("执行结束!"), window.refresh();
    }
    async parseAndSaveFilterInfo(t, e, n) {
        let a, i;
        if (t ? (g && t.find(".avatar-box").length > 0 && t.find(".avatar-box").parent().remove(), 
        a = t.find(this.getSelector().requestDomItemSelector), i = t.find(this.getSelector().nextPageSelector).attr("href")) : (a = $(this.getSelector().itemSelector), 
        i = $(this.getSelector().nextPageSelector).attr("href")), i && 0 === a.length) throw show.error("解析列表失败"), 
        new Error("解析列表失败");
        for (const o of a) {
            const t = $(o), {carNum: a, aHref: i} = this.getBean("ListPagePlugin").findCarNumAndHref(t);
            if (i && a) try {
                if (await storageManager.getActorFilterCar(e, a)) continue;
                await storageManager.saveActorFilterCar(e, a, i, n), console.log("屏蔽演员番号", n, a);
            } catch (s) {
                console.error(`保存失败 [${a}]:`, s);
            }
        }
        return i;
    }
    async checkNewActressActorFilterCar() {
        const t = await storageManager.getItem(storageManager.filter_actor_actress_info_list_key) || [], e = {
            ...await storageManager.getActressFilterCarMap(),
            ...await storageManager.getActorFilterCarMap()
        }, n = Object.keys(e);
        for (const i of n) {
            let e;
            try {
                const n = i.split("_").pop(), a = t.find((t => t.name === n));
                if (!a) continue;
                let s = a.url;
                e = s;
                const o = new URL(window.location.href).hostname;
                if (o !== new URL(s).hostname) continue;
                let r = a.checkTime;
                if (r && this.isToday(r)) continue;
                const l = await http.get(s), c = $(l);
                console.log("检测屏蔽演员最新番号:", n, s), await this.parseAndSaveFilterInfo(c, i, n), a.checkTime = utils.getNowStr();
            } catch (a) {
                console.error("检测屏蔽演员信息, 发生错误:", e, a), show.error("检测屏蔽演员信息, 发生错误:" + a, "bottom", "right");
            } finally {
                await storageManager.setItem(storageManager.filter_actor_actress_info_list_key, t);
            }
        }
    }
    isToday(t) {
        return (new Date).toISOString().split("T")[0] === t.split(" ")[0];
    }
}

class Nt extends U {
    getName() {
        return "WangPan115TaskPlugin";
    }
    async handle() {
        $(".buttons button[data-clipboard-text*='magnet:']").each(((t, e) => {
            $(e).parent().append($("<button>").text("115离线下载").addClass("button is-info is-small").click((async t => {
                t.stopPropagation(), t.preventDefault();
                let n = loading();
                try {
                    await this.handleAddTask($(e).attr("data-clipboard-text"));
                } catch (a) {
                    show.error("发生错误:" + a), console.error(a);
                } finally {
                    n.close();
                }
            })));
        })), g && isDetailPage && utils.loopDetector((() => $("#magnet-table td a").length > 0), (() => {
            this.bus115Down();
        }));
    }
    async bus115Down() {
        $("#magnet-table tr").each(((t, e) => {
            console.log(t, e);
            const n = $(e).find("td:nth-child(1) a").attr("href");
            if (n && n.includes("magnet:")) {
                const t = $("<td>").addClass("action-cell");
                $("<button>").text("115离线下载").addClass("button is-info is-small").click((async t => {
                    t.stopPropagation(), t.preventDefault();
                    let e = loading();
                    try {
                        await this.handleAddTask(n);
                    } catch (a) {
                        show.error("发生错误:" + a), console.error(a);
                    } finally {
                        e.close();
                    }
                })).appendTo(t), $(e).append(t);
            }
        })), $("#magnet-table tbody").length > 0 && $("#magnet-table tbody tr").append($("<td>").text("操作"));
    }
    async getSavePathId(t) {
        let e = await storageManager.getSetting("savePath115", "云下载");
        t && (e = e.replaceAll("{ny}", t)), e = e.replaceAll("{date}", utils.formatDate(new Date));
    }
    async handleAddTask(t, e) {
        const n = await (async () => {
            const t = await gmHttp.get("https://115.com/?ct=offline&ac=space&_=" + (new Date).getTime());
            return "object" == typeof t ? t : null;
        })();
        if (!n) return void show.error("未登录115网盘", {
            close: !0,
            duration: -1,
            callback: async () => {
                const t = await storageManager.getSetting("cookie115", "");
                window.open("https://115.com/?cookie=" + t);
            }
        });
        const a = n.sign, i = n.time, s = "115UserId";
        let o = sessionStorage.getItem(s);
        if (o || (o = await (async () => {
            const t = await gmHttp.get("https://webapi.115.com/offine/downpath");
            return "object" == typeof t ? t.data[0].id : null;
        })()), !o) return void show.error("获取115网盘UserId失败");
        sessionStorage.setItem(s, o);
        const r = await (async (t, e = "", n, a, i) => {
            const s = {
                url: encodeURIComponent(t),
                wp_path_id: "",
                uid: n,
                sign: a,
                time: i
            };
            return await gmHttp.postForm("https://115.com/web/lixian/?ct=lixian&ac=add_task_url", s);
        })(t, o, a, i);
        console.log("离线下载返回值:", r);
        let l = r.info_hash, c = await this.getFileId(o, a, i, l), d = "https://115.com/?tab=offline&mode=wangpan";
        c && (d = `https://115.com/?cid=${c}&offset=0&mode=wangpan`);
        let h = "添加成功, 是否前往查看?";
        !1 === r.state && (h = r.error_msg + " 是否前往查看?"), utils.q(null, h, (async () => {
            let t = await this.getFileId(o, a, i, l);
            t && (d = `https://115.com/?cid=${t}&offset=0&mode=wangpan`), window.open(d);
        }));
    }
    async getFileId(t, e, n, a) {
        const i = await (async (t, e, n) => {
            const a = {
                page: 1,
                uid: t,
                sign: e,
                time: n
            };
            return (await gmHttp.postForm("https://115.com/web/lixian/?ct=lixian&ac=task_lists", a)).tasks;
        })(t, e, n);
        console.log("云离线列表:", i);
        let s = null;
        for (let o = 0; o < i.length; o++) {
            let t = i[o];
            if (t.info_hash === a) {
                s = t.file_id;
                break;
            }
        }
        return s;
    }
}

class Ft extends U {
    getName() {
        return "WangPan115Plugin";
    }
    async handle() {
        const t = this.parseCookie(), e = [ "UID", "CID", "KID", "SEID" ];
        if (t) {
            if (!confirm("检测到cookie,是否尝试登录？")) return;
            let n = "";
            const a = new Set;
            t.split(";").forEach((t => {
                const i = t.trim();
                if (i) {
                    const [t, s] = i.split("=");
                    t && s && e.includes(t) && (n += i + ";", a.add(t));
                }
            }));
            const i = e.filter((t => !a.has(t)));
            if (i.length > 0) return void show.error(`缺少必需的 Cookie: ${i.join(", ")}`);
            if (!n) return void show.error("cookie为空,无法执行记忆登录");
            utils.addCookie(n, {
                domain: ".115.com"
            }), window.location.reload();
        } else console.error("未获取到有效的 Cookie 字符串");
    }
    parseCookie() {
        const t = new URLSearchParams(window.location.search).get("goto");
        if (t) {
            const e = decodeURIComponent(t), n = new URL(e), a = new URLSearchParams(n.search).get("cookie");
            if (a) return decodeURIComponent(a);
        }
        return null;
    }
}

const zt = class t extends U {
    constructor() {
        super(...arguments), r(this, "loginStatus", t.LoginStatus.UNCHECKED);
    }
    getName() {
        return "WangPan115MatchPlugin";
    }
    async initCss() {
        let t = "";
        return isListPage && (t = "position: absolute; box-shadow: 0 2px 10px rgba(0,0,0,0.2);"), 
        `\n            <style>\n                [class^='jhs-match-'] {\n                    padding: 1px 2px;\n                    margin-left: 0;\n                    margin-right: 5px;\n                }\n                \n                .jhs-match-detail {\n                    ${t}\n                    z-index: 1000;\n                    background: #fff;\n                    border: 1px solid #ddd;\n                    border-radius: 4px;\n                    padding: 10px;\n                    max-width: 800px;\n                    max-height: 500px;\n                    overflow-y: auto;\n                }\n                .jhs-match-detail table {\n                    width: 100%;\n                    border-collapse: collapse;\n                }\n                .jhs-match-detail th, .jhs-match-detail td {\n                    padding: 4px 8px;\n                    border: 1px solid #eee;\n                    text-align: left;\n                }\n                .jhs-match-detail th {\n                    background-color: #f5f5f5;\n                }\n                .jhs-match-detail tr:hover {\n                    background-color: #f9f9f9;\n                }\n            </style>\n        `;
    }
    async handle() {
        this.$box115 = g ? $(".container .info") : $(".movie-panel-info"), $(document).on("click", ".jhs-match-btn", (t => {
            t.preventDefault(), t.stopImmediatePropagation(), this.showMatchDetail(t.currentTarget);
        })), $(document).on("click", ".jhs-match-error-btn", (async t => {
            t.preventDefault(), t.stopPropagation(), await this.retryMatch(t.currentTarget);
        })), $(document).on("click", ".jhs-match-no-login-btn", (async t => {
            t.preventDefault(), t.stopPropagation(), await this.handleLoginRedirect();
        })), await this.matchDetailPage(), $(document).on("click", ".jhs-match-detail-error-btn", (async t => {
            t.preventDefault(), t.stopPropagation();
            $(t.currentTarget).replaceWith("<a class='jhs-match-btn' title=\"匹配中...\">匹配中...</a>");
            try {
                const t = this.getPageInfo().carNum, e = await this.searchFiles(t);
                $(".jhs-match-detail").remove(), await this.matchDetailPage(e);
            } catch (e) {
                console.error(`重新匹配失败 [${carNum}]:`, e), this.showMatchError($box, carNum, e);
            }
        }));
    }
    async matchDetailPage(e) {
        if (!isDetailPage) return;
        if (await storageManager.getSetting("enable115Match", I) === I) return;
        const n = $('\n            <div class="jhs-match-detail">\n                <table>\n                    <thead>\n                        <tr style="text-align: center">\n                            <th colspan="4">115匹配</th>\n                        </tr>\n                        <tr>\n                            <th>名称</th>\n                            <th>大小</th>\n                            <th>时间</th>\n                            <th>播放</th>\n                        </tr>\n                    </thead>\n                    <tbody>\n                    </tbody>\n                </table>\n            </div>\n        '), a = n.find("tbody");
        try {
            const n = this.getPageInfo().carNum;
            if (e || (e = await this.searchFiles(n)), await this.checkLoginStatus(), this.loginStatus === t.LoginStatus.LOGGED_OUT) a.append(`<tr><td colspan="4">\n                     <a class='jhs-match-no-login-btn a-dark'\n                        data-keyword="${n}"\n                        title="未登录115网盘">未登录</a>\n                 </td></tr>`); else if (e.length > 0) {
                const t = e.map((t => `\n                <tr>\n                    <td>${t.name}</td>\n                    <td>${this.formatSize(t.size)}</td>\n                    <td>${t.createTime}</td>\n                    <td>\n                        <a href="https://115vod.com/?pickcode=${t.videoId}&share_id=0"\n                           target="_blank"\n                           class="a-success"\n                           title="播放">播放</a>\n                    </td>\n                </tr>\n            `)).join("");
                a.append(t);
            } else a.append(`<tr><td colspan="4">\n                     <a class='jhs-match-detail-error-btn a-dark'\n                        data-keyword="${n}"\n                        title="未匹配,点击重试">未匹配</a>\n                 </td></tr>`);
        } catch (i) {
            a.append(`<tr><td colspan="4">\n                 <a class="a-danger jhs-match-detail-error-btn" title="${i.message || "加载失败"}">加载失败，请重试</a>\n             </td></tr>`), 
            console.error("加载文件列表时发生错误:", i);
        }
        this.$box115.append(n);
    }
    async matchMovieList(t) {
        await storageManager.getSetting("enable115Match", I) !== I && (await this.checkLoginStatus(), 
        await this.processMovieElements(t));
    }
    showMatchDetail(t) {
        const e = $(t), n = e.attr("data-match");
        $(".jhs-match-detail").remove();
        const a = this.parseMatchData(n);
        if (0 === a.length) return;
        if (1 === a.length) {
            const t = a[0].videoId;
            return void window.open(`https://115vod.com/?pickcode=${t}&share_id=0`, "_blank");
        }
        const i = this.createMatchDetailElement(a);
        this.positionDetailElement(i, e), this.addOutsideClickHandler(i), i.on("click", (t => {
            t.stopPropagation();
        }));
    }
    parseMatchData(t) {
        try {
            return JSON.parse(t) || [];
        } catch (e) {
            return console.error("解析匹配数据失败:", e), [];
        }
    }
    createMatchDetailElement(t) {
        const e = $(`\n            <div class="jhs-match-detail">\n                <table>\n                    <thead>\n                        <tr>\n                            <th>名称</th>\n                            <th>大小</th>\n                            <th>时间</th>\n                            <th>播放</th>\n                        </tr>\n                    </thead>\n                    <tbody>\n                        ${t.map((t => `\n                            <tr>\n                                <td>${t.name}</td>\n                                <td>${this.formatSize(t.size)}</td>\n                                <td>${t.createTime}</td>\n                                <td>\n                                    <a href="https://115vod.com/?pickcode=${t.videoId}&share_id=0" \n                                       target="_blank" \n                                       class="a-success"\n                                       title="播放">播放</a>\n                                </td>\n                            </tr>\n                        `)).join("")}\n                    </tbody>\n                </table>\n            </div>\n        `);
        return $("body").append(e), e;
    }
    positionDetailElement(t, e) {
        const n = e.offset();
        t.css({
            top: n.top - t.outerHeight() + 20,
            left: n.left
        });
    }
    addOutsideClickHandler(t) {
        const e = "click.jhs-match-detail";
        setTimeout((() => {
            $(document).on(e, (n => {
                t.is(n.target) || 0 !== t.has(n.target).length || (t.remove(), $(document).off(e));
            }));
        }), 100);
    }
    async retryMatch(t) {
        const e = $(t), n = e.closest(".movie-box, .item"), a = e.attr("data-keyword");
        e.replaceWith("<a class='jhs-match-btn' title=\"匹配中...\">匹配中...</a>");
        try {
            const t = await this.searchFiles(a);
            this.updateMatchStatus(n, a, t);
        } catch (i) {
            console.error(`重新匹配失败 [${a}]:`, i), this.showMatchError(n, a, i);
        }
    }
    async handleLoginRedirect() {
        const t = await storageManager.getSetting("cookie115", "");
        window.open("https://115.com/?cookie=" + t);
    }
    async searchFiles(t) {
        var e;
        return (null == (e = (await xt(t)).data) ? void 0 : e.map((t => ({
            folderId: t.fid,
            videoId: t.pc,
            name: t.n,
            createTime: utils.formatDate(new Date(1e3 * t.te)),
            size: t.s,
            isVideo: [ ".mp4", ".avi", ".mov", ".mkv", ".flv", ".wmv" ].some((e => {
                var n;
                return null == (n = t.n) ? void 0 : n.toLowerCase().endsWith(e);
            }))
        }))).filter((e => e.folderId && e.isVideo && e.name.toLowerCase().includes(t.toLowerCase())))) || [];
    }
    updateMatchStatus(t, e, n) {
        n.length > 0 ? t.find(".video-title").prepend(`<a class='jhs-match-btn a-success' \n                   data-keyword="${e}"\n                   data-match='${JSON.stringify(n)}'\n                   title="点击查看匹配详情">匹配${n.length}个</a>`) : t.find(".jhs-match-btn").replaceWith(`<a class='jhs-match-error-btn a-dark' data-keyword="${e}" \n                  title="点击重新尝试匹配">未匹配</a>`);
    }
    showMatchError(t, e, n) {
        t.find(".jhs-match-btn").replaceWith(`<a class='jhs-match-error-btn' data-keyword="${e}" \n              title="匹配失败，点击重试">匹配失败</a>`), 
        show.error(`${e} 匹配失败: ${n.message || "网络错误"}`);
    }
    async checkLoginStatus() {
        var e;
        if (this.loginStatus === t.LoginStatus.UNCHECKED) try {
            const n = await xt("test");
            this.loginStatus = (null == (e = n.error) ? void 0 : e.includes("登录")) ? t.LoginStatus.LOGGED_OUT : t.LoginStatus.LOGGED_IN;
        } catch {
            this.loginStatus = t.LoginStatus.LOGGED_OUT;
        }
    }
    async processMovieElements(t) {
        const e = Array.from(t).filter((t => !utils.isHidden(t))).filter((t => !(g && $(t).find(".avatar-box").length > 0))).map((t => this.processSingleMovieElement(t)));
        await Promise.all(e);
    }
    async processSingleMovieElement(e) {
        const n = $(e), {carNum: a} = this.getBean("ListPagePlugin").findCarNumAndHref(n);
        if (!(n.find("[class^='jhs-match-']").length > 0)) if (this.loginStatus !== t.LoginStatus.LOGGED_OUT) try {
            const t = await this.searchFiles(a);
            this.addTag(n, a, t);
        } catch (i) {
            console.error(`搜索失败 [${a}]:`, i), this.addTag(n, a, []);
        } else this.addTag(n, a, []);
    }
    addTag(e, n, a) {
        if (!(e.find("[class^='jhs-match-']").length > 0)) if (this.loginStatus === t.LoginStatus.LOGGED_OUT) e.find(".video-title").prepend(`<a class='jhs-match-no-login-btn a-dark' \n                   data-keyword="${n}" \n                   title="未登录115网盘">未登录</a>`); else if (a.length > 0) {
            const t = 1 === a.length ? "点击直接播放" : `点击查看${a.length}个匹配结果`;
            e.find(".video-title").prepend(`<a class='jhs-match-btn a-success' \n                       data-keyword="${n}"\n                       data-match='${JSON.stringify(a)}'\n                       title="${t}">匹配${a.length}个</a>`);
        } else e.find(".video-title").prepend(`<a class='jhs-match-error-btn a-dark' \n                   data-keyword="${n}" \n                   title="未匹配,点击重试">未匹配</a>`);
    }
    formatSize(t) {
        if (!t) return "-";
        const e = [ "B", "KB", "MB", "GB", "TB" ];
        let n = parseFloat(t), a = 0;
        for (;n >= 1024 && a < e.length - 1; ) n /= 1024, a++;
        return `${n.toFixed(2)} ${e[a]}`;
    }
};

r(zt, "LoginStatus", {
    UNCHECKED: -1,
    LOGGED_OUT: 0,
    LOGGED_IN: 1
});

let Ut = zt;

utils.importResource("https://cdn.jsdelivr.net/npm/layui-layer@1.0.9/layer.min.css"), 
utils.importResource("https://cdn.jsdelivr.net/npm/toastify-js@1.12.0/src/toastify.min.css"), 
utils.importResource("https://cdn.jsdelivr.net/npm/viewerjs@1.11.1/dist/viewer.min.css"), 
window.onload = async function() {
    window.isDetailPage = function() {
        let t = window.location.href;
        return h ? t.split("?")[0].includes("/v/") : !!g && $("#magnet-table").length > 0;
    }(), window.isListPage = function() {
        let t = window.location.href;
        return h ? $(".movie-list").length > 0 || t.includes("advanced_search") : !!g && $(".masonry > div .item").length > 0;
    }();
    const t = await storageManager.getSetting();
    t[storageManager.filter_actor_actress_info_list_key] && (show.info("正在更正数据..."), 
    await storageManager.setItem(storageManager.filter_actor_actress_info_list_key, t[storageManager.filter_actor_actress_info_list_key]), 
    delete t[storageManager.filter_actor_actress_info_list_key], await storageManager.saveSetting(t), 
    show.info("更正完成")), h && /(^|;)\s*locale\s*=\s*en\s*($|;)/i.test(document.cookie) && show.error("请切换到中文语言下才可正常使用本脚本", {
        duration: -1
    }), function() {
        const t = new z;
        let e = window.location.hostname;
        h && (t.register(vt), t.register(wt), t.register(et), t.register(at), t.register(ft), 
        t.register(pt), t.register($t), t.register(lt), t.register(ot), t.register(rt), 
        t.register(_t), t.register(Bt), t.register(Tt), t.register(At), t.register(Ut), 
        t.register(R), t.register(mt), t.register(Dt), t.register(gt), t.register(nt), t.register(W), 
        t.register(ut), t.register(it), t.register(dt), t.register(Nt), t.register(Mt), 
        t.register(Et), t.register(Ht), t.register(jt)), g && (t.register(vt), t.register(ft), 
        t.register($t), t.register(pt), t.register(_t), t.register(wt), t.register(Bt), 
        t.register(It), t.register(Tt), t.register(Ut), t.register(ht), t.register(gt), 
        t.register(mt), t.register(ut), t.register(nt), t.register(Pt), t.register(Et), 
        t.register(Ht), t.register(dt), t.register(Nt), t.register(jt)), e.includes("javtrailers") && t.register(J), 
        e.includes("subtitlecat") && t.register(G), (e.includes("aliyundrive") || e.includes("alipan")) && t.register(st), 
        e.includes("5masterzzz") && t.register(Lt), e.includes("115.com") && t.register(Ft), 
        t.process().then();
    }();
};
