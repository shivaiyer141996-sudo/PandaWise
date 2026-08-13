import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pandawise_mobile/app.dart';
import 'package:pandawise_mobile/core/api/demo_pandawise_api.dart';
import 'package:pandawise_mobile/core/api/pandawise_api.dart';
import 'package:pandawise_mobile/core/models/models.dart';
import 'package:pandawise_mobile/core/offline/offline_mutation_store.dart';
import 'package:pandawise_mobile/core/session/session_controller.dart';
import 'package:pandawise_mobile/core/session/token_store.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('shows login after restoring an empty session', (
    WidgetTester tester,
  ) async {
    final _FakeApi api = _FakeApi();
    final SessionController session = SessionController(
      api: api,
      tokenStore: MemoryTokenStore(),
      offlineStore: OfflineMutationStore(storage: MemoryOfflineKeyValueStore()),
    );

    await tester.pumpWidget(PandaWiseApp(api: api, session: session));
    await tester.pumpAndSettle();

    expect(find.text('Welcome back'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);
  });

  testWidgets('logs in and shows the Sprint 1 dashboard', (
    WidgetTester tester,
  ) async {
    final _FakeApi api = _FakeApi();
    final SessionController session = SessionController(
      api: api,
      tokenStore: MemoryTokenStore(),
      offlineStore: OfflineMutationStore(storage: MemoryOfflineKeyValueStore()),
    );
    await tester.pumpWidget(PandaWiseApp(api: api, session: session));
    await tester.pumpAndSettle();

    final Finder fields = find.byType(TextFormField);
    await tester.enterText(fields.at(0), 'parent@example.com');
    await tester.enterText(fields.at(1), 'PandaWise1');
    await tester.tap(find.widgetWithText(FilledButton, 'Login'));
    await tester.pumpAndSettle();

    expect(find.text('Hi Shiva 👋'), findsWidgets);
    expect(find.text('Tell us about your child'), findsOneWidget);
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Children'), findsOneWidget);
    expect(find.text('Journey'), findsOneWidget);
    expect(find.text('Progress'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);
  });

  testWidgets('enters backend-free Demo Mode from login', (
    WidgetTester tester,
  ) async {
    final DemoPandaWiseApi api = DemoPandaWiseApi();
    final SessionController session = SessionController(
      api: api,
      tokenStore: MemoryTokenStore(),
      offlineStore: OfflineMutationStore(storage: MemoryOfflineKeyValueStore()),
      demoAvailable: true,
    );

    await tester.pumpWidget(PandaWiseApp(api: api, session: session));
    await tester.pumpAndSettle();

    expect(find.text('Explore Demo Mode'), findsOneWidget);
    expect(find.text('No account or internet required'), findsOneWidget);

    await tester.ensureVisible(find.text('Explore Demo Mode'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Explore Demo Mode'));
    await tester.pumpAndSettle();

    expect(session.isDemoMode, isTrue);
    expect(find.text('Demo Mode - Offline'), findsOneWidget);
    expect(find.text('Hi Priya 👋'), findsWidgets);
    expect(find.text('Aarav'), findsWidgets);
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Children'), findsOneWidget);
    expect(find.text('Journey'), findsOneWidget);
    expect(find.text('Progress'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);
  });
}

class _FakeApi implements PandaWiseApi {
  static const ParentProfile _parent = ParentProfile(
    id: 'PAR001',
    name: 'Shiva Iyer',
    email: 'parent@example.com',
    parentType: 'Father',
    mobileNumber: '9876543210',
    subscriptionPlanId: 'PLN001',
    subscriptionPlanName: 'Explorer',
    weeklySummaryAvailable: false,
    preferredLanguageId: 'LNG001',
    dailyTimeCommitment: '15_MIN',
    pushNotification: false,
    emailNotification: false,
    whatsAppNotification: false,
    weeklySummary: false,
    missionReminder: false,
    marketingConsent: false,
    termsAcceptedAt: '2026-08-12T09:00:00.000Z',
    referralCode: 'PWTEST001',
    referralStatus: 'Not Applicable',
  );

  @override
  Future<ParentProfile> applyReferral(String token, String referralCode) {
    throw UnimplementedError();
  }

  @override
  Future<ParentProfile> changePlan(String token, String planId) {
    throw UnimplementedError();
  }

  @override
  Future<ChildProfile> createChild(String token, CreateChildRequest request) {
    throw UnimplementedError();
  }

  @override
  Future<ChildProgressView> getChildProgress(String token, String childId) {
    throw UnimplementedError();
  }

  @override
  Future<NotificationCentre> getNotifications(String token) {
    throw UnimplementedError();
  }

  @override
  Future<PlanCatalogue> getPlans(String token) {
    throw UnimplementedError();
  }

  @override
  Future<JourneyView> createJourney(
    String token,
    String childId,
    List<String> focusSkillIds,
  ) {
    throw UnimplementedError();
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
  }) {
    throw UnimplementedError();
  }

  @override
  Future<GrowScoreReport> completeAssessment(
    String token,
    String assessmentId,
  ) {
    throw UnimplementedError();
  }

  @override
  Future<AssessmentDetail> getAssessment(String token, String assessmentId) {
    throw UnimplementedError();
  }

  @override
  Future<GrowScoreReport> getAssessmentReport(
    String token,
    String assessmentId,
  ) {
    throw UnimplementedError();
  }

  @override
  Future<GrowScoreReport> getLatestGrowScoreReport(
    String token,
    String childId,
  ) {
    throw UnimplementedError();
  }

  @override
  Future<JourneyView> getCurrentJourney(String token, String childId) {
    throw UnimplementedError();
  }

  @override
  Future<WeeklyJourneySummary> getWeeklyJourneySummary(
    String token,
    String journeyId,
    int week,
  ) {
    throw UnimplementedError();
  }

  @override
  Future<BootstrapData> getBootstrapData() async {
    return const BootstrapData(
      ageGroups: <MasterOption>[],
      languages: <MasterOption>[MasterOption(id: 'LNG001', name: 'English')],
      schools: <MasterOption>[],
      grades: <MasterOption>[],
      timeCommitments: <String>['15_MIN'],
      parentTypes: <String>['Father'],
      genders: <String>['Prefer not to say'],
      avatars: <MasterOption>[
        MasterOption(id: 'pando-smile', name: 'Pando smile'),
      ],
    );
  }

  @override
  Future<List<ChildProfile>> getChildren(String token) async =>
      <ChildProfile>[];

  @override
  Future<List<String>> getSelectedPassions(
    String token,
    String childId,
  ) async =>
      <String>[];

  @override
  Future<ParentProfile> getMe(String token) async => _parent;

  @override
  Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    return const AuthResult(token: 'test-token', parent: _parent);
  }

  @override
  Future<void> requestPasswordReset(String email) async {}

  @override
  Future<ParentProfile> updateMarketingConsent(
    String token,
    bool marketingConsent,
  ) {
    throw UnimplementedError();
  }

  @override
  Future<ParentProfile> updateNotificationPreferences(
    String token, {
    required bool pushNotification,
    required bool emailNotification,
    required bool whatsAppNotification,
    required bool weeklySummary,
    required bool missionReminder,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<ParentProfile> updateParentProfile(
    String token, {
    required String name,
    required String parentType,
    required String mobileNumber,
    required String preferredLanguageId,
    required String dailyTimeCommitment,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<void> saveAssessmentResponse(
    String token,
    String assessmentId,
    String questionId,
    String optionId,
  ) async {}

  @override
  Future<List<String>> selectPassions(
    String token,
    String childId,
    List<String> passionIds,
  ) async =>
      passionIds;

  @override
  Future<AssessmentDetail> startAssessment(String token, String childId) {
    throw UnimplementedError();
  }

  @override
  Future<AuthResult> register({
    required String name,
    required String parentType,
    required String mobileNumber,
    required String email,
    required String password,
    required bool marketingConsent,
  }) async {
    return const AuthResult(token: 'test-token', parent: _parent);
  }
}
