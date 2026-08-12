import type { FastifyInstance } from "fastify";
import type { PandaWiseStore } from "../repositories/store.js";

export async function registerBootstrapRoutes(
  app: FastifyInstance,
  store: PandaWiseStore,
): Promise<void> {
  app.get("/v1/config/bootstrap", async () => ({
    version: "1.0",
    data: await store.getBootstrapData(),
  }));
}
