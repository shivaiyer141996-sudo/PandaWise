function pwMissionFromRow_(row) {
  return {
    id: pwText_(row, 'Mission_ID'), skillId: pwText_(row, 'Skill_ID'),
    ageGroupId: pwText_(row, 'Age_Group_ID'), name: pwText_(row, 'Mission_Name'),
    description: pwText_(row, 'Mission_Description'), difficulty: pwText_(row, 'Difficulty_Level'),
    durationMinutes: pwNumber_(pwCell_(row, 'Duration_Minutes')),
    materialsNeeded: pwText_(row, 'Materials_Needed') || 'None',
    parentGuidance: pwText_(row, 'Parent_Guidance'),
    childInstructions: pwText_(row, 'Child_Instructions'),
    learningOutcome: pwText_(row, 'Learning_Outcome'),
    points: pwNumber_(pwCell_(row, 'Mission_Points')),
    repeatable: pwBoolean_(pwCell_(row, 'Repeatable_Flag')),
    indoorOutdoor: pwText_(row, 'Indoor_Outdoor') || 'BOTH',
    planEligibility: pwText_(row, 'Plan_Eligibility') || 'ALL',
    category: pwText_(row, 'Mission_Category'),
    displayOrder: pwNumber_(pwCell_(row, 'Display_Order'))
  };
}

function pwMissions_(ageGroupId) {
  return pwActiveRows_(PW_TABS.missions, [
    'Mission_ID', 'Skill_ID', 'Age_Group_ID', 'Mission_Name', 'Mission_Description'
  ]).filter(function (row) {
    return pwText_(row, 'Age_Group_ID') === ageGroupId;
  }).map(pwMissionFromRow_).sort(function (left, right) { return left.displayOrder - right.displayOrder; });
}

function pwRecommendationRules_(ageGroupId) {
  return pwActiveRows_(PW_TABS.recommendationRules, [
    'Rule_ID', 'Age_Group_ID', 'Skill_ID', 'Min_Score', 'Max_Score', 'Recommended_Difficulty'
  ]).filter(function (row) {
    return pwText_(row, 'Age_Group_ID') === 'ALL' || pwText_(row, 'Age_Group_ID') === ageGroupId;
  }).map(function (row) {
    return {
      id: pwText_(row, 'Rule_ID'), ageGroupId: pwText_(row, 'Age_Group_ID'),
      skillId: pwText_(row, 'Skill_ID'), minScore: pwNumber_(pwCell_(row, 'Min_Score')),
      maxScore: pwNumber_(pwCell_(row, 'Max_Score')), scoreBand: pwText_(row, 'Score_Band'),
      priorityRank: pwNumber_(pwCell_(row, 'Priority_Rank')),
      recommendedDifficulty: pwText_(row, 'Recommended_Difficulty'),
      missionCategory: pwText_(row, 'Mission_Category') || 'ANY',
      focusPercent: pwNumber_(pwCell_(row, 'Focus_Percent')),
      parentMessageTemplate: pwText_(row, 'Parent_Message_Template'),
      excludeCompletedWithinDays: pwNumber_(pwCell_(row, 'Exclude_Completed_Within_Days'), 42),
      minimumJourneyCompletionPercent: pwNumber_(pwCell_(row, 'Minimum_Journey_Completion_Percent'), 70)
    };
  });
}

function pwJourneyFromRow_(row) {
  if (!row) return null;
  var rawStatus = pwText_(row, 'Journey_Status');
  var statusKey = rawStatus.toUpperCase().replace(/\s+/g, '_');
  var statusLabels = {
    PLANNED: 'Planned', ACTIVE: 'Active', PAUSED: 'Paused',
    COMPLETED: 'Completed', ABANDONED: 'Abandoned'
  };
  return {
    id: pwText_(row, 'Journey_ID'), childId: pwText_(row, 'Child_ID'),
    sourceAssessmentId: pwText_(row, 'Source_Assessment_ID'), planId: pwText_(row, 'Plan_ID'),
    startDate: pwText_(row, 'Start_Date'), plannedEndDate: pwText_(row, 'Planned_End_Date'),
    actualEndDate: pwText_(row, 'Actual_End_Date') || null,
    status: statusLabels[statusKey] || rawStatus,
    currentDay: pwNumber_(pwCell_(row, 'Current_Day'), 1),
    missionsPlanned: pwNumber_(pwCell_(row, 'Missions_Planned')),
    missionsCompleted: pwNumber_(pwCell_(row, 'Missions_Completed')),
    completionPercent: pwNumber_(pwCell_(row, 'Completion_Percent')),
    reassessmentUnlocked: pwBoolean_(pwCell_(row, 'Reassessment_Unlocked_Flag')),
    createdAt: pwText_(row, 'Created_At'), updatedAt: pwText_(row, 'Updated_At'),
    version: pwText_(row, 'Journey_Version') || '1.0'
  };
}

