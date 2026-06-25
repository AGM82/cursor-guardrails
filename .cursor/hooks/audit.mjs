#!/usr/bin/env node
// Fire-and-forget audit logger. Appends a timestamped, truncated record of
// agent activity to a local, git-ignored log for POPIA traceability.
// Never blocks: on any failure it still returns a valid empty response.
import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", () => resolve(data));
  });
}

const MAX_CHARS = 4000; // keep entries bounded; avoid dumping huge outputs

const input = await readStdin();
const projectDir = process.env.CURSOR_PROJECT_DIR ?? process.cwd();
const logPath = join(projectDir, ".cursor", "hooks", "logs", "agent-audit.log");

try {
  await mkdir(dirname(logPath), { recursive: true });
  const payload = input.trim().slice(0, MAX_CHARS);
  await appendFile(logPath, `[${new Date().toISOString()}] ${payload}\n`, "utf8");
} catch {
  // Auditing is best-effort; never interrupt the agent if logging fails.
}

process.stdout.write("{}");
process.exit(0);
