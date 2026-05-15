# ABC

ABC is a small Node.js activity logger for recording real work entries in this repository.

## Getting Started

Clone your repository:

```bash
git clone https://github.com/Karthisgowda/ABC.git
cd ABC
```

Install dependencies:

```bash
npm install
```

Add a work entry for today:

```bash
npm run log -- "Worked on project setup"
```

Add tags to an entry:

```bash
npm run log -- "Reviewed reports" --tag=review --tag=docs
```

View activity totals:

```bash
npm run stats
```

Count filtered entries:

```bash
npm run count -- --tag=review
```

Show only today's activity:

```bash
npm run today
```

List entries:

```bash
npm run list
```

Search entries:

```bash
npm run search -- --search=project
```

Search also checks tags, so `--search=review` finds entries tagged with `review`.

Filter activity commands by date:

```bash
npm run list -- --since=2026-01-01 --until=2026-01-31
npm run stats -- --since=2026-01-01
```

Filter by tag:

```bash
npm run list -- --tag=review
npm run dashboard -- --tag=docs
```

Show tag totals:

```bash
npm run tags
```

Export the log:

```bash
npm run export-csv
```

Import a previously exported log:

```bash
npm run import-csv
```

Back up and restore the activity log:

```bash
npm run backup-json
npm run restore-json
```

Export a summary file:

```bash
npm run summary-json
```

Generate a local dashboard:

```bash
npm run dashboard
```

The script appends the current timestamp and message to `data.json`. Commit and push your real project changes normally:

```bash
git add .
git commit -m "Update activity log"
git push origin main
```

Generate a local contribution-grid dataset with every box filled randomly from 2 to 4:

```bash
npm run generate-grid
```

You can adjust the values:

```bash
node index.js --generate-grid --min=2 --max=4 --weeks=53 --days=7
```

This writes `contribution-grid.json` for previews or planning. It does not create GitHub commits.

Review the generated grid totals:

```bash
npm run grid-stats
```

Export generated grid reports:

```bash
npm run grid-csv
npm run grid-markdown
```

Run checks:

```bash
npm test
```

## Documentation

- [Commands](docs/commands.md)
- [Grid Data](docs/grid.md)
- [Reports](docs/reports.md)
- [Testing](docs/testing.md)
- [Git Setup](docs/git-setup.md)

## Note

This project records real, current activity only. It does not create backdated commits or artificial contribution history.