function pwJourneys_(childId) {
  return pwRows_(PW_TABS.journeys, ['Journey_ID', 'Child_ID', 'Journey_Status'])
    .filter(function (row) { return pwText_(row, 'Child_ID') === childId; })
    .map(pwJourneyFromRow_).sort(function (left, right) {
      return String(left.createdAt).localeCompare(String(right.createdAt));
    });
}

function pwJourney_(journeyId) {
  var journey = pwJourneyFromRow_(pwFindRow_(PW_TABS.journeys, 'Journey_ID', journeyId));
  pwAssert_(journey, 'NOT_FOUND', 'Journey was not found', 404);
  return journey;
}

function pwOwnedJourney_(parent, journeyId) {
  var journey = pwJourney_(journeyId);
  return { journey: journey, child: pwChild_(parent.id, journey.childId) };
}

function pwScheduleFromRow_(row) {
  return {
    id: pwText_(row, 'Schedule_ID'), journeyId: pwText_(row, 'Journey_ID'),
    childId: pwText_(row, 'Child_ID'), missionId: pwText_(row, 'Mission_ID'),
    day: pwNumber_(pwCell_(row, 'Journey_Day')), week: pwNumber_(pwCell_(row, 'Journey_Week')),
    scheduledDate: pwText_(row, 'Scheduled_Date'), status: pwText_(row, 'Schedule_Status'),
    unlocked: pwBoolean_(pwCell_(row, 'Unlocked_Flag')),
    prioritySource: pwText_(row, 'Priority_Source'), skillId: pwText_(row, 'Skill_ID'),
    completionId: pwText_(row, 'Completion_ID') || null,
    generatedAt: pwText_(row, 'Generated_At'), createdBy: pwText_(row, 'Created_By'),
    updatedAt: pwText_(row, 'Updated_At'), notes: pwText_(row, 'Notes') || null
  };
}

function pwSchedules_(journeyId) {
  return pwRows_(PW_TABS.missionScheduler, ['Schedule_ID', 'Journey_ID', 'Mission_ID'])
    .filter(function (row) { return pwText_(row, 'Journey_ID') === journeyId; })
    .map(pwScheduleFromRow_).sort(function (left, right) { return left.day - right.day; });
}

function pwCompletionFromRow_(row) {
  return {
    id: pwText_(row, 'Completion_ID'), journeyId: pwText_(row, 'Journey_ID'),
    scheduleId: pwText_(row, 'Schedule_ID'), childId: pwText_(row, 'Child_ID'),
    missionId: pwText_(row, 'Mission_ID'), status: pwText_(row, 'Completion_Status'),
    enjoymentScore: pwNumber_(pwCell_(row, 'Enjoyment_Score')),
    difficultyFeedback: pwText_(row, 'Difficulty_Feedback'),
    parentNotes: pwText_(row, 'Parent_Notes') || null, completedAt: pwText_(row, 'Completed_At'),
    pointsAwarded: pwNumber_(pwCell_(row, 'Mission_Points_Awarded')),
    streakDay: pwNumber_(pwCell_(row, 'Streak_Day')), createdAt: pwText_(row, 'Created_At')
  };
}

function pwCompletions_(childId) {
  return pwRows_(PW_TABS.missionCompletion, ['Completion_ID', 'Child_ID', 'Schedule_ID'])
    .filter(function (row) {
      return pwText_(row, 'Child_ID') === childId && pwText_(row, 'Record_Status') === 'Active';
    }).map(pwCompletionFromRow_).sort(function (left, right) {
      return String(left.completedAt).localeCompare(String(right.completedAt));
    });
}

function pwPlanAllowsMission_(plan, mission, allPlans) {
  var eligibility = mission.planEligibility;
  if (eligibility === 'ALL') return true;
  var sorted = allPlans.slice().sort(function (left, right) { return left.displayOrder - right.displayOrder; });
  var currentIndex = sorted.map(function (item) { return item.planId; }).indexOf(plan.planId);
  if (eligibility === 'GROWTH_AND_MASTERY') return currentIndex >= 1;
  if (eligibility === 'MASTERY') return currentIndex === sorted.length - 1;
  return eligibility.split('|').indexOf(plan.planId) >= 0;
}

function pwLimitMissionsPerSkill_(missions, limit) {
  var counts = {};
  return missions.filter(function (mission) {
    var count = counts[mission.skillId] || 0;
    if (count >= limit) return false;
    counts[mission.skillId] = count + 1;
    return true;
  });
}

function pwMaxMinutes_(timeCommitment, scheduledDate) {
  if (timeCommitment !== 'WEEKENDS_ONLY') return Number(String(timeCommitment).split('_')[0]);
  var day = new Date(String(scheduledDate) + 'T00:00:00.000Z').getUTCDay();
  return day === 0 || day === 6 ? 30 : 10;
}

