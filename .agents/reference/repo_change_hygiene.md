# Repo Change Hygiene

## README.md

- Maintain `README.md` in the repo root (create if it doesn't exist). Include sections (with code snippets as appropriate) on:
  - Overview and key features
  - Badges
  - Table of contents
  - Step-by-step installation and setup aimed at non-technical users
  - How it works and usage
  - API reference
  - CLI usage
  - FAQs
  - Contributions
  - License

- Keep `README.md` current with each significant feature update (frontend, backend, auth, APIs/integrations).

## Dependencies

- Maintain accurate dependency lists as appropriate (e.g., `requirements.txt`, `package.json`, `Dockerfile`, etc.).
- Maintain corresponding lockfiles (e.g., `uv.lock`, `package-lock.json`, `poetry.lock`) and keep them synchronized with manifest changes.
- Do not manually edit lockfiles; regenerate them using the package manager.
- Update dependency files immediately when adding/removing packages.
- Pin exact package versions in production dependencies where feasible (e.g., `package@1.2.3`).
- Keep development and production dependency lists synchronized across environments.

## Excluded Files

- Add sensitive configuration files, data files (e.g., `.csv`, `.xlsx`), auto-generated files, build artifacts, and other non-essential content to:
  - `.gitignore` in the repo root (create if it doesn't exist)

- If the project uses Docker (e.g., `Dockerfile`, `docker-compose.yml`, or `docker-compose*.yml` exists), also maintain:
  - `.dockerignore` in the repo root (create if it doesn't exist)

- Keep `.gitignore` and `.dockerignore` aligned so non-runtime and sensitive files are not copied into images or committed to the repo.

## Configuration

- Keep runtime configuration definitions consistent across code and config sources (e.g., `.env.example`, config files, CI variables, production values).
- Ensure setting names are consistent and unambiguous across environments.
- Define required settings in the appropriate source and document setup requirements in `README.md` where needed.
- Use safe defaults where possible; avoid unsafe defaults in production paths.

## Secrets

- Never commit plaintext secrets, tokens, API keys, or credentials.
- Scan changed files for potential secret exposure before merge.
- If a secret is exposed, treat it as an incident: remove it from version control and rotate it.
