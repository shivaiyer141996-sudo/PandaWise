import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:pandawise_mobile/core/api/pandawise_api.dart';
import 'package:pandawise_mobile/core/models/models.dart';

void main() {
  test('retries safe GET requests after transient server responses', () async {
    int attempts = 0;
    final MockClient client = MockClient((http.Request request) async {
      attempts += 1;
      if (attempts < 3) {
        return http.Response(
          jsonEncode(<String, Object>{
            'error': <String, String>{'code': 'TEMPORARY', 'message': 'Please retry'},
          }),
          503,
        );
      }
      return http.Response(
        jsonEncode(<String, Object>{
          'items': <Object>[],
          'preferences': <String, bool>{
            'pushNotification': false,
            'emailNotification': false,
            'whatsAppNotification': false,
            'weeklySummary': false,
            'missionReminder': false,
          },
        }),
        200,
      );
    });
    final HttpPandaWiseApi api = HttpPandaWiseApi(
      client: client,
      baseUrl: 'https://example.test',
      initialRetryDelay: Duration.zero,
    );

    final NotificationCentre centre = await api.getNotifications('token');

    expect(centre.items, isEmpty);
    expect(attempts, 3);
  });

  test('does not automatically repeat a mutating request', () async {
    int attempts = 0;
    final MockClient client = MockClient((http.Request request) async {
      attempts += 1;
      return http.Response(
        jsonEncode(<String, Object>{
          'error': <String, String>{'code': 'TEMPORARY', 'message': 'Please retry'},
        }),
        503,
      );
    });
    final HttpPandaWiseApi api = HttpPandaWiseApi(
      client: client,
      baseUrl: 'https://example.test',
      initialRetryDelay: Duration.zero,
    );

    await expectLater(
      api.updateMarketingConsent('token', true),
      throwsA(
        isA<PandaWiseApiException>()
            .having((PandaWiseApiException error) => error.code, 'code', 'TEMPORARY'),
      ),
    );
    expect(attempts, 1);
  });

  test('maps corrupted JSON to a stable invalid-response error', () async {
    final MockClient client = MockClient(
      (http.Request request) async => http.Response('<html>bad gateway</html>', 200),
    );
    final HttpPandaWiseApi api = HttpPandaWiseApi(
      client: client,
      baseUrl: 'https://example.test',
      initialRetryDelay: Duration.zero,
    );

    await expectLater(
      api.getMe('token'),
      throwsA(
        isA<PandaWiseApiException>()
            .having((PandaWiseApiException error) => error.code, 'code', 'INVALID_RESPONSE'),
      ),
    );
  });

  test('times out a stalled request with a recoverable network message', () async {
    final Completer<http.Response> stalled = Completer<http.Response>();
    final MockClient client = MockClient((http.Request request) => stalled.future);
    final HttpPandaWiseApi api = HttpPandaWiseApi(
      client: client,
      baseUrl: 'https://example.test',
      requestTimeout: const Duration(milliseconds: 5),
      initialRetryDelay: Duration.zero,
      maxGetAttempts: 1,
    );

    await expectLater(
      api.getMe('token'),
      throwsA(
        isA<PandaWiseApiException>()
            .having((PandaWiseApiException error) => error.code, 'code', 'NETWORK_ERROR')
            .having(
              (PandaWiseApiException error) => error.message,
              'message',
              contains('try again'),
            ),
      ),
    );
  });
}
