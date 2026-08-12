import { buildApp } from "./app.js";
import { loadEnvironment } from "./config/env.js";

const environment = loadEnvironment();
const app = await buildApp({ environment });

const close = async (signal: string): Promise<void> => {
  app.log.info({ signal }, "Stopping PandaWise API");
  await app.close();
  process.exit(0);
};

process.on("SIGINT", () => void close("SIGINT"));
process.on("SIGTERM", () => void close("SIGTERM"));

try {
  await app.listen({ host: environment.HOST, port: environment.PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
