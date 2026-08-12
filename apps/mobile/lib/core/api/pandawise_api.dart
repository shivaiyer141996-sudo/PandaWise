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
        'POST' => await _client.post(uri, headers: headers, body: jsonEncode(body)),
        _ => throw UnsupportedError('Unsupported HTTP method $method'),
      };
    } on Exception {
      throw const PandaWiseApiException(
        'PandaWise is having trouble connecting. Please try again.',
        code: 'NETWORK_ERROR',
      );
    }

    final Object? decoded = response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body);
    final Map<String, dynamic> json = decoded as Map<String, dynamic>;
    if (response.statusCode >= 200 && response.statusCode < 300) return json;

    final Map<String, dynamic>? error = json['error'] as Map<String, dynamic>?;
    throw PandaWiseApiException(
      error?['message'] as String? ?? 'PandaWise could not complete this request.',
      code: error?['code'] as String?,
    );
  }
}
