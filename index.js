import { readFile, writeFile } from "node:fs/promises";

const DATA_PATH = new URL("./data.json", import.meta.url);
const GRID_PATH = new URL("./contribution-grid.json", import.meta.url);
const CSV_PATH = new URL("./activity-log.csv", import.meta.url);
const GRID_CSV_PATH = new URL("./contribution-grid.csv", import.meta.url);
const GRID_MARKDOWN_PATH = new URL("./grid-summary.md", import.meta.url);
const DASHBOARD_PATH = new URL("./dashboard.html", import.meta.url);
const SUMMARY_PATH = new URL("./activity-summary.json", import.meta.url);
const BACKUP_PATH = new URL("./activity-backup.json", import.meta.url);
const args = process.argv.slice(2);
const APP_VERSION = "1.0.0";
const MAX_MESSAGE_LENGTH = 160;
const DEFAULT_GRID_WEEKS = 53;
const DEFAULT_GRID_DAYS = 7;
const DEFAULT_GRID_MIN = 2;
const DEFAULT_GRID_MAX = 4;
const commands = [
  'npm run log -- "message"        Add a current-time activity entry',
  'npm run log -- "message" --tag=work Add a tagged activity entry',
  "npm run generate-grid           Create a local random contribution grid",
  "node index.js --check           Validate the activity log",
  "node index.js --list            Print activity entries",
  "node index.js --list-json       Print filtered entries as JSON",
  "node index.js --list --recent=5 Print the latest activity entries",
  "node index.js --list --since=YYYY-MM-DD Print entries from a date",
  "node index.js --list --month=YYYY-MM Print entries from a month",
  "node index.js --search=term     Search activity messages",
  "node index.js --list --tag=work Filter entries by tag",
  "node index.js --list --untagged Show entries without tags",
  "node index.js --days            Show entries grouped by day",
  "node index.js --days-json       Print day totals as JSON",
  "node index.js --tags            Show tag totals",
  "node index.js --tags-json       Print tag totals as JSON",
  "node index.js --stats           Show activity totals",
  "node index.js --stats-json      Print activity totals as JSON",
  "node index.js --count           Show filtered activity count",
  "node index.js --latest          Show the latest filtered entry",
  "node index.js --ids             Show filtered entry IDs",
  "node index.js --today           Show today activity count",
  "node index.js --summary-json    Export activity summary JSON",
  "node index.js --dashboard       Export a local HTML dashboard",
  "node index.js --export-csv      Export activity entries to CSV",
  "node index.js --import-csv      Import entries from activity-log.csv",
  "node index.js --backup-json     Export entries to activity-backup.json",
  "node index.js --restore-json    Restore entries from activity-backup.json",
  "node index.js --grid-csv        Export local grid boxes to CSV",
  "node index.js --grid-markdown   Export local grid summary markdown",
  "node index.js --grid-stats      Show local grid totals",
  "node index.js --grid-check      Validate local grid data",
  "node index.js --version         Show the CLI version",
  "node index.js --help            Show this help",
];

function printHelp() {
  console.log(`ABC activity logger

Commands:
  ${commands.join("\n  ")}
`);
}

