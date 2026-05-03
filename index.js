import { readFile, writeFile } from "node:fs/promises";

const DATA_PATH = new URL("./data.json", import.meta.url);
const args = process.argv.slice(2);

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

if (args.includes("--check")) {
  const entries = await readEntries();
  console.log(`Activity log is valid. Entries: ${entries.length}`);
  process.exit(0);
}

const message = args.join(" ").trim() || "Worked on ABC";
const entries = await readEntries();

entries.push({
  date: new Date().toISOString(),
  message,
});

await writeEntries(entries);
console.log(`Logged activity: ${message}`);
