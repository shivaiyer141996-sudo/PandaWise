import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:http/http.dart' as http;
import 'package:pandawise_mobile/core/models/models.dart';

class PandaWiseApiException implements Exception {
  const PandaWiseApiException(this.message, {this.code});

  final String message;
  final String? code;

  @override
  String toString() => message;
}

abstract interface class PandaWiseApi {
  Future<AuthResult> login({required String email, required String password});

  Future<AuthResult> register({
    required String name,
    required String parentType,
    required String mobileNumber,
    required String email,
    required String password,
    required bool marketingConsent,
  });

  Future<void> requestPasswordReset(String email);
  Future<ParentProfile> getMe(String token);
  Future<List<ChildProfile>> getChildren(String token);
  Future<ChildProfile> createChild(String token, CreateChildRequest request);
  Future<BootstrapData> getBootstrapData();
  Future<List<String>> getSelectedPassions(String token, String childId);
  Future<List<String>> selectPassions(String token, String childId, List<String> passionIds);
  Future<AssessmentDetail> startAssessment(String token, String childId);
  Future<AssessmentDetail> getAssessment(String token, String assessmentId);
  Future<void> saveAssessmentResponse(
    String token,
    String assessmentId,
    String questionId,
    String optionId,
  );
  Future<GrowScoreReport> completeAssessment(String token, String assessmentId);
  Future<GrowScoreReport> getAssessmentReport(String token, String assessmentId);
  Future<GrowScoreReport> getLatestGrowScoreReport(String token, String childId);
  Future<JourneyView> createJourney(String token, String childId, List<String> focusSkillIds);
  Future<JourneyView> getCurrentJourney(String token, String childId);
  Future<JourneyView> completeMission(
    String token,
    String journeyId,
    String scheduleId, {
    required String status,
    required int enjoymentScore,
    required String difficultyFeedback,
    String? parentNotes,
  });
  Future<WeeklyJourneySummary> getWeeklyJourneySummary(
    String token,
    String journeyId,
    int week,
  );
  Future<ChildProgressView> getChildProgress(String token, String childId);
  Future<PlanCatalogue> getPlans(String token);
  Future<ParentProfile> changePlan(String token, String planId);
  Future<ParentProfile> updateParentProfile(
    String token, {
    required String name,
    required String parentType,
    required String mobileNumber,
    required String preferredLanguageId,
    required String dailyTimeCommitment,
  });
  Future<ParentProfile> updateNotificationPreferences(
    String token, {
    required bool pushNotification,
    required bool emailNotification,
    required bool whatsAppNotification,
    required bool weeklySummary,
    required bool missionReminder,
  });
  Future<ParentProfile> updateMarketingConsent(String token, bool marketingConsent);
  Future<ParentProfile> applyReferral(String token, String referralCode);
  Future<NotificationCentre> getNotifications(String token);
}

class HttpPandaWiseApi implements PandaWiseApi {
  HttpPandaWiseApi({
    http.Client? client,
    String? baseUrl,
    Duration requestTimeout = const Duration(seconds: 15),
    Duration initialRetryDelay = const Duration(milliseconds: 250),
    int maxGetAttempts = 3,
  })  : assert(maxGetAttempts > 0),
        _client = client ?? http.Client(),
        _baseUrl = baseUrl ??
            const String.fromEnvironment(
              'PANDAWISE_API_BASE_URL',
              defaultValue: 'http://10.0.2.2:8080',
            ),
        _requestTimeout = requestTimeout,
        _initialRetryDelay = initialRetryDelay,
        _maxGetAttempts = maxGetAttempts;

  final http.Client _client;
  final String _baseUrl;
  final Duration _requestTimeout;
  final Duration _initialRetryDelay;
  final int _maxGetAttempts;

