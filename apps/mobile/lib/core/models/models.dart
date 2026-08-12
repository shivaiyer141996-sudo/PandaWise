class ParentProfile {
  const ParentProfile({
    required this.id,
    required this.name,
    required this.email,
    required this.parentType,
    required this.mobileNumber,
    required this.subscriptionPlanId,
    required this.preferredLanguageId,
    required this.dailyTimeCommitment,
    required this.pushNotification,
    required this.emailNotification,
    required this.whatsAppNotification,
    required this.weeklySummary,
    required this.missionReminder,
    required this.marketingConsent,
    required this.termsAcceptedAt,
    required this.referralCode,
    required this.referralStatus,
    this.referredBy,
  });

  factory ParentProfile.fromJson(Map<String, dynamic> json) {
    return ParentProfile(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      parentType: json['parentType'] as String,
      mobileNumber: json['mobileNumber'] as String,
      subscriptionPlanId: json['subscriptionPlanId'] as String,
      preferredLanguageId: json['preferredLanguageId'] as String,
      dailyTimeCommitment: json['dailyTimeCommitment'] as String,
      pushNotification: json['pushNotification'] as bool,
      emailNotification: json['emailNotification'] as bool,
      whatsAppNotification: json['whatsAppNotification'] as bool,
      weeklySummary: json['weeklySummary'] as bool,
      missionReminder: json['missionReminder'] as bool,
      marketingConsent: json['marketingConsent'] as bool,
      termsAcceptedAt: json['termsAcceptedAt'] as String,
      referralCode: json['referralCode'] as String,
      referredBy: json['referredBy'] as String?,
      referralStatus: json['referralStatus'] as String,
    );
  }

  final String id;
  final String name;
  final String email;
  final String parentType;
  final String mobileNumber;
  final String subscriptionPlanId;
  final String preferredLanguageId;
  final String dailyTimeCommitment;
  final bool pushNotification;
  final bool emailNotification;
  final bool whatsAppNotification;
  final bool weeklySummary;
  final bool missionReminder;
  final bool marketingConsent;
  final String termsAcceptedAt;
  final String referralCode;
  final String? referredBy;
  final String referralStatus;
}

class ChildProfile {
  const ChildProfile({
    required this.id,
    required this.name,
    required this.dateOfBirth,
    required this.ageYears,
    required this.ageGroupId,
    required this.gender,
    required this.languageId,
    required this.assessmentStatus,
    required this.journeyStatus,
    required this.currentBadgeLevel,
    required this.currentStreak,
    this.nickname,
    this.avatarId,
    this.schoolId,
    this.gradeId,
    this.currentGrowScore,
  });

  factory ChildProfile.fromJson(Map<String, dynamic> json) {
    return ChildProfile(
      id: json['id'] as String,
      name: json['name'] as String,
      nickname: json['nickname'] as String?,
      avatarId: json['avatarId'] as String?,
      dateOfBirth: json['dateOfBirth'] as String,
      ageYears: json['ageYears'] as int,
      ageGroupId: json['ageGroupId'] as String,
      gender: json['gender'] as String,
      schoolId: json['schoolId'] as String?,
      gradeId: json['gradeId'] as String?,
      languageId: json['languageId'] as String,
      assessmentStatus: json['assessmentStatus'] as String,
      journeyStatus: json['journeyStatus'] as String,
      currentGrowScore: (json['currentGrowScore'] as num?)?.toDouble(),
      currentBadgeLevel: json['currentBadgeLevel'] as String,
      currentStreak: json['currentStreak'] as int,
    );
  }

  final String id;
  final String name;
  final String? nickname;
  final String? avatarId;
  final String dateOfBirth;
  final int ageYears;
  final String ageGroupId;
  final String gender;
  final String? schoolId;
  final String? gradeId;
  final String languageId;
  final String assessmentStatus;
  final String journeyStatus;
  final double? currentGrowScore;
  final String currentBadgeLevel;
  final int currentStreak;

  String get displayName => nickname?.isNotEmpty == true ? nickname! : name;
}

class MasterOption {
  const MasterOption({
    required this.id,
    required this.name,
    this.category,
    this.ageGroupEligibility,
    this.colour,
    this.weight,
  });

