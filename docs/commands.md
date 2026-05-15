# Commands

ABC exposes a small set of CLI commands through `index.js` and npm scripts.

## Activity

- `npm run log -- "message"` records a current-time activity entry.
- `npm run log -- "message" --tag=work` records an entry with one or more tags.
- `npm run list` prints all entries.
- `npm run latest` prints the latest entry after any active filters.
- `npm run ids` prints matching entry IDs after any active filters.
- `npm run list-json` prints filtered entries as JSON.
- `npm run list -- --recent=5` prints the latest five entries.
- `npm run list -- --since=YYYY-MM-DD --until=YYYY-MM-DD` filters entries by date.
- `npm run list -- --month=YYYY-MM` filters entries to a single month.
- `npm run list -- --week` filters entries to the current week.
- Date ranges must use `YYYY-MM-DD`, and `--since` cannot be later than `--until`.
- `npm run list -- --tag=work` filters entries by tag.
- `npm run list -- --untagged` filters entries without tags.
- `npm run search -- --search=term` searches activity messages.
- Search also matches tags.
- `npm run days` groups entries by date.
- `npm run days-json` groups entries by date as JSON.
- `npm run tags` prints tag usage totals.
- `npm run tags-json` prints tag usage totals as JSON.
- `npm run today` prints the current date and today's entry count.

## Reports

- `npm run backup-json` writes `activity-backup.json`.
- `npm run count` prints the number of entries after any active filters.
- `npm run stats` prints activity totals.
- `npm run stats-json` prints filtered activity totals as JSON.
- `npm run stats -- --since=YYYY-MM-DD` prints totals for a date range.
- `npm run stats -- --tag=work` prints totals for a tag.
- `npm run dashboard` writes a local `dashboard.html` preview.
- `npm run export-csv` writes `activity-log.csv`.
- `npm run import-csv` merges entries from `activity-log.csv` into `data.json`.
- `npm run restore-json` merges entries from `activity-backup.json` into `data.json`.
- `npm run summary-json` writes `activity-summary.json`.
- `npm run summary-md` writes `activity-summary.md`.

## Grid

- `npm run generate-grid` creates local grid sample data.
- `npm run grid-check` validates local grid sample data.
- `npm run grid-stats` prints grid totals.
- `npm run grid-csv` writes `contribution-grid.csv`.
- `npm run grid-markdown` writes `grid-summary.md`.