  @override
  Future<AuthResult> login({required String email, required String password}) async {
    final Map<String, dynamic> json = await _send(
      'POST',
      '/v1/auth/login',
      body: <String, dynamic>{'email': email, 'password': password},
    );
    return _authResult(json);
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
    final Map<String, dynamic> json = await _send(
      'POST',
      '/v1/auth/register',
      body: <String, dynamic>{
        'name': name,
        'parentType': parentType,
        'mobileNumber': mobileNumber,
        'email': email,
        'password': password,
        'preferredLanguageId': 'LNG001',
        'dailyTimeCommitment': '15_MIN',
        'termsAccepted': true,
        'marketingConsent': marketingConsent,
      },
    );
    return _authResult(json);
  }

  @override
  Future<void> requestPasswordReset(String email) async {
    await _send(
      'POST',
      '/v1/auth/forgot-password',
      body: <String, dynamic>{'email': email},
    );
  }

  @override
  Future<ParentProfile> getMe(String token) async {
    final Map<String, dynamic> json = await _send('GET', '/v1/me', token: token);
    return ParentProfile.fromJson(json['parent'] as Map<String, dynamic>);
  }

  @override
  Future<List<ChildProfile>> getChildren(String token) async {
    final Map<String, dynamic> json = await _send('GET', '/v1/children', token: token);
    return (json['children'] as List<dynamic>)
        .map((dynamic child) => ChildProfile.fromJson(child as Map<String, dynamic>))
        .toList(growable: false);
  }

  @override
  Future<ChildProfile> createChild(String token, CreateChildRequest request) async {
    final Map<String, dynamic> json = await _send(
      'POST',
      '/v1/children',
      token: token,
      body: request.toJson(),
    );
    return ChildProfile.fromJson(json['child'] as Map<String, dynamic>);
  }

  @override
  Future<BootstrapData> getBootstrapData() async {
    final Map<String, dynamic> json = await _send('GET', '/v1/config/bootstrap');
    return BootstrapData.fromJson(json['data'] as Map<String, dynamic>);
  }

  @override
  Future<List<String>> getSelectedPassions(String token, String childId) async {
    final Map<String, dynamic> json = await _send(
      'GET',
      '/v1/children/$childId/passions',
      token: token,
    );
    return (json['passionIds'] as List<dynamic>).cast<String>();
  }

  @override
  Future<List<String>> selectPassions(
    String token,
    String childId,
    List<String> passionIds,
  ) async {
    final Map<String, dynamic> json = await _send(
      'PUT',
      '/v1/children/$childId/passions',
      token: token,
      body: <String, dynamic>{'passionIds': passionIds},
    );
    return (json['passionIds'] as List<dynamic>).cast<String>();
  }

  @override
  Future<AssessmentDetail> startAssessment(String token, String childId) async {
    final Map<String, dynamic> json = await _send(
      'POST',
      '/v1/children/$childId/assessments',
      token: token,
    );
    return AssessmentDetail.fromJson(json);
  }

  @override
  Future<AssessmentDetail> getAssessment(String token, String assessmentId) async {
    final Map<String, dynamic> json = await _send(
      'GET',
      '/v1/assessments/$assessmentId',
      token: token,
    );
    return AssessmentDetail.fromJson(json);
  }

  @override
  Future<void> saveAssessmentResponse(
    String token,
    String assessmentId,
    String questionId,
    String optionId,
  ) async {
    await _send(
      'PUT',
      '/v1/assessments/$assessmentId/responses/$questionId',
      token: token,
      body: <String, dynamic>{'optionId': optionId},
    );
  }

  @override
  Future<GrowScoreReport> completeAssessment(String token, String assessmentId) async {
    final Map<String, dynamic> json = await _send(
      'POST',
      '/v1/assessments/$assessmentId/complete',
      token: token,
    );
    return GrowScoreReport.fromJson(json);
  }

  @override
  Future<GrowScoreReport> getAssessmentReport(String token, String assessmentId) async {
    final Map<String, dynamic> json = await _send(
      'GET',
      '/v1/assessments/$assessmentId/report',
      token: token,
    );
    return GrowScoreReport.fromJson(json);
  }