  factory MasterOption.fromJson(Map<String, dynamic> json) {
    return MasterOption(
      id: json['id'] as String,
      name: json['name'] as String,
      category: json['category'] as String?,
      ageGroupEligibility: json['ageGroupEligibility'] as String?,
      colour: json['colour'] as String?,
      weight: (json['weight'] as num?)?.toDouble(),
    );
  }

  final String id;
  final String name;
  final String? category;
  final String? ageGroupEligibility;
  final String? colour;
  final double? weight;
}

class BootstrapData {
  const BootstrapData({
    required this.ageGroups,
    required this.languages,
    required this.schools,
    required this.grades,
    required this.timeCommitments,
    this.skills = const <MasterOption>[],
    this.passions = const <MasterOption>[],
  });

  factory BootstrapData.fromJson(Map<String, dynamic> json) {
    List<MasterOption> options(String key) {
      return (json[key] as List<dynamic>? ?? <dynamic>[])
          .map((dynamic value) => MasterOption.fromJson(value as Map<String, dynamic>))
          .toList(growable: false);
    }

    return BootstrapData(
      ageGroups: options('ageGroups'),
      languages: options('languages'),
      schools: options('schools'),
      grades: options('grades'),
      skills: options('skills'),
      passions: options('passions'),
      timeCommitments: (json['timeCommitments'] as List<dynamic>? ?? <dynamic>[])
          .cast<String>(),
    );
  }

  final List<MasterOption> ageGroups;
  final List<MasterOption> languages;
  final List<MasterOption> schools;
  final List<MasterOption> grades;
  final List<MasterOption> skills;
  final List<MasterOption> passions;
  final List<String> timeCommitments;
}

class AuthResult {
  const AuthResult({required this.token, required this.parent});

  final String token;
  final ParentProfile parent;
}

class CreateChildRequest {
  const CreateChildRequest({
    required this.name,
    required this.dateOfBirth,
    required this.gender,
    required this.languageId,
    required this.parentTimeCommitment,
    this.nickname,
    this.avatarId,
    this.schoolId,
    this.gradeId,
    this.knownInterests = const <String>[],
  });

  final String name;
  final String? nickname;
  final String? avatarId;
  final String dateOfBirth;
  final String gender;
  final String? schoolId;
  final String? gradeId;
  final String languageId;
  final List<String> knownInterests;
  final String parentTimeCommitment;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'name': name,
      if (nickname?.isNotEmpty == true) 'nickname': nickname,
      if (avatarId?.isNotEmpty == true) 'avatarId': avatarId,
      'dateOfBirth': dateOfBirth,
      'gender': gender,
      if (schoolId?.isNotEmpty == true) 'schoolId': schoolId,
      if (gradeId?.isNotEmpty == true) 'gradeId': gradeId,
      'languageId': languageId,
      'knownInterests': knownInterests,
      'parentTimeCommitment': parentTimeCommitment,
    };
  }
}

class AssessmentOption {
  const AssessmentOption({required this.id, required this.text});

  factory AssessmentOption.fromJson(Map<String, dynamic> json) {
    return AssessmentOption(id: json['id'] as String, text: json['text'] as String);
  }

  final String id;
  final String text;
}

class AssessmentQuestion {
  const AssessmentQuestion({
    required this.id,
    required this.skillId,
    required this.text,
    required this.respondentType,
    required this.displayOrder,
    required this.options,
    this.selectedOptionId,
  });

  factory AssessmentQuestion.fromJson(Map<String, dynamic> json) {
    return AssessmentQuestion(
      id: json['id'] as String,
      skillId: json['skillId'] as String,
      text: json['text'] as String,
      respondentType: json['respondentType'] as String,
      displayOrder: json['displayOrder'] as int,
      options: (json['options'] as List<dynamic>)
          .map((dynamic value) => AssessmentOption.fromJson(value as Map<String, dynamic>))
          .toList(growable: false),
      selectedOptionId: json['selectedOptionId'] as String?,
    );
  }

  final String id;
  final String skillId;
  final String text;
  final String respondentType;
  final int displayOrder;
  final List<AssessmentOption> options;
  final String? selectedOptionId;
}

