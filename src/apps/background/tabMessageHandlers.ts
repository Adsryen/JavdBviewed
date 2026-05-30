type SendResponse = (response: any) => void;

export async function handleOpenTabBackground(message: any, sendResponse: SendResponse): Promise<void> {
  try {
    const { url } = message;
    if (!url) {
      sendResponse({ success: false, error: 'No URL provided' });
      return;
    }
    const tab = await chrome.tabs.create({ url, active: false });
    sendResponse({ success: true, tabId: tab.id });
  } catch (error: any) {
    console.error('[Background] Failed to open background tab:', error);
    sendResponse({ success: false, error: error.message });
  }
}

export async function handleDrive115Push(message: any, sendResponse: SendResponse): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({ url: '*://115.com/*' });
    if (!tabs.length) {
      sendResponse({ type: 'DRIVE115_PUSH_RESPONSE', requestId: message?.requestId, success: false, error: '未找到 115.com 标签页' });
      return;
    }
    const tabId = tabs[0].id;
    if (!tabId) {
      sendResponse({ type: 'DRIVE115_PUSH_RESPONSE', requestId: message?.requestId, success: false, error: '标签页ID无效' });
      return;
    }
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[Background] DRIVE115_PUSH sendMessage failed:', { tabId, error: chrome.runtime.lastError.message });
        sendResponse({ type: 'DRIVE115_PUSH_RESPONSE', requestId: message?.requestId, success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse(response || { type: 'DRIVE115_PUSH_RESPONSE', requestId: message?.requestId, success: true });
      }
    });
  } catch (error: any) {
    console.error('[Background] Failed to handle DRIVE115_PUSH:', error);
    sendResponse({ type: 'DRIVE115_PUSH_RESPONSE', requestId: message?.requestId, success: false, error: error.message });
  }
}

export async function handleDrive115Verify(message: any, sendResponse: SendResponse): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({ url: '*://115.com/*' });
    if (!tabs.length) {
      sendResponse({ success: false, error: '未找到 115.com 标签页' });
      return;
    }
    const tabId = tabs[0].id;
    if (!tabId) {
      sendResponse({ success: false, error: '标签页ID无效' });
      return;
    }
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[Background] DRIVE115_VERIFY sendMessage failed:', { tabId, error: chrome.runtime.lastError.message });
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse(response ?? { success: true });
      }
    });
  } catch (error: any) {
    console.error('[Background] Failed to handle DRIVE115_VERIFY:', error);
    sendResponse({ success: false, error: error.message });
  }
}
