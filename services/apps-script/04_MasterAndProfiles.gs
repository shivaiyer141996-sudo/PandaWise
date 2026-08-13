function pwPlanFromRow_(row) {
  var maxChildren = pwText_(row, 'Max_Children');
  return {
    planId: pwText_(row, 'Plan_ID'),
    planName: pwText_(row, 'Plan_Name'),
    positioning: pwText_(row, 'Plan_Positioning'),
    monthlyPriceInr: pwNumber_(pwCell_(row, 'Monthly_Price_INR')),
    annualPriceInr: pwNumber_(pwCell_(row, 'Annual_Price_INR')),
    maxChildren: maxChildren === 'Unlimited' ? null : pwNumber_(maxChildren),
    includedAssessmentsPerYear: pwNumber_(pwCell_(row, 'Included_Assessments_Per_Year')),
    questionCount: pwNumber_(pwCell_(row, 'Question_Count')),
    skillsVisible: pwNumber_(pwCell_(row, 'Skills_Visible')),
    missionsPerSkill: pwNumber_(pwCell_(row, 'Missions_Per_Skill')),
    journeyLengthDays: pwNumber_(pwCell_(row, 'Journey_Length_Days')),
    passionInsightsLevel: pwText_(row, 'Passion_Insights_Level'),
    growScoreEnabled: pwBoolean_(pwCell_(row, 'GrowScore_Enabled')),
    growthTrackerEnabled: pwBoolean_(pwCell_(row, 'Growth_Tracker_Enabled')),
    growthTimelineEnabled: pwBoolean_(pwCell_(row, 'Growth_Timeline_Enabled')),
    assessmentHistoryAccess: pwText_(row, 'Assessment_History_Access'),
    assessmentComparison: pwText_(row, 'Assessment_Comparison'),
    weeklySummaryEnabled: pwBoolean_(pwCell_(row, 'Weekly_Summary_Enabled')),
    monthlyReportEnabled: pwBoolean_(pwCell_(row, 'Monthly_Report_Enabled')),
    advancedAnalyticsEnabled: pwBoolean_(pwCell_(row, 'Advanced_Analytics_Enabled')),
    parentGuidanceLevel: pwText_(row, 'Parent_Guidance_Level'),
    prioritySupport: pwText_(row, 'Priority_Support'),
    reportExport: pwText_(row, 'Report_Export'),
    multiLanguageLevel: pwText_(row, 'Multi_Language_Level'),
    displayOrder: pwNumber_(pwCell_(row, 'Display_Order')),
    recommended: pwBoolean_(pwCell_(row, 'Recommended_Flag')),
    trialDays: pwNumber_(pwCell_(row, 'Trial_Days'))
  };
}

function pwPlanRows_() {
  return pwActiveRows_(PW_TABS.subscriptions, ['Plan_ID', 'Plan_Name']).filter(function (row) {
    return pwText_(row, 'Plan_ID');
  }).map(pwPlanFromRow_).sort(function (left, right) {
    return left.displayOrder - right.displayOrder;
  });
}

function pwPlan_(planId) {
  var plan = pwPlanRows_().filter(function (candidate) { return candidate.planId === planId; })[0];
  pwAssert_(plan, 'WORKBOOK_CONTRACT_ERROR', 'Subscription plan is not configured: ' + planId, 503);
  return plan;
}