async function readEntries() {
  try {
    const content = await readFile(DATA_PATH, "utf8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeEntries(entries) {
  await writeFile(DATA_PATH, `${JSON.stringify(entries, null, 2)}\n`);
}

async function readGrid() {
  try {
    const content = await readFile(GRID_PATH, "utf8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

function readNumberFlag(name, defaultValue) {
  const prefix = `--${name}=`;
  const value = args.find((arg) => arg.startsWith(prefix));

  if (!value) {
    return defaultValue;
  }

  const parsed = Number(value.slice(prefix.length));
  return Number.isInteger(parsed) ? parsed : defaultValue;
}

function hasValueFlag(name) {
  const prefix = `--${name}=`;
  return args.some((arg) => arg.startsWith(prefix));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function requirePositiveInteger(name, value) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`--${name} must be a positive integer`);
  }
}

function createEntryId(date) {
  return date.replace(/[-:.TZ]/g, "").slice(0, 14);
}

function normalizeMessage(message) {
  return message.replace(/\s+/g, " ").trim();
}

function normalizeTags(tags) {
  return [...new Set(tags.map((tag) => normalizeMessage(tag).toLowerCase()).filter(Boolean))];
}

function escapeCsv(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseActivityCsv(content) {
  const [headerLine, ...lines] = content.trim().split(/\r?\n/);
  const headers = parseCsvLine(headerLine ?? "");
  const idIndex = headers.indexOf("id");
  const dateIndex = headers.indexOf("date");
  const messageIndex = headers.indexOf("message");
  const tagsIndex = headers.indexOf("tags");

  if (idIndex === -1 || dateIndex === -1 || messageIndex === -1) {
    throw new Error("CSV must include id, date, and message columns");
  }

  return lines
    .filter((line) => line.trim())
    .map((line) => {
      const values = parseCsvLine(line);
      const date = normalizeMessage(values[dateIndex] ?? "");
      const message = normalizeMessage(values[messageIndex] ?? "");
      const id = normalizeMessage(values[idIndex] ?? "") || createEntryId(date);
      const tags = tagsIndex === -1 ? [] : normalizeTags((values[tagsIndex] ?? "").split(";"));

      if (!date || !message) {
        throw new Error("CSV rows must include date and message values");
      }

      return { id, date, message, tags };
    });
}

function validateActivityEntries(entries) {
  if (!Array.isArray(entries)) {
    throw new Error("Activity data must be an array");
  }

  return entries.map((entry) => {
    const date = normalizeMessage(entry?.date ?? "");
    const message = normalizeMessage(entry?.message ?? "");
    const id = normalizeMessage(entry?.id ?? "") || createEntryId(date);
    const tags = Array.isArray(entry?.tags) ? normalizeTags(entry.tags) : [];

    if (!date || !message) {
      throw new Error("Activity entries must include date and message values");
    }

    return { id, date, message, tags };
  });
}

function mergeEntries(currentEntries, incomingEntries) {
  const entriesById = new Map(currentEntries.map((entry) => [entry.id, entry]));

  for (const entry of incomingEntries) {
    entriesById.set(entry.id, entry);
  }

  return [...entriesById.values()];
}

function toDateKey(date) {
  return date.slice(0, 10);
}

function isDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isMonthKey(value) {
  return /^\d{4}-\d{2}$/.test(value);
}

function filterEntriesByDateRange(entries) {
  const since = readTextFlag("since");
  const until = readTextFlag("until");
  const month = readTextFlag("month");

  if (month && !isMonthKey(month)) {
    throw new Error("--month must use YYYY-MM format");
  }

  if (since && !isDateKey(since)) {
    throw new Error("--since must use YYYY-MM-DD format");
  }

  if (until && !isDateKey(until)) {
    throw new Error("--until must use YYYY-MM-DD format");
  }

  if (since && until && since > until) {
    throw new Error("--since must be earlier than or equal to --until");
  }

  return entries.filter((entry) => {
    const day = toDateKey(entry.date);
    return (!month || day.startsWith(month)) && (!since || day >= since) && (!until || day <= until);
  });
}

function filterEntriesByTags(entries) {
  const filterTags = normalizeTags(readTextFlags("tag"));
  const onlyUntagged = args.includes("--untagged");

  if (filterTags.length === 0 && !onlyUntagged) {
    return entries;
  }

  return entries.filter((entry) => {
    const entryTags = new Set(entry.tags ?? []);
    return (!onlyUntagged || entryTags.size === 0) && filterTags.every((tag) => entryTags.has(tag));
  });
}

function filterEntries(entries) {
  return filterEntriesByTags(filterEntriesByDateRange(entries));
}

function countTags(entries) {
  const totals = new Map();

  for (const entry of entries) {
    for (const tag of entry.tags ?? []) {
      totals.set(tag, (totals.get(tag) ?? 0) + 1);
    }
  }

  return [...totals.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
}

function readTextFlag(name) {
  const prefix = `--${name}=`;
  const value = args.find((arg) => arg.startsWith(prefix));
  return value ? normalizeMessage(value.slice(prefix.length)) : "";
}

function readTextFlags(name) {
  const prefix = `--${name}=`;
  return args.filter((arg) => arg.startsWith(prefix)).map((arg) => normalizeMessage(arg.slice(prefix.length)));
}

function buildContributionGrid({ weeks, days, min, max }) {
  const today = new Date();
  const grid = [];

  for (let week = 0; week < weeks; week += 1) {
    for (let day = 0; day < days; day += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - ((weeks - week - 1) * days + (days - day - 1)));

      grid.push({
        week,
        day,
        date: date.toISOString().slice(0, 10),
        count: randomInt(min, max),
      });
    }
  }

  return grid;
}

function renderDashboardHtml(entries, grid) {
  const total = grid.reduce((sum, box) => sum + Number(box.count ?? 0), 0);
  const activeDays = new Set(entries.map((entry) => toDateKey(entry.date))).size;
  const latest = entries.at(-1)?.date ?? "none";
  const cells = grid
    .map((box) => {
      const count = Number(box.count ?? 0);
      const level = Math.max(0, Math.min(4, count));
      return `<span class="cell level-${level}" title="${box.date}: ${count}"></span>`;
    })
    .join("");
  const recentRows = entries
    .slice(-10)
    .reverse()
    .map((entry) => {
      const tags = entry.tags?.length ? `<small>${entry.tags.map((tag) => `#${tag}`).join(" ")}</small>` : "";
      return `<li><time>${entry.date}</time><span>${entry.message}${tags}</span></li>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ABC Activity Dashboard</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #111827; color: #e5e7eb; }
    main { max-width: 980px; margin: 0 auto; padding: 32px 20px; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    .muted { color: #9ca3af; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin: 24px 0; }
    .stat { border: 1px solid #374151; border-radius: 8px; padding: 16px; background: #1f2937; }
    .stat strong { display: block; font-size: 28px; margin-bottom: 4px; }
    .grid { display: grid; grid-template-rows: repeat(7, 13px); grid-auto-flow: column; grid-auto-columns: 13px; gap: 4px; overflow-x: auto; padding: 16px; border: 1px solid #374151; border-radius: 8px; background: #1f2937; }
    .cell { width: 13px; height: 13px; border-radius: 3px; background: #263241; }
    .level-1 { background: #0e4429; }
    .level-2 { background: #006d32; }
    .level-3 { background: #26a641; }
    .level-4 { background: #39d353; }
    ul { padding: 0; list-style: none; }
    li { display: grid; grid-template-columns: 190px 1fr; gap: 12px; padding: 10px 0; border-bottom: 1px solid #273244; }
    time { color: #9ca3af; }
    small { display: block; margin-top: 4px; color: #34d399; }
  </style>
</head>
<body>
  <main>
    <h1>ABC Activity Dashboard</h1>
    <p class="muted">Generated from local activity and grid data.</p>
    <section class="stats">
      <div class="stat"><strong>${entries.length}</strong><span>Entries</span></div>
      <div class="stat"><strong>${activeDays}</strong><span>Active days</span></div>
      <div class="stat"><strong>${grid.length}</strong><span>Grid boxes</span></div>
      <div class="stat"><strong>${total}</strong><span>Grid total</span></div>
    </section>
    <p class="muted">Latest entry: ${latest}</p>
    <section class="grid" aria-label="Contribution grid preview">${cells}</section>
    <h2>Recent Entries</h2>
    <ul>${recentRows || "<li><span>No entries yet.</span></li>"}</ul>
  </main>
</body>
</html>
`;
}

if (args.includes("--generate-grid")) {
  const min = readNumberFlag("min", DEFAULT_GRID_MIN);
  const max = readNumberFlag("max", DEFAULT_GRID_MAX);
  const weeks = readNumberFlag("weeks", DEFAULT_GRID_WEEKS);
  const days = readNumberFlag("days", DEFAULT_GRID_DAYS);

  if (min > max) {
    throw new Error("--min must be less than or equal to --max");
  }

  requirePositiveInteger("weeks", weeks);
  requirePositiveInteger("days", days);

  const grid = buildContributionGrid({ weeks, days, min, max });
  await writeFile(GRID_PATH, `${JSON.stringify(grid, null, 2)}\n`);
  console.log(`Generated ${grid.length} local grid boxes in contribution-grid.json`);
  process.exit(0);
}

if (args.includes("--help")) {
  printHelp();
  process.exit(0);
}

if (args.includes("--version")) {
  console.log(APP_VERSION);
  process.exit(0);
}

if (args.includes("--check")) {
  const entries = await readEntries();
  const invalidEntries = entries.filter((entry) => !entry.date || !entry.message);

  if (invalidEntries.length > 0) {
    throw new Error(`Activity log has ${invalidEntries.length} invalid entries`);
  }

  console.log(`Activity log is valid. Entries: ${entries.length}`);
  process.exit(0);
}

if (args.includes("--list")) {
  const recent = readNumberFlag("recent", 0);

  if (hasValueFlag("recent")) {
    requirePositiveInteger("recent", recent);
  }

  const entries = filterEntries(await readEntries());
  const visibleEntries = recent > 0 ? entries.slice(-recent) : entries;

  if (visibleEntries.length === 0) {
    console.log("No activity entries found.");
    process.exit(0);
  }

  for (const entry of visibleEntries) {
    const tags = entry.tags?.length ? ` [${entry.tags.map((tag) => `#${tag}`).join(" ")}]` : "";
    console.log(`${entry.date}  ${entry.message}${tags}`);
  }

  process.exit(0);
}

if (args.includes("--list-json")) {
  const recent = readNumberFlag("recent", 0);

  if (hasValueFlag("recent")) {
    requirePositiveInteger("recent", recent);
  }

  const entries = filterEntries(await readEntries());
  const visibleEntries = recent > 0 ? entries.slice(-recent) : entries;
  console.log(JSON.stringify(visibleEntries, null, 2));
  process.exit(0);
}

const searchTerm = readTextFlag("search");

if (searchTerm) {
  const entries = filterEntries(await readEntries());
  const matches = entries.filter((entry) => {
    const haystack = [entry.message, ...(entry.tags ?? [])].join(" ").toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

  if (matches.length === 0) {
    console.log(`No activity entries matched "${searchTerm}".`);
    process.exit(0);
  }

  for (const entry of matches) {
    const tags = entry.tags?.length ? ` [${entry.tags.map((tag) => `#${tag}`).join(" ")}]` : "";
    console.log(`${entry.date}  ${entry.message}${tags}`);
  }

  process.exit(0);
}

if (args.includes("--days")) {
  const entries = filterEntries(await readEntries());
  const totals = new Map();

  for (const entry of entries) {
    const day = toDateKey(entry.date);
    totals.set(day, (totals.get(day) ?? 0) + 1);
  }

  for (const [day, count] of totals) {
    console.log(`${day}: ${count}`);
  }

  if (totals.size === 0) {
    console.log("No activity days found.");
  }

  process.exit(0);
}

if (args.includes("--days-json")) {
  const entries = filterEntries(await readEntries());
  const totals = new Map();

  for (const entry of entries) {
    const day = toDateKey(entry.date);
    totals.set(day, (totals.get(day) ?? 0) + 1);
  }

  const days = [...totals.entries()].map(([date, count]) => ({ date, count }));
  console.log(JSON.stringify(days, null, 2));
  process.exit(0);
}

if (args.includes("--tags")) {
  const tagTotals = countTags(filterEntries(await readEntries()));

  if (tagTotals.length === 0) {
    console.log("No tags found.");
    process.exit(0);
  }

  for (const [tag, count] of tagTotals) {
    console.log(`#${tag}: ${count}`);
  }

  process.exit(0);
}

if (args.includes("--tags-json")) {
  const tagTotals = countTags(filterEntries(await readEntries()));
  const tags = tagTotals.map(([tag, count]) => ({ tag, count }));
  console.log(JSON.stringify(tags, null, 2));
  process.exit(0);
}

if (args.includes("--stats")) {
  const entries = filterEntries(await readEntries());
  const days = new Set(entries.map((entry) => toDateKey(entry.date)));
  const messages = entries.filter((entry) => entry.message).length;
  const tags = new Set(entries.flatMap((entry) => entry.tags ?? []));
  const latest = entries.at(-1)?.date ?? "none";

  console.log(`Entries: ${entries.length}`);
  console.log(`Active days: ${days.size}`);
  console.log(`Messages: ${messages}`);
  console.log(`Tags: ${tags.size}`);
  console.log(`Latest entry: ${latest}`);
  process.exit(0);
}

if (args.includes("--stats-json")) {
  const entries = filterEntries(await readEntries());
  const days = new Set(entries.map((entry) => toDateKey(entry.date)));
  const messages = entries.filter((entry) => entry.message).length;
  const tags = new Set(entries.flatMap((entry) => entry.tags ?? []));

  console.log(
    JSON.stringify(
      {
        entries: entries.length,
        activeDays: days.size,
        messages,
        tags: tags.size,
        latestEntry: entries.at(-1)?.date ?? null,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

if (args.includes("--count")) {
  const entries = filterEntries(await readEntries());
  console.log(`Entries: ${entries.length}`);
  process.exit(0);
}

if (args.includes("--latest")) {
  const latest = filterEntries(await readEntries()).at(-1);

  if (!latest) {
    console.log("No activity entries found.");
    process.exit(0);
  }

  const tags = latest.tags?.length ? ` [${latest.tags.map((tag) => `#${tag}`).join(" ")}]` : "";
  console.log(`${latest.date}  ${latest.message}${tags}`);
  process.exit(0);
}

if (args.includes("--ids")) {
  const entries = filterEntries(await readEntries());

  if (entries.length === 0) {
    console.log("No activity entries found.");
    process.exit(0);
  }

  for (const entry of entries) {
    console.log(entry.id);
  }

  process.exit(0);
}

if (args.includes("--today")) {
  const today = toDateKey(new Date().toISOString());
  const entries = await readEntries();
  const todaysEntries = entries.filter((entry) => entry.date.startsWith(today));

  console.log(`Today: ${today}`);
  console.log(`Entries today: ${todaysEntries.length}`);
  process.exit(0);
}

if (args.includes("--summary-json")) {
  const entries = filterEntries(await readEntries());
  const days = new Set(entries.map((entry) => toDateKey(entry.date)));
  const summary = {
    entries: entries.length,
    activeDays: days.size,
    tags: [...new Set(entries.flatMap((entry) => entry.tags ?? []))],
    latestEntry: entries.at(-1)?.date ?? null,
    generatedAt: new Date().toISOString(),
  };

  await writeFile(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`);
  console.log("Exported activity-summary.json");
  process.exit(0);
}

if (args.includes("--dashboard")) {
  const entries = filterEntries(await readEntries());
  const grid = await readGrid();
  await writeFile(DASHBOARD_PATH, renderDashboardHtml(entries, grid));
  console.log("Exported dashboard.html");
  process.exit(0);
}

if (args.includes("--export-csv")) {
  const entries = filterEntries(await readEntries());
  const rows = ["id,date,message,tags"];

  for (const entry of entries) {
    rows.push([entry.id ?? "", entry.date, entry.message, (entry.tags ?? []).join(";")].map(escapeCsv).join(","));
  }

  await writeFile(CSV_PATH, `${rows.join("\n")}\n`);
  console.log(`Exported ${entries.length} entries to activity-log.csv`);
  process.exit(0);
}

if (args.includes("--import-csv")) {
  const content = await readFile(CSV_PATH, "utf8");
  const importedEntries = parseActivityCsv(content);
  await writeEntries(mergeEntries(await readEntries(), importedEntries));
  console.log(`Imported ${importedEntries.length} entries from activity-log.csv`);
  process.exit(0);
}

if (args.includes("--backup-json")) {
  const entries = await readEntries();
  await writeFile(BACKUP_PATH, `${JSON.stringify(entries, null, 2)}\n`);
  console.log(`Backed up ${entries.length} entries to activity-backup.json`);
  process.exit(0);
}

if (args.includes("--restore-json")) {
  const content = await readFile(BACKUP_PATH, "utf8");
  const restoredEntries = validateActivityEntries(JSON.parse(content));
  await writeEntries(mergeEntries(await readEntries(), restoredEntries));
  console.log(`Restored ${restoredEntries.length} entries from activity-backup.json`);
  process.exit(0);
}

if (args.includes("--grid-stats")) {
  const grid = await readGrid();
  const total = grid.reduce((sum, box) => sum + Number(box.count ?? 0), 0);
  const average = grid.length === 0 ? 0 : total / grid.length;

  console.log(`Grid boxes: ${grid.length}`);
  console.log(`Grid total: ${total}`);
  console.log(`Grid average: ${average.toFixed(2)}`);
  process.exit(0);
}

if (args.includes("--grid-check")) {
  const grid = await readGrid();
  const invalidBoxes = grid.filter((box) => {
    return (
      !Number.isInteger(box.week) ||
      !Number.isInteger(box.day) ||
      !isDateKey(String(box.date ?? "")) ||
      !Number.isInteger(Number(box.count))
    );
  });

  if (invalidBoxes.length > 0) {
    throw new Error(`Grid has ${invalidBoxes.length} invalid boxes`);
  }

  console.log(`Grid is valid. Boxes: ${grid.length}`);
  process.exit(0);
}

if (args.includes("--grid-csv")) {
  const grid = await readGrid();
  const rows = ["week,day,date,count"];

  for (const box of grid) {
    rows.push([box.week, box.day, box.date, box.count].map(escapeCsv).join(","));
  }

  await writeFile(GRID_CSV_PATH, `${rows.join("\n")}\n`);
  console.log(`Exported ${grid.length} grid boxes to contribution-grid.csv`);
  process.exit(0);
}

if (args.includes("--grid-markdown")) {
  const grid = await readGrid();
  const total = grid.reduce((sum, box) => sum + Number(box.count ?? 0), 0);
  const average = grid.length === 0 ? 0 : total / grid.length;
  const markdown = `# Grid Summary

- Boxes: ${grid.length}
- Total count: ${total}
- Average count: ${average.toFixed(2)}
- Generated: ${new Date().toISOString()}
`;

  await writeFile(GRID_MARKDOWN_PATH, markdown);
  console.log("Exported grid-summary.md");
  process.exit(0);
}

const message = normalizeMessage(args.filter((arg) => !arg.startsWith("--")).join(" ")) || "Worked on ABC";

if (message.length > MAX_MESSAGE_LENGTH) {
  throw new Error(`Activity message must be ${MAX_MESSAGE_LENGTH} characters or fewer`);
}

const entries = await readEntries();
const date = new Date().toISOString();
const tags = normalizeTags(readTextFlags("tag"));

entries.push({
  id: createEntryId(date),
  date,
  message,
  tags,
});

await writeEntries(entries);
console.log(`Logged activity: ${message}`);
