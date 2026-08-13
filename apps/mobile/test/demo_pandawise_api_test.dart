import 'package:flutter_test/flutter_test.dart';
import 'package:pandawise_mobile/core/api/demo_pandawise_api.dart';
import 'package:pandawise_mobile/core/models/models.dart';

void main() {
  group('DemoPandaWiseApi', () {
    test('seeds a complete offline family experience', () async {
      final DemoPandaWiseApi api = DemoPandaWiseApi();
      final AuthResult auth = await api.startDemo();

      expect(auth.token, DemoPandaWiseApi.demoToken);
      expect(auth.parent.name, 'Priya Sharma');
      expect((await api.getChildren(auth.token)).single.displayName, 'Aarav');

      final BootstrapData masters = await api.getBootstrapData();
      expect(masters.ageGroups, hasLength(3));
      expect(masters.schools, isNotEmpty);
      expect(masters.skills, hasLength(10));
      expect(masters.passions, isNotEmpty);

      final GrowScoreReport report = await api.getLatestGrowScoreReport(
        auth.token,
        'DEMO_CHILD_001',
      );
      expect(report.growScore, 72);
      expect(report.skills, hasLength(10));

      final JourneyView journey = await api.getCurrentJourney(
        auth.token,
        'DEMO_CHILD_001',
      );
      expect(journey.today, isNotNull);
      expect(journey.missionsCompleted, 10);

      final ChildProgressView progress = await api.getChildProgress(
        auth.token,
        'DEMO_CHILD_001',
      );
      expect(progress.assessmentHistory, hasLength(2));
      expect(progress.skillTrends, isNotEmpty);
      expect(progress.actions.nextAction, 'CONTINUE_JOURNEY');

      expect((await api.getPlans(auth.token)).plans, hasLength(3));
      expect((await api.getNotifications(auth.token)).items, isNotEmpty);

      await api.changePlan(auth.token, 'EXPLORER');
      final ChildProgressView explorerProgress = await api.getChildProgress(
        auth.token,
        'DEMO_CHILD_001',
      );
      expect(explorerProgress.entitlements.growthTrackerEnabled, isFalse);
      expect(explorerProgress.skillTrends, isEmpty);
      expect(explorerProgress.assessmentHistory, hasLength(1));
    });

    test('keeps child, assessment, mission, and settings writes in memory',
        () async {
      final DemoPandaWiseApi api = DemoPandaWiseApi();
      final AuthResult auth = await api.startDemo();

      final ChildProfile child = await api.createChild(
        auth.token,
        const CreateChildRequest(
          name: 'Mira Sharma',
          nickname: 'Mira',
          avatarId: 'pando-creator',
          dateOfBirth: '2019-02-14',
          gender: 'Girl',
          schoolId: 'SCH003',
          gradeId: 'GRADE02',
          languageId: 'LANG_EN',
          parentTimeCommitment: '20_MIN',
        ),
      );
      expect((await api.getChildren(auth.token)), hasLength(2));
      expect(
        (await api.getChildProgress(auth.token, child.id)).actions.nextAction,
        'DEVELOPMENT_CHECK',
      );

      await api.selectPassions(
        auth.token,
        child.id,
        const <String>['PASSION_MUSIC', 'PASSION_READING'],
      );
      expect(await api.getSelectedPassions(auth.token, child.id), hasLength(2));

      AssessmentDetail assessment = await api.startAssessment(
        auth.token,
        child.id,
      );
      for (final AssessmentQuestion question in assessment.questions) {
        await api.saveAssessmentResponse(
          auth.token,
          assessment.id,
          question.id,
          question.options.last.id,
        );
      }
      assessment = await api.getAssessment(auth.token, assessment.id);
      expect(assessment.answeredCount, assessment.questionCount);
      expect(
        (await api.completeAssessment(auth.token, assessment.id)).growScore,
        greaterThan(0),
      );
      expect(
        (await api.getChildProgress(auth.token, child.id)).actions.nextAction,
        'START_JOURNEY',
      );

      JourneyView journey = await api.createJourney(
        auth.token,
        child.id,
        const <String>['SKILL_CONFIDENCE'],
      );
      journey = await api.completeMission(
        auth.token,
        journey.id,
        journey.today!.scheduleId,
        status: journey.countedCompletionStatuses.first,
        enjoymentScore: 5,
        difficultyFeedback: 'Just Right',
        parentNotes: 'Mira enjoyed this.',
      );
      expect(journey.missionsCompleted, 1);

      ParentProfile parent = await api.updateParentProfile(
        auth.token,
        name: 'Priya S.',
        parentType: 'Mother',
        mobileNumber: '9876543210',
        preferredLanguageId: 'LANG_TA',
        dailyTimeCommitment: '20_MIN',
      );
      expect(parent.name, 'Priya S.');
      parent = await api.updateNotificationPreferences(
        auth.token,
        pushNotification: false,
        emailNotification: true,
        whatsAppNotification: false,
        weeklySummary: true,
        missionReminder: false,
      );
      expect(parent.pushNotification, isFalse);
      expect(
        (await api.changePlan(auth.token, 'GROWTH')).subscriptionPlanName,
        'Growth',
      );
      expect(
        (await api.getChildProgress(auth.token, child.id)).actions.nextAction,
        'CONTINUE_JOURNEY',
      );
      expect(
        (await api.applyReferral(auth.token, 'friend-2026')).referralStatus,
        'Applied',
      );
    });
  });
}
