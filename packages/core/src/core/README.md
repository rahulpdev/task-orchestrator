# Where code belongs

The application core is split into four places. Use this rule to decide where new code goes.

| Place                                   | What belongs there                                                                                                                                                                                                                                                              | Test                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `core/` (this folder)                   | What every request passes through: the internal API (`api.ts`), the error model (`errors.ts`), logging (`logging.ts`), identifiers (`ids.ts`), the ports (`ports.ts`), the messages catalogue (`messages/`), diagnostics (`diagnostics.ts`) and the test adapters (`testing/`). | Would every feature break without it?                       |
| `shared/`                               | Helpers used by three or more slices, such as `dates.ts`. Never imports a slice.                                                                                                                                                                                                | Do three slices need it, and does it hold no feature rules? |
| a slice folder, such as `settings/`     | One feature's rules, schemas and operations. Other slices may use only what its `index.ts` publishes.                                                                                                                                                                           | Does it belong to exactly one feature?                      |
| the plugin package (`packages/plugin/`) | Anything that touches the host application: port adapters, the settings tab, commands.                                                                                                                                                                                          | Does it call the host application's API?                    |

`core/` never imports `shared/` or a slice. `pnpm lint` enforces these rules through `scripts/check-core-boundary.ts`.

## Examples from the planned slices

| Code                                                                  | Place             | Why                                           |
| --------------------------------------------------------------------- | ----------------- | --------------------------------------------- |
| The request envelope and dispatcher                                   | `core/api.ts`     | Every request passes through it.              |
| `CORE_TARGET_NOT_FOUND`                                               | `core/errors.ts`  | Shared by every feature.                      |
| Parsing ISO dates                                                     | `shared/dates.ts` | Capture, review and dashboard all read dates. |
| The rule that a blocker may not form a loop (`ORGANISE_BLOCKER_LOOP`) | `organise/`       | Belongs to one feature.                       |
| Opening a weekly review (`REVIEW_ALREADY_OPEN`)                       | `review/`         | Belongs to one feature.                       |
| Turning a captured line into an inbox note                            | `capture/`        | Belongs to one feature.                       |
| Licence checks                                                        | `licensing/`      | Belongs to one feature.                       |
| Reading front matter from the host application's metadata cache       | plugin package    | Calls the host application's API.             |
| The settings tab                                                      | plugin package    | Host interface code.                          |
