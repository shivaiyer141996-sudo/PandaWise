import 'package:pandawise_mobile/core/api/pandawise_api.dart';
import 'package:pandawise_mobile/core/models/models.dart';

class DemoPandaWiseApi implements PandaWiseApi, PandaWiseDemoApi {
  DemoPandaWiseApi() {
    _parent = _seedParent();
    _children.add(_seedChild());
    _selectedPassions[_children.first.id] = <String>[
      'PASSION_ART',
      'PASSION_SCIENCE'
    ];
    final GrowScoreReport report = _buildReport('DEMO_ASSESSMENT_COMPLETE');
    _reports[report.assessmentId] = report;
    _latestAssessmentByChild[_children.first.id] = report.assessmentId;
    _journeysByChild[_children.first.id] = _buildJourney(
      childId: _children.first.id,
      journeyId: 'DEMO_JOURNEY_001',
      currentDay: 11,
      completed: 10,
    );
  }

  static const String demoToken = 'pandawise-demo-offline';

  late ParentProfile _parent;
  final List<ChildProfile> _children = <ChildProfile>[];
  final Map<String, List<String>> _selectedPassions = <String, List<String>>{};
  final Map<String, AssessmentDetail> _assessments =
      <String, AssessmentDetail>{};
  final Map<String, GrowScoreReport> _reports = <String, GrowScoreReport>{};
  final Map<String, String> _latestAssessmentByChild = <String, String>{};
  final Map<String, JourneyView> _journeysByChild = <String, JourneyView>{};
  int _childSequence = 2;
  int _assessmentSequence = 2;
  int _journeySequence = 2;

  @override
  Future<AuthResult> startDemo() async => AuthResult(
        token: demoToken,
        parent: _parent,
      );

  @override
  Future<AuthResult> login({
    required String email,
    required String password,
  }) {
    throw const PandaWiseApiException(
      'The backend is not connected yet. Tap Explore Demo Mode to continue offline.',
      code: 'BACKEND_NOT_CONFIGURED',
    );
  }

  @override
  Future<AuthResult> register({
    required String name,
    required String parentType,
    required String mobileNumber,
    required String email,
    required String password,
    required bool marketingConsent,
  }) {
    throw const PandaWiseApiException(
      'Registration will be available after the backend is connected. Use Demo Mode for now.',
      code: 'BACKEND_NOT_CONFIGURED',
    );
  }

  @override
  Future<void> requestPasswordReset(String email) {
    throw const PandaWiseApiException(
      'Password reset requires the production backend. Use Demo Mode for now.',
      code: 'BACKEND_NOT_CONFIGURED',
    );
  }

  @override
  Future<ParentProfile> getMe(String token) async {
    _requireDemoToken(token);
    return _parent;
  }

  @override
  Future<List<ChildProfile>> getChildren(String token) async {
    _requireDemoToken(token);
    return List<ChildProfile>.unmodifiable(_children);
  }

  @override
  Future<ChildProfile> createChild(
    String token,
    CreateChildRequest request,
  ) async {
    _requireDemoToken(token);
    final int age = _ageFromDateOfBirth(request.dateOfBirth);
    final ChildProfile child = ChildProfile(
      id: 'DEMO_CHILD_${_childSequence.toString().padLeft(3, '0')}',
      name: request.name,
      nickname: request.nickname,
      avatarId: request.avatarId,
      dateOfBirth: request.dateOfBirth,
      ageYears: age,
      ageGroupId: age < 6
          ? 'AG01'
          : age < 9
              ? 'AG02'
              : 'AG03',
      gender: request.gender,
      schoolId: request.schoolId,
      gradeId: request.gradeId,
      languageId: request.languageId,
      assessmentStatus: 'Not Started',
      journeyStatus: 'Not Started',
      currentBadgeLevel: 'Explorer',
      currentStreak: 0,
    );
    _childSequence += 1;
    _children.add(child);
    _selectedPassions[child.id] = <String>[];
    return child;
  }

  @override
  Future<BootstrapData> getBootstrapData() async => _bootstrap;

  @override
  Future<List<String>> getSelectedPassions(
    String token,
    String childId,
  ) async {
    _requireDemoToken(token);
    return List<String>.unmodifiable(
      _selectedPassions[childId] ?? <String>[],
    );
  }

  @override
  Future<List<String>> selectPassions(
    String token,
    String childId,
    List<String> passionIds,
  ) async {
    _requireDemoToken(token);
    _requireChild(childId);
    _selectedPassions[childId] = List<String>.from(passionIds);
    return List<String>.unmodifiable(_selectedPassions[childId]!);
  }

