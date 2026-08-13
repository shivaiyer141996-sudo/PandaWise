import 'package:flutter/foundation.dart';
import 'package:pandawise_mobile/core/api/pandawise_api.dart';
import 'package:pandawise_mobile/core/models/models.dart';
import 'package:pandawise_mobile/core/offline/offline_mutation_store.dart';
import 'package:pandawise_mobile/core/session/token_store.dart';

class SessionController extends ChangeNotifier {
  SessionController({
    required PandaWiseApi api,
    required TokenStore tokenStore,
    OfflineMutationStore? offlineStore,
  })  : _api = api,
        _tokenStore = tokenStore,
        _offlineStore = offlineStore ?? OfflineMutationStore();

  final PandaWiseApi _api;
  final TokenStore _tokenStore;
  final OfflineMutationStore _offlineStore;

  ParentProfile? _parent;
  List<ChildProfile> _children = <ChildProfile>[];
  String? _token;
  bool _initializing = true;
  bool _busy = false;
  bool _syncing = false;
  String? _error;

  ParentProfile? get parent => _parent;
  List<ChildProfile> get children => List<ChildProfile>.unmodifiable(_children);
  bool get isAuthenticated => _token != null && _parent != null;
  bool get initializing => _initializing;
  bool get busy => _busy;
  String? get error => _error;

  Future<void> restore() async {
    if (!_initializing) return;
    final String? storedToken = await _tokenStore.read();
    if (storedToken != null) {
      _token = storedToken;
      try {
        _parent = await _api.getMe(storedToken);
        _children = await _api.getChildren(storedToken);
        await syncPendingChanges();
      } on PandaWiseApiException catch (exception) {
        if (exception.code == 'UNAUTHORIZED') {
          await _tokenStore.clear();
          _token = null;
        } else {
          _error =
              'PandaWise is offline. Your saved changes will sync automatically.';
        }
      } on Exception {
        _error =
            'PandaWise is offline. Your saved changes will sync automatically.';
      }
    }
    _initializing = false;
    notifyListeners();
  }

  Future<bool> login({required String email, required String password}) async {
    return _authenticate(() => _api.login(email: email, password: password));
  }

  Future<bool> register({
    required String name,
    required String parentType,
    required String mobileNumber,
    required String email,
    required String password,
    required bool marketingConsent,
  }) async {
    return _authenticate(
      () => _api.register(
        name: name,
        parentType: parentType,
        mobileNumber: mobileNumber,
        email: email,
        password: password,
        marketingConsent: marketingConsent,
      ),
    );
  }

  Future<bool> _authenticate(Future<AuthResult> Function() action) async {
    _setBusy(true);
    try {
      final AuthResult result = await action();
      _token = result.token;
      _parent = result.parent;
      _children = await _api.getChildren(result.token);
      await _tokenStore.write(result.token);
      await syncPendingChanges();
      _error = null;
      return true;
    } on PandaWiseApiException catch (exception) {
      _error = exception.message;
      return false;
    } finally {
      _setBusy(false);
    }
  }

  Future<bool> createChild(CreateChildRequest request) async {
    final String? token = _token;
    if (token == null) return false;
    _setBusy(true);
    try {
      final ChildProfile child = await _api.createChild(token, request);
      _children = <ChildProfile>[..._children, child];
      _error = null;
      return true;
    } on PandaWiseApiException catch (exception) {
      _error = exception.message;
      return false;
    } finally {
      _setBusy(false);
    }
  }

  Future<void> refreshChildren() async {
    final String? token = _token;
    if (token == null) return;
    try {
      _children = await _api.getChildren(token);
      _error = null;
      notifyListeners();
    } on PandaWiseApiException catch (exception) {
      _error = exception.message;
      notifyListeners();
    }
  }

  Future<List<String>> getSelectedPassions(String childId) async {
    final String? token = _token;
    if (token == null) return <String>[];
    try {
      final List<String> values = await _api.getSelectedPassions(
        token,
        childId,
      );
      _error = null;
      return values;
    } on PandaWiseApiException catch (exception) {
      _error = exception.message;
      notifyListeners();
      rethrow;
    }
  }

  Future<bool> selectPassions(String childId, List<String> passionIds) async {
    final String? token = _token;
    if (token == null) return false;
    _setBusy(true);
    try {
      await _api.selectPassions(token, childId, passionIds);
      _error = null;
      return true;
    } on PandaWiseApiException catch (exception) {
      _error = exception.message;
      return false;
    } finally {
      _setBusy(false);
    }
  }

