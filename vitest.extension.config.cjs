const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  cacheDir: '/tmp/javdbviewed-vitest-extension-cache',
  test: {
    globals: true,
    restoreMocks: true,
    clearMocks: true,
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'https://javdb.com/v/abc123',
      },
    },
    include: ['tests/extension/**/*.test.ts'],
    setupFiles: ['tests/setup/chrome.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage/extension',
      include: [
        'src/content/taskRuntime.ts',
        'src/content/pageContext.ts',
        'src/shared/taskCenterProtocol.ts',
        'src/utils/storage.ts',
        'src/manifest.json',
      ],
      exclude: ['**/*.test.ts'],
    },
  },
});
