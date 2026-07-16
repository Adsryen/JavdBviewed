import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    restoreMocks: true,
    clearMocks: true,
    environment: 'node',
    include: [
      'apps/extension/src/**/*.test.ts',
      'scripts/**/*.test.ts',
      'tests/*.test.ts',
      'tests/regression/**/*.test.ts',
    ],
    exclude: [
      'apps/extension/src/utils/__tests__/**/*.test.ts',
      'apps/extension/src/content/__tests__/**/*.test.ts',
      'apps/extension/src/services/dataAggregator/__tests__/**/*.test.ts',
      'tests/dom/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage/node',
      include: ['apps/extension/src/**/*.ts', 'scripts/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/__tests__/**',
        'apps/extension/src/**/*.d.ts',
        'apps/extension/src/assets/**',
        'apps/extension/src/vite-env.d.ts',
      ],
    },
  },
});
