import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1_500,
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    exclude: [
      ...configDefaults.exclude,
      '**/.worktrees/**',
      '**/dist/**',
    ],
  },
});
