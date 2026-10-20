import { serviceDescriptor } from "@perkly/contracts";
import { publicConfigSummary, type AppConfig } from "@perkly/integrations";
import express, { type Express } from "express";

export function createApp(config: AppConfig): Express {
  const app = express();
  app.disable("x-powered-by");
  const summary = publicConfigSummary(config);
  app.get("/api/v1", (_request, response) => {
    response.json({
      ...serviceDescriptor,
      mode: summary.mode,
      adapters: summary.adapters,
    });
  });
  return app;
}