  @override
  Future<AssessmentDetail> startAssessment(
    String token,
    String childId,
  ) async {
    _requireDemoToken(token);
    _requireChild(childId);
    for (final AssessmentDetail assessment in _assessments.values) {
      if (assessment.childId == childId && assessment.status == 'In Progress') {
        return assessment;
      }
    }
    final String id =
        'DEMO_ASSESSMENT_${_assessmentSequence.toString().padLeft(3, '0')}';
    _assessmentSequence += 1;
    final AssessmentDetail assessment = AssessmentDetail(
      id: id,
      childId: childId,
      depth: 'Comprehensive',
      respondentMode: 'HYBRID',
      status: 'In Progress',
      questionCount: _demoQuestions.length,
      questions: _demoQuestions,
      answeredCount: 0,
    );
    _assessments[id] = assessment;
    _replaceChild(childId, assessmentStatus: 'In Progress');
    return assessment;
  }

  @override
  Future<AssessmentDetail> getAssessment(
    String token,
    String assessmentId,
  ) async {
    _requireDemoToken(token);
    return _requireAssessment(assessmentId);
  }

  @override
  Future<void> saveAssessmentResponse(
    String token,
    String assessmentId,
    String questionId,
    String optionId,
  ) async {
    _requireDemoToken(token);
    final AssessmentDetail current = _requireAssessment(assessmentId);
    final List<AssessmentQuestion> questions = current.questions
        .map(
          (AssessmentQuestion question) => question.id == questionId
              ? question.withSelectedOption(optionId)
              : question,
        )
        .toList(growable: false);
    _assessments[assessmentId] = AssessmentDetail(
      id: current.id,
      childId: current.childId,
      depth: current.depth,
      respondentMode: current.respondentMode,
      status: current.status,
      questionCount: current.questionCount,
      questions: questions,
      answeredCount: questions
          .where((AssessmentQuestion question) =>
              question.selectedOptionId != null)
          .length,
    );
  }

  @override
  Future<GrowScoreReport> completeAssessment(
    String token,
    String assessmentId,
  ) async {
    _requireDemoToken(token);
    final AssessmentDetail assessment = _requireAssessment(assessmentId);
    final GrowScoreReport report = _buildReport(assessmentId);
    _reports[assessmentId] = report;
    _latestAssessmentByChild[assessment.childId] = assessmentId;
    _assessments[assessmentId] = AssessmentDetail(
      id: assessment.id,
      childId: assessment.childId,
      depth: assessment.depth,
      respondentMode: assessment.respondentMode,
      status: 'Completed',
      questionCount: assessment.questionCount,
      questions: assessment.questions,
      answeredCount: assessment.answeredCount,
    );
    _replaceChild(
      assessment.childId,
      assessmentStatus: 'Completed',
      currentGrowScore: report.growScore,
    );
    return report;
  }

  @override
  Future<GrowScoreReport> getAssessmentReport(
    String token,
    String assessmentId,
  ) async {
    _requireDemoToken(token);
    return _requireReport(assessmentId);
  }

  @override
  Future<GrowScoreReport> getLatestGrowScoreReport(
    String token,
    String childId,
  ) async {
    _requireDemoToken(token);
    final String? assessmentId = _latestAssessmentByChild[childId];
    if (assessmentId == null) {
      throw const PandaWiseApiException(
        'Complete the Development Check to view GrowScore.',
        code: 'NOT_FOUND',
      );
    }
    return _requireReport(assessmentId);
  }

  @override
  Future<JourneyView> createJourney(
    String token,
    String childId,
    List<String> focusSkillIds,
  ) async {
    _requireDemoToken(token);
    _requireChild(childId);
    final JourneyView journey = _buildJourney(
      childId: childId,
      journeyId: 'DEMO_JOURNEY_${_journeySequence.toString().padLeft(3, '0')}',
      currentDay: 1,
      completed: 0,
      focusSkillId:
          focusSkillIds.isEmpty ? 'SKILL_CONFIDENCE' : focusSkillIds.first,
    );
    _journeySequence += 1;
    _journeysByChild[childId] = journey;
    _replaceChild(childId, journeyStatus: 'Active', currentStreak: 0);
    return journey;
  }

  @override
  Future<JourneyView> getCurrentJourney(
    String token,
    String childId,
  ) async {
    _requireDemoToken(token);
    final JourneyView? journey = _journeysByChild[childId];
    if (journey == null) {
      throw const PandaWiseApiException(
        'Choose focus areas to create a journey.',
        code: 'NOT_FOUND',
      );
    }
    return journey;
  }

