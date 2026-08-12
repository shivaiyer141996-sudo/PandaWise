import 'package:flutter/material.dart';
import 'package:pandawise_mobile/core/theme/app_theme.dart';

class PandoBrand extends StatelessWidget {
  const PandoBrand({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'PandaWise, guided by Pando',
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Image.asset(
            'assets/branding/pandawise-logo.png',
            width: compact ? 180 : 260,
            fit: BoxFit.contain,
            errorBuilder: (_, __, ___) => const Icon(
              Icons.pets_rounded,
              size: 72,
              color: PandaWiseColors.blue,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Calm for parents. Fun for children.',
            style: Theme.of(context).textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
