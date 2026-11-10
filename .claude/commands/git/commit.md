---
description: Create an atomic git commit with conventional message format
argument-hint: [notes] (optional - free-form context to fold into the commit message)
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*)
---

# Commit: Create Git Commit

## Philosophy

Commit messages are **long-term memory** for AI agents. When future agents run `git log`, your commit messages help them understand:

- What was changed and why
- Patterns and conventions established
- Decisions made and their rationale
- Context that code alone doesn't convey

## Notes

Notes from invocation: $ARGUMENTS

(Free-form context — e.g., files to include or exclude, framing for the body.)

## Commit Process

### 1. Review Current State

Check git status:
!`git status`

Review changes to commit:
!`git diff HEAD`

### 2. Analyze Changes

Examine the diff and determine:

**Type of change:**

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation only
- `test`: Adding or updating tests
- `chore`: Maintenance (deps, config, etc.)
- `perf`: Performance improvement
- `style`: Code style/formatting
- `build`: build system/dependencies
- `ci`: CI config/scripts
- `revert`: dedicated revert format

**Scope (if applicable):**

- Component or area affected (api, auth, ui, etc.)

**Description:**

- Brief summary of what changed (72 chars or less)
- Use imperative mood ("add" not "added")

**Body (if needed):**

- Why the change was made, not just what
- Non-obvious decisions and their reasoning
- Context that code alone doesn't convey (caveats, constraints, tradeoffs)
- Keep this readable prose (paragraphs or short bullets), not a metadata dump

**Breadcrumbs (required footer):**

- Add a `Breadcrumbs:` footer to every commit
- Include single word or two word phrases that someone might vaguely remember later
- Prefer stable, searchable signposts over narrative explanation
- Mix:
  - Domain/feature names (e.g. auth, onboarding, billing)
  - Technologies/tools (e.g. JWT, Redis, Terraform)
  - Plain-language synonyms (e.g. login flow, rate limiting, CSV export)
- Keep it small: 3–8 items, comma-separated

**Session (required footer):**

- Add a `Session:` footer to every commit
- Format: `Session: <agent>, <model>, <sessionId>`
- Use these exact instructions to identify values:
  - Give me a one-word answer: your name.
  - If your response is “Codex” follow these steps:
    - Get sessionId:
      `Run: printenv CODEX_THREAD_ID`
    - Read the session file directly (do not list or check the directory first):
      `Read (~/.codex/sessions/YYYY/MM/DD/rollout-*-{CODEX_THREAD_ID}.jsonl)`
    - Extract and return model
  - If your response is “Claude” follow these steps:
    - Get process ID (the Bash tool spawns a child shell whose PPID is the Claude Code process, which matches the session filename):
      !`ps -o ppid= -p $$`
    - Read the session file directly (do not list or check the directory first):
      `Read (~/.claude/sessions/<PPID>.json)`
    - Extract and return sessionId
    - Get and transform current working directory:
      !`pwd | sed 's|^/||; s|/|-|g'`
    - Read the transcript file directly (do not list or check the directory first):
      `Read (~/.claude/projects/-<cwd>/<sessionID>.jsonl)`
    - Extract and return model

**Other useful footers (optional, not exhaustive):**

- `Pattern:` Convention established or followed
- `Decision:` Key choice and why (one line)
- `Related:` File paths, modules, tickets, or follow-ups
- `Gotcha:` Operational caveat or sharp edge
- `Refs:` External references (issue IDs, PRs, docs)

**Breaking changes (if any):**

- Note any breaking changes

### 3. Stage Files

Stage the changed files explicitly by path:

```bash
git add path/to/file1 path/to/file2
```

Ensure that:

- No plaintext secrets/credentials are included.
- No debug logs/temp files/environment-specific files are included.
- If there are unrelated changes, pre-existing changes, or untracked files, stop and ask what should be included.
- Honor any inclusion or exclusion rules in the notes from invocation (e.g., "only include foo.md", "don't include bar.md"). If a rule is ambiguous, stop and ask before staging.

### 4. Compose Commit Message

Using conventional commit format:

```
type(scope): description

body (why + context)

[optional footer where applicable]
Breadcrumbs: ...
Session: agent, model, sessionId
```

**Bad** (no context for future readers):

```
update auth
```

**Good** (clear intent with structured context):

```
feat(auth): add user authentication system

Implements JWT-based authentication with:
- Login endpoint with credentials validation
- Token generation and verification
- Protected route middleware

Pattern: Decorator-based middleware (src/middleware/auth.py)
Decision: JWT over sessions for stateless scaling
Related: Frontend token handling (src/hooks/useAuth.ts)
Gotcha: Increment version in application code, not DB trigger
Breadcrumbs: auth, login flow, jwt, access token, protected routes
Session: codex, gpt-5.4, 019d4d4d-4d23-77e0-bde5-dcd07564c930
```

### 5. Execute Commit

Execute the commit using a heredoc for multi-line messages:

```bash
git commit -m "$(cat <<'EOF'
type(scope): description

Body explaining why and providing context.

Structured annotations where applicable.
Breadcrumbs: domain, feature, tech, tool, plain-language synonym
Session: agent, model, sessionId
EOF
)"
```

### 6. Confirm Success

Verify commit created:
!`git log -1 --oneline`

Show commit details:
!`git show --stat`

## Output Report

### Commit Created

**Commit Hash**: [hash]

**Commit Message**:

```
[full commit message]
```

**Files Committed**:

- [list of files with change stats]

**Summary**:

- X files changed
- Y insertions(+)
- Z deletions(-)

### Next Steps

Commit successfully created! Next actions:

- Push to remote: `git push`
- Or continue development with next feature

## Notes

- If there are no changes to commit, report this clearly
- If commit fails (e.g., pre-commit hooks), report the error
- Follow the project's commit message conventions
