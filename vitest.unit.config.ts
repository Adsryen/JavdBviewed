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
    ],
    exclude: [
      'src/utils/__tests__/**/*.test.ts',
      'src/content/__tests__/**/*.test.ts',
      'src/services/dataAggregator/__tests__/**/*.test.ts',
      'tests/regression/**/*.test.ts',
      'tests/dom/**/*.test.ts',
    ],
  },
});
