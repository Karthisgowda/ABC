# Reports

Generated reports are ignored by git so the repository stays clean after local
exports.

## Activity Reports

- `activity-backup.json` contains a restorable copy of all activity entries.
- `activity-log.csv` contains one row per activity entry.
- `activity-summary.json` contains total entries, active days, and latest entry.
- `dashboard.html` contains a local browser dashboard for activity and grid data.

Use `npm run import-csv` to merge entries from `activity-log.csv` back into
`data.json`. Rows are matched by `id`, so repeated imports update existing
entries instead of creating duplicates.

Use `npm run backup-json` before making local edits, and `npm run restore-json`
to merge that backup back into the current log.

## Grid Reports

- `contribution-grid.csv` contains one row per grid box.
- `grid-summary.md` contains a short Markdown summary of the grid totals.

Run all report exports manually when you need fresh local output.