function pwDesiredDifficulty_(rule, week) {
  var value = rule ? rule.recommendedDifficulty : 'EASY';
  if (value === 'EASY_TO_MEDIUM') return week === 1 ? 'EASY' : 'MEDIUM';
  if (value === 'MEDIUM_TO_HARD') return week === 1 ? 'MEDIUM' : 'HARD';
  return value;
}

function pwChooseMission_(input) {
  var maxMinutes = pwMaxMinutes_(input.timeCommitment, input.scheduledDate);
  var candidates = input.missions.filter(function (mission) {
    return mission.skillId === input.skillId && mission.durationMinutes <= maxMinutes;
  });
  if (candidates.length === 0) candidates = input.missions.filter(function (mission) {
    return mission.skillId === input.skillId;
  });
  pwAssert_(candidates.length > 0, 'MISSION_CONTENT_INVALID',
    'Mission content is missing for a configured skill', 503);
  var difficulty = pwDesiredDifficulty_(input.rule, input.week);
  var scored = candidates.map(function (mission) {
    var haystack = (mission.name + ' ' + mission.description + ' ' + mission.category).toLowerCase();
    var passionFit = input.passionTerms.some(function (term) {
      return term.length > 2 && haystack.indexOf(term) >= 0;
    });
    return {
      mission: mission, passionFit: passionFit,
      score: (input.recentMissionIds[mission.id] ? 0 : 100) +
        (input.usedMissionIds[mission.id] ? 0 : 30) +
        (mission.difficulty === difficulty ? 25 : 0) + (passionFit ? 10 : 0) -
        Math.abs(maxMinutes - mission.durationMinutes)
    };
  }).sort(function (left, right) {
    return right.score - left.score || left.mission.displayOrder - right.mission.displayOrder;
  });
  var selected = scored[0];
  var isParentFocus = input.focusSkillIds.indexOf(input.skillId) >= 0;
  var prioritySource = isParentFocus ? 'PARENT_FOCUS'
    : selected.passionFit ? 'PASSION' : 'ASSESSMENT';
  var reasons = [prioritySource, 'SCORE_' + (input.score ? input.score.scoreBand : 'UNKNOWN'),
    selected.passionFit ? 'PASSION_FIT' : 'AGE_FIT', 'TIME_' + maxMinutes + '_MIN',
    'DIFFICULTY_' + selected.mission.difficulty];
  return { mission: selected.mission, prioritySource: prioritySource,
    reasonNotes: reasons.join('|') };
}

