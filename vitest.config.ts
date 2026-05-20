import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    restoreMocks: true,
    clearMocks: true,
    environment: 'node',
    include: [
      'src/**/*.test.ts',
      'scripts/**/*.test.ts',
      'tests/*.test.ts',
      'tests/regression/**/*.test.ts',
    ],
    exclude: [
      'src/utils/__tests__/**/*.test.ts',
      'src/content/__tests__/**/*.test.ts',
      'src/services/dataAggregator/__tests__/**/*.test.ts',
      'tests/dom/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage/node',
      include: ['src/**/*.ts', 'scripts/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/__tests__/**',
        'src/**/*.d.ts',
        'src/assets/**',
        'src/vite-env.d.ts',
      ],
    },
  },
});