function pwBootstrap_() {
  var avatarText = pwRequiredConfigText_('AVATAR_OPTIONS');
  return {
    ageGroups: pwOptionRows_(PW_TABS.ageGroups, 'Age_Group_ID', 'Age_Group_Name', {
      respondentMode: 'Respondent_Mode',
      minAgeYears: 'Min_Age_Years',
      maxAgeYears: 'Max_Age_Years'
    }),
    languages: pwOptionRows_(PW_TABS.languages, 'Language_ID', 'Language_Name', {
      isoCode: 'ISO_Code',
      rtl: 'RTL_Flag'
    }),
    schools: pwOptionRows_(PW_TABS.schools, 'School_ID', 'School_Name', {
      city: 'City', area: 'Area', board: 'Board', schoolType: 'School_Type'
    }),
    grades: pwOptionRows_(PW_TABS.grades, 'Grade_ID', 'Grade_Name', {
      ageGroupId: 'Age_Group_ID', stage: 'School_Stage'
    }),
    skills: pwOptionRows_(PW_TABS.skills, 'Skill_ID', 'Skill_Name', {
      weight: 'Weight_Percent', colour: 'Colour_Hex', description: 'Description'
    }),
    passions: pwOptionRows_(PW_TABS.passions, 'Passion_ID', 'Passion_Name', {
      category: 'Category', ageGroupEligibility: 'Age_Group_Eligibility',
      indoorOutdoor: 'Indoor_Outdoor', participationMode: 'Participation_Mode',
      thinkingStyle: 'Thinking_Style'
    }),
    badges: pwOptionRows_(PW_TABS.badges, 'Badge_ID', 'Badge_Name', {
      category: 'Badge_Category', description: 'Description', triggerEvent: 'Trigger_Event',
      triggerThreshold: 'Trigger_Threshold', ageGroupEligibility: 'Age_Group_ID'
    }),
    parentTypes: pwValidationOptions_(PW_TABS.parents, 'Parent_Type'),
    genders: pwValidationOptions_(PW_TABS.children, 'Gender'),
    timeCommitments: pwValidationOptions_(PW_TABS.parents, 'Daily_Time_Commitment'),
    avatars: avatarText.split('|').filter(Boolean).map(function (id) {
      return { id: id, name: id.replace(/^pando-/, '').replace(/-/g, ' ') };
    })
  };
}

function pwBadgeLevels_() {
  var levels = pwRequiredConfigText_('CHILD_BADGE_LEVEL_OPTIONS').split('|').filter(Boolean);
  pwAssert_(levels.length > 0, 'WORKBOOK_CONTRACT_ERROR',
    'CHILD_BADGE_LEVEL_OPTIONS must contain at least one level', 503);
  return levels;
}

function pwAdvanceBadgeLevel_(current) {
  var levels = pwBadgeLevels_();
  var index = levels.indexOf(String(current || ''));
  return levels[Math.min(index < 0 ? 0 : index + 1, levels.length - 1)];
}

function pwCalculateAge_(dateOfBirth) {
  pwAssert_(/^\d{4}-\d{2}-\d{2}$/.test(String(dateOfBirth || '')),
    'VALIDATION_ERROR', 'Enter a valid date of birth');
  var dob = new Date(String(dateOfBirth) + 'T00:00:00.000Z');
  pwAssert_(!isNaN(dob.getTime()) && dob.getUTCDate() === Number(String(dateOfBirth).slice(8, 10)),
    'VALIDATION_ERROR', 'Enter a valid date of birth');
  var today = new Date();
  var age = today.getUTCFullYear() - dob.getUTCFullYear();
  var birthdayPassed = today.getUTCMonth() > dob.getUTCMonth() ||
    (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() >= dob.getUTCDate());
  if (!birthdayPassed) age -= 1;
  return age;
}

function pwAgeGroupForAge_(age) {
  var groups = pwActiveRows_(PW_TABS.ageGroups, [
    'Age_Group_ID', 'Min_Age_Years', 'Max_Age_Years', 'Max_Age_Inclusive_Flag'
  ]).sort(function (left, right) {
    return pwNumber_(pwCell_(left, 'Display_Order')) - pwNumber_(pwCell_(right, 'Display_Order'));
  });
  var group = groups.filter(function (row) {
    var min = pwNumber_(pwCell_(row, 'Min_Age_Years'));
    var max = pwNumber_(pwCell_(row, 'Max_Age_Years'));
    return age >= min && (pwBoolean_(pwCell_(row, 'Max_Age_Inclusive_Flag')) ? age <= max : age < max);
  })[0];
  pwAssert_(group, 'AGE_NOT_SUPPORTED', 'PandaWise Release 1 supports children aged 3–12', 400);
  return pwText_(group, 'Age_Group_ID');
}

