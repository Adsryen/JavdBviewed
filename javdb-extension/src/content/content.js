// content.js
// 注入到 javdb.com 页面，负责页面 DOM 操作、UI 注入、状态标记等
import { getValue, setValue } from '../utils/storage.js';
import { sleep } from '../utils/utils.js';

(function() {
  'use strict';

  // --- favicon 替换功能迁移 ---
  const CUSTOM_FAVICON_URL = chrome.runtime.getURL('src/assets/jav.png');
  let originalFaviconUrl = null;

  function getFaviconLink() {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    return link;
  }

  function setFavicon(url) {
    const head = document.head;
    const existingFavicons = document.querySelectorAll("link[rel~='icon']");
    existingFavicons.forEach(icon => icon.remove());
    const newFavicon = document.createElement('link');
    newFavicon.rel = 'icon';
    if (url.endsWith('.png')) {
      newFavicon.type = 'image/png';
    }
    newFavicon.href = url;
    head.appendChild(newFavicon);
  }

  originalFaviconUrl = getFaviconLink().href;

  // --- 状态标记与自动隐藏迁移 ---
  const styleMap = {
    '我看過這部影片': 'tag is-success is-light',
    '我想看這部影片': 'tag is-info is-light',
    '未看过': 'tag is-gray',
    '已浏览': 'tag is-warning is-light',
  };

  // 处理单个 item 的状态和标签
  async function modifyItemAtCurrentPage(itemToModify) {
    // 读取设置
    const [hideWatchedVideos, hideViewedVideos, hideVRVideos, watchedArr, browseArr] = await Promise.all([
      getValue('hideWatchedVideos', false),
      getValue('hideViewedVideos', false),
      getValue('hideVRVideos', false),
      getValue('myIds', []),
      getValue('videoBrowseHistory', [])
    ]);
    const watchedVideos = new Set(watchedArr);
    const browseHistory = new Set(browseArr);
    // 获取番号
    const videoTitle = itemToModify.querySelector('div.video-title > strong')?.textContent.trim();
    const dataTitle = itemToModify.querySelector('div.video-title > span.x-btn')?.getAttribute('data-title') || '';
    if (!videoTitle) return;
    // 隐藏 VR
    if (hideVRVideos && dataTitle.includes('【VR】')) {
      const itemContainer = itemToModify.closest('.item');
      if (itemContainer) itemContainer.style.display = 'none';
      return;
    }
    // 隐藏已浏览
    if (hideViewedVideos && browseHistory.has(videoTitle)) {
      const itemContainer = itemToModify.closest('.item');
      if (itemContainer) itemContainer.style.display = 'none';
      return;
    }
    // 隐藏已看
    if (hideWatchedVideos && watchedVideos.has(videoTitle)) {
      const itemContainer = itemToModify.closest('.item');
      if (itemContainer) itemContainer.style.display = 'none';
      return;
    }
    // 添加标签
    let tags = itemToModify.closest('.item').querySelector('.tags.has-addons');
    if (!tags) return;
    if (watchedVideos.has(videoTitle)) {
      let tagClass = styleMap['我看過這部影片'];
      let existingTags = Array.from(tags.querySelectorAll('span'));
      let tagExists = existingTags.some(tag => tag.textContent === '我看過這部影片');
      if (!tagExists) {
        let newTag = document.createElement('span');
        newTag.className = tagClass;
        newTag.textContent = '我看過這部影片';
        tags.appendChild(newTag);
      }
    } else if (browseHistory.has(videoTitle)) {
      let tagClass = styleMap['已浏览'];
      let existingTags = Array.from(tags.querySelectorAll('span'));
      let tagExists = existingTags.some(tag => ['我看過這部影片', '已浏览'].includes(tag.textContent));
      if (!tagExists) {
        let newTag = document.createElement('span');
        newTag.className = tagClass;
        newTag.textContent = '已浏览';
        tags.appendChild(newTag);
      }
    }
  }

  // 处理所有已加载的项目
  async function processLoadedItems() {
    let items = Array.from(document.querySelectorAll('.movie-list .item a'));
    for (const item of items) {
      await modifyItemAtCurrentPage(item);
    }
  }

  // MutationObserver 监听动态加载
  const targetNode = document.querySelector('.movie-list');
  if (targetNode) {
    processLoadedItems();
    const observer = new MutationObserver(() => {
      processLoadedItems();
    });
    observer.observe(targetNode, { childList: true, subtree: true });
  } else {
    processLoadedItems();
  }

  // favicon 状态检查（已迁移）
  function checkCurrentVideoStatus() {
    const currentFaviconHref = getFaviconLink().href;
    if (!window.location.href.startsWith('https://javdb.com/v/')) {
      if (originalFaviconUrl && currentFaviconHref !== originalFaviconUrl) {
        setFavicon(originalFaviconUrl);
      }
      return;
    }
    const panelBlock = document.querySelector('.panel-block.first-block');
    if (!panelBlock) return;
    const videoIdPattern = /<strong>番號:<\/strong>\s*&nbsp;<span class="value"><a href="\/video_codes\/([A-Z]+)">[A-Z]+<\/a>-(\d+)<\/span>/;
    const match = panelBlock.innerHTML.match(videoIdPattern);
    if (!match) return;
    const videoId = `${match[1]}-${match[2]}`;
    // 这里应从 storage 获取 watchedVideos/browseHistory
    getValue('myIds', []).then(watchedArr => {
      getValue('videoBrowseHistory', []).then(browseArr => {
        const watchedVideos = new Set(watchedArr);
        const browseHistory = new Set(browseArr);
        const isWatchedOrViewed = watchedVideos.has(videoId) || browseHistory.has(videoId);
        if (isWatchedOrViewed) {
          if (currentFaviconHref !== CUSTOM_FAVICON_URL) {
            setFavicon(CUSTOM_FAVICON_URL);
          }
        } else {
          if (originalFaviconUrl && currentFaviconHref !== originalFaviconUrl) {
            setFavicon(originalFaviconUrl);
          }
        }
      });
    });
  }
  setInterval(checkCurrentVideoStatus, 2000);

  // 详情页自动记录浏览
  function getRandomDelay(min = 3, max = 5) {
    return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
  }
  async function recordVideoId() {
    const videoIdPattern = /<strong>番號:<\/strong>\s*&nbsp;<span class="value"><a href="\/video_codes\/([A-Z]+)">([A-Z]+)<\/a>-(\d+)<\/span>/;
    const panelBlock = document.querySelector('.panel-block.first-block');
    if (panelBlock) {
      const match = panelBlock.innerHTML.match(videoIdPattern);
      if (match) {
        const videoId = `${match[1]}-${match[3]}`; // 修正番号提取
        const delay = getRandomDelay();
        console.log(`等待 ${delay/1000} 秒后开始记录浏览: ${videoId}`);
        await sleep(delay);

        let retries = 5;
        while (retries > 0) {
          try {
            const arr = await getValue('videoBrowseHistory', []);
            if (!arr.includes(videoId)) {
              arr.push(videoId);
              await setValue('videoBrowseHistory', arr);
              // 验证
              await sleep(200);
              const newArr = await getValue('videoBrowseHistory', []);
              if (newArr.includes(videoId)) {
                console.log(`成功记录浏览: ${videoId}`);
                return; // 成功，退出
              } else {
                throw new Error('验证存储失败');
              }
            } else {
              console.log(`浏览记录已存在: ${videoId}`);
              return; // 已存在，退出
            }
          } catch (error) {
            retries--;
            console.error(`记录浏览失败: ${videoId}, 错误: ${error.message}. 剩余重试次数: ${retries}`);
            if (retries > 0) {
              await sleep(3000); // 等待3秒后重试
            } else {
              console.error(`记录浏览失败: ${videoId}, 已达最大重试次数`);
            }
          }
        }
      }
    }
  }

  if (window.location.href.startsWith('https://javdb.com/v/')) {
    recordVideoId();
  }

  // --- 页面数据导出功能 ---
  const CONFIG = {
    VIDEOS_PER_PAGE: 20,
    EXPORT_PAUSE_DELAY: 3000,
  };

  let allVideosInfo = [];
  let exportState = {
    allowExport: false,
    currentPage: 1,
    maxPage: null
  };
  let isExporting = false;
  let exportButton = null;
  let stopButton = null;

  function getVideosInfo() {
      const videoElements = document.querySelectorAll('.item');
      return Array.from(videoElements).map((element) => {
          const title = element.querySelector('.video-title').textContent.trim();
          const [id, ...titleWords] = title.split(' ');
          const releaseDate = element.querySelector('.meta').textContent.replace(/[^0-9-]/g, '');
          return { id, releaseDate };
      });
  }

  function getTotalVideoCount() {
      const activeLink = document.querySelector('a.is-active');
      if (activeLink) {
          const text = activeLink.textContent;
          const match = text.match(/\((\d+)\)/);
          if (match) {
              return parseInt(match[1], 10);
          }
      }
      return 0;
  }

  function calculateMaxPages(totalCount, itemsPerPage) {
      return Math.ceil(totalCount / itemsPerPage);
  }

  function exportScrapedData() {
    if (allVideosInfo.length === 0) {
        return;
    }
    const json = JSON.stringify(allVideosInfo, null, 2);
    const jsonBlob = new Blob([json], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const downloadLink = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    let fileName = 'javdb-export';
    const url = window.location.href;
    if (url.includes('/watched_videos')) {
        fileName = 'watched-videos';
    } else if (url.includes('/want_watch_videos')) {
        fileName = 'want-watch-videos';
    } else if (url.includes('/list_detail')) {
        const listTitle = document.querySelector('.title.is-4');
        if (listTitle) fileName = listTitle.textContent.trim();
    } else if (url.includes('/lists')) {
        const listTitle = document.querySelector('.title.is-4');
        if (listTitle) fileName = listTitle.textContent.trim();
    }
    downloadLink.download = `${fileName}_${timestamp}.json`;
    downloadLink.href = jsonUrl;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(jsonUrl);
  }

  function getCurrentPage() {
      const urlParams = new URLSearchParams(window.location.search);
      const page = urlParams.get('page');
      return page ? parseInt(page) : 1;
  }

    async function startExport() {
        const maxPageInput = document.getElementById('maxPageInput');
        if (!maxPageInput) {
            console.error('找不到页数输入框');
            return;
        }

        const itemsPerPage = CONFIG.VIDEOS_PER_PAGE;
        const totalCount = getTotalVideoCount();
        const maxPages = calculateMaxPages(totalCount, itemsPerPage);

        const pagesToExport = maxPageInput.value ? parseInt(maxPageInput.value) : maxPages;

        const currentPage = getCurrentPage();
        const targetPage = Math.min(currentPage + pagesToExport - 1, maxPages);

        if (targetPage < currentPage) {
            alert('请输入有效的页数');
            return;
        }

        exportState.currentPage = currentPage;
        exportState.maxPage = targetPage;
        exportState.allowExport = true;

        await setValue('exportState', exportState);
        allVideosInfo = [];

        exportButton.textContent = `导出中...(${currentPage}/${targetPage})`;
        exportButton.disabled = true;
        stopButton.disabled = false;
        isExporting = true;

        scrapeCurrentPage();
    }

    async function scrapeCurrentPage() {
        if (!isExporting || exportState.currentPage > exportState.maxPage) {
            finishExport();
            return;
        }

        const videosInfo = getVideosInfo();
        allVideosInfo = allVideosInfo.concat(videosInfo);

        exportButton.textContent = `导出中...(${exportState.currentPage}/${exportState.maxPage})`;

        exportState.currentPage++;
        await setValue('exportState', exportState);

        if (exportState.currentPage <= exportState.maxPage) {
            const newUrl = `${window.location.pathname}?page=${exportState.currentPage}`;
            window.location.href = newUrl;
        } else {
            finishExport();
        }
    }

    async function finishExport() {
        if (allVideosInfo.length > 0) {
            exportScrapedData();
        }

        isExporting = false;
        exportState.allowExport = false;
        exportState.currentPage = 1;
        exportState.maxPage = null;
        await setValue('exportState', exportState);

        exportButton.textContent = '导出完成';
        exportButton.disabled = false;
        stopButton.disabled = true;
    }

  function createExportButton() {
    const maxPageInput = document.createElement('input');
    maxPageInput.type = 'number';
    maxPageInput.id = 'maxPageInput';
    maxPageInput.placeholder = '当前页往后导出的页数，留空导全部';
    maxPageInput.style.cssText = `
        margin-right: 10px;
        padding: 6px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        width: auto;
        min-width: 50px;
        box-sizing: border-box;
        transition: all 0.3s ease;
        outline: none;
        background-color: white;
    `;
    maxPageInput.min = '1';
    const itemsPerPage = CONFIG.VIDEOS_PER_PAGE;
    const totalCount = getTotalVideoCount();
    const maxPages = calculateMaxPages(totalCount, itemsPerPage);
    maxPageInput.max = maxPages;

    exportButton = document.createElement('button');
    exportButton.textContent = '导出 json';
    exportButton.className = 'button is-small';
    exportButton.addEventListener('click', () => {
        if (!isExporting) {
            startExport();
        }
    });

    stopButton = document.createElement('button');
    stopButton.textContent = '停止导出';
    stopButton.className = 'button is-small';
    stopButton.disabled = true;
    stopButton.addEventListener('click', () => {
        isExporting = false;
        stopButton.disabled = true;
        exportButton.disabled = false;
        exportButton.textContent = '导出已停止';
        setValue('exportState', {});
    });

    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.appendChild(maxPageInput);
    container.appendChild(exportButton);
    container.appendChild(stopButton);

    const target = document.querySelector('.toolbar') || (document.querySelector('.breadcrumb') && document.querySelector('.breadcrumb').querySelector('ul'));
    if (target) {
        target.appendChild(container);
    }
  }

    async function checkExportState() {
        const savedExportState = await getValue('exportState', {});
        if (savedExportState && savedExportState.allowExport) {
            exportState = savedExportState;
            isExporting = true;
            exportButton.textContent = `导出中...(${exportState.currentPage}/${exportState.maxPage})`;
            exportButton.disabled = true;
            stopButton.disabled = false;
            scrapeCurrentPage();
        }
    }

  const validUrlPatterns = [
      /https:\/\/javdb\.com\/users\/want_watch_videos.*/,
      /https:\/\/javdb\.com\/users\/watched_videos.*/,
      /https:\/\/javdb\.com\/users\/list_detail.*/,
      /https:\/\/javdb\.com\/lists.*/
  ];

  const isValidUrl = validUrlPatterns.some(pattern => pattern.test(window.location.href));
  if (isValidUrl) {
      createExportButton();
      checkExportState();
  }

})(); 