// ==UserScript==
// @name            JavScript
// @namespace       JavScript@blc
// @version         4.5.7
// @author          blc
// @description     一站式体验，JavBus & JavDB 兼容
// @include         *
// @icon            https://s1.ax1x.com/2022/04/01/q5lzYn.png
// @resource        success https://s1.ax1x.com/2022/04/01/q5l2LD.png
// @resource        info https://s1.ax1x.com/2022/04/01/q5lyz6.png
// @resource        warn https://s1.ax1x.com/2022/04/01/q5lgsO.png
// @resource        error https://s1.ax1x.com/2022/04/01/q5lcQK.png
// @supportURL      https://t.me/+bAWrOoIqs3xmMjll
// @connect         *
// @run-at          document-start
// @grant           unsafeWindow
// @grant           GM_removeValueChangeListener
// @grant           GM_addValueChangeListener
// @grant           GM_registerMenuCommand
// @grant           GM_getResourceURL
// @grant           GM_xmlhttpRequest
// @grant           GM_notification
// @grant           GM_setClipboard 
// @grant           GM_deleteValue
// @grant           GM_addElement
// @grant           GM_listValues
// @grant           GM_openInTab
// @grant           GM_addStyle
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_info
// @license         GPL-3.0-only
// @compatible      chrome last 2 versions
// @compatible      edge last 2 versions
// @downloadURL https://update.sleazyfork.org/scripts/435360/JavScript.user.js
// @updateURL https://update.sleazyfork.org/scripts/435360/JavScript.meta.js
// ==/UserScript==

