const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  cacheDir: '/tmp/javdbviewed-vitest-regression-cache',
  test: {
    globals: true,
    restoreMocks: true,
    clearMocks: true,
    environment: 'node',
    testTimeout: 20000,
    include: ['tests/regression/**/*.test.ts'],
  },
});