function pwChildFromRow_(row) {
  if (!row) return null;
  var interests = pwText_(row, 'Known_Interests');
  var scoreText = pwText_(row, 'Current_GrowScore');
  return {
    id: pwText_(row, 'Child_ID'),
    parentId: pwText_(row, 'Parent_ID'),
    name: pwText_(row, 'Child_Name'),
    nickname: pwText_(row, 'Nickname') || null,
    avatarId: pwText_(row, 'Avatar_ID') || null,
    dateOfBirth: pwText_(row, 'Date_of_Birth'),
    ageYears: pwNumber_(pwCell_(row, 'Age_Years')),
    ageGroupId: pwText_(row, 'Age_Group_ID'),
    gender: pwText_(row, 'Gender'),
    schoolId: pwText_(row, 'School_ID') || null,
    gradeId: pwText_(row, 'Grade_ID') || null,
    languageId: pwText_(row, 'Language_ID'),
    knownInterests: interests ? interests.split('|').filter(Boolean) : [],
    parentTimeCommitment: pwText_(row, 'Parent_Time_Commitment_Code'),
    currentPlanId: pwText_(row, 'Current_Plan_ID'),
    assessmentStatus: pwText_(row, 'Assessment_Status') || 'Not Started',
    journeyStatus: pwText_(row, 'Journey_Status') || 'Not Started',
    assessmentCount: pwNumber_(pwCell_(row, 'Assessment_Count')),
    journeyCount: pwNumber_(pwCell_(row, 'Journey_Count')),
    currentGrowScore: scoreText === '' ? null : pwNumber_(scoreText),
    currentBadgeLevel: pwText_(row, 'Current_Badge_Level') || pwBadgeLevels_()[0],
    currentStreak: pwNumber_(pwCell_(row, 'Current_Streak')),
    recordStatus: pwText_(row, 'Record_Status') || 'Active',
    createdAt: pwText_(row, 'Created_At'),
    updatedAt: pwText_(row, 'Updated_At')
  };
}

function pwChildren_(parentId) {
  return pwRows_(PW_TABS.children, ['Child_ID', 'Parent_ID', 'Record_Status'])
    .filter(function (row) {
      return pwText_(row, 'Parent_ID') === parentId && pwText_(row, 'Record_Status') === 'Active';
    }).map(pwChildFromRow_);
}

function pwChild_(parentId, childId) {
  var row = pwRows_(PW_TABS.children, ['Child_ID', 'Parent_ID']).filter(function (candidate) {
    return pwText_(candidate, 'Child_ID') === childId &&
      pwText_(candidate, 'Parent_ID') === parentId && pwText_(candidate, 'Record_Status') !== 'Deleted';
  })[0];
  pwAssert_(row, 'NOT_FOUND', 'Child was not found', 404);
  return pwChildFromRow_(row);
}

function pwCreateChild_(parent, body) {
  var input = body || {};
  var bootstrap = pwBootstrap_();
  var age = pwCalculateAge_(input.dateOfBirth);
  var groupId = pwAgeGroupForAge_(age);
  var schoolId = pwOptionalString_(input.schoolId, 80);
  var gradeId = pwOptionalString_(input.gradeId, 80);
  var languageId = pwOneOf_(input.languageId,
    bootstrap.languages.map(function (item) { return item.id; }), 'language');
  if (schoolId) pwOneOf_(schoolId, bootstrap.schools.map(function (item) { return item.id; }), 'school');
  if (gradeId) pwOneOf_(gradeId, bootstrap.grades.map(function (item) { return item.id; }), 'grade');
  var avatarId = pwOptionalString_(input.avatarId, 80);
  if (avatarId) pwOneOf_(avatarId, bootstrap.avatars.map(function (item) { return item.id; }), 'avatar');
  var interests = pwUnique_(input.knownInterests || []).slice(0, 5);
  pwAssert_((input.knownInterests || []).length <= 5, 'VALIDATION_ERROR', 'Choose up to five interests');

  return pwWithWriteLock_(function () {
    var plan = pwPlan_(parent.subscriptionPlanId);
    var existing = pwChildren_(parent.id);
    pwAssert_(plan.maxChildren == null || existing.length < plan.maxChildren,
      'CHILD_LIMIT_REACHED', 'Your current plan has reached its child-profile limit', 403);
    var timestamp = pwIsoNow_();
    var childId = pwId_('CHD');
    pwAppend_(PW_TABS.children, {
      Child_ID: childId,
      Parent_ID: parent.id,
      Child_Name: pwRequiredString_(input.name, 'name', 2, 100),
      Nickname: pwOptionalString_(input.nickname, 60),
      Avatar_ID: avatarId,
      Date_of_Birth: input.dateOfBirth,
      Age_Years: age,
      Age_Group_ID: groupId,
      Gender: pwOneOf_(input.gender, bootstrap.genders, 'gender'),
      School_ID: schoolId,
      Grade_ID: gradeId,
      Language_ID: languageId,
      Known_Interests: interests,
      Parent_Time_Commitment_Code: pwOneOf_(input.parentTimeCommitment,
        bootstrap.timeCommitments, 'time commitment'),
      Current_Plan_ID: parent.subscriptionPlanId,
      Assessment_Status: 'Not Started',
      Journey_Status: 'Not Started',
      Assessment_Count: 0,
      Journey_Count: 0,
      Current_GrowScore: '',
      Current_Badge_Level: pwBadgeLevels_()[0],
      Current_Streak: 0,
      Record_Status: 'Active',
      Created_At: timestamp,
      Updated_At: timestamp,
      Created_By: parent.id,
      Updated_By: parent.id
    });
    pwAudit_('PARENT', parent.id, 'CHILD', childId, 'CREATE', { ageGroupId: groupId }, 'SUCCESS', 'Child profile created');
    return { child: pwChild_(parent.id, childId) };
  });
}

