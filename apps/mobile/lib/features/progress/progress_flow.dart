import 'package:flutter/material.dart';
import 'package:pandawise_mobile/core/api/pandawise_api.dart';
import 'package:pandawise_mobile/core/models/models.dart';
import 'package:pandawise_mobile/core/session/session_controller.dart';
import 'package:pandawise_mobile/core/theme/app_theme.dart';
import 'package:pandawise_mobile/core/widgets/pandawise_card.dart';
import 'package:pandawise_mobile/features/discovery/discovery_flow.dart';
import 'package:pandawise_mobile/features/journey/journey_flow.dart';

class ProgressTab extends StatelessWidget {
  const ProgressTab({required this.api, required this.session, super.key});

  final PandaWiseApi api;
  final SessionController session;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Progress')),
      body: session.children.isEmpty
          ? const _ProgressEmptyState()
          : ListView.separated(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
              itemCount: session.children.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (BuildContext context, int index) {
                final ChildProfile child = session.children[index];
                return PandaWiseCard(
                  onTap: () => Navigator.of(context).push<void>(
                    MaterialPageRoute<void>(
                      builder: (_) => ProgressDashboardScreen(
                        api: api,
                        session: session,
                        child: child,
                      ),
                    ),
                  ),
                  child: Row(
                    children: <Widget>[
                      const CircleAvatar(
                        backgroundColor: Color(0xFFEFF6FF),
                        child: Icon(
                          Icons.insights_rounded,
                          color: PandaWiseColors.blue,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text(
                              child.displayName,
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            Text(
                              child.currentGrowScore == null
                                  ? 'Complete a Development Check to set a baseline'
                                  : 'GrowScore ${child.currentGrowScore!.round()} • ${child.journeyStatus} journey',
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right_rounded),
                    ],
                  ),
                );
              },
            ),
    );
  }
}

class ProgressDashboardScreen extends StatefulWidget {
  const ProgressDashboardScreen({
    required this.api,
    required this.session,
    required this.child,
    super.key,
  });

  final PandaWiseApi api;
  final SessionController session;
  final ChildProfile child;

  @override
  State<ProgressDashboardScreen> createState() =>
      _ProgressDashboardScreenState();
}

class _ProgressDashboardScreenState extends State<ProgressDashboardScreen> {
  late Future<ChildProgressView?> _progress = _load();

  Future<ChildProgressView?> _load() =>
      widget.session.getChildProgress(widget.child.id);

  Future<void> _refresh() async {
    await widget.session.refreshChildren();
    if (mounted) setState(() => _progress = _load());
  }

  Future<void> _openNextAction(ChildProgressView progress) async {
    switch (progress.actions.nextAction) {
      case 'DEVELOPMENT_CHECK':
        await Navigator.of(context).push<void>(
          MaterialPageRoute<void>(
            builder: (_) => PassionDiscoveryScreen(
              api: widget.api,
              session: widget.session,
              child: widget.child,
            ),
          ),
        );
        break;
      case 'REASSESS':
        await Navigator.of(context).push<void>(
          MaterialPageRoute<void>(
            builder: (_) => DevelopmentCheckScreen(
              session: widget.session,
              child: widget.child,
            ),
          ),
        );
        break;
      case 'START_JOURNEY':
        final GrowScoreReport? report =
            await widget.session.getLatestGrowScoreReport(widget.child.id);
        if (!mounted) return;
        if (report == null) {
          _showError();
          return;
        }
        await Navigator.of(context).push<void>(
          MaterialPageRoute<void>(
            builder: (_) => GrowScoreReportScreen(
              report: report,
              child: widget.child,
              session: widget.session,
            ),
          ),
        );
        break;
      case 'CONTINUE_JOURNEY':
        final JourneyView? journey = await widget.session.getCurrentJourney(
          widget.child.id,
        );
        if (!mounted) return;
        if (journey == null) {
          _showError();
          return;
        }
        await Navigator.of(context).push<void>(
          MaterialPageRoute<void>(
            builder: (_) => JourneyOverviewScreen(
              child: widget.child,
              session: widget.session,
              initialJourney: journey,
            ),
          ),
        );
        break;
      case 'VIEW_PROGRESS':
        return;
    }
    if (mounted) await _refresh();
  }

