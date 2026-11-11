import { defineConfig, globalIgnores } from 'eslint/config';
import obsidianmd from 'eslint-plugin-obsidianmd';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default defineConfig(
	globalIgnores([
		'**/node_modules/',
		'main.js',
		'dist/',
		'coverage/',
		'.vitest/',
		'.wdio-obsidian-cache/',
		'test-vault/',
		'.agents/',
		'.claude/',
		'.archon/',
		'worktrees/',
		'pnpm-lock.yaml',
	]),
	...obsidianmd.configs.recommended,
	{
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: [
						'packages/plugin/esbuild.config.mjs',
						'scripts/version-bump.mjs',
					],
				},
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	eslintConfigPrettier,
);