  @override
  Future<JourneyView> completeMission(
    String token,
    String journeyId,
    String scheduleId, {
    required String status,
    required int enjoymentScore,
    required String difficultyFeedback,
    String? parentNotes,
  }) async {
    _requireDemoToken(token);
    final MapEntry<String, JourneyView> entry =
        _journeysByChild.entries.firstWhere(
      (MapEntry<String, JourneyView> item) => item.value.id == journeyId,
      orElse: () => throw const PandaWiseApiException(
        'Journey was not found.',
        code: 'NOT_FOUND',
      ),
    );
    final JourneyView current = entry.value;
    final bool counts = current.countedCompletionStatuses.contains(status);
    final int completed = (current.missionsCompleted + (counts ? 1 : 0))
        .clamp(0, current.missionsPlanned)
        .toInt();
    final int nextDay =
        (current.currentDay + 1).clamp(1, current.missionsPlanned).toInt();
    final bool finished = completed >= current.missionsPlanned;
    final JourneyView updated = JourneyView(
      id: current.id,
      childId: current.childId,
      status: finished ? 'Completed' : 'Active',
      currentDay: nextDay,
      missionsPlanned: current.missionsPlanned,
      missionsCompleted: completed,
      completionPercent: completed * 100 / current.missionsPlanned,
      streak: counts ? current.streak + 1 : 0,
      reassessmentUnlocked: finished,
      completionStatuses: current.completionStatuses,
      difficultyOptions: current.difficultyOptions,
      countedCompletionStatuses: current.countedCompletionStatuses,
      enjoymentMin: current.enjoymentMin,
      enjoymentMax: current.enjoymentMax,
      today: finished
          ? null
          : _buildToday(
              day: nextDay,
              skillId: current.today?.mission.skillId ?? 'SKILL_CONFIDENCE',
            ),
    );
    _journeysByChild[entry.key] = updated;
    _replaceChild(
      entry.key,
      journeyStatus: updated.status,
      currentStreak: updated.streak,
    );
    return updated;
  }

  @override
  Future<WeeklyJourneySummary> getWeeklyJourneySummary(
    String token,
    String journeyId,
    int week,
  ) async {
    _requireDemoToken(token);
    final JourneyView journey = _journeysByChild.values.firstWhere(
      (JourneyView item) => item.id == journeyId,
      orElse: () => throw const PandaWiseApiException(
        'Journey was not found.',
        code: 'NOT_FOUND',
      ),
    );
    final int weekStart = (week - 1).clamp(0, 2).toInt() * 7;
    final int completed =
        (journey.missionsCompleted - weekStart).clamp(0, 7).toInt();
    return WeeklyJourneySummary(
      week: week,
      completed: completed,
      completionPercent: completed * 100 / 7,
      totalPoints: completed * 10,
      averageEnjoyment: 4.3,
      streak: journey.streak,
      message:
          'Wonderful consistency—celebrate the effort and keep the missions playful.',
      mostPracticedSkill: 'Confidence',
    );
  }

  @override
  Future<ChildProgressView> getChildProgress(
    String token,
    String childId,
  ) async {
    _requireDemoToken(token);
    final ChildProfile child = _requireChild(childId);
    final JourneyView? journey = _journeysByChild[childId];
    final String? assessmentId = _latestAssessmentByChild[childId];
    final GrowScoreReport? report =
        assessmentId == null ? null : _reports[assessmentId];
    final PlanOption plan = _plans.firstWhere(
      (PlanOption item) => item.planId == _parent.subscriptionPlanId,
    );
    final String nextAction = report == null
        ? 'DEVELOPMENT_CHECK'
        : journey == null
            ? 'START_JOURNEY'
            : journey.status == 'Active' || journey.status == 'Paused'
                ? 'CONTINUE_JOURNEY'
                : journey.reassessmentUnlocked
                    ? 'REASSESS'
                    : 'VIEW_PROGRESS';
    final List<AssessmentHistoryItem> history = report == null
        ? <AssessmentHistoryItem>[]
        : <AssessmentHistoryItem>[
            AssessmentHistoryItem(
              assessmentId: 'DEMO_ASSESSMENT_PREVIOUS',
              sequence: 1,
              completedAt: '2026-05-10T10:30:00.000Z',
              growScore: report.growScore - 4,
              scoreBand: 'Growing',
              journeyStatus: 'Completed',
              journeyCompletionPercent: 100,
            ),
            AssessmentHistoryItem(
              assessmentId: report.assessmentId,
              sequence: 2,
              completedAt: '2026-08-10T10:30:00.000Z',
              growScore: report.growScore,
              scoreBand: report.scoreBandLabel,
              changeFromPrevious: 4,
              journeyStatus: journey?.status,
              journeyCompletionPercent: journey?.completionPercent,
            ),
          ];
    return ChildProgressView(
      entitlements: ProgressEntitlements(
        planId: plan.planId,
        planName: plan.planName,
        growthTrackerEnabled: plan.growthTrackerEnabled,
        assessmentHistoryAccess: plan.assessmentHistoryAccess,
        assessmentComparison: plan.assessmentComparison,
        advancedAnalyticsEnabled: plan.advancedAnalyticsEnabled,
      ),
      assessment: AssessmentProgressSnapshot(
        latestAssessmentId: assessmentId,
        latestGrowScore: report?.growScore,
        previousGrowScore: report == null ? null : report.growScore - 4,
        changeFromPrevious: report == null ? null : 4,
        completedAt: assessmentId == null ? null : '2026-08-10T10:30:00.000Z',
        scoreBand: report?.scoreBandLabel,
        comparisonAvailable: report != null,
        message: report == null
            ? 'Complete the Development Check to begin tracking growth.'
            : '${child.displayName} has grown steadily across recent check-ins.',
      ),
      activity: MissionActivitySnapshot(
        journeyId: journey?.id,
        status: journey?.status ?? 'Not Started',
        missionsPlanned: journey?.missionsPlanned ?? 0,
        missionsCompleted: journey?.missionsCompleted ?? 0,
        completionPercent: journey?.completionPercent ?? 0,
        streak: journey?.streak ?? 0,
        points: (journey?.missionsCompleted ?? 0) * 10,
      ),
      skillTrends: plan.growthTrackerEnabled ? _skillTrends(report) : const [],
      assessmentHistory: plan.assessmentHistoryAccess == 'Latest Only'
          ? history.length <= 1
              ? history
              : <AssessmentHistoryItem>[history.last]
          : history,
      actions: ProgressActions(
        canReassess: journey?.reassessmentUnlocked ?? false,
        canStartJourney: report != null && journey == null,
        nextAction: nextAction,
      ),
    );
  }

