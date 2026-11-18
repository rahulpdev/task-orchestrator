# Merge worktrees: Python/uv tool set

## Checks

1. **Confirm this is a uv-managed project and `uv` is installed.**
   - Run: `test -f pyproject.toml`. If it does not exist, stop and tell the user that this is not a uv-managed project.
   - Run: `uv --version`. If it fails, stop and tell the user to install `uv`. Do not attempt a fallback installer.
2. **Confirm the `app/` directory exists at the repo root.**
   - Run: `test -d app`.
   - If it does not exist, stop and tell the user that an `app/` directory is required at the repo root.
3. **Confirm `pytest`, `mypy`, and `pyright` are declared in `pyproject.toml`.**
   - Run: `grep -qE '"pytest[^A-Za-z0-9_.-]' pyproject.toml && grep -qE '"mypy[^A-Za-z0-9_.-]' pyproject.toml && grep -qE '"pyright[^A-Za-z0-9_.-]' pyproject.toml`.
   - Each pattern matches the quoted package name with or without a version constraint, such as `"pytest"` or `"pytest>=8.3"`. It does not match a different package whose name only starts the same way, such as `"pytest-cov"`.
   - If any of the three is missing, stop and tell the user which tool(s) are missing and to add them with `uv add --dev pytest mypy pyright`.

## Worktree changes to allow

Allow `.venv/` lines in the output. Treat any other non-empty line as user state, including a change to `uv.lock`. If any user state exists, stop and tell the user to commit or discard those changes before re-running.

## Validation

- Run, in order:
  - `uv run --locked pytest -v --ignore=worktrees`
  - `uv run --locked mypy app/`
  - `uv run --locked pyright app/`
- The `--locked` flag stops with an error instead of rewriting `uv.lock` when it is missing or out of date. Treat that error as a validation failure.
- If any exits non-zero, capture which command failed and the last lines of its output, run `git merge --abort`, and stop and tell the user which command failed and its output.

## Assumptions and limits

- The project uses Python + `uv` with `uv.lock` committed; project source lives under `app/`; `pytest`, `mypy`, and `pyright` are declared as dev dependencies.
- Known limitation: `pyproject.toml` presence and dev-dependency declarations are checked, but the file's contents are not otherwise validated. In particular, if `[tool.pytest.ini_options].testpaths` resolves into `worktrees/`, Step 14's `--ignore=worktrees` is overridden and pytest will fail mid-merge with a collection error. Keep test discovery roots out of `worktrees/`.
