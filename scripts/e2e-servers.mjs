import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const children = new Set();
let stopping = false;

function start(args) {
  const child = spawn(npm, args, { stdio: "inherit", env: process.env });
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

async function waitFor(url) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (stopping) {
      return false;
    }
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch {
      // The process is still starting.
    }
    await delay(250);
  }
  return false;
}

process.on("SIGINT", () => {
  stop(0);
});
process.on("SIGTERM", () => {
  stop(0);
});

const apiPort = process.env.PORT ?? "3001";
start(["run", "start:api"]);
if (!(await waitFor(`http://127.0.0.1:${apiPort}/api/v1`))) {
  console.error(`perkly-api did not become ready on 127.0.0.1:${apiPort}`);
  stop(1);
}
start(["run", "dev", "-w", "@perkly/web"]);
if (!(await waitFor("http://127.0.0.1:5173/"))) {
  console.error("perkly web did not become ready on 127.0.0.1:5173");
  stop(1);
}

await new Promise(() => {
  /* Stay up while Playwright uses the servers. */
});