  @override
  Future<PlanCatalogue> getPlans(String token) async {
    _requireDemoToken(token);
    return PlanCatalogue(
      currentPlanId: _parent.subscriptionPlanId,
      plans: _plans,
    );
  }

  @override
  Future<ParentProfile> changePlan(String token, String planId) async {
    _requireDemoToken(token);
    final PlanOption plan = _plans.firstWhere(
      (PlanOption item) => item.planId == planId,
      orElse: () => throw const PandaWiseApiException(
        'Plan was not found.',
        code: 'NOT_FOUND',
      ),
    );
    _parent = _copyParent(
      subscriptionPlanId: plan.planId,
      subscriptionPlanName: plan.planName,
      weeklySummaryAvailable: plan.weeklySummaryEnabled,
    );
    return _parent;
  }

  @override
  Future<ParentProfile> updateParentProfile(
    String token, {
    required String name,
    required String parentType,
    required String mobileNumber,
    required String preferredLanguageId,
    required String dailyTimeCommitment,
  }) async {
    _requireDemoToken(token);
    _parent = _copyParent(
      name: name,
      parentType: parentType,
      mobileNumber: mobileNumber,
      preferredLanguageId: preferredLanguageId,
      dailyTimeCommitment: dailyTimeCommitment,
    );
    return _parent;
  }

  @override
  Future<ParentProfile> updateNotificationPreferences(
    String token, {
    required bool pushNotification,
    required bool emailNotification,
    required bool whatsAppNotification,
    required bool weeklySummary,
    required bool missionReminder,
  }) async {
    _requireDemoToken(token);
    _parent = _copyParent(
      pushNotification: pushNotification,
      emailNotification: emailNotification,
      whatsAppNotification: whatsAppNotification,
      weeklySummary: weeklySummary,
      missionReminder: missionReminder,
    );
    return _parent;
  }

  @override
  Future<ParentProfile> updateMarketingConsent(
    String token,
    bool marketingConsent,
  ) async {
    _requireDemoToken(token);
    _parent = _copyParent(marketingConsent: marketingConsent);
    return _parent;
  }

  @override
  Future<ParentProfile> applyReferral(
    String token,
    String referralCode,
  ) async {
    _requireDemoToken(token);
    _parent = _copyParent(
      referredBy: referralCode.trim().toUpperCase(),
      referralStatus: 'Applied',
    );
    return _parent;
  }

  @override
  Future<NotificationCentre> getNotifications(String token) async {
    _requireDemoToken(token);
    return const NotificationCentre(items: _notifications);
  }

  ParentProfile _copyParent({
    String? name,
    String? email,
    String? parentType,
    String? mobileNumber,
    String? subscriptionPlanId,
    String? subscriptionPlanName,
    bool? weeklySummaryAvailable,
    String? preferredLanguageId,
    String? dailyTimeCommitment,
    bool? pushNotification,
    bool? emailNotification,
    bool? whatsAppNotification,
    bool? weeklySummary,
    bool? missionReminder,
    bool? marketingConsent,
    String? referredBy,
    String? referralStatus,
  }) {
    return ParentProfile(
      id: _parent.id,
      name: name ?? _parent.name,
      email: email ?? _parent.email,
      parentType: parentType ?? _parent.parentType,
      mobileNumber: mobileNumber ?? _parent.mobileNumber,
      subscriptionPlanId: subscriptionPlanId ?? _parent.subscriptionPlanId,
      subscriptionPlanName:
          subscriptionPlanName ?? _parent.subscriptionPlanName,
      weeklySummaryAvailable:
          weeklySummaryAvailable ?? _parent.weeklySummaryAvailable,
      preferredLanguageId: preferredLanguageId ?? _parent.preferredLanguageId,
      dailyTimeCommitment: dailyTimeCommitment ?? _parent.dailyTimeCommitment,
      pushNotification: pushNotification ?? _parent.pushNotification,
      emailNotification: emailNotification ?? _parent.emailNotification,
      whatsAppNotification:
          whatsAppNotification ?? _parent.whatsAppNotification,
      weeklySummary: weeklySummary ?? _parent.weeklySummary,
      missionReminder: missionReminder ?? _parent.missionReminder,
      marketingConsent: marketingConsent ?? _parent.marketingConsent,
      termsAcceptedAt: _parent.termsAcceptedAt,
      referralCode: _parent.referralCode,
      referredBy: referredBy ?? _parent.referredBy,
      referralStatus: referralStatus ?? _parent.referralStatus,
    );
  }

