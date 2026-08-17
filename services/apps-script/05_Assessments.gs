function pwPassions_(childId) {
  var latest = {};
  var selectedStatuses = pwValidationOptions_(PW_TABS.childPassions, 'Passion_Status');
  pwRows_(PW_TABS.childPassions, ['Child_ID', 'Passion_ID', 'Record_Status'])
    .filter(function (row) { return pwText_(row, 'Child_ID') === childId; })
    .forEach(function (row) { latest[pwText_(row, 'Passion_ID')] = row; });
  return Object.keys(latest).map(function (key) { return latest[key]; }).filter(function (row) {
    return pwText_(row, 'Record_Status') === 'Active' &&
      selectedStatuses.indexOf(pwText_(row, 'Passion_Status')) >= 0;
  }).sort(function (left, right) {
    return pwNumber_(pwCell_(left, 'Preference_Rank')) - pwNumber_(pwCell_(right, 'Preference_Rank'));
  }).map(function (row) { return pwText_(row, 'Passion_ID'); });
}

function pwPassionStatusForRank_(rank) {
  var allowed = pwValidationOptions_(PW_TABS.childPassions, 'Passion_Status');
  var required = ['PRIMARY', 'SECONDARY', 'EMERGING'];
  pwAssert_(required.every(function (status) { return allowed.indexOf(status) >= 0; }),
    'WORKBOOK_CONTRACT_ERROR', 'Child passion status validation is incomplete', 503);
  return rank === 1 ? 'PRIMARY' : rank === 2 ? 'SECONDARY' : 'EMERGING';
}

function pwAssessmentStatusFromSheet_(value) {
  var key = String(value || '').trim().toUpperCase().replace(/\s+/g, '_');
  var labels = {
    DRAFT: 'Draft', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed',
    CANCELLED: 'Cancelled', EXPIRED: 'Expired'
  };
  return labels[key] || String(value || '').trim();
}

function pwAssessmentRespondentModeForSheet_(value) {
  var source = String(value || '').trim().toUpperCase();
  var mapped = source === 'PARENT' ? 'PARENT_ONLY' : source === 'CHILD' ? 'HYBRID' : source;
  return pwOneOf_(mapped,
    pwValidationOptions_(PW_TABS.assessments, 'Respondent_Mode'), 'respondent mode');
}

function pwPassionApplies_(passion, ageGroupId) {
  var eligibility = String(passion.ageGroupEligibility || 'ALL');
  return eligibility === 'ALL' || eligibility.split('|').indexOf(ageGroupId) >= 0;
}

function pwSelectPassions_(parent, childId, body) {
  var child = pwChild_(parent.id, childId);
  var ids = pwUnique_((body || {}).passionIds || []);
  var minimum = pwRequiredConfigNumber_('PASSION_MIN_SELECTIONS');
  var maximum = pwRequiredConfigNumber_('PASSION_MAX_SELECTIONS');
  pwAssert_(ids.length >= minimum && ids.length <= maximum,
    'PASSION_SELECTION_INVALID', 'Choose between ' + minimum + ' and ' + maximum + ' passions');
  var allowed = pwBootstrap_().passions.filter(function (passion) {
    return pwPassionApplies_(passion, child.ageGroupId);
  }).map(function (passion) { return passion.id; });
  pwAssert_(ids.every(function (id) { return allowed.indexOf(id) >= 0; }),
    'PASSION_NOT_ELIGIBLE', 'One or more passions are not available for this age group');
  return pwWithWriteLock_(function () {
    var current = pwPassions_(childId);
    var timestamp = pwIsoNow_();
    var rows = ids.map(function (passionId, index) {
      var rank = index + 1;
      return {
        Child_Passion_ID: pwId_('CPA'), Child_ID: childId, Passion_ID: passionId,
        Preference_Rank: rank, Passion_Status: pwPassionStatusForRank_(rank), Source: 'PARENT',
        Captured_At: timestamp, Assessment_ID: '', Record_Status: 'Active',
        Created_At: timestamp, Updated_At: timestamp
      };
    });
    current.filter(function (id) { return ids.indexOf(id) < 0; }).forEach(function (passionId) {
      rows.push({
        Child_Passion_ID: pwId_('CPA'), Child_ID: childId, Passion_ID: passionId,
        Preference_Rank: 0, Passion_Status: 'EMERGING', Source: 'PARENT',
        Captured_At: timestamp, Assessment_ID: '', Record_Status: 'Inactive',
        Created_At: timestamp, Updated_At: timestamp
      });
    });
    pwAppendMany_(PW_TABS.childPassions, rows);
    pwAudit_('PARENT', parent.id, 'CHILD_PASSIONS', childId, 'UPDATE', { passionIds: ids }, 'SUCCESS', 'Passion Discovery');
    return { passionIds: ids };
  });
}

