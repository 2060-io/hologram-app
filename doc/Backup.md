## Backup and Restore

Backups are currently output as .zip files that are either stored under Google Drive (as application configuration data) or iCloud (on its own container). They contain the following:

- `info.json`: Manifest file containing information about the backup itself. It is mostly used to let future versions of Hologram how to treat the backup based on this version (as file structure may differ)
- `afj.sqlite`: Credo's wallet in SQLite format (might also include sch and wal file, needed for later importing of the DB)
- `main.realm`: Realm's main database
- `media.zip`: in case user has chosen so, all media files (images, videos, voice notes, etc.) and their previews, compressed in zip format


### Manifest file

`info.json` has been introduced in Hologram 2.3.0. If not present, the backup must be considered to be following the first backup schema (`1`).

It is a JSON file that currently includes the following fields:

- schemaVersion: numeric field indicating the backup schema version. It starts with `1`. Every time something changes within the backup file structure and policy (e.g. options to select or ignore files in backup), it should be increased
- appVersion: string containing app version used to generate this backup (e.g. `2.3.0`)