class AssessmentDetail {
  const AssessmentDetail({
    required this.id,
    required this.childId,
    required this.depth,
    required this.respondentMode,
    required this.status,
    required this.questionCount,
    required this.questions,
    required this.answeredCount,
  });

  factory AssessmentDetail.fromJson(Map<String, dynamic> json) {
    final Map<String, dynamic> assessment = json['assessment'] as Map<String, dynamic>;
    final Map<String, dynamic> progress = json['progress'] as Map<String, dynamic>;
    return AssessmentDetail(
      id: assessment['id'] as String,
      childId: assessment['childId'] as String,
      depth: assessment['depth'] as String,
      respondentMode: assessment['respondentMode'] as String,
      status: assessment['status'] as String,
      questionCount: assessment['questionCount'] as int,
      questions: (json['questions'] as List<dynamic>)
          .map((dynamic value) => AssessmentQuestion.fromJson(value as Map<String, dynamic>))
          .toList(growable: false),
      answeredCount: progress['answered'] as int,
    );
  }

  final String id;
  final String childId;
  final String depth;
  final String respondentMode;
  final String status;
  final int questionCount;
  final List<AssessmentQuestion> questions;
  final int answeredCount;
}

class GrowScoreSkill {
  const GrowScoreSkill({
    required this.skillId,
    required this.name,
    required this.score,
    required this.bandLabel,
    required this.message,
    required this.colour,
  });

  factory GrowScoreSkill.fromJson(Map<String, dynamic> json) {
    return GrowScoreSkill(
      skillId: json['skillId'] as String,
      name: json['name'] as String,
      score: (json['score'] as num).toDouble(),
      bandLabel: json['bandLabel'] as String,
      message: json['message'] as String,
      colour: json['colour'] as String,
    );
  }

  final String skillId;
  final String name;
  final double score;
  final String bandLabel;
  final String message;
  final String colour;
}

class GrowScoreReport {
  const GrowScoreReport({
    required this.assessmentId,
    required this.growScore,
    required this.scoreBandLabel,
    required this.skills,
    required this.strengths,
    required this.recommendedFocusAreas,
    required this.lockedSkillCount,
  });

  factory GrowScoreReport.fromJson(Map<String, dynamic> json) {
    List<GrowScoreSkill> skills(String key) {
      return (json[key] as List<dynamic>)
          .map((dynamic value) => GrowScoreSkill.fromJson(value as Map<String, dynamic>))
          .toList(growable: false);
    }

    final Map<String, dynamic> assessment = json['assessment'] as Map<String, dynamic>;
    final Map<String, dynamic> entitlements = json['entitlements'] as Map<String, dynamic>;
    return GrowScoreReport(
      assessmentId: assessment['id'] as String,
      growScore: (json['growScore'] as num).toDouble(),
      scoreBandLabel: json['scoreBandLabel'] as String,
      skills: skills('skills'),
      strengths: skills('strengths'),
      recommendedFocusAreas: skills('recommendedFocusAreas'),
      lockedSkillCount: entitlements['lockedSkillCount'] as int,
    );
  }

  final String assessmentId;
  final double growScore;
  final String scoreBandLabel;
  final List<GrowScoreSkill> skills;
  final List<GrowScoreSkill> strengths;
  final List<GrowScoreSkill> recommendedFocusAreas;
  final int lockedSkillCount;
}

class JourneyMission {
  const JourneyMission({
    required this.id,
    required this.skillId,
    required this.name,
    required this.description,
    required this.difficulty,
    required this.durationMinutes,
    required this.materialsNeeded,
    required this.parentGuidance,
    required this.childInstructions,
    required this.learningOutcome,
    required this.points,
    required this.indoorOutdoor,
    required this.category,
  });

