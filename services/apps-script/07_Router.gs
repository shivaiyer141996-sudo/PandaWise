function pwUpdateMarketing_(parent, body) {
  return pwWithWriteLock_(function () {
    pwUpdateRow_(PW_TABS.parents, 'Parent_ID', parent.id, {
      Marketing_Consent: pwBoolean_((body || {}).marketingConsent),
      Updated_At: pwIsoNow_()
    });
    return { parent: pwPublicParent_(pwParentById_(parent.id)), termsAcceptedAt: parent.termsAcceptedAt };
  });
}

function pwCurrentJourney_(parent, childId) {
  pwChild_(parent.id, childId);
  var journeys = pwJourneys_(childId).slice().sort(function (left, right) {
    return String(right.createdAt).localeCompare(String(left.createdAt));
  });
  var current = journeys.filter(function (journey) {
    return journey.status === 'Active' || journey.status === 'Paused';
  })[0] || journeys[0];
  pwAssert_(current, 'NOT_FOUND', 'Journey was not found', 404);
  return pwJourneyView_(parent, current.id);
}

function pwLatestReportForRoute_(parent, childId) {
  return pwLatestReport_(parent, childId);
}

function pwDispatch_(request) {
  var route = pwNormalizeRoute_(request.route);
  var method = String(request.method || 'GET').toUpperCase();
  var body = request.payload || {};

  if (route === '/health') {
    return { status: 'ok', service: 'pandawise-apps-script', version: PW_VERSION };
  }
  if (route === '/ready') return readinessCheck_();
  if (route === '/v1/config/bootstrap') return { version: '1.0', data: pwBootstrap_() };
  if (route === '/v1/auth/register' && method === 'POST') return pwRegister_(body);
  if (route === '/v1/auth/login' && method === 'POST') return pwLogin_(body);
  if (route === '/v1/auth/forgot-password' && method === 'POST') {
    pwEmail_(body.email);
    return { message: 'If an active PandaWise account matches, reset instructions will be sent.' };
  }

  var parent = pwRequireParent_(request.token);
  if (route === '/v1/me' && method === 'GET') return { parent: pwPublicParent_(parent) };
  if (route === '/v1/plans' && method === 'GET') {
    return { currentPlanId: parent.subscriptionPlanId, billingMode: 'MANUAL_V1',
      paymentGatewayEnabled: false, plans: pwPlanRows_() };
  }
  if (route === '/v1/me/subscription' && method === 'PUT') return pwChangePlan_(parent, body);
  if (route === '/v1/me/profile' && method === 'PUT') return pwUpdateParentProfile_(parent, body);
  if (route === '/v1/me/notification-preferences' && method === 'PUT') {
    return pwUpdateNotifications_(parent, body);
  }
  if (route === '/v1/me/marketing-consent' && method === 'PUT') return pwUpdateMarketing_(parent, body);
  if (route === '/v1/me/referral' && method === 'PUT') return pwApplyReferral_(parent, body);
  if (route === '/v1/notifications' && method === 'GET') return pwNotifications_(parent);

  if (route === '/v1/missions' && method === 'GET') {
    var missionChild = pwChild_(parent.id,
      pwRequiredString_(body.childId, 'childId', 1, 80));
    var missionPlan = pwPlan_(parent.subscriptionPlanId);
    return { missions: pwLimitMissionsPerSkill_(
      pwMissions_(missionChild.ageGroupId).filter(function (mission) {
        return pwPlanAllowsMission_(missionPlan, mission, pwPlanRows_());
      }), missionPlan.missionsPerSkill).map(pwPublicMission_) };
  }
  if (route === '/v1/assessment/start' && method === 'POST') {
    return pwStartAssessment_(parent, pwRequiredString_(body.childId, 'childId', 1, 80));
  }
  if (route === '/v1/assessment/save' && method === 'POST') {
    return pwSaveResponse_(parent,
      pwRequiredString_(body.assessmentId, 'assessmentId', 1, 80),
      pwRequiredString_(body.questionId, 'questionId', 1, 80), body);
  }
  if (route === '/v1/assessment/submit' && method === 'POST') {
    return pwCompleteAssessment_(parent,
      pwRequiredString_(body.assessmentId, 'assessmentId', 1, 80));
  }
  if (route === '/v1/report' && method === 'GET') {
    return body.assessmentId
      ? pwAssessmentReport_(parent,
        pwRequiredString_(body.assessmentId, 'assessmentId', 1, 80))
      : pwLatestReportForRoute_(parent,
        pwRequiredString_(body.childId, 'childId', 1, 80));
  }

  if (route === '/v1/children' && method === 'GET') return { children: pwChildren_(parent.id) };
  if (route === '/v1/children' && method === 'POST') return pwCreateChild_(parent, body);

  var match = route.match(/^\/v1\/children\/([^/]+)$/);
  if (match && method === 'GET') return { child: pwChild_(parent.id, match[1]) };
  match = route.match(/^\/v1\/children\/([^/]+)\/passions$/);
  if (match && method === 'GET') {
    pwChild_(parent.id, match[1]);
    return { passionIds: pwPassions_(match[1]) };
  }
  if (match && method === 'PUT') return pwSelectPassions_(parent, match[1], body);
  match = route.match(/^\/v1\/children\/([^/]+)\/assessments$/);
  if (match && method === 'POST') return pwStartAssessment_(parent, match[1]);
  match = route.match(/^\/v1\/children\/([^/]+)\/growscore\/latest$/);
  if (match && method === 'GET') return pwLatestReportForRoute_(parent, match[1]);
  match = route.match(/^\/v1\/children\/([^/]+)\/journeys$/);
  if (match && method === 'POST') return pwCreateJourney_(parent, match[1], body);
  match = route.match(/^\/v1\/children\/([^/]+)\/journeys\/current$/);
  if (match && method === 'GET') return pwCurrentJourney_(parent, match[1]);
  match = route.match(/^\/v1\/children\/([^/]+)\/progress$/);
  if (match && method === 'GET') return pwProgress_(parent, match[1]);
  if (route === '/v1/dashboard' && method === 'GET') {
    return pwProgress_(parent, pwRequiredString_(body.childId, 'childId', 1, 80));
  }

  match = route.match(/^\/v1\/assessments\/([^/]+)$/);
  if (match && method === 'GET') return pwAssessmentView_(parent, match[1]);
  match = route.match(/^\/v1\/assessments\/([^/]+)\/responses\/([^/]+)$/);
  if (match && method === 'PUT') return pwSaveResponse_(parent, match[1], match[2], body);
  match = route.match(/^\/v1\/assessments\/([^/]+)\/complete$/);
  if (match && method === 'POST') return pwCompleteAssessment_(parent, match[1]);
  match = route.match(/^\/v1\/assessments\/([^/]+)\/report$/);
  if (match && method === 'GET') return pwAssessmentReport_(parent, match[1]);

  match = route.match(/^\/v1\/journeys\/([^/]+)$/);
  if (match && method === 'GET') return pwJourneyView_(parent, match[1]);
  match = route.match(/^\/v1\/journeys\/([^/]+)\/schedules\/([^/]+)\/completion$/);
  if (match && method === 'PUT') return pwCompleteMission_(parent, match[1], match[2], body);
  match = route.match(/^\/v1\/journeys\/([^/]+)\/weekly-summary\/(\d+)$/);
  if (match && method === 'GET') return pwWeeklySummary_(parent, match[1], Number(match[2]));

  throw new PwError('ROUTE_NOT_FOUND', 'The requested PandaWise route was not found', 404);
}