  void _showError() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(widget.session.error ?? 'Please try again.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('${widget.child.displayName}’s Progress')),
      body: FutureBuilder<ChildProgressView?>(
        future: _progress,
        builder:
            (BuildContext context, AsyncSnapshot<ChildProgressView?> snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          final ChildProgressView? progress = snapshot.data;
          if (progress == null) {
            return _ProgressErrorState(
              message: widget.session.error,
              onRetry: _refresh,
            );
          }
          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
              children: <Widget>[
                Text(
                  'Assessment growth',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 10),
                _AssessmentGrowthCard(snapshot: progress.assessment),
                const SizedBox(height: 8),
                const Text(
                  'GrowScore changes only when a Development Check is completed.',
                  style: TextStyle(color: PandaWiseColors.muted),
                ),
                const SizedBox(height: 24),
                Text(
                  'Mission activity',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 10),
                _MissionActivityCard(activity: progress.activity),
                const SizedBox(height: 8),
                const Text(
                  'Mission completion, points and streak describe practice—not assessment improvement.',
                  style: TextStyle(color: PandaWiseColors.muted),
                ),
                const SizedBox(height: 24),
                if (!progress.entitlements.growthTrackerEnabled) ...<Widget>[
                  const PandaWiseCard(
                    color: Color(0xFFFFFBEB),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Icon(
                          Icons.lock_outline_rounded,
                          color: Color(0xFFD97706),
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Skill trends and full assessment history are available on Growth and Mastery plans.',
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                OutlinedButton.icon(
                  onPressed: () => Navigator.of(context).push<void>(
                    MaterialPageRoute<void>(
                      builder: (_) => SkillAnalyticsScreen(progress: progress),
                    ),
                  ),
                  icon: const Icon(Icons.show_chart_rounded),
                  label: const Text('Skill Analytics'),
                ),
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: () => Navigator.of(context).push<void>(
                    MaterialPageRoute<void>(
                      builder: (_) =>
                          AssessmentHistoryScreen(progress: progress),
                    ),
                  ),
                  icon: const Icon(Icons.history_rounded),
                  label: const Text('Assessment History'),
                ),
                if (progress.actions.nextAction != 'VIEW_PROGRESS') ...<Widget>[
                  const SizedBox(height: 20),
                  FilledButton.icon(
                    onPressed: () => _openNextAction(progress),
                    icon: Icon(
                      _nextActionIcon(progress.actions.nextAction),
                    ),
                    label: Text(
                      _nextActionLabel(progress.actions.nextAction),
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class SkillAnalyticsScreen extends StatelessWidget {
  const SkillAnalyticsScreen({required this.progress, super.key});

  final ChildProgressView progress;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Skill Analytics')),
      body: !progress.entitlements.growthTrackerEnabled
          ? const _LockedAnalyticsState()
          : progress.skillTrends.isEmpty
              ? const _NoTrendState()
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
                  itemCount: progress.skillTrends.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (BuildContext context, int index) {
                    final SkillProgressTrend trend =
                        progress.skillTrends[index];
                    return PandaWiseCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Row(
                            children: <Widget>[
                              Expanded(
                                child: Text(
                                  trend.name,
                                  style:
                                      Theme.of(context).textTheme.titleMedium,
                                ),
                              ),
                              Text(
                                trend.latestScore.round().toString(),
                                style: const TextStyle(
                                  color: PandaWiseColors.blue,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          LinearProgressIndicator(
                            value: (trend.latestScore / 100)
                                .clamp(0, 1)
                                .toDouble(),
                            minHeight: 8,
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: trend.points
                                .map(
                                  (ProgressPoint point) => Chip(
                                    label: Text(
                                      'Check ${point.sequence}: ${point.score.round()}',
                                    ),
                                  ),
                                )
                                .toList(growable: false),
                          ),
                          if (trend.changeFromPrevious != null) ...<Widget>[
                            const SizedBox(height: 8),
                            Text(_changeLabel(trend.changeFromPrevious!)),
                          ],
                        ],
                      ),
                    );
                  },
                ),
    );
  }
}

class AssessmentHistoryScreen extends StatelessWidget {
  const AssessmentHistoryScreen({required this.progress, super.key});

  final ChildProgressView progress;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Assessment History')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        children: <Widget>[
          PandaWiseCard(
            color: const Color(0xFFEFF6FF),
            child: Text(
              progress.entitlements.assessmentHistoryAccess == 'Latest Only'
                  ? 'Explorer shows the latest Development Check. Full history and comparisons are available on Growth and Mastery.'
                  : '${progress.entitlements.planName} includes full Development Check history.',
            ),
          ),
          const SizedBox(height: 16),
          if (progress.assessmentHistory.isEmpty)
            const _NoAssessmentState()
          else
            for (final AssessmentHistoryItem item
                in progress.assessmentHistory) ...<Widget>[
              PandaWiseCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: Text(
                            'Development Check ${item.sequence}',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                        ),
                        Text(
                          item.growScore?.round().toString() ?? '—',
                          style: Theme.of(context)
                              .textTheme
                              .headlineSmall
                              ?.copyWith(color: PandaWiseColors.blue),
                        ),
                      ],
                    ),
                    if (item.completedAt != null)
                      Text(_dateLabel(item.completedAt!)),
                    if (item.changeFromPrevious != null) ...<Widget>[
                      const SizedBox(height: 8),
                      Text(_changeLabel(item.changeFromPrevious!)),
                    ],
                    if (item.journeyStatus != null) ...<Widget>[
                      const Divider(height: 24),
                      Text(
                        'Linked journey: ${item.journeyStatus} • '
                        '${item.journeyCompletionPercent?.round() ?? 0}% activity completion',
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],
        ],
      ),
    );
  }
}

class _AssessmentGrowthCard extends StatelessWidget {
  const _AssessmentGrowthCard({required this.snapshot});

  final AssessmentProgressSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    return PandaWiseCard(
      color: const Color(0xFFEFF6FF),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  'Current GrowScore',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              Text(
                snapshot.latestGrowScore?.round().toString() ?? '—',
                style: Theme.of(context)
                    .textTheme
                    .headlineLarge
                    ?.copyWith(color: PandaWiseColors.blue),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(snapshot.message),
          if (snapshot.changeFromPrevious != null) ...<Widget>[
            const SizedBox(height: 10),
            Text(
              _changeLabel(snapshot.changeFromPrevious!),
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ],
        ],
      ),
    );
  }
}

class _MissionActivityCard extends StatelessWidget {
  const _MissionActivityCard({required this.activity});

  final MissionActivitySnapshot activity;

  @override
  Widget build(BuildContext context) {
    return PandaWiseCard(
      color: const Color(0xFFECFDF5),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            '${activity.status} journey',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          LinearProgressIndicator(
            value: (activity.completionPercent / 100).clamp(0, 1).toDouble(),
            minHeight: 9,
            color: PandaWiseColors.green,
          ),
          const SizedBox(height: 10),
          Text(
            '${activity.missionsCompleted} of ${activity.missionsPlanned} missions • '
            '${activity.completionPercent.round()}%',
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: <Widget>[
              Chip(label: Text('${activity.streak}-day streak')),
              Chip(label: Text('${activity.points} points')),
            ],
          ),
        ],
      ),
    );
  }
}

class _ProgressEmptyState extends StatelessWidget {
  const _ProgressEmptyState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(32),
        child: Text('Add a child profile to begin a growth journey.'),
      ),
    );
  }
}

