import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    restoreMocks: true,
    clearMocks: true,
    environment: 'jsdom',
    include: ['tests/dom/**/*.test.ts'],
    setupFiles: ['tests/setup/proxy.ts', 'tests/setup/dom.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage/dom',
      include: ['apps/extension/src/dashboard/components/**/*.ts', 'apps/extension/src/dashboard/ui/**/*.ts', 'apps/extension/src/components/**/*.ts'],
      exclude: ['**/*.test.ts'],
    },
  },
});
