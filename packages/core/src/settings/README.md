# Settings slice

Holds the user's settings and the only two ways to read or change them.

## Flows

- **Read**: the `settings` query (version 1) loads the saved settings through `SettingsPort.load`. Nothing saved gives the defaults with `loadStatus: 'defaulted'`. A saved value that is not an object, is an array, or has a field of the wrong type gives the defaults with `loadStatus: 'corrupt'`, and the event `settings.file.load_rejected` is logged. A valid value gives `loadStatus: 'valid'` after any pending migrations run in memory.
- **Update**: the `updateSettings` operation (version 1) loads the settings the same way, merges the change, validates it, and saves the whole value with `SettingsPort.save`. It logs `settings.file.update_completed` with `changedSettingNames`.

## Rules

- Defaults: `language` `en-GB`, `minimumLogLevel` `info`, `appliedSettingsMigrations` empty.
- Damaged settings are never overwritten: `updateSettings` refuses with `SETTINGS_FILE_UNREADABLE` and saves nothing.
- Unknown keys in the saved settings are kept, so settings saved by a newer version keep their fields.
- A change may only name `language` or `minimumLogLevel`; any other key is refused with `CORE_INPUT_INVALID` before the settings are loaded.
- Migrations are named, idempotent steps listed in `SETTINGS_MIGRATIONS`. Each runs once; its name is then recorded in `appliedSettingsMigrations`, and the result is saved by the next update. A step that throws leaves the settings unchanged and is logged as `settings.migration.run_failed`.
- A load that throws gives `SETTINGS_FILE_UNREADABLE`, which is not retryable, and is logged as `settings.file.read_failed`; an update then saves nothing.
- A save that throws gives `CORE_INTERNAL_ERROR`, which is not retryable, and is logged as `settings.file.write_failed`.

## File owned

The host application's settings file for the plugin, reached only through `SettingsPort`.

## Features touched

None yet. Each feature that adds a setting extends `UserSettingsSchema` and `SettingsChangeSchema`.