  factory JourneyMission.fromJson(Map<String, dynamic> json) {
    return JourneyMission(
      id: json['id'] as String,
      skillId: json['skillId'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      difficulty: json['difficulty'] as String,
      durationMinutes: json['durationMinutes'] as int,
      materialsNeeded: json['materialsNeeded'] as String,
      parentGuidance: json['parentGuidance'] as String,
      childInstructions: json['childInstructions'] as String,
      learningOutcome: json['learningOutcome'] as String,
      points: json['points'] as int,
      indoorOutdoor: json['indoorOutdoor'] as String,
      category: json['category'] as String,
    );
  }

  final String id;
  final String skillId;
  final String name;
  final String description;
  final String difficulty;
  final int durationMinutes;
  final String materialsNeeded;
  final String parentGuidance;
  final String childInstructions;
  final String learningOutcome;
  final int points;
  final String indoorOutdoor;
  final String category;
}

class JourneyToday {
  const JourneyToday({
    required this.scheduleId,
    required this.day,
    required this.week,
    required this.scheduledDate,
    required this.reasons,
    required this.mission,
  });

  factory JourneyToday.fromJson(Map<String, dynamic> json) {
    return JourneyToday(
      scheduleId: json['scheduleId'] as String,
      day: json['day'] as int,
      week: json['week'] as int,
      scheduledDate: json['scheduledDate'] as String,
      reasons: (json['reason'] as List<dynamic>).cast<String>(),
      mission: JourneyMission.fromJson(json['mission'] as Map<String, dynamic>),
    );
  }

  final String scheduleId;
  final int day;
  final int week;
  final String scheduledDate;
  final List<String> reasons;
  final JourneyMission mission;
}

class JourneyView {
  const JourneyView({
    required this.id,
    required this.childId,
    required this.status,
    required this.currentDay,
    required this.missionsPlanned,
    required this.missionsCompleted,
    required this.completionPercent,
    required this.streak,
    required this.reassessmentUnlocked,
    this.today,
  });

  factory JourneyView.fromJson(Map<String, dynamic> json) {
    final Map<String, dynamic> journey = json['journey'] as Map<String, dynamic>;
    final Map<String, dynamic> progress = json['progress'] as Map<String, dynamic>;
    final Map<String, dynamic> reassessment = json['reassessment'] as Map<String, dynamic>;
    final Map<String, dynamic>? today = json['today'] as Map<String, dynamic>?;
    return JourneyView(
      id: journey['id'] as String,
      childId: journey['childId'] as String,
      status: journey['status'] as String,
      currentDay: progress['currentDay'] as int,
      missionsPlanned: progress['planned'] as int,
      missionsCompleted: progress['completed'] as int,
      completionPercent: (progress['completionPercent'] as num).toDouble(),
      streak: progress['streak'] as int,
      reassessmentUnlocked: reassessment['unlocked'] as bool,
      today: today == null ? null : JourneyToday.fromJson(today),
    );
  }

  final String id;
  final String childId;
  final String status;
  final int currentDay;
  final int missionsPlanned;
  final int missionsCompleted;
  final double completionPercent;
  final int streak;
  final bool reassessmentUnlocked;
  final JourneyToday? today;
}

class WeeklyJourneySummary {
  const WeeklyJourneySummary({
    required this.week,
    required this.completed,
    required this.completionPercent,
    required this.totalPoints,
    required this.averageEnjoyment,
    required this.streak,
    required this.message,
    this.mostPracticedSkill,
  });

  factory WeeklyJourneySummary.fromJson(Map<String, dynamic> json) {
    final Map<String, dynamic>? skill = json['mostPracticedSkill'] as Map<String, dynamic>?;
    return WeeklyJourneySummary(
      week: json['week'] as int,
      completed: json['completed'] as int,
      completionPercent: (json['completionPercent'] as num).toDouble(),
      totalPoints: json['totalPoints'] as int,
      averageEnjoyment: (json['averageEnjoyment'] as num).toDouble(),
      streak: json['streak'] as int,
      message: json['message'] as String,
      mostPracticedSkill: skill?['name'] as String?,
    );
  }

  final int week;
  final int completed;
  final double completionPercent;
  final int totalPoints;
  final double averageEnjoyment;
  final int streak;
  final String message;
  final String? mostPracticedSkill;
}

class ProgressEntitlements {
  const ProgressEntitlements({
    required this.planId,
    required this.planName,
    required this.growthTrackerEnabled,
    required this.assessmentHistoryAccess,
    required this.assessmentComparison,
    required this.advancedAnalyticsEnabled,
  });

