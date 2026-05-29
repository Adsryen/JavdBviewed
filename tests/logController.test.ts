import { describe, expect, it, vi } from 'vitest';
import { LogController } from '../src/platform/logging/logController';

function createConsoleSink() {
  return {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

describe('platform LogController', () => {
  it('keeps category logs quiet until initialized and enabled', async () => {
    const consoleSink = createConsoleSink();
    const controller = new LogController({ console: consoleSink });

    controller.verbose('hidden');
    controller.privacy('hidden');
    controller.storage('hidden');
    expect(consoleSink.log).not.toHaveBeenCalled();

    await controller.initialize(async () => ({
      verboseMode: true,
      showPrivacyLogs: true,
      showStorageLogs: true,
    }));

    controller.verbose('details');
    controller.privacy('private');
    controller.storage('store');

    expect(consoleSink.log).toHaveBeenCalledWith('[VERBOSE] details');
    expect(consoleSink.log).toHaveBeenCalledWith('[PRIVACY] private');
    expect(consoleSink.log).toHaveBeenCalledWith('[STORAGE] store');
  });

  it('persists important logs and respects console suppression', () => {
    const consoleSink = createConsoleSink();
    const persistLog = vi.fn();
    const controller = new LogController({
      console: consoleSink,
      persistLog,
      now: () => new Date('2026-05-28T00:00:00.000Z'),
    });
    controller.updateConfig({ suppressConsoleOutput: true });

    controller.info('saved', { value: 1 });
    controller.warn('warning');
    controller.error('broken');

    expect(consoleSink.log).not.toHaveBeenCalled();
    expect(consoleSink.warn).not.toHaveBeenCalled();
    expect(consoleSink.error).not.toHaveBeenCalled();
    expect(persistLog).toHaveBeenCalledWith({
      timestamp: '2026-05-28T00:00:00.000Z',
      level: 'INFO',
      message: 'saved',
      data: { value: 1 },
    });
    expect(persistLog).toHaveBeenCalledWith({
      timestamp: '2026-05-28T00:00:00.000Z',
      level: 'WARN',
      message: 'warning',
    });
    expect(persistLog).toHaveBeenCalledWith({
      timestamp: '2026-05-28T00:00:00.000Z',
      level: 'ERROR',
      message: 'broken',
    });
  });

  it('marks itself initialized with defaults when config loading fails', async () => {
    const consoleSink = createConsoleSink();
    const controller = new LogController({ console: consoleSink });

    await controller.initialize(async () => {
      throw new Error('settings unavailable');
    });

    expect(controller.isInitialized()).toBe(true);
    expect(controller.shouldShowVerbose()).toBe(false);
    expect(consoleSink.warn).toHaveBeenCalledWith('Failed to initialize log controller, using defaults');
  });
});