function pwCreateJourney_(parent, childId, body) {
  var child = pwChild_(parent.id, childId);
  var active = pwJourneys_(childId).filter(function (journey) {
    return journey.status === 'Active' || journey.status === 'Paused';
  })[0];
  if (active) return pwJourneyView_(parent, active.id);
  var assessment = pwAssessments_(childId).filter(function (candidate) {
    return candidate.status === 'Completed';
  }).sort(function (left, right) { return right.sequence - left.sequence; })[0];
  pwAssert_(assessment, 'DEVELOPMENT_CHECK_REQUIRED',
    'Complete the Development Check before building a journey', 409);
  if (assessment.journeyId) return pwJourneyView_(parent, assessment.journeyId);
  var scores = pwSkillScores_(assessment.id);
  pwAssert_(scores.length > 0, 'GROWSCORE_REQUIRED',
    'GrowScore results are required before building a journey', 409);
  var focusIds = pwUnique_((body || {}).focusSkillIds || []);
  var configuredMax = pwRequiredConfigNumber_('PARENT_FOCUS_MAX_SELECTIONS');
  var validSkills = scores.map(function (score) { return score.skillId; });
  pwAssert_(focusIds.length >= 1 && focusIds.length <= configuredMax &&
    focusIds.every(function (id) { return validSkills.indexOf(id) >= 0; }),
    'FOCUS_AREAS_INVALID', 'Choose between one and ' + configuredMax + ' GrowScore focus areas');

  var plan = pwPlan_(parent.subscriptionPlanId);
  var allPlans = pwPlanRows_();
  var missions = pwLimitMissionsPerSkill_(pwMissions_(child.ageGroupId).filter(function (mission) {
    return pwPlanAllowsMission_(plan, mission, allPlans);
  }), plan.missionsPerSkill);
  pwAssert_(missions.length > 0, 'MISSION_CONTENT_UNAVAILABLE',
    'Mission content is not available for this age group and plan', 503);
  var rules = pwRecommendationRules_(child.ageGroupId);
  var bootstrap = pwBootstrap_();
  var passionMap = {};
  bootstrap.passions.forEach(function (passion) { passionMap[passion.id] = passion; });
  var passionTerms = [];
  pwPassions_(child.id).forEach(function (id) {
    var passion = passionMap[id];
    if (passion) passionTerms = passionTerms.concat([String(passion.name).toLowerCase(),
      String(passion.category || '').toLowerCase()].filter(Boolean));
  });
  var scoreMap = {};
  scores.forEach(function (score) { scoreMap[score.skillId] = score; });
  var ruleMap = {};
  scores.forEach(function (score) {
    ruleMap[score.skillId] = rules.filter(function (rule) {
      return rule.skillId === score.skillId && score.normalizedScore >= rule.minScore &&
        score.normalizedScore <= rule.maxScore;
    })[0] || null;
  });
  var ordered = scores.slice().sort(function (left, right) {
    var leftFocus = focusIds.indexOf(left.skillId) >= 0 ? 0 : 1;
    var rightFocus = focusIds.indexOf(right.skillId) >= 0 ? 0 : 1;
    return leftFocus - rightFocus || left.normalizedScore - right.normalizedScore;
  });
  var rotation = ordered.map(function (score) { return score.skillId; }).concat(focusIds, focusIds);
  var exclusionDays = Math.max.apply(null, [0].concat(rules.map(function (rule) {
    return rule.excludeCompletedWithinDays;
  })));
  var cutoff = Date.now() - exclusionDays * 86400000;
  var recent = {};
  pwCompletions_(child.id).filter(function (completion) {
    return Date.parse(completion.completedAt) >= cutoff;
  }).forEach(function (completion) { recent[completion.missionId] = true; });
  var used = {};
  var timestamp = pwIsoNow_();
  var startDate = timestamp.slice(0, 10);
  var journeyId = pwId_('JRN');
  var days = plan.journeyLengthDays;
  pwAssert_(days > 0, 'WORKBOOK_CONTRACT_ERROR',
    'Subscription plan journey length must be greater than zero', 503);
  var schedules = [];
  for (var day = 1; day <= days; day += 1) {
    var skillId = rotation[(day - 1) % rotation.length];
    var week = Math.ceil(day / 7);
    var scheduledDate = pwAddDays_(startDate, day - 1);
    var choice = pwChooseMission_({ missions: missions, skillId: skillId, score: scoreMap[skillId],
      rule: ruleMap[skillId], focusSkillIds: focusIds, passionTerms: passionTerms,
      recentMissionIds: recent, usedMissionIds: used,
      timeCommitment: child.parentTimeCommitment, scheduledDate: scheduledDate, week: week });
    used[choice.mission.id] = true;
    schedules.push({ id: pwId_('SCH'), journeyId: journeyId, childId: child.id,
      missionId: choice.mission.id, day: day, week: week, scheduledDate: scheduledDate,
      status: day === 1 ? 'AVAILABLE' : 'PLANNED', unlocked: day === 1,
      prioritySource: choice.prioritySource, skillId: skillId, generatedAt: timestamp,
      createdBy: parent.id, updatedAt: timestamp, notes: choice.reasonNotes });
  }
  return pwWithWriteLock_(function () {
    pwAppend_(PW_TABS.journeys, {
      Journey_ID: journeyId, Child_ID: child.id, Source_Assessment_ID: assessment.id,
      Plan_ID: plan.planId, Start_Date: startDate, Planned_End_Date: pwAddDays_(startDate, days - 1),
      Actual_End_Date: '', Journey_Status: 'ACTIVE', Current_Day: 1,
      Missions_Planned: days, Missions_Completed: 0, Completion_Percent: 0,
      Reassessment_Unlocked_Flag: false, Created_At: timestamp, Updated_At: timestamp,
      Journey_Version: '1.0'
    });
    pwAppendMany_(PW_TABS.missionScheduler, schedules.map(function (schedule) {
      return {
        Schedule_ID: schedule.id, Journey_ID: journeyId, Child_ID: child.id,
        Mission_ID: schedule.missionId, Journey_Day: schedule.day, Journey_Week: schedule.week,
        Scheduled_Date: schedule.scheduledDate, Schedule_Status: schedule.status,
        Unlocked_Flag: schedule.unlocked, Priority_Source: schedule.prioritySource,
        Skill_ID: schedule.skillId, Completion_ID: '', Generated_At: timestamp,
        Created_By: parent.id, Updated_At: timestamp, Notes: schedule.notes
      };
    }));
    pwUpdateRow_(PW_TABS.assessments, 'Assessment_ID', assessment.id, {
      Journey_ID: journeyId, Updated_At: timestamp
    });
    pwUpdateRow_(PW_TABS.children, 'Child_ID', child.id, {
      Journey_Status: 'Active', Updated_At: timestamp, Updated_By: parent.id
    });
    pwAudit_('PARENT', parent.id, 'JOURNEY', journeyId, 'GENERATE',
      { days: days, focusSkillIds: focusIds }, 'SUCCESS', 'Journey generated from Sheet masters');
    return pwJourneyView_(parent, journeyId);
  });
}

