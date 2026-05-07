# Commands

ABC exposes a small set of CLI commands through `index.js` and npm scripts.

## Activity

- `npm run log -- "message"` records a current-time activity entry.
- `npm run list` prints all entries.
- `npm run days` groups entries by date.
- `npm run today` prints the current date and today's entry count.

## Reports

- `npm run stats` prints activity totals.
- `npm run dashboard` writes a local `dashboard.html` preview.
- `npm run export-csv` writes `activity-log.csv`.
- `npm run summary-json` writes `activity-summary.json`.

## Grid

- `npm run generate-grid` creates local grid sample data.
- `npm run grid-stats` prints grid totals.
- `npm run grid-csv` writes `contribution-grid.csv`.
- `npm run grid-markdown` writes `grid-summary.md`.
