# Reports

Generated reports are ignored by git so the repository stays clean after local
exports.

## Activity Reports

- `activity-backup.json` contains a restorable copy of all activity entries.
- `activity-log.csv` contains one row per activity entry.
- `activity-summary.json` contains total entries, active days, and latest entry.
- `activity-summary.md` contains a short Markdown summary for notes or reviews.
- `dashboard.html` contains a local browser dashboard for activity and grid data.
- Dashboard recent entries include tags when an entry has them.

Use `npm run import-csv` to merge entries from `activity-log.csv` back into
`data.json`. Rows are matched by `id`, so repeated imports update existing
entries instead of creating duplicates.

Use `npm run backup-json` before making local edits, and `npm run restore-json`
to merge that backup back into the current log.

CSV export stores tags in the `tags` column separated by semicolons, and CSV
import restores those tags when the column is present.

Most activity reports accept `--since=YYYY-MM-DD` and `--until=YYYY-MM-DD` to
limit output to a date range before exporting or summarizing data.

Activity reports also accept repeated `--tag=...` filters. When multiple tags
are provided, entries must include all requested tags.

## Grid Reports

- `contribution-grid.csv` contains one row per grid box.
- `grid-summary.md` contains a short Markdown summary of the grid totals.

Run all report exports manually when you need fresh local output.
Use `npm run grid-check` before sharing grid reports to confirm every local box
has a week, day, date, and count.