function pwAssessmentFromRow_(row) {
  if (!row) return null;
  var scoreText = pwText_(row, 'Overall_GrowScore');
  return {
    id: pwText_(row, 'Assessment_ID'), childId: pwText_(row, 'Child_ID'),
    version: pwText_(row, 'Assessment_Version'), depth: pwText_(row, 'Assessment_Depth'),
    respondentMode: pwText_(row, 'Respondent_Mode'), startedAt: pwText_(row, 'Started_At'),
    completedAt: pwText_(row, 'Completed_At') || null,
    overallGrowScore: scoreText === '' ? null : pwNumber_(scoreText),
    scoreBand: pwText_(row, 'Score_Band') || null, journeyId: pwText_(row, 'Journey_ID') || null,
    questionCount: pwNumber_(pwCell_(row, 'Question_Count')),
    sequence: pwNumber_(pwCell_(row, 'Assessment_Sequence')),
    status: pwAssessmentStatusFromSheet_(pwText_(row, 'Assessment_Status')),
    createdAt: pwText_(row, 'Created_At'),
    updatedAt: pwText_(row, 'Updated_At'),
    calculationVersion: pwText_(row, 'Calculation_Version') || PW_CALCULATION_VERSION
  };
}

function pwAssessments_(childId) {
  return pwRows_(PW_TABS.assessments, ['Assessment_ID', 'Child_ID', 'Assessment_Status'])
    .filter(function (row) { return pwText_(row, 'Child_ID') === childId; })
    .map(pwAssessmentFromRow_).sort(function (left, right) { return left.sequence - right.sequence; });
}

function pwAssessment_(assessmentId) {
  var assessment = pwAssessmentFromRow_(pwFindRow_(PW_TABS.assessments, 'Assessment_ID', assessmentId));
  pwAssert_(assessment, 'NOT_FOUND', 'Assessment was not found', 404);
  return assessment;
}

function pwOwnedAssessment_(parent, assessmentId) {
  var assessment = pwAssessment_(assessmentId);
  var child = pwChild_(parent.id, assessment.childId);
  return { assessment: assessment, child: child };
}

function pwQuestionOptions_() {
  var grouped = {};
  pwActiveRows_(PW_TABS.questionOptions, [
    'Option_ID', 'Question_Type_ID', 'Display_Text', 'Numeric_Score', 'Reverse_Score'
  ]).forEach(function (row) {
    var type = pwText_(row, 'Question_Type_ID');
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push({
      id: pwText_(row, 'Option_ID'), questionTypeId: type,
      displayText: pwText_(row, 'Display_Text'), numericScore: pwNumber_(pwCell_(row, 'Numeric_Score')),
      reverseScore: pwNumber_(pwCell_(row, 'Reverse_Score')),
      displayOrder: pwNumber_(pwCell_(row, 'Display_Order'))
    });
  });
  Object.keys(grouped).forEach(function (type) {
    grouped[type].sort(function (left, right) { return left.displayOrder - right.displayOrder; });
  });
  return grouped;
}

