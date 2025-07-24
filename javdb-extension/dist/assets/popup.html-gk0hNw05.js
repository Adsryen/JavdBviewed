import"./modulepreload-polyfill-B5Qt9EMX.js";import{a as I,S as D,V as m,g as h,b as L}from"./storage-BUa3Gg3q.js";document.addEventListener("DOMContentLoaded",()=>{const r=document.getElementById("dashboard-button"),v=document.getElementById("helpBtn"),a=document.getElementById("helpPanel"),y=document.getElementById("toggleWatchedContainer"),E=document.getElementById("toggleViewedContainer"),B=document.getElementById("toggleVRContainer"),C=document.getElementById("idCountDisplay"),b=document.getElementById("versionAuthorInfo");r&&r.addEventListener("click",()=>{chrome.runtime.openOptionsPage?chrome.runtime.openOptionsPage():window.open(chrome.runtime.getURL("dashboard/dashboard.html"))});async function i(e,n,d,l){const t=document.createElement("button");t.className="toggle-button";let o;const u=s=>{t.textContent=s?d:l,t.classList.toggle("active",!s)};o=await h(),u(o.display[e]),t.addEventListener("click",async()=>{o=await h();const s=!o.display[e];o.display[e]=s,await L(o),u(s),chrome.tabs.query({active:!0,currentWindow:!0},c=>{var p,g;(g=(p=c[0])==null?void 0:p.url)!=null&&g.includes("javdb")&&c[0].id&&chrome.tabs.reload(c[0].id)})}),n.innerHTML="",n.appendChild(t)}async function f(){const e=await I(D.VIEWED_RECORDS,{}),n=Object.values(e),d=n.filter(t=>t.status===m.VIEWED).length,l=n.filter(t=>t.status===m.WANT).length;C.innerHTML=`
            <div><span class="count">${d}</span><span class="label">已观看</span></div>
            <div><span class="count">${l}</span><span class="label">想看</span></div>
        `}function w(){const e=`
            <div class="help-header">
                <h2>功能说明</h2>
                <span id="closeHelpBtn" title="关闭">&times;</span>
            </div>
            <div class="help-body">
                <p><strong>显示/隐藏开关:</strong> 快速切换在JavDB网站上是否隐藏特定类型的影片。更改后会自动刷新当前页面。</p>
                <p><strong>高级设置:</strong> 点击进入功能更全面的仪表盘，进行数据管理、WebDAV备份同步、日志查看等高级操作。</p>
            </div>`;a.innerHTML=e,v.addEventListener("click",()=>{a.style.display="block"});const n=a.querySelector("#closeHelpBtn");n&&n.addEventListener("click",()=>{a.style.display="none"})}async function V(){f(),i("hideViewed",y,"显示已看","隐藏已看"),i("hideBrowsed",E,"显示浏览","隐藏浏览"),i("hideVR",B,"显示VR","隐藏VR");const e=chrome.runtime.getManifest();b.textContent=`v${e.version}`,w()}V()});
