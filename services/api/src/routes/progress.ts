import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { PandaWiseStore } from "../repositories/store.js";
import { ProgressService } from "../services/progress-service.js";
import { authenticate } from "./auth.js";

const childParamsSchema = z.object({ childId: z.string().min(1).max(80) });

export async function registerProgressRoutes(
  app: FastifyInstance,
  store: PandaWiseStore,
): Promise<void> {
  const service = new ProgressService(store);

  app.get(
    "/v1/children/:childId/progress",
    { preHandler: authenticate },
    async (request) => {
      const { childId } = childParamsSchema.parse(request.params);
      return service.view(request.user.sub, childId);
    },
  );
}