  Future<AssessmentDetail?> startAssessment(String childId) async {
    final String? token = _token;
    final String? ownerId = _parent?.id;
    if (token == null || ownerId == null) return null;
    _setBusy(true);
    try {
      final AssessmentDetail remote = await _api.startAssessment(
        token,
        childId,
      );
      final AssessmentDetail assessment = remote.withOfflineAnswers(
        await _offlineStore.assessmentAnswers(ownerId, remote.id),
      );
      _error = null;
      return assessment;
    } on PandaWiseApiException catch (exception) {
      _error = exception.message;
      return null;
    } finally {
      _setBusy(false);
    }
  }

  Future<bool> saveAssessmentResponse(
    String assessmentId,
    String questionId,
    String optionId,
  ) async {
    final String? token = _token;
    final String? ownerId = _parent?.id;
    if (token == null || ownerId == null) return false;
    final String deduplicationKey = 'assessment:$assessmentId:$questionId';
    try {
      await _api.saveAssessmentResponse(
        token,
        assessmentId,
        questionId,
        optionId,
      );
      await _offlineStore.removeByDeduplicationKey(ownerId, deduplicationKey);
      _error = null;
      return true;
    } on PandaWiseApiException catch (exception) {
      if (exception.code == 'NETWORK_ERROR') {
        await _offlineStore.enqueue(
          ownerId: ownerId,
          deduplicationKey: deduplicationKey,
          type: OfflineMutationType.assessmentResponse,
          payload: <String, dynamic>{
            'assessmentId': assessmentId,
            'questionId': questionId,
            'optionId': optionId,
          },
        );
        _error =
            'Answer saved on this phone. It will sync when you are online.';
        notifyListeners();
        return true;
      }
      _error = exception.message;
      notifyListeners();
      return false;
    }
  }

  Future<GrowScoreReport?> completeAssessment(String assessmentId) async {
    final String? token = _token;
    final String? ownerId = _parent?.id;
    if (token == null || ownerId == null) return null;
    _setBusy(true);
    try {
      await syncPendingChanges();
      if (await _offlineStore.hasAssessmentResponses(ownerId, assessmentId)) {
        _error =
            'Your answers are saved on this phone. Connect to the internet to submit.';
        return null;
      }
      final GrowScoreReport report = await _api.completeAssessment(
        token,
        assessmentId,
      );
      _children = await _api.getChildren(token);
      _error = null;
      return report;
    } on PandaWiseApiException catch (exception) {
      _error = exception.message;
      return null;
    } finally {
      _setBusy(false);
    }
  }

  Future<GrowScoreReport?> getLatestGrowScoreReport(String childId) async {
    final String? token = _token;
    if (token == null) return null;
    _setBusy(true);
    try {
      final GrowScoreReport report = await _api.getLatestGrowScoreReport(
        token,
        childId,
      );
      _error = null;
      return report;
    } on PandaWiseApiException catch (exception) {
      _error = exception.message;
      return null;
    } finally {
      _setBusy(false);
    }
  }

  Future<JourneyView?> createJourney(
    String childId,
    List<String> focusSkillIds,
  ) async {
    final String? token = _token;
    if (token == null) return null;
    _setBusy(true);
    try {
      final JourneyView journey = await _api.createJourney(
        token,
        childId,
        focusSkillIds,
      );
      _children = await _api.getChildren(token);
      _error = null;
      return journey;
    } on PandaWiseApiException catch (exception) {
      _error = exception.message;
      return null;
    } finally {
      _setBusy(false);
    }
  }

  Future<JourneyView?> getCurrentJourney(String childId) async {
    final String? token = _token;
    if (token == null) return null;
    try {
      final JourneyView journey = await _api.getCurrentJourney(token, childId);
      _error = null;
      return journey;
    } on PandaWiseApiException catch (exception) {
      _error = exception.message;
      notifyListeners();
      return null;
    }
  }