  @override
  Future<GrowScoreReport> getLatestGrowScoreReport(String token, String childId) async {
    final Map<String, dynamic> json = await _send(
      'GET',
      '/v1/children/$childId/growscore/latest',
      token: token,
    );
    return GrowScoreReport.fromJson(json);
  }

  @override
  Future<JourneyView> createJourney(
    String token,
    String childId,
    List<String> focusSkillIds,
  ) async {
    final Map<String, dynamic> json = await _send(
      'POST',
      '/v1/children/$childId/journeys',
      token: token,
      body: <String, dynamic>{'focusSkillIds': focusSkillIds},
    );
    return JourneyView.fromJson(json);
  }

  @override
  Future<JourneyView> getCurrentJourney(String token, String childId) async {
    final Map<String, dynamic> json = await _send(
      'GET',
      '/v1/children/$childId/journeys/current',
      token: token,
    );
    return JourneyView.fromJson(json);
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
    final Map<String, dynamic> json = await _send(
      'PUT',
      '/v1/journeys/$journeyId/schedules/$scheduleId/completion',
      token: token,
      body: <String, dynamic>{
        'status': status,
        'enjoymentScore': enjoymentScore,
        'difficultyFeedback': difficultyFeedback,
        if (parentNotes?.trim().isNotEmpty == true) 'parentNotes': parentNotes!.trim(),
      },
    );
    return JourneyView.fromJson(json);
  }

  @override
  Future<WeeklyJourneySummary> getWeeklyJourneySummary(
    String token,
    String journeyId,
    int week,
  ) async {
    final Map<String, dynamic> json = await _send(
      'GET',
      '/v1/journeys/$journeyId/weekly-summary/$week',
      token: token,
    );
    return WeeklyJourneySummary.fromJson(json);
  }

  @override
  Future<ChildProgressView> getChildProgress(String token, String childId) async {
    final Map<String, dynamic> json = await _send(
      'GET',
      '/v1/children/$childId/progress',
      token: token,
    );
    return ChildProgressView.fromJson(json);
  }

  @override
  Future<PlanCatalogue> getPlans(String token) async {
    final Map<String, dynamic> json = await _send('GET', '/v1/plans', token: token);
    return PlanCatalogue.fromJson(json);
  }

  @override
  Future<ParentProfile> changePlan(String token, String planId) async {
    final Map<String, dynamic> json = await _send(
      'PUT',
      '/v1/me/subscription',
      token: token,
      body: <String, dynamic>{'planId': planId},
    );
    return ParentProfile.fromJson(json['parent'] as Map<String, dynamic>);
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
    final Map<String, dynamic> json = await _send(
      'PUT',
      '/v1/me/profile',
      token: token,
      body: <String, dynamic>{
        'name': name,
        'parentType': parentType,
        'mobileNumber': mobileNumber,
        'preferredLanguageId': preferredLanguageId,
        'dailyTimeCommitment': dailyTimeCommitment,
      },
    );
    return ParentProfile.fromJson(json['parent'] as Map<String, dynamic>);
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
    final Map<String, dynamic> json = await _send(
      'PUT',
      '/v1/me/notification-preferences',
      token: token,
      body: <String, dynamic>{
        'pushNotification': pushNotification,
        'emailNotification': emailNotification,
        'whatsAppNotification': whatsAppNotification,
        'weeklySummary': weeklySummary,
        'missionReminder': missionReminder,
      },
    );
    return ParentProfile.fromJson(json['parent'] as Map<String, dynamic>);
  }

  @override
  Future<ParentProfile> updateMarketingConsent(
    String token,
    bool marketingConsent,
  ) async {
    final Map<String, dynamic> json = await _send(
      'PUT',
      '/v1/me/marketing-consent',
      token: token,
      body: <String, dynamic>{'marketingConsent': marketingConsent},
    );
    return ParentProfile.fromJson(json['parent'] as Map<String, dynamic>);
  }

