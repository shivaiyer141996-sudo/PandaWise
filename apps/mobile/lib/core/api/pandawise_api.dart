import 'dart:convert';

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
}

class HttpPandaWiseApi implements PandaWiseApi {
  HttpPandaWiseApi({http.Client? client, String? baseUrl})
      : _client = client ?? http.Client(),
        _baseUrl = baseUrl ??
            const String.fromEnvironment(
              'PANDAWISE_API_BASE_URL',
              defaultValue: 'http://10.0.2.2:8080',
            );

  final http.Client _client;
  final String _baseUrl;

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
    final http.Response response;
    try {
      response = switch (method) {
        'GET' => await _client.get(uri, headers: headers),
        'POST' => body == null
            ? await _client.post(uri, headers: headers)
            : await _client.post(uri, headers: headers, body: jsonEncode(body)),
        'PUT' => await _client.put(uri, headers: headers, body: jsonEncode(body)),
        _ => throw UnsupportedError('Unsupported HTTP method $method'),
      };
    } on Exception {
      throw const PandaWiseApiException(
        'PandaWise is having trouble connecting. Please try again.',
        code: 'NETWORK_ERROR',
      );
    }

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
}
