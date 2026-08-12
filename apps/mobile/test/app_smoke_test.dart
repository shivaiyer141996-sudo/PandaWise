import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pandawise_mobile/app.dart';
import 'package:pandawise_mobile/core/api/pandawise_api.dart';
import 'package:pandawise_mobile/core/models/models.dart';
import 'package:pandawise_mobile/core/session/session_controller.dart';
import 'package:pandawise_mobile/core/session/token_store.dart';

void main() {
  testWidgets('shows login after restoring an empty session', (WidgetTester tester) async {
    final _FakeApi api = _FakeApi();
    final SessionController session = SessionController(
      api: api,
      tokenStore: MemoryTokenStore(),
    );

    await tester.pumpWidget(PandaWiseApp(api: api, session: session));
    await tester.pumpAndSettle();

    expect(find.text('Welcome back'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);
  });

  testWidgets('logs in and shows the Sprint 1 dashboard', (WidgetTester tester) async {
    final _FakeApi api = _FakeApi();
    final SessionController session = SessionController(
      api: api,
      tokenStore: MemoryTokenStore(),
    );
    await tester.pumpWidget(PandaWiseApp(api: api, session: session));
    await tester.pumpAndSettle();

    final Finder fields = find.byType(TextFormField);
    await tester.enterText(fields.at(0), 'parent@example.com');
    await tester.enterText(fields.at(1), 'PandaWise1');
    await tester.tap(find.widgetWithText(FilledButton, 'Login'));
    await tester.pumpAndSettle();

    expect(find.text('Hi Shiva 👋'), findsOneWidget);
    expect(find.text('Tell us about your child'), findsOneWidget);
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
    subscriptionPlanId: 'PLN001',
    dailyTimeCommitment: '15_MIN',
  );

  @override
  Future<ChildProfile> createChild(String token, CreateChildRequest request) {
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
    );
  }

  @override
  Future<List<ChildProfile>> getChildren(String token) async => <ChildProfile>[];

  @override
  Future<ParentProfile> getMe(String token) async => _parent;

  @override
  Future<AuthResult> login({required String email, required String password}) async {
    return const AuthResult(token: 'test-token', parent: _parent);
  }

  @override
  Future<void> requestPasswordReset(String email) async {}

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