  @override
  Future<ParentProfile> applyReferral(String token, String referralCode) async {
    final Map<String, dynamic> json = await _send(
      'PUT',
      '/v1/me/referral',
      token: token,
      body: <String, dynamic>{'referralCode': referralCode},
    );
    return ParentProfile.fromJson(json['parent'] as Map<String, dynamic>);
  }

  @override
  Future<NotificationCentre> getNotifications(String token) async {
    final Map<String, dynamic> json = await _send(
      'GET',
      '/v1/notifications',
      token: token,
    );
    return NotificationCentre.fromJson(json);
  }

  AuthResult _authResult(Map<String, dynamic> json) {
    return AuthResult(
      token: json['token'] as String,
      parent: ParentProfile.fromJson(json['parent'] as Map<String, dynamic>),
    );
  }

  Future<Map<String, dynamic>> _send(
    String method,
    String path, {
    Map<String, dynamic>? body,
    String? token,
  }) async {
    final Uri uri = Uri.parse('$_baseUrl$path');
    final Map<String, String> headers = <String, String>{
      'accept': 'application/json',
      if (body != null) 'content-type': 'application/json',
      if (token != null) 'authorization': 'Bearer $token',
    };
    final http.Response response = await _requestWithRetry(method, uri, headers, body);

    final Map<String, dynamic> json;
    try {
      final Object? decoded = response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body);
      json = decoded as Map<String, dynamic>;
    } on Exception {
      throw const PandaWiseApiException(
        'PandaWise received an unexpected response. Please try again.',
        code: 'INVALID_RESPONSE',
      );
    }
    if (response.statusCode >= 200 && response.statusCode < 300) return json;

    final Map<String, dynamic>? error = json['error'] as Map<String, dynamic>?;
    throw PandaWiseApiException(
      error?['message'] as String? ?? 'PandaWise could not complete this request.',
      code: error?['code'] as String?,
    );
  }

  Future<http.Response> _requestWithRetry(
    String method,
    Uri uri,
    Map<String, String> headers,
    Map<String, dynamic>? body,
  ) async {
    final int attempts = method == 'GET' ? _maxGetAttempts : 1;
    for (int attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        final http.Response response = await _requestOnce(method, uri, headers, body)
            .timeout(_requestTimeout);
        if (method != 'GET' || !_isTransientStatus(response.statusCode) || attempt == attempts) {
          return response;
        }
      } on TimeoutException catch (_) {
        if (attempt == attempts) throw _networkException();
      } on http.ClientException catch (_) {
        if (attempt == attempts) throw _networkException();
      } on PandaWiseApiException {
        rethrow;
      } on Exception catch (_) {
        throw _networkException();
      }
      await Future<void>.delayed(_retryDelay(attempt));
    }
    throw _networkException();
  }

  Future<http.Response> _requestOnce(
    String method,
    Uri uri,
    Map<String, String> headers,
    Map<String, dynamic>? body,
  ) {
    return switch (method) {
      'GET' => _client.get(uri, headers: headers),
      'POST' => body == null
          ? _client.post(uri, headers: headers)
          : _client.post(uri, headers: headers, body: jsonEncode(body)),
      'PUT' => _client.put(uri, headers: headers, body: jsonEncode(body)),
      _ => throw UnsupportedError('Unsupported HTTP method $method'),
    };
  }

  Duration _retryDelay(int attempt) {
    final int multiplier = pow(2, attempt - 1).toInt();
    return Duration(microseconds: _initialRetryDelay.inMicroseconds * multiplier);
  }

  bool _isTransientStatus(int statusCode) {
    return statusCode == 408 || statusCode == 429 || statusCode >= 500;
  }

  PandaWiseApiException _networkException() {
    return const PandaWiseApiException(
      'PandaWise is having trouble connecting. Check your connection and try again.',
      code: 'NETWORK_ERROR',
    );
  }
}