function pwUpdateParentProfile_(parent, body) {
  var input = body || {};
  var bootstrap = pwBootstrap_();
  var updated = {
    name: pwRequiredString_(input.name, 'name', 2, 100),
    parentType: pwOneOf_(input.parentType, bootstrap.parentTypes, 'parent type'),
    mobileNumber: pwRequiredString_(input.mobileNumber, 'mobileNumber', 8, 20),
    preferredLanguageId: pwOneOf_(input.preferredLanguageId,
      bootstrap.languages.map(function (item) { return item.id; }), 'language'),
    dailyTimeCommitment: pwOneOf_(input.dailyTimeCommitment,
      bootstrap.timeCommitments, 'time commitment')
  };
  return pwWithWriteLock_(function () {
    var timestamp = pwIsoNow_();
    pwUpdateRow_(PW_TABS.parents, 'Parent_ID', parent.id, {
      Parent_Name: updated.name,
      Parent_Type: updated.parentType,
      Mobile_Number: updated.mobileNumber,
      Preferred_Language_ID: updated.preferredLanguageId,
      Daily_Time_Commitment: updated.dailyTimeCommitment,
      Updated_At: timestamp
    });
    pwAudit_('PARENT', parent.id, 'PARENT', parent.id, 'UPDATE', updated, 'SUCCESS', 'Profile updated');
    return { parent: pwPublicParent_(pwParentById_(parent.id)) };
  });
}

function pwUpdateNotifications_(parent, body) {
  var input = body || {};
  pwAssert_(!pwBoolean_(input.whatsAppNotification), 'WHATSAPP_NOT_AVAILABLE',
    'WhatsApp notifications are reserved for a future release', 409);
  var plan = pwPlan_(parent.subscriptionPlanId);
  pwAssert_(!pwBoolean_(input.weeklySummary) || plan.weeklySummaryEnabled,
    'WEEKLY_SUMMARY_REQUIRES_GROWTH', 'Weekly summaries are available on Growth and Mastery plans', 403);
  return pwWithWriteLock_(function () {
    pwUpdateRow_(PW_TABS.parents, 'Parent_ID', parent.id, {
      Push_Notification: pwBoolean_(input.pushNotification),
      Email_Notification: pwBoolean_(input.emailNotification),
      WhatsApp_Notification: false,
      Weekly_Summary: pwBoolean_(input.weeklySummary),
      Mission_Reminder: pwBoolean_(input.missionReminder),
      Updated_At: pwIsoNow_()
    });
    return { parent: pwPublicParent_(pwParentById_(parent.id)) };
  });
}

