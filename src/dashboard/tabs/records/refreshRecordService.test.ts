import { describe, expect, it, vi } from 'vitest';
import { refreshRecordsSingleRecord } from './refreshRecordService';

describe('records refresh record service', () => {
  it('sends refresh-record runtime message and resolves on success', async () => {
    const sendRuntimeMessage = vi.fn((_message, callback) => callback({ success: true }));

    await refreshRecordsSingleRecord('ABC-123', sendRuntimeMessage);

    expect(sendRuntimeMessage).toHaveBeenCalledWith(
      { type: 'refresh-record', videoId: 'ABC-123' },
      expect.any(Function),
    );
  });

  it('rejects with background error message when refresh fails', async () => {
    const sendRuntimeMessage = vi.fn((_message, callback) => callback({ success: false, error: '远端失败' }));

    await expect(refreshRecordsSingleRecord('ABC-123', sendRuntimeMessage)).rejects.toThrow('远端失败');
  });

  it('rejects with fallback message when sending throws', async () => {
    const sendRuntimeMessage = vi.fn(() => {
      throw new Error('runtime lost');
    });

    await expect(refreshRecordsSingleRecord('ABC-123', sendRuntimeMessage)).rejects.toThrow('runtime lost');
  });
});
