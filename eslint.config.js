import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    'dist/**',
    '**/dist/**',
    'node_modules/**',
    '**/node_modules/**',
    '.worktrees/**',
    '**/.worktrees/**',
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
);