function pwAvailableSchedule_(schedules, completions) {
  var completed = {};
  completions.forEach(function (completion) { completed[completion.scheduleId] = true; });
  var today = pwIsoNow_().slice(0, 10);
  return schedules.filter(function (schedule) {
    return !completed[schedule.id] && schedule.scheduledDate <= today;
  }).sort(function (left, right) { return left.day - right.day; })[0] || null;
}

function pwPublicMission_(mission) {
  return {
    id: mission.id, skillId: mission.skillId, name: mission.name,
    description: mission.description, difficulty: mission.difficulty,
    durationMinutes: mission.durationMinutes, materialsNeeded: mission.materialsNeeded,
    parentGuidance: mission.parentGuidance, childInstructions: mission.childInstructions,
    learningOutcome: mission.learningOutcome, points: mission.points,
    indoorOutdoor: mission.indoorOutdoor, category: mission.category
  };
}

function pwReasonView_(source) {
  var labels = { PARENT_FOCUS: 'Chosen parent focus area',
    ASSESSMENT: 'Suggested from the GrowScore profile',
    PASSION: 'Connected to a selected passion',
    BALANCE: 'Balanced across the growth journey',
    GROWSCORE_PRIORITY: 'Selected from the GrowScore profile',
    PASSION_FIT: 'Connected to a selected passion', AGE_FIT: "Matched to the child's age group" };
  return String(source || '').split('|').map(function (value) {
    return labels[value] || value.replace(/_/g, ' ').toLowerCase();
  });
}

function pwJourneyView_(parent, journeyId) {
  var owned = pwOwnedJourney_(parent, journeyId);
  var schedules = pwSchedules_(journeyId);
  var completions = pwCompletions_(owned.child.id).filter(function (completion) {
    return completion.journeyId === journeyId;
  });
  var visible = pwAvailableSchedule_(schedules, completions);
  var missions = {};
  pwMissions_(owned.child.ageGroupId).forEach(function (mission) { missions[mission.id] = mission; });
  var mission = visible ? missions[visible.missionId] : null;
  var completionBySchedule = {};
  completions.forEach(function (completion) { completionBySchedule[completion.scheduleId] = completion; });
  var enjoymentRange = pwValidationNumberRange_(PW_TABS.missionCompletion, 'Enjoyment_Score');
  return {
    journey: { id: owned.journey.id, childId: owned.journey.childId,
      sourceAssessmentId: owned.journey.sourceAssessmentId, planId: owned.journey.planId,
      startDate: owned.journey.startDate, plannedEndDate: owned.journey.plannedEndDate,
      actualEndDate: owned.journey.actualEndDate, status: owned.journey.status,
      currentDay: owned.journey.currentDay, missionsPlanned: owned.journey.missionsPlanned,
      missionsCompleted: owned.journey.missionsCompleted,
      completionPercent: owned.journey.completionPercent,
      reassessmentUnlocked: owned.journey.reassessmentUnlocked, version: owned.journey.version },
    child: { id: owned.child.id, name: owned.child.name, nickname: owned.child.nickname },
    progress: { currentDay: owned.journey.currentDay, planned: owned.journey.missionsPlanned,
      completed: owned.journey.missionsCompleted,
      completionPercent: owned.journey.completionPercent, streak: owned.child.currentStreak },
    schedules: schedules.map(function (schedule) { return {
      id: schedule.id, day: schedule.day, week: schedule.week,
      scheduledDate: schedule.scheduledDate, status: visible && schedule.id === visible.id ? 'AVAILABLE' : schedule.status,
      unlocked: Boolean(visible && schedule.id === visible.id),
      feedbackSubmitted: Boolean(completionBySchedule[schedule.id])
    }; }),
    today: visible && mission ? { scheduleId: visible.id, day: visible.day, week: visible.week,
      scheduledDate: visible.scheduledDate, reason: pwReasonView_(visible.prioritySource),
      mission: pwPublicMission_(mission) } : null,
    reassessment: { unlocked: owned.journey.reassessmentUnlocked,
      requirement: 'Complete the journey with the configured minimum mission completion' },
    feedbackOptions: {
      completionStatuses: pwValidationOptions_(PW_TABS.missionCompletion, 'Completion_Status'),
      difficultyOptions: pwValidationOptions_(PW_TABS.missionCompletion, 'Difficulty_Feedback'),
      countedStatuses: pwRequiredConfigText_('MISSION_COUNTED_STATUSES').split('|').filter(Boolean),
      enjoymentMin: enjoymentRange.min,
      enjoymentMax: enjoymentRange.max
    }
  };
}