  void _replaceChild(
    String childId, {
    String? assessmentStatus,
    String? journeyStatus,
    double? currentGrowScore,
    int? currentStreak,
  }) {
    final int index =
        _children.indexWhere((ChildProfile child) => child.id == childId);
    if (index < 0) return;
    final ChildProfile child = _children[index];
    _children[index] = ChildProfile(
      id: child.id,
      name: child.name,
      nickname: child.nickname,
      avatarId: child.avatarId,
      dateOfBirth: child.dateOfBirth,
      ageYears: child.ageYears,
      ageGroupId: child.ageGroupId,
      gender: child.gender,
      schoolId: child.schoolId,
      gradeId: child.gradeId,
      languageId: child.languageId,
      assessmentStatus: assessmentStatus ?? child.assessmentStatus,
      journeyStatus: journeyStatus ?? child.journeyStatus,
      currentGrowScore: currentGrowScore ?? child.currentGrowScore,
      currentBadgeLevel: child.currentBadgeLevel,
      currentStreak: currentStreak ?? child.currentStreak,
    );
  }

  void _requireDemoToken(String token) {
    if (token != demoToken) {
      throw const PandaWiseApiException('Demo session expired.',
          code: 'UNAUTHORIZED');
    }
  }

  ChildProfile _requireChild(String childId) {
    return _children.firstWhere(
      (ChildProfile child) => child.id == childId,
      orElse: () => throw const PandaWiseApiException(
        'Child profile was not found.',
        code: 'NOT_FOUND',
      ),
    );
  }

  AssessmentDetail _requireAssessment(String assessmentId) {
    final AssessmentDetail? assessment = _assessments[assessmentId];
    if (assessment == null) {
      throw const PandaWiseApiException('Assessment was not found.',
          code: 'NOT_FOUND');
    }
    return assessment;
  }

  GrowScoreReport _requireReport(String assessmentId) {
    final GrowScoreReport? report = _reports[assessmentId];
    if (report == null) {
      throw const PandaWiseApiException('GrowScore report was not found.',
          code: 'NOT_FOUND');
    }
    return report;
  }

  int _ageFromDateOfBirth(String value) {
    final DateTime dob = DateTime.parse(value);
    final DateTime now = DateTime.now();
    int age = now.year - dob.year;
    if (now.month < dob.month || (now.month == dob.month && now.day < dob.day))
      age -= 1;
    return age;
  }
}

ParentProfile _seedParent() => const ParentProfile(
      id: 'DEMO_PARENT_001',
      name: 'Priya Sharma',
      email: 'demo@pandawise.app',
      parentType: 'Mother',
      mobileNumber: '9876543210',
      subscriptionPlanId: 'MASTERY',
      subscriptionPlanName: 'Mastery',
      weeklySummaryAvailable: true,
      preferredLanguageId: 'LANG_EN',
      dailyTimeCommitment: '15_MIN',
      pushNotification: true,
      emailNotification: true,
      whatsAppNotification: false,
      weeklySummary: true,
      missionReminder: true,
      marketingConsent: true,
      termsAcceptedAt: '2026-08-01T09:00:00.000Z',
      referralCode: 'PANDA-DEMO',
      referralStatus: 'Available',
    );

ChildProfile _seedChild() => const ChildProfile(
      id: 'DEMO_CHILD_001',
      name: 'Aarav Sharma',
      nickname: 'Aarav',
      avatarId: 'pando-explorer',
      dateOfBirth: '2018-04-18',
      ageYears: 8,
      ageGroupId: 'AG02',
      gender: 'Boy',
      schoolId: 'SCH001',
      gradeId: 'GRADE03',
      languageId: 'LANG_EN',
      assessmentStatus: 'Completed',
      journeyStatus: 'Active',
      currentGrowScore: 72,
      currentBadgeLevel: 'Champion',
      currentStreak: 5,
    );

