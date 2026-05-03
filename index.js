import { readFile, writeFile } from "node:fs/promises";

const DATA_PATH = new URL("./data.json", import.meta.url);
const GRID_PATH = new URL("./contribution-grid.json", import.meta.url);
const args = process.argv.slice(2);

function printHelp() {
  console.log(`ABC activity logger

Commands:
  npm run log -- "message"        Add a current-time activity entry
  npm run generate-grid           Create a local random contribution grid
  node index.js --check           Validate the activity log
  node index.js --help            Show this help
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
  console.log(`Activity log is valid. Entries: ${entries.length}`);
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
