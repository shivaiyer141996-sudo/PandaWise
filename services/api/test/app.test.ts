import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import type { Environment } from "../src/config/env.js";
import { MemoryStore } from "../src/repositories/memory-store.js";

const testEnvironment: Environment = {
  NODE_ENV: "test",
  HOST: "127.0.0.1",
  PORT: 8080,
  LOG_LEVEL: "silent",
  ALLOWED_ORIGINS: "*",
  DATA_PROVIDER: "memory",
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

describe("PandaWise API", () => {
  it("reports health and bootstrap configuration", async () => {
    const app = await buildApp({ environment: testEnvironment, store: new MemoryStore() });
    const health = await app.inject({ method: "GET", url: "/health" });
    const bootstrap = await app.inject({ method: "GET", url: "/v1/config/bootstrap" });

    expect(health.statusCode).toBe(200);
    expect(health.json()).toMatchObject({ status: "ok", service: "pandawise-api" });
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
