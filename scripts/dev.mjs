import { spawn } from "node:child_process";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const children = new Set();
let stopping = false;

function start(workspace) {
  const child = spawn(npm, ["run", "dev", "-w", workspace], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  children.add(child);
  child.on("exit", (code, signal) => {
    children.delete(child);
    if (stopping || signal) {
      return;
    }
    stop(code ?? 1);
  });
}

function stop(code) {
  if (stopping) {
    return;
  }
  stopping = true;
  for (const child of children) {
    child.kill("SIGTERM");
  }
  setTimeout(() => {
    process.exit(code);
  }, 250);
}

process.on("SIGINT", () => {
  stop(0);
});
process.on("SIGTERM", () => {
  stop(0);
});

const port = process.env.PORT ?? "3001";
start("@perkly/api");
start("@perkly/worker");

let ready = false;
for (let attempt = 0; attempt < 50; attempt += 1) {
  if (stopping) {
    break;
  }
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/v1`);
    if (response.ok) {
      ready = true;
      break;
    }
  } catch {
    // The API process is still starting.
  }
  await delay(100);
}

if (!ready) {
  console.error(`perkly-api did not become ready on 127.0.0.1:${port}`);
  stop(1);
} else if (!stopping) {
  start("@perkly/web");
}

await new Promise(() => {
  /* Stay up while the child processes run. */
});