const BootstrapData _bootstrap = BootstrapData(
  ageGroups: const <MasterOption>[
    MasterOption(id: 'AG01', name: 'Ages 3–6'),
    MasterOption(id: 'AG02', name: 'Ages 6–9'),
    MasterOption(id: 'AG03', name: 'Ages 9–12'),
  ],
  languages: const <MasterOption>[
    MasterOption(id: 'LANG_EN', name: 'English'),
    MasterOption(id: 'LANG_TA', name: 'Tamil'),
    MasterOption(id: 'LANG_HI', name: 'Hindi'),
  ],
  schools: const <MasterOption>[
    MasterOption(id: 'SCH001', name: 'PSBB K.K. Nagar'),
    MasterOption(id: 'SCH002', name: 'DAV Boys Senior Secondary School'),
    MasterOption(id: 'SCH003', name: 'Chettinad Vidyashram'),
    MasterOption(id: 'SCH004', name: 'Sishya School'),
  ],
  grades: const <MasterOption>[
    MasterOption(id: 'GRADE01', name: 'Grade 1'),
    MasterOption(id: 'GRADE02', name: 'Grade 2'),
    MasterOption(id: 'GRADE03', name: 'Grade 3'),
    MasterOption(id: 'GRADE04', name: 'Grade 4'),
    MasterOption(id: 'GRADE05', name: 'Grade 5'),
  ],
  skills: _skillOptions,
  passions: const <MasterOption>[
    MasterOption(
        id: 'PASSION_ART',
        name: 'Drawing & Art',
        category: 'Creative',
        ageGroupEligibility: 'ALL'),
    MasterOption(
        id: 'PASSION_SCIENCE',
        name: 'Science Experiments',
        category: 'STEM',
        ageGroupEligibility: 'AG02|AG03'),
    MasterOption(
        id: 'PASSION_READING',
        name: 'Stories & Reading',
        category: 'Reading',
        ageGroupEligibility: 'ALL'),
    MasterOption(
        id: 'PASSION_SPORTS',
        name: 'Outdoor Sports',
        category: 'Sports',
        ageGroupEligibility: 'ALL'),
    MasterOption(
        id: 'PASSION_MUSIC',
        name: 'Music',
        category: 'Music',
        ageGroupEligibility: 'ALL'),
    MasterOption(
        id: 'PASSION_NATURE',
        name: 'Nature',
        category: 'Nature',
        ageGroupEligibility: 'ALL'),
    MasterOption(
        id: 'PASSION_COOKING',
        name: 'Cooking',
        category: 'Life Skills',
        ageGroupEligibility: 'AG02|AG03'),
  ],
  timeCommitments: const <String>[
    '10_MIN',
    '15_MIN',
    '20_MIN',
    '30_MIN',
    'WEEKENDS_ONLY'
  ],
  parentTypes: const <String>['Mother', 'Father', 'Guardian', 'Grandparent'],
  genders: const <String>['Boy', 'Girl', 'Prefer Not to Say'],
  avatars: const <MasterOption>[
    MasterOption(id: 'pando-explorer', name: 'Explorer'),
    MasterOption(id: 'pando-creator', name: 'Creator'),
    MasterOption(id: 'pando-champion', name: 'Champion'),
  ],
  badges: const <MasterOption>[
    MasterOption(id: 'BADGE_EXPLORER', name: 'Explorer'),
    MasterOption(id: 'BADGE_CHAMPION', name: 'Champion'),
    MasterOption(id: 'BADGE_LEADER', name: 'Leader'),
  ],
);

const List<MasterOption> _skillOptions = <MasterOption>[
  MasterOption(
      id: 'SKILL_COMMUNICATION',
      name: 'Communication',
      colour: '#2563EB',
      weight: 12),
  MasterOption(
      id: 'SKILL_CONFIDENCE',
      name: 'Confidence',
      colour: '#16A34A',
      weight: 12),
  MasterOption(
      id: 'SKILL_LOGIC',
      name: 'Logical Thinking',
      colour: '#7C3AED',
      weight: 12),
  MasterOption(
      id: 'SKILL_CREATIVITY',
      name: 'Creativity',
      colour: '#DB2777',
      weight: 10),
  MasterOption(
      id: 'SKILL_CURIOSITY', name: 'Curiosity', colour: '#0891B2', weight: 10),
  MasterOption(
      id: 'SKILL_READING',
      name: 'Reading Habit',
      colour: '#EA580C',
      weight: 10),
  MasterOption(
      id: 'SKILL_EMOTIONAL',
      name: 'Emotional Intelligence',
      colour: '#059669',
      weight: 10),
  MasterOption(
      id: 'SKILL_DISCIPLINE',
      name: 'Discipline',
      colour: '#4F46E5',
      weight: 10),
  MasterOption(
      id: 'SKILL_LEADERSHIP', name: 'Leadership', colour: '#CA8A04', weight: 7),
  MasterOption(
      id: 'SKILL_FINANCIAL',
      name: 'Financial Awareness',
      colour: '#0F766E',
      weight: 7),
];

