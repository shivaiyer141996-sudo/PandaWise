import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import type { Environment } from "../src/config/env.js";
import type { Assessment, Child, PlanId, ScoreBand, SkillScore } from "../src/domain/models.js";
import { MemoryStore } from "../src/repositories/memory-store.js";

const testEnvironment: Environment = {
  NODE_ENV: "test",
  HOST: "127.0.0.1",
  PORT: 8080,
  LOG_LEVEL: "silent",
  ALLOWED_ORIGINS: "*",
  DATA_PROVIDER: "memory",
  GOOGLE_SHEETS_MAX_ATTEMPTS: 3,
  GOOGLE_SHEETS_RETRY_BASE_MS: 200,
  JWT_SECRET: "test-only-jwt-secret-with-more-than-32-characters",
  JWT_EXPIRES_IN: "1h",
};

function dateForAge(age: number): string {
  const today = new Date();
  const date = new Date(Date.UTC(today.getUTCFullYear() - age, today.getUTCMonth(), today.getUTCDate()));
  return date.toISOString().slice(0, 10);
}

async function register(app: Awaited<ReturnType<typeof buildApp>>, email = "parent@example.com") {
  const response = await app.inject({
    method: "POST",
    url: "/v1/auth/register",
    payload: {
      name: "Shiva",
      parentType: "Father",
      mobileNumber: "9876543210",
      email,
      password: "PandaWise1",
      preferredLanguageId: "LNG001",
      dailyTimeCommitment: "15_MIN",
      termsAccepted: true,
      marketingConsent: false,
    },
  });
  return { response, body: response.json() as { token: string; parent: { id: string } } };
}

async function createChild(
  app: Awaited<ReturnType<typeof buildApp>>,
  token: string,
  age = 8,
) {
  const response = await app.inject({
    method: "POST",
    url: "/v1/children",
    headers: { authorization: `Bearer ${token}` },
    payload: {
      name: "Aarav",
      dateOfBirth: dateForAge(age),
      gender: "Boy",
      languageId: "LNG001",
      knownInterests: ["Reading", "Chess"],
      parentTimeCommitment: "15_MIN",
    },
  });
  return {
    response,
    child: response.json().child as { id: string; ageGroupId: string },
  };
}

async function setPlan(store: MemoryStore, parentId: string, planId: PlanId): Promise<void> {
  const parent = await store.getParentById(parentId);
  if (!parent) throw new Error("Test parent was not found");
  await store.createParent({ ...parent, subscriptionPlanId: planId });
}

async function seedAssessmentHistory(
  store: MemoryStore,
  child: Child,
  growScores: number[],
): Promise<void> {
  let updatedChild = child;
  for (const [index, growScore] of growScores.entries()) {
    const sequence = index + 1;
    const timestamp = `${new Date().getUTCFullYear()}-0${sequence + 1}-01T09:00:00.000Z`;
    const assessmentId = `ASM-SEED-${sequence}`;
    const scoreBand: ScoreBand =
      growScore >= 75
        ? "STRONG"
        : growScore >= 60
          ? "AGE_APPROPRIATE"
          : growScore >= 40
            ? "DEVELOPING"
            : "PRIORITY_GROWTH_AREA";
    const assessment: Assessment = {
      id: assessmentId,
      childId: child.id,
      version: "1.0",
      depth: "COMPREHENSIVE",
      respondentMode: "PARENT",
      startedAt: timestamp,
      completedAt: timestamp,
      overallGrowScore: growScore,
      scoreBand,
      questionCount: 50,
      sequence,
      status: "Completed",
      createdAt: timestamp,
      updatedAt: timestamp,
      calculationVersion: "1.0",
    };
    const scores: SkillScore[] = Array.from({ length: 10 }, (_, skillIndex) => {
      const skillScore = growScore + skillIndex;
      const previousScore = sequence > 1 ? growScores[index - 1]! + skillIndex : undefined;
      return {
        id: `SSC-SEED-${sequence}-${skillIndex + 1}`,
        assessmentId,
        childId: child.id,
        skillId: `SKL${String(skillIndex + 1).padStart(3, "0")}`,
        weightedRawScore: skillScore,
        normalizedScore: skillScore,
        skillWeightPercent: 10,
        weightedContribution: skillScore / 10,
        scoreBand,
        ...(previousScore === undefined
          ? {}
          : {
              previousScore,
              changeFromPrevious: skillScore - previousScore,
            }),
        calculatedAt: timestamp,
        calculationVersion: "1.0",
      };
    });
    updatedChild = {
      ...updatedChild,
      assessmentStatus: "Completed",
      assessmentCount: sequence,
      currentGrowScore: growScore,
      currentBadgeLevel: "Explorer",
      updatedAt: timestamp,
    };
    await store.saveAssessmentResult(assessment, scores, updatedChild);
  }
}

