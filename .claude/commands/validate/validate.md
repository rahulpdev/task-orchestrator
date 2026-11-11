Run comprehensive validation of the project to ensure all tests, type checks, linting, builds, and real-Obsidian tests are working correctly.

Execute the following commands in sequence and report results:

## 1. Test Suite

```bash
pnpm test
```

**Expected:** All tests pass (currently 202 tests), coverage report printed, execution time < 10 seconds

## 2. Type Checking

```bash
pnpm typecheck
```

**Expected:** Exit code 0 with no diagnostics from any package (`@task-orchestrator/core`, `@task-orchestrator/plugin`, `@task-orchestrator/test-client`), the root project or `e2e-tests/`

## 3. Linting

```bash
pnpm lint
```

**Expected:** Zero errors, no new warnings, core boundary check passes

```bash
pnpm format:check
```

**Expected:** "All matched files use Prettier code style!"

## 4. Local Build Validation

Build the plugin:

```bash
pnpm build
```

**Expected:** Build completes and `main.js` is written at the repository root

Verify the bundle:

```bash
ls -la main.js manifest.json styles.css
```

**Expected:** All three files present at the repository root

```bash
grep -c 'require("obsidian")' main.js
```

**Expected:** 1 or more — `obsidian` is required at runtime, not bundled into `main.js`

```bash
node scripts/check-bundle-size.ts
```

**Expected:** `main.js` is within the size budget

Check the manifest:

```bash
pnpm check:manifest
```

**Expected:** `manifest.json`, `versions.json` and `package.json` versions agree and all manifest rules pass

Check the test client against a copy of the fixture vault:

```bash
VAULT_COPY="$(mktemp -d)" && cp -R test-vault/. "$VAULT_COPY"
node packages/test-client/src/cli.ts "$VAULT_COPY" updateSettings '{"language":"en-US"}' > "$VAULT_COPY.result.json" 2> "$VAULT_COPY.log.jsonl"; echo "exit=$?"
node -e "const fs=require('node:fs'); const [resultPath, logPath]=process.argv.slice(1); const result=JSON.parse(fs.readFileSync(resultPath,'utf8')); const lines=fs.readFileSync(logPath,'utf8').split('\n').filter(Boolean).map((line)=>JSON.parse(line)); if (!result.ok || lines.length===0 || !lines.every((line)=>line.correlationId===result.correlationId)) { console.error('test client check failed'); process.exit(1); } console.log('test client ok');" "$VAULT_COPY.result.json" "$VAULT_COPY.log.jsonl"
```

**Expected:** `exit=0`, then `test client ok`: the operation succeeded and every log line on standard error carries the `correlationId` of the `Result` on standard output

## 5. Real-Obsidian Validation

Run the tests inside a real Obsidian:

```bash
pnpm e2e
```

**Expected:** All tests pass against both the `earliest` and `latest` Obsidian versions

## 6. Summary Report

After all validations complete, provide a summary report with:

- Total tests passed/failed
- Type checking status
- Linting status (eslint + prettier)
- Local build status (bundle, size budget, manifest)
- Real-Obsidian test status
- Any errors or warnings encountered
- Overall health assessment (PASS/FAIL)

**Format the report clearly with sections and status indicators (✅/❌)**
