# Commands

ABC exposes a small set of CLI commands through `index.js` and npm scripts.

## Activity

- `npm run log -- "message"` records a current-time activity entry.
- `npm run log -- "message" --tag=work` records an entry with one or more tags.
- `npm run list` prints all entries.
- `npm run list -- --since=YYYY-MM-DD --until=YYYY-MM-DD` filters entries by date.
- `npm run search -- --search=term` searches activity messages.
- Search also matches tags.
- `npm run days` groups entries by date.
- `npm run tags` prints tag usage totals.
- `npm run today` prints the current date and today's entry count.

## Reports

- `npm run backup-json` writes `activity-backup.json`.
- `npm run stats` prints activity totals.
- `npm run stats -- --since=YYYY-MM-DD` prints totals for a date range.
- `npm run dashboard` writes a local `dashboard.html` preview.
- `npm run export-csv` writes `activity-log.csv`.
- `npm run import-csv` merges entries from `activity-log.csv` into `data.json`.
- `npm run restore-json` merges entries from `activity-backup.json` into `data.json`.
- `npm run summary-json` writes `activity-summary.json`.

## Grid

- `npm run generate-grid` creates local grid sample data.
- `npm run grid-stats` prints grid totals.
- `npm run grid-csv` writes `contribution-grid.csv`.
- `npm run grid-markdown` writes `grid-summary.md`.
