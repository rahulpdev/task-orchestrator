---
description: Create one git commit holding a single self-contained change, with its message in the Conventional Commits format (a published standard layout for commit messages)
argument-hint: [notes] (optional - free-form context to fold into the commit message)
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*)
---

# Commit: Create Git Commit

## Philosophy

Commit messages are **a lasting record** for AI agents. When future agents run `git log`, the git command that lists past commits with their messages, your commit messages help them understand:

- What was changed and why
- Patterns and conventions established
- Decisions made and their rationale
- Context that code alone doesn't convey

## Notes

Notes typed after the command name: $ARGUMENTS

(Free-form context, e.g., files to include or exclude, framing for the body.)

## Commit Process

### 1. Review Current State

Check git status, which lists the files that have changed since the last commit:
!`git status`

Review changes to commit:
!`git diff HEAD`

### 2. Analyze Changes

Examine the changes listed above and determine:

**Type of change:**

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring (rearranging code without changing what it does)
- `docs`: Documentation only
- `test`: Adding or updating tests
- `chore`: Maintenance (the outside packages the code depends on, configuration, etc.)
- `perf`: Performance improvement
- `style`: Code style/formatting
- `build`: build system (the tools that package the code for installing) or the outside packages it depends on
- `ci`: configuration or scripts for CI (continuous integration, the checks a code-hosting service runs by itself whenever new commits arrive)
- `revert`: undoing an earlier commit, which has a message format of its own

**Scope (if applicable):**

- Component or area affected, such as api (the way other programs talk to the system), auth (signing in) or ui (the screens a person uses)

**Description:**

- Brief summary of what changed (72 characters or less)
- Use imperative mood ("add" not "added")

**Body (if needed):**

- Why the change was made, not just what
- Non-obvious decisions and their reasoning
- Context that code alone doesn't convey (caveats, constraints, tradeoffs)
- Keep this readable prose (paragraphs or short bullets), not a list of labelled fields and values

**Breadcrumbs (a required footer, meaning a labelled line at the end of the message; this one holds words to find the commit by later):**

- Add a `Breadcrumbs:` footer to every commit
- Include single word or two word phrases that someone might vaguely remember later
- Prefer stable, searchable words and phrases over narrative explanation
- Mix:
  - Names of the area or feature (e.g. auth, onboarding, billing)
  - Technologies/tools (e.g. JWT, a kind of sign-in pass; Redis; Terraform)
  - Plain-language synonyms (e.g. login flow; rate limiting, a cap on how often something may be called; CSV export, saving data as a spreadsheet file)
- Keep it small: 3–8 items, comma-separated

**Session (required footer):**

- Add a `Session:` footer to every commit
- Format: `Session: <agent>, <model>, <sessionId>`
- Use these exact instructions to identify values:
  - Give me a one-word answer: your name.
  - If your response is “Codex” follow these steps:
    - Get sessionId, the identifier of this working session:
      `Run: printenv CODEX_THREAD_ID`
    - Read the session file directly (do not list or check the directory first):
      `Read (~/.codex/sessions/YYYY/MM/DD/rollout-*-{CODEX_THREAD_ID}.jsonl)`
    - Extract and return model
  - If your response is “Claude” follow these steps:
    - Get process ID, the number the computer gives each running program (the Bash tool starts a new shell whose parent, the program that started it, is Claude Code; that parent's number, the PPID or parent process ID, matches the session filename):
      !`ps -o ppid= -p $$`
    - Read the session file directly (do not list or check the directory first):
      `Read (~/.claude/sessions/<PPID>.json)`
    - Extract and return sessionId
    - Get the current working directory (the folder this session runs in) and transform it by dropping the leading slash and changing every other slash to a hyphen:
      !`pwd | sed 's|^/||; s|/|-|g'`
    - Read the transcript file directly (do not list or check the directory first):
      `Read (~/.claude/projects/-<cwd>/<sessionID>.jsonl)`
    - Extract and return model

**Other useful footers (optional, not exhaustive):**

- `Pattern:` Convention established or followed
- `Decision:` Key choice and why (one line)
- `Related:` File paths, modules, tickets, or follow-ups
- `Gotcha:` Operational caveat, or something easy to get wrong
- `Refs:` External references (issue IDs; pull requests, meaning proposed changes waiting to be merged; docs)

**Breaking changes, ones that stop something that used to work (if any):**

- Note any breaking changes (changes after which something that relied on the old behaviour stops working)

### 3. Stage Files

Stage the changed files explicitly by path (staging a file marks it to go into the next commit):

```bash
git add path/to/file1 path/to/file2
```

Ensure that:

- No plaintext (readable, unencrypted) secrets/credentials are included.
- No debug logs, temporary files or files that only fit one computer's setup are included.
- If there are unrelated changes, pre-existing changes, or files not yet kept in git, stop and ask what should be included.
- Honor any inclusion or exclusion rules in the notes typed after the command name (e.g., "only include foo.md", "don't include bar.md"). If a rule is ambiguous, stop and ask before staging.

### 4. Compose Commit Message

Using the Conventional Commits format, a published standard layout for commit messages:

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

Implements authentication based on JWT, a signed sign-in pass the server hands out, with:
- A login web address that checks the credentials it is sent
- Token (sign-in pass) generation and verification
- A check, run before each request to a protected address, that turns away anyone not signed in

Pattern: The sign-in check is added to each protected function by a decorator, a marker line placed above the function (src/middleware/auth.py)
Decision: JWT over sessions stored on the server, so more servers can be added without sharing sign-in records
Related: How the part of the app that runs in the browser handles tokens (src/hooks/useAuth.ts)
Gotcha: Increment version in application code, not in a database trigger (a rule the database runs by itself when data changes)
Breadcrumbs: auth, login flow, jwt, access token, protected routes
Session: codex, gpt-5.4, 019d4d4d-4d23-77e0-bde5-dcd07564c930
```

### 5. Execute Commit

Write the full commit message to a temporary file with the file-writing tool (in the session's scratchpad folder if it has one), then commit from that file and delete it. Do not pass the message through a heredoc (a way of handing a shell command several lines of text at once): a guard that refuses shell commands which might print secrets denies any heredoc whose text holds a `$` followed by a letter or digit, such as `$HOME` or `$PATH`, which commit messages about code often quote.

```bash
git commit -F /path/to/commit-message.txt && rm /path/to/commit-message.txt
```

The `&&` deletes the file only once the commit succeeds, so a refused commit keeps its message for the retry; delete the file once that retry succeeds.

### 6. Confirm Success

Verify commit created:
!`git log -1 --oneline`

Show commit details:
!`git show --stat`

## Output Report

### Commit Created

**Commit Hash**: [hash, a short code worked out from the commit, which changes if any character changes and which git uses to name the commit]

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

- Push to remote, which sends the new commit to the copy of the repository on GitHub: `git push`
- Or continue development with next feature

## Notes

- If there are no changes to commit, report this clearly
- If commit fails (e.g., a pre-commit hook, the script git runs before each commit, refuses it), report the error
- Follow the project's commit message conventions