function pwCompleteMission_(parent, journeyId, scheduleId, body) {
  var owned = pwOwnedJourney_(parent, journeyId);
  pwAssert_(owned.journey.status === 'Active', 'JOURNEY_NOT_ACTIVE', 'This journey is not active', 409);
  var schedules = pwSchedules_(journeyId);
  var schedule = schedules.filter(function (candidate) { return candidate.id === scheduleId; })[0];
  pwAssert_(schedule, 'NOT_FOUND', 'Mission schedule was not found', 404);
  var allCompletions = pwCompletions_(owned.child.id);
  var journeyCompletions = allCompletions.filter(function (completion) {
    return completion.journeyId === journeyId;
  });
  if (journeyCompletions.some(function (completion) { return completion.scheduleId === scheduleId; })) {
    return pwJourneyView_(parent, journeyId);
  }
  var available = pwAvailableSchedule_(schedules, journeyCompletions);
  pwAssert_(available && available.id === scheduleId, 'MISSION_LOCKED',
    'Complete the currently available mission before continuing', 409);
  var mission = pwMissions_(owned.child.ageGroupId).filter(function (candidate) {
    return candidate.id === schedule.missionId;
  })[0];
  pwAssert_(mission, 'NOT_FOUND', 'Mission was not found', 404);
  var statuses = pwValidationOptions_(PW_TABS.missionCompletion, 'Completion_Status');
  var difficulties = pwValidationOptions_(PW_TABS.missionCompletion, 'Difficulty_Feedback');
  var status = pwOneOf_((body || {}).status, statuses, 'mission status');
  var enjoymentRange = pwValidationNumberRange_(PW_TABS.missionCompletion, 'Enjoyment_Score');
  var enjoyment = pwInteger_((body || {}).enjoymentScore, 'enjoyment score',
    enjoymentRange.min, enjoymentRange.max);
  var difficulty = pwOneOf_((body || {}).difficultyFeedback, difficulties, 'difficulty');
  var timestamp = pwIsoNow_();
  var countedStatuses = pwRequiredConfigText_('MISSION_COUNTED_STATUSES').split('|').filter(Boolean);
  var fullStatus = pwRequiredConfigText_('MISSION_FULL_STATUS');
  var partialStatus = pwRequiredConfigText_('MISSION_PARTIAL_STATUS');
  var partialPointsPercent = pwRequiredConfigNumber_('MISSION_PARTIAL_POINTS_PERCENT');
  pwAssert_(partialPointsPercent >= 0 && partialPointsPercent <= 100,
    'WORKBOOK_CONTRACT_ERROR', 'MISSION_PARTIAL_POINTS_PERCENT must be between 0 and 100', 503);
  var counts = countedStatuses.indexOf(status) >= 0;
  var streak = counts ? owned.child.currentStreak + 1 : 0;
  var points = status === fullStatus ? mission.points
    : status === partialStatus ? Math.round(mission.points * partialPointsPercent / 100) : 0;
  var answeredCount = journeyCompletions.length + 1;
  var completedCount = journeyCompletions.filter(function (completion) {
    return countedStatuses.indexOf(completion.status) >= 0;
  }).length + (counts ? 1 : 0);
  var completionPercent = pwRound_((completedCount / owned.journey.missionsPlanned) * 100);
  var complete = answeredCount >= owned.journey.missionsPlanned;
  var minimum = pwRequiredConfigNumber_('REASSESSMENT_MIN_COMPLETION_PERCENT');
  var unlocked = complete && completionPercent >= minimum;
  return pwWithWriteLock_(function () {
    var completionId = pwId_('CMP');
    pwAppend_(PW_TABS.missionCompletion, {
      Completion_ID: completionId, Journey_ID: journeyId, Schedule_ID: scheduleId,
      Child_ID: owned.child.id, Mission_ID: mission.id, Completion_Status: status,
      Enjoyment_Score: enjoyment, Difficulty_Feedback: difficulty,
      Parent_Notes: pwOptionalString_((body || {}).parentNotes, 500), Completed_At: timestamp,
      Mission_Points_Awarded: points, Streak_Day: streak, Submission_Source: 'PARENT',
      Record_Status: 'Active', Created_At: timestamp, Updated_At: timestamp
    });
    pwUpdateRow_(PW_TABS.missionScheduler, 'Schedule_ID', scheduleId, {
      Schedule_Status: counts ? 'COMPLETED' : 'SKIPPED', Unlocked_Flag: false,
      Completion_ID: completionId, Updated_At: timestamp
    });
    pwUpdateRow_(PW_TABS.journeys, 'Journey_ID', journeyId, {
      Actual_End_Date: complete ? timestamp.slice(0, 10) : '',
      Journey_Status: complete ? 'COMPLETED' : 'ACTIVE',
      Current_Day: Math.min(schedule.day + 1, owned.journey.missionsPlanned),
      Missions_Completed: completedCount, Completion_Percent: completionPercent,
      Reassessment_Unlocked_Flag: unlocked, Updated_At: timestamp
    });
    pwUpdateRow_(PW_TABS.children, 'Child_ID', owned.child.id, {
      Assessment_Status: unlocked ? 'Reassessment Due' : owned.child.assessmentStatus,
      Journey_Status: complete ? 'Completed' : 'Active',
      Journey_Count: complete ? owned.child.journeyCount + 1 : owned.child.journeyCount,
      Current_Badge_Level: complete
        ? pwAdvanceBadgeLevel_(owned.child.currentBadgeLevel) : owned.child.currentBadgeLevel,
      Current_Streak: streak, Updated_At: timestamp, Updated_By: parent.id
    });
    pwAudit_('PARENT', parent.id, 'MISSION_COMPLETION', completionId, 'COMPLETE',
      { journeyId: journeyId, scheduleId: scheduleId, status: status }, 'SUCCESS', 'Mission feedback');
    return pwJourneyView_(parent, journeyId);
  });
}

