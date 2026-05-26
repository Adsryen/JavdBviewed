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
      include: ['src/dashboard/components/**/*.ts', 'src/dashboard/ui/**/*.ts', 'src/components/**/*.ts'],
      exclude: ['**/*.test.ts'],
    },
  },
});
