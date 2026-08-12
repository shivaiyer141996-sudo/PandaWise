import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import type { Environment } from "../config/env.js";
import { toPublicParent } from "../domain/models.js";
import type { PandaWiseStore } from "../repositories/store.js";
import { AuthService } from "../services/auth-service.js";

const parentTypeSchema = z.enum(["Mother", "Father", "Guardian", "Grandparent"]);
const timeCommitmentSchema = z.enum([
  "10_MIN",
  "15_MIN",
  "20_MIN",
  "30_MIN",
  "WEEKENDS_ONLY",
]);

const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/\d/, "Password must include a number");

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  parentType: parentTypeSchema.default("Guardian"),
  mobileNumber: z.string().trim().min(8).max(20),
  email: z.email().max(254),
  password: passwordSchema,
  preferredLanguageId: z.string().trim().min(1).default("LNG001"),
  dailyTimeCommitment: timeCommitmentSchema.default("15_MIN"),
  termsAccepted: z.literal(true),
  marketingConsent: z.boolean().default(false),
});

const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(72),
});

const forgotPasswordSchema = z.object({ email: z.email().max(254) });

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    await reply.code(401).send({
      error: { code: "UNAUTHORIZED", message: "A valid parent session is required" },
    });
  }
}

export async function registerAuthRoutes(
  app: FastifyInstance,
  store: PandaWiseStore,
  environment: Environment,
): Promise<void> {
  const service = new AuthService(store);

  app.post("/v1/auth/register", async (request, reply) => {
    const input = registerSchema.parse(request.body);
    const parent = await service.register(input);
    const token = app.jwt.sign(
      { sub: parent.id, role: "parent" },
      { expiresIn: environment.JWT_EXPIRES_IN },
    );
    return reply.code(201).send({ token, parent: toPublicParent(parent) });
  });

  app.post("/v1/auth/login", async (request) => {
    const input = loginSchema.parse(request.body);
    const parent = await service.login(input.email, input.password);
    const token = app.jwt.sign(
      { sub: parent.id, role: "parent" },
      { expiresIn: environment.JWT_EXPIRES_IN },
    );
    return { token, parent: toPublicParent(parent) };
  });

  app.post("/v1/auth/forgot-password", async (request, reply) => {
    forgotPasswordSchema.parse(request.body);
    return reply.code(202).send({
      message: "If an active PandaWise account matches, reset instructions will be sent.",
    });
  });

  app.get("/v1/me", { preHandler: authenticate }, async (request) => {
    const parent = await store.getParentById(request.user.sub);
    return { parent: parent ? toPublicParent(parent) : null };
  });
}