function pwQuestions_(ageGroupId, version, depth) {
  var options = pwQuestionOptions_();
  return pwActiveRows_(PW_TABS.questions, [
    'Question_ID', 'Assessment_Type', 'Age_Group_ID', 'Respondent_Type', 'Skill_ID',
    'Question_Text', 'Question_Type_ID', 'Question_Set_Tier', 'Assessment_Version'
  ]).filter(function (row) {
    return pwText_(row, 'Assessment_Type') === 'SKILL' &&
      pwText_(row, 'Age_Group_ID') === ageGroupId &&
      pwText_(row, 'Assessment_Version') === version &&
      (depth === 'COMPREHENSIVE' || pwText_(row, 'Question_Set_Tier') === 'CORE');
  }).map(function (row) {
    var type = pwText_(row, 'Question_Type_ID');
    return {
      id: pwText_(row, 'Question_ID'), ageGroupId: ageGroupId,
      respondentType: pwText_(row, 'Respondent_Type'), skillId: pwText_(row, 'Skill_ID'),
      text: pwText_(row, 'Question_Text'), questionTypeId: type,
      tier: pwText_(row, 'Question_Set_Tier'), weight: pwNumber_(pwCell_(row, 'Weight'), 1),
      reverseScored: pwBoolean_(pwCell_(row, 'Reverse_Scored_Flag')),
      displayOrder: pwNumber_(pwCell_(row, 'Display_Order')), version: version,
      required: pwBoolean_(pwCell_(row, 'Required_Flag')), options: pwObjectCopy_(options[type] || [])
    };
  }).sort(function (left, right) { return left.displayOrder - right.displayOrder; });
}

function pwResponses_(assessmentId) {
  var latest = {};
  pwRows_(PW_TABS.responses, ['Response_ID', 'Assessment_ID', 'Question_ID'])
    .filter(function (row) { return pwText_(row, 'Assessment_ID') === assessmentId; })
    .forEach(function (row) { latest[pwText_(row, 'Question_ID')] = row; });
  return Object.keys(latest).map(function (questionId) {
    var row = latest[questionId];
    return {
      id: pwText_(row, 'Response_ID'), assessmentId: assessmentId,
      childId: pwText_(row, 'Child_ID'), questionId: questionId,
      respondentType: pwText_(row, 'Respondent_Type'), optionId: pwText_(row, 'Option_ID'),
      rawScore: pwNumber_(pwCell_(row, 'Raw_Score')),
      adjustedScore: pwNumber_(pwCell_(row, 'Adjusted_Score')),
      responseText: pwText_(row, 'Response_Text') || null,
      answeredAt: pwText_(row, 'Answered_At')
    };
  });
}

function pwPublicAssessment_(assessment) {
  return {
    id: assessment.id, childId: assessment.childId, version: assessment.version,
    depth: assessment.depth, respondentMode: assessment.respondentMode, status: assessment.status,
    questionCount: assessment.questionCount, sequence: assessment.sequence,
    startedAt: assessment.startedAt, completedAt: assessment.completedAt
  };
}

function pwAssessmentView_(parent, assessmentId) {
  var owned = pwOwnedAssessment_(parent, assessmentId);
  var questions = pwQuestions_(owned.child.ageGroupId, owned.assessment.version, owned.assessment.depth);
  var responses = pwResponses_(assessmentId);
  var byQuestion = {};
  responses.forEach(function (response) { byQuestion[response.questionId] = response; });
  return {
    assessment: pwPublicAssessment_(owned.assessment),
    child: { id: owned.child.id, name: owned.child.name, nickname: owned.child.nickname,
      ageGroupId: owned.child.ageGroupId },
    questions: questions.map(function (question) {
      return {
        id: question.id, skillId: question.skillId, text: question.text,
        respondentType: question.respondentType, displayOrder: question.displayOrder,
        required: question.required,
        options: question.options.map(function (option) { return { id: option.id, text: option.displayText }; }),
        selectedOptionId: byQuestion[question.id] ? byQuestion[question.id].optionId : null
      };
    }),
    progress: {
      answered: responses.length, total: owned.assessment.questionCount,
      percent: Math.round((responses.length / owned.assessment.questionCount) * 100)
    }
  };
}