// prettier-ignore
(function () {
    const NUM_REGEX = /\d+\.?\d*/g;
    const ZH_REGEX = /中文|字幕|中字|(-|_)c(?!d)/i;
    const CODE_REGEX = /^[a-z0-9]+(-|\w)+/i;
    const VR_REGEX = /(?<![a-z])VR(?![a-z-])/i;
    const FC2_REGEX = /^FC2-/i;
  
    const REP = "%s";
    const DOC = document;
    const VOID = "javascript:void(0)";
    const PICK_RUL = "https://v.anxia.com/?pickcode=";
    const FILE_RUL = `https://115.com/?cid=${REP}&offset=0&mode=wangpan`;
    const TAB_NAME = { img: "大图", video: "预览", player: "视频" };
  
    const addListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, ...args) {
        if (type !== "XContentLoaded") return addListener.call(this, type, ...args);
        document.readyState !== "loading" ? args[0]() : addListener.call(this, "DOMContentLoaded", ...args);
    };
  
    // capture
    const captureJump = () => {
        const { hash } = location;
        if (!hash?.includes("#jump#")) return;
  
        const code = hash.split("#").at(-1);
        if (!CODE_REGEX.test(code)) return;
  
        DOC.addEventListener(
            "XContentLoaded",
            () => {
                const capture = captureQuery(code)?.href;
                if (capture) location.replace(capture);
            },
            { once: true }
        );
    };
    const captureQuery = (code, { body } = DOC) => {
        const nodeList = Array.from(body.querySelectorAll(":any-link"));
        const { length } = nodeList;
        if (!length) return;
  
        const { regex } = codeParse(code);
        code = code.toUpperCase();
  
        const res = [];
        for (let i = 0; i < length; i++) {
            const { href = "", textContent = "", innerHTML = "" } = nodeList[i];
  
            if (!href || /^#|javascript/i.test(href)) continue;
            const str = [textContent, innerHTML]
                .map(item => item?.trim() ?? "")
                .filter(Boolean)
                .join("&")
                .toUpperCase();
            if (!str || !regex.test(str)) continue;
  
            if (!str.includes(code)) {
                res.push({ href, zh: false });
                continue;
            }
  
            if (ZH_REGEX.test(textContent)) return { href, zh: true };
            res.unshift({ href, zh: false });
  
            if (nodeList.some(item => item.href === href && ZH_REGEX.test(item.textContent))) return { href, zh: true };
        }
        if (res.length) return res[0];
    };
    const codeParse = code => {
        const _ = FC2_REGEX.test(code) ? "|_" : "";
        code = code.split("-").map((item, index) => (index ? item.replace(/^0/, "") : item));
  
        return {
            prefix: code[0],
            regex: new RegExp(`(?<![a-z])${code.join(`\\s?(0|-${_}){0,4}\\s?`)}(?!\\d)`, "i"),
        };
    };
    captureJump();
  
    // match
    const MatchDomains = [
        { domain: "JavDB", regex: /javdb\d*\.com/ },
        { domain: "JavBus", regex: /(jav|bus|dmm|see|cdn|fan){2}\.[a-z]{2,}/ },
        { domain: "Drive115", regex: /captchaapi\.115\.com/ },
    ];
    const Domain = MatchDomains.find(item => item.regex.test(location.host))?.domain;
    if (!Domain) return;
  
    // request
    const request = (url, data, method = "GET", options = {}) => {
        method = method ? method.toUpperCase().trim() : "GET";
        if (!url || !["GET", "HEAD", "POST"].includes(method)) return;
  
        if (Object.prototype.toString.call(data) === "[object Object]") {
            data = Object.keys(data)
                .map(key => `${key}=${encodeURIComponent(data[key])}`)
                .join("&");
        }
        const { responseType, headers = {} } = options;
        if (method === "GET") {
            options.responseType = responseType ?? "document";
            if (data) {
                let joiner = "?";
                if (url.includes(joiner)) joiner = /\?|&$/.test(url) ? "" : "&";
                url = `${url}${joiner}${data}`;
            }
        }
        if (method === "POST") {
            options.responseType = responseType ?? "json";
            options.headers = { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", ...headers };
        }
        return new Promise(resolve => {
            GM_xmlhttpRequest({
                url,
                data,
                method,
                timeout: 30000,
                onload: ({ status, response }) => {
                    if (status >= 400) response = false;
                    if (response && ["", "text"].includes(options.responseType)) {
                        if (/<\/?[a-z][\s\S]*>/i.test(response)) {
                            response = new DOMParser().parseFromString(response, "text/html");
                        } else if (/^\{.*\}$/.test(response)) {
                            response = JSON.parse(response);
                        }
                    }
                    resolve(response ?? true);
                },
                ontimeout: () => resolve(false),
                onerror: () => resolve(false),
                ...options,
            });
        });
    };
    // utils
    const notify = ({ text = "点击跳转115", type = "error", clickUrl = "https://115.com/", setTab, ...details }) => {
        GM_notification({
            text: text || GM_info.script.name,
            image: GM_getResourceURL(type),
            highlight: false,
            silent: true,
            timeout: 5000,
            onclick: () => openInTab(clickUrl),
            ...details,
        });
        if (setTab) setTabBar({ type, title: details.title });
    };
    const addPrefetch = arr => {
        arr = arr.filter(Boolean);
        if (!arr.length) return;
  
        DOC.head.insertAdjacentHTML("beforeend", arr.map(item => `<link rel="prefetch" href="${item}">`).join(""));
    };
    const setTabBar = ({ type = GM_info.script.icon, title }) => {
        if (title) DOC.title = title;
        type = type.includes("http") ? type : GM_getResourceURL(type);
  
        let icons = DOC.querySelectorAll("link[rel*='icon']");
        if (!icons?.length) icons = [DOC.create("link", { type: "image/x-icon", rel: "shortcut icon" })];
  
        icons.forEach(node => {
            node.href = type;
            DOC.getElementsByTagName("head")[0].append(node);
        });
    };
    const openInTab = (url, active = true, options = {}) => {
        if (url) return GM_openInTab(url, { active: !!active, setParent: true, ...options });
    };
    const imgLoaded = img => img.classList.add("x-in");
    const fadeInImg = node => {
        const img = node.querySelector("img");
        if (!img) return;
  
        img.title = "";
        if (img.complete && img.naturalHeight !== 0) return imgLoaded(img);
        img.onload = () => imgLoaded(img);
    };
    const addCopy = (selectors, attrs = {}) => {
        const node = typeof selectors === "string" ? DOC.querySelector(selectors) : selectors;
        const _attrs = { "data-copy": node.textContent, class: "x-ml", href: VOID };
        const target = DOC.create("a", { ..._attrs, ...attrs }, "复制");
        target.addEventListener("click", e => handleCopy(e, "成功"));
        node.append(target);
    };
    const handleCopy = (e, tip = "复制成功", copy) => {
        const { target } = e;
        copy = copy ? copy : target?.dataset?.copy?.trim() ?? "";
        if (!copy) return;
  
        e.preventDefault();
        e.stopPropagation();
        GM_setClipboard(copy);
  
        const { textContent = "" } = target;
        target.textContent = tip || "复制成功";
        const timer = setTimeout(() => {
            clearTimeout(timer);
            target.textContent = textContent;
        }, 300);
    };
    const getDate = (timestamp, joiner = "-") => {
        const date = timestamp ? new Date(timestamp) : new Date();
        const Y = date.getFullYear();
        const M = `${date.getMonth() + 1}`.padStart(2, "0");
        const D = `${date.getDate()}`.padStart(2, "0");
        return `${Y}${joiner}${M}${joiner}${D}`;
    };
    const transToBytes = (sizeStr = "") => {
        const sizeNum = sizeStr?.match(NUM_REGEX)?.[0] ?? 0;
        if (sizeNum <= 0) return 0;
  
        const matchList = [
            { unit: /byte/gi, transform: size => size },
            { unit: /kb/gi, transform: size => size * 1000 },
            { unit: /mb/gi, transform: size => size * 1000 ** 2 },
            { unit: /gb/gi, transform: size => size * 1000 ** 3 },
            { unit: /kib/gi, transform: size => size * 1024 },
            { unit: /mib/gi, transform: size => size * 1024 ** 2 },
            { unit: /gib/gi, transform: size => size * 1024 ** 3 },
        ];
  
        return (
            matchList
                .find(({ unit }) => unit.test(sizeStr))
                ?.transform(sizeNum)
                ?.toFixed(2) ?? 0
        );
    };
    DOC.create = (tag, attrs = {}, child) => {
        const node = DOC.createElement(tag);
        for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
        if (child) node.append(child);
        return node;
    };
    const createVideo = (sources, attrs = {}) => {
        if (typeof sources === "string") sources = [{ src: sources, type: "video/mp4" }];
        const video = DOC.create("video", attrs);
        video.controls = true;
        video.currentTime = 3;
        video.volume = localStorage.getItem("volume") ?? 0;
        video.preload = "none";
        video.append(...sources.map(item => DOC.create("source", item)));
  
        let timer = null;
        video.addEventListener("volumechange", ({ target }) => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => localStorage.setItem("volume", target.volume), 1000);
        });
        video.addEventListener("keyup", ({ code, target }) => {
            if (code === "Enter") {
                target.requestFullscreen();
                target.play();
            }
            if (code === "KeyM") target.muted = !target.muted;
        });
        return video;
    };
    const paramParse = (param, filter, separator = "#") => {
        return unique(param.split(separator).filter(item => filter.includes(item)));
    };
    const unique = (arr, key) => {
        if (!key) return Array.from(new Set(arr));
        return unique(arr.map(e => e[key].toLowerCase())).map(e => arr.find(x => x[key].toLowerCase() === e));
    };
    const verify = () => {
        const h = 667;
        const w = 375;
        const t = (window.screen.availHeight - h) / 2;
        const l = (window.screen.availWidth - w) / 2;
  
        window.open(
            `https://captchaapi.115.com/?ac=security_code&type=web&cb=Close911_${new Date().getTime()}`,
            "验证账号",
            `height=${h},width=${w},top=${t},left=${l},toolbar=no,menubar=no,scrollbars=no,resizable=no,location=no,status=no`
        );
    };
    const delay = (s = 1) => {
        return new Promise(r => {
            setTimeout(r, s * 1000);
        });
    };
  
    class Store {
        static init() {
            const date = getDate();
            const cdKey = "CD";
  
            if (GM_getValue(cdKey, "") !== date) {
                GM_setValue(cdKey, date);
                GM_setValue("DETAILS", {});
                GM_setValue("RESOURCE", {});
                GM_setValue("VERIFY_STATUS", "");
            }
  
            const expired = getDate(new Date() - 1000 * 60 * 60 * 24 * 30);
            if ((localStorage.getItem(cdKey) ?? expired) > expired) return;
            localStorage.clear();
            localStorage.setItem(cdKey, date);
        }
        static getDetail(key) {
            const localDetail = {
                img: localStorage.getItem(`${key}_img`) ?? undefined,
                video: localStorage.getItem(`${key}_video`) ?? undefined,
            };
  
            const details = GM_getValue("DETAILS", {});
            return { ...localDetail, ...(details[key] ?? {}) };
        }
        static upDetail(key, val) {
            const details = GM_getValue("DETAILS", {});
            details[key] = { ...(details[key] ?? {}), ...val };
            GM_setValue("DETAILS", details);
  
            if (FC2_REGEX.test(key)) return;
            val = JSON.stringify(val, ["img", "video"]);
            if (val === "{}") return;
            for (const [_key, _val] of Object.entries(JSON.parse(val))) {
                localStorage.setItem(`${key}_${_key}`, _val);
            }
        }
        static getResource(key) {
            const resource = GM_getValue("RESOURCE", {});
            return resource[key];
        }
        static upResource(key, val) {
            const resource = GM_getValue("RESOURCE", {});
            resource[key] = val;
            GM_setValue("RESOURCE", resource);
        }
        static getVerifyStatus() {
            return GM_getValue("VERIFY_STATUS", "");
        }
        static setVerifyStatus(val) {
            GM_setValue("VERIFY_STATUS", val);
        }
    }
    class Apis {
        static async fetchBlogJav(code) {
            if (FC2_REGEX.test(code)) code = code.replace("-PPV-", " PPV ");
            const re = { img: "" };
  
            const requests = [
                {
                    url: `https://blogjav.net/?s=${code}`,
                    selectors: "#main .entry-title a",
                },
                {
                    url: `https://duckduckgo.com/?q=${code} site:blogjav.net`,
                    selectors: "#links h2 a",
                },
                {
                    url: `https://www.google.com/search?q=${code} site:blogjav.net`,
                    selectors: "#rso .g .yuRUbf > a",
                },
            ];
            let list = await Promise.allSettled(requests.map(item => request(item.url)));
  
            const { regex } = codeParse(code);
            code = code.toUpperCase();
            let url = "";
            for (let index = 0, { length } = requests; index < length; index++) {
                const { status, value } = list[index];
                if (status !== "fulfilled" || !value) continue;
  
                const href = Array.from(value?.querySelectorAll(requests[index].selectors) ?? []).find(item => {
                    const str = item.textContent.toUpperCase();
                    return regex.test(str) && str.includes(code);
                })?.href;
                if (!href) continue;
  
                url = href;
                break;
            }
            if (!url) return re;
  
            list = await Promise.allSettled([
                request(url),
                request(`http://webcache.googleusercontent.com/search?q=cache:${url}`),
            ]);
            url = "";
            for (let index = 0, { length } = list; index < length; index++) {
                const { status, value } = list[index];
                if (status !== "fulfilled" || !value) continue;
  
                let img = value.querySelector("#main .entry-content a img");
                if (!img) continue;
  
                img = img.getAttribute("data-src") ?? img.getAttribute("data-lazy-src");
                if (!img) continue;
  
                url = img.replace("//t", "//img").replace("thumbs", "images");
                break;
            }
            re.img = url;
            return re;
        }
        static async fetchJavStore(code) {
            if (FC2_REGEX.test(code)) code = code.replace("-PPV-", "PPV ");
            const re = { img: "" };
  
            let res = await request(`https://javstore.net/search/${code}.html`);
            if (!res) return re;
  
            res = res.querySelectorAll("#content_news li > a");
            if (!res.length) return re;
  
            const { regex } = codeParse(code);
            code = code.toUpperCase();
            res = Array.from(res).find(item => {
                const str = item.title.toUpperCase();
                return str.includes(code) && regex.test(str) && item.querySelector("img").src.startsWith("https");
            })?.href;
            if (!res) return re;
  
            res = await request(res);
            if (!res) return re;
  
            const img = res.querySelector(".news > a")?.href;
            if (img && /\.(jpg|png)$/i.test(img)) re.img = img;
            return re;
        }
        static async fetchVideoByGuess({ code, isVR, cid }) {
            const re = { video: "" };
            if (!code && !cid) return re;
  
            const HOST = `https://cc3001.dmm.co.jp/${isVR ? "vrsample" : "litevideo/freepv"}/`;
            const SUFFIX = isVR ? "vrlite" : "_dmb_w";
            const list = [];
  
            const parseUrl = (prefix, num = "") => {
                return `${HOST}${prefix[0]}/${prefix.substring(0, 3)}/${prefix}${num}/${prefix}${num}${SUFFIX}.mp4`;
            };
  
            if (code) {
                const [prefix, num = ""] = code.toLowerCase().split(/-|_/);
                const matchList = [
                    { prefix: ["fera", "fuga", "jrze", "mesu"], add: "h_086" },
                    { prefix: ["spz", "udak", "ofku"], add: "h_254" },
                    { prefix: ["abp", "ppt", "abw"], add: "118" },
                    { prefix: ["mds", "scpx"], add: "84" },
                    { prefix: ["shind"], add: "h_1560" },
                    { prefix: ["pydvr"], add: "h_1321" },
                    { prefix: ["meko"], add: "h_1160" },
                    { prefix: ["fgan"], add: "h_1440" },
                    { prefix: ["spro"], add: "h_1594" },
                    { prefix: ["hzgb"], add: "h_1100" },
                    { prefix: ["stcv"], add: "h_1616" },
                    { prefix: ["skmj"], add: "h_1324" },
                    { prefix: ["haru"], add: "h_687" },
                    { prefix: ["fone"], add: "h_491" },
                    { prefix: ["fsvr"], add: "h_955" },
                    { prefix: ["jukf"], add: "h_227" },
                    { prefix: ["rebd"], add: "h_346" },
                    { prefix: ["ktra"], add: "h_094" },
                    { prefix: ["supa"], add: "h_244" },
                    { prefix: ["zex"], add: "h_720" },
                    { prefix: ["pym"], add: "h_283" },
                    { prefix: ["hz"], add: "h_113" },
                    { prefix: ["dtvr"], add: "24" },
                    { prefix: ["umd"], add: "125" },
                    { prefix: ["gvg"], add: "13" },
                    { prefix: ["t28"], add: "55" },
                    { prefix: ["lol"], add: "12" },
                    { prefix: ["dv"], add: "53" },
                ];
                const add = matchList.find(item => item.prefix.includes(prefix))?.add ?? "1";
                list.push(parseUrl(prefix, num));
                list.push(parseUrl(`${add}${prefix}`, num));
                if (num) {
                    list.push(parseUrl(prefix, `00${num}`));
                    list.push(parseUrl(`${add}${prefix}`, `00${num}`));
                }
            }
            if (cid) {
                list.push(parseUrl(cid));
                list.push(parseUrl(cid.replace("00", "")));
            }
  
            const res = await Promise.allSettled(unique(list).map(item => request(item, {}, "HEAD")));
            for (let index = 0, { length } = res; index < length; index++) {
                const { status, value } = res[index];
                if (status !== "fulfilled" || !value) continue;
  
                re.video = list[index];
                break;
            }
            return re;
        }
        static async fetchVideoByStudio({ code, studio }) {
            const re = { video: "" };
            if (!studio) return re;
  
            code = code.toLowerCase();
            const matchList = [
                {
                    name: "東京熱",
                    match: `https://my.cdn.tokyo-hot.com/media/samples/${REP}.mp4`,
                },
                {
                    name: "カリビアンコム",
                    match: `https://smovie.caribbeancom.com/sample/movies/${REP}/720p.mp4`,
                },
                {
                    name: "一本道",
                    match: `http://smovie.1pondo.tv/sample/movies/${REP}/1080p.mp4`,
                },
                {
                    name: "HEYZO",
                    trans: code => code.replace(/HEYZO-/gi, ""),
                    match: `https://sample.heyzo.com/contents/3000/${REP}/heyzo_hd_${REP}_sample.mp4`,
                },
                {
                    name: "天然むすめ",
                    match: `https://smovie.10musume.com/sample/movies/${REP}/720p.mp4`,
                },
                {
                    name: "パコパコママ",
                    match: `https://fms.pacopacomama.com/hls/sample/pacopacomama.com/${REP}/720p.mp4`,
                },
            ];
            let res = matchList.find(({ name }) => name === studio);
            if (!res) return re;
  
            res = res.match.replaceAll(REP, res.trans ? res.trans(code) : code);
            if (await request(res, {}, "HEAD")) re.video = res;
            return re;
        }
        // fetch video by guess for list
        static async fetchVBGFL(code) {
            const re = { video: "" };
  
            code = code.replace(/HEYZO-/gi, "").toLowerCase();
            const list = [
                `https://my.cdn.tokyo-hot.com/media/samples/${code}.mp4`,
                `https://smovie.caribbeancom.com/sample/movies/${code}/720p.mp4`,
                `http://smovie.1pondo.tv/sample/movies/${code}/1080p.mp4`,
                `https://sample.heyzo.com/contents/3000/${code}/heyzo_hd_${code}_sample.mp4`,
                `https://smovie.10musume.com/sample/movies/${code}/720p.mp4`,
                `https://fms.pacopacomama.com/hls/sample/pacopacomama.com/${code}/720p.mp4`,
            ];
  
            const res = await Promise.allSettled(list.map(item => request(item, {}, "HEAD")));
            for (let index = 0, { length } = res; index < length; index++) {
                const { status, value } = res[index];
                if (status !== "fulfilled" || !value) continue;
  
                re.video = list[index];
                break;
            }
            return re;
        }
        // fetch video by local
        static async fetchVBL({ node, isVR }) {
            const re = { video: "" };
  
            let res = await request(node.href);
            if (!res) return re;
  
            if (Domain === "JavBus") {
                let cid = res.querySelector("#sample-waterfall a.sample-box")?.href;
                cid = cid?.includes("pics.dmm.co.jp") ? cid.split("/").at(-2) : "";
                if (!cid) return re;
  
                res = await this.fetchVideoByGuess({ cid, isVR });
                if (res.video) re.video = res.video;
            }
            if (Domain === "JavDB") {
                res = res.querySelector("#preview-video source")?.getAttribute("src") ?? "";
                if (res && (await request(res, {}, "HEAD"))) re.video = res;
            }
  
            return re;
        }
        static async fetchJavSpyl(code) {
            const re = { video: "" };
  
            let res = await request("https://v2.javspyl.tk/api/", { ID: code }, "POST", {
                headers: { origin: "https://javspyl.tk" },
                responseType: "json",
            });
            if (!res) return re;
  
            res = res?.info?.url;
            if (!res || /\.m3u8?$/i.test(res)) return re;
  
            res = res.includes("//") ? res : `https://${res}`;
            if (await request(res, {}, "HEAD")) re.video = res;
            return re;
        }
        static async fetchAVPreview(code) {
            const re = { video: "" };
  
            let res = await request(`https://avpreview.com/zh/search?keywords=${code}`);
            if (!res) return re;
  
            res = Array.from(res.querySelectorAll(".container .videobox"))
                .find(item => code === item.querySelector("h2 strong")?.textContent)
                ?.querySelector("a")
                ?.getAttribute("href");
            if (!res) return re;
  
            res = await request(
                "https://avpreview.com/API/v1.0/index.php",
                {
                    system: "videos",
                    action: "detail",
                    contentid: res.split("/").at(-1),
                    sitecode: "avpreview",
                    ip: "",
                    token: "",
                },
                "GET",
                { responseType: "json" }
            );
            if (!res) return re;
  
            res = res?.videos?.trailer?.replace("/hlsvideo/", "/litevideo/")?.replace("/playlist.m3u8", "");
            if (!res) return re;
  
            const contentId = res.split("/").at(-1);
            res = [
                `${res}/${contentId}_dmb_w.mp4`,
                `${res}/${contentId}_mhb_w.mp4`,
                `${res}/${contentId}_dm_w.mp4`,
                `${res}/${contentId}_sm_w.mp4`,
            ];
            const list = await Promise.allSettled(res.map(item => request(item, {}, "HEAD")));
            for (let index = 0, { length } = list; index < length; index++) {
                const { status, value } = list[index];
                if (status !== "fulfilled" || !value) continue;
  
                re.video = res[index];
                break;
            }
            return re;
        }
        static async fetchFC2(code) {
            code = code.split("-").at(-1);
  
            const HOST = "https://adult.xiaojiadianmovie.be/";
            const re = { video: "" };
  
            let res = await request(`${HOST}article/${code}/`);
            if (!res) return re;
  
            res = res.head
                .querySelector("script:last-child")
                .innerHTML?.match(/(?<=ae', ').*?(?=')/)
                ?.at(0);
            if (!res) return re;
  
            res = await request(`${HOST}api/v2/videos/${code}/sample`, {}, "GET", {
                responseType: "json",
                headers: { "X-FC2-Contents-Access-Token": res },
            });
            if (res?.path && (await request(res.path, {}, "HEAD"))) re.video = res.path;
            return re;
        }
        static async fetchNetflav(code) {
            const HOST = "https://netflav.com";
            const re = { player: [] };
  
            let res = await request(`${HOST}/search?type=title&keyword=${code}`);
            if (!res) return re;
  
            res = res.querySelectorAll(".grid_root .grid_cell");
            if (!res.length) return re;
  
            const { regex } = codeParse(code);
            code = code.toUpperCase();
            res = Array.from(res)
                .find(item => {
                    const str = item.querySelector(".grid_title").textContent.toUpperCase();
                    return str.includes(code) && regex.test(str);
                })
                ?.querySelector("a")
                ?.getAttribute("href");
            if (!res) return re;
  
            res = await request(`${HOST}${res}`);
            if (!res) return re;
  
            res = res.querySelector("#__NEXT_DATA__")?.textContent;
            if (!res) return re;
  
            res = JSON.parse(res)?.props?.initialState?.video?.data?.srcs;
            if (!res?.length) return re;
  
            const matchList = [
                {
                    regex: /\/\/(mm9842\.com|www\.avple\.video|asianclub\.tv)/,
                    parse: async url => {
                        const [protocol, href] = url.split("//");
                        const [host, ...pathname] = href.split("/");
  
                        const res = await request(
                            `${protocol}//${host}/api/source/${pathname.pop()}`,
                            { r: "", d: host },
                            "POST"
                        );
  
                        if (!res?.success) return [];
                        return (res?.data ?? []).map(({ file, label = "320p", type }) => {
                            return { src: file, title: label, type: `video/${type}` };
                        });
                    },
                },
                {
                    regex: /\/\/(embedgram\.com|vidoza\.net)/,
                    parse: async url => {
                        const res = await request(url);
                        if (!res) return [];
                        return Array.from(res?.querySelectorAll("video source") ?? []).map(
                            ({ src, title = "320p", type }) => {
                                return { src, title, type };
                            }
                        );
                    },
                },
            ];
            res = await Promise.allSettled(res.map(url => matchList.find(({ regex }) => regex.test(url))?.parse(url)));
            for (let index = 0, { length } = res; index < length; index++) {
                const { status, value } = res[index];
                if (status === "fulfilled" && value?.length) re.player = re.player.concat(value);
            }
            return re;
        }
        static async fetchTranslate(str) {
            const re = { title: "" };
  
            const res = await request(
                "https://www.google.com/async/translate?vet=12ahUKEwixq63V3Kn3AhUCJUQIHdMJDpkQqDh6BAgCECw..i&ei=CbNjYvGCPYLKkPIP05O4yAk&yv=3",
                {
                    async: `translate,sl:auto,tl:zh-CN,st:${encodeURIComponent(
                        str.trim()
                    )},id:1650701080679,qc:true,ac:false,_id:tw-async-translate,_pms:s,_fmt:pc`,
                },
                "POST",
                { responseType: "" }
            );
            if (res) re.title = res?.querySelector("#tw-answ-target-text")?.textContent ?? "";
  
            return re;
        }
        static async _fetchMagnet(code, { site, host, search, selectors, filter }) {
            const key = `${site.substring(0, 3).toLowerCase()}_magnet`;
            const re = { [key]: [] };
  
            let res = await request(`${host}${search}`);
            if (!res) return re;
  
            res = res.querySelectorAll(selectors);
            if (!res.length) return re;
  
            const { regex } = codeParse(code);
            for (const item of res) {
                const name = (filter.name(item) ?? "").replace(/[\u200B-\u200D\uFEFF]/g, "");
                if (!regex.test(name)) continue;
  
                const size = filter.size(item);
                let href = filter.href(item);
                if (href && !href.includes("//")) href = `${host}${href.replace(/^\//, "")}`;
  
                re[key].push({
                    name,
                    zh: ZH_REGEX.test(name),
                    link: filter.link(item).split("&")[0],
                    size,
                    bytes: transToBytes(size),
                    date: filter.date(item),
                    href,
                    from: site,
                });
            }
            return re;
        }
        static fetchSukebei(code) {
            return this._fetchMagnet(code, {
                site: "Sukebei",
                host: "https://sukebei.nyaa.si/",
                search: `?f=0&c=0_0&q=${code}`,
                selectors: ".table-responsive table tbody tr",
                filter: {
                    name: e => e.querySelector("td:nth-child(2) a").textContent,
                    link: e => e.querySelector("td:nth-child(3) a:last-child").href,
                    size: e => e.querySelector("td:nth-child(4)").textContent,
                    date: e => e.querySelector("td:nth-child(5)").textContent.split(" ")[0],
                    href: e => e.querySelector("td:nth-child(2) a").getAttribute("href"),
                },
            });
        }
        static fetchBTSOW(code) {
            return this._fetchMagnet(code, {
                site: "BTSOW",
                host: "https://btsow.com/",
                search: `search/${code}`,
                selectors: ".data-list .row:not(.hidden-xs)",
                filter: {
                    name: e => e.querySelector(".file").textContent,
                    link: e => `magnet:?xt=urn:btih:${e.querySelector("a").href.split("/").pop()}`,
                    size: e => e.querySelector(".size").textContent,
                    date: e => e.querySelector(".date").textContent,
                    href: e => e.querySelector("a").getAttribute("href"),
                },
            });
        }
        static fetchBTDigg(code, index = 0) {
            return this._fetchMagnet(code, {
                site: "BTDigg",
                host: `https://${index ? "www." : ""}btdig.com/`,
                search: `search?order=0&q=${code}`,
                selectors: ".one_result",
                filter: {
                    name: e => e.querySelector(".torrent_name").textContent,
                    link: e => e.querySelector(".torrent_magnet a").href,
                    size: e => e.querySelector(".torrent_size").textContent,
                    date: e => e.querySelector(".torrent_age").textContent,
                    href: e => e.querySelector(".torrent_name a").href,
                },
            });
        }
        static async fetchMGS({ code, title }) {
            const HOST = "https://www.mgstage.com";
            const re = { mgs_score: [], video: "" };
  
            let res = await request(`${HOST}/search/cSearch.php?search_word=${title}&list_cnt=120`);
            if (!res) return re;
  
            res = res.querySelectorAll(".rank_list li");
            if (!res.length) return re;
  
            const { regex } = codeParse(code);
            code = code.toUpperCase();
            res = Array.from(res).find(item => {
                const str = item.querySelector("a").getAttribute("href").toUpperCase();
                return str.includes(code) && regex.test(str);
            });
            if (!res) return re;
  
            let [score, video] = await Promise.allSettled([
                request(`${HOST}${res.querySelector("a").getAttribute("href")}`),
                request(
                    `${HOST}${res
                        .querySelector(".sample_movie_btn a")
                        .getAttribute("href")
                        .replace("player.html/", "Respons.php?pid=")}`,
                    {},
                    "GET",
                    { responseType: "json" }
                ),
            ]);
            if (score.status === "fulfilled" && score.value) {
                score = score.value.querySelector(".detail_data .review")?.textContent?.match(NUM_REGEX);
                if (score?.length) re.mgs_score.push({ score: score[0], total: 5, num: score[1], from: "MGS" });
            }
            if (video.status === "fulfilled" && video.value) {
                video = video.value?.url.split("?")[0].replace("ism/request", "mp4");
                if (await request(video, {}, "HEAD")) re.video = video;
            }
            return re;
        }
        static async fetchLib(code) {
            const HOST = "https://www.javlibrary.com/cn/";
            const re = { lib_score: [], star: [] };
  
            let res = await request(`${HOST}vl_searchbyid.php?keyword=${code}`);
            if (!res) return re;
  
            if (res.querySelector(".videothumblist")) {
                res = res.querySelectorAll(".videothumblist .videos .video > a");
                if (!res.length) return re;
  
                const { regex } = codeParse(code);
                code = code.toUpperCase();
                res = Array.from(res).find(({ title }) => {
                    const str = title.toUpperCase();
                    return str.includes(code) && regex.test(str);
                });
                if (!res) return re;
  
                res = await request(`${HOST}${res.getAttribute("href")}`);
            }
  
            const score = res.querySelector("#video_review .text .score")?.textContent?.replace(/\(|\)/g, "") ?? "";
            if (score) re.lib_score.push({ score, total: 10, from: "JavLibrary" });
  
            re.star = Array.from(res.querySelectorAll("#video_cast .text .star")).map(item => item.textContent);
            return re;
        }
        static async fetchDMM({ code, title }) {
            const re = { fetchVideo: "", fetchInfo: "" };
  
            let res = await request(`https://jav.land/tw/id_search.php?keys=${code.toUpperCase()}`);
            if (!res) return re;
  
            res = res.querySelector("table.videotextlist tbody tr");
            if (!res) return re;
  
            res = res.querySelectorAll("td");
            if (!res?.length || res[0].textContent !== "內容 ID:") return re;
            const cid = res[1].textContent;
  
            re.fetchVideo = async () => {
                const result = { video: "" };
  
                const first = cid[0];
                const second = cid.substring(0, 3);
                const list = [
                    `https://cc3001.dmm.co.jp/litevideo/freepv/${first}/${second}/${cid}/${cid}_dmb_w.mp4`,
                    `https://cc3001.dmm.co.jp/litevideo/freepv/${first}/${second}/${cid}/${cid}_mhb_w.mp4`,
                    `https://cc3001.dmm.co.jp/litevideo/freepv/${first}/${second}/${cid}/${cid}_dm_w.mp4`,
                    `https://cc3001.dmm.co.jp/litevideo/freepv/${first}/${second}/${cid}/${cid}_sm_w.mp4`,
                    `https://cc3001.dmm.co.jp/vrsample/${first}/${second}/${cid}/${cid}vrlite.mp4`,
                ];
  
                const res = await Promise.allSettled(list.map(item => request(item, {}, "HEAD")));
                for (let index = 0, { length } = res; index < length; index++) {
                    const { status, value } = res[index];
                    if (status !== "fulfilled" || !value) continue;
  
                    result.video = list[index];
                    break;
                }
                return result;
            };
  
            re.fetchInfo = async () => {
                const result = { dmm_score: [], star: [], video: "" };
  
                const res = await request(`https://www.dmm.co.jp/digital/videoa/-/detail/=/cid=${cid}/`, {}, "GET", {
                    headers: { "accept-language": "ja-JP" },
                });
                if (!res) return result;
  
                let params = res.head.querySelector("script[type='application/ld+json']")?.textContent;
                if (!params) return result;
  
                params = JSON.parse(params);
                if (!params?.name || (title && !title.includes(params.name))) return result;
  
                if (params.aggregateRating) {
                    result.dmm_score.push({
                        score: params.aggregateRating.ratingValue,
                        total: 5,
                        num: params.aggregateRating.ratingCount,
                        from: "DMM",
                    });
                }
                result.star = Array.from(res.querySelectorAll("#performer a")).map(item => item.textContent);
                const video = params.subjectOf?.contentUrl;
                if (video && (await request(video, {}, "HEAD"))) result.video = video;
                return result;
            };
  
            return re;
        }
        static async fetchDB(code) {
            const HOST = "https://javdb.com";
            const re = { db_score: [], star: [], video: "", sub: [] };
  
            let res = await request(`${HOST}/search?q=${code}&sb=0`);
            if (!res) return re;
  
            res = res.querySelectorAll(".movie-list .item a");
            if (!res.length) return re;
  
            const { regex } = codeParse(code);
            code = code.toUpperCase();
            res = Array.from(res).find(item => {
                const str = item.querySelector("strong").textContent.toUpperCase();
                return str.includes(code) && regex.test(str);
            });
            if (!res) return re;
  
            const href = `${HOST}${res.getAttribute("href")}`;
            res = await request(href);
            if (!res) return re;
  
            const scoreReg = /評分|Rating/;
            const starReg = /演員|Actor/;
            for (const item of res.querySelectorAll(".movie-panel-info .panel-block")) {
                let [label, value] = item.querySelectorAll("strong, .value");
                if (!label || !value) continue;
  
                label = label.textContent;
                value = value.textContent;
                if (scoreReg.test(label)) {
                    const [score, num] = value.match(NUM_REGEX);
                    re.db_score.push({ score, total: 5, num, from: "JavDB" });
                    continue;
                }
                if (!starReg.test(label)) continue;
  
                re.star = value
                    .split("\n")
                    .filter(item => item.includes("♀"))
                    .map(item => item.replace("♀", "").trim());
            }
  
            if (res.querySelector("a.preview-video-container")) {
                const video = res.querySelector("#preview-video source")?.src || "";
                if (video && (await request(video, {}, "HEAD"))) re.video = video;
            }
  
            for (const item of res.querySelectorAll("#magnets-content .item")) {
                const first = item.querySelector("a");
                if (!first) continue;
  
                const size = first.querySelector(".meta")?.textContent?.trim() ?? "";
                re.sub.push({
                    from: "JavDB",
                    href,
                    name: first.querySelector(".name").textContent,
                    link: first.href.split("&")[0],
                    size,
                    bytes: transToBytes(size),
                    zh: !!first.querySelector(".tag.is-warning.is-small.is-light"),
                    date: item.querySelector(".time")?.textContent ?? "",
                });
            }
            return re;
        }
        static async _driveSearch(params, keys = []) {
            if (typeof params === "string") params = { search_value: params };
  
            const res = await request(
                "https://webapi.115.com/files/search",
                {
                    offset: 0,
                    limit: 11500,
                    date: "",
                    aid: 1,
                    cid: 0,
                    pick_code: "",
                    type: 4,
                    source: "",
                    format: "json",
                    o: "user_ptime",
                    asc: 0,
                    star: "",
                    suffix: "",
                    ...params,
                },
                "GET",
                { responseType: "json" }
            );
            if (!res) return;
            if (!res.state) return notify({ title: res.error });
  
            return res.data.map(({ n, pc, fid, cid, ...item }) => {
                const _item = { n, pc, fid, cid };
                for (const key of keys) _item[key] = item[key];
                return _item;
            });
        }
        static async _driveCid(name, type) {
            let res = await this.driveFile();
            if (!res) return;
            if (!res.state) return notify({ title: res?.errNo === 20130827 ? "文件排序不支持" : res.error });
  
            res = res.data.find(({ n }) => n === name)?.cid ?? "";
            if (res || type === "find") return res;
  
            res = await request("https://webapi.115.com/files/add", { pid: 0, cname: name }, "POST");
            if (!res) return;
            if (!res.state) return notify({ title: res.error });
            return res?.cid ?? "";
        }
        static driveFile(params = {}) {
            if (typeof params === "string") params = { cid: params };
  
            return request(
                "https://webapi.115.com/files",
                {
                    aid: 1,
                    cid: 0,
                    o: "user_ptime",
                    asc: 0,
                    offset: 0,
                    show_dir: 1,
                    limit: 11500,
                    code: "",
                    scid: "",
                    snap: 0,
                    natsort: 1,
                    record_open_time: 1,
                    source: "",
                    format: "json",
                    ...params,
                },
                "GET",
                { responseType: "json" }
            );
        }
        static async driveVideo(cid, keys = []) {
            if (!cid) return;
  
            const res = await this.driveFile({ cid, custom_order: 0, star: "", suffix: "", type: 4 });
            if (!res?.data) return;
  
            return res.data.map(({ n, pc, fid, cid, t, ...item }) => {
                const _item = { n, pc, fid, cid, t };
                for (const key of keys) _item[key] = item[key];
                return _item;
            });
        }
        static async driveSign() {
            const res = await request(
                "http://115.com/",
                { ct: "offline", ac: "space", _: new Date().getTime() },
                "GET",
                {
                    responseType: "json",
                }
            );
            if (res?.state) return { sign: res.sign, time: res.time };
        }
        static driveAddTask({ url, wp_path_id, sign, time }) {
            return request(
                "https://115.com/web/lixian/?ct=lixian&ac=add_task_url",
                { url, wp_path_id, sign, time },
                "POST"
            );
        }
        static driveRename(res) {
            const data = {};
            for (const { fid, file_name } of res) data[`files_new_name[${fid}]`] = file_name;
  
            return request("https://webapi.115.com/files/batch_rename", data, "POST");
        }
        static driveClear({ pid, fids }) {
            const data = { pid, ignore_warn: 1 };
            fids.forEach(({ fid, cid }, index) => {
                data[`fid[${index}]`] = fid ?? cid;
            });
  
            return request("https://webapi.115.com/rb/delete", data, "POST");
        }
        static driveInitUpload(params) {
            return request("https://uplb.115.com/3.0/sampleinitupload.php", { userid: "", ...params }, "POST");
        }
        static driveUpload({ host, object, policy, accessid, callback, signature }, blob, name) {
            const formdata = new FormData();
            formdata.append("name", name);
            formdata.append("key", object);
            formdata.append("policy", policy);
            formdata.append("OSSAccessKeyId", accessid);
            formdata.append("success_action_status", 200);
            formdata.append("callback", callback);
            formdata.append("signature", signature);
            formdata.append("file", blob, name);
            return GM_xmlhttpRequest({ method: "POST", url: host, data: formdata });
        }
        static async driveLabel() {
            const res = await request("https://webapi.115.com/label/list?keyword=&limit=11500", {}, "GET", {
                responseType: "json",
            });
            if (res?.state) return res.data.list;
        }
        static driveTag({ file_ids, file_label }) {
            return request("https://webapi.115.com/files/batch_label", { file_ids, file_label, action: "add" }, "POST");
        }
        static driveDetail(fid) {
            return request(`https://webapi.115.com/category/get?cid=${fid}`, {}, "GET", {
                responseType: "json",
            });
        }
    }
    class Common {
        menus = [
            {
                title: "站点设置",
                key: "global",
                prefix: "G",
                options: [
                    {
                        name: "暗黑模式",
                        key: "DARK",
                        type: "switch",
                        info: "常用页面暗黑模式",
                        defaultVal: window.matchMedia("(prefers-color-scheme: dark)").matches,
                        hotkey: "d",
                    },
                    {
                        name: "快捷搜索",
                        key: "SEARCH",
                        type: "switch",
                        info: "快捷键 <kbd>/</kbd> 获取搜索框焦点，<kbd>Ctrl</kbd> + <kbd>/</kbd> 快速搜索粘贴板首项",
                        defaultVal: true,
                        hotkey: "k",
                    },
                    {
                        name: "点击事件",
                        key: "CLICK",
                        type: "switch",
                        info: "<code>影片</code> / <code>演员</code> / <code>站点跳转</code> 点击新窗口 (左键前台，右键后台) 打开",
                        defaultVal: true,
                        hotkey: "c",
                    },
                ],
            },
            {
                title: "列表页设置",
                key: "list",
                prefix: "L",
                options: [
                    {
                        name: "预览替换",
                        key: "MIT",
                        type: "switch",
                        info: "影片预览图替换为封面图",
                        defaultVal: true,
                    },
                    {
                        name: "悬停预览",
                        key: "MV",
                        type: "number",
                        info: '设置封面悬停时长 (ms) 以预览视频，建议 300+，0 禁用预览<br>仅 <strong>预览替换</strong> / <strong>(JavDB)大封面</strong> 模式下生效，获取自 <a href="https://javspyl.tk/" class="link-primary">JavSpyl</a> / <a href="https://avpreview.com/zh/" class="link-primary">AVPreview</a> / <a href="https://adult.xiaojiadianmovie.be/" class="link-primary">FC2</a>',
                        placeholder: "仅支持整数 ≥ 0",
                        defaultVal: 300,
                    },
                    {
                        name: "标题等高",
                        key: "MTH",
                        type: "switch",
                        info: "影片标题强制等高",
                        defaultVal: true,
                    },
                    {
                        name: "标题最大行",
                        key: "MTL",
                        type: "number",
                        info: "影片标题最大显示行数，超出省略。0 不限制 (等高模式下最小有效值 1)",
                        placeholder: "仅支持整数 ≥ 0",
                        defaultVal: 2,
                    },
                    {
                        name: "滚动加载",
                        key: "SCROLL",
                        type: "switch",
                        info: "滚动加载下一页",
                        defaultVal: true,
                    },
                    {
                        name: "合并列表",
                        key: "MERGE",
                        type: "textarea",
                        info: "列表名不可重复，同一列表内地址不可重复 (仅支持影片列表相对地址)<br>合并列表每页按 <code>影片评分</code> (如有) > <code>影片日期</code> > <code>填写顺序</code> 综合排序，并自动去重<br>多列表需以空行分隔",
                        placeholder: "[列表1]\n/genre/28#连裤袜\n/star/two#星宮一花\n\n[列表2]\n/\n/uncensored",
                        defaultVal: "",
                    },
                    {
                        name: "影片筛选",
                        key: "FILTER",
                        type: "textarea",
                        info: '支持 <code>[code]</code> / <code>[title]</code> / <code>[score]</code> / <code>[tags]</code> 分组的 <code>屏蔽</code> (优先) & <code>高亮</code> 规则设置<br>规则类型默认为屏蔽规则，高亮需以 <code>^</code> 开头标识<br>规则语法默认全字符查找，支持追加参数：<code>#start</code> 仅匹配开头，<code>#end</code> 仅匹配结尾<br>规则语法兼容 <a href="https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Regular_Expressions" class="link-primary">正则</a> (不同时支持追加参数)，格式如 <code>reg:/^stars-/i</code><br><code>[score]</code> 仅 <strong>JavDB</strong>，提取格式如 <code>5.0分, 由6人評價</code><br><code>[tags]</code> 提取格式如 <code>高清,字幕,3天前新種</code><br>格式参考『<strong>合并列表</strong>』',
                        placeholder: "[title]\n排泄\n失禁\n\n[code]\n^SSIS-#start\nIPX#start",
                        defaultVal: "",
                    },
                ],
            },
            {
                title: "详情页设置",
                key: "movie",
                prefix: "M",
                options: [
                    {
                        name: "在线资源",
                        key: "RES",
                        type: "input",
                        info: '自定义资源配置，支持参数：<br><code>#img</code> 预览大图，<code>#video</code> 视频预览，<code>#player</code> 在线视频<br>获取自 <a href="https://blogjav.net/" class="link-primary">BlogJav</a> / <a href="https://javstore.net/" class="link-primary">JavStore</a>，<a href="https://javspyl.tk/" class="link-primary">JavSpyl</a> / <a href="https://avpreview.com/zh/" class="link-primary">AVPreview</a> / <a href="https://adult.xiaojiadianmovie.be/" class="link-primary">FC2</a> / <a href="https://www.mgstage.com/" class="link-primary">MGS</a> / <a href="https://www.dmm.co.jp/" class="link-primary">DMM</a> / <a href="https://javdb.com/" class="link-primary">JavDB</a>，<a href="https://netflav.com/" class="link-primary">Netflav</a>',
                        placeholder: "为空时展示页面默认",
                        defaultVal: "#video#img#player",
                    },
                    {
                        name: "快捷复制",
                        key: "COPY",
                        type: "switch",
                        info: "为 <code>标题</code> / <code>番号</code> / <code>演员</code> (右键) / <code>磁链</code> 提供快捷复制",
                        defaultVal: true,
                    },
                    {
                        name: "标题机翻",
                        key: "TITLE",
                        type: "switch",
                        info: '翻自 <a href="https://translate.google.com/" class="link-primary">Google</a>',
                        defaultVal: true,
                    },
                    {
                        name: "演员匹配",
                        key: "STAR",
                        type: "switch",
                        info: '如无，获取自 <a href="https://www.javlibrary.com/cn/" class="link-primary">JavLibrary</a> / <a href="https://www.dmm.co.jp/" class="link-primary">DMM</a> / <a href="https://javdb.com/" class="link-primary">JavDB</a>',
                        defaultVal: true,
                    },
                    {
                        name: "影片评分",
                        key: "SCORE",
                        type: "input",
                        info: '自定义评分配置，支持参数：<br><code>#db</code> 获取自 <a href="https://javdb.com/" class="link-primary">JavDB</a>，<code>#lib</code> 获取自 <a href="https://www.javlibrary.com/cn/" class="link-primary">JavLibrary</a>，<code>#dmm</code> 获取自 <a href="https://www.dmm.co.jp/" class="link-primary">DMM</a>，<code>#mgs</code> 获取自 <a href="https://www.mgstage.com/" class="link-primary">MGS</a>',
                        placeholder: "为空时展示页面默认",
                        defaultVal: "#db#lib#dmm",
                    },
                    {
                        name: "站点跳转",
                        key: "JUMP",
                        type: "textarea",
                        info: `番号关键词以 <code>${REP}</code> 表示<br>支持追加参数：<code>#query</code> 预查询资源及字幕，<code>#jump</code> 跳转后自动匹配首项<br>格式参考『<strong>合并列表</strong>』`,
                        placeholder: `[数据库]\nhttps://javdb.com/search?q=${REP}&f=all#jump\nhttps://www.javlibrary.com/cn/vl_searchbyid.php?keyword=${REP}\n\n[在线视频]\nhttps://www3.bestjavporn.com/search/${REP}/#query#jump\nhttps://jable.tv/search/${REP}/#query#jump\n\n[磁力链接]\nhttps://btdig.com/search?q=${REP}#query\nhttps://idope.se/torrent-list/${REP}/#query`,
                        defaultVal: `[跳转]\nhttps://www.JavLibrary.com/cn/vl_searchbyid.php?keyword=${REP}#query#jump\nhttps://${
                            Domain === "JavDB" ? `www.JavBus.com/search/${REP}` : `JavDB.com/search?f=all&q=${REP}&sb=0`
                        }#query#jump`,
                    },
                    {
                        name: "磁链最大行",
                        key: "LINE",
                        type: "number",
                        info: "磁力链接最大显示行数，超出以滚动显示。0 不限制",
                        placeholder: "仅支持整数 ≥ 0",
                        defaultVal: 10,
                    },
                    {
                        name: "字幕筛选",
                        key: "SUB",
                        type: "switch",
                        info: '替换为 <a href="https://javdb.com/" class="link-primary">JavDB</a> 磁链数据',
                        defaultVal: false,
                    },
                    {
                        name: "磁链排序",
                        key: "SORT",
                        type: "switch",
                        info: "综合排序 <code>字幕</code> ＞ <code>大小</code> ＞ <code>日期</code>",
                        defaultVal: true,
                    },
                    {
                        name: "磁链搜索",
                        key: "MAGNET",
                        type: "input",
                        info: '自定义搜索配置并自动去重，支持参数：<br><code>#suk</code> 获取自 <a href="https://sukebei.nyaa.si/" class="link-primary">Sukebei</a>，<code>#bts</code> 获取自 <a href="https://btsow.com/" class="link-primary">BTSOW</a>，<code>#btd</code> 获取自 <a href="https://btdig.com/" class="link-primary">BTDigg</a>',
                        placeholder: "为空时展示页面默认",
                        defaultVal: "#btd#bts#suk",
                    },
                ],
            },
            {
                title: "115 相关",
                key: "drive",
                prefix: "D",
                options: [
                    {
                        name: "网盘资源",
                        key: "MATCH",
                        type: "switch",
                        info: '<strong>需要 <a href="https://115.com/" class="link-primary">网盘</a> 已登录，并调整文件排序方式为 <code>修改时间</code></strong><br>列表页：网盘资源匹配<br>详情页：网盘资源匹配 & (一键) 离线按钮开关<br>(完整体验建议允许弹窗通知权限)',
                        defaultVal: true,
                    },
                    {
                        name: "列表离线",
                        key: "LOL",
                        type: "switch",
                        info: "影片列表支持简易『<strong>一键离线</strong>』执行动作：<br>『<strong>磁链搜索</strong>』『<strong>磁链排序</strong>』『<strong>离线验证</strong>』『<strong>最大失败数</strong>』『<strong>离线清理</strong>』『<strong>文件重命名</strong>』",
                        defaultVal: true,
                    },
                    {
                        name: "下载目录",
                        key: "CID",
                        type: "input",
                        info: "设置离线下载目录 <strong>cid</strong> 或 <strong>动态目录</strong> (未找到时动态创建)，建议直接填写 <strong>cid</strong> 效率更高<br><strong>动态目录</strong> 支持填写 <strong>目录名称</strong> 和 <strong>动态参数</strong>：<br><code>${#star}</code> (首位) 女演员<br><code>${#series}</code> 系列<br><code>${#studio}</code> 制造商 / 片商 / 卖家<br><strong>目录名称</strong> & <strong>动态参数</strong> 可组合使用，如 <code>${#series/#star/云下载}</code>",
                        placeholder: "cid 或 动态目录",
                        defaultVal: "${云下载}",
                    },
                    {
                        name: "离线验证",
                        key: "VERIFY",
                        type: "number",
                        info: "添加离线后执行，查询以验证离线下载结果，每次间隔一秒<br>设置验证次数上限，上限次数越多验证越精准<br>建议 3 ~ 5，默认 5",
                        placeholder: "仅支持整数 ≥ 0",
                        defaultVal: 5,
                    },
                    {
                        name: "最大失败数",
                        key: "FAIL",
                        type: "number",
                        info: "『<strong>一键离线</strong>』时累计验证失败的磁链数，最大值时终止本次任务。0 不限制",
                        placeholder: "仅支持整数 ≥ 0",
                        defaultVal: 5,
                    },
                    {
                        name: "离线清理",
                        key: "CLEAR",
                        type: "switch",
                        info: "『<strong>离线验证</strong>』成功后执行，匹配番号以清理无关文件",
                        defaultVal: true,
                    },
                    {
                        name: "文件重命名",
                        key: "RENAME",
                        type: "input",
                        info: '『<strong>离线验证</strong>』成功后执行，支持参数：<br><code>${字幕}</code> "【中文字幕】"，非字幕资源则为空<br><code>${番号}</code> 页面番号 (番号为必须值，如重命名未包含将自动追加前缀)<br><code>${标题}</code> 页面标题，已去除番号<br><code>${序号}</code> 仅作用于视频文件，数字 1 起',
                        placeholder: "勿填写后缀，可能导致资源不可用",
                        defaultVal: "${字幕}${番号} ${标题}",
                    },
                    {
                        name: "自动打标",
                        key: "TAG",
                        type: "input",
                        info: "『<strong>离线验证</strong>』成功后执行，根据设置值匹配网盘已有标签自动打标，支持参数：<br><code>#genre</code> 类别，<code>#star</code> 演员",
                        placeholder: "如 #genre#star",
                        defaultVal: "#genre#star",
                    },
                    {
                        name: "图片上传",
                        key: "UPLOAD",
                        type: "input",
                        info: "『<strong>离线验证</strong>』成功后执行 (弹窗通知)，支持参数：<br><code>#cover</code> 封面图，<code>#img</code> 预览大图 (通常较大，确保网络通畅并耐心等待上传)",
                        placeholder: "如 #cover#img",
                        defaultVal: "#cover#img",
                    },
                    {
                        name: "资源调整",
                        key: "MODIFY",
                        type: "input",
                        info: "针对详情页网盘匹配资源的自定义调整配置，支持参数 (顺序不分先后)：<br><code>#delete</code> 删除对应视频文件，并忽略其他参数<br><code>#rename</code> 详见『<strong>文件重命名</strong>』<br><code>#upload</code> 详见『<strong>图片上传</strong>』<br><code>#clear</code> 详见『<strong>离线清理</strong>』<br><code>#tag</code> 详见『<strong>自动打标</strong>』",
                        placeholder: "如 #rename#clear#tag#upload",
                        defaultVal: "#rename#clear#tag#upload",
                    },
                ],
            },
            {
                title: "进阶",
                key: "advanced",
                prefix: "A",
                options: [
                    {
                        name: "资源跳转",
                        key: "LINK",
                        type: "textarea",
                        info: "自定义网盘资源跳转链接，兼容列表及详情页，仅支持分组 <code>[left]</code> / <code>[right]</code>，链接参数：<br><code>${#pickcode}</code> 可用于跳转播放<br><code>${#cid}</code> 可用于跳转目录<br><code>${#path}</code> 资源路径<br><code>${#name}</code> 资源名称<br>格式参考『<strong>合并列表</strong>』",
                        placeholder:
                            "[left]\nhttps://v.anxia.com/?pickcode=${#pickcode}\n\n[right]\nhttps://115.com/?cid=${#cid}&offset=0&mode=wangpan",
                        defaultVal: "",
                    },
                ],
            },
        ];
        style = {
            custom: `
          :root {
              --x-bgc: #121212;
              --x-sub-bgc: #202020;
              --x-ftc: #fffffff2;
              --x-sub-ftc: #aaa;
              --x-grey: #313131;
              --x-blue: #0a84ff;
              --x-orange: #ff9f0a;
              --x-green: #30d158;
              --x-red: #ff453a;
              --x-yellow: #ffd60a;
              --x-line-h: 22px;
              --x-thumb-w: 190px;
              --x-cover-w: 360px;
              --x-thumb-ratio: 147 / 200;
              --x-cover-ratio: 400 / 269;
              --x-avatar-ratio: 1;
              --x-sprite-ratio: 4 / 3;
          }
          .x-hide, .x-scrollbar-hide body::-webkit-scrollbar {
              display: none !important;
          }
          .x-show {
              display: block !important;
          }
          #x-mask {
              position: fixed;
              top: 0;
              left: 0;
              z-index: 9999;
              display: none;
              box-sizing: border-box;
              width: 100vw;
              height: 100vh;
              margin: 0;
              padding: 0;
              background: transparent;
              border: none;
          }
          .x-in {
              opacity: 1 !important;
              transition: opacity .25s linear !important;
          }
          .x-cover {
              width: var(--x-cover-w) !important;
          }
          .x-cover > :first-child {
              aspect-ratio: var(--x-cover-ratio) !important;
          }
          .x-cover img {
              object-fit: contain !important;
          }
          .x-ellipsis {
              display: -webkit-box !important;
              overflow: hidden;
              white-space: unset !important;
              text-overflow: ellipsis;
              -webkit-line-clamp: 1;
              -webkit-box-orient: vertical;
              word-break: break-all;
          }
          .x-line {
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
          }
          #x-status {
              margin-bottom: 20px;
              color: var(--x-sub-ftc);
              font-size: 14px !important;
              text-align: center;
          }
          .x-highlight {
              box-shadow: 0 0 0 4px var(--x-red) !important;
          }
          .x-ml {
              margin-left: 10px;
          }
          .x-side {
              position: absolute;
              top: 50%;
              z-index: 7;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 60px;
              height: 60px;
              color: var(--x-sub-bgc);
              font-size: 30px;
              background: #fff;
              border-radius: 50%;
              transform: translateY(-50%);
              cursor: pointer;
              opacity: .4;
              transition: opacity .2s linear;
              user-select: none;
          }
          .x-side:hover {
              opacity: .8;
          }
          .x-side > * {
              top: 0;
          }
          .x-side.prev {
              left: 30px;
          }
          .x-side.next {
              right: 30px;
          }
          .x-flex-center {
              display: flex !important;
              align-items: center;
          }
          .x-grid {
              display: grid !important;
          }
          *:has(> .x-jump) {
              margin-right: -5px !important;
          }
          .x-jump {
              min-width: 44px;
              margin: 0 5px 5px 0 !important;
              cursor: pointer;
          }
          .x-title {
              line-height: var(--x-line-h) !important;
          }
          *:has(> .x-player) .x-title {
              color: var(--x-blue) !important;
              font-weight: bold;
          }
          .x-preview,
          .x-loading *:has(> img),
          .x-player {
              position: relative;
              display: block;
              overflow: hidden;
          }
          .x-loading *:has(> img)::before,
          .x-player::before,
          .x-player::after {
              position: absolute;
              top: 50%;
              left: 50%;
              cursor: pointer;
              opacity: .8;
              content: "";
          }
          .x-loading *:has(> img):not(.x-player)::before,
          .x-player::before {
              z-index: 8;
              width: 60px;
              height: 60px;
              background: #0a5ee0;
              border-radius: 50%;
              filter: drop-shadow(2px 5px 10px rgb(0 0 0 / 50%));
              translate: -50% -50%;
          }
          .x-loading *:has(> img)::before,
          .x-zh.x-player::before {
              border: 6px solid var(--x-yellow);
          }
          .x-player::after {
              z-index: 9;
              border-top: 15px solid transparent;
              border-bottom: 15px solid transparent;
              border-left: 30px solid #fff;
              transform: translate(-40%, -50%);
          }
          .x-loading *:has(> img)::before {
              border-color: transparent;
              border-bottom-color: var(--x-orange) !important;
              animation: rotation 1s linear infinite;
          }
          .x-loading *:has(> img):not(.x-player)::before {
              background: transparent;
              border-color: #000c;
          }
          .x-loading.success *:has(> img)::before {
              border-color: var(--x-green) !important;
          }
          .x-loading.timeout *:has(> img)::before {
              border-color: var(--x-orange) !important;
          }
          .x-loading.fail *:has(> img)::before {
              border-color: var(--x-red) !important;
          }
          @keyframes rotation {
              0% {
                  rotate: 0deg;
              }
              100% {
                  rotate: 360deg;
              }
          }
          .x-preview :is(img, video) {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              object-fit: contain;
          }
          .x-preview video {
              z-index: 10;
              background-color: inherit;
              opacity: 0;
              transition: opacity .25s ease-in !important;
          }
          .x-preview video::-webkit-media-controls-fullscreen-button {
              display: none;
          }
          .x-btn {
              display: none;
              margin-right: 4px;
              padding: 1px 4px;
              color: #fff !important;
              font-weight: normal;
              font-size: calc(1em - 2px);
              background: var(--x-blue);
              border-radius: 2px;
              cursor: pointer;
          }
          .x-btn::after {
              content: "调整";
          }
          .x-btn.active {
              cursor: wait;
              opacity: .8;
          }
          .x-btn.active::after {
              content: "请求中...";
          }
          .x-btn.pending::after {
              content: "校验中...";
          }
          `,
            common: "::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-thumb{background:var(--x-sub-ftc,#aaa);border-radius:4px}*{text-decoration:none!important;text-shadow:none!important;outline:0!important}",
            dark: "::-webkit-scrollbar-thumb,button{background:var(--x-grey)!important}*{box-shadow:none!important}:not(span[class]){border-color:var(--x-grey)!important}body,html,input{background:var(--x-bgc)!important}::placeholder,body{color:var(--x-sub-ftc)!important}nav{background:var(--x-sub-bgc)!important}a,button,h3,h4,input,p{color:var(--x-ftc)!important}img,video{filter:brightness(.9) contrast(.9)!important}",
        };
  
        init() {
            Store.init();
            const key = Object.keys(this.routes).find(key => this.routes[key].test(location.pathname));
            this.registerMenu(key);
            return { ...this, ...this[key] };
        }
        registerMenu(active) {
            const exclude = this.excludeMenu ?? [];
            const menus = this.menus.filter(item => !exclude.includes(`${item.prefix}_`));
            const { length } = menus;
            if (!length) return;
  
            let tabStr = "";
            let panelStr = "";
            const commands = [];
            if (!menus.some(item => item.key === active)) active = menus[0].key;
            for (let index = 0; index < length; index++) {
                const { title, key, prefix, options } = menus[index];
  
                let sections = "";
                for (let idx = 0, len = options.length; idx < len; idx++) {
                    let { name, key: curKey, type, info, placeholder = "", defaultVal, hotkey = "" } = options[idx];
                    curKey = `${prefix}_${curKey}`;
                    if (exclude.includes(curKey)) continue;
  
                    commands.push(curKey);
                    const uniKey = `${Domain}_${curKey}`;
                    const val = GM_getValue(uniKey, defaultVal);
                    this[curKey] = val;
  
                    let section = "";
                    if (type === "switch") {
                        if (hotkey && hotkey !== "s") {
                            GM_registerMenuCommand(
                                `${val ? "关闭" : "开启"}${name}`,
                                () => {
                                    GM_setValue(uniKey, !val);
                                    location.reload();
                                },
                                hotkey
                            );
                        }
                        section = `
                      <div class="form-check form-switch">
                          <input
                              type="checkbox"
                              class="form-check-input"
                              role="switch"
                              id="${curKey}"
                              aria-describedby="${curKey}_Help"
                              ${val ? "checked" : ""}
                              name="${curKey}"
                          >
                          <label class="form-check-label" for="${curKey}">${name}</label>
                      </div>
                      `;
                    } else if (type === "textarea") {
                        section = `
                      <label class="form-label" for="${curKey}">${name}</label>
                      <textarea
                          rows="5"
                          class="form-control"
                          id="${curKey}"
                          aria-describedby="${curKey}_Help"
                          placeholder="${placeholder}"
                          name="${curKey}"
                      >${val ?? ""}</textarea>
                      `;
                    } else {
                        section = `
                      <label class="form-label" for="${curKey}">${name}</label>
                      <input
                          type="${type}"
                          class="form-control"
                          id="${curKey}"
                          aria-describedby="${curKey}_Help"
                          value="${val ?? ""}"
                          placeholder="${placeholder}"
                          name="${curKey}"
                      >
                      `;
                    }
                    if (info) section += `<div id="${curKey}_Help" class="form-text">${info}</div>`;
                    sections += `<div class="mb-3">${section}</div>`;
                }
                if (!sections) continue;
  
                const isActive = key === active;
                tabStr += `
              <button
                  class="nav-link${isActive ? " active" : ""} text-start"
                  id="${key}-tab"
                  data-bs-toggle="pill"
                  data-bs-target="#${key}"
                  type="button"
                  role="tab"
                  aria-controls="${key}"
                  aria-selected="${isActive}"
              >${title}</button>
              `;
                panelStr += `
              <div
                  class="tab-pane fade${isActive ? " show active" : ""}"
                  id="${key}"
                  role="tabpanel"
                  aria-labelledby="${key}-tab"
                  tabindex="0"
              >
                  ${sections}
              </div>
              `;
            }
            if (!tabStr || !panelStr) return;
  
            GM_addStyle(this.style.custom);
            DOC.addEventListener(
                "XContentLoaded",
                () => {
                    const title = `${GM_info.script.name} v${GM_info.script.version}`;
                    DOC.body.insertAdjacentHTML(
                        "beforeend",
                        `<iframe id="x-mask" src="about:blank" title="${title}"></iframe>`
                    );
                    const iframe = DOC.querySelector("#x-mask");
                    const _DOC = iframe.contentWindow.document;
                    const { body } = _DOC;
  
                    _DOC.head.insertAdjacentHTML(
                        "beforeend",
                        `<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-Zenh87qX5JnK2Jl0vWa8Ck2rdkQ2Bzep5IDxbcnCeuOxjzrPF/et3URy9Bv1WTRi" crossorigin="anonymous"><style>${this.style.common}*{overscroll-behavior-y:contain}</style><base target="_blank">`
                    );
                    GM_addElement(body, "script", {
                        src: "https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/js/bootstrap.min.js",
                        integrity: "sha384-IDwe1+LCz02ROU9k972gdyvl+AESN10+x7tBKgc9I5HFtuNz0wWnPclzo6p9vxnk",
                        crossorigin: "anonymous",
                    });
  
                    body.classList.add("bg-transparent");
                    body.insertAdjacentHTML(
                        "afterbegin",
                        `<button
                          id="openControlPanel"
                          type="button"
                          class="d-none"
                          data-bs-toggle="modal"
                          data-bs-target="#controlPanel"
                      >openControlPanel</button>
                      <div
                          class="modal fade"
                          id="controlPanel"
                          tabindex="-1"
                          aria-labelledby="controlPanelLabel"
                          aria-hidden="true"
                      >
                          <div class="modal-dialog modal-lg modal-fullscreen-lg-down modal-dialog-scrollable">
                              <div class="modal-content">
                                  <div class="modal-header">
                                      <h5 class="modal-title fs-5" id="controlPanelLabel">控制面板
                                          - <a
                                              href="https://sleazyfork.org/zh-CN/scripts/435360-javscript"
                                              class="link-secondary"
                                          >${title}</a>
                                      </h5>
                                      <button
                                          type="button"
                                          class="btn-close"
                                          data-bs-dismiss="modal"
                                          aria-label="Close"
                                      ></button>
                                  </div>
                                  <div class="modal-body">
                                      <form class="mb-0">
                                          <div class="d-flex align-items-start">
                                              <div
                                                  class="nav flex-column nav-pills me-4 sticky-top"
                                                  id="v-pills-tab"
                                                  role="tablist"
                                                  aria-orientation="vertical"
                                              >
                                                  ${tabStr}
                                              </div>
                                              <div class="tab-content flex-fill" id="v-pills-tabContent">
                                                  ${panelStr}
                                              </div>
                                          </div>
                                      </form>
                                  </div>
                                  <div class="modal-footer">
                                      <div class="flex-fill">
                                          <div class="btn-group" role="group" aria-label="Import and Export">
                                              <button type="button" class="btn btn-link" data-action="import">导入</button>
                                              <button type="button" class="btn btn-link" data-action="export">导出</button>
                                          </div>
                                      </div>
                                      <button
                                          type="button"
                                          class="btn btn-danger"
                                          data-bs-dismiss="modal"
                                          data-action="restart"
                                      >重置脚本</button>
                                      <button
                                          type="button"
                                          class="btn btn-secondary"
                                          data-bs-dismiss="modal"
                                          data-action="clear"
                                      >清除缓存</button>
                                      <button
                                          type="button"
                                          class="btn btn-secondary"
                                          data-bs-dismiss="modal"
                                          data-action="reset"
                                      >默认设置</button>
                                      <button
                                          type="button"
                                          class="btn btn-primary"
                                          data-bs-dismiss="modal"
                                          data-action="save"
                                      >保存设置</button>
                                  </div>
                              </div>
                          </div>
                      </div>`
                    );
                    body.querySelector("#controlPanel .modal-footer").addEventListener("click", e => {
                        const { action } = e.target.dataset;
                        if (!action) return;
  
                        e.preventDefault();
                        e.stopPropagation();
  
                        const prefixes = MatchDomains.slice(0, -1).map(item => item.domain);
                        if (action === "import") {
                            const upConfig = file => {
                                const fileReader = new FileReader();
                                fileReader.readAsText(file);
                                fileReader.onload = () => {
                                    for (const [key, val] of Object.entries(JSON.parse(fileReader.result))) {
                                        if (prefixes.includes(key.split("_")[0])) GM_setValue(key, val);
                                    }
                                    location.reload();
                                };
                            };
  
                            const upload = DOC.create("input", { type: "file", accept: ".json" });
                            upload.addEventListener(
                                "change",
                                e => {
                                    const file = e.target.files[0];
                                    if (file?.type !== "application/json") return;
                                    if (file.name.split(".json")[0] === title) return upConfig(file);
                                    if (window.confirm("导入配置可能与当前版本不符，是否继续？")) return upConfig(file);
                                },
                                false
                            );
                            return upload.click();
                        }
                        if (action === "export") {
                            const config = {};
                            GM_listValues().forEach(key => {
                                if (prefixes.includes(key.split("_")[0])) config[key] = GM_getValue(key);
                            });
                            const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
  
                            const download = DOC.create("a", {
                                download: `${title}.json`,
                                href: URL.createObjectURL(blob),
                            });
                            return download.click();
                        }
                        if (action === "save") {
                            const data = Object.fromEntries(
                                new FormData(body.querySelector("#controlPanel form")).entries()
                            );
                            commands.forEach(key => GM_setValue(`${Domain}_${key}`, data[key] ?? ""));
                        }
                        if (action === "reset") {
                            GM_listValues().forEach(name => name.startsWith(Domain) && GM_deleteValue(name));
                        }
                        if (action === "clear") {
                            GM_setValue("DETAILS", {});
                            GM_setValue("RESOURCE", {});
                            localStorage.clear();
                        }
                        if (action === "restart") GM_listValues().forEach(name => GM_deleteValue(name));
  
                        location.reload();
                    });
  
                    const toggleIframe = () => {
                        DOC.body.parentNode.classList.toggle("x-scrollbar-hide");
                        iframe.classList.toggle("x-show");
                    };
                    const openModal = () => {
                        if (iframe.classList.contains("x-show")) return;
                        toggleIframe();
                        _DOC.querySelector("#openControlPanel").click();
                    };
                    GM_registerMenuCommand("控制面板", openModal, "s");
                    _DOC.querySelector("#controlPanel").addEventListener("hidden.bs.modal", toggleIframe);
                },
                { once: true }
            );
        }
  
        // G_DARK
        globalDark = (style = "", dmStyle = "") => {
            if (!style && !dmStyle) return;
  
            const { common, dark } = this.style;
            if (style && common) style = `${common}${style}`;
            if (!this.G_DARK) dmStyle = "";
            if (dmStyle && dark) dmStyle = `${dark}${dmStyle}`;
  
            const css = `${style}${dmStyle}`;
            if (css) GM_addStyle(css);
        };
        // G_SEARCH
        globalSearch = () => {
            if (!this.G_SEARCH) return;
  
            const { selectors, pathname } = this.search;
            if (selectors) {
                DOC.addEventListener("keyup", ({ code }) => {
                    if (code !== "Slash" || ["INPUT", "TEXTAREA"].includes(DOC.activeElement.nodeName)) return;
                    DOC.querySelector(selectors)?.focus();
                });
            }
            if (pathname) {
                DOC.addEventListener("keydown", async e => {
                    if (e.ctrlKey && e.code === "Slash") {
                        const text = await navigator.clipboard.readText();
                        if (text) openInTab(`${location.origin}${pathname}#jump#${REP}`.replaceAll(REP, text));
                    }
                });
            }
        };
        // G_CLICK
        globalClick = () => {
            const { selectors, codeQuery, upQuery } = this.click;
            if (!selectors?.length) return;
  
            selectors.push(".x-jump");
            const getTarget = ({ target }) => target.closest(selectors) || false;
  
            DOC.addEventListener("click", e => {
                const closest = getTarget(e);
                if (!closest) return;
  
                let url = "";
                let code = "";
                const { classList, dataset } = e.target;
  
                if (classList.contains("x-player") && dataset.pc) {
                    return this.advancedLink(e, { type: "left" });
                } else if (classList.contains("x-btn") && dataset.code) {
                    return this.driveListOffLine(e, dataset);
                } else if (classList.contains("x-jump") && dataset.href) {
                    url = dataset.href;
                } else if (closest.href) {
                    url = closest.href;
                    if (codeQuery) code = closest.querySelector(codeQuery)?.textContent;
                }
                if (!url) return;
  
                e.preventDefault();
                e.stopPropagation();
                if (this.G_CLICK) {
                    const tab = openInTab(url);
                    if (code) tab.onclose = () => this.driveMatchForList([{ item: closest, code }], upQuery);
                    return;
                }
                location.href = url;
            });
            if (!this.G_CLICK) return;
  
            let _event;
            DOC.addEventListener("mousedown", e => {
                if (e.button !== 2) return;
  
                const target = getTarget(e);
                if (!target) return;
  
                e.preventDefault();
                target.oncontextmenu = e => e.preventDefault();
                _event = e;
            });
            DOC.addEventListener("mouseup", e => {
                if (e.button !== 2 || !_event) return;
  
                const target = getTarget(e);
                if (!target) return;
  
                e.preventDefault();
                const { clientX, clientY } = e;
                const { clientX: _clientX, clientY: _clientY } = _event;
                if (Math.abs(clientX - _clientX) + Math.abs(clientY - _clientY) > 5) return;
                if (target.dataset.href) return openInTab(target.dataset.href, false);
  
                const tab = openInTab(target.href, false);
                const code = codeQuery ? target.querySelector(codeQuery)?.textContent : "";
                if (code) tab.onclose = () => this.driveMatchForList([{ item: target, code }], upQuery);
            });
        };
  
        // L_MIT
        listMovieImgType = (node, condition) => {
            if (!this.L_MIT) return;
  
            const img = node.querySelector("img");
            if (!img) return;
  
            node.classList.add("x-cover");
            const { src = "" } = img;
            img.src = condition.find(({ regex }) => regex.test(src))?.replace(src) ?? src;
        };
        // L_MV
        listMovieVideo = container => {
            if (!container.querySelector(".movie-list:is(.h, .cols-3) .cover, .movie-box.x-cover")) return;
  
            const DELAY = parseInt(this.L_MV ?? 0, 10);
            if (DELAY <= 0) return;
  
            let locking = null;
            unsafeWindow.addEventListener("scroll", () => {
                if (locking) clearTimeout(locking);
  
                if (!container.style.pointerEvents) container.style.pointerEvents = "none";
  
                locking = setTimeout(() => {
                    container.style.pointerEvents = "";
                }, 100);
            });
  
            const { selectors, codeQuery, upQuery } = this.click;
            const ITEM_NODE = selectors[0];
            const LOCK_NODE = "x-loading";
            const HOLD_NODE = "x-holding";
            let current = null;
            let timer = null;
  
            DOC.addEventListener("mouseover", ({ relatedTarget, target }) => {
                if (current) {
                    if (timer && relatedTarget?.nodeName === "IMG" && target.contains(relatedTarget)) {
                        clearTimeout(timer);
                        current = null;
                    }
                    return;
                }
  
                target = target.closest(upQuery);
                if (!target) return;
  
                if (!container.contains(target)) return;
  
                current = target;
                showPreview(current);
            });
            DOC.addEventListener("mouseout", ({ relatedTarget }) => {
                if (!current) return;
  
                while (relatedTarget) {
                    if (relatedTarget === current) return;
                    relatedTarget = relatedTarget.parentNode;
                }
  
                hidePreview(current);
                current = null;
            });
  
            const showPreview = cover => {
                cover.classList.add("x-preview", HOLD_NODE);
                timer = setTimeout(() => getVideo(cover), DELAY < 100 ? 100 : DELAY);
            };
            const hidePreview = cover => {
                cover.classList.remove(HOLD_NODE);
                if (timer) clearTimeout(timer);
  
                const video = cover.querySelector("video");
                if (!video) return;
  
                video.classList.remove("x-in");
                setTimeout(() => video.remove(), 250);
            };
  
            let isMuted = true;
            const getVideo = cover => {
                const closest = cover.closest(ITEM_NODE);
                if (!closest || closest.classList.contains(LOCK_NODE)) return;
  
                let code = closest.querySelector(codeQuery)?.textContent.trim() ?? "";
                if (!code) return;
  
                code = /^FC2-\d/i.test(code) ? code.replace("-", "-PPV-") : code;
                let { video, poster } = cover.dataset;
  
                if (!video) {
                    const detail = Store.getDetail(code);
                    if (detail.video) {
                        video = detail.video;
                        cover.setAttribute("data-video", video);
                    }
                }
                if (!poster) {
                    poster = cover.querySelector("img")?.src ?? "";
                    cover.setAttribute("data-poster", poster);
                }
                if (video) return setVideo(cover);
  
                closest.classList.add(LOCK_NODE);
                const _timer = setTimeout(() => cancelLock("timeout"), 8000);
                let count = FC2_REGEX.test(code) ? 7 : 6;
  
                const cancelLock = status => {
                    if (_timer) clearTimeout(_timer);
                    count = 0;
  
                    if (status === "success" && cover.classList.contains(HOLD_NODE)) {
                        return closest.classList.remove(LOCK_NODE);
                    }
                    closest.classList.add(status);
                    setTimeout(() => closest.classList.remove(status, LOCK_NODE), 800);
                };
                const callback = ({ video }) => {
                    if (count <= 0) return;
  
                    if (!video) {
                        count--;
                        if (count <= 0) cancelLock("fail");
                    } else {
                        cancelLock("success");
                        cover.setAttribute("data-video", video);
                        Store.upDetail(code, { video });
                        setVideo(cover);
                    }
                };
  
                if (count === 7) Apis.fetchFC2(code).then(callback);
                Apis.fetchAVPreview(code).then(callback);
                Apis.fetchJavSpyl(code).then(callback);
                Apis.fetchVBGFL(code).then(callback);
                Apis.fetchDMM({ code }).then(({ fetchVideo }) => {
                    if (fetchVideo) fetchVideo().then(callback);
                });
  
                const isVR = VR_REGEX.test(closest.textContent);
                Apis.fetchVideoByGuess({ code, isVR }).then(callback);
                Apis.fetchVBL({ node: closest, isVR }).then(callback);
            };
            const setVideo = cover => {
                if (!cover.classList.contains(HOLD_NODE) || cover.querySelector("video")) return;
  
                let { video, poster } = cover.dataset;
                video = DOC.create("video", {
                    poster,
                    src: video,
                    "x-webkit-airplay": "deny",
                    controlslist: "nodownload nofullscreen noremoteplayback noplaybackrate",
                    preload: "metadata",
                    title: "",
                });
                video.autoplay = true;
                video.autoPictureInPicture = false;
                video.controls = true;
                video.currentTime = 3;
                video.disablePictureInPicture = true;
                video.disableRemotePlayback = true;
                video.loop = true;
                video.muted = isMuted;
                video.playsInline = true;
                video.volume = localStorage.getItem("volume") ?? 0.2;
                video.addEventListener("keyup", ({ code, target }) => {
                    if (code !== "KeyM") return;
                    isMuted = !target.muted;
                    target.muted = isMuted;
                });
                cover.append(video);
                video?.focus();
                video?.load();
                setTimeout(() => video?.classList?.add("x-in"), 50);
            };
        };
        // L_MTH, L_MTL
        listMovieTitle = () => {
            let num = parseInt(this.L_MTL ?? 0, 10);
            if (this.L_MTH && num < 1) num = 1;
  
            return `.x-ellipsis {
              -webkit-line-clamp: ${num <= 0 ? "unset" : num};
              ${this.L_MTH ? `height: calc(var(--x-line-h) * ${num}) !important;` : ""}
    }`;
        };
        // L_SCROLL
        listScroll = async function ({ container, itemSelector = ".item", path, start, showPage, onLoad }) {
            let { list: domList = [DOC], active: isMerge = false } = this.merge;
  
            const getItems = async list => {
                list = await Promise.all(list.map(item => (typeof item !== "string" ? item : request(item))));
                list = list.filter(Boolean);
                if (!list.length) return list;
  
                domList = list;
                list = list.map(item => [...item.querySelectorAll(itemSelector)]).flat();
                if (!list.length) return list;
  
                return this.modifyItem(list, isMerge);
            };
            const items = await getItems(domList);
            const { length } = items;
            start(items);
  
            if (typeof container === "string") container = DOC.querySelector(container);
            container.classList.add("x-in");
  
            if (length) this.listMovieVideo(container);
            if (!isMerge && !this.L_SCROLL) return showPage();
  
            const hasMore = "加载中...";
            const noMore = "没有更多了";
            const status = DOC.create("div", { id: "x-status" }, length ? hasMore : noMore);
            container.insertAdjacentElement("afterend", status);
            if (!length) return;
  
            let urls = [];
            const getNext = list => {
                urls = list.map(item => item.querySelector(path)?.href).filter(Boolean);
                addPrefetch(urls);
            };
            getNext(domList);
            if (!urls.length) {
                status.textContent = noMore;
                return;
            }
  
            let isLoading = false;
            let observer = new IntersectionObserver(async entries => {
                if (!urls.length) {
                    status.textContent = noMore;
                    return observer.disconnect();
                }
                if (!entries[0].isIntersecting || isLoading) return;
                status.textContent = hasMore;
  
                isLoading = true;
                const _items = await getItems(urls);
                isLoading = false;
  
                if (!_items.length) {
                    status.textContent = "请求失败，检查后滚动以重试";
                    return;
                }
                getNext(domList);
                onLoad(_items);
            });
            observer.observe(status);
        };
        // L_MERGE
        listMerge = () => {
            let merge = this.L_MERGE.trim();
            if (!merge) return;
  
            merge = merge.split("\n\n").filter(Boolean);
            if (!merge.length) return;
  
            const list = {};
            const regex = /^\[.+\]$/;
            const replace = /\[|\]/g;
            for (const item of merge) {
                const res = unique(item.split("\n").filter(Boolean));
                if (res.length <= 1) continue;
  
                const first = res.shift();
                if (!regex.test(first)) continue;
  
                list[first.replace(replace, "")] = res;
            }
            const keys = Object.keys(list);
            if (!keys.length) return;
  
            let active = "";
            const { activePath = "/", start } = this.merge;
            if (location.pathname === activePath) {
                const { search } = location;
                if (search.startsWith("?merge=")) {
                    active = decodeURIComponent(search.split("=").at(-1));
                    if (!keys.includes(active)) active = "";
                }
            }
            DOC.addEventListener("XContentLoaded", () => start(keys, active), { once: true });
            if (!active) return;
  
            this.merge.active = active;
            this.merge.list = list[active].map(item => (item.split("#")[0] === activePath ? DOC : item));
            DOC.title = `${active} - 合并列表 - ${Domain}`;
        };
        // L_FILTER
        listFilter = ({ code = "", title = "", score, tags }) => {
            const filter = this.L_FILTER.trim();
            if (!filter || (!code && !title)) return;
  
            const hlRegex = /^\^/;
            tags = tags?.length
                ? Array.from(tags)
                      .map(item => item.textContent)
                      .join(",")
                : "";
            const match = (rule, word) => {
                if (rule.endsWith("#start")) {
                    return word.startsWith(rule.replace(/#start$/, ""));
                } else if (rule.endsWith("#end")) {
                    return word.endsWith(rule.replace(/#end$/, ""));
                } else {
                    if (!rule.startsWith("reg:")) return word.includes(rule);
  
                    rule = rule.replace(/^reg:/, "");
                    return rule ? eval(rule)?.test(word) : rule;
                }
            };
  
            let res = "";
            for (const item of filter.split("\n\n")) {
                let word = "";
                if (item.startsWith("[code]")) word = code;
                if (item.startsWith("[title]")) word = title;
                if (item.startsWith("[score]")) word = score;
                if (item.startsWith("[tags]")) word = tags;
                if (!word && word !== "") continue;
  
                const rules = unique(item.split("\n").filter(Boolean));
                if (rules.length <= 1) continue;
  
                const highlight = [];
                for (const rule of rules.slice(1)) {
                    if (hlRegex.test(rule)) {
                        highlight.push(rule.replace(hlRegex, ""));
                        continue;
                    }
                    if (match(rule, word)) res = "x-hide";
                    if (res === "x-hide") break;
                }
                if (res === "x-hide") break;
  
                for (const rule of highlight) {
                    if (match(rule, word)) res = "x-highlight";
                    if (res === "x-highlight") break;
                }
            }
            return res;
        };
  
        // M_RES, M_TITLE, M_STAR, M_SCORE, M_SUB, M_MAGNET
        getMovieResource = function ({ video, transTitle, star, code, cid, studio, isVR, title }) {
            let res = [];
  
            if (this.M_RES?.trim()) {
                res = paramParse(this.M_RES, ["img", "video", "player"]);
                this.params.res = res;
            }
            if (this.M_SCORE?.trim()) {
                const param = paramParse(this.M_SCORE, ["db", "lib", "dmm", "mgs"]);
                const _res = param.filter(item => Domain !== "JavDB" || item !== "db").map(item => `${item}_score`);
                res = [...res, ..._res];
                if (_res.length) this.params.score = param;
            }
            if (this.M_MAGNET?.trim()) {
                const param = paramParse(this.M_MAGNET, ["suk", "bts", "btd"]);
                res = [...res, ...param.map(item => `${item}_magnet`)];
                this.params.magnet = param;
            }
            if (this.M_TITLE) res.push("title");
            if (!star?.length && this.M_STAR) res.push("star");
            if (this.M_SUB) res.push("sub");
  
            const needs = [];
            const detail = Store.getDetail(code);
            const resource = { video, title: transTitle };
            for (const key of res) {
                let val = detail[key];
                this.params[key] = val;
                if (val?.length) continue;
  
                val = resource[key];
                if (val?.length) {
                    this.setMovieResource({ [key]: val });
                    continue;
                }
  
                needs.push(key);
            }
            if (!needs.length) return;
  
            if (needs.includes("img")) {
                DOC.head.insertAdjacentHTML("beforeend", '<meta name="referrer" content="never">');
                let _code = code;
                if (/^HEYZO-\d/i.test(_code)) _code = _code.replace("-", " ");
  
                Apis.fetchJavStore(_code).then(res => res.img && this.setMovieResource(res));
                Apis.fetchBlogJav(_code).then(res => this.setMovieResource(res));
            }
            if (needs.includes("video")) {
                Apis.fetchVideoByGuess({ code, isVR, cid }).then(res => res.video && this.setMovieResource(res));
                Apis.fetchVideoByStudio({ code, studio }).then(res => res.video && this.setMovieResource(res));
                Apis.fetchJavSpyl(code).then(res => this.setMovieResource(res));
                Apis.fetchAVPreview(code).then(res => this.setMovieResource(res));
                if (FC2_REGEX.test(code)) Apis.fetchFC2(code).then(res => this.setMovieResource(res));
            }
            if (needs.includes("player")) Apis.fetchNetflav(code).then(res => this.setMovieResource(res));
            if (needs.includes("title")) Apis.fetchTranslate(title).then(res => this.setMovieResource(res));
            if (needs.includes("suk_magnet")) Apis.fetchSukebei(code).then(res => this.setMovieResource(res));
            if (needs.includes("bts_magnet")) Apis.fetchBTSOW(code).then(res => this.setMovieResource(res));
            if (needs.includes("btd_magnet")) {
                Apis.fetchBTDigg(code).then(res => {
                    if (res.btd_magnet.length) return this.setMovieResource(res);
                    Apis.fetchBTDigg(code, 1).then(re => this.setMovieResource(re));
                });
            }
  
            const isMGS = ["mgs_score", "video"];
            if (needs.some(item => isMGS.includes(item))) {
                Apis.fetchMGS({ code, title }).then(res => this.setMovieResource(res));
            }
  
            const isLib = ["lib_score", "star"];
            if (needs.some(item => isLib.includes(item))) Apis.fetchLib(code).then(res => this.setMovieResource(res));
  
            const isDMM = ["dmm_score", "star", "video"];
            if (needs.some(item => isDMM.includes(item))) {
                Apis.fetchDMM({ code, title }).then(({ fetchVideo, fetchInfo }) => {
                    if (!fetchVideo) return this.setMovieResource({ dmm_score: [], star: [], video: "" });
                    if (needs.includes("video")) fetchVideo().then(re => this.setMovieResource(re));
                    if (needs.includes("dmm_score")) fetchInfo().then(re => this.setMovieResource(re));
                });
            }
  
            if (Domain === "JavDB") return;
            const isDB = ["db_score", "star", "video", "sub"];
            if (needs.some(item => isDB.includes(item))) Apis.fetchDB(code).then(res => this.setMovieResource(res));
        };
        setMovieResource = function (res) {
            if (!res) return;
            const { code } = this.info;
            const detail = Store.getDetail(code);
            for (const [key, val] of Object.entries(res)) {
                if (detail[key]?.length) continue;
                if (val?.length) Store.upDetail(code, { [key]: val });
                if (this.params.hasOwnProperty(key)) this.params[key] = val;
            }
        };
        upMovieResource = function (key, update, start) {
            if (!this.params.hasOwnProperty(key)) return;
  
            start?.();
            if (this.params[key]?.length) return update(this.params[key]);
            Object.defineProperty(this.params, key, { set: update, get: undefined });
        };
        // M_JUMP
        movieJump = ({ code }, start, update) => {
            if (!code || !start || !update) return;
  
            let jump = this.M_JUMP?.trim().split("\n\n").filter(Boolean);
            let { length } = jump;
            if (!length) return;
  
            const regex = /^\[.+\]$/;
            const replace = /\[|\]/g;
            const urlReg = /^https?:\/\/[a-z0-9]+/i;
  
            const group = [];
            for (let index = 0; index < length; index++) {
                const items = unique(jump[index].split("\n").filter(Boolean));
                if (items.length <= 1 || !regex.test(items[0])) continue;
  
                const list = items.filter(item => urlReg.test(item));
                if (!list.length) continue;
  
                group.push({
                    group: items[0].replace(replace, ""),
                    list: list.map(item => {
                        return {
                            url: `${item.replaceAll(REP, code).trim()}#${code}`,
                            query: item.includes("#query"),
                            name: item.split("//")[1].split("/")[0].split(".").at(-2),
                        };
                    }),
                });
            }
            if (group.length) start(group);
  
            const nodeList = DOC.querySelectorAll(".x-jump");
            length = nodeList.length;
            if (!length) return;
  
            jump = Store.getDetail(code)?.jump ?? [];
            for (let index = 0; index < length; index++) {
                const node = nodeList[index];
                const { query, href } = node.dataset;
                if (query !== "true") continue;
  
                const key = href.split("#")[0];
                let item = jump.find(item => item.key.toLowerCase() === key.toLowerCase());
                if (item) {
                    if (item.href) update(item, node);
                    continue;
                }
                request(key).then(dom => {
                    if (!dom) return;
  
                    item = captureQuery(code, dom);
                    if (!item?.href) return;
  
                    update(item, node);
                    jump.push({ ...item, key });
                    Store.upDetail(code, { jump });
                });
            }
        };
        // M_SORT
        movieSort = (magnets, start) => {
            if (!this.M_SORT) return magnets;
  
            start?.();
            magnets = magnets.filter(item => item.bytes > 300 * 1024 ** 2);
            return magnets.length <= 1
                ? magnets
                : magnets.sort((pre, next) => {
                      if (pre.zh === next.zh) {
                          if (pre.bytes === next.bytes) return next.date - pre.date;
                          return next.bytes - pre.bytes;
                      } else {
                          return pre.zh > next.zh ? -1 : 1;
                      }
                  });
        };
  
        // D_MATCH
        driveMatchForList = async (items, selectors) => {
            if (!this.D_MATCH) return;
  
            const update = ({ item }, res) => {
                const node = item.querySelector(selectors);
                if (!node) return;
  
                const keys = ["n", "pc", "fid", "cid"];
                const { classList, dataset } = node;
  
                if (!res.length) {
                    keys.forEach(key => delete dataset[key]);
                    node.removeAttribute("title");
                    return classList.remove("x-zh", "x-player");
                }
  
                classList.add("x-player");
                let str = "已有";
                let _item = res[0];
                const zh = res.find(({ n }) => ZH_REGEX.test(n));
                if (zh) {
                    classList.add("x-zh");
                    str = "字幕";
                    _item = zh;
                }
                node.setAttribute("title", `${str}资源`);
                keys.forEach(key => {
                    dataset[key] = _item[key];
                });
            };
  
            const params = {};
            for (let index = 0, { length } = items; index < length; index++) {
                const item = items[index];
                let { code } = item;
                code = /^FC2-\d/i.test(code) ? code.replace("-", "-PPV-") : code;
                item.code = code;
  
                const { res } = Store.getDetail(code);
                if (res) {
                    update(item, res);
                    continue;
                }
  
                const key = code.split("-")[0];
                params.hasOwnProperty(key) ? params[key].push(item) : (params[key] = [item]);
            }
            for (const [prefix, items] of Object.entries(params)) {
                let res = Store.getResource(prefix);
                if (!res) {
                    res = await Apis._driveSearch(prefix);
                    if (!res) break;
                    Store.upResource(prefix, res);
                }
                if (!res.length) continue;
  
                for (let index = 0, { length } = items; index < length; index++) {
                    const item = items[index];
                    const { regex } = codeParse(item.code);
                    const _res = res.filter(({ n }) => regex.test(n));
                    if (_res.length) update(item, _res);
                }
            }
        };
        driveMatchForMovie = async function ({ code }, update, start) {
            if (!this.D_MATCH) return;
  
            start?.();
            const cid = await this.driveCid();
            if (cid === undefined) return update([]);
  
            const { prefix, regex } = codeParse(code);
            const list = await Promise.allSettled([Apis._driveSearch(prefix, ["t"]), Apis.driveVideo(cid)]);
  
            let res;
            for (let index = 0, { length } = list; index < length; index++) {
                const { status, value } = list[index];
                if (status !== "fulfilled" || !value?.length) continue;
  
                if (!res) res = [];
                for (let idx = 0, len = value.length; idx < len; idx++) {
                    const item = value[idx];
                    if (res.some(re => re.fid === item.fid) || !regex.test(item.n)) continue;
                    res.push(item);
                }
            }
            update(res || []);
            if (res) Store.upDetail(code, { res });
        };
        // D_LOL
        upLOLTarget = () => {
            if (!this.D_MATCH || !this.D_LOL) return;
            GM_addStyle('.x-btn{display:revert}.x-btn::after{content:"离线"}');
        };
        driveListOffLine = async (e, { code, title }) => {
            e.preventDefault();
            e.stopPropagation();
  
            const LOCK = "active";
            const { classList } = e.target;
            if (classList.contains(LOCK)) return;
            classList.add(LOCK);
  
            const magnet = paramParse(this.M_MAGNET, ["suk", "bts", "btd"]);
            if (!magnet.length) return classList.remove(LOCK);
  
            const detail = Store.getDetail(code);
            let magnets = magnet.map(item => detail[`${item}_magnet`] ?? []).flat();
            if (!magnets.length) {
                const list = {
                    suk: () => Apis.fetchSukebei(code),
                    bts: () => Apis.fetchBTSOW(code),
                    btd: () => Apis.fetchBTDigg(code),
                };
  
                const res = await Promise.allSettled(magnet.map(item => list[item]()));
                for (let index = 0, { length } = res; index < length; index++) {
                    const { status, value } = res[index];
                    if (status !== "fulfilled" || !value) continue;
  
                    Store.upDetail(code, value);
                    magnets.push(...value[`${magnet[index]}_magnet`]);
                }
            }
            if (!magnets.length) return classList.remove(LOCK);
  
            magnets = this.movieSort(magnets);
            magnets = this.driveFail(magnets);
  
            if (/^\$\{.+\}$/.test(this.D_CID)) this.D_CID = "";
            const [wp_path_id, sign] = await Promise.all([this.driveCid("create"), Apis.driveSign()]);
            if (!wp_path_id || !sign) return classList.remove(LOCK);
  
            for (let index = 0, { length } = magnets; index < length; index++) {
                const isLast = index + 1 === length;
                const { link: url, zh } = magnets[index];
  
                let res = await Apis.driveAddTask({ url, wp_path_id, ...sign });
                if (!res) break;
  
                const { state, errcode, error_msg } = res;
                if (!state) {
                    if ([10008, 10007].includes(errcode)) {
                        if (errcode === 10008 && !isLast) continue;
                        notify({ type: "warn", title: error_msg });
                        break;
                    }
                    if (errcode === 911) {
                        classList.add("pending");
  
                        if (Store.getVerifyStatus() !== "pending") {
                            notify({ type: "warn", title: `${code} 任务暂停，等待校验` });
                            verify();
                        }
                        const listener = GM_addValueChangeListener(
                            "VERIFY_STATUS",
                            (name, old_value, new_value, remote) => {
                                if (!remote || !["verified", "failed"].includes(new_value)) return;
                                GM_removeValueChangeListener(listener);
                                classList.remove(LOCK, "pending");
                                if (new_value === "verified") this.driveListOffLine(e, { code, title });
                            }
                        );
                        break;
                    }
                }
  
                const cid = wp_path_id;
                const clickUrl = FILE_RUL.replace(REP, cid);
                res = await this.driveVerify({ code, cid });
                if (!res) {
                    if (!isLast) continue;
                    notify({
                        type: "info",
                        title: `${code} 验证失败`,
                        clickUrl: "https://115.com/?tab=offline&mode=wangpan",
                    });
                    break;
                }
                if (res?.length) {
                    notify({
                        type: "success",
                        title: `${code} 离线成功`,
                        text: `点击跳转目录`,
                        clickUrl: FILE_RUL.replace(REP, res[0].cid),
                    });
  
                    const list = [() => this.driveClear({ cid, res, code })];
                    let { file_name, fetch } = this.driveRename({ cid, res, zh, code, title });
                    if (fetch) {
                        res[0].n = file_name;
                        list.push(() => fetch());
                    }
  
                    Store.upDetail(code, { res });
                    const { selectors, upQuery } = this.click;
                    const item = e.target.closest(selectors);
                    if (item) this.driveMatchForList([{ item, code }], upQuery);
  
                    await Promise.allSettled(list.map(item => item()));
                } else {
                    notify({ type: "info", title: `${code} 任务结束`, clickUrl });
                }
                break;
            }
            if (!classList.contains("pending")) classList.remove(LOCK);
        };
        // D_CID
        driveCid = async function (type = "find") {
            let cid = this.D_CID.trim() || "${云下载}";
  
            if (/^\$\{.+\}$/.test(cid)) {
                let isFirst = true;
                const arr = cid
                    .replace(/\$|\{|\}/g, "")
                    .split("/")
                    .map(item => item.trim())
                    .filter(Boolean);
  
                for (let index = 0, { length } = arr; index < length; index++) {
                    let item = arr[index];
                    if (!item.startsWith("#")) {
                        cid = item;
                        break;
                    }
  
                    item = item.replace(/^#/, "");
                    if (!item) continue;
  
                    cid = this.info?.[item];
                    if (!cid?.length) {
                        isFirst = false;
                        continue;
                    }
  
                    if (typeof cid !== "string") cid = cid[0];
                    break;
                }
                if (!cid?.length) cid = "云下载";
  
                cid = await Apis._driveCid(cid, type);
                if (cid && (isFirst || type !== "find")) this.D_CID = cid;
            }
  
            return cid;
        };
        // D_VERIFY
        driveVerify = async ({ code, cid }) => {
            let verify = this.D_VERIFY <= 0;
  
            const { regex } = codeParse(code);
            const exist = Store.getDetail(code)?.res ?? [];
            for (let idx = 0; idx < this.D_VERIFY; idx++) {
                await delay();
  
                let res = await Apis.driveVideo(cid, ["ico"]);
                res = res.filter(({ n, t }) => regex.test(n) && t.startsWith(getDate()));
                if (!res?.length) continue;
  
                res = res.filter(item => !exist.find(e => e.fid === item.fid));
                if (!res.length) continue;
  
                verify = res;
                break;
            }
            return verify;
        };
        // D_FAIL
        driveFail = magnets => {
            const num = parseInt(this.D_FAIL ?? 0, 10);
            return num <= 0 ? magnets : magnets.slice(0, num);
        };
        // D_CLEAR
        driveClear = ({ cid, res, code }) => {
            if (!this.D_CLEAR) return;
  
            const { regex } = codeParse(code);
            unique(res.map(item => item.cid).filter(item => item !== cid)).forEach(async pid => {
                let fids = await Apis.driveFile(pid);
                if (!fids?.data) return;
  
                fids = fids.data.filter(({ n }) => !regex.test(n));
                if (fids.length) Apis.driveClear({ pid, fids });
            });
        };
        // D_RENAME
        driveRename = ({ cid, res, zh, code, title }) => {
            let file_name = this.D_RENAME?.trim();
            if (!file_name) return { file_name: `${code} ${title}` };
  
            file_name = file_name
                .replace(/\$\{字幕\}/g, zh ? "【中文字幕】" : "")
                .replace(/\$\{番号\}/g, code)
                .replace(/\$\{标题\}/g, title);
  
            if (!codeParse(code).regex.test(file_name)) file_name = `${code} - ${file_name}`;
  
            res = res.filter(item => item.ico);
            const noRegex = /\$\{序号\}/g;
            const data = [];
  
            unique(res.map(item => `${item.cid}/${item.ico}`)).forEach(key => {
                const [_cid, _ico] = key.split("/");
                res.filter(item => item.cid === _cid && item.ico === _ico).forEach((item, index) => {
                    data.push({ ...item, file_name: `${file_name.replace(noRegex, index + 1)}.${_ico}` });
                });
            });
  
            file_name = file_name.replace(noRegex, "");
            unique(res.map(item => item.cid).filter(item => item !== cid)).forEach(fid => {
                data.push({ fid, file_name });
            });
  
            return { file_name, fetch: () => Apis.driveRename(data) };
        };
        // D_TAG
        driveTag = async function (file_ids) {
            if (!file_ids?.length || !this.D_TAG?.trim()) return;
  
            let tag = paramParse(this.D_TAG, ["genre", "star"]);
            if (!tag.length) return;
  
            tag = tag.map(key => this.info[key] ?? []);
            tag = tag
                .flat()
                .map(item => item.trim())
                .filter(Boolean);
            if (!tag.length) return;
  
            const label = await Apis.driveLabel();
            if (!label?.length) return;
  
            let file_label = unique(tag).map(item => label.find(({ name }) => name === item)?.id ?? "");
            file_label = file_label.filter(Boolean);
            if (file_label.length) Apis.driveTag({ file_ids, file_label: file_label.join(",") });
        };
        // D_UPLOAD
        driveUpload = async function ({ cid, name, res }) {
            const keys = res;
            res = res.map(key => this.info[key]).filter(Boolean);
            const list = await Promise.allSettled(res.map(item => request(item, {}, "GET", { responseType: "blob" })));
  
            const target = `U_1_${cid}`;
            for (let index = 0, { length } = list; index < length; index++) {
                const { status, value } = list[index];
                if (status === "rejected" || !value?.size) continue;
  
                const filename = `${name}_${keys[index]}_.${res[index].split(".").at(-1)}`;
                const init = await Apis.driveInitUpload({ filename, filesize: value.size, target });
                if (!init?.host) continue;
  
                await Apis.driveUpload(init, value, filename);
            }
            notify({ text: "", type: "", title: "图传任务结束" });
        };
        // D_MODIFY
        upModifyTarget = () => {
            const modify = paramParse(this.D_MODIFY, ["clear", "rename", "tag", "upload", "delete"]);
            if (!modify.length) return modify;
  
            GM_addStyle(".x-btn{display:revert}");
            if (!modify.includes("delete")) return modify;
  
            GM_addStyle(".x-btn{background:var(--x-red)}.x-btn::after{content:'删除'}");
            return modify;
        };
        driveModify = async function (e, modify) {
            e.preventDefault();
            e.stopPropagation();
  
            const { classList, parentNode } = e.target;
            if (classList.contains("active")) return;
  
            classList.add("active");
            const { cid, fid, n } = parentNode.dataset;
            const list = [];
  
            if (modify.includes("delete")) {
                list.push(() => Apis.driveClear({ pid: cid, fids: [{ fid }] }));
            } else {
                const { code, title } = this.info;
                const { regex } = codeParse(code);
  
                let file_name = this.D_RENAME?.trim();
                if (file_name) {
                    file_name = file_name
                        .replace(/\$\{字幕\}/g, ZH_REGEX.test(n) ? "【中文字幕】" : "")
                        .replace(/\$\{番号\}/g, code)
                        .replace(/\$\{标题\}/g, title)
                        .replace(/\$\{序号\}/g, "");
                    if (!regex.test(file_name)) file_name = `${code} - ${file_name}`;
                }
  
                if (modify.includes("rename") && file_name) {
                    let name = n.split(".");
                    name.pop();
                    if (name.join("") !== file_name) list.push(() => Apis.driveRename([{ fid, file_name }]));
                }
                if (modify.includes("tag")) list.push(() => this.driveTag(fid));
                if (modify.some(item => ["clear", "upload"].includes(item))) {
                    const { data } = await Apis.driveFile(cid);
  
                    if (modify.includes("clear")) {
                        const fids = data.filter(({ n }) => !regex.test(n));
                        if (fids.length) list.push(() => Apis.driveClear({ pid: cid, fids }));
                    }
                    if (modify.includes("upload")) {
                        let uploads = paramParse(this.D_UPLOAD, ["cover", "img"]);
                        if (uploads.length) {
                            const items = data.filter(item => regex.test(item.n) && item.class === "PIC");
                            uploads = uploads.filter(item => !items.some(({ n }) => n.includes(`_${item}_`)));
                            if (uploads.length) {
                                file_name = file_name || `${code} ${title}`;
                                list.push(() => this.driveUpload({ cid, name: file_name, res: uploads }));
                            }
                        }
                    }
                }
            }
  
            if (list.length) await Promise.allSettled(list.map(item => item()));
            classList.remove("active");
            if (!DOC.querySelector(".x-btn.active")) this.driveMatch();
        };
        // OFFLINE
        driveOffLine = async function (e, { code, title, magnets }) {
            const { target } = e;
            const { magnet: type } = target.dataset;
            if (!type) return;
  
            e.preventDefault();
            e.stopPropagation();
  
            const setTab = type === "all";
            magnets = setTab ? this.driveFail(magnets) : magnets.filter(item => item.link === type);
            const length = magnets?.length ?? 0;
            if (!length) return;
  
            const { classList } = target;
            classList.remove("pending");
            classList.add("active");
            const originText = setTab ? "一键离线" : "添加离线";
            target.textContent = "请求中...";
            target.inert = true;
  
            const handleComplete = () => {
                classList.remove("active");
                target.textContent = originText;
                target.inert = false;
            };
  
            const [wp_path_id, sign] = await Promise.all([this.driveCid("create"), Apis.driveSign()]);
            if (!wp_path_id || !sign) return handleComplete();
  
            const warnTitle = `${code} 一键离线失败`;
            if (setTab) setTabBar({ title: `${code} 一键离线中...` });
            for (let index = 0; index < length; index++) {
                const isLast = index + 1 === length;
                const { link: url, zh } = magnets[index];
  
                let res = await Apis.driveAddTask({ url, wp_path_id, ...sign });
                if (!res) {
                    if (!index) return handleComplete();
                    break;
                }
  
                const { state, errcode, error_msg } = res;
                if (!state) {
                    if ([10008, 10007].includes(errcode)) {
                        if (errcode === 10008 && !isLast) continue;
                        notify({ type: "warn", title: error_msg });
                        if (setTab) setTabBar({ type: "warn", title: warnTitle });
                        break;
                    }
                    if (errcode === 911) {
                        classList.add("pending");
                        target.textContent = "校验中...";
                        const msg = { type: "warn", title: `${code} 任务暂停，等待校验` };
  
                        if (setTab) setTabBar(msg);
                        if (Store.getVerifyStatus() !== "pending") {
                            notify(msg);
                            verify();
                        }
                        const listener = GM_addValueChangeListener(
                            "VERIFY_STATUS",
                            (name, old_value, new_value, remote) => {
                                if (!remote || !["verified", "failed"].includes(new_value)) return;
                                GM_removeValueChangeListener(listener);
                                if (new_value !== "verified") return handleComplete();
                                this.driveOffLine(e, { magnets: magnets.slice(index), code, title });
                            }
                        );
                        break;
                    }
                }
  
                const cid = wp_path_id;
                const clickUrl = FILE_RUL.replace(REP, cid);
                res = await this.driveVerify({ code, cid });
                if (!res) {
                    if (!isLast) continue;
                    notify({
                        type: "info",
                        title: `${code} 验证失败`,
                        clickUrl: "https://115.com/?tab=offline&mode=wangpan",
                        setTab,
                    });
                    break;
                }
                if (res?.length) {
                    const _cid = res[0].cid;
                    const uploads = paramParse(this.D_UPLOAD, ["cover", "img"]);
                    notify({
                        type: "success",
                        title: `${code} 离线成功`,
                        setTab,
                        text: `点击跳转目录${uploads.length ? "，尝试图传中..." : ""}`,
                        clickUrl: FILE_RUL.replace(REP, _cid),
                    });
                    const { file_name, fetch } = this.driveRename({ cid, res, zh, code, title });
                    if (fetch) await fetch();
  
                    if (uploads.length) this.driveUpload({ cid: _cid, name: file_name, res: uploads });
                    this.driveTag(
                        res
                            .map(({ fid }) => fid)
                            .filter(Boolean)
                            .join(",")
                    );
                    this.driveClear({ cid, res, code });
                } else {
                    notify({ type: "info", title: `${code} 任务结束`, clickUrl, setTab });
                }
                break;
            }
  
            if (classList.contains("pending")) return;
            await delay();
            this.driveMatch();
            handleComplete();
        };
  
        // A_LINK
        advancedLink = async (e, { type = "left", defaultLink }) => {
            e.preventDefault();
            e.stopPropagation();
  
            const { n: name, pc: pickcode, fid, cid } = e.target.dataset;
            defaultLink = defaultLink ?? type === "left" ? `${PICK_RUL}${pickcode}` : FILE_RUL.replace(REP, cid);
  
            if (!fid || fid === "undefined") return openInTab(defaultLink);
  
            let config = this.A_LINK?.trim()?.split("\n");
            let index = config.findIndex(item => item === `[${type}]`);
            if (index === -1) return openInTab(defaultLink);
  
            config = config[index + 1]?.trim();
            if (!config) return openInTab(defaultLink);
  
            config = config
                .replaceAll("${#pickcode}", pickcode)
                .replaceAll("${#cid}", cid)
                .replaceAll("${#name}", encodeURIComponent(name));
            if (!config.includes("${#path}")) return openInTab(config);
  
            let path = await Apis.driveDetail(fid);
            if (!path?.paths?.length) return;
  
            path = path.paths
                .map(item => item.file_name)
                .splice(1)
                .join("/");
            openInTab(config.replaceAll("${#path}", encodeURIComponent(path)));
        };
    }
  
    class JavDB extends Common {
        constructor() {
            super();
            return super.init();
        }
  
        excludeMenu = ["G_DARK", "L_MIT", "M_SUB"];
        routes = {
            list: /^\/($|guess|(un)?censored|western|fc2|anime|(advanced_)?search|video_codes|tags|rankings|actors|series|makers|directors|publishers|lists|users)/i,
            movie: /^\/v\/\w+/i,
            others: /.*/i,
        };
        _style = {
            common: `
          html {
              overflow: overlay;
              padding-bottom: 0 !important;
          }
          body {
              min-height: 100%;
          }
          .section {
              padding: 20px;
          }
          #search-bar-container {
              margin-bottom: 8px !important;
          }
          .search-panel button {
              border: none;
          }
          #search-type, #video-search {
              z-index: auto;
              border: none;
              box-shadow: none;
          }
          .title:not(:last-child) {
              margin-bottom: 20px;
          }
          .main-title {
              padding-top: 0;
          }
          .app-desktop-banner, #footer {
              display: none !important;
          }
          :root[data-theme="dark"] ::-webkit-scrollbar-thumb {
              background: var(--x-grey) !important;
          }
          a.box:is(:focus, :hover) {
              box-shadow: none !important;
          }
          :root[data-theme="dark"] .box:hover {
              background: unset;
          }
          :root[data-theme="dark"] img {
              filter: brightness(.9) contrast(.9) !important;
          }
          nav.pagination {
              display: none;
              margin: 0 -4px 20px !important;
              padding: 0;
              border: none;
          }
          :root[data-theme="dark"] nav.pagination {
              border: none !important;
          }
          .float-buttons {
              right: 8px;
          }
          `,
        };
        search = {
            selectors: "#video-search",
            pathname: `/search?q=${REP}&f=all`,
        };
        click = {
            selectors: [":is(.movie-list, .actors, .section-container) a:has(strong)"],
            codeQuery: ".video-title strong",
            upQuery: ".cover",
        };
        merge = {
            start: list => {
                DOC.querySelector("#navbar-menu-hero .navbar-start")?.insertAdjacentHTML(
                    "beforeend",
                    `<div class="navbar-item has-dropdown is-hoverable">
                      <a class="navbar-link" href="/?merge=${list[0]}">合并列表</a>
                      <div class="navbar-dropdown is-boxed">
                          ${list.map(item => `<a class="navbar-item" href="/?merge=${item}">${item}</a>`).join("")}
                      </div>
                  </div>`
                );
            },
        };
  
        list = {
            docStart() {
                const style = `
              .awards,
              .form-panel .user-profile,
              .section:has(.actors, .movie-list, .section-container, .user-container .common-list) {
                  padding-bottom: 0;
              }
              :is(.tabs, .message):not(:last-child) {
                  margin-bottom: 20px;
              }
              .movie-list {
                  opacity: 0;
              }
              .actors, .movie-list, .section-container {
                  gap: 20px !important;
                  margin: 0 0 20px !important;
                  padding-bottom: 0;
              }
              .container > br,
              .actor-filter hr,
              .movie-list:has(.tags),
              .user-container > .column.is-10 > .message.is-warning {
                  display: none;
              }
              .main-tabs, .box:has(> form) {
                  margin-bottom: 20px !important;
              }
              .toolbar {
                  margin-top: -10px;
                  padding-bottom: 0;
                  word-spacing: -20px;
              }
              .toolbar * {
                  word-spacing: 0;
              }
              .toolbar .button-group, .actor-tags .content .tag {
                  margin: 0 10px 10px 0;
              }
              #t {
                  height: 2.2rem;
              }
              #tags {
                  margin: -20px 0 20px;
              }
              #tags dt a.tag-expand {
                  margin-top: .44rem;
              }
              .section:has(> .awards, > .user-container) {
                  padding: 0;
              }
              .divider-title {
                  margin-bottom: 16px !important;
                  padding-bottom: 0;
                  border-bottom: none;
              }
              .actors .box {
                  margin-bottom: 0;
              }
              .actor-filter-toolbar {
                  padding-bottom: 20px;
              }
              .section-columns {
                  margin-bottom: 8px !important;
                  padding-top: 0;
              }
              .columns:has(> .section-addition) {
                  margin-bottom: 8px;
              }
              .actor-tags {
                  margin-bottom: 20px !important;
                  padding-bottom: 0;
                  font-size: 0;
                  border-bottom: none;
              }
              .actor-tags .content:not(.collapse) {
                  margin-bottom: -10px;
              }
              .user-container {
                  margin: -10px -10px 0 !important;
              }
              .user-container > .column {
                  padding: 10px 10px 0;
              }
              .user-container > .column:first-child {
                  padding-bottom: 10px;
              }
              .user-container .common-list ul {
                  margin-bottom: 20px;
              }
              .list-item:not(:last-child) {
                  border-bottom: 1px solid #dbdbdb;
              }
              .user-container .common-list .list-item {
                  align-items: center;
                  margin: 0;
                  padding: 10px 2px;
              }
              .user-container .common-list .list-item:first-child {
                  padding-top: 0;
              }
              .user-container .common-list .list-item:last-child {
                  padding-bottom: 0;
              }
              .user-container .common-list .list-item .column {
                  padding: 0;
              }
              .user-container .common-list .list-item .column:first-child {
                  flex: 1;
              }
              .user-container .common-list .list-item .column:last-child {
                  width: auto;
              }
              `;
                const layout = `
              @media (width < 576px) {
                  .movie-list.v, .actors {
                      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                  }
                  .movie-list.h {
                      grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
                  }
              }
              @media (width >= 576px) {
                  .movie-list.v, .actors {
                      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                  }
                  .movie-list.h {
                      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                  }
              }
              @media (width >= 768px) {
                  .movie-list.v, .actors {
                      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
                  }
                  .movie-list.h {
                      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                  }
              }
              @media (width >= 992px) {
                  .movie-list.v, .actors {
                      grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
                  }
                  .movie-list.h {
                      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                  }
              }
              @media (width >= 1200px) {
                  .movie-list.v, .actors {
                      grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
                  }
                  .movie-list.h {
                      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                  }
              }
              @media (width >= 1400px) {
                  .movie-list.v, .actors {
                      grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
                  }
                  .movie-list.h {
                      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
                  }
              }
              .user-container .column:has(.movie-list, .actors) {
                  container-type: inline-size;
              }
              @container (width < 576px) {
                  .column .movie-list {
                      grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
                  }
                  .column .movie-list.v, .actors {
                      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                  }
              }
              @container (width >= 576px) {
                  .column .movie-list {
                      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                  }
                  .column .movie-list.v, .actors {
                      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                  }
              }
              @container (width >= 768px) {
                  .column .movie-list {
                      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                  }
                  .column .movie-list.v, .actors {
                      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
                  }
              }
              @container (width >= 992px) {
                  .column .movie-list {
                      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                  }
                  .column .movie-list.v, .actors {
                      grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
                  }
              }
              @container (width >= 1200px) {
                  .column .movie-list {
                      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
                  }
                  .column .movie-list.v, .actors {
                      grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
                  }
              }
              @container (width >= 1400px) {
                  .column .movie-list {
                      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
                  }
                  .column .movie-list.v, .actors {
                      grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
                  }
              }
              `;
                const card = `
              :is(.movie-list, .actors) .box {
                  padding: 0 0 10px;
              }
              .movie-list .item .cover, .actor-box a figure {
                  background: var(--x-sub-ftc);
              }
              :root[data-theme="dark"] :is(.movie-list .item .cover, .actor-box a figure) {
                  background: var(--x-grey);
              }
              .movie-list .item .cover {
                  padding: 0 !important;
                  aspect-ratio: var(--x-cover-ratio);
              }
              .actors .box img {
                  height: 100%;
                  object-fit: cover;
                  opacity: 0;
              }
              .movie-list .item .cover img {
                  width: 100%;
                  object-fit: contain;
                  opacity: 0;
              }
              .movie-list .item .cover:hover img {
                  z-index: auto;
                  transform: none;
              }
              .movie-list.v .item .cover {
                  aspect-ratio: var(--x-thumb-ratio);
              }
              .movie-list.v .item .cover img {
                  object-fit: cover !important;
              }
              .movie-list .item .video-title, .actor-box a strong, .section-container .box {
                  font-size: 14px;
                  line-height: var(--x-line-h);
              }
              .movie-list .item .video-title {
                  box-sizing: content-box;
                  padding: 10px 0 0;
              }
              .movie-list .item .score {
                  padding: 0;
              }
              .movie-list .item .box :is(.video-title, .score, .tags, .meta-buttons), .actor-box a strong {
                  padding: 10px 10px 0;
              }
              .movie-list .item .meta {
                  padding: 0 10px;
              }
              .movie-list .box .tags {
                  min-height: 44px;
                  margin-bottom: -10px;
              }
              .movie-list .box .tags .tag {
                  margin-bottom: 10px;
              }
              .actor-box a figure {
                  aspect-ratio: var(--x-avatar-ratio);
              }
              .actor-box a.button.is-danger {
                  width: auto;
                  margin: 10px 10px 0 !important;
              }
              .movie-list .box .meta-buttons a.button.is-danger {
                  margin: 0 !important;
              }
              .section-container a:has(> strong) {
                  display: flex;
              }
              .section-container .box strong {
                  flex: 1;
                  padding-right: 10px;
                  overflow: hidden;
                  white-space: nowrap;
                  text-overflow: ellipsis;
              }
              `;
                this.globalDark(`${this._style.common}${style}${layout}${card}${this.listMovieTitle()}`);
                this.listMerge();
                this.upLOLTarget();
            },
            contentLoaded() {
                this.globalSearch();
                if (location.pathname === "/users/favorite_lists") {
                    this.click.selectors.push(".common-list .column.is-10 a");
                }
                this.globalClick();
                this.modifyLayout();
            },
            modifyLayout() {
                const tags = DOC.querySelector("#tags:not(select)");
                if (tags) {
                    const toggle = DOC.create("button", { class: "button is-info", type: "button" }, "折叠");
                    const tabs = DOC.querySelector(".tabs.is-boxed");
                    tabs.classList.add("is-align-items-flex-end");
                    tabs.append(toggle);
                    toggle.addEventListener("click", () => tags.classList.toggle("is-hidden"));
                }
  
                for (const list of DOC.querySelectorAll(".movie-list:not(:has(.tags))")) {
                    const _list = list.cloneNode(true);
                    const items = this.modifyItem([..._list.querySelectorAll(".item")]);
                    _list.innerHTML = "";
                    _list.append(...items);
                    _list.classList.add("x-in");
                    list.replaceWith(_list);
                }
  
                let container;
                const lists = DOC.querySelectorAll(".actors");
                const { length } = lists;
                if (length) {
                    if (length === 1) {
                        container = lists[0];
                    } else {
                        for (let index = 0; index < length; index++) {
                            for (const item of lists[index].querySelectorAll(".box")) fadeInImg(item);
                        }
                    }
                }
                container =
                    container ??
                    DOC.querySelector([
                        ".movie-list:has(.tags)",
                        ".section-container:has(.box)",
                        ".user-container:has(nav.pagination) .common-list ul",
                    ]);
                if (!container) {
                    if (DOC.querySelector(".movie-list:is(.h, .cols-3) .cover")) this.listMovieVideo(DOC);
                    return;
                }
  
                this.listScroll({
                    container,
                    itemSelector: [
                        ".movie-list:has(.tags) .item",
                        ".actors .box",
                        ".section-container .box",
                        ".common-list ul .list-item",
                    ],
                    path: ".pagination-next",
                    start: items => {
                        container.innerHTML = "";
                        container.append(...items);
                        container.classList.add("x-grid");
                    },
                    showPage: () => DOC.querySelector("nav.pagination")?.classList.add("x-flex-center"),
                    onLoad: items => container.append(...items),
                });
            },
            modifyItem(items, isMerge) {
                const isMovieList = items.some(item => item.querySelector(".video-title"));
                const res = [];
                const hlUrls = [];
  
                for (let index = 0, { length } = items; index < length; index++) {
                    const item = items[index];
                    let code = "";
                    let date = "";
                    let score = 0;
                    let highlight = false;
  
                    if (isMovieList) {
                        code = item.querySelector(".video-title strong");
                        if (!code) continue;
  
                        code = code.textContent.trim();
                        date = item.querySelector(".meta")?.textContent ?? "";
                        date = date.replaceAll("-", "").trim();
  
                        if (isMerge) {
                            if (res.some(t => t.code === code && t.date === date)) continue;
                            score = (item.querySelector(".score")?.textContent ?? "").match(NUM_REGEX)[0] ?? 0;
                            item.querySelector(".meta-buttons")?.remove();
                        }
  
                        this.modifyMovieCard(item);
                        if (item.matches(".x-hide")) continue;
  
                        highlight = item.matches(".x-highlight");
                        if (highlight) hlUrls.push(item.querySelector("a").href);
                    }
  
                    fadeInImg(item);
                    res.push({ code, date, score, highlight, item });
                }
                if (!res.length) return res;
  
                if (isMovieList) {
                    this.driveMatchForList(res, this.click.upQuery);
                    addPrefetch(hlUrls);
                    if (isMerge) {
                        res.sort((pre, next) => {
                            return pre.score === next.score ? next.date - pre.date : next.score - pre.score;
                        });
                    }
                    res.sort((pre, next) => (pre.highlight > next.highlight ? -1 : 1));
                }
                return res.map(({ item }) => item);
            },
            modifyMovieCard(item) {
                const titleNode = item.querySelector(".video-title");
                const code = titleNode.querySelector("strong").textContent.trim();
                const title = titleNode.textContent.replace(code, "").trim();
                const score = item
                    .querySelector(".score .value")
                    .textContent.replace(/&nbsp;/g, "")
                    .trim();
                const tags = item.querySelectorAll(".tags .tag");
  
                const filterClass = this.listFilter({ code, title, score, tags });
                if (filterClass) item.classList.add(filterClass);
                if (filterClass === "x-hide") return;
  
                titleNode.insertAdjacentHTML(
                    "afterbegin",
                    `<span class="x-btn" title="列表离线" data-code="${code}" data-title="${title}"></span>`
                );
                if (item.querySelector(".tags")) titleNode.classList.add("x-ellipsis");
                titleNode.classList.add("x-title");
            },
        };
        movie = {
            info: {},
            params: {},
            magnets: [],
  
            docStart() {
                const style = `
              .video-meta-panel {
                  margin: -10px 0 20px;
                  padding: 0;
              }
              .video-meta-panel > .columns {
                  margin: 0;
                  align-items: start;
              }
              .video-meta-panel > .columns > .column {
                  padding: 0 10px;
              }
              .video-meta-panel > .columns > .column-video-cover {
                  margin: 10px;
                  padding: 0;
                  aspect-ratio: var(--x-cover-ratio);
              }
              .column-video-cover a:has(> :is(img, video)),
              .column-video-cover .cover-container::after,
              .preview-video-container::after {
                  width: 100%;
                  height: 100%;
              }
              img, video {
                  vertical-align: top;
              }
              :is(.column-video-cover, .tile-images) a:has(> :is(img, video)) {
                  display: block;
                  background: var(--x-sub-ftc);
              }
              .tile-images a:has(> img) {
                  aspect-ratio: var(--x-thumb-ratio);
              }
              .preview-images a:has(> img) {
                  aspect-ratio: var(--x-sprite-ratio);
              }
              :root[data-theme="dark"] :is(.column-video-cover, .tile-images) a:has(> :is(img, video)) {
                  background: var(--x-grey) !important;
              }
              :is(.column-video-cover, .tile-images) :is(img, video) {
                  width: 100% !important;
                  height: 100% !important;
                  max-height: unset !important;
                  object-fit: contain;
              }
              .movie-panel-info div.panel-block {
                  padding: 10px 0;
                  font-size: 14px;
                  line-height: var(--x-line-h);
              }
              :root[data-theme="dark"] .panel .panel-block:last-child {
                  border-bottom: none;
              }
              .panel-block:has(#x-res) {
                  padding-bottom: 0;
                  border-bottom: 0;
              }
              .panel-block:has(#x-match) {
                  border-bottom: 0;
              }
              .panel-block:has(#toolbar) {
                  padding-top: 0;
              }
              .movie-panel-info .copy-to-clipboard {
                  height: var(--x-line-h);
              }
              .video-detail > .columns {
                  margin-bottom: 8px;
              }
              .message-header,
              .message-body,
              #magnets-content > .columns > .column {
                  padding: 10px;
              }
              .video-panel .tile-images, .plain-grid-list {
                  gap: 10px;
              }
              .video-panel .tile-images .tile-item .video-number {
                  padding-top: 6px;
              }
              .columns[data-controller="movie-tab"],
              #magnets-content > .columns,
              .plain-grid-list a.box {
                  margin: 0;
              }
              .columns[data-controller="movie-tab"] > .column,
              .video-panel .message-body .top-meta {
                  padding: 0;
              }
              #tabs-container .message {
                  margin-bottom: 20px !important;
              }
              .top-meta :is(.button.is-info, .moj-content) {
                  display: none;
              }
              #reviews .review-items .review-item {
                  padding: 10px 0;
              }
              #reviews .review-items .review-item:first-child {
                  padding-top: 0;
              }
              #reviews .review-items .review-item:last-child {
                  padding-bottom: 0;
              }
              .plain-grid-list .item,
              nav.pagination.no-line:has(a) {
                  display: flex;
              }
              .plain-grid-list .item {
                  align-items: baseline;
              }
              .plain-grid-list .item strong {
                  flex: 1;
                  padding-right: 10px;
                  overflow: hidden;
                  white-space: nowrap;
                  text-overflow: ellipsis;
              }
              .column-video-cover .cover-container {
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
              }
              .isPlayer .cover-container {
                  top: 25%;
              }
              .column-video-cover .cover-container .play-button {
                  position: unset;
                  transform: none;
              }
              .column-video-cover a[id] {
                  opacity: 0;
                  position: absolute;
                  top: 0;
                  left: 0;
              }
              .column-video-cover a[id].active {
                  z-index: 1;
                  opacity: 1;
                  transition: opacity .25s linear;
              }
              .column-video-cover video {
                  display: inline !important;
              }
              #x-res, #toolbar {
                  width: 100%;
              }
              :is(#x-res, #toolbar) button {
                  flex: 1;
              }
              .tags:has(.x-jump) {
                  margin-bottom: -5px;
              }
              html:has(.fancybox-is-open) {
                  overflow: hidden;
              }
              .fancybox-slide--image.fancybox-slide--current {
                  overflow: overlay;
              }
              .fancybox-slide--image.fancybox-slide--current .fancybox-content {
                  left: 50%;
                  width: fit-content !important;
                  height: auto !important;
                  padding: 44px 0;
                  transform: translateX(-50%) !important;
              }
              .fancybox-slide--image.fancybox-slide--current .fancybox-content img {
                  position: static;
                  width: auto;
                  max-width: calc(100vw - 140px);
                  height: auto;
              }
              .top-meta:has(.tag) {
                  margin-bottom: 10px;
                  padding-right: 10px !important;
              }
              .top-meta .tags {
                  flex: 1;
                  margin: 0 0 -8px;
              }
              #magnets-content {
                  ${this.M_LINE > 0 ? `max-height: calc(45px * ${this.M_LINE});` : ""}
                  overscroll-behavior-y: contain;
                  overflow: overlay;
              }
              :root[data-theme="dark"] #magnets-content::-webkit-scrollbar-thumb {
                  background: #4a4a4a !important;
              }
              #magnets-content .item {
                  height: 45px;
                  border-bottom: 1px solid #ededed;
              }
              :root[data-theme=dark] #magnets-content .item {
                  border-color: #4a4a4a;
              }
              #magnets-content .item:last-child {
                  border: none;
              }
              #magnets-content .item .column:first-child {
                  flex: 3;
                  font-weight: bold;
              }
              #magnets-content .item .column:is(:nth-child(1), :nth-child(2), :nth-child(3)) {
                  text-align: left;
              }
              #magnets-content .item .column.x-line {
                  max-width: 180px;
              }
              #magnets-content .x-from {
                  min-width: 65px;
              }
              #magnets-content .item .column:last-child {
                  flex: none;
                  text-align: right;
              }
              #x-total {
                  padding: 10px 10px 0;
                  text-align: right;
              }
              #toolbar button.active,
              #magnets-content a[data-magnet].active {
                  opacity: .5;
              }
              `;
                this.globalDark(`${this._style.common}${style}`);
                this.listMerge();
            },
            async contentLoaded() {
                this.globalSearch();
                this.modifyLayout();
  
                const titleNode = DOC.querySelector("h2.title");
                const currentTitle = titleNode.querySelector(".current-title");
                const originTitle = titleNode.querySelector(".origin-title");
                const code = DOC.querySelector(".first-block .value").textContent;
                const title = (originTitle ?? currentTitle).textContent.replace(code, "").trim();
                this.info = {
                    code: /^FC2-\d/i.test(code) ? code.replace("-", "-PPV-") : code,
                    title,
                    transTitle: originTitle ? currentTitle.textContent.trim() : "",
                    cover: DOC.querySelector(".column-video-cover img").src,
                    isVR: VR_REGEX.test(title),
                    studio: "",
                    series: "",
                    genre: [],
                    star: [],
                    video: "",
                };
                const video = DOC.querySelector("#preview-video source")?.getAttribute("src") ?? "";
                if (video && (await request(video, {}, "HEAD"))) this.info.video = video;
                for (const item of DOC.querySelectorAll(".movie-panel-info > .panel-block")) {
                    let [label, value] = item.querySelectorAll(["strong", ".value"]);
                    if (!label || !value) continue;
  
                    label = label?.textContent?.trim();
                    if (!label) continue;
  
                    if (["片商:", "賣家:"].includes(label)) this.info.studio = value.textContent.trim();
                    if (label === "系列:") this.info.series = value.textContent.trim();
                    if (label === "評分:") item.classList.add("score");
                    if (label === "類別:") {
                        item.classList.add("genre");
                        if (!value.querySelector("a")) continue;
                        this.info.genre = Array.from(value.querySelectorAll("a")).map(item => item.textContent);
                    }
                    if (label === "演員:") {
                        item.classList.add("star");
                        if (!value.querySelector("a")) continue;
                        const male = [];
                        const female = [];
                        value.textContent
                            .split("\n")
                            .map(item => item.trim())
                            .filter(Boolean)
                            .forEach(item => {
                                (item.includes("♂") ? male : female).push(item.replace(/♂|♀/, ""));
                            });
                        this.info.star = [...female, ...male];
                    }
                }
                this.getMovieResource(this.info);
                if (this.M_COPY) {
                    titleNode.insertAdjacentHTML(
                        "beforeend",
                        `&nbsp;<a class="copy-to-clipboard" title="原始标题" data-clipboard-text="${code} ${title}">复制</a>`
                    );
                    GM_addStyle("#magnets-content a[data-copy]{display:inline-flex!important}");
                    DOC.querySelector(".panel-block.star .value").addEventListener("contextmenu", e => {
                        const { target } = e;
                        if (target.matches("a")) handleCopy(e, "", target.textContent);
                    });
                }
  
                this.movieRes();
                this.movieTitle();
                this._movieJump();
                this.movieScore();
                this.movieStar();
                this.driveMatch();
                this.refactorTable();
            },
            modifyLayout() {
                if (history.scrollRestoration) history.scrollRestoration = "manual";
                window.scrollTo({ top: 150, left: 0, behavior: "smooth" });
                this.modifyItem();
  
                unsafeWindow.$.fancybox.defaults.loop = true;
                unsafeWindow.$.fancybox.defaults.smallBtn = false;
                unsafeWindow.$.fancybox.defaults.toolbar = true;
                unsafeWindow.$.fancybox.defaults.buttons = ["slideShow", "thumbs", "close"];
                unsafeWindow.$.fancybox.defaults.animationEffect = "fade";
                unsafeWindow.$.fancybox.defaults.animationDuration = 300;
                unsafeWindow.$.fancybox.defaults.transitionDuration = 150;
                unsafeWindow.$.fancybox.defaults.touch = { vertical: false };
                unsafeWindow.$.fancybox.defaults.wheel = false;
                unsafeWindow.$.fancybox.defaults.clickContent = false;
  
                const cover = DOC.querySelector(".cover-container");
                if (!cover) return;
  
                const _cover = cover.cloneNode();
                const playBtn = cover.querySelector(".play-button");
                _cover.append(playBtn.cloneNode(true));
                playBtn.replaceWith(_cover);
                _cover.addEventListener("click", e => e.stopPropagation());
  
                cover.removeAttribute("rel");
                cover.removeAttribute("class");
                cover.removeAttribute("target");
                cover.href = cover.querySelector("img").src;
                cover.setAttribute("data-fancybox", "gallery");
            },
            modifyItem() {
                const selectors = [".tile-images.tile-small .tile-item"];
                const codeQuery = ".video-number";
                const upQuery = "a:has(> img)";
  
                const res = [];
                for (const item of DOC.querySelectorAll(selectors)) {
                    const img = item.querySelector("img");
                    if (!img) continue;
  
                    img.replaceWith(DOC.create("a", { href: VOID }, img.cloneNode()));
                    const code = item.querySelector(codeQuery)?.textContent;
                    if (!code) continue;
  
                    item.querySelector(".video-title")?.classList.add("x-title");
                    res.push({ item, code });
                }
                this.driveMatchForList(res, upQuery);
  
                this.click.selectors = selectors;
                this.click.codeQuery = codeQuery;
                this.click.upQuery = upQuery;
                this.globalClick();
            },
            movieRes() {
                const { res } = this.params;
                if (!res?.length) return;
  
                const box = DOC.querySelector(".column-video-cover");
                const info = DOC.querySelector(".movie-panel-info");
                const first = "x-cover";
                const firstQuery = `button[for=${first}]`;
  
                const cover = box.querySelector("a[data-fancybox]");
                cover.setAttribute("data-fancybox", "tabbar");
                cover.setAttribute("id", first);
                cover.classList.add("active");
                box.insertAdjacentHTML(
                    "afterbegin",
                    '<div class="x-side prev"><span>🔙</span></div><div class="x-side next"><span>🔜</span></div>'
                );
                info.insertAdjacentHTML(
                    "afterbegin",
                    `<div class="panel-block">
                      <div id="x-res" class="buttons has-addons are-small">
                          <button class="button is-light is-active" for="${first}">封面</button>
                          ${res
                              .map(
                                  item =>
                                      `<button class="button is-light is-loading" for="x-${item}" disabled>暂无</button>`
                              )
                              .join("")}
                      </div>
                  </div>`
                );
  
                box.addEventListener("click", e => {
                    const { target } = e;
  
                    const side = target.closest(".x-side");
                    if (side) {
                        e.stopPropagation();
                        e.preventDefault();
  
                        const navs = info.querySelectorAll("#x-res button:not([disabled])");
                        const { length } = navs;
                        if (length === 1) return;
  
                        let index = Array.from(navs).findIndex(item => item.classList.contains("is-active"));
                        index = side.classList.contains("next") ? index + 1 : index - 1;
                        if (index > length - 1) index = 0;
                        if (index === -1) index = length - 1;
                        return navs[index].click();
                    }
  
                    if (target.closest(".x-player")) {
                        e.stopPropagation();
                        e.preventDefault();
                        return box.querySelector(".x-side.next").click();
                    }
                });
                info.querySelector("#x-res").addEventListener("click", ({ target }) => {
                    const tag = target.getAttribute("for");
                    if (!tag) return;
  
                    const active = box.querySelector(`#${tag}`);
                    if (target.classList.contains("is-active")) return active.querySelector("video")?.focus();
  
                    const _target = info.querySelector("#x-res .is-active");
                    _target.classList.toggle("is-active");
                    if (_target.matches(firstQuery)) box.classList.remove("x-player");
  
                    target.classList.toggle("is-active");
                    if (target.matches(firstQuery) && box.classList.contains("isPlayer")) {
                        box.classList.add("x-player");
                    }
  
                    const _active = box.querySelector(".active");
                    _active.classList.toggle("active");
                    _active.querySelector("video")?.pause();
  
                    active.classList.toggle("active");
                    const video = active.querySelector("video");
                    if (!video) return;
  
                    video.focus();
                    video.play();
                });
                res.forEach(key => {
                    this.upMovieResource(key, val => {
                        const id = `x-${key}`;
                        const nav = info.querySelector(`button[for=${id}]`);
                        nav.classList.remove("is-loading");
                        if (!val.length) return;
  
                        this.info[key] = val;
                        nav.removeAttribute("disabled");
                        nav.innerHTML = TAB_NAME[key];
  
                        const targetId = `${id}-target`;
                        const node = key === "img" ? DOC.create(key, { src: val }) : createVideo(val, { id: targetId });
                        const container = DOC.create(
                            "a",
                            { "data-fancybox": "tabbar", id, href: key === "img" ? val : `#${targetId}` },
                            node
                        );
                        box.append(container);
                        if (key === "img" || !nav.previousElementSibling?.matches(firstQuery)) return;
                        box.classList.add("isPlayer", "x-player");
                    });
                });
            },
            movieTitle() {
                this.upMovieResource(
                    "title",
                    val => {
                        DOC.querySelector("#x-title").textContent = val.length ? val : "暂无数据";
                    },
                    () => {
                        DOC.querySelector(".panel-block.first-block").insertAdjacentHTML(
                            "beforebegin",
                            '<div class="panel-block"><strong>机翻:</strong>&nbsp;<span id="x-title" class="value">查询中...</span></div>'
                        );
                    }
                );
            },
            _movieJump() {
                this.movieJump(
                    this.info,
                    res => {
                        DOC.querySelector(".panel-block.first-block").insertAdjacentHTML(
                            "afterend",
                            res
                                .map(
                                    ({ group, list }) =>
                                        `<div class="panel-block"><strong>${group}:</strong>&nbsp;<div class="tags">${list
                                            .map(
                                                ({ url, query, name }) =>
                                                    `<span class="x-jump tag is-light${
                                                        query ? " is-info" : ""
                                                    }" data-query="${query}" data-href="${url}">${name}</span>`
                                            )
                                            .join("")}</div></div>`
                                )
                                .join("")
                        );
                    },
                    (res, { classList }) => {
                        classList.remove("is-light");
                        if (res.zh) classList.replace("is-info", "is-warning");
                    }
                );
            },
            movieScore() {
                const { score } = this.params;
                if (!score?.length) return;
  
                const scoreTarget = DOC.querySelector(".panel-block.score");
                const insertTarget = scoreTarget ?? DOC.querySelector(".panel-block.genre, .panel-block.star");
                const insertScore = (position, item) => {
                    insertTarget?.insertAdjacentHTML(
                        position,
                        `<div class="panel-block"><strong>${item.toUpperCase()}评分:</strong>&nbsp;<span id="x-${item}_score" class="value">查询中...</span></div>`
                    );
                };
  
                let position = "beforebegin";
                for (const item of score) {
                    if (item === "db") {
                        if (scoreTarget) {
                            scoreTarget.querySelector("strong").innerHTML = "DB评分:";
                            position = "afterend";
                        }
                        continue;
                    }
                    insertScore(position, item);
                }
                score
                    .filter(key => key !== "db")
                    .forEach(key => {
                        key = `${key}_score`;
                        this.upMovieResource(key, val => {
                            const node = DOC.querySelector(`#x-${key}`);
  
                            if (!val.length) {
                                node.textContent = "暂无数据";
                                return;
                            }
  
                            const { score, total, num } = val[0];
                            let stars = Math.floor((score / total) * 5);
                            stars = Array(5).fill("", 0, stars).fill(" gray", stars, 5);
  
                            node.innerHTML = `<span class="score-stars">${stars
                                .map(item => `<i class="icon-star${item}"></i>`)
                                .join("")}</span>&nbsp;${score}分${num ? `, 由${num}人评价` : ""}`;
                        });
                    });
            },
            movieStar() {
                const target = DOC.querySelector(".panel-block.star .value");
                this.upMovieResource(
                    "star",
                    val => {
                        this.info.star = val;
                        target.innerHTML = !val.length
                            ? "暂无数据"
                            : val
                                  .map(
                                      item =>
                                          `<a href="/search?f=actor&q=${item}">${item}</a><strong class="symbol female">♀</strong>`
                                  )
                                  .join("&nbsp;");
                    },
                    () => {
                        target.innerHTML = "查询中...";
                    }
                );
            },
            refactorTable() {
                let caption = DOC.querySelector(".top-meta");
                caption.classList.add("is-flex");
                caption.insertAdjacentHTML("afterbegin", '<div class="tags"></div>');
                caption = caption.querySelector(".tags");
                const table = DOC.querySelector("#magnets-content");
                table.parentElement.insertAdjacentHTML("beforeend", '<div id="x-total">总数 0</div>');
  
                const magnets = [];
                for (const item of table.querySelectorAll(".item")) {
                    const first = item.querySelector("a");
                    if (!first) continue;
  
                    const size = first.querySelector(".meta")?.textContent?.trim() ?? "";
                    magnets.push({
                        name: first.querySelector(".name").textContent,
                        link: first.href.split("&")[0],
                        size,
                        bytes: transToBytes(size),
                        zh: !!first.querySelector(".tag.is-warning.is-small.is-light"),
                        date: item.querySelector(".time")?.textContent ?? "",
                    });
                }
                table.innerHTML = "暂无数据";
                this.refactorTbody(magnets);
  
                (this.params?.magnet ?? []).forEach(key => {
                    key = `${key}_magnet`;
                    this.upMovieResource(
                        key,
                        res => this.refactorTbody(res, key),
                        () => {
                            caption.insertAdjacentHTML(
                                "beforeend",
                                `<span class="tag is-success is-light" id="x-${key}">${key
                                    .split("_")[0]
                                    .toUpperCase()}搜索</span>`
                            );
                        }
                    );
                });
            },
            refactorTbody(magnets, key) {
                if (!magnets.length) return;
  
                if (key) DOC.querySelector(`#x-${key}`)?.classList.remove("is-light");
                let start;
  
                if (this.magnets.length) {
                    for (const item of magnets) {
                        const { link, zh } = item;
                        const index = this.magnets.findIndex(item => item.link.toLowerCase() === link.toLowerCase());
                        if (index === -1) {
                            this.magnets.push(item);
                            continue;
                        }
                        if (zh) this.magnets[index].zh = zh;
                    }
                    magnets = this.magnets;
                } else {
                    const caption = DOC.querySelector(".top-meta");
                    start = () => {
                        caption
                            .querySelector(".tags")
                            .insertAdjacentHTML("beforeend", '<span class="tag is-success">磁力排序</span>');
                    };
  
                    if (this.M_COPY) {
                        caption.insertAdjacentHTML(
                            "beforeend",
                            `<a href="${VOID}" data-copy="all" title="复制全部磁链" class="tag is-info">复制全部</a>`
                        );
                    }
  
                    DOC.querySelector("#magnets .message-body").addEventListener("click", e => {
                        const { copy, magnet } = e.target.dataset;
                        if (!copy && !magnet) return;
  
                        if (magnet) return this._driveOffLine(e);
                        if (copy !== "all") return handleCopy(e);
                        handleCopy(e, "", this.magnets.map(item => item.link).join("\n"));
                    });
                }
                const total = DOC.querySelector("#x-total");
                if (total) total.textContent = `总数 ${magnets.length}`;
                magnets = this.movieSort(magnets, start);
                this.magnets = magnets;
                DOC.querySelector("#magnets-content").innerHTML = this.refactorTr(magnets);
            },
            refactorTr(magnets) {
                return magnets
                    .map(
                        ({ name, link, size, date, from, href, zh }) =>
                            `<div class="item columns odd">
                              <div class="column" title="${name}">
                                  <a href="${link}" class="x-ellipsis">${name}</a>
                              </div>
                              <div class="column x-line" title="${size}">${size}</div>
                              <div class="column x-line" title="${date}">${date}</div>
                              <div class="column">
                                  <a
                                      class="tag is-danger is-light x-from"
                                      href="${href || VOID}"
                                      ${href ? ' target="_blank" title="查看详情"' : ""}
                                  >${from || Domain}</a>
                              </div>
                              <div class="column">
                                  ${zh ? '<span class="tag is-warning is-light">字幕</span>' : ""}
                              </div>
                              <div class="column">
                                  <a
                                      href="${VOID}"
                                      class="tag is-info is-hidden"
                                      title="复制磁力链接"
                                      data-copy="${link}"
                                  >复制链接</a><a
                                      href="${VOID}"
                                      class="tag is-info x-ml is-hidden"
                                      title="添加离线任务"
                                      data-magnet="${link}"
                                  >添加离线</a>
                              </div>
                          </div>`
                    )
                    .join("");
            },
            driveMatch() {
                this.driveMatchForMovie(
                    this.info,
                    res => {
                        const refresh = DOC.querySelector("#x-refresh");
                        refresh.inert = false;
                        refresh.textContent = "刷新资源";
                        refresh.classList.remove("active");
  
                        DOC.querySelector("#x-match").innerHTML = !res.length
                            ? "暂无数据"
                            : res
                                  .map(
                                      ({ n, pc, fid, cid, t }) =>
                                          `<a class="x-ellipsis" href="${VOID}" data-n="${n}" data-pc="${pc}" data-fid="${fid}" data-cid="${cid}" title="[${t}] ${n}"><span class="x-btn" title="资源调整"></span>${n}</a>`
                                  )
                                  .join("");
                    },
                    () => {
                        const refresh = DOC.querySelector("#x-refresh");
                        if (refresh) {
                            refresh.inert = true;
                            refresh.textContent = "请求中...";
                            return refresh.classList.add("active");
                        }
  
                        const { icon, resources } = GM_info.script;
                        addPrefetch([icon, ...resources.map(item => item.url)]);
                        GM_addStyle("#magnets-content a[data-magnet]{display:inline-flex!important}");
                        DOC.querySelector(".movie-panel-info").insertAdjacentHTML(
                            "beforeend",
                            '<div class="panel-block"><strong>资源:</strong>&nbsp;<span class="value" id="x-match">查询中...</span></div><div class="panel-block"><div id="toolbar" class="buttons has-addons are-small"><button class="button is-info" id="x-magnet" data-magnet="all">一键离线</button><button class="button is-info" id="x-refresh" inert>请求中...</button></div></div>'
                        );
                        DOC.querySelector("#x-refresh").addEventListener("click", () => this.driveMatch());
                        DOC.querySelector("#x-magnet").addEventListener("click", e => this._driveOffLine(e));
                        const modify = this.upModifyTarget();
                        DOC.querySelector("#x-match").addEventListener("click", e => {
                            if (e.target.dataset.pc) this.advancedLink(e, { type: "left" });
                            if (e.target.classList.contains("x-btn")) this.driveModify(e, modify);
                        });
                        DOC.querySelector("#x-match").addEventListener("contextmenu", e => {
                            if (e.target.dataset.cid) this.advancedLink(e, { type: "right" });
                        });
                    }
                );
            },
            _driveOffLine(e) {
                this.driveOffLine(e, { ...this.info, magnets: this.magnets });
            },
        };
        others = {
            docStart() {
                this.globalDark(this._style.common);
                this.listMerge();
            },
            contentLoaded() {
                this.globalSearch();
            },
        };
    }
    class JavBus extends Common {
        constructor() {
            super();
            return super.init();
        }
  
        routes = {
            list: /^\/((uncensored\/?)?(page\/\d+)?$)|((uncensored\/)?(((search|star)+|genre|studio|label|series|director|member)+\/)|actresses(\/\d+)?)+/i,
            genre: /^\/(uncensored\/)?genre$/i,
            forum: /^\/forum\//i,
            movie: /^\/[a-z0-9]+(-|\w)+/i,
        };
        _style = {
            common: `
          body {
              overflow-y: overlay;
          }
          .ad-box,
          footer {
              display: none;
          }
          `,
            card: `
          a:is(.movie-box, .avatar-box) {
              width: var(--x-thumb-w);
              margin: 10px !important;
          }
          .photo-frame {
              height: auto !important;
              margin: 10px !important;
              background: var(--x-sub-ftc);
              border: none;
          }
          .movie-box .photo-frame {
              aspect-ratio: var(--x-thumb-ratio);
          }
          .avatar-box .photo-frame {
              aspect-ratio: var(--x-avatar-ratio);
          }
          .photo-frame img {
              width: 100%;
              max-width: none !important;
              height: 100% !important;
              max-height: none !important;
              margin: 0 !important;
              object-fit: cover;
          }
          .photo-info {
              height: auto !important;
              padding: 0 10px 10px;
              line-height: var(--x-line-h);
              background: unset;
              border: none;
          }
          `,
            dark: `
          :is(.nav, .dropdown-menu) > li > a:is(:hover, :focus) {
              background: var(--x-grey) !important;
          }
          .nav > :is(li.active, .open) > a,
          .nav > .open > a:is(:hover, :focus),
          .dropdown-menu {
              background: var(--x-bgc) !important;
          }
          .modal-content, .alert {
              background: var(--x-sub-bgc) !important;
          }
          .btn-primary {
              background: var(--x-blue) !important;
              border: none;
          }
          .btn-success {
              background: var(--x-green) !important;
              border: none;
          }
          .btn-warning {
              background: var(--x-orange) !important;
              border: none;
          }
          .btn-danger {
              background: var(--x-red) !important;
              border: none;
          }
          .btn-link {
              background: none !important;
              border: none;
          }
          .btn.disabled, .btn[disabled], fieldset[disabled] .btn {
              opacity: .8 !important;
          }
          `,
            dmCard: `
          .movie-box, .avatar-box {
              background: var(--x-sub-bgc) !important;
          }
          .photo-frame {
              background: var(--x-grey);
          }
          .photo-info {
              color: unset;
          }
          .photo-info span date {
              color: var(--x-sub-ftc);
          }
          `,
        };
        search = {
            selectors: "#search-input",
            pathname: `/search/${REP}`,
        };
        click = {
            selectors: [".movie-box", ".avatar-box"],
            codeQuery: "date",
            upQuery: ".photo-frame",
        };
        merge = {
            start: (list, active) => {
                if (active) {
                    active = " active";
                    DOC.querySelector("#navbar .active").classList.remove("active");
                }
                DOC.querySelector("#navbar > .nav.navbar-nav")?.insertAdjacentHTML(
                    "beforeend",
                    `<li id="merge" class="dropdown hidden-sm${active}">
                      <a
                          href="#"
                          class="dropdown-toggle"
                          data-toggle="dropdown"
                          data-hover="dropdown"
                          role="button"
                          aria-expanded="false"
                      >合并列表 <span class="caret"></span></a>
                      <ul class="dropdown-menu" role="menu">
                          ${list.reduce((prev, curr) => `${prev}<li><a href="/?merge=${curr}">${curr}</a></li>`, "")}
                      </ul>
                  </li>`
                );
            },
        };
  
        list = {
            imgReplace: [
                {
                    regex: /\/thumbs?\//i,
                    replace: val => val.replace(/\/thumbs?\//g, "/cover/").replace(".jpg", "_b.jpg"),
                },
                {
                    regex: /pics\.dmm\.co\.jp/i,
                    replace: val => val.replace("ps.jpg", "pl.jpg"),
                },
            ],
  
            docStart() {
                const { common, card, dark, dmCard } = this._style;
                const style = `
              .alert-common, .alert-page {
                  margin-top: 20px;
              }
              .search-header {
                  padding: 0;
                  background: none;
                  box-shadow: none;
              }
              .search-header .nav-tabs, #waterfall {
                  display: none;
              }
              #waterfall, #waterfall img {
                  opacity: 0;
              }
              .text-center.hidden-xs {
                  display: none;
                  line-height: 0;
              }
              .pagination {
                  margin-bottom: 40px;
              }
              .movie-box .x-title + div {
                  height: var(--x-line-h) !important;
                  margin: 4px 0;
              }
              .mleft {
                  display: flex !important;
                  align-items: center;
              }
              .mleft .btn-xs {
                  margin: 0 6px 0 0 !important;
              }
              `;
                const dmStyle = `
              .nav-pills > li.active > a {
                  background-color: var(--x-blue) !important;
              }
              .pagination > li > a {
                  color: var(--x-ftc) !important;
                  background-color: var(--x-sub-bgc) !important;
              }
              .pagination > li:not(.active) > a:hover {
                  background-color: var(--x-grey) !important;
              }
              `;
                this.globalDark(`${common}${style}${card}${this.listMovieTitle()}`, `${dark}${dmStyle}${dmCard}`);
                this.listMerge();
                this.upLOLTarget();
            },
            contentLoaded() {
                this.globalSearch();
                this.globalClick();
                this.modifyLayout();
            },
            modifyLayout() {
                DOC.querySelector(".search-header .nav")?.classList.replace("nav-tabs", "nav-pills");
  
                const container = unsafeWindow.$("#waterfall");
                this.listScroll({
                    container: "#waterfall",
                    path: "#next",
                    start: items => container.empty().append(items).show().masonry("reload"),
                    showPage: () => DOC.querySelector(".text-center.hidden-xs")?.classList.add("x-show"),
                    onLoad: items => {
                        items = unsafeWindow.$(items);
                        container.append(items).masonry("appended", items);
                    },
                });
            },
            modifyItem(items, isMerge) {
                const isMovieList = items.some(item => item.querySelector(".movie-box"));
                const res = [];
                const hlUrls = [];
  
                for (let index = 0, { length } = items; index < length; index++) {
                    const item = items[index];
                    let code = "";
                    let date = "";
                    let highlight = false;
  
                    if (isMovieList) {
                        [code, date] = item.querySelectorAll("date");
                        if (!code || !date) continue;
  
                        code = code?.textContent.trim();
                        date = date?.textContent.replaceAll("-", "").trim();
                        if (!code || !date) continue;
  
                        if (isMerge && res.some(t => t.code === code && t.date === date)) continue;
  
                        this.modifyMovieCard(item);
                        if (item.querySelector(".x-hide")) continue;
  
                        highlight = item.querySelector(".x-highlight");
                        if (highlight) hlUrls.push(highlight.href);
                    } else {
                        this.modifyAvatarCard(item);
                    }
  
                    fadeInImg(item);
                    res.push({ code, date, highlight: !!highlight, item });
                }
                if (!res.length) return res;
  
                if (isMovieList) {
                    this.driveMatchForList(res, this.click.upQuery);
                    addPrefetch(hlUrls);
                    if (isMerge) res.sort((pre, next) => next.date - pre.date);
                    res.sort((pre, next) => (pre.highlight > next.highlight ? -1 : 1));
                }
                return res.map(({ item }) => item);
            },
            modifyMovieCard(item) {
                item = item.querySelector(".movie-box");
                if (!item) return;
  
                const info = item.querySelector(".photo-info span");
                info.querySelector(".__cf_email__")?.remove();
                info.innerHTML = info.innerHTML.replace("<br>", "");
  
                const titleNode = info.firstChild;
                const title = titleNode.textContent.trim();
                const code = info.querySelector("date").textContent.trim();
                const tags = info.querySelectorAll(".item-tag button");
  
                const filterClass = this.listFilter({ code, title, tags });
                if (filterClass) item.classList.add(filterClass);
                if (filterClass === "x-hide") return;
  
                this.listMovieImgType(item, this.imgReplace);
                const reTitle = DOC.create("div", { title, class: "x-ellipsis x-title" }, title);
                reTitle.insertAdjacentHTML(
                    "afterbegin",
                    `<span class="x-btn" title="列表离线" data-code="${code}" data-title="${title}"></span>`
                );
                titleNode.replaceWith(reTitle);
            },
            modifyAvatarCard(item) {
                item = item.querySelector(".avatar-box");
                if (!item) return;
  
                const info = item.querySelector("span");
                if (!info.classList.contains("mleft")) return info.classList.add("x-line");
  
                const titleNode = info.firstChild;
                const title = titleNode.textContent.trim();
                titleNode.replaceWith(DOC.create("div", { title, class: "x-line" }, title));
                info.insertAdjacentElement("afterbegin", info.querySelector("button"));
            },
        };
        genre = {
            docStart() {
                const { common, dark } = this._style;
                const style =
                    ":root{accent-color:var(--x-blue)}.container-fluid{padding:0 20px!important}.alert-common{margin:20px 0 0!important}h4{margin:20px 0 10px 0!important}.genre-box{margin:10px 0 20px 0!important;padding:20px!important}.genre-box a{text-align:left!important;cursor:pointer!important;user-select:none!important}.genre-box input{margin:0 4px 0 0!important;vertical-align:middle!important}.x-last-box{margin-bottom:70px!important}button.btn.btn-danger.btn-block.btn-genre{position:fixed!important;bottom:0!important;left:0!important;margin:0!important;border:none!important;border-radius:0!important}";
                const dmStyle = ".genre-box{background:var(--x-sub-bgc)!important}";
                this.globalDark(`${common}${style}`, `${dark}${dmStyle}`);
                this.listMerge();
            },
            contentLoaded() {
                this.globalSearch();
                if (!DOC.querySelector("button.btn.btn-danger.btn-block.btn-genre")) return;
  
                const box = DOC.querySelectorAll(".genre-box");
                box[box.length - 1].classList.add("x-last-box");
  
                DOC.querySelector(".container-fluid.pt10").addEventListener("click", ({ target }) => {
                    if (target.nodeName !== "A" || !target.classList.contains("text-center")) return;
                    const checkbox = target.querySelector("input");
                    checkbox.checked = !checkbox.checked;
                });
            },
        };
        forum = {
            docStart() {
                const style =
                    "#nv_search #ft,.banner300,.banner728,.bcpic,.bcpic2,.jav-footer{display:none!important}#toptb{position:fixed!important;top:0!important;right:0!important;left:0!important;z-index:999!important;border-color:#e7e7e7;box-shadow:inset 0 1px 0 rgba(255,255,255,.15),0 1px 5px rgba(0,0,0,.075)}#search-input{border-right:none!important}.jav-button{margin-top:-3px!important;margin-left:-4px!important}#wp{margin-top:55px!important}#ct:has(#scform){margin-top:38px}.biaoqicn_show a{width:20px!important;height:20px!important;line-height:20px!important;opacity:.7;user-select:none!important}#online .bm_h{border-bottom:none!important}#online .bm_h .o img{margin-top:48%}#moquu_top{right:20px;bottom:20px;box-shadow:inset 0 1px 0 rgba(255,255,255,.15),0 1px 5px rgba(0,0,0,.075)}";
                const ifDark = this.G_DARK
                    ? "::-webkit-scrollbar-thumb{background:var(--x-grey)!important}*{box-shadow:none!important;font-weight:600}#x-mask,html,img{filter:invert(1) hue-rotate(.5turn)}img{opacity:.85}"
                    : "";
                this.globalDark(`${this._style.common}${style}${ifDark}`);
  
                this.merge.start = list => {
                    DOC.querySelector("#toptb ul")?.insertAdjacentHTML(
                        "beforeend",
                        `<li class="nav-title nav-inactive"><a href="/?merge=${list[0]}">合并列表</a></li>`
                    );
                };
                this.listMerge();
            },
            contentLoaded() {
                this.globalSearch();
            },
        };
        movie = {
            info: {},
            params: {},
            magnets: [],
  
            docStart() {
                const { common, card, dark, dmCard } = this._style;
                const style = `
              #mag-submit-show,
              #mag-submit,
              #magnet-table,
      h4[style="position:relative"],
      h4[style="position:relative"] + .row,
              .info .glyphicon-info-sign {
          display: none !important;
      }
              html {
                  padding-right: 0 !important;
              }
              .container {
          margin-bottom: 40px;
      }
              @media (width >= 1270px) {
          .container {
                      width: 1270px;
                  }
      }
              .row.movie {
                  padding: 10px 0;
              }
              @media (width <= 480px) {
                  .row.movie {
                      padding: 0 !important;
                  }
              }
              .screencap, .info {
                  border: none !important;
                  padding: 0 10px;
              }
              .bigImage {
                  position: relative;
                  overflow: hidden;
                  display: block;
                  background: var(--x-sub-ftc);
                  aspect-ratio: var(--x-cover-ratio);
              }
              .bigImage :is(img, video) {
                  width: 100%;
                  height: 100%;
                  object-fit: contain;
              }
              .bigImage [id] {
                  opacity: 0;
                  position: absolute;
                  top: 0;
                  left: 0;
              }
              .bigImage .active {
                  z-index: 1;
                  opacity: 1 !important;
                  transition: opacity .25s linear;
              }
              @media (width <= 992px) {
                  .info {
                      padding-top: 10px !important;
                  }
              }
              .info p {
                  line-height: var(--x-line-h) !important;
              }
              .info :is(.header, .star-show, ul) {
                  margin-bottom: 0;
              }
              .info :is(.glyphicon-plus, .glyphicon-minus) {
                  margin-left: 4px;
                  font-size: 13px;
              }
              .star-box li {
                  background: var(--x-sub-ftc) !important;
              }
              .star-box img {
          width: 100% !important;
          height: 100% !important;
                  aspect-ratio: var(--x-avatar-ratio) !important;
                  font-size: 0;
          margin: 0 !important;
      }
              .star-box .star-name {
                  padding: 6px 4px !important;
                  background: #fff;
                  border: none !important;
              }
              .star-box .star-name,
              :is(.avatar-box, .movie-box) span {
                  display: block;
                  overflow: hidden;
                  white-space: nowrap;
                  text-overflow: ellipsis;
              }
              #magneturlpost + .movie {
                  margin-top: 20px !important;
                  padding: 10px !important;
              }
              #avatar-waterfall,
      #sample-waterfall,
      #related-waterfall {
          margin: -10px !important;
          word-spacing: -20px;
      }
              .avatar-box,
      .sample-box,
      .movie-box {
          vertical-align: top !important;
          word-spacing: 0 !important;
      }
              .avatar-box span {
                  padding-top: 0 !important;
                  background-color: unset !important;
                  border: none !important;
              }
              .sample-box {
                  margin: 10px !important;
                  width: var(--x-thumb-w) !important;
              }
              .sample-box .photo-frame {
                  aspect-ratio: var(--x-sprite-ratio);
              }
              .is-loading {
                  animation: spinAround .7s linear infinite;
              }
              @keyframes spinAround {
                  0% { transform: rotate(0deg) }
                  to { transform: rotate(359deg) }
              }
              .x-star {
                  color: var(--x-orange);
              }
              .x-table {
                  margin: 0 !important;
              }
              .x-caption .label {
                  position: unset !important;
              }
              .x-table tr {
                  display: table;
                  width: 100%;
                  table-layout: fixed;
              }
              .x-table tr > * {
                  vertical-align: middle !important;
                  border-left: none !important;
      }
              .x-table tr > *:first-child {
                  width: 50px;
              }
              .x-table tr > *:nth-child(2) {
                  width: 33.3%;
              }
              .x-table tr > *:last-child,
              .x-table tfoot tr > th:not(:nth-child(3)) {
                  border-right: none !important;
              }
              .x-table tbody {
                  display: block;
                  ${this.M_LINE > 0 ? `max-height: calc(39px * ${this.M_LINE} - 1px);` : ""}
                  overscroll-behavior-y: contain;
                  overflow: overlay;
                  table-layout: fixed;
              }
              .x-table tbody tr > * {
                  border-top: none !important;
              }
              .x-table tbody tr:last-child > *,
              .x-table tfoot tr > * {
                  border-bottom: none !important;
              }
              .x-table code {
                  display: inline-block;
                  min-width: 65px;
              }
              .x-table td a:not(:last-child) {
                  margin-right: 10px;
              }
              #x-match a {
                  color: #CC0000 !important;
              }
              `;
                const dmStyle = `
              .bigImage,
              .btn-group a,
              .star-box li,
              tbody tr:hover,
              .table-striped > tbody > tr:nth-of-type(odd):hover,
              .x-table code {
                  background: var(--x-grey) !important;
              }
              .btn-group a.active {
                  background: var(--x-bgc) !important;
              }
              .movie,
              .btn-group a[disabled],
              .star-box .star-name,
              .sample-box,
              .table-striped > tbody > tr:nth-of-type(odd) {
                  background: var(--x-sub-bgc) !important;
              }
              .avatar-box span {
                  color: unset !important;
              }
              `;
                this.globalDark(`${common}${style}${card}`, `${dark}${dmStyle}${dmCard}`);
                this.listMerge();
            },
            contentLoaded() {
                this.globalSearch();
                this.modifyItem();
  
                const infoNode = DOC.querySelector(".info");
                const info = infoNode.textContent;
                const codeNode = infoNode.querySelector("span[style='color:#CC0000;']");
                const code = codeNode.textContent;
                const titleNode = DOC.querySelector("h3");
                const title = titleNode.textContent.replace(code, "").trim();
  
                this.info = {
                    code,
                    title,
                    cover: DOC.querySelector(".bigImage img").src,
                    isVR: VR_REGEX.test(title),
                    studio: info.match(/(?<=製作商: ).+/g)?.pop(0),
                    star: Array.from(infoNode.querySelectorAll("ul + p a")).map(item => item.textContent),
                    series: info.match(/(?<=系列: ).+/g)?.pop(0),
                    genre: Array.from(infoNode.querySelectorAll("p.header + p a")).map(item => item.textContent),
                };
                const cid = DOC.querySelector("#sample-waterfall a.sample-box")?.href;
                if (cid?.includes("pics.dmm.co.jp")) this.info.cid = cid.split("/").at(-2);
                this.getMovieResource(this.info);
  
                if (this.M_COPY) {
                    addCopy(titleNode, { title: "复制标题" });
                    addCopy(codeNode, { title: "复制番号" });
                    GM_addStyle("tbody a[data-copy]{display:inline!important}");
                    infoNode.addEventListener("contextmenu", e => {
                        const { target } = e;
                        if (!target.closest("#x-star") || !target.matches("a")) return;
                        handleCopy(e, "", target.textContent);
                    });
                }
  
                this.movieRes();
                this.movieTitle();
                this._movieJump();
                this.movieScore();
                this.movieStar();
                this.driveMatch();
  
                const tableObs = new MutationObserver((_, obs) => {
                    obs.disconnect();
                    this.refactorTable();
                });
                tableObs.observe(DOC.querySelector("#movie-loading"), { attributeFilter: ["style"] });
            },
            modifyItem() {
                const container = DOC.querySelector("#related-waterfall");
                if (!container) return;
  
                const res = [];
                for (const item of container.querySelectorAll(".movie-box")) {
                    const code = item.href?.split("/").at(-1);
                    if (!CODE_REGEX.test(code)) continue;
  
                    item.append(DOC.create("date", { class: "x-hide" }, code));
                    item.querySelector(".photo-info span").classList.add("x-title");
                    res.push({ item, code });
                }
                this.driveMatchForList(res, ".photo-frame");
                this.globalClick();
            },
            movieRes() {
                const { res } = this.params;
                if (!res?.length) return;
  
                unsafeWindow.$(".bigImage").magnificPopup({
                    type: "image",
                    closeOnContentClick: true,
                    closeBtnInside: false,
                    image: { verticalFit: false },
                });
                const box = DOC.querySelector(".bigImage");
                const info = DOC.querySelector(".info");
                const first = "x-cover";
                const firstQuery = `a[for=${first}]`;
  
                const cover = box.querySelector("img");
                cover.setAttribute("id", first);
                cover.classList.add("active");
                box.insertAdjacentHTML(
                    "afterbegin",
                    '<div class="x-side prev"><span class="glyphicon glyphicon-chevron-left"></div><div class="x-side next"><span class="glyphicon glyphicon-chevron-right"></div>'
                );
                info.insertAdjacentHTML(
                    "afterbegin",
                    `<div id="x-res" class="btn-group btn-group-sm btn-group-justified mb10">
                      <a href="${VOID}" class="btn btn-default active" role="button" for="${first}">封面</a>
                      ${res
                          .map(
                              item =>
                                  `<a href="${VOID}" class="btn btn-default" role="button" for="x-${item}" disabled><span class="glyphicon glyphicon-repeat is-loading" aria-hidden="true"></span></a>`
                          )
                          .join("")}
                  </div>`
                );
  
                box.addEventListener(
                    "click",
                    e => {
                        const { target } = e;
  
                        const side = target.closest(".x-side");
                        if (side) {
                            e.stopPropagation();
                            e.preventDefault();
  
                            const navs = info.querySelectorAll("#x-res a:not([disabled])");
                            const { length } = navs;
                            if (length === 1) return;
  
                            let index = Array.from(navs).findIndex(item => item.classList.contains("active"));
                            index = side.classList.contains("next") ? index + 1 : index - 1;
                            if (index > length - 1) index = 0;
                            if (index === -1) index = length - 1;
                            return navs[index].click();
                        }
  
                        if (target.closest(".x-player")) {
                            e.stopPropagation();
                            e.preventDefault();
                            return box.querySelector(".x-side.next").click();
                        }
  
                        const { nodeName } = target;
                        if (nodeName === "IMG") box.href = target.src;
                        if (nodeName !== "VIDEO") return;
  
                        e.stopPropagation();
                        e.preventDefault();
                        target.paused ? target.play() : target.pause();
                    },
                    true
                );
                info.querySelector("#x-res").addEventListener("click", ({ target }) => {
                    const tag = target.getAttribute("for");
                    if (!tag) return;
  
                    const active = box.querySelector(`#${tag}`);
                    if (target.classList.contains("active")) return active.focus();
  
                    const _target = info.querySelector("#x-res .active");
                    _target.classList.toggle("active");
                    if (_target.matches(firstQuery)) box.classList.remove("x-player");
  
                    target.classList.toggle("active");
                    if (target.matches(firstQuery) && box.classList.contains("isPlayer")) {
                        box.classList.add("x-player");
                    }
  
                    const _active = box.querySelector(".active");
                    _active.classList.toggle("active");
                    if (_active.nodeName === "VIDEO") _active.pause();
  
                    active.classList.toggle("active");
                    if (active.nodeName !== "VIDEO") return;
  
                    active.focus();
                    active.play();
                });
                res.forEach(key => {
                    this.upMovieResource(key, val => {
                        const id = `x-${key}`;
                        const nav = info.querySelector(`a[for=${id}]`);
                        if (!val.length) {
                            nav.innerHTML = "暂无";
                            return;
                        }
  
                        this.info[key] = val;
                        nav.removeAttribute("disabled");
                        nav.innerHTML = TAB_NAME[key];
  
                        const node = key === "img" ? DOC.create(key, { src: val, id }) : createVideo(val, { id });
                        box.append(node);
                        if (key === "img" || !nav.previousElementSibling?.matches(firstQuery)) return;
                        box.classList.add("isPlayer", "x-player");
                    });
                });
            },
            movieTitle() {
                this.upMovieResource(
                    "title",
                    val => {
                        DOC.querySelector("#x-title").textContent = val.length ? val : "暂无数据";
                    },
                    () => {
                        DOC.querySelector("span[style='color:#CC0000;']").parentElement.insertAdjacentHTML(
                            "beforebegin",
                            '<p><span class="header">机翻标题:</span> <span id="x-title">查询中...</span></p>'
                        );
                    }
                );
            },
            _movieJump() {
                this.movieJump(
                    this.info,
                    res => {
                        DOC.querySelector("span[style='color:#CC0000;']").parentElement.insertAdjacentHTML(
                            "afterend",
                            res
                                .map(
                                    ({ group, list }) =>
                                        `<p><span class="header">${group}:</span> ${list
                                            .map(
                                                ({ url, query, name }) =>
                                                    `<button type="button" class="x-jump btn ${
                                                        query ? "btn-default" : "btn-link"
                                                    } btn-xs" data-query="${query}" data-href="${url}">${name}</button>`
                                            )
                                            .join("")}</p>`
                                )
                                .join("")
                        );
                    },
                    (res, node) => node.classList.replace("btn-default", res.zh ? "btn-warning" : "btn-primary")
                );
            },
            movieScore() {
                const { score } = this.params;
                if (!score?.length) return;
  
                DOC.querySelector("p.header, p.star-show").insertAdjacentHTML(
                    "beforebegin",
                    score
                        .map(
                            item =>
                                `<p><span class="header">${item.toUpperCase()}评分:</span> <span id="x-${item}_score">查询中...</span></p>`
                        )
                        .join("")
                );
                score.forEach(key => {
                    key = `${key}_score`;
                    this.upMovieResource(key, val => {
                        const node = DOC.querySelector(`#x-${key}`);
  
                        if (!val.length) {
                            node.textContent = "暂无数据";
                            return;
                        }
  
                        const { score, total, num } = val[0];
                        let stars = Math.floor((score / total) * 5);
                        stars = Array(5).fill(" x-star", 0, stars).fill("", stars, 5);
  
                        node.innerHTML = `${stars
                            .map(item => `<span class="glyphicon glyphicon-star${item}"></span>`)
                            .join("")} ${score}分${num ? `, ${num}人评价` : ""}`;
                    });
                });
            },
            movieStar() {
                const noStar = DOC.querySelector(".glyphicon-info-sign");
                if (!noStar) return DOC.querySelector(".info ul + p").setAttribute("id", "x-star");
                noStar.nextSibling.replaceWith(DOC.create("p", { id: "x-star" }, "暫無出演者資訊"));
  
                this.upMovieResource(
                    "star",
                    val => {
                        this.info.star = val;
                        DOC.querySelector("#x-star").innerHTML = !val.length
                            ? "暂无数据"
                            : val
                                  .map(item => `<span class="genre"><a href="/searchstar/${item}">${item}</a></span>`)
                                  .join("");
                    },
                    () => {
                        DOC.querySelector("#x-star").innerHTML = "查询中...";
                    }
                );
            },
            refactorTable() {
                const table = DOC.querySelector("#magnet-table");
                const keys = (this.params?.magnet ?? []).map(item => `${item}_magnet`);
                const magnets = [];
  
                if (this.params.hasOwnProperty("sub")) {
                    keys.unshift("sub");
                } else {
                    for (const tr of table.querySelectorAll("tr")) {
                        let [first, size, date] = tr.querySelectorAll("td");
                        if (!first || !size || !date) continue;
  
                        const link = first.querySelector("a");
                        if (!link?.href) continue;
  
                        size = size?.textContent?.trim() ?? "";
                        magnets.push({
                            name: link?.textContent?.trim() ?? "",
                            link: link.href.split("&")[0],
                            zh: !!first.querySelector("a.btn.btn-mini-new.btn-warning.disabled"),
                            size,
                            bytes: transToBytes(size),
                            date: date?.textContent?.trim() ?? "",
                        });
                    }
                }
                table.parentElement.innerHTML = `
                  <table class="table table-striped table-hover table-bordered x-table">
                      <caption><div class="x-flex-center x-caption">重构的表格</div></caption>
                      <thead>
                          <tr>
                              <th scope="col">#</th>
                              <th scope="col">磁力名称</th>
                              <th scope="col">档案大小</th>
                              <th scope="col">分享日期</th>
                              <th scope="col" class="text-center">来源</th>
                              <th scope="col" class="text-center">字幕</th>
                              <th scope="col">操作</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr><th scope="row" colspan="7" class="text-center text-muted">暂无数据</th></tr>
                      </tbody>
                      <tfoot>
                          <tr>
                              <th scope="row"></th>
                              <th></th>
                              <th colspan="4" class="text-right">总数</th>
                              <td>0</td>
                          </tr>
                      </tfoot>
                  </table>`;
                const caption = DOC.querySelector(".x-table .x-caption");
  
                this.refactorTbody(magnets);
                keys.forEach(key => {
                    this.upMovieResource(
                        key,
                        res => this.refactorTbody(res, key),
                        () => {
                            caption.insertAdjacentHTML(
                                "beforeend",
                                `<span class="label label-default" id="x-${key}"><span class="glyphicon glyphicon-ok-sign" aria-hidden="true"></span> ${
                                    key === "sub" ? "字幕筛选" : `${key.split("_")[0].toUpperCase()}搜索`
                                }</span>`
                            );
                        }
                    );
                });
            },
            refactorTbody(magnets, key) {
                if (!magnets.length) return;
  
                const table = DOC.querySelector(".x-table");
                if (key) table.querySelector(`#x-${key}`).classList.replace("label-default", "label-success");
                let start;
  
                if (this.magnets.length) {
                    for (const item of magnets) {
                        const { link, zh } = item;
                        const index = this.magnets.findIndex(item => item.link.toLowerCase() === link.toLowerCase());
                        if (index === -1) {
                            this.magnets.push(item);
                            continue;
                        }
                        if (zh) this.magnets[index].zh = zh;
                    }
                    magnets = this.magnets;
                } else {
                    start = () => {
                        table
                            .querySelector(".x-caption")
                            .insertAdjacentHTML(
                                "beforeend",
                                '<span class="label label-success" id="x-sort"><span class="glyphicon glyphicon-ok-sign" aria-hidden="true"></span> 磁力排序</span>'
                            );
                    };
  
                    if (this.M_COPY) {
                        table.querySelector(
                            "thead th:last-child"
                        ).innerHTML = `<a href="${VOID}" data-copy="all" title="复制全部磁链">复制全部</a>`;
                    }
  
                    table.addEventListener("click", e => {
                        const { copy, magnet } = e.target.dataset;
                        if (!copy && !magnet) return;
  
                        if (magnet) return this._driveOffLine(e);
                        if (copy !== "all") return handleCopy(e);
                        handleCopy(e, "", this.magnets.map(item => item.link).join("\n"));
                    });
                }
                table.querySelector("tfoot td").textContent = magnets.length;
                magnets = this.movieSort(magnets, start);
                this.magnets = magnets;
                table.querySelector("tbody").innerHTML = this.refactorTr(magnets);
            },
            refactorTr(magnets) {
                return magnets
                    .map(
                        ({ name, link, size, date, from, href, zh }, index) => `
                      <tr>
                          <th scope="row">${++index}</th>
                          <th class="x-line" title="${name}">
                              <a href="${link}">${name}</a>
                          </th>
                          <td>${size}</td>
                          <td>${date}</td>
                          <td class="text-center">
                              <a href="${href || VOID}"${href ? ` target="_blank" title="查看详情"` : ""}>
                                  <code>${from || Domain}</code>
                              </a>
                          </td>
                          <td class="text-center">
                              <span class="glyphicon glyphicon-${zh ? "ok" : "remove"}-circle text-${
                            zh ? "success" : "danger"
                        }"></span>
                          </td>
                          <td>
                              <a hidden href="${VOID}" data-copy="${link}" title="复制磁力链接">复制磁链</a><a hidden href="${VOID}" data-magnet="${link}" class="text-success" title="添加离线任务">添加离线</a>
                          </td>
                      </tr>`
                    )
                    .join("");
            },
            driveMatch() {
                this.driveMatchForMovie(
                    this.info,
                    res => {
                        const refresh = DOC.querySelector("#x-refresh");
                        refresh.inert = false;
                        refresh.textContent = "刷新资源";
                        refresh.classList.remove("active");
  
                        DOC.querySelector("#x-match").innerHTML = !res.length
                            ? "暂无数据"
                            : res
                                  .map(
                                      ({ n, pc, fid, cid, t }) =>
                                          `<a class="show x-line" href="${VOID}" data-n="${n}" data-pc="${pc}" data-fid="${fid}" data-cid="${cid}" title="[${t}] ${n}"><span class="x-btn" title="资源调整"></span>${n}</a>`
                                  )
                                  .join("");
                    },
                    () => {
                        const refresh = DOC.querySelector("#x-refresh");
                        if (refresh) {
                            refresh.inert = true;
                            refresh.textContent = "请求中...";
                            return refresh.classList.add("active");
                        }
  
                        const { icon, resources } = GM_info.script;
                        addPrefetch([icon, ...resources.map(item => item.url)]);
                        GM_addStyle("tbody a[data-magnet]{display:inline!important}");
                        DOC.querySelector(".info").insertAdjacentHTML(
                            "beforeend",
                            `<p class="header">网盘资源:</p><p id="x-match">查询中...</p><div class="btn-group btn-group-sm btn-group-justified"><a href="${VOID}" class="btn btn-default" role="button" id="x-magnet" data-magnet="all">一键离线</a><a href="${VOID}" class="btn btn-default active" role="button" id="x-refresh" inert>请求中...</a></div>`
                        );
                        DOC.querySelector("#x-refresh").addEventListener("click", () => this.driveMatch());
                        DOC.querySelector("#x-magnet").addEventListener("click", e => this._driveOffLine(e));
                        const modify = this.upModifyTarget();
                        DOC.querySelector("#x-match").addEventListener("click", e => {
                            if (e.target.dataset.pc) this.advancedLink(e, { type: "left" });
                            if (e.target.classList.contains("x-btn")) this.driveModify(e, modify);
                        });
                        DOC.querySelector("#x-match").addEventListener("contextmenu", e => {
                            if (e.target.dataset.cid) this.advancedLink(e, { type: "right" });
                        });
                    }
                );
            },
            _driveOffLine(e) {
                this.driveOffLine(e, { ...this.info, magnets: this.magnets });
            },
        };
    }
    class Drive115 {
        beforeUnload_time = 0;
        docStart() {
            Store.setVerifyStatus("pending");
  
            unsafeWindow.onbeforeunload = () => {
                this.beforeUnload_time = new Date().getTime();
            };
            unsafeWindow.onunload = () => {
                if (new Date().getTime() - this.beforeUnload_time > 5) return;
                Store.setVerifyStatus("failed");
            };
        }
        contentLoaded() {
            unsafeWindow.focus();
            DOC.querySelector("#js_ver_code_box button[rel=verify]").addEventListener("click", () => {
                const interval = setInterval(() => {
                    if (DOC.querySelector(".vcode-hint").getAttribute("style").indexOf("none") !== -1) {
                        Store.setVerifyStatus("verified");
                        unsafeWindow.onbeforeunload = null;
                        unsafeWindow.onunload = null;
                        clearTimer();
                        unsafeWindow.open("", "_self");
                        unsafeWindow.close();
                    }
                }, 300);
                const timeout = setTimeout(() => clearTimer(), 600);
  
                const clearTimer = () => {
                    clearInterval(interval);
                    clearTimeout(timeout);
                };
            });
        }
    }
  
    try {
        const Process = eval(`new ${Domain}()`);
        Process.docStart?.();
        DOC.addEventListener("XContentLoaded", () => Process.contentLoaded?.(), { once: true });
    } catch (err) {
        console.error(`${GM_info.script.name}: 无匹配模块`);
    }
  })();
  