class _ProgressErrorState extends StatelessWidget {
  const _ProgressErrorState({required this.message, required this.onRetry});

  final String? message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const Icon(
              Icons.cloud_off_rounded,
              size: 56,
              color: PandaWiseColors.blue,
            ),
            const SizedBox(height: 12),
            Text(
              message ?? 'Progress is unavailable right now.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            OutlinedButton(onPressed: onRetry, child: const Text('Try Again')),
          ],
        ),
      ),
    );
  }
}

class _LockedAnalyticsState extends StatelessWidget {
  const _LockedAnalyticsState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(32),
        child: Text(
          'Skill trends are available on Growth and Mastery plans. Your latest GrowScore remains visible on the Progress dashboard.',
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

class _NoTrendState extends StatelessWidget {
  const _NoTrendState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(32),
        child: Text(
          'Complete another Development Check after the journey to see skill trends.',
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

class _NoAssessmentState extends StatelessWidget {
  const _NoAssessmentState();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.all(24),
      child: Text(
        'No completed Development Checks yet.',
        textAlign: TextAlign.center,
      ),
    );
  }
}

String _changeLabel(double value) {
  if (value > 0)
    return '+${value.toStringAsFixed(value % 1 == 0 ? 0 : 1)} since the previous check';
  if (value < 0)
    return '${value.toStringAsFixed(value % 1 == 0 ? 0 : 1)} since the previous check';
  return 'Steady since the previous check';
}

String _dateLabel(String timestamp) {
  final DateTime? date = DateTime.tryParse(timestamp);
  if (date == null) return timestamp;
  const List<String> months = <String>[
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return '${date.day} ${months[date.month - 1]} ${date.year}';
}

String _nextActionLabel(String action) {
  return switch (action) {
    'DEVELOPMENT_CHECK' => 'Start Development Check',
    'START_JOURNEY' => 'Build New Journey',
    'CONTINUE_JOURNEY' => 'Continue Journey',
    'REASSESS' => 'Start Reassessment',
    _ => 'View Progress',
  };
}

IconData _nextActionIcon(String action) {
  return switch (action) {
    'DEVELOPMENT_CHECK' || 'REASSESS' => Icons.fact_check_outlined,
    'START_JOURNEY' || 'CONTINUE_JOURNEY' => Icons.route_rounded,
    _ => Icons.insights_rounded,
  };
}
