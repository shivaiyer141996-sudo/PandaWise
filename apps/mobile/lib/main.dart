import 'package:flutter/material.dart';
import 'package:pandawise_mobile/app.dart';
import 'package:pandawise_mobile/core/api/demo_pandawise_api.dart';
import 'package:pandawise_mobile/core/api/pandawise_api.dart';
import 'package:pandawise_mobile/core/config/config.dart';
import 'package:pandawise_mobile/core/offline/offline_mutation_store.dart';
import 'package:pandawise_mobile/core/session/session_controller.dart';
import 'package:pandawise_mobile/core/session/token_store.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final bool demoAvailable = !PandaWiseConfig.isConfigured;
  final PandaWiseApi api =
      demoAvailable ? DemoPandaWiseApi() : HttpPandaWiseApi();
  final TokenStore tokenStore =
      demoAvailable ? MemoryTokenStore() : const SecureTokenStore();
  final OfflineMutationStore offlineStore = demoAvailable
      ? OfflineMutationStore(storage: MemoryOfflineKeyValueStore())
      : OfflineMutationStore();
  final SessionController session = SessionController(
    api: api,
    tokenStore: tokenStore,
    offlineStore: offlineStore,
    demoAvailable: demoAvailable,
  );
  runApp(PandaWiseApp(api: api, session: session));
}
