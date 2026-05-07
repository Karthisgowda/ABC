import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, unlinkSync } from "node:fs";

const node = process.execPath;
const dataPath = "data.json";
const csvPath = "activity-log.csv";
const dataBackupPath = "data.json.test-backup";
const csvBackupPath = "activity-log.csv.test-backup";

function run(args) {
  return execFileSync(node, ["index.js", ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const checks = [
  { args: ["--check"], expected: "Activity log is valid" },
  { args: ["--stats"], expected: "Entries:" },
  { args: ["--days"], expected: "No activity days found." },
  { args: ["--today"], expected: "Entries today:" },
  { args: ["--dashboard"], expected: "Exported dashboard.html" },
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
    unlinkSync(backupPath);
  } else if (existsSync(path)) {
    unlinkSync(path);
  }
}

backup(dataPath, dataBackupPath);
backup(csvPath, csvBackupPath);

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

  console.log(`Passed ${checks.length + 2} CLI checks`);
} finally {
  restore(dataPath, dataBackupPath);
  restore(csvPath, csvBackupPath);
}
