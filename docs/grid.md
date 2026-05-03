# Grid Data

The generated contribution grid is local project data. It is useful for previews,
planning, and dashboards.

Each box includes:

- `week`: zero-based week index.
- `day`: zero-based day index inside the week.
- `date`: ISO date string.
- `count`: generated count for that box.

Generate a fresh grid:

```bash
npm run generate-grid
```

Adjust the range:

```bash
node index.js --generate-grid --min=1 --max=5 --weeks=53 --days=7
```
