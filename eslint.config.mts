import { builtinModules } from 'node:module';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { importX } from 'eslint-plugin-import-x';
import obsidianmd from 'eslint-plugin-obsidianmd';
import tseslint from 'typescript-eslint';

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
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		files: ['**/*.ts', '**/*.mts'],
		extends: [tseslint.configs.strictTypeChecked],
		rules: {
			'@typescript-eslint/no-deprecated': 'error',
			'@typescript-eslint/no-floating-promises': 'error',
			// A cast that overrides the checker needs a suppression comment like any other.
			'@typescript-eslint/no-unsafe-type-assertion': 'error',
			'@typescript-eslint/switch-exhaustiveness-check': 'error',
			// Replaced by eslint-plugin-obsidianmd's own rules (its README, "stricter configs"):
			'@typescript-eslint/no-misused-promises': 'off',
			'@typescript-eslint/no-require-imports': 'off',
		},
	},
	{
		// JavaScript build scripts belong to no TypeScript project, so type-aware rules cannot run on them.
		files: ['**/*.mjs', '**/*.js', '**/*.cjs'],
		extends: [tseslint.configs.disableTypeChecked],
	},
	{
		files: ['packages/core/**/*.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					paths: [
						{
							name: 'obsidian',
							message:
								'The core never imports Obsidian (TAD E1). Declare a port instead.',
						},
						{ name: 'electron', message: 'The core never imports Electron.' },
						...builtinModules.map((moduleName) => ({
							name: moduleName,
							message: 'The core never imports Node built-ins.',
						})),
					],
					patterns: [
						{
							group: ['@codemirror/*', '@lezer/*', 'node:*'],
							message: 'Not allowed in the core.',
						},
					],
				},
			],
		},
	},
	{
		files: ['**/*.ts', '**/*.mts'],
		plugins: { 'import-x': importX },
		settings: {
			// Without these two settings import-x skips .ts files and no-cycle reports nothing.
			'import-x/extensions': ['.ts', '.mts', '.js', '.mjs'],
			'import-x/parsers': { '@typescript-eslint/parser': ['.ts', '.mts'] },
			'import-x/resolver-next': [
				createTypeScriptImportResolver({
					project: [
						'tsconfig.json',
						'packages/*/tsconfig.json',
						'e2e-tests/tsconfig.json',
					],
					noWarnOnMultipleProjects: true,
				}),
			],
		},
		rules: { 'import-x/no-cycle': 'error' },
	},
	eslintConfigPrettier,
);
