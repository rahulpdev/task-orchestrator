# New worktree: Python/uv tool set

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

## Install

- Run: `uv sync --locked --directory "worktrees/$FOLDER"`. The `--locked` flag stops with an error instead of rewriting `uv.lock` when it is missing or out of date.
- If `uv sync` fails, capture the error and add it under **Risks / gotchas** in the final report, mark the run as `Status: Partial`, and continue to Step 12.

## Assumptions and limits

- The project uses Python + `uv` with `uv.lock` committed; project source lives under `app/`; `pytest`, `mypy`, and `pyright` are declared as dev dependencies.
- `pyproject.toml` presence and dev-dependency declarations are checked but the file's contents are not otherwise validated.
