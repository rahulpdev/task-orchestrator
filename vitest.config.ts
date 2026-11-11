import path from 'node:path';
import { defineConfig } from 'vitest/config';

const repositoryRoot = import.meta.dirname;

export default defineConfig({
	test: {
		coverage: {
			enabled: true,
			provider: 'v8',
			reporter: ['text'],
			include: ['packages/*/src/**/*.ts'],
			exclude: ['**/*.test.ts'],
		},
		projects: [
			{
				test: {
					name: 'core',
					include: ['packages/core/src/**/*.test.ts'],
					environment: 'node',
				},
			},
			{
				resolve: {
					alias: { obsidian: path.resolve(repositoryRoot, '__mocks__/obsidian.ts') },
				},
				test: {
					name: 'plugin',
					include: ['packages/plugin/src/**/*.test.ts'],
					environment: 'node',
				},
			},
			{
				test: {
					name: 'test-client',
					include: ['packages/test-client/src/**/*.test.ts'],
					environment: 'node',
				},
			},
			{
				test: {
					name: 'scripts',
					include: ['scripts/**/*.test.ts'],
					environment: 'node',
				},
			},
		],
	},
});