async function completeDevelopmentCheck(
  app: Awaited<ReturnType<typeof buildApp>>,
  token: string,
  childId: string,
) {
  const authorization = { authorization: `Bearer ${token}` };
  await app.inject({
    method: "PUT",
    url: `/v1/children/${childId}/passions`,
    headers: authorization,
    payload: { passionIds: ["PAS011", "PAS008"] },
  });
  const started = await app.inject({
    method: "POST",
    url: `/v1/children/${childId}/assessments`,
    headers: authorization,
  });
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
      payload: { optionId: question.options[0]?.id },
    });
    expect(response.statusCode).toBe(200);
  }
  const completed = await app.inject({
    method: "POST",
    url: `/v1/assessments/${assessmentId}/complete`,
    headers: authorization,
  });
  expect(completed.statusCode).toBe(200);
  return { assessmentId, report: completed.json() };
}

describe("PandaWise API", () => {
  it("reports health and bootstrap configuration", async () => {
    const app = await buildApp({ environment: testEnvironment, store: new MemoryStore() });
    const health = await app.inject({ method: "GET", url: "/health" });
    const ready = await app.inject({ method: "GET", url: "/ready" });
    const bootstrap = await app.inject({ method: "GET", url: "/v1/config/bootstrap" });

    expect(health.statusCode).toBe(200);
    expect(health.json()).toMatchObject({ status: "ok", service: "pandawise-api" });
    expect(ready.statusCode).toBe(200);
    expect(ready.json()).toMatchObject({ status: "ready", dataProvider: "memory" });
    expect(bootstrap.statusCode).toBe(200);
    expect(bootstrap.json().data.ageGroups).toHaveLength(3);
    await app.close();
  });

  it("registers and logs in a parent without exposing the password hash", async () => {
    const app = await buildApp({ environment: testEnvironment, store: new MemoryStore() });
    const { response, body } = await register(app);

    expect(response.statusCode).toBe(201);
    expect(body.token).toBeTypeOf("string");
    expect(response.body).not.toContain("passwordHash");

    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: { email: "PARENT@example.com", password: "PandaWise1" },
    });
    expect(login.statusCode).toBe(200);
    expect(login.json().parent.id).toBe(body.parent.id);
    await app.close();
  });

  it("rejects duplicate registration and invalid credentials", async () => {
    const app = await buildApp({ environment: testEnvironment, store: new MemoryStore() });
    await register(app);
    const duplicate = await register(app);
    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: { email: "parent@example.com", password: "WrongPassword1" },
    });

    expect(duplicate.response.statusCode).toBe(409);
    expect(login.statusCode).toBe(401);
    await app.close();
  });

  it("requires authentication for child profiles", async () => {
    const app = await buildApp({ environment: testEnvironment, store: new MemoryStore() });
    const response = await app.inject({ method: "GET", url: "/v1/children" });
    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it("creates an eligible child and derives the age group server-side", async () => {
    const app = await buildApp({ environment: testEnvironment, store: new MemoryStore() });
    const { body } = await register(app);
    const created = await app.inject({
      method: "POST",
      url: "/v1/children",
      headers: { authorization: `Bearer ${body.token}` },
      payload: {
        name: "Aarav",
        dateOfBirth: dateForAge(8),
        gender: "Boy",
        languageId: "LNG001",
        knownInterests: ["Reading", "Chess"],
        parentTimeCommitment: "15_MIN",
      },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().child).toMatchObject({ name: "Aarav", ageYears: 8, ageGroupId: "AG02" });

    const list = await app.inject({
      method: "GET",
      url: "/v1/children",
      headers: { authorization: `Bearer ${body.token}` },
    });
    expect(list.json().children).toHaveLength(1);
    await app.close();
  });

  it("enforces the Explorer child limit and Release 1.0 age boundary", async () => {
    const app = await buildApp({ environment: testEnvironment, store: new MemoryStore() });
    const { body } = await register(app);
    const payload = {
      name: "Aarav",
      dateOfBirth: dateForAge(8),
      gender: "Boy",
      languageId: "LNG001",
      knownInterests: [],
      parentTimeCommitment: "15_MIN",
    };
    await app.inject({
      method: "POST",
      url: "/v1/children",
      headers: { authorization: `Bearer ${body.token}` },
      payload,
    });
    const second = await app.inject({
      method: "POST",
      url: "/v1/children",
      headers: { authorization: `Bearer ${body.token}` },
      payload: { ...payload, name: "Meera" },
    });
    expect(second.statusCode).toBe(403);

    const secondApp = await buildApp({ environment: testEnvironment, store: new MemoryStore() });
    const secondRegistration = await register(secondApp, "another@example.com");
    const ageRejected = await secondApp.inject({
      method: "POST",
      url: "/v1/children",
      headers: { authorization: `Bearer ${secondRegistration.body.token}` },
      payload: { ...payload, dateOfBirth: dateForAge(13) },
    });
    expect(ageRejected.statusCode).toBe(400);
    expect(ageRejected.json().error.code).toBe("AGE_NOT_ELIGIBLE");
    await app.close();
    await secondApp.close();
  });

  it("requires Passion Discovery and resumes an auto-saved Development Check", async () => {
    const app = await buildApp({ environment: testEnvironment, store: new MemoryStore() });
    const { body } = await register(app);
    const { child } = await createChild(app, body.token);
    const authorization = { authorization: `Bearer ${body.token}` };

    const blocked = await app.inject({
      method: "POST",
      url: `/v1/children/${child.id}/assessments`,
      headers: authorization,
    });
    expect(blocked.statusCode).toBe(409);
    expect(blocked.json().error.code).toBe("PASSION_DISCOVERY_REQUIRED");

    const passions = await app.inject({
      method: "PUT",
      url: `/v1/children/${child.id}/passions`,
      headers: authorization,
      payload: { passionIds: ["PAS011", "PAS008"] },
    });
    expect(passions.statusCode).toBe(200);
    expect(passions.json().passionIds).toEqual(["PAS011", "PAS008"]);

    const started = await app.inject({
      method: "POST",
      url: `/v1/children/${child.id}/assessments`,
      headers: authorization,
    });
    expect(started.statusCode).toBe(201);
    expect(started.json().assessment).toMatchObject({ depth: "CORE", questionCount: 30 });
    expect(started.json().questions).toHaveLength(30);
    const assessmentId = started.json().assessment.id as string;
    const questionId = started.json().questions[0].id as string;
    const optionId = started.json().questions[0].options[0].id as string;

    const saved = await app.inject({
      method: "PUT",
      url: `/v1/assessments/${assessmentId}/responses/${questionId}`,
      headers: authorization,
      payload: { optionId },
    });
    expect(saved.statusCode).toBe(200);
    expect(saved.json().progress).toMatchObject({ answered: 1, total: 30 });

    const resumed = await app.inject({
      method: "POST",
      url: `/v1/children/${child.id}/assessments`,
      headers: authorization,
    });
    expect(resumed.json().assessment.id).toBe(assessmentId);
    expect(resumed.json().progress.answered).toBe(1);

    const incomplete = await app.inject({
      method: "POST",
      url: `/v1/assessments/${assessmentId}/complete`,
      headers: authorization,
    });
    expect(incomplete.statusCode).toBe(409);
    expect(incomplete.json().error.code).toBe("ASSESSMENT_INCOMPLETE");
    await app.close();
  });

  it("calculates a versioned GrowScore and enforces Explorer report visibility", async () => {
    const app = await buildApp({ environment: testEnvironment, store: new MemoryStore() });
    const { body } = await register(app);
    const { child } = await createChild(app, body.token);
    const authorization = { authorization: `Bearer ${body.token}` };
    await app.inject({
      method: "PUT",
      url: `/v1/children/${child.id}/passions`,
      headers: authorization,
      payload: { passionIds: ["PAS011"] },
    });
    const started = await app.inject({
      method: "POST",
      url: `/v1/children/${child.id}/assessments`,
      headers: authorization,
    });
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
        payload: { optionId: question.options[0]?.id },
      });
      expect(response.statusCode).toBe(200);
    }

    const completed = await app.inject({
      method: "POST",
      url: `/v1/assessments/${assessmentId}/complete`,
      headers: authorization,
    });
    expect(completed.statusCode).toBe(200);
    expect(completed.json()).toMatchObject({
      growScore: 100,
      scoreBand: "EXCEPTIONAL",
      entitlements: { visibleSkillCount: 5, lockedSkillCount: 5, planId: "PLN001" },
    });
    expect(completed.json().skills).toHaveLength(5);
    expect(completed.json().strengths).toHaveLength(3);
    expect(completed.json().recommendedFocusAreas).toHaveLength(3);

    const latestReport = await app.inject({
      method: "GET",
      url: `/v1/children/${child.id}/growscore/latest`,
      headers: authorization,
    });
    expect(latestReport.statusCode).toBe(200);
    expect(latestReport.json().assessment.id).toBe(assessmentId);

    const children = await app.inject({
      method: "GET",
      url: "/v1/children",
      headers: authorization,
    });
    expect(children.json().children[0]).toMatchObject({
      assessmentStatus: "Completed",
      assessmentCount: 1,
      currentGrowScore: 100,
      currentBadgeLevel: "Explorer",
    });
    await app.close();
  });

  it("builds an explainable plan-length journey with only today's mission visible", async () => {
    const now = new Date("2026-08-01T09:00:00.000Z");
    const app = await buildApp({
      environment: testEnvironment,
      store: new MemoryStore(),
      now: () => now,
    });
    const { body } = await register(app);
    const { child } = await createChild(app, body.token);
    const authorization = { authorization: `Bearer ${body.token}` };
    await completeDevelopmentCheck(app, body.token, child.id);

    const invalidFocus = await app.inject({
      method: "POST",
      url: `/v1/children/${child.id}/journeys`,
      headers: authorization,
      payload: { focusSkillIds: [] },
    });
    expect(invalidFocus.statusCode).toBe(400);

    const created = await app.inject({
      method: "POST",
      url: `/v1/children/${child.id}/journeys`,
      headers: authorization,
      payload: { focusSkillIds: ["SKL001", "SKL002"] },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().journey).toMatchObject({
      status: "Active",
      currentDay: 1,
      missionsPlanned: 7,
      completionPercent: 0,
      reassessmentUnlocked: false,
    });
    expect(created.json().schedules).toHaveLength(7);
    expect(created.json().schedules.filter((schedule: { unlocked: boolean }) => schedule.unlocked)).toHaveLength(1);
    expect(created.json().today).toMatchObject({
      day: 1,
      mission: { skillId: "SKL001", durationMinutes: 10 },
    });
    expect(created.json().today.reason).toContain("Chosen parent focus area");

    const unavailableSummary = await app.inject({
      method: "GET",
      url: `/v1/journeys/${created.json().journey.id as string}/weekly-summary/1`,
      headers: authorization,
    });
    expect(unavailableSummary.statusCode).toBe(403);
    expect(unavailableSummary.json().error.code).toBe("WEEKLY_SUMMARY_REQUIRES_GROWTH");

    const other = await register(app, "other-journey@example.com");
    const privateJourney = await app.inject({
      method: "GET",
      url: `/v1/journeys/${created.json().journey.id as string}`,
      headers: { authorization: `Bearer ${other.body.token}` },
    });
    expect(privateJourney.statusCode).toBe(404);

    const current = await app.inject({
      method: "GET",
      url: `/v1/children/${child.id}/journeys/current`,
      headers: authorization,
    });
    expect(current.statusCode).toBe(200);
    expect(current.json().journey.id).toBe(created.json().journey.id);

    const reassessment = await app.inject({
      method: "POST",
      url: `/v1/children/${child.id}/assessments`,
      headers: authorization,
    });
    expect(reassessment.statusCode).toBe(409);
    expect(reassessment.json().error.code).toBe("REASSESSMENT_LOCKED");
    await app.close();
  });

  it("records calendar-paced feedback, produces summaries and unlocks reassessment at 70%", async () => {
    let now = new Date("2026-08-01T09:00:00.000Z");
    const store = new MemoryStore();
    const app = await buildApp({
      environment: testEnvironment,
      store,
      now: () => now,
    });
    const { body } = await register(app, "journey@example.com");
    await setPlan(store, body.parent.id, "PLN002");
    const { child } = await createChild(app, body.token);
    const authorization = { authorization: `Bearer ${body.token}` };
    await completeDevelopmentCheck(app, body.token, child.id);
    const created = await app.inject({
      method: "POST",
      url: `/v1/children/${child.id}/journeys`,
      headers: authorization,
      payload: { focusSkillIds: ["SKL001"] },
    });
    const journeyId = created.json().journey.id as string;
    let view = created.json();
    const firstTenMissionIds = new Set<string>();

    for (let day = 1; day <= 21; day += 1) {
      if (day > 1) {
        now = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const current = await app.inject({
          method: "GET",
          url: `/v1/children/${child.id}/journeys/current`,
          headers: authorization,
        });
        expect(current.statusCode).toBe(200);
        view = current.json();
      }
      const today = view.today as { scheduleId: string; mission: { id: string } };
      if (day <= 10) firstTenMissionIds.add(today.mission.id);
      const response = await app.inject({
        method: "PUT",
        url: `/v1/journeys/${journeyId}/schedules/${today.scheduleId}/completion`,
        headers: authorization,
        payload: {
          status: day <= 15 ? "YES" : "NO",
          enjoymentScore: 4,
          difficultyFeedback: "JUST_RIGHT",
          parentNotes: day === 1 ? "A calm start." : undefined,
        },
      });
      expect(response.statusCode).toBe(200);
      view = response.json();

      if (day === 1) {
        expect(view.today).toBeNull();
        const secondScheduleId = view.schedules[1].id as string;
        const early = await app.inject({
          method: "PUT",
          url: `/v1/journeys/${journeyId}/schedules/${secondScheduleId}/completion`,
          headers: authorization,
          payload: {
            status: "YES",
            enjoymentScore: 4,
            difficultyFeedback: "JUST_RIGHT",
          },
        });
        expect(early.statusCode).toBe(409);
        expect(early.json().error.code).toBe("MISSION_LOCKED");
      }

      if (day === 7) {
        const summary = await app.inject({
          method: "GET",
          url: `/v1/journeys/${journeyId}/weekly-summary/1`,
          headers: authorization,
        });
        expect(summary.statusCode).toBe(200);
        expect(summary.json()).toMatchObject({ week: 1, days: 7, completed: 7, completionPercent: 100 });
      }
      if (day === 20) {
        const locked = await app.inject({
          method: "POST",
          url: `/v1/children/${child.id}/assessments`,
          headers: authorization,
        });
        expect(locked.statusCode).toBe(409);
        expect(locked.json().error.code).toBe("REASSESSMENT_LOCKED");
      }
    }

    expect(firstTenMissionIds.size).toBe(10);
    expect(view.journey).toMatchObject({
      status: "Completed",
      missionsCompleted: 15,
      completionPercent: 71.43,
      reassessmentUnlocked: true,
    });
    expect(view.today).toBeNull();

    const scheduled = await store.listJourneySchedules(journeyId);
    const missionIdsBySkill = new Map<string, Set<string>>();
    for (const schedule of scheduled) {
      const missionIds = missionIdsBySkill.get(schedule.skillId) ?? new Set<string>();
      missionIds.add(schedule.missionId);
      missionIdsBySkill.set(schedule.skillId, missionIds);
    }
    expect(
      [...missionIdsBySkill.values()].every((missionIds) => missionIds.size <= 2),
    ).toBe(true);

    const children = await app.inject({
      method: "GET",
      url: "/v1/children",
      headers: authorization,
    });
    expect(children.json().children[0]).toMatchObject({
      assessmentStatus: "Reassessment Due",
      journeyStatus: "Completed",
      journeyCount: 1,
    });
    const reassessment = await app.inject({
      method: "POST",
      url: `/v1/children/${child.id}/assessments`,
      headers: authorization,
    });
    expect(reassessment.statusCode).toBe(201);
    await app.close();
  });

  it("separates assessment improvement from mission activity and filters progress by plan", async () => {
    const store = new MemoryStore();
    const app = await buildApp({ environment: testEnvironment, store });
    const { body } = await register(app, "progress@example.com");
    const { child } = await createChild(app, body.token);
    const storedChild = await store.getChild(body.parent.id, child.id);
    if (!storedChild) throw new Error("Test child was not found");
    await seedAssessmentHistory(store, storedChild, [50, 60, 75]);
    const authorization = { authorization: `Bearer ${body.token}` };

    const explorer = await app.inject({
      method: "GET",
      url: `/v1/children/${child.id}/progress`,
      headers: authorization,
    });
    expect(explorer.statusCode).toBe(200);
    expect(explorer.json()).toMatchObject({
      entitlements: {
        planId: "PLN001",
        growthTrackerEnabled: false,
        assessmentHistoryAccess: "Latest Only",
        assessmentComparison: "None",
      },
      assessmentSnapshot: {
        latestGrowScore: 75,
        previousGrowScore: null,
        changeFromPrevious: null,
      },
      activitySnapshot: {
        status: "Not Started",
        completionPercent: 0,
        missionsCompleted: 0,
      },
      actions: { canStartJourney: true, nextAction: "START_JOURNEY" },
    });
    expect(explorer.json().skillTrends).toEqual([]);
    expect(explorer.json().assessmentHistory).toHaveLength(1);

    await setPlan(store, body.parent.id, "PLN002");
    const growth = await app.inject({
      method: "GET",
      url: `/v1/children/${child.id}/progress`,
      headers: authorization,
    });
    expect(growth.statusCode).toBe(200);
    expect(growth.json().assessmentSnapshot).toMatchObject({
      latestGrowScore: 75,
      previousGrowScore: 60,
      changeFromPrevious: 15,
    });
    expect(growth.json().assessmentHistory).toHaveLength(3);
    expect(growth.json().skillTrends).toHaveLength(10);
    expect(growth.json().skillTrends[0].points).toHaveLength(2);

    await setPlan(store, body.parent.id, "PLN003");
    const mastery = await app.inject({
      method: "GET",
      url: `/v1/children/${child.id}/progress`,
      headers: authorization,
    });
    expect(mastery.statusCode).toBe(200);
    expect(mastery.json().skillTrends[0].points).toHaveLength(3);

    const newJourney = await app.inject({
      method: "POST",
      url: `/v1/children/${child.id}/journeys`,
      headers: authorization,
      payload: { focusSkillIds: ["SKL001"] },
    });
    expect(newJourney.statusCode).toBe(201);
    expect(newJourney.json().journey).toMatchObject({
      sourceAssessmentId: "ASM-SEED-3",
      status: "Active",
      missionsPlanned: 21,
    });
    await app.close();
  });

  it("lists live-plan capabilities, changes plans manually and blocks an invalid downgrade", async () => {
    const store = new MemoryStore();
    const app = await buildApp({ environment: testEnvironment, store });
    const { body } = await register(app, "plans@example.com");
    const authorization = { authorization: `Bearer ${body.token}` };
    await createChild(app, body.token);

    const listed = await app.inject({
      method: "GET",
      url: "/v1/plans",
      headers: authorization,
    });
    expect(listed.statusCode).toBe(200);
    expect(listed.json()).toMatchObject({
      currentPlanId: "PLN001",
      billingMode: "MANUAL_V1",
      paymentGatewayEnabled: false,
    });
    expect(listed.json().plans).toHaveLength(3);
    expect(listed.json().plans[0]).toMatchObject({
      planId: "PLN001",
      includedAssessmentsPerYear: 1,
      annualPriceInr: 0,
      passionInsightsLevel: "Basic",
      growScoreEnabled: true,
      growthTimelineEnabled: false,
    });
    expect(listed.json().plans[1]).toMatchObject({
      planId: "PLN002",
      annualPriceInr: 1999,
      recommended: true,
    });

    const upgraded = await app.inject({
      method: "PUT",
      url: "/v1/me/subscription",
      headers: authorization,
      payload: { planId: "PLN002" },
    });
    expect(upgraded.statusCode).toBe(200);
    expect(upgraded.json().parent.subscriptionPlanId).toBe("PLN002");
    await createChild(app, body.token, 6);
    await createChild(app, body.token, 4);

    const children = await app.inject({
      method: "GET",
      url: "/v1/children",
      headers: authorization,
    });
    expect(children.json().children).toHaveLength(3);
    expect(
      children.json().children.every(
        (child: { currentPlanId: string }) => child.currentPlanId === "PLN002",
      ),
    ).toBe(true);

    const downgrade = await app.inject({
      method: "PUT",
      url: "/v1/me/subscription",
      headers: authorization,
      payload: { planId: "PLN001" },
    });
    expect(downgrade.statusCode).toBe(409);
    await app.close();
  });

  it("enforces the live Explorer annual Development Check allowance", async () => {
    const store = new MemoryStore();
    const app = await buildApp({ environment: testEnvironment, store });
    const { body } = await register(app, "annual-limit@example.com");
    const { child } = await createChild(app, body.token);
    const authorization = { authorization: `Bearer ${body.token}` };
    await app.inject({
      method: "PUT",
      url: `/v1/children/${child.id}/passions`,
      headers: authorization,
      payload: { passionIds: ["PAS011"] },
    });
    const storedChild = await store.getChild(body.parent.id, child.id);
    if (!storedChild) throw new Error("Test child was not found");
    await seedAssessmentHistory(store, storedChild, [65]);
    const [assessment] = await store.listAssessments(child.id);
    const assessedChild = await store.getChild(body.parent.id, child.id);
    if (!assessment || !assessedChild) throw new Error("Seeded assessment was not found");
    await store.saveAssessmentResult(
      assessment,
      await store.listSkillScores(assessment.id),
      { ...assessedChild, assessmentStatus: "Reassessment Due" },
    );

    const blocked = await app.inject({
      method: "POST",
      url: `/v1/children/${child.id}/assessments`,
      headers: authorization,
    });
    expect(blocked.statusCode).toBe(403);
    expect(blocked.json().error.code).toBe("ASSESSMENT_LIMIT_REACHED");
    await app.close();
  });

  it("keeps marketing, notification and referral preferences independent", async () => {
    const store = new MemoryStore();
    const app = await buildApp({ environment: testEnvironment, store });
    const first = await register(app, "referrer@example.com");
    const second = await register(app, "settings@example.com");
    const authorization = { authorization: `Bearer ${second.body.token}` };

    const firstMe = await app.inject({
      method: "GET",
      url: "/v1/me",
      headers: { authorization: `Bearer ${first.body.token}` },
    });
    const originalTerms = (await app.inject({
      method: "GET",
      url: "/v1/me",
      headers: authorization,
    })).json().parent.termsAcceptedAt as string;

    const profile = await app.inject({
      method: "PUT",
      url: "/v1/me/profile",
      headers: authorization,
      payload: {
        name: "Updated Parent",
        parentType: "Guardian",
        mobileNumber: "9876543211",
        preferredLanguageId: "LNG002",
        dailyTimeCommitment: "20_MIN",
      },
    });
    expect(profile.statusCode).toBe(200);
    expect(profile.json().parent).toMatchObject({
      name: "Updated Parent",
      preferredLanguageId: "LNG002",
      dailyTimeCommitment: "20_MIN",
      marketingConsent: false,
    });

    const whatsApp = await app.inject({
      method: "PUT",
      url: "/v1/me/notification-preferences",
      headers: authorization,
      payload: {
        pushNotification: true,
        emailNotification: true,
        whatsAppNotification: true,
        weeklySummary: false,
        missionReminder: true,
      },
    });
    expect(whatsApp.statusCode).toBe(409);
    expect(whatsApp.json().error.code).toBe("WHATSAPP_NOT_AVAILABLE");

    const weekly = await app.inject({
      method: "PUT",
      url: "/v1/me/notification-preferences",
      headers: authorization,
      payload: {
        pushNotification: true,
        emailNotification: true,
        whatsAppNotification: false,
        weeklySummary: true,
        missionReminder: true,
      },
    });
    expect(weekly.statusCode).toBe(403);
    expect(weekly.json().error.code).toBe("WEEKLY_SUMMARY_REQUIRES_GROWTH");

    const notifications = await app.inject({
      method: "PUT",
      url: "/v1/me/notification-preferences",
      headers: authorization,
      payload: {
        pushNotification: true,
        emailNotification: true,
        whatsAppNotification: false,
        weeklySummary: false,
        missionReminder: true,
      },
    });
    expect(notifications.statusCode).toBe(200);
    expect(notifications.json().parent).toMatchObject({
      pushNotification: true,
      emailNotification: true,
      missionReminder: true,
      marketingConsent: false,
    });

    const consent = await app.inject({
      method: "PUT",
      url: "/v1/me/marketing-consent",
      headers: authorization,
      payload: { marketingConsent: true },
    });
    expect(consent.statusCode).toBe(200);
    expect(consent.json()).toMatchObject({
      parent: { marketingConsent: true },
      termsAcceptedAt: originalTerms,
    });

    const referred = await app.inject({
      method: "PUT",
      url: "/v1/me/referral",
      headers: authorization,
      payload: { referralCode: firstMe.json().parent.referralCode as string },
    });
    expect(referred.statusCode).toBe(200);
    expect(referred.json().parent).toMatchObject({ referralStatus: "Pending" });
    const duplicateReferral = await app.inject({
      method: "PUT",
      url: "/v1/me/referral",
      headers: authorization,
      payload: { referralCode: firstMe.json().parent.referralCode as string },
    });
    expect(duplicateReferral.statusCode).toBe(409);

    const centre = await app.inject({
      method: "GET",
      url: "/v1/notifications",
      headers: authorization,
    });
    expect(centre.statusCode).toBe(200);
    expect(centre.json().items[0]).toMatchObject({
      type: "GET_STARTED",
      action: "ADD_CHILD",
    });
    expect(centre.json().preferences).toMatchObject({
      pushNotification: true,
      emailNotification: true,
      whatsAppNotification: false,
      missionReminder: true,
    });
    await app.close();
  });

  it("does not expose another parent's assessment", async () => {
    const store = new MemoryStore();
    const app = await buildApp({ environment: testEnvironment, store });
    const first = await register(app, "first@example.com");
    const firstChild = await createChild(app, first.body.token);
    const firstAuthorization = { authorization: `Bearer ${first.body.token}` };
    await app.inject({
      method: "PUT",
      url: `/v1/children/${firstChild.child.id}/passions`,
      headers: firstAuthorization,
      payload: { passionIds: ["PAS011"] },
    });
    const started = await app.inject({
      method: "POST",
      url: `/v1/children/${firstChild.child.id}/assessments`,
      headers: firstAuthorization,
    });
    const second = await register(app, "second@example.com");
    const forbidden = await app.inject({
      method: "GET",
      url: `/v1/assessments/${started.json().assessment.id as string}`,
      headers: { authorization: `Bearer ${second.body.token}` },
    });
    expect(forbidden.statusCode).toBe(404);
    await app.close();
  });
});
