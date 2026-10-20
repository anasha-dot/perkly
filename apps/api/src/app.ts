import { serviceDescriptor } from "@perkly/contracts";
import express, { type Express } from "express";

export function createApp(): Express {
  const app = express();
  app.disable("x-powered-by");
  app.get("/api/v1", (_request, response) => {
    response.json(serviceDescriptor);
  });
  return app;
}
