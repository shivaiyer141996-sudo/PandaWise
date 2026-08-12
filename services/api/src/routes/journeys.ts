import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { PandaWiseStore } from "../repositories/store.js";
import { JourneyService } from "../services/journey-service.js";
import { authenticate } from "./auth.js";

const childParamsSchema = z.object({ childId: z.string().min(1).max(80) });
const journeyParamsSchema = z.object({ journeyId: z.string().min(1).max(80) });
const completionParamsSchema = journeyParamsSchema.extend({
  scheduleId: z.string().min(1).max(80),
});
const weeklyParamsSchema = journeyParamsSchema.extend({
  week: z.coerce.number().int().min(1).max(13),
});
const createJourneySchema = z.object({
  focusSkillIds: z.array(z.string().trim().min(1).max(80)).min(1).max(3),
});
const completionSchema = z.object({
  status: z.enum(["YES", "PARTIALLY", "NO"]),
  enjoymentScore: z.number().int().min(1).max(5),
  difficultyFeedback: z.enum(["TOO_EASY", "JUST_RIGHT", "CHALLENGING"]),
  parentNotes: z.string().trim().max(500).optional(),
});

export async function registerJourneyRoutes(
  app: FastifyInstance,
  store: PandaWiseStore,
  now?: () => Date,
): Promise<void> {
  const service = new JourneyService(store, now);

  app.post(
    "/v1/children/:childId/journeys",
    { preHandler: authenticate },
    async (request, reply) => {
      const { childId } = childParamsSchema.parse(request.params);
      const input = createJourneySchema.parse(request.body);
      return reply.code(201).send(await service.create(request.user.sub, childId, input));
    },
  );

  app.get(
    "/v1/children/:childId/journeys/current",
    { preHandler: authenticate },
    async (request) => {
      const { childId } = childParamsSchema.parse(request.params);
      return service.current(request.user.sub, childId);
    },
  );

  app.get("/v1/journeys/:journeyId", { preHandler: authenticate }, async (request) => {
    const { journeyId } = journeyParamsSchema.parse(request.params);
    return service.view(request.user.sub, journeyId);
  });

  app.put(
    "/v1/journeys/:journeyId/schedules/:scheduleId/completion",
    { preHandler: authenticate },
    async (request) => {
      const { journeyId, scheduleId } = completionParamsSchema.parse(request.params);
      const input = completionSchema.parse(request.body);
      return service.completeMission(request.user.sub, journeyId, scheduleId, input);
    },
  );

  app.get(
    "/v1/journeys/:journeyId/weekly-summary/:week",
    { preHandler: authenticate },
    async (request) => {
      const { journeyId, week } = weeklyParamsSchema.parse(request.params);
      return service.weeklySummary(request.user.sub, journeyId, week);
    },
  );
}
