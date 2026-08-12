import 'package:flutter/material.dart';
import 'package:pandawise_mobile/core/api/pandawise_api.dart';
import 'package:pandawise_mobile/core/models/models.dart';
import 'package:pandawise_mobile/core/session/session_controller.dart';
import 'package:pandawise_mobile/core/theme/app_theme.dart';
import 'package:pandawise_mobile/core/widgets/pandawise_card.dart';
import 'package:pandawise_mobile/features/discovery/discovery_flow.dart';

class ChildProfileScreen extends StatelessWidget {
  const ChildProfileScreen({
    required this.api,
    required this.session,
    required this.child,
    super.key,
  });

  final PandaWiseApi api;
  final SessionController session;
  final ChildProfile child;

  Future<void> _openNext(BuildContext context) async {
    if (child.currentGrowScore == null) {
      await Navigator.of(context).push<void>(
        MaterialPageRoute<void>(
          builder: (_) => PassionDiscoveryScreen(api: api, session: session, child: child),
        ),
      );
      return;
    }
    final GrowScoreReport? report = await session.getLatestGrowScoreReport(child.id);
    if (!context.mounted) return;
    if (report == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(session.error ?? 'GrowScore report is not available.')),
      );
      return;
    }
    await Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        builder: (_) => GrowScoreReportScreen(
          report: report,
          child: child,
          session: session,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Child Profile')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: <Widget>[
          PandaWiseCard(
            child: Column(
              children: <Widget>[
                CircleAvatar(
                  radius: 44,
                  backgroundColor: const Color(0xFFDCFCE7),
                  child: Text(child.avatarId == 'pando-star' ? '⭐' : '🐼', style: const TextStyle(fontSize: 38)),
                ),
                const SizedBox(height: 12),
                Text(child.displayName, style: Theme.of(context).textTheme.headlineSmall),
                Text('${child.ageYears} years • ${child.gender}'),
              ],
            ),
          ),
          const SizedBox(height: 16),
          PandaWiseCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text('GrowScore', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Text(
                  child.currentGrowScore == null ? 'Not available yet' : child.currentGrowScore!.round().toString(),
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(color: PandaWiseColors.blue),
                ),
                const SizedBox(height: 8),
                Text(child.currentGrowScore == null ? 'Start Discovery to understand current strengths.' : 'Latest child-development snapshot'),
              ],
            ),
          ),
          const SizedBox(height: 16),
          PandaWiseCard(
            child: Column(
              children: <Widget>[
                _StatusRow(label: 'Assessment', value: child.assessmentStatus),
                const Divider(),
                _StatusRow(label: 'Journey', value: child.journeyStatus),
                const Divider(),
                _StatusRow(label: 'Current streak', value: '${child.currentStreak} days'),
                const Divider(),
                _StatusRow(label: 'Badge level', value: child.currentBadgeLevel),
              ],
            ),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () => _openNext(context),
            child: Text(child.currentGrowScore == null ? 'Start Discovery' : 'View GrowScore Report'),
          ),
        ],
      ),
    );
  }
}

class _StatusRow extends StatelessWidget {
  const _StatusRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: <Widget>[
          Expanded(child: Text(label)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
