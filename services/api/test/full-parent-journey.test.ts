import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import type { Environment } from "../src/config/env.js";
import { MemoryStore } from "../src/repositories/memory-store.js";

const environment: Environment = {
  NODE_ENV: "test",
  HOST: "127.0.0.1",
  PORT: 8080,
  LOG_LEVEL: "silent",
  ALLOWED_ORIGINS: "*",
  DATA_PROVIDER: "memory",
  GOOGLE_SHEETS_MAX_ATTEMPTS: 3,
  GOOGLE_SHEETS_RETRY_BASE_MS: 200,
  JWT_SECRET: "e2e-test-jwt-secret-with-more-than-32-characters",
  JWT_EXPIRES_IN: "1h",
};

function dateForEightYearOld(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear() - 8, now.getUTCMonth(), now.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

describe("Release 1.0 parent journey", () => {
  it("completes signup through reassessment and a fresh journey", async () => {
    let now = new Date("2026-08-01T09:00:00.000Z");
    const store = new MemoryStore();
    const app = await buildApp({ environment, store, now: () => now });

    const registered = await app.inject({
      method: "POST",
      url: "/v1/auth/register",
      payload: {
        name: "Release Parent",
        parentType: "Guardian",
        mobileNumber: "9876543210",
        email: "release-parent@example.com",
        password: "PandaWise1",
        preferredLanguageId: "LNG001",
        dailyTimeCommitment: "15_MIN",
        termsAccepted: true,
        marketingConsent: false,
      },
    });
    expect(registered.statusCode).toBe(201);
    const token = registered.json().token as string;
    const parentId = registered.json().parent.id as string;
    const authorization = { authorization: `Bearer ${token}` };

    const plan = await app.inject({
      method: "PUT",
      url: "/v1/me/subscription",
      headers: authorization,
      payload: { planId: "PLN002" },
    });
    expect(plan.statusCode).toBe(200);

    const childCreated = await app.inject({
      method: "POST",
      url: "/v1/children",
      headers: authorization,
      payload: {
        name: "Aarav Rajesh Kumar",
        nickname: "Aarav",
        avatarId: "AVT001",
        dateOfBirth: dateForEightYearOld(),
        gender: "Boy",
        languageId: "LNG001",
        knownInterests: ["Reading", "Chess"],
        parentTimeCommitment: "15_MIN",
      },
    });
    expect(childCreated.statusCode).toBe(201);
    const childId = childCreated.json().child.id as string;

    const passions = await app.inject({
      method: "PUT",
      url: `/v1/children/${childId}/passions`,
      headers: authorization,
      payload: { passionIds: ["PAS011", "PAS008"] },
    });
    expect(passions.statusCode).toBe(200);

    const firstAssessment = await completeAssessment(app, authorization, childId);
    const firstJourney = await app.inject({
      method: "POST",
      url: `/v1/children/${childId}/journeys`,
      headers: authorization,
      payload: { focusSkillIds: ["SKL001", "SKL002"] },
    });
    expect(firstJourney.statusCode).toBe(201);
    const firstJourneyId = firstJourney.json().journey.id as string;

    let journey = firstJourney.json();
    for (let day = 1; day <= 21; day += 1) {
      if (day > 1) {
        now = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        journey = (await app.inject({
          method: "GET",
          url: `/v1/children/${childId}/journeys/current`,
          headers: authorization,
        })).json();
      }
      const today = journey.today as { scheduleId: string };
      const completed = await app.inject({
        method: "PUT",
        url: `/v1/journeys/${firstJourneyId}/schedules/${today.scheduleId}/completion`,
        headers: authorization,
        payload: {
          status: day <= 15 ? "YES" : "NO",
          enjoymentScore: 4,
          difficultyFeedback: "JUST_RIGHT",
        },
      });
      expect(completed.statusCode).toBe(200);
      journey = completed.json();
    }
    expect(journey.journey).toMatchObject({
      completionPercent: 71.43,
      reassessmentUnlocked: true,
    });

    const secondAssessment = await completeAssessment(app, authorization, childId);
    expect(secondAssessment.assessmentId).not.toBe(firstAssessment.assessmentId);
    expect(secondAssessment.report).toMatchObject({ assessment: { sequence: 2 } });

    const progress = await app.inject({
      method: "GET",
      url: `/v1/children/${childId}/progress`,
      headers: authorization,
    });
    expect(progress.statusCode).toBe(200);
    expect(progress.json().assessmentHistory).toHaveLength(2);
    expect(progress.json().actions).toMatchObject({
      canStartJourney: true,
      nextAction: "START_JOURNEY",
    });

    const secondJourney = await app.inject({
      method: "POST",
      url: `/v1/children/${childId}/journeys`,
      headers: authorization,
      payload: { focusSkillIds: ["SKL001"] },
    });
    expect(secondJourney.statusCode).toBe(201);
    expect(secondJourney.json().journey).toMatchObject({
      sourceAssessmentId: secondAssessment.assessmentId,
      status: "Active",
      missionsPlanned: 21,
    });

    const storedParent = await store.getParentById(parentId);
    const storedChild = await store.getChild(parentId, childId);
    expect(storedParent?.subscriptionPlanId).toBe("PLN002");
    expect(storedChild).toMatchObject({
      nickname: "Aarav",
      assessmentCount: 2,
      journeyCount: 1,
      journeyStatus: "Active",
    });
    await app.close();
  });
});

async function completeAssessment(
  app: Awaited<ReturnType<typeof buildApp>>,
  authorization: { authorization: string },
  childId: string,
): Promise<{ assessmentId: string; report: Record<string, unknown> }> {
  const started = await app.inject({
    method: "POST",
    url: `/v1/children/${childId}/assessments`,
    headers: authorization,
  });
  expect(started.statusCode).toBe(201);
  const assessmentId = started.json().assessment.id as string;
  const questions = started.json().questions as Array<{
    id: string;
    options: Array<{ id: string }>;
  }>;
  for (const question of questions) {
    const response = await app.inject({
      method: "PUT",
      url: `/v1/assessments/${assessmentId}/responses/${question.id}`,
      headers: authorization,
      payload: { optionId: question.options[0]!.id },
    });
    expect(response.statusCode).toBe(200);
  }
  const completed = await app.inject({
    method: "POST",
    url: `/v1/assessments/${assessmentId}/complete`,
    headers: authorization,
  });
  expect(completed.statusCode).toBe(200);
  return { assessmentId, report: completed.json() as Record<string, unknown> };
}
