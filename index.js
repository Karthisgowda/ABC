import { readFile, writeFile } from "node:fs/promises";

const DATA_PATH = new URL("./data.json", import.meta.url);
const GRID_PATH = new URL("./contribution-grid.json", import.meta.url);
const CSV_PATH = new URL("./activity-log.csv", import.meta.url);
const GRID_CSV_PATH = new URL("./contribution-grid.csv", import.meta.url);
const SUMMARY_PATH = new URL("./activity-summary.json", import.meta.url);
const args = process.argv.slice(2);
const commands = [
  'npm run log -- "message"        Add a current-time activity entry',
  "npm run generate-grid           Create a local random contribution grid",
  "node index.js --check           Validate the activity log",
  "node index.js --list            Print activity entries",
  "node index.js --list --recent=5 Print the latest activity entries",
  "node index.js --stats           Show activity totals",
  "node index.js --today           Show today activity count",
  "node index.js --summary-json    Export activity summary JSON",
  "node index.js --export-csv      Export activity entries to CSV",
  "node index.js --grid-csv        Export local grid boxes to CSV",
  "node index.js --grid-stats      Show local grid totals",
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

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createEntryId(date) {
  return date.replace(/[-:.TZ]/g, "").slice(0, 14);
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

if (args.includes("--generate-grid")) {
  const min = readNumberFlag("min", 2);
  const max = readNumberFlag("max", 4);
  const weeks = readNumberFlag("weeks", 53);
  const days = readNumberFlag("days", 7);

  if (min > max) {
    throw new Error("--min must be less than or equal to --max");
  }

  const grid = buildContributionGrid({ weeks, days, min, max });
  await writeFile(GRID_PATH, `${JSON.stringify(grid, null, 2)}\n`);
  console.log(`Generated ${grid.length} local grid boxes in contribution-grid.json`);
  process.exit(0);
}

if (args.includes("--help")) {
  printHelp();
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
  const entries = await readEntries();
  const visibleEntries = recent > 0 ? entries.slice(-recent) : entries;

  if (visibleEntries.length === 0) {
    console.log("No activity entries found.");
    process.exit(0);
  }

  for (const entry of visibleEntries) {
    console.log(`${entry.date}  ${entry.message}`);
  }

  process.exit(0);
}

if (args.includes("--stats")) {
  const entries = await readEntries();
  const days = new Set(entries.map((entry) => entry.date.slice(0, 10)));
  const latest = entries.at(-1)?.date ?? "none";

  console.log(`Entries: ${entries.length}`);
  console.log(`Active days: ${days.size}`);
  console.log(`Latest entry: ${latest}`);
  process.exit(0);
}

if (args.includes("--today")) {
  const today = new Date().toISOString().slice(0, 10);
  const entries = await readEntries();
  const todaysEntries = entries.filter((entry) => entry.date.startsWith(today));

  console.log(`Today: ${today}`);
  console.log(`Entries today: ${todaysEntries.length}`);
  process.exit(0);
}

if (args.includes("--summary-json")) {
  const entries = await readEntries();
  const days = new Set(entries.map((entry) => entry.date.slice(0, 10)));
  const summary = {
    entries: entries.length,
    activeDays: days.size,
    latestEntry: entries.at(-1)?.date ?? null,
    generatedAt: new Date().toISOString(),
  };

  await writeFile(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`);
  console.log("Exported activity-summary.json");
  process.exit(0);
}

if (args.includes("--export-csv")) {
  const entries = await readEntries();
  const rows = ["id,date,message"];

  for (const entry of entries) {
    const message = String(entry.message ?? "").replaceAll('"', '""');
    rows.push(`${entry.id ?? ""},${entry.date},"${message}"`);
  }

  await writeFile(CSV_PATH, `${rows.join("\n")}\n`);
  console.log(`Exported ${entries.length} entries to activity-log.csv`);
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

if (args.includes("--grid-csv")) {
  const grid = await readGrid();
  const rows = ["week,day,date,count"];

  for (const box of grid) {
    rows.push(`${box.week},${box.day},${box.date},${box.count}`);
  }

  await writeFile(GRID_CSV_PATH, `${rows.join("\n")}\n`);
  console.log(`Exported ${grid.length} grid boxes to contribution-grid.csv`);
  process.exit(0);
}

const message = args.join(" ").trim() || "Worked on ABC";
const entries = await readEntries();
const date = new Date().toISOString();

entries.push({
  id: createEntryId(date),
  date,
  message,
});

await writeEntries(entries);
console.log(`Logged activity: ${message}`);