function pwChangePlan_(parent, body) {
  var plan = pwPlan_(pwRequiredString_((body || {}).planId, 'planId', 1, 40));
  return pwWithWriteLock_(function () {
    var children = pwChildren_(parent.id);
    pwAssert_(plan.maxChildren == null || children.length <= plan.maxChildren,
      'CONFLICT', 'This plan does not support the current number of child profiles', 409);
    var currentYear = new Date().getUTCFullYear();
    var used = children.reduce(function (count, child) {
      return count + pwAssessments_(child.id).filter(function (assessment) {
        return new Date(assessment.startedAt).getUTCFullYear() === currentYear;
      }).length;
    }, 0);
    pwAssert_(used <= plan.includedAssessmentsPerYear, 'CONFLICT',
      'This family has already used more Development Checks than the selected plan includes', 409);
    var timestamp = pwIsoNow_();
    pwUpdateRow_(PW_TABS.parents, 'Parent_ID', parent.id, {
      Subscription_Plan_ID: plan.planId,
      Subscription_Start_Date: timestamp.slice(0, 10),
      Weekly_Summary: plan.weeklySummaryEnabled ? parent.weeklySummary : false,
      Updated_At: timestamp
    });
    children.forEach(function (child) {
      pwUpdateRow_(PW_TABS.children, 'Child_ID', child.id, {
        Current_Plan_ID: plan.planId,
        Updated_At: timestamp
      });
    });
    return { parent: pwPublicParent_(pwParentById_(parent.id)), plan: plan };
  });
}

function pwApplyReferral_(parent, body) {
  pwAssert_(!parent.referredBy, 'CONFLICT', 'A referral code has already been applied to this account', 409);
  var code = pwRequiredString_((body || {}).referralCode, 'referralCode', 4, 40).toUpperCase();
  var referrerRow = pwRows_(PW_TABS.parents, ['Parent_ID', 'Referral_Code']).filter(function (row) {
    return pwText_(row, 'Referral_Code').toUpperCase() === code;
  })[0];
  pwAssert_(referrerRow && pwText_(referrerRow, 'Parent_ID') !== parent.id,
    'REFERRAL_CODE_INVALID', 'Enter a valid referral code');
  return pwWithWriteLock_(function () {
    pwUpdateRow_(PW_TABS.parents, 'Parent_ID', parent.id, {
      Referred_By: code,
      Referral_Status: 'Pending',
      Updated_At: pwIsoNow_()
    });
    return { parent: pwPublicParent_(pwParentById_(parent.id)) };
  });
}

function pwNotifications_(parent) {
  var items = [];
  var children = pwChildren_(parent.id);
  if (children.length === 0) {
    items.push({ id: 'WELCOME_ADD_CHILD', type: 'GET_STARTED', title: 'Begin your PandaWise journey',
      message: 'Add a child profile when your family is ready.', action: 'ADD_CHILD', createdAt: parent.createdAt });
  }
  children.forEach(function (child) {
    var name = child.nickname || child.name;
    if (child.assessmentStatus === 'Not Started') {
      items.push({ id: 'CHECK_' + child.id, type: 'DEVELOPMENT_CHECK',
        title: name + "'s growth baseline is ready to begin",
        message: 'Start with Passion Discovery, then complete the Development Check.',
        childId: child.id, action: 'START_DISCOVERY', createdAt: child.updatedAt });
    } else if (child.assessmentStatus === 'Reassessment Due') {
      items.push({ id: 'REASSESS_' + child.id, type: 'REASSESSMENT',
        title: name + ' is ready for a new growth snapshot',
        message: 'The journey gate is complete. Reassess when it feels comfortable.',
        childId: child.id, action: 'START_REASSESSMENT', createdAt: child.updatedAt });
    } else if (child.journeyStatus === 'Active') {
      items.push({ id: 'MISSION_' + child.id, type: 'MISSION_REMINDER',
        title: name + "'s next mission is available",
        message: 'A short, consistent activity is enough for today.',
        childId: child.id, action: 'OPEN_JOURNEY', createdAt: child.updatedAt });
    }
  });
  items.sort(function (left, right) { return String(right.createdAt).localeCompare(String(left.createdAt)); });
  return { items: items };
}
