import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { PandaWiseStore } from "../repositories/store.js";
import { AssessmentService } from "../services/assessment-service.js";
import { authenticate } from "./auth.js";

const childParamsSchema = z.object({ childId: z.string().min(1).max(80) });
const assessmentParamsSchema = z.object({ assessmentId: z.string().min(1).max(80) });
const responseParamsSchema = assessmentParamsSchema.extend({
  questionId: z.string().min(1).max(100),
});
const passionSchema = z.object({
  passionIds: z.array(z.string().trim().min(1).max(80)).min(1).max(5),
});
const responseSchema = z.object({
  optionId: z.string().trim().min(1).max(80),
  responseText: z.string().trim().max(500).optional(),
});

export async function registerAssessmentRoutes(
  app: FastifyInstance,
  store: PandaWiseStore,
): Promise<void> {
  const service = new AssessmentService(store);

  app.get(
    "/v1/children/:childId/passions",
    { preHandler: authenticate },
    async (request) => {
      const { childId } = childParamsSchema.parse(request.params);
      return { passionIds: await service.getPassions(request.user.sub, childId) };
    },
  );

  app.put(
    "/v1/children/:childId/passions",
    { preHandler: authenticate },
    async (request) => {
      const { childId } = childParamsSchema.parse(request.params);
      const { passionIds } = passionSchema.parse(request.body);
      return { passionIds: await service.selectPassions(request.user.sub, childId, passionIds) };
    },
  );

  app.post(
    "/v1/children/:childId/assessments",
    { preHandler: authenticate },
    async (request, reply) => {
      const { childId } = childParamsSchema.parse(request.params);
      const result = await service.start(request.user.sub, childId);
      return reply.code(201).send(result);
    },
  );

  app.get(
    "/v1/children/:childId/growscore/latest",
    { preHandler: authenticate },
    async (request) => {
      const { childId } = childParamsSchema.parse(request.params);
      return service.latestReport(request.user.sub, childId);
    },
  );

  app.get(
    "/v1/assessments/:assessmentId",
    { preHandler: authenticate },
    async (request) => {
      const { assessmentId } = assessmentParamsSchema.parse(request.params);
      return service.view(request.user.sub, assessmentId);
    },
  );

  app.put(
    "/v1/assessments/:assessmentId/responses/:questionId",
    { preHandler: authenticate },
    async (request) => {
      const { assessmentId, questionId } = responseParamsSchema.parse(request.params);
      const input = responseSchema.parse(request.body);
      return service.saveResponse(request.user.sub, assessmentId, questionId, input);
    },
  );

  app.post(
    "/v1/assessments/:assessmentId/complete",
    { preHandler: authenticate },
    async (request) => {
      const { assessmentId } = assessmentParamsSchema.parse(request.params);
      return service.complete(request.user.sub, assessmentId);
    },
  );

  app.get(
    "/v1/assessments/:assessmentId/report",
    { preHandler: authenticate },
    async (request) => {
      const { assessmentId } = assessmentParamsSchema.parse(request.params);
      return service.report(request.user.sub, assessmentId);
    },
  );
}
