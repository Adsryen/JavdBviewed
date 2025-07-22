// storage.js
// 封装 chrome.storage，兼容 GM_setValue/GM_getValue

export function setValue(key, value) {
  return chrome.storage.local.set({ [key]: value });
}

export function getValue(key, defaultValue) {
  return new Promise(resolve => {
    chrome.storage.local.get([key], result => {
      resolve(result[key] !== undefined ? result[key] : defaultValue);
    });
  });
} 