  factory ProgressEntitlements.fromJson(Map<String, dynamic> json) {
    return ProgressEntitlements(
      planId: json['planId'] as String,
      planName: json['planName'] as String,
      growthTrackerEnabled: json['growthTrackerEnabled'] as bool,
      assessmentHistoryAccess: json['assessmentHistoryAccess'] as String,
      assessmentComparison: json['assessmentComparison'] as String,
      advancedAnalyticsEnabled: json['advancedAnalyticsEnabled'] as bool,
    );
  }

  final String planId;
  final String planName;
  final bool growthTrackerEnabled;
  final String assessmentHistoryAccess;
  final String assessmentComparison;
  final bool advancedAnalyticsEnabled;
}

class AssessmentProgressSnapshot {
  const AssessmentProgressSnapshot({
    required this.message,
    required this.comparisonAvailable,
    this.latestAssessmentId,
    this.latestGrowScore,
    this.previousGrowScore,
    this.changeFromPrevious,
    this.completedAt,
    this.scoreBand,
  });

  factory AssessmentProgressSnapshot.fromJson(Map<String, dynamic> json) {
    return AssessmentProgressSnapshot(
      latestAssessmentId: json['latestAssessmentId'] as String?,
      latestGrowScore: (json['latestGrowScore'] as num?)?.toDouble(),
      previousGrowScore: (json['previousGrowScore'] as num?)?.toDouble(),
      changeFromPrevious: (json['changeFromPrevious'] as num?)?.toDouble(),
      completedAt: json['completedAt'] as String?,
      scoreBand: json['scoreBand'] as String?,
      comparisonAvailable: json['comparisonAvailable'] as bool,
      message: json['message'] as String,
    );
  }

  final String? latestAssessmentId;
  final double? latestGrowScore;
  final double? previousGrowScore;
  final double? changeFromPrevious;
  final String? completedAt;
  final String? scoreBand;
  final bool comparisonAvailable;
  final String message;
}

class MissionActivitySnapshot {
  const MissionActivitySnapshot({
    required this.status,
    required this.missionsPlanned,
    required this.missionsCompleted,
    required this.completionPercent,
    required this.streak,
    required this.points,
    this.journeyId,
  });

  factory MissionActivitySnapshot.fromJson(Map<String, dynamic> json) {
    return MissionActivitySnapshot(
      journeyId: json['journeyId'] as String?,
      status: json['status'] as String,
      missionsPlanned: json['missionsPlanned'] as int,
      missionsCompleted: json['missionsCompleted'] as int,
      completionPercent: (json['completionPercent'] as num).toDouble(),
      streak: json['streak'] as int,
      points: json['points'] as int,
    );
  }

  final String? journeyId;
  final String status;
  final int missionsPlanned;
  final int missionsCompleted;
  final double completionPercent;
  final int streak;
  final int points;
}

class ProgressPoint {
  const ProgressPoint({
    required this.assessmentId,
    required this.sequence,
    required this.score,
    this.completedAt,
  });

  factory ProgressPoint.fromJson(Map<String, dynamic> json) {
    return ProgressPoint(
      assessmentId: json['assessmentId'] as String,
      sequence: json['sequence'] as int,
      completedAt: json['completedAt'] as String?,
      score: (json['score'] as num).toDouble(),
    );
  }

  final String assessmentId;
  final int sequence;
  final String? completedAt;
  final double score;
}

class SkillProgressTrend {
  const SkillProgressTrend({
    required this.skillId,
    required this.name,
    required this.colour,
    required this.latestScore,
    required this.points,
    this.changeFromPrevious,
  });

  factory SkillProgressTrend.fromJson(Map<String, dynamic> json) {
    return SkillProgressTrend(
      skillId: json['skillId'] as String,
      name: json['name'] as String,
      colour: json['colour'] as String,
      latestScore: (json['latestScore'] as num).toDouble(),
      changeFromPrevious: (json['changeFromPrevious'] as num?)?.toDouble(),
      points: (json['points'] as List<dynamic>)
          .map((dynamic value) => ProgressPoint.fromJson(value as Map<String, dynamic>))
          .toList(growable: false),
    );
  }