function pwWeeklySummary_(parent, journeyId, week) {
  var owned = pwOwnedJourney_(parent, journeyId);
  var plan = pwPlan_(parent.subscriptionPlanId);
  pwAssert_(plan.weeklySummaryEnabled, 'WEEKLY_SUMMARY_REQUIRES_GROWTH',
    'Weekly reflections are available on Growth and Mastery plans', 403);
  var schedules = pwSchedules_(journeyId).filter(function (schedule) { return schedule.week === week; });
  pwAssert_(schedules.length > 0, 'NOT_FOUND', 'Journey week was not found', 404);
  var scheduleIds = {};
  schedules.forEach(function (schedule) { scheduleIds[schedule.id] = schedule; });
  var completions = pwCompletions_(owned.child.id).filter(function (completion) {
    return completion.journeyId === journeyId && scheduleIds[completion.scheduleId];
  });
  pwAssert_(completions.length === schedules.length, 'WEEKLY_SUMMARY_LOCKED',
    'The weekly summary appears after all daily check-ins', 409);
  var countedStatuses = pwRequiredConfigText_('MISSION_COUNTED_STATUSES').split('|').filter(Boolean);
  var successful = completions.filter(function (completion) {
    return countedStatuses.indexOf(completion.status) >= 0;
  });
  var skillCounts = {};
  completions.forEach(function (completion) {
    var skill = scheduleIds[completion.scheduleId].skillId;
    skillCounts[skill] = (skillCounts[skill] || 0) + 1;
  });
  var leading = Object.keys(skillCounts).sort(function (left, right) {
    return skillCounts[right] - skillCounts[left];
  })[0];
  var skillMap = {};
  pwBootstrap_().skills.forEach(function (skill) { skillMap[skill.id] = skill; });
  return {
    journeyId: journeyId, week: week, days: schedules.length, completed: successful.length,
    completionPercent: pwRound_((successful.length / schedules.length) * 100),
    totalPoints: completions.reduce(function (total, completion) { return total + completion.pointsAwarded; }, 0),
    averageEnjoyment: pwRound_(completions.reduce(function (total, completion) {
      return total + completion.enjoymentScore;
    }, 0) / completions.length),
    mostPracticedSkill: leading ? { skillId: leading, name: skillMap[leading] ? skillMap[leading].name : leading } : null,
    streak: owned.child.currentStreak,
    message: successful.length >= Math.ceil(schedules.length * 0.7)
      ? 'A steady week of growth—celebrate the effort and keep the routine gentle.'
      : 'Every check-in helps. Choose a comfortable pace and begin again tomorrow.'
  };
}

