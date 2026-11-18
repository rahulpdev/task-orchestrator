# Merge worktrees: pnpm tool set

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

## Worktree changes to allow

Allow `node_modules/` lines in the output. Treat any other non-empty line as user state, including a change to `pnpm-lock.yaml`. If any user state exists, stop and tell the user to commit or discard those changes before re-running.

## Validation

- Run, in order:
  - `pnpm install --frozen-lockfile`
  - `pnpm test`
  - `pnpm typecheck`
  - `pnpm lint`
- `pnpm install` brings the main repo's `node_modules` in line with the merged `pnpm-lock.yaml`; the later commands do not do this themselves. The `--frozen-lockfile` flag stops with an error instead of rewriting `pnpm-lock.yaml` when it is missing or out of date. Treat that error as a validation failure.
- If any exits non-zero, capture which command failed and the last lines of its output, run `git merge --abort`, then run `pnpm install --frozen-lockfile` to return `node_modules` to the base branch's lockfile, and stop and tell the user which command failed and its output.

## Assumptions and limits

- The project uses a pnpm workspace with `pnpm-lock.yaml` committed and the Node version in `.nvmrc`; project source lives under `packages/`; `vitest`, `typescript`, and `eslint` are declared as root dev dependencies.
- Known limitation: `package.json` presence and dev-dependency declarations are checked, but the file's contents are not otherwise validated. In particular, ESLint's `globalIgnores` and the root `tsconfig.json` `exclude` must both list `worktrees/`; otherwise Step 14 lints and type-checks every live worktree, including the one being merged, and fails mid-merge. Keep test discovery roots out of `worktrees/`.