  final String skillId;
  final String name;
  final String colour;
  final double latestScore;
  final double? changeFromPrevious;
  final List<ProgressPoint> points;
}

class AssessmentHistoryItem {
  const AssessmentHistoryItem({
    required this.assessmentId,
    required this.sequence,
    this.completedAt,
    this.growScore,
    this.scoreBand,
    this.changeFromPrevious,
    this.journeyStatus,
    this.journeyCompletionPercent,
  });

  factory AssessmentHistoryItem.fromJson(Map<String, dynamic> json) {
    final Map<String, dynamic>? journey = json['journey'] as Map<String, dynamic>?;
    return AssessmentHistoryItem(
      assessmentId: json['assessmentId'] as String,
      sequence: json['sequence'] as int,
      completedAt: json['completedAt'] as String?,
      growScore: (json['growScore'] as num?)?.toDouble(),
      scoreBand: json['scoreBand'] as String?,
      changeFromPrevious: (json['changeFromPrevious'] as num?)?.toDouble(),
      journeyStatus: journey?['status'] as String?,
      journeyCompletionPercent: (journey?['completionPercent'] as num?)?.toDouble(),
    );
  }

  final String assessmentId;
  final int sequence;
  final String? completedAt;
  final double? growScore;
  final String? scoreBand;
  final double? changeFromPrevious;
  final String? journeyStatus;
  final double? journeyCompletionPercent;
}

class ProgressActions {
  const ProgressActions({
    required this.canReassess,
    required this.canStartJourney,
    required this.nextAction,
  });

  factory ProgressActions.fromJson(Map<String, dynamic> json) {
    return ProgressActions(
      canReassess: json['canReassess'] as bool,
      canStartJourney: json['canStartJourney'] as bool,
      nextAction: json['nextAction'] as String,
    );
  }

  final bool canReassess;
  final bool canStartJourney;
  final String nextAction;
}

class ChildProgressView {
  const ChildProgressView({
    required this.entitlements,
    required this.assessment,
    required this.activity,
    required this.skillTrends,
    required this.assessmentHistory,
    required this.actions,
  });

  factory ChildProgressView.fromJson(Map<String, dynamic> json) {
    return ChildProgressView(
      entitlements: ProgressEntitlements.fromJson(
        json['entitlements'] as Map<String, dynamic>,
      ),
      assessment: AssessmentProgressSnapshot.fromJson(
        json['assessmentSnapshot'] as Map<String, dynamic>,
      ),
      activity: MissionActivitySnapshot.fromJson(
        json['activitySnapshot'] as Map<String, dynamic>,
      ),
      skillTrends: (json['skillTrends'] as List<dynamic>)
          .map((dynamic value) => SkillProgressTrend.fromJson(value as Map<String, dynamic>))
          .toList(growable: false),
      assessmentHistory: (json['assessmentHistory'] as List<dynamic>)
          .map((dynamic value) => AssessmentHistoryItem.fromJson(value as Map<String, dynamic>))
          .toList(growable: false),
      actions: ProgressActions.fromJson(json['actions'] as Map<String, dynamic>),
    );
  }

  final ProgressEntitlements entitlements;
  final AssessmentProgressSnapshot assessment;
  final MissionActivitySnapshot activity;
  final List<SkillProgressTrend> skillTrends;
  final List<AssessmentHistoryItem> assessmentHistory;
  final ProgressActions actions;
}

class PlanOption {
  const PlanOption({
    required this.planId,
    required this.planName,
    required this.positioning,
    required this.monthlyPriceInr,
    required this.annualPriceInr,
    required this.includedAssessmentsPerYear,
    required this.questionCount,
    required this.skillsVisible,
    required this.missionsPerSkill,
    required this.journeyLengthDays,
    required this.passionInsightsLevel,
    required this.growScoreEnabled,
    required this.growthTrackerEnabled,
    required this.growthTimelineEnabled,
    required this.assessmentHistoryAccess,
    required this.assessmentComparison,
    required this.weeklySummaryEnabled,
    required this.monthlyReportEnabled,
    required this.advancedAnalyticsEnabled,
    required this.parentGuidanceLevel,
    required this.prioritySupport,
    required this.reportExport,
    required this.multiLanguageLevel,
    required this.displayOrder,
    required this.recommended,
    this.maxChildren,
  });

