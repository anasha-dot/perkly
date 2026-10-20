console.log(
  "perkly-worker started. No job queue in this build. The database is the next task (P01-02).",
);

const keepAlive = setInterval(() => {
  /* Idle until a later task adds the job queue. */
}, 60_000);

function shutdown(): void {
  clearInterval(keepAlive);
  console.log("perkly-worker stopped");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
