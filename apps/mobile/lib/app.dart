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

class _PandaWiseAppState extends State<PandaWiseApp> {
  @override
  void initState() {
    super.initState();
    unawaited(widget.session.restore());
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
