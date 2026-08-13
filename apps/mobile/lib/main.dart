import 'package:flutter/material.dart';
import 'package:pandawise_mobile/app.dart';
import 'package:pandawise_mobile/core/api/pandawise_api.dart';
import 'package:pandawise_mobile/core/offline/offline_mutation_store.dart';
import 'package:pandawise_mobile/core/session/session_controller.dart';
import 'package:pandawise_mobile/core/session/token_store.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final HttpPandaWiseApi api = HttpPandaWiseApi();
  final SessionController session = SessionController(
    api: api,
    tokenStore: const SecureTokenStore(),
    offlineStore: OfflineMutationStore(),
  );
  runApp(PandaWiseApp(api: api, session: session));
}
