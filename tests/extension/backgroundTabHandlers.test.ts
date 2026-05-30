import { describe, expect, it, vi } from 'vitest';
import {
  handleDrive115Push,
  handleDrive115Verify,
  handleOpenTabBackground,
} from '../../src/apps/background/tabMessageHandlers';
import {
  getCreatedTabs,
  getTabsMessages,
} from '../setup/chrome';

describe('background tab message handlers', () => {
  it('opens a URL in a background tab', async () => {
    const sendResponse = vi.fn();

    await handleOpenTabBackground({ url: 'https://javdb.com/v/abc123' }, sendResponse);

    expect(getCreatedTabs()).toEqual([{ url: 'https://javdb.com/v/abc123', active: false }]);
    expect(sendResponse).toHaveBeenCalledWith({ success: true, tabId: 1 });
  });

  it('returns an error when background tab URL is missing', async () => {
    const sendResponse = vi.fn();

    await handleOpenTabBackground({}, sendResponse);

    expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'No URL provided' });
  });

  it('returns DRIVE115 push error when no 115 tab exists', async () => {
    const sendResponse = vi.fn();

    await handleDrive115Push({ type: 'DRIVE115_PUSH', requestId: 'req-1' }, sendResponse);

    expect(sendResponse).toHaveBeenCalledWith({
      type: 'DRIVE115_PUSH_RESPONSE',
      requestId: 'req-1',
      success: false,
      error: '未找到 115.com 标签页',
    });
  });

  it('forwards DRIVE115 push messages to the first 115 tab', async () => {
    vi.mocked(chrome.tabs.query).mockResolvedValueOnce([{ id: 115, url: 'https://115.com/' } as chrome.tabs.Tab]);
    vi.mocked(chrome.tabs.sendMessage).mockImplementationOnce((tabId, message, callback) => {
      callback?.({ type: 'DRIVE115_PUSH_RESPONSE', requestId: (message as any).requestId, success: true });
      return undefined as any;
    });
    const sendResponse = vi.fn();

    await handleDrive115Push({ type: 'DRIVE115_PUSH', requestId: 'req-2' }, sendResponse);

    expect(getTabsMessages()).toEqual([]);
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      115,
      { type: 'DRIVE115_PUSH', requestId: 'req-2' },
      expect.any(Function),
    );
    expect(sendResponse).toHaveBeenCalledWith({
      type: 'DRIVE115_PUSH_RESPONSE',
      requestId: 'req-2',
      success: true,
    });
  });

  it('forwards DRIVE115 verify messages to the first 115 tab', async () => {
    vi.mocked(chrome.tabs.query).mockResolvedValueOnce([{ id: 116, url: 'https://115.com/' } as chrome.tabs.Tab]);
    vi.mocked(chrome.tabs.sendMessage).mockImplementationOnce((_tabId, _message, callback) => {
      callback?.({ success: true, verified: true });
      return undefined as any;
    });
    const sendResponse = vi.fn();

    await handleDrive115Verify({ type: 'DRIVE115_VERIFY' }, sendResponse);

    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      116,
      { type: 'DRIVE115_VERIFY' },
      expect.any(Function),
    );
    expect(sendResponse).toHaveBeenCalledWith({ success: true, verified: true });
  });
});
