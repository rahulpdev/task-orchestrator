# New worktree: pnpm tool set

## Checks

1. **Confirm this is a pnpm workspace and the toolchain is installed.**
   - Run: `test -f package.json && test -f pnpm-workspace.yaml && test -f pnpm-lock.yaml`. If any is missing, stop and tell the user that this is not a pnpm workspace with a committed `pnpm-lock.yaml`.
   - Run: `pnpm --version`. If it fails, stop and tell the user to install `pnpm`. Do not attempt a fallback installer.
   - Run: `node --version`. If its major version is lower than the version in `.nvmrc`, stop and tell the user to switch to that Node version (the scripts run `.ts` files with Node's built-in type stripping).
2. **Confirm the `packages/` directory exists at the repo root.**
   - Run: `test -d packages`.
   - If it does not exist, stop and tell the user that a `packages/` directory is required at the repo root.
3. **Confirm `vitest`, `typescript`, and `eslint` are declared in the root `package.json`.**
   - Run: `grep -qE '"vitest"[[:space:]]*:' package.json && grep -qE '"typescript"[[:space:]]*:' package.json && grep -qE '"eslint"[[:space:]]*:' package.json`.
   - Each pattern matches the quoted package name as a dependency key, such as `"vitest": "^5.1.0"`. It does not match a different package whose name only starts or ends the same way, such as `"typescript-eslint"` or `"@vitest/coverage-v8"`.
   - If any of the three is missing, stop and tell the user which tool(s) are missing and to add them with `pnpm add -D -w vitest typescript eslint`.

## Install

- Run: `pnpm install --frozen-lockfile --dir "worktrees/$FOLDER"`. The `--frozen-lockfile` flag stops with an error instead of rewriting `pnpm-lock.yaml` when it is missing or out of date.
- If `pnpm install` fails, capture the error and add it under **Risks / gotchas** in the final report, mark the run as `Status: Partial`, and continue to Step 12.

## Assumptions and limits

- The project uses a pnpm workspace with `pnpm-lock.yaml` committed and the Node version in `.nvmrc`; project source lives under `packages/`; `vitest`, `typescript`, and `eslint` are declared as root dev dependencies; ESLint and the root `tsconfig.json` ignore `worktrees/`.
- `package.json` presence and dev-dependency declarations are checked but the file's contents are not otherwise validated.
