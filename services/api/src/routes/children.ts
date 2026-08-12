import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { PandaWiseStore } from "../repositories/store.js";
import { ChildService } from "../services/child-service.js";
import { authenticate } from "./auth.js";

const createChildSchema = z.object({
  name: z.string().trim().min(2).max(100),
  nickname: z.string().trim().max(60).optional(),
  avatarId: z.string().trim().max(80).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(["Boy", "Girl", "Prefer Not to Say"]),
  schoolId: z.string().trim().max(80).optional(),
  gradeId: z.string().trim().max(80).optional(),
  languageId: z.string().trim().min(1).max(80).default("LNG001"),
  knownInterests: z.array(z.string().trim().min(1).max(80)).max(5).default([]),
  parentTimeCommitment: z
    .enum(["10_MIN", "15_MIN", "20_MIN", "30_MIN", "WEEKENDS_ONLY"])
    .default("15_MIN"),
});

const childParamsSchema = z.object({ childId: z.string().min(1).max(80) });

export async function registerChildRoutes(
  app: FastifyInstance,
  store: PandaWiseStore,
): Promise<void> {
  const service = new ChildService(store);

  app.get("/v1/children", { preHandler: authenticate }, async (request) => {
    return { children: await service.list(request.user.sub) };
  });

  app.post("/v1/children", { preHandler: authenticate }, async (request, reply) => {
    const input = createChildSchema.parse(request.body);
    const child = await service.create(request.user.sub, input);
    return reply.code(201).send({ child });
  });

  app.get("/v1/children/:childId", { preHandler: authenticate }, async (request) => {
    const { childId } = childParamsSchema.parse(request.params);
    return { child: await service.get(request.user.sub, childId) };
  });
}
