# Settings slice

Holds the user's settings and the only two ways to read or change them.

## Flows

- **Read**: the `settings` query (version 1) reads `settings.json` from the local store. A missing file gives the defaults with `loadStatus: 'defaulted'`. A file that is not valid JSON, is not an object, or has a field of the wrong type gives the defaults with `loadStatus: 'corrupt'`, and the event `settings.file.load_rejected` is logged. A valid file gives `loadStatus: 'valid'` after any pending migrations run in memory.
- **Update**: the `updateSettings` operation (version 1) reads the file the same way, merges the change, validates it, and writes the whole file with `StorePort.writeFileAtomic` as tab-indented JSON with a trailing newline. It logs `settings.file.update_completed` with `changedSettingNames`.

## Rules

- Defaults: `language` `en-GB`, `minimumLogLevel` `info`, `appliedSettingsMigrations` empty.
- A corrupt file is never overwritten: `updateSettings` refuses with `SETTINGS_FILE_UNREADABLE` and writes nothing.
- Unknown keys in the file are kept, so a file written by a newer version keeps its fields.
- A change may only name `language` or `minimumLogLevel`; any other key is refused with `CORE_INPUT_INVALID` before the store is read.
- Migrations are named, idempotent steps listed in `SETTINGS_MIGRATIONS`. Each runs once; its name is then recorded in `appliedSettingsMigrations`, and the result is saved by the next update. A step that throws leaves the settings unchanged and is logged as `settings.migration.run_failed`.
- A store read or write that throws gives `CORE_STORE_UNAVAILABLE`, which may be retried.

## Store file owned

`settings.json` in the local store folder `.task-orchestrator/`.

## Features touched

None yet. Each feature that adds a setting extends `UserSettingsSchema` and `SettingsChangeSchema`.
