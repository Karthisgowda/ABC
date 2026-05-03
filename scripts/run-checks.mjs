import { execFileSync } from "node:child_process";

const node = process.execPath;

function run(args) {
  return execFileSync(node, ["index.js", ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const checks = [
  { args: ["--check"], expected: "Activity log is valid" },
  { args: ["--stats"], expected: "Entries:" },
  { args: ["--today"], expected: "Entries today:" },
  { args: ["--grid-stats"], expected: "Grid boxes:" },
  { args: ["--help"], expected: "ABC activity logger" },
];

for (const check of checks) {
  const output = run(check.args);

  if (!output.includes(check.expected)) {
    throw new Error(`Expected "${check.expected}" from ${check.args.join(" ")}`);
  }
}

console.log(`Passed ${checks.length} CLI checks`);
