const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  cacheDir: '/tmp/javdbviewed-vitest-unit-cache',
  test: {
    globals: true,
    restoreMocks: true,
    clearMocks: true,
    environment: 'node',
    include: [
      'src/**/*.test.ts',
      'scripts/**/*.test.ts',
      'tests/*.test.ts',
    ],
    exclude: [
      'src/utils/__tests__/**/*.test.ts',
      'src/content/__tests__/**/*.test.ts',
      'src/services/dataAggregator/__tests__/**/*.test.ts',
      'tests/regression/**/*.test.ts',
      'tests/dom/**/*.test.ts',
      'tests/extension/**/*.test.ts',
    ],
  },
});
