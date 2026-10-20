import type { Server } from "node:http";

export function closeHttpServer(server: Server, timeoutMs = 5_000): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      server.closeAllConnections();
      resolve();
    }, timeoutMs);
    server.close(() => {
      clearTimeout(timer);
      resolve();
    });
  });
}
