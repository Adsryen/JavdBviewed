const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  cacheDir: '/tmp/javdbviewed-vitest-unit-cache',
  test: {
    globals: true,
    restoreMocks: true,
    clearMocks: true,
    environment: 'node',
    include: [
      'apps/extension/src/**/*.test.ts',
      'apps/extension/src/**/*.test.tsx',
      'scripts/**/*.test.ts',
      'tests/*.test.ts',
    ],
    exclude: [
      'apps/extension/src/utils/__tests__/**/*.test.ts',
      'apps/extension/src/content/__tests__/**/*.test.ts',
      'apps/extension/src/services/dataAggregator/__tests__/**/*.test.ts',
      'tests/regression/**/*.test.ts',
      'tests/dom/**/*.test.ts',
      'tests/extension/**/*.test.ts',
    ],
  },
});