function pwProgress_(parent, childId) {
  var child = pwChild_(parent.id, childId);
  var plan = pwPlan_(parent.subscriptionPlanId);
  var assessments = pwAssessments_(childId).filter(function (item) {
    return item.status === 'Completed';
  }).sort(function (left, right) { return left.sequence - right.sequence; });
  var latest = assessments[assessments.length - 1] || null;
  var previous = plan.assessmentComparison === 'None' ? null : assessments[assessments.length - 2] || null;
  var journeys = pwJourneys_(childId);
  var latestJourney = journeys.slice().sort(function (left, right) {
    return String(right.createdAt).localeCompare(String(left.createdAt));
  })[0] || null;
  var completions = latestJourney ? pwCompletions_(childId).filter(function (completion) {
    return completion.journeyId === latestJourney.id;
  }) : [];
  var history = plan.assessmentHistoryAccess === 'Latest Only' ? assessments.slice(-1) : assessments;
  var scoreSets = assessments.map(function (assessment) {
    return { assessment: assessment, scores: pwSkillScores_(assessment.id) };
  });
  var skillMap = {};
  pwBootstrap_().skills.forEach(function (skill) { skillMap[skill.id] = skill; });
  var visibleSets = plan.assessmentComparison === 'Full History' ? scoreSets : scoreSets.slice(-2);
  var skillIds = {};
  visibleSets.forEach(function (set) { set.scores.forEach(function (score) { skillIds[score.skillId] = true; }); });
  var trends = plan.growthTrackerEnabled ? Object.keys(skillIds).map(function (skillId) {
    var points = [];
    visibleSets.forEach(function (set) {
      var score = set.scores.filter(function (candidate) { return candidate.skillId === skillId; })[0];
      if (score) points.push({ assessmentId: set.assessment.id, sequence: set.assessment.sequence,
        completedAt: set.assessment.completedAt, score: score.normalizedScore });
    });
    var current = points[points.length - 1] ? points[points.length - 1].score : 0;
    var old = points[points.length - 2] ? points[points.length - 2].score : null;
    return { skillId: skillId, name: skillMap[skillId] ? skillMap[skillId].name : skillId,
      colour: skillMap[skillId] ? String(skillMap[skillId].colour || '#2563EB') : '#2563EB',
      latestScore: current, changeFromPrevious: old == null ? null : pwRound_(current - old), points: points };
  }).sort(function (left, right) { return left.name.localeCompare(right.name); }) : [];
  var change = latest && previous ? pwRound_(latest.overallGrowScore - previous.overallGrowScore) : null;
  var active = journeys.filter(function (journey) {
    return journey.status === 'Active' || journey.status === 'Paused';
  })[0] || null;
  var latestLinked = latest ? journeys.filter(function (journey) {
    return journey.sourceAssessmentId === latest.id;
  })[0] : null;
  var canReassess = Boolean(latestLinked && latestLinked.reassessmentUnlocked);
  var canStartJourney = Boolean(latest && !latest.journeyId && !active);
  return {
    child: { id: child.id, name: child.name, nickname: child.nickname },
    entitlements: { planId: plan.planId, planName: plan.planName,
      growthTrackerEnabled: plan.growthTrackerEnabled,
      assessmentHistoryAccess: plan.assessmentHistoryAccess,
      assessmentComparison: plan.assessmentComparison,
      advancedAnalyticsEnabled: plan.advancedAnalyticsEnabled },
    assessmentSnapshot: { latestAssessmentId: latest ? latest.id : null,
      latestGrowScore: latest ? latest.overallGrowScore : null,
      previousGrowScore: previous ? previous.overallGrowScore : null,
      changeFromPrevious: change, completedAt: latest ? latest.completedAt : null,
      scoreBand: latest ? latest.scoreBand : null,
      comparisonAvailable: Boolean(previous),
      message: !latest ? 'Complete the Development Check to establish a growth baseline.'
        : change == null ? 'This GrowScore is the current assessment baseline.'
        : change > 0 ? 'GrowScore has increased by ' + change + ' points since the previous check.'
        : change < 0 ? 'Growth can vary over time. Use the latest profile to choose gentle next steps.'
        : 'GrowScore is steady. Mission activity remains a separate measure of practice.' },
    activitySnapshot: latestJourney ? { journeyId: latestJourney.id, status: latestJourney.status,
      missionsPlanned: latestJourney.missionsPlanned, missionsCompleted: latestJourney.missionsCompleted,
      completionPercent: latestJourney.completionPercent, streak: child.currentStreak,
      points: completions.reduce(function (total, completion) { return total + completion.pointsAwarded; }, 0) }
      : { journeyId: null, status: 'Not Started', missionsPlanned: 0, missionsCompleted: 0,
        completionPercent: 0, streak: child.currentStreak, points: 0 },
    skillTrends: trends,
    assessmentHistory: history.slice().reverse().map(function (assessment) {
      var journey = journeys.filter(function (item) { return item.sourceAssessmentId === assessment.id; })[0] || null;
      var oldAssessment = assessments.filter(function (item) { return item.sequence === assessment.sequence - 1; })[0] || null;
      return { assessmentId: assessment.id, sequence: assessment.sequence,
        completedAt: assessment.completedAt, growScore: assessment.overallGrowScore,
        scoreBand: assessment.scoreBand,
        changeFromPrevious: plan.assessmentComparison === 'None' || !oldAssessment ? null
          : pwRound_(assessment.overallGrowScore - oldAssessment.overallGrowScore),
        journey: journey ? { id: journey.id, status: journey.status,
          completionPercent: journey.completionPercent } : null };
    }),
    actions: { canReassess: canReassess, canStartJourney: canStartJourney,
      nextAction: !latest ? 'DEVELOPMENT_CHECK' : active ? 'CONTINUE_JOURNEY'
        : canReassess ? 'REASSESS' : !latest.journeyId ? 'START_JOURNEY' : 'VIEW_PROGRESS' }
  };
}
