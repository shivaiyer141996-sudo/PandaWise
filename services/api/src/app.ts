import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import Fastify, { type FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { allowedOrigins, loadEnvironment, type Environment } from "./config/env.js";
import { DomainError } from "./domain/errors.js";
import { GoogleSheetsStore } from "./repositories/google-sheets-store.js";
import { MemoryStore } from "./repositories/memory-store.js";
import type { PandaWiseStore } from "./repositories/store.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerAccountRoutes } from "./routes/account.js";
import { registerAssessmentRoutes } from "./routes/assessments.js";
import { registerBootstrapRoutes } from "./routes/bootstrap.js";
import { registerChildRoutes } from "./routes/children.js";
import { registerJourneyRoutes } from "./routes/journeys.js";
import { registerProgressRoutes } from "./routes/progress.js";

export interface BuildAppOptions {
  environment?: Environment;
  store?: PandaWiseStore;
  now?: () => Date;
}

function createStore(environment: Environment): PandaWiseStore {
  return environment.DATA_PROVIDER === "google-sheets"
    ? new GoogleSheetsStore(environment)
    : new MemoryStore();
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const environment = options.environment ?? loadEnvironment();
  const app = Fastify({
    logger:
      environment.NODE_ENV === "test"
        ? false
        : { level: environment.LOG_LEVEL, redact: ["req.headers.authorization"] },
  });
  const store = options.store ?? createStore(environment);
  const origins = allowedOrigins(environment);

  await app.register(cors, {
    origin: origins === true ? true : origins,
    credentials: false,
  });
  await app.register(jwt, { secret: environment.JWT_SECRET });

  app.get("/health", async () => ({
    status: "ok",
    service: "pandawise-api",
    version: "0.5.0",
  }));

  await registerBootstrapRoutes(app, store);
  await registerAuthRoutes(app, store, environment);
  await registerAccountRoutes(app, store);
  await registerChildRoutes(app, store);
  await registerAssessmentRoutes(app, store);
  await registerJourneyRoutes(app, store, options.now);
  await registerProgressRoutes(app, store);

  app.setNotFoundHandler(async (_request, reply) => {
    return reply.code(404).send({
      error: { code: "ROUTE_NOT_FOUND", message: "The requested PandaWise route was not found" },
    });
  });

  app.setErrorHandler(async (error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Please review the highlighted information",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
    }

    if (error instanceof DomainError) {
      return reply.code(error.statusCode).send({
        error: { code: error.code, message: error.message },
      });
    }

    request.log.error({ err: error }, "Unhandled PandaWise API error");
    return reply.code(500).send({
      error: { code: "INTERNAL_ERROR", message: "PandaWise could not complete this request" },
    });
  });

  return app;
}