function pwStartAssessment_(parent, childId) {
  var child = pwChild_(parent.id, childId);
  pwAssert_(pwPassions_(childId).length > 0, 'PASSION_DISCOVERY_REQUIRED',
    'Complete Passion Discovery before starting the Development Check', 409);
  var assessments = pwAssessments_(childId);
  var inProgress = assessments.filter(function (assessment) { return assessment.status === 'In Progress'; })[0];
  if (inProgress) return pwAssessmentView_(parent, inProgress.id);
  pwAssert_(!assessments.some(function (assessment) { return assessment.status === 'Completed'; }) ||
    child.assessmentStatus === 'Reassessment Due', 'REASSESSMENT_LOCKED',
    'Complete the active journey with the configured mission completion before reassessing', 409);
  var plan = pwPlan_(parent.subscriptionPlanId);
  var currentYear = new Date().getUTCFullYear();
  var familyAttempts = pwChildren_(parent.id).reduce(function (count, familyChild) {
    return count + pwAssessments_(familyChild.id).filter(function (assessment) {
      return new Date(assessment.startedAt).getUTCFullYear() === currentYear;
    }).length;
  }, 0);
  pwAssert_(familyAttempts < plan.includedAssessmentsPerYear, 'ASSESSMENT_LIMIT_REACHED',
    'Your plan has reached its annual Development Check limit', 403);
  var groupRow = pwFindRow_(PW_TABS.ageGroups, 'Age_Group_ID', child.ageGroupId);
  var coreCount = pwNumber_(pwCell_(groupRow, 'Core_Question_Count'));
  var depth = plan.questionCount <= coreCount ? 'CORE' : 'COMPREHENSIVE';
  var version = pwRequiredConfigText_('ASSESSMENT_VERSION');
  var questions = pwQuestions_(child.ageGroupId, version, depth);
  var skillCount = pwBootstrap_().skills.length;
  var representedSkills = {};
  questions.forEach(function (question) { representedSkills[question.skillId] = true; });
  pwAssert_(questions.length === plan.questionCount && Object.keys(representedSkills).length === skillCount &&
    questions.every(function (question) { return question.options.length > 0; }),
    'ASSESSMENT_CONTENT_INVALID', 'The active Development Check content is incomplete', 503);
  return pwWithWriteLock_(function () {
    var timestamp = pwIsoNow_();
    var assessmentId = pwId_('ASM');
    pwAppend_(PW_TABS.assessments, {
      Assessment_ID: assessmentId, Child_ID: childId, Assessment_Version: version,
      Assessment_Depth: depth,
      Respondent_Mode: pwAssessmentRespondentModeForSheet_(
        pwText_(groupRow, 'Respondent_Mode')), Started_At: timestamp,
      Completed_At: '', Overall_GrowScore: '', Score_Band: '', Journey_ID: '',
      Question_Count: questions.length, Assessment_Sequence: assessments.length + 1,
      Assessment_Status: 'IN_PROGRESS', Created_At: timestamp, Updated_At: timestamp,
      Calculation_Version: PW_CALCULATION_VERSION
    });
    pwUpdateRow_(PW_TABS.children, 'Child_ID', childId, {
      Assessment_Status: 'In Progress', Updated_At: timestamp, Updated_By: parent.id
    });
    pwAudit_('PARENT', parent.id, 'ASSESSMENT', assessmentId, 'CREATE',
      { childId: childId, questionCount: questions.length }, 'SUCCESS', 'Development Check started');
    return pwAssessmentView_(parent, assessmentId);
  });
}

