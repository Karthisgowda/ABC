import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, unlinkSync, writeFileSync } from "node:fs";

const node = process.execPath;
const dataPath = "data.json";
const csvPath = "activity-log.csv";
const backupJsonPath = "activity-backup.json";
const dataBackupPath = "data.json.test-backup";
const csvBackupPath = "activity-log.csv.test-backup";
const backupJsonBackupPath = "activity-backup.json.test-backup";

function run(args) {
  return execFileSync(node, ["index.js", ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const checks = [
  { args: ["--check"], expected: "Activity log is valid" },
  { args: ["--count"], expected: "Entries:" },
  { args: ["--stats"], expected: "Entries:" },
  { args: ["--days"], expected: "No activity days found." },
  { args: ["--today"], expected: "Entries today:" },
  { args: ["--dashboard"], expected: "Exported dashboard.html" },
  { args: ["--grid-check"], expected: "Grid is valid" },
  { args: ["--grid-stats"], expected: "Grid boxes:" },
  { args: ["--version"], expected: "1.0.0" },
  { args: ["--help"], expected: "ABC activity logger" },
];

function backup(path, backupPath) {
  if (existsSync(path)) {
    copyFileSync(path, backupPath);
  }
}

function restore(path, backupPath) {
  if (existsSync(backupPath)) {
    copyFileSync(backupPath, path);
    try {
      unlinkSync(backupPath);
    } catch {
      // Windows may briefly keep copied files locked; backup files are ignored.
    }
  } else if (existsSync(path)) {
    try {
      unlinkSync(path);
    } catch {
      // Windows may briefly keep generated files locked; generated files are ignored.
    }
  }
}

backup(dataPath, dataBackupPath);
backup(csvPath, csvBackupPath);
backup(backupJsonPath, backupJsonBackupPath);

try {
  for (const check of checks) {
    const output = run(check.args);

    if (!output.includes(check.expected)) {
      throw new Error(`Expected "${check.expected}" from ${check.args.join(" ")}`);
    }
  }

  const exportOutput = run(["--export-csv"]);
  if (!exportOutput.includes("Exported")) {
    throw new Error("Expected CSV export to complete");
  }

  const importOutput = run(["--import-csv"]);
  if (!importOutput.includes("Imported")) {
    throw new Error("Expected CSV import to complete");
  }

  const backupOutput = run(["--backup-json"]);
  if (!backupOutput.includes("Backed up")) {
    throw new Error("Expected JSON backup to complete");
  }

  const restoreOutput = run(["--restore-json"]);
  if (!restoreOutput.includes("Restored")) {
    throw new Error("Expected JSON restore to complete");
  }

  writeFileSync(
    dataPath,
    JSON.stringify(
      [
        {
          id: "search-test",
          date: "2026-01-01T00:00:00.000Z",
          message: "Searchable activity entry",
          tags: ["review", "docs"],
        },
        {
          id: "older-test",
          date: "2025-12-25T00:00:00.000Z",
          message: "Older activity entry",
          tags: ["archive"],
        },
      ],
      null,
      2,
    ),
  );

  const searchOutput = run(["--search=searchable"]);
  if (!searchOutput.includes("Searchable activity entry")) {
    throw new Error("Expected activity search to find the fixture entry");
  }

  const tagSearchOutput = run(["--search=review"]);
  if (!tagSearchOutput.includes("#review")) {
    throw new Error("Expected activity search to match tags");
  }

  const statsOutput = run(["--stats"]);
  if (!statsOutput.includes("Tags: 3")) {
    throw new Error("Expected stats to count unique tags");
  }

  const daysJsonOutput = run(["--days-json", "--since=2026-01-01"]);
  const daysJson = JSON.parse(daysJsonOutput);
  if (daysJson.length !== 1 || daysJson[0].date !== "2026-01-01") {
    throw new Error("Expected JSON day totals to honor date filters");
  }

  const statsJsonOutput = run(["--stats-json", "--tag=review"]);
  const statsJson = JSON.parse(statsJsonOutput);
  if (statsJson.entries !== 1 || statsJson.tags !== 2) {
    throw new Error("Expected JSON stats to honor tag filters");
  }

  const tagsOutput = run(["--tags"]);
  if (!tagsOutput.includes("#review: 1") || !tagsOutput.includes("#docs: 1")) {
    throw new Error("Expected tag totals to include fixture tags");
  }

  const tagsJsonOutput = run(["--tags-json"]);
  const tagsJson = JSON.parse(tagsJsonOutput);
  if (!tagsJson.some((item) => item.tag === "review" && item.count === 1)) {
    throw new Error("Expected JSON tag totals to include fixture tags");
  }

  const logOutput = run(["Tagged test entry", "--tag=work", "--tag=review"]);
  if (!logOutput.includes("Logged activity")) {
    throw new Error("Expected tagged log command to complete");
  }

  const listOutput = run(["--list", "--recent=1"]);
  if (!listOutput.includes("#work") || !listOutput.includes("#review")) {
    throw new Error("Expected recent list to include tags");
  }

  const latestOutput = run(["--latest"]);
  if (!latestOutput.includes("Tagged test entry") || !latestOutput.includes("#work")) {
    throw new Error("Expected latest command to show the newest tagged entry");
  }

  const listJsonOutput = run(["--list-json", "--tag=work"]);
  const listJsonEntries = JSON.parse(listJsonOutput);
  if (listJsonEntries.length !== 1 || listJsonEntries[0].message !== "Tagged test entry") {
    throw new Error("Expected JSON list to include the tagged fixture entry");
  }

  const sinceOutput = run(["--list", "--since=2026-01-01"]);
  if (!sinceOutput.includes("Searchable activity entry") || sinceOutput.includes("Older activity entry")) {
    throw new Error("Expected --since to filter older entries");
  }

  const monthOutput = run(["--list", "--month=2025-12"]);
  if (!monthOutput.includes("Older activity entry") || monthOutput.includes("Searchable activity entry")) {
    throw new Error("Expected --month to filter entries by month");
  }

  const untilOutput = run(["--search=older", "--until=2025-12-31"]);
  if (!untilOutput.includes("Older activity entry")) {
    throw new Error("Expected --until to include matching older entries");
  }

  const rangedStatsOutput = run(["--stats", "--since=2026-01-01"]);
  if (!rangedStatsOutput.includes("Entries: 2")) {
    throw new Error("Expected date-filtered stats to count filtered entries");
  }

  try {
    run(["--list", "--since=2026-02-01", "--until=2026-01-01"]);
    throw new Error("Expected reversed date range to fail");
  } catch (error) {
    if (!String(error.stderr).includes("--since must be earlier than or equal to --until")) {
      throw error;
    }
  }

  const tagFilteredListOutput = run(["--list", "--tag=archive"]);
  if (!tagFilteredListOutput.includes("Older activity entry") || tagFilteredListOutput.includes("Searchable activity entry")) {
    throw new Error("Expected tag-filtered list to include only archive entries");
  }

  const tagFilteredStatsOutput = run(["--stats", "--tag=review"]);
  if (!tagFilteredStatsOutput.includes("Entries: 2")) {
    throw new Error("Expected tag-filtered stats to count review entries");
  }

  try {
    run(["--list", "--recent=0"]);
    throw new Error("Expected invalid recent limit to fail");
  } catch (error) {
    if (!String(error.stderr).includes("--recent must be a positive integer")) {
      throw error;
    }
  }

  console.log(`Passed ${checks.length + 23} CLI checks`);
} finally {
  restore(dataPath, dataBackupPath);
  restore(csvPath, csvBackupPath);
  restore(backupJsonPath, backupJsonBackupPath);
}