  Future<JourneyView?> completeMission(
    JourneyView journey, {
    required String status,
    required int enjoymentScore,
    required String difficultyFeedback,
    String? parentNotes,
  }) async {
    final String? token = _token;
    final String? ownerId = _parent?.id;
    final JourneyToday? today = journey.today;
    if (token == null || ownerId == null || today == null) return null;
    _setBusy(true);
    final String deduplicationKey = 'mission:${journey.id}:${today.scheduleId}';
    try {
      final JourneyView updated = await _api.completeMission(
        token,
        journey.id,
        today.scheduleId,
        status: status,
        enjoymentScore: enjoymentScore,
        difficultyFeedback: difficultyFeedback,
        parentNotes: parentNotes,
      );
      await _offlineStore.removeByDeduplicationKey(ownerId, deduplicationKey);
      _children = await _api.getChildren(token);
      _error = null;
      return updated;
    } on PandaWiseApiException catch (exception) {
      if (exception.code == 'NETWORK_ERROR') {
        await _offlineStore.enqueue(
          ownerId: ownerId,
          deduplicationKey: deduplicationKey,
          type: OfflineMutationType.missionCompletion,
          payload: <String, dynamic>{
            'journeyId': journey.id,
            'scheduleId': today.scheduleId,
            'status': status,
            'enjoymentScore': enjoymentScore,
            'difficultyFeedback': difficultyFeedback,
            if (parentNotes?.trim().isNotEmpty == true)
              'parentNotes': parentNotes!.trim(),
          },
        );
        final bool counts = journey.countedCompletionStatuses.contains(status);
        final int completed = (journey.missionsCompleted + (counts ? 1 : 0))
            .clamp(0, journey.missionsPlanned)
            .toInt();
        final double completionPercent = journey.missionsPlanned == 0
            ? 0
            : completed * 100 / journey.missionsPlanned;
        _error =
            'Mission saved on this phone. It will sync when you are online.';
        return journey.copyWith(
          status: completed == journey.missionsPlanned
              ? 'Completed'
              : journey.status,
          currentDay: (journey.currentDay + 1)
              .clamp(1, journey.missionsPlanned)
              .toInt(),
          missionsCompleted: completed,
          completionPercent: completionPercent,
          streak: counts ? journey.streak + 1 : 0,
          reassessmentUnlocked: completed == journey.missionsPlanned,
          clearToday: true,
        );
      }
      _error = exception.message;
      return null;
    } finally {
      _setBusy(false);
    }
  }

  Future<WeeklyJourneySummary?> getWeeklyJourneySummary(
    String journeyId,
    int week,
  ) async {
    final String? token = _token;
    if (token == null) return null;
    try {
      final WeeklyJourneySummary summary = await _api.getWeeklyJourneySummary(
        token,
        journeyId,
        week,
      );
      _error = null;
      return summary;
    } on PandaWiseApiException catch (exception) {
      _error = exception.message;
      notifyListeners();
      return null;
    }
  }

  Future<ChildProgressView?> getChildProgress(String childId) async {
    final String? token = _token;
    if (token == null) return null;
    try {
      final ChildProgressView progress = await _api.getChildProgress(
        token,
        childId,
      );
      _error = null;
      return progress;
    } on PandaWiseApiException catch (exception) {
      _error = exception.message;
      notifyListeners();
      return null;
    }
  }

  Future<PlanCatalogue?> getPlans() async {
    final String? token = _token;
    if (token == null) return null;
    try {
      final PlanCatalogue plans = await _api.getPlans(token);
      _error = null;
      return plans;
    } on PandaWiseApiException catch (exception) {
      _error = exception.message;
      notifyListeners();
      return null;
    }
  }

  Future<bool> changePlan(String planId) async {
    final String? token = _token;
    if (token == null) return false;
    return _updateParent(
      () => _api.changePlan(token, planId),
      refreshChildren: true,
    );
  }

  Future<bool> updateParentProfile({
    required String name,
    required String parentType,
    required String mobileNumber,
    required String preferredLanguageId,
    required String dailyTimeCommitment,
  }) async {
    final String? token = _token;
    final String? ownerId = _parent?.id;
    if (token == null || ownerId == null) return false;
    _setBusy(true);
    const String deduplicationKey = 'profile:current';
    try {
      _parent = await _api.updateParentProfile(
        token,
        name: name,
        parentType: parentType,
        mobileNumber: mobileNumber,
        preferredLanguageId: preferredLanguageId,
        dailyTimeCommitment: dailyTimeCommitment,
      );
      await _offlineStore.removeByDeduplicationKey(ownerId, deduplicationKey);
      _error = null;
      return true;
    } on PandaWiseApiException catch (exception) {
      if (exception.code == 'NETWORK_ERROR' && _parent != null) {
        await _offlineStore.enqueue(
          ownerId: ownerId,
          deduplicationKey: deduplicationKey,
          type: OfflineMutationType.profileUpdate,
          payload: <String, dynamic>{
            'name': name,
            'parentType': parentType,
            'mobileNumber': mobileNumber,
            'preferredLanguageId': preferredLanguageId,
            'dailyTimeCommitment': dailyTimeCommitment,
          },
        );
        _parent = _parent!.copyWith(
          name: name,
          parentType: parentType,
          mobileNumber: mobileNumber,
          preferredLanguageId: preferredLanguageId,
          dailyTimeCommitment: dailyTimeCommitment,
        );
        _error =
            'Profile changes saved on this phone. They will sync when you are online.';
        return true;
      }
      _error = exception.message;
      return false;
    } finally {
      _setBusy(false);
    }
  }