function pwSaveResponse_(parent, assessmentId, questionId, body) {
  var owned = pwOwnedAssessment_(parent, assessmentId);
  pwAssert_(owned.assessment.status === 'In Progress', 'ASSESSMENT_COMPLETED',
    'This Development Check is already complete', 409);
  var questions = pwQuestions_(owned.child.ageGroupId, owned.assessment.version, owned.assessment.depth);
  var question = questions.filter(function (candidate) { return candidate.id === questionId; })[0];
  pwAssert_(question, 'NOT_FOUND', 'Question was not found', 404);
  var optionId = pwRequiredString_((body || {}).optionId, 'optionId', 1, 80);
  var option = question.options.filter(function (candidate) { return candidate.id === optionId; })[0];
  pwAssert_(option, 'OPTION_INVALID', 'Choose one of the available responses');
  return pwWithWriteLock_(function () {
    var timestamp = pwIsoNow_();
    pwAppend_(PW_TABS.responses, {
      Response_ID: pwId_('RSP'), Assessment_ID: assessmentId, Child_ID: owned.child.id,
      Question_ID: questionId, Respondent_Type: question.respondentType, Option_ID: optionId,
      Raw_Score: option.numericScore,
      Adjusted_Score: question.reverseScored ? option.reverseScore : option.numericScore,
      Response_Text: pwOptionalString_((body || {}).responseText, 500), Answered_At: timestamp,
      Record_Status: 'Active', Created_At: timestamp, Updated_At: timestamp
    });
    var answered = pwResponses_(assessmentId).length;
    return { saved: true, progress: { answered: answered, total: owned.assessment.questionCount,
      percent: Math.round((answered / owned.assessment.questionCount) * 100) } };
  });
}

function pwSkillScores_(assessmentId) {
  return pwRows_(PW_TABS.skillScores, ['Skill_Score_ID', 'Assessment_ID', 'Skill_ID'])
    .filter(function (row) { return pwText_(row, 'Assessment_ID') === assessmentId; })
    .map(function (row) {
      var previous = pwText_(row, 'Previous_Score');
      var change = pwText_(row, 'Change_From_Previous');
      return {
        id: pwText_(row, 'Skill_Score_ID'), assessmentId: assessmentId,
        childId: pwText_(row, 'Child_ID'), skillId: pwText_(row, 'Skill_ID'),
        weightedRawScore: pwNumber_(pwCell_(row, 'Weighted_Raw_Score')),
        normalizedScore: pwNumber_(pwCell_(row, 'Normalized_Score')),
        skillWeightPercent: pwNumber_(pwCell_(row, 'Skill_Weight_Percent')),
        weightedContribution: pwNumber_(pwCell_(row, 'Weighted_Contribution')),
        scoreBand: pwText_(row, 'Score_Band'),
        previousScore: previous === '' ? null : pwNumber_(previous),
        changeFromPrevious: change === '' ? null : pwNumber_(change),
        calculatedAt: pwText_(row, 'Calculated_At')
      };
    });
}

function pwScoreRanges_() {
  var config = pwConfigMap_();
  var keys = [
    ['EXCEPTIONAL', 'SCORE_BAND_EXCEPTIONAL'], ['STRONG', 'SCORE_BAND_STRONG'],
    ['AGE_APPROPRIATE', 'SCORE_BAND_AGE_APPROPRIATE'], ['DEVELOPING', 'SCORE_BAND_DEVELOPING'],
    ['PRIORITY_GROWTH_AREA', 'SCORE_BAND_PRIORITY']
  ];
  return keys.map(function (entry) {
    var parts = String(config[entry[1]] || '').split('-').map(Number);
    pwAssert_(parts.length === 2 && parts.every(isFinite), 'WORKBOOK_CONTRACT_ERROR',
      'Invalid score range for ' + entry[1], 503);
    return { band: entry[0], min: parts[0], max: parts[1] };
  });
}

function pwScoreBand_(score) {
  var range = pwScoreRanges_().filter(function (candidate) {
    return score >= candidate.min && score <= candidate.max;
  })[0];
  pwAssert_(range, 'WORKBOOK_CONTRACT_ERROR', 'No score band covers ' + score, 503);
  return range.band;
}