  factory PlanOption.fromJson(Map<String, dynamic> json) {
    return PlanOption(
      planId: json['planId'] as String,
      planName: json['planName'] as String,
      positioning: json['positioning'] as String,
      monthlyPriceInr: json['monthlyPriceInr'] as int,
      annualPriceInr: json['annualPriceInr'] as int,
      maxChildren: json['maxChildren'] as int?,
      includedAssessmentsPerYear: json['includedAssessmentsPerYear'] as int,
      questionCount: json['questionCount'] as int,
      skillsVisible: json['skillsVisible'] as int,
      missionsPerSkill: json['missionsPerSkill'] as int,
      journeyLengthDays: json['journeyLengthDays'] as int,
      passionInsightsLevel: json['passionInsightsLevel'] as String,
      growScoreEnabled: json['growScoreEnabled'] as bool,
      growthTrackerEnabled: json['growthTrackerEnabled'] as bool,
      growthTimelineEnabled: json['growthTimelineEnabled'] as bool,
      assessmentHistoryAccess: json['assessmentHistoryAccess'] as String,
      assessmentComparison: json['assessmentComparison'] as String,
      weeklySummaryEnabled: json['weeklySummaryEnabled'] as bool,
      monthlyReportEnabled: json['monthlyReportEnabled'] as bool,
      advancedAnalyticsEnabled: json['advancedAnalyticsEnabled'] as bool,
      parentGuidanceLevel: json['parentGuidanceLevel'] as String,
      prioritySupport: json['prioritySupport'] as String,
      reportExport: json['reportExport'] as String,
      multiLanguageLevel: json['multiLanguageLevel'] as String,
      displayOrder: json['displayOrder'] as int,
      recommended: json['recommended'] as bool,
    );
  }

  final String planId;
  final String planName;
  final String positioning;
  final int monthlyPriceInr;
  final int annualPriceInr;
  final int? maxChildren;
  final int includedAssessmentsPerYear;
  final int questionCount;
  final int skillsVisible;
  final int missionsPerSkill;
  final int journeyLengthDays;
  final String passionInsightsLevel;
  final bool growScoreEnabled;
  final bool growthTrackerEnabled;
  final bool growthTimelineEnabled;
  final String assessmentHistoryAccess;
  final String assessmentComparison;
  final bool weeklySummaryEnabled;
  final bool monthlyReportEnabled;
  final bool advancedAnalyticsEnabled;
  final String parentGuidanceLevel;
  final String prioritySupport;
  final String reportExport;
  final String multiLanguageLevel;
  final int displayOrder;
  final bool recommended;
}

class PlanCatalogue {
  const PlanCatalogue({required this.currentPlanId, required this.plans});

  factory PlanCatalogue.fromJson(Map<String, dynamic> json) {
    return PlanCatalogue(
      currentPlanId: json['currentPlanId'] as String,
      plans: (json['plans'] as List<dynamic>)
          .map((dynamic value) => PlanOption.fromJson(value as Map<String, dynamic>))
          .toList(growable: false),
    );
  }

  final String currentPlanId;
  final List<PlanOption> plans;
}

class PandaWiseNotification {
  const PandaWiseNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.action,
    required this.createdAt,
    this.childId,
  });

  factory PandaWiseNotification.fromJson(Map<String, dynamic> json) {
    return PandaWiseNotification(
      id: json['id'] as String,
      type: json['type'] as String,
      title: json['title'] as String,
      message: json['message'] as String,
      action: json['action'] as String,
      createdAt: json['createdAt'] as String,
      childId: json['childId'] as String?,
    );
  }

  final String id;
  final String type;
  final String title;
  final String message;
  final String action;
  final String createdAt;
  final String? childId;
}

class NotificationCentre {
  const NotificationCentre({required this.items});

  factory NotificationCentre.fromJson(Map<String, dynamic> json) {
    return NotificationCentre(
      items: (json['items'] as List<dynamic>)
          .map(
            (dynamic value) => PandaWiseNotification.fromJson(
              value as Map<String, dynamic>,
            ),
          )
          .toList(growable: false),
    );
  }

  final List<PandaWiseNotification> items;
}
