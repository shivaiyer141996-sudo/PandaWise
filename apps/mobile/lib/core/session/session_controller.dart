import 'package:flutter/foundation.dart';
import 'package:pandawise_mobile/core/api/pandawise_api.dart';
import 'package:pandawise_mobile/core/models/models.dart';
import 'package:pandawise_mobile/core/session/token_store.dart';

class SessionController extends ChangeNotifier {
  SessionController({required PandaWiseApi api, required TokenStore tokenStore})
      : _api = api,
        _tokenStore = tokenStore;

  final PandaWiseApi _api;
  final TokenStore _tokenStore;

  ParentProfile? _parent;
  List<ChildProfile> _children = <ChildProfile>[];
  String? _token;
  bool _initializing = true;
  bool _busy = false;
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
      try {
        _parent = await _api.getMe(storedToken);
        _children = await _api.getChildren(storedToken);
        _token = storedToken;
      } on Exception {
        await _tokenStore.clear();
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
      final List<String> values = await _api.getSelectedPassions(token, childId);
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
    if (token == null) return null;
    _setBusy(true);
    try {
      final AssessmentDetail assessment = await _api.startAssessment(token, childId);
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
    if (token == null) return false;
    try {
      await _api.saveAssessmentResponse(token, assessmentId, questionId, optionId);
      _error = null;
      return true;
    } on PandaWiseApiException catch (exception) {
      _error = exception.message;
      notifyListeners();
      return false;
    }
  }

  Future<GrowScoreReport?> completeAssessment(String assessmentId) async {
    final String? token = _token;
    if (token == null) return null;
    _setBusy(true);
    try {
      final GrowScoreReport report = await _api.completeAssessment(token, assessmentId);
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
      final GrowScoreReport report = await _api.getLatestGrowScoreReport(token, childId);
      _error = null;
      return report;
    } on PandaWiseApiException catch (exception) {
      _error = exception.message;
      return null;
    } finally {
      _setBusy(false);
    }
  }

  Future<JourneyView?> createJourney(String childId, List<String> focusSkillIds) async {
    final String? token = _token;
    if (token == null) return null;
    _setBusy(true);
    try {
      final JourneyView journey = await _api.createJourney(token, childId, focusSkillIds);
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
    final JourneyToday? today = journey.today;
    if (token == null || today == null) return null;
    _setBusy(true);
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
      _children = await _api.getChildren(token);
      _error = null;
      return updated;
    } on PandaWiseApiException catch (exception) {
      _error = exception.message;
      return null;
    } finally {
      _setBusy(false);
    }
  }

  Future<WeeklyJourneySummary?> getWeeklyJourneySummary(String journeyId, int week) async {
    final String? token = _token;
    if (token == null) return null;
    try {
      final WeeklyJourneySummary summary =
          await _api.getWeeklyJourneySummary(token, journeyId, week);
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
      final ChildProgressView progress = await _api.getChildProgress(token, childId);
      _error = null;
      return progress;
    } on PandaWiseApiException catch (exception) {
      _error = exception.message;
      notifyListeners();
      return null;
    }
  }

  Future<void> logout() async {
    await _tokenStore.clear();
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