function pwBandLabel_(band) {
  return pwRequiredConfigText_('SCORE_LABEL_' + band);
}

function pwCompleteAssessment_(parent, assessmentId) {
  var owned = pwOwnedAssessment_(parent, assessmentId);
  if (owned.assessment.status === 'Completed') return pwAssessmentReport_(parent, assessmentId);
  var questions = pwQuestions_(owned.child.ageGroupId, owned.assessment.version, owned.assessment.depth);
  var responses = pwResponses_(assessmentId);
  var responseMap = {};
  responses.forEach(function (response) { responseMap[response.questionId] = response; });
  var unanswered = questions.filter(function (question) { return question.required && !responseMap[question.id]; });
  pwAssert_(unanswered.length === 0, 'ASSESSMENT_INCOMPLETE',
    unanswered.length + ' required responses are still pending', 409);
  var skills = pwBootstrap_().skills;
  var skillMap = {};
  var weightTotal = 0;
  skills.forEach(function (skill) { skillMap[skill.id] = skill; weightTotal += Number(skill.weight || 0); });
  pwAssert_(pwRound_(weightTotal) === 100, 'WORKBOOK_CONTRACT_ERROR', 'Active skill weights must total 100', 503);
  var previousAssessment = pwAssessments_(owned.child.id).filter(function (assessment) {
    return assessment.status === 'Completed' && assessment.sequence < owned.assessment.sequence;
  }).sort(function (left, right) { return right.sequence - left.sequence; })[0];
  var previous = {};
  if (previousAssessment) pwSkillScores_(previousAssessment.id).forEach(function (score) {
    previous[score.skillId] = score.normalizedScore;
  });
  var bySkill = {};
  questions.forEach(function (question) {
    if (!bySkill[question.skillId]) bySkill[question.skillId] = [];
    bySkill[question.skillId].push(question);
  });
  var timestamp = pwIsoNow_();
  var scores = Object.keys(bySkill).map(function (skillId) {
    pwAssert_(skillMap[skillId], 'WORKBOOK_CONTRACT_ERROR',
      'Question references an inactive or unknown skill: ' + skillId, 503);
    var skillQuestions = bySkill[skillId];
    var adjusted = 0;
    var minimum = 0;
    var maximum = 0;
    skillQuestions.forEach(function (question) {
      adjusted += responseMap[question.id].adjustedScore;
      var values = question.options.map(function (option) {
        return question.reverseScored ? option.reverseScore : option.numericScore;
      });
      minimum += Math.min.apply(null, values);
      maximum += Math.max.apply(null, values);
    });
    var normalized = pwRound_(((adjusted - minimum) / (maximum - minimum)) * 100);
    var weight = Number(skillMap[skillId].weight || 0);
    var oldScore = previous[skillId];
    return {
      id: pwId_('SSC'), assessmentId: assessmentId, childId: owned.child.id, skillId: skillId,
      weightedRawScore: adjusted, normalizedScore: normalized, skillWeightPercent: weight,
      weightedContribution: pwRound_((normalized * weight) / 100), scoreBand: pwScoreBand_(normalized),
      previousScore: oldScore == null ? null : oldScore,
      changeFromPrevious: oldScore == null ? null : pwRound_(normalized - oldScore),
      calculatedAt: timestamp
    };
  });
  var growScore = pwRound_(scores.reduce(function (total, score) {
    return total + score.weightedContribution;
  }, 0));
  return pwWithWriteLock_(function () {
    if (pwSkillScores_(assessmentId).length === 0) {
      pwAppendMany_(PW_TABS.skillScores, scores.map(function (score) {
        return {
          Skill_Score_ID: score.id, Assessment_ID: assessmentId, Child_ID: score.childId,
          Skill_ID: score.skillId, Weighted_Raw_Score: score.weightedRawScore,
          Normalized_Score: score.normalizedScore, Skill_Weight_Percent: score.skillWeightPercent,
          Weighted_Contribution: score.weightedContribution, Score_Band: score.scoreBand,
          Previous_Score: score.previousScore, Change_From_Previous: score.changeFromPrevious,
          Calculated_At: timestamp, Calculation_Version: PW_CALCULATION_VERSION
        };
      }));
    }
    pwUpdateRow_(PW_TABS.assessments, 'Assessment_ID', assessmentId, {
      Completed_At: timestamp, Overall_GrowScore: growScore, Score_Band: pwScoreBand_(growScore),
      Assessment_Status: 'COMPLETED', Updated_At: timestamp,
      Calculation_Version: PW_CALCULATION_VERSION
    });
    pwUpdateRow_(PW_TABS.children, 'Child_ID', owned.child.id, {
      Assessment_Status: 'Completed', Assessment_Count: owned.child.assessmentCount + 1,
      Current_GrowScore: growScore,
      Current_Badge_Level: pwAdvanceBadgeLevel_(owned.child.currentBadgeLevel),
      Updated_At: timestamp, Updated_By: parent.id
    });
    pwAudit_('PARENT', parent.id, 'ASSESSMENT', assessmentId, 'CALCULATE',
      { growScore: growScore }, 'SUCCESS', 'GrowScore calculated from Sheet masters');
    return pwAssessmentReport_(parent, assessmentId);
  });
}