final List<AssessmentQuestion> _demoQuestions = <AssessmentQuestion>[
  _question(
      'Q_DEMO_01',
      'SKILL_COMMUNICATION',
      'How comfortably does your child explain an idea or experience?',
      'PARENT',
      1),
  _question(
      'Q_DEMO_02',
      'SKILL_CONFIDENCE',
      'When trying something new, how often does your child give it a go?',
      'PARENT',
      2),
  _question('Q_DEMO_03', 'SKILL_LOGIC',
      'Can you spot a pattern in these everyday examples?', 'CHILD', 3),
  _question(
      'Q_DEMO_04',
      'SKILL_CREATIVITY',
      'How often does your child invent new ways to play or create?',
      'PARENT',
      4),
  _question(
      'Q_DEMO_05',
      'SKILL_CURIOSITY',
      'What would you most like to discover about how something works?',
      'CHILD',
      5),
  _question(
      'Q_DEMO_06',
      'SKILL_EMOTIONAL',
      'How often does your child notice how someone else might feel?',
      'PARENT',
      6),
];

AssessmentQuestion _question(
  String id,
  String skillId,
  String text,
  String respondent,
  int order,
) =>
    AssessmentQuestion(
      id: id,
      skillId: skillId,
      text: text,
      respondentType: respondent,
      displayOrder: order,
      options: <AssessmentOption>[
        AssessmentOption(id: '${id}_1', text: 'Not yet'),
        AssessmentOption(id: '${id}_2', text: 'Sometimes'),
        AssessmentOption(id: '${id}_3', text: 'Often'),
        AssessmentOption(id: '${id}_4', text: 'Almost always'),
      ],
    );

GrowScoreReport _buildReport(String assessmentId) {
  final List<GrowScoreSkill> skills = <GrowScoreSkill>[
    _score('SKILL_COMMUNICATION', 'Communication', 78, '#2563EB'),
    _score('SKILL_CONFIDENCE', 'Confidence', 69, '#16A34A'),
    _score('SKILL_LOGIC', 'Logical Thinking', 75, '#7C3AED'),
    _score('SKILL_CREATIVITY', 'Creativity', 84, '#DB2777'),
    _score('SKILL_CURIOSITY', 'Curiosity', 82, '#0891B2'),
    _score('SKILL_READING', 'Reading Habit', 66, '#EA580C'),
    _score('SKILL_EMOTIONAL', 'Emotional Intelligence', 71, '#059669'),
    _score('SKILL_DISCIPLINE', 'Discipline', 64, '#4F46E5'),
    _score('SKILL_LEADERSHIP', 'Leadership', 68, '#CA8A04'),
    _score('SKILL_FINANCIAL', 'Financial Awareness', 63, '#0F766E'),
  ];
  return GrowScoreReport(
    assessmentId: assessmentId,
    growScore: 72,
    scoreBandLabel: 'Growing Strong',
    skills: skills,
    strengths: <GrowScoreSkill>[skills[3], skills[4], skills[0]],
    recommendedFocusAreas: <GrowScoreSkill>[skills[9], skills[7], skills[5]],
    lockedSkillCount: 0,
  );
}

GrowScoreSkill _score(String id, String name, double score, String colour) =>
    GrowScoreSkill(
      skillId: id,
      name: name,
      score: score,
      bandLabel: score >= 75
          ? 'Strength'
          : score >= 65
              ? 'Growing'
              : 'Ready to nurture',
      message: score >= 75
          ? '$name is a strength to celebrate and keep encouraging.'
          : 'Small playful missions can help build $name with confidence.',
      colour: colour,
    );

JourneyView _buildJourney({
  required String childId,
  required String journeyId,
  required int currentDay,
  required int completed,
  String focusSkillId = 'SKILL_CONFIDENCE',
}) =>
    JourneyView(
      id: journeyId,
      childId: childId,
      status: 'Active',
      currentDay: currentDay,
      missionsPlanned: 21,
      missionsCompleted: completed,
      completionPercent: completed * 100 / 21,
      streak: completed.clamp(0, 7).toInt(),
      reassessmentUnlocked: false,
      completionStatuses: const <String>['YES', 'PARTIAL', 'NO', 'SKIPPED'],
      difficultyOptions: const <String>['EASY', 'MEDIUM', 'HARD'],
      countedCompletionStatuses: const <String>['YES', 'PARTIAL'],
      enjoymentMin: 1,
      enjoymentMax: 5,
      today: _buildToday(day: currentDay, skillId: focusSkillId),
    );

JourneyToday _buildToday({required int day, required String skillId}) =>
    JourneyToday(
      scheduleId: 'DEMO_SCHEDULE_${day.toString().padLeft(2, '0')}',
      day: day,
      week: ((day - 1) ~/ 7) + 1,
      scheduledDate: '2026-08-${day.clamp(1, 28).toString().padLeft(2, '0')}',
      reasons: const <String>[
        'Builds confidence',
        'Matches selected interests',
        'Fits a 15-minute routine'
      ],
      mission: JourneyMission(
        id: 'DEMO_MISSION_$day',
        skillId: skillId,
        name: day.isEven ? 'Pando’s Story Challenge' : 'Family Idea Pitch',
        description:
            'A playful activity that turns everyday conversation into a small growth moment.',
        difficulty: 'MEDIUM',
        durationMinutes: 15,
        materialsNeeded:
            'Paper, coloured pencils and one favourite household object',
        parentGuidance:
            'Stay curious, ask one follow-up question and celebrate effort rather than perfection.',
        childInstructions:
            'Choose an idea, draw or describe it, then share why it matters to you.',
        learningOutcome:
            'Practise clear expression, confidence and creative thinking.',
        points: 10,
        indoorOutdoor: 'INDOOR',
        category: 'Communication',
      ),
    );

