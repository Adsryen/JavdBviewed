const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  cacheDir: '/tmp/javdbviewed-vitest-regression-cache',
  test: {
    globals: true,
    restoreMocks: true,
    clearMocks: true,
    environment: 'node',
    include: ['tests/regression/**/*.test.ts'],
  },
});