  Future<void> syncPendingChanges() async {
    final String? token = _token;
    if (token == null || _syncing) return;
    _syncing = true;
    try {
      if (_parent == null) {
        _parent = await _api.getMe(token);
        _children = await _api.getChildren(token);
      }
      final String ownerId = _parent!.id;
      bool refreshChildren = false;
      for (final OfflineMutation mutation
          in await _offlineStore.pendingForOwner(ownerId)) {
        try {
          final Map<String, dynamic> payload = mutation.payload;
          switch (mutation.type) {
            case OfflineMutationType.assessmentResponse:
              await _api.saveAssessmentResponse(
                token,
                payload['assessmentId'] as String,
                payload['questionId'] as String,
                payload['optionId'] as String,
              );
              break;
            case OfflineMutationType.missionCompletion:
              await _api.completeMission(
                token,
                payload['journeyId'] as String,
                payload['scheduleId'] as String,
                status: payload['status'] as String,
                enjoymentScore: payload['enjoymentScore'] as int,
                difficultyFeedback: payload['difficultyFeedback'] as String,
                parentNotes: payload['parentNotes'] as String?,
              );
              refreshChildren = true;
              break;
            case OfflineMutationType.profileUpdate:
              _parent = await _api.updateParentProfile(
                token,
                name: payload['name'] as String,
                parentType: payload['parentType'] as String,
                mobileNumber: payload['mobileNumber'] as String,
                preferredLanguageId: payload['preferredLanguageId'] as String,
                dailyTimeCommitment: payload['dailyTimeCommitment'] as String,
              );
              break;
          }
          await _offlineStore.remove(mutation.id);
          _error = null;
        } on PandaWiseApiException catch (exception) {
          _error = exception.code == 'NETWORK_ERROR'
              ? 'Changes are safe on this phone and will sync when you are online.'
              : exception.message;
          break;
        }
      }
      if (refreshChildren) {
        _children = await _api.getChildren(token);
      }
    } on PandaWiseApiException catch (exception) {
      if (exception.code == 'UNAUTHORIZED') {
        await _tokenStore.clear();
        _token = null;
        _parent = null;
        _children = <ChildProfile>[];
      }
      _error = exception.code == 'NETWORK_ERROR'
          ? 'Changes are safe on this phone and will sync when you are online.'
          : exception.message;
    } finally {
      _syncing = false;
      notifyListeners();
    }
  }

  Future<bool> updateNotificationPreferences({
    required bool pushNotification,
    required bool emailNotification,
    required bool weeklySummary,
    required bool missionReminder,
  }) async {
    final String? token = _token;
    if (token == null) return false;
    return _updateParent(
      () => _api.updateNotificationPreferences(
        token,
        pushNotification: pushNotification,
        emailNotification: emailNotification,
        whatsAppNotification: false,
        weeklySummary: weeklySummary,
        missionReminder: missionReminder,
      ),
    );
  }

  Future<bool> updateMarketingConsent(bool marketingConsent) async {
    final String? token = _token;
    if (token == null) return false;
    return _updateParent(
      () => _api.updateMarketingConsent(token, marketingConsent),
    );
  }

  Future<bool> applyReferral(String referralCode) async {
    final String? token = _token;
    if (token == null) return false;
    return _updateParent(() => _api.applyReferral(token, referralCode));
  }

  Future<NotificationCentre?> getNotifications() async {
    final String? token = _token;
    if (token == null) return null;
    try {
      final NotificationCentre notifications = await _api.getNotifications(
        token,
      );
      _error = null;
      return notifications;
    } on PandaWiseApiException catch (exception) {
      _error = exception.message;
      notifyListeners();
      return null;
    }
  }

  Future<bool> _updateParent(
    Future<ParentProfile> Function() action, {
    bool refreshChildren = false,
  }) async {
    _setBusy(true);
    try {
      _parent = await action();
      if (refreshChildren && _token != null) {
        _children = await _api.getChildren(_token!);
      }
      _error = null;
      return true;
    } on PandaWiseApiException catch (exception) {
      _error = exception.message;
      return false;
    } finally {
      _setBusy(false);
    }
  }

  Future<void> logout() async {
    await _tokenStore.clear();
    await _offlineStore.clear();
    _token = null;
    _parent = null;
    _children = <ChildProfile>[];
    _error = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void _setBusy(bool value) {
    _busy = value;
    notifyListeners();
  }
}