function pwSkillMessage_(name, band) {
  var template = pwRequiredConfigText_('SKILL_MESSAGE_' + band);
  return template.replace(/\{skill\}/g, name);
}

function pwAssessmentReport_(parent, assessmentId) {
  var owned = pwOwnedAssessment_(parent, assessmentId);
  pwAssert_(owned.assessment.status === 'Completed', 'ASSESSMENT_NOT_COMPLETED',
    'Complete the Development Check before viewing GrowScore', 409);
  var plan = pwPlan_(parent.subscriptionPlanId);
  var skills = {};
  pwBootstrap_().skills.forEach(function (skill) { skills[skill.id] = skill; });
  var ranked = pwSkillScores_(assessmentId).map(function (score) {
    var skill = skills[score.skillId] || { id: score.skillId, name: score.skillId };
    return {
      skillId: score.skillId, name: skill.name, description: String(skill.description || ''),
      colour: String(skill.colour || '#2563EB'), weightPercent: score.skillWeightPercent,
      score: score.normalizedScore, band: score.scoreBand, bandLabel: pwBandLabel_(score.scoreBand),
      message: pwSkillMessage_(skill.name, score.scoreBand), previousScore: score.previousScore,
      changeFromPrevious: score.changeFromPrevious
    };
  }).sort(function (left, right) { return right.score - left.score; });
  var visible = ranked.slice(0, plan.skillsVisible);
  var focus = visible.slice().sort(function (left, right) { return left.score - right.score; }).slice(0, 3);
  return {
    assessment: pwPublicAssessment_(owned.assessment),
    child: { id: owned.child.id, name: owned.child.name, nickname: owned.child.nickname },
    growScore: owned.assessment.overallGrowScore, scoreBand: owned.assessment.scoreBand,
    scoreBandLabel: pwBandLabel_(owned.assessment.scoreBand), skills: visible,
    strengths: visible.slice(0, 3), recommendedFocusAreas: focus,
    entitlements: { visibleSkillCount: visible.length,
      lockedSkillCount: Math.max(0, ranked.length - visible.length), planId: parent.subscriptionPlanId }
  };
}

function pwLatestReport_(parent, childId) {
  pwChild_(parent.id, childId);
  var latest = pwAssessments_(childId).filter(function (assessment) {
    return assessment.status === 'Completed';
  }).sort(function (left, right) { return right.sequence - left.sequence; })[0];
  pwAssert_(latest, 'NOT_FOUND', 'GrowScore report was not found', 404);
  return pwAssessmentReport_(parent, latest.id);
}
