import 'dart:async';

import 'package:flutter/material.dart';
import 'package:pandawise_mobile/core/api/pandawise_api.dart';
import 'package:pandawise_mobile/core/session/session_controller.dart';
import 'package:pandawise_mobile/core/theme/app_theme.dart';
import 'package:pandawise_mobile/features/auth/auth_flow.dart';
import 'package:pandawise_mobile/features/home/app_shell.dart';
import 'package:pandawise_mobile/features/splash/splash_screen.dart';

class PandaWiseApp extends StatefulWidget {
  const PandaWiseApp({required this.api, required this.session, super.key});

  final PandaWiseApi api;
  final SessionController session;

  @override
  State<PandaWiseApp> createState() => _PandaWiseAppState();
}

class _PandaWiseAppState extends State<PandaWiseApp>
    with WidgetsBindingObserver {
  static const Duration _syncInterval = Duration(seconds: 30);
  Timer? _syncTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    unawaited(widget.session.restore());
    _syncTimer = Timer.periodic(
      _syncInterval,
      (Timer _) => unawaited(widget.session.syncPendingChanges()),
    );
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      unawaited(widget.session.syncPendingChanges());
    }
  }

  @override
  void dispose() {
    _syncTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PandaWise',
      debugShowCheckedModeBanner: false,
      theme: buildPandaWiseTheme(),
      home: AnimatedBuilder(
        animation: widget.session,
        builder: (BuildContext context, Widget? child) {
          if (widget.session.initializing) return const SplashScreen();
          if (!widget.session.isAuthenticated) {
            return AuthFlow(api: widget.api, session: widget.session);
          }
          return AppShell(api: widget.api, session: widget.session);
        },
      ),
    );
  }
}
