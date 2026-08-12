import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { PandaWiseStore } from "../repositories/store.js";
import { AccountService } from "../services/account-service.js";
import { authenticate } from "./auth.js";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  parentType: z.enum(["Mother", "Father", "Guardian", "Grandparent"]),
  mobileNumber: z.string().trim().min(8).max(20),
  preferredLanguageId: z.string().trim().min(1).max(80),
  dailyTimeCommitment: z.enum([
    "10_MIN",
    "15_MIN",
    "20_MIN",
    "30_MIN",
    "WEEKENDS_ONLY",
  ]),
});
const planSchema = z.object({ planId: z.enum(["PLN001", "PLN002", "PLN003"]) });
const notificationSchema = z.object({
  pushNotification: z.boolean(),
  emailNotification: z.boolean(),
  whatsAppNotification: z.boolean(),
  weeklySummary: z.boolean(),
  missionReminder: z.boolean(),
});
const marketingSchema = z.object({ marketingConsent: z.boolean() });
const referralSchema = z.object({ referralCode: z.string().trim().min(4).max(40) });

export async function registerAccountRoutes(
  app: FastifyInstance,
  store: PandaWiseStore,
): Promise<void> {
  const service = new AccountService(store);

  app.get("/v1/plans", { preHandler: authenticate }, async (request) =>
    service.listPlans(request.user.sub),
  );

  app.put("/v1/me/subscription", { preHandler: authenticate }, async (request) => {
    const { planId } = planSchema.parse(request.body);
    return service.changePlan(request.user.sub, planId);
  });

  app.put("/v1/me/profile", { preHandler: authenticate }, async (request) =>
    service.updateProfile(request.user.sub, profileSchema.parse(request.body)),
  );

  app.put(
    "/v1/me/notification-preferences",
    { preHandler: authenticate },
    async (request) => service.updateNotifications(
      request.user.sub,
      notificationSchema.parse(request.body),
    ),
  );

  app.put("/v1/me/marketing-consent", { preHandler: authenticate }, async (request) => {
    const { marketingConsent } = marketingSchema.parse(request.body);
    return service.updateMarketingConsent(request.user.sub, marketingConsent);
  });

  app.put("/v1/me/referral", { preHandler: authenticate }, async (request) => {
    const { referralCode } = referralSchema.parse(request.body);
    return service.applyReferral(request.user.sub, referralCode);
  });

  app.get("/v1/notifications", { preHandler: authenticate }, async (request) =>
    service.notifications(request.user.sub),
  );
}