List<SkillProgressTrend> _skillTrends(GrowScoreReport? report) {
  if (report == null) return <SkillProgressTrend>[];
  return report.skills.take(6).map((GrowScoreSkill skill) {
    return SkillProgressTrend(
      skillId: skill.skillId,
      name: skill.name,
      colour: skill.colour,
      latestScore: skill.score,
      changeFromPrevious: 4,
      points: <ProgressPoint>[
        ProgressPoint(
            assessmentId: 'DEMO_ASSESSMENT_PREVIOUS',
            sequence: 1,
            completedAt: '2026-05-10T10:30:00.000Z',
            score: skill.score - 4),
        ProgressPoint(
            assessmentId: report.assessmentId,
            sequence: 2,
            completedAt: '2026-08-10T10:30:00.000Z',
            score: skill.score),
      ],
    );
  }).toList(growable: false);
}

final List<PlanOption> _plans = <PlanOption>[
  _plan('EXPLORER', 'Explorer', 'Start with the essentials', 0, 0, 1, 2, 30, 5,
      1, false, false, false, 1),
  _plan('GROWTH', 'Growth', 'Build consistent progress', 499, 4999, 3, 6, 50,
      10, 2, true, true, false, 2,
      recommended: true),
  _plan('MASTERY', 'Mastery', 'Unlock the complete journey', 899, 8999, null,
      12, 50, 10, 3, true, true, true, 3),
];

PlanOption _plan(
  String id,
  String name,
  String positioning,
  int monthly,
  int annual,
  int? maxChildren,
  int assessments,
  int questions,
  int skills,
  int missions,
  bool tracker,
  bool timeline,
  bool analytics,
  int order, {
  bool recommended = false,
}) =>
    PlanOption(
      planId: id,
      planName: name,
      positioning: positioning,
      monthlyPriceInr: monthly,
      annualPriceInr: annual,
      maxChildren: maxChildren,
      includedAssessmentsPerYear: assessments,
      questionCount: questions,
      skillsVisible: skills,
      missionsPerSkill: missions,
      journeyLengthDays: 21,
      passionInsightsLevel: id == 'EXPLORER' ? 'Basic' : 'Full',
      growScoreEnabled: true,
      growthTrackerEnabled: tracker,
      growthTimelineEnabled: timeline,
      assessmentHistoryAccess: id == 'EXPLORER' ? 'Latest Only' : 'Full',
      assessmentComparison: id == 'EXPLORER' ? 'Not Included' : 'Enabled',
      weeklySummaryEnabled: id != 'EXPLORER',
      monthlyReportEnabled: id == 'MASTERY',
      advancedAnalyticsEnabled: analytics,
      parentGuidanceLevel: id == 'EXPLORER' ? 'Essential' : 'Enhanced',
      prioritySupport: id == 'MASTERY' ? 'Included' : 'Standard',
      reportExport: id == 'MASTERY' ? 'Included' : 'Not Included',
      multiLanguageLevel:
          id == 'EXPLORER' ? 'One language' : 'Multiple languages',
      displayOrder: order,
      recommended: recommended,
    );

const List<PandaWiseNotification> _notifications = <PandaWiseNotification>[
  PandaWiseNotification(
    id: 'DEMO_NOTIFICATION_001',
    type: 'MISSION_REMINDER',
    title: 'Today’s mission is ready',
    message: 'Aarav’s 15-minute confidence mission is ready to explore.',
    action: 'OPEN_JOURNEY',
    childId: 'DEMO_CHILD_001',
    createdAt: '2026-08-13T07:30:00.000Z',
  ),
  PandaWiseNotification(
    id: 'DEMO_NOTIFICATION_002',
    type: 'STREAK',
    title: 'Five-day streak!',
    message: 'Celebrate the consistency—not perfection.',
    action: 'OPEN_PROGRESS',
    childId: 'DEMO_CHILD_001',
    createdAt: '2026-08-12T18:00:00.000Z',
  ),
  PandaWiseNotification(
    id: 'DEMO_NOTIFICATION_003',
    type: 'WEEKLY_SUMMARY',
    title: 'Weekly reflection available',
    message: 'See the skills Aarav practised most this week.',
    action: 'OPEN_PROGRESS',
    childId: 'DEMO_CHILD_001',
    createdAt: '2026-08-11T09:00:00.000Z',
  ),
];
