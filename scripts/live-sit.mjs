import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const baseUrl = String(process.env.PANDAWISE_APPS_SCRIPT_URL || '').trim();
if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(baseUrl)) {
  throw new Error('Set PANDAWISE_APPS_SCRIPT_URL to the deployed Apps Script /exec URL.');
}
if (!process.argv.includes('--confirm-fictional-live-writes')) {
  throw new Error('Pass --confirm-fictional-live-writes to acknowledge disposable Sheet test rows.');
}

const evidence = [];
const created = {};

function pass(id, detail) {
  evidence.push({ id, status: 'PASS', detail });
}

async function api(route, method = 'GET', token = '', payload = {}) {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ route, method, ...(token ? { token } : {}), payload }),
    redirect: 'follow',
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${route} returned non-JSON content`);
  }
  if (!json.ok) {
    const error = new Error(`${route}: ${json.error?.code || 'UNKNOWN'} - ${json.error?.message || 'Request failed'}`);
    error.code = json.error?.code;
    error.apiMessage = json.error?.message;
    throw error;
  }
  return json.data;
}

async function expectApiError(id, expectedCode, action) {
  try {
    await action();
    assert.fail(`Expected ${expectedCode}`);
  } catch (error) {
    assert.equal(error.code, expectedCode, error.message);
    pass(id, expectedCode);
  }
}

const stamp = `${Date.now()}-${randomUUID().slice(0, 6)}`;
const email = `pw.sit.${stamp}@example.com`;
const password = 'PandaSit1';
const mobile = `91${String(Date.now()).slice(-8)}`;

const health = await api('/health');
assert.equal(health.status, 'ok');
pass('SIT-001', 'Health JSON');

const ready = await api('/ready');
assert.equal(ready.status, 'ready');
assert.equal(ready.tabCount, 23);
pass('SIT-002', 'Workbook ready with 23 tabs');

const bootstrapResponse = await api('/v1/config/bootstrap');
const bootstrap = bootstrapResponse.data;
assert.ok(bootstrap.schools.length > 0);
assert.ok(bootstrap.ageGroups.length === 3);
assert.ok(bootstrap.skills.length === 10);
pass('SIT-003', 'Sheet-backed masters loaded');

await expectApiError('SIT-004', 'VALIDATION_ERROR', () => api(
  '/v1/auth/register',
  'POST',
  '',
  {
    name: 'Panda SIT Parent',
    parentType: bootstrap.parentTypes[0],
    mobileNumber: mobile,
    email: `weak.${email}`,
    password: 'weakpass',
    termsAccepted: true,
    marketingConsent: false,
  },
));

const registrationPayload = {
  name: 'Panda SIT Parent',
  parentType: bootstrap.parentTypes[0],
  mobileNumber: mobile,
  email,
  password,
  termsAccepted: true,
  marketingConsent: false,
};
const auth = await api('/v1/auth/register', 'POST', '', registrationPayload);
assert.ok(auth.token);
assert.equal(auth.parent.email, email);
created.parentId = auth.parent.id;
let token = auth.token;
pass('SIT-005', 'Fictional parent registered');

await expectApiError('SIT-006', 'CONFLICT', () =>
  api('/v1/auth/register', 'POST', '', registrationPayload));
await expectApiError('SIT-007', 'UNAUTHORIZED', () =>
  api('/v1/auth/login', 'POST', '', { email, password: 'WrongPass1' }));

const login = await api('/v1/auth/login', 'POST', '', { email, password });
token = login.token;
assert.equal(login.parent.id, created.parentId);
pass('SIT-008', 'Login returned an owned session');

const me = await api('/v1/me', 'GET', token);
assert.equal(me.parent.id, created.parentId);
pass('SIT-009', 'Parent profile loaded');

const plans = await api('/v1/plans', 'GET', token);
assert.equal(plans.currentPlanId, 'PLN001');
assert.equal(plans.paymentGatewayEnabled, false);
pass('SIT-010', 'Explorer plan is Sheet-driven');

const dob = `${new Date().getUTCFullYear() - 4}-04-15`;
const languageId = bootstrap.languages[0].id;
const childResult = await api('/v1/children', 'POST', token, {
  name: 'Panda SIT Child',
  nickname: 'Pattu SIT',
  dateOfBirth: dob,
  gender: bootstrap.genders[0],
  languageId,
  knownInterests: ['Drawing', 'Music', 'Reading'],
  parentTimeCommitment: '10_MIN',
});
const child = childResult.child;
created.childId = child.id;
assert.equal(child.ageGroupId, 'AG01');
pass('SIT-011', 'Eligible child created in AG01');

const children = await api('/v1/children', 'GET', token);
assert.equal(children.children.length, 1);
assert.equal(children.children[0].id, child.id);
pass('SIT-012', 'Only owned child is listed');

await expectApiError('SIT-013', 'CHILD_LIMIT_REACHED', () =>
  api('/v1/children', 'POST', token, {
    name: 'Second SIT Child',
    dateOfBirth: dob,
    gender: bootstrap.genders[0],
    languageId,
    parentTimeCommitment: '10_MIN',
  }));
await expectApiError('SIT-014', 'NOT_FOUND', () =>
  api('/v1/children/CHD-NOT-OWNED', 'GET', token));
await expectApiError('SIT-015', 'PASSION_DISCOVERY_REQUIRED', () =>
  api(`/v1/children/${child.id}/assessments`, 'POST', token));

const passionIds = bootstrap.passions
  .filter((passion) => {
    const eligibility = String(passion.ageGroupEligibility || 'ALL');
    return eligibility === 'ALL' || eligibility.split('|').includes(child.ageGroupId);
  })
  .slice(0, 4)
  .map((passion) => passion.id);
assert.equal(passionIds.length, 4);

const selected = await api(`/v1/children/${child.id}/passions`, 'PUT', token, { passionIds });
assert.deepEqual(selected.passionIds, passionIds);
const selectedRead = await api(`/v1/children/${child.id}/passions`, 'GET', token);
assert.deepEqual(selectedRead.passionIds, passionIds);
pass('SIT-016', 'Four passion ranks saved and read back');

let assessment = await api(`/v1/children/${child.id}/assessments`, 'POST', token);
created.assessmentId = assessment.assessment.id;
assert.equal(assessment.assessment.status, 'In Progress');
assert.equal(assessment.questions.length, assessment.assessment.questionCount);
pass('SIT-017', `${assessment.questions.length} Sheet-backed questions started`);

const firstQuestion = assessment.questions[0];
await api(
  `/v1/assessments/${assessment.assessment.id}/responses/${firstQuestion.id}`,
  'PUT',
  token,
  { optionId: firstQuestion.options[0].id },
);
assessment = await api(`/v1/assessments/${assessment.assessment.id}`, 'GET', token);
assert.equal(assessment.progress.answered, 1);
assert.equal(assessment.questions[0].selectedOptionId, firstQuestion.options[0].id);
pass('SIT-018', 'Answer autosave and resume restored progress');

await expectApiError('SIT-019', 'ASSESSMENT_INCOMPLETE', () =>
  api(`/v1/assessments/${assessment.assessment.id}/complete`, 'POST', token));

for (const [index, question] of assessment.questions.entries()) {
  if (index === 0) continue;
  const option = question.options[index % question.options.length];
  await api(
    `/v1/assessments/${assessment.assessment.id}/responses/${question.id}`,
    'PUT',
    token,
    { optionId: option.id },
  );
}
const report = await api(`/v1/assessments/${assessment.assessment.id}/complete`, 'POST', token);
assert.ok(Number.isFinite(report.growScore));
assert.ok(report.skills.length > 0);
pass('SIT-020', 'Development Check completed and GrowScore calculated');

const reportRead = await api(`/v1/assessments/${assessment.assessment.id}/report`, 'GET', token);
assert.equal(reportRead.growScore, report.growScore);
const latestReport = await api(`/v1/children/${child.id}/growscore/latest`, 'GET', token);
assert.equal(latestReport.assessment.id, assessment.assessment.id);
pass('SIT-021', 'Assessment and latest reports agree');

const focusSkillIds = report.recommendedFocusAreas.slice(0, 1).map((skill) => skill.skillId);
const journey = await api(`/v1/children/${child.id}/journeys`, 'POST', token, { focusSkillIds });
created.journeyId = journey.journey.id;
assert.equal(journey.journey.status, 'Active');
assert.equal(journey.journey.missionsPlanned, 21);
assert.equal(journey.schedules.length, 21);
assert.ok(journey.today);
pass('SIT-022', 'A 21-day journey was generated');

const future = journey.schedules.find((schedule) => schedule.id !== journey.today.scheduleId);
await expectApiError('SIT-023', 'MISSION_LOCKED', () => api(
  `/v1/journeys/${journey.journey.id}/schedules/${future.id}/completion`,
  'PUT',
  token,
  { status: 'YES', enjoymentScore: 5, difficultyFeedback: 'MEDIUM' },
));

const mission = await api(
  `/v1/journeys/${journey.journey.id}/schedules/${journey.today.scheduleId}/completion`,
  'PUT',
  token,
  { status: 'YES', enjoymentScore: 5, difficultyFeedback: 'MEDIUM', parentNotes: 'Fictional SIT check-in.' },
);
assert.equal(mission.progress.completed, 1);
pass('SIT-024', 'Day-one mission feedback saved once');

const repeatedMission = await api(
  `/v1/journeys/${journey.journey.id}/schedules/${journey.today.scheduleId}/completion`,
  'PUT',
  token,
  { status: 'YES', enjoymentScore: 5, difficultyFeedback: 'MEDIUM' },
);
assert.equal(repeatedMission.progress.completed, 1);
pass('SIT-025', 'Mission retry remained idempotent');

await expectApiError('SIT-026', 'WEEKLY_SUMMARY_REQUIRES_GROWTH', () =>
  api(`/v1/journeys/${journey.journey.id}/weekly-summary/1`, 'GET', token));

const progress = await api(`/v1/children/${child.id}/progress`, 'GET', token);
assert.equal(progress.activitySnapshot.missionsCompleted, 1);
assert.equal(progress.assessmentSnapshot.latestGrowScore, report.growScore);
pass('SIT-027', 'Dashboard separates assessment and mission activity');

const notifications = await api('/v1/notifications', 'GET', token);
assert.ok(Array.isArray(notifications.items));
pass('SIT-028', 'Notification centre loaded');

const profile = await api('/v1/me/profile', 'PUT', token, {
  name: 'Panda SIT Parent Updated',
  parentType: bootstrap.parentTypes[0],
  mobileNumber: mobile,
  preferredLanguageId: languageId,
  dailyTimeCommitment: '10_MIN',
});
assert.equal(profile.parent.name, 'Panda SIT Parent Updated');
pass('SIT-029', 'Parent profile CRUD persisted');

const preferences = await api('/v1/me/notification-preferences', 'PUT', token, {
  pushNotification: true,
  emailNotification: true,
  whatsAppNotification: false,
  weeklySummary: false,
  missionReminder: true,
});
assert.equal(preferences.parent.pushNotification, true);
assert.equal(preferences.parent.missionReminder, true);
pass('SIT-030', 'Notification preferences persisted');

await expectApiError('SIT-031', 'WHATSAPP_NOT_AVAILABLE', () =>
  api('/v1/me/notification-preferences', 'PUT', token, {
    pushNotification: true,
    emailNotification: true,
    whatsAppNotification: true,
    weeklySummary: false,
    missionReminder: true,
  }));
await expectApiError('SIT-032', 'REFERRAL_CODE_INVALID', () =>
  api('/v1/me/referral', 'PUT', token, { referralCode: auth.parent.referralCode }));

const consent = await api('/v1/me/marketing-consent', 'PUT', token, { marketingConsent: true });
assert.equal(consent.parent.marketingConsent, true);
assert.ok(consent.termsAcceptedAt);
pass('SIT-033', 'Marketing consent remains separate from Terms');

const resetKnown = await api('/v1/auth/forgot-password', 'POST', '', { email });
const resetUnknown = await api('/v1/auth/forgot-password', 'POST', '', { email: `unknown.${email}` });
assert.equal(resetKnown.message, resetUnknown.message);
pass('SIT-034', 'Password reset acknowledgement is non-enumerating');

console.log(JSON.stringify({
  result: 'PASS',
  passed: evidence.length,
  evidence,
  created,
}, null, 2));
