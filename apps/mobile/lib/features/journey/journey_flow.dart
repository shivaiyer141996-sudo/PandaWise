import 'package:flutter/material.dart';
import 'package:pandawise_mobile/core/models/models.dart';
import 'package:pandawise_mobile/core/session/session_controller.dart';
import 'package:pandawise_mobile/core/theme/app_theme.dart';
import 'package:pandawise_mobile/core/widgets/pandawise_card.dart';

class JourneyTab extends StatelessWidget {
  const JourneyTab({required this.session, super.key});

  final SessionController session;

  @override
  Widget build(BuildContext context) {
    final List<ChildProfile> eligible = session.children
        .where((ChildProfile child) => child.currentGrowScore != null)
        .toList(growable: false);
    return Scaffold(
      appBar: AppBar(title: const Text('Journey')),
      body: eligible.isEmpty
          ? const _JourneyEmptyState()
          : ListView.separated(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
              itemCount: eligible.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (BuildContext context, int index) {
                final ChildProfile child = eligible[index];
                return PandaWiseCard(
                  onTap: () => _openJourney(context, child),
                  child: Row(
                    children: <Widget>[
                      const CircleAvatar(
                        backgroundColor: Color(0xFFDCFCE7),
                        child: Icon(Icons.route_rounded, color: PandaWiseColors.green),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text(child.displayName, style: Theme.of(context).textTheme.titleMedium),
                            Text(child.journeyStatus == 'Not Started'
                                ? 'Choose focus areas from the GrowScore report'
                                : '${child.journeyStatus} • ${child.currentStreak}-day streak'),
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

  Future<void> _openJourney(BuildContext context, ChildProfile child) async {
    final JourneyView? journey = await session.getCurrentJourney(child.id);
    if (!context.mounted) return;
    if (journey == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            child.journeyStatus == 'Not Started'
                ? 'Open the GrowScore report and choose focus areas first.'
                : session.error ?? 'Journey is not available yet.',
          ),
        ),
      );
      return;
    }
    await Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        builder: (_) => JourneyOverviewScreen(
          child: child,
          session: session,
          initialJourney: journey,
        ),
      ),
    );
  }
}

class _JourneyEmptyState extends StatelessWidget {
  const _JourneyEmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const Icon(Icons.route_rounded, size: 64, color: PandaWiseColors.blue),
            const SizedBox(height: 16),
            Text('Your growth journey starts after GrowScore',
                textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            const Text(
              'Complete Passion Discovery and the Development Check, then choose parent focus areas.',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class JourneyOverviewScreen extends StatefulWidget {
  const JourneyOverviewScreen({
    required this.child,
    required this.session,
    required this.initialJourney,
    super.key,
  });

  final ChildProfile child;
  final SessionController session;
  final JourneyView initialJourney;

  @override
  State<JourneyOverviewScreen> createState() => _JourneyOverviewScreenState();
}

class _JourneyOverviewScreenState extends State<JourneyOverviewScreen> {
  late JourneyView _journey = widget.initialJourney;

  Future<void> _openToday() async {
    if (_journey.today == null) return;
    final JourneyView? updated = await Navigator.of(context).push<JourneyView>(
      MaterialPageRoute<JourneyView>(
        builder: (_) => TodayMissionScreen(
          child: widget.child,
          session: widget.session,
          journey: _journey,
        ),
      ),
    );
    if (updated != null && mounted) setState(() => _journey = updated);
  }

  Future<void> _openWeeklySummary(int week) async {
    final WeeklyJourneySummary? summary =
        await widget.session.getWeeklyJourneySummary(_journey.id, week);
    if (!mounted) return;
    if (summary == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(widget.session.error ?? 'Complete this week first.')),
      );
      return;
    }
    await Navigator.of(context).push<void>(
      MaterialPageRoute<void>(builder: (_) => WeeklySummaryScreen(summary: summary)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final double progress = (_journey.completionPercent / 100).clamp(0, 1).toDouble();
    return Scaffold(
      appBar: AppBar(title: Text('${_journey.missionsPlanned}-Day Journey')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        children: <Widget>[
          PandaWiseCard(
            color: const Color(0xFFEFF6FF),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text('${widget.child.displayName}’s growth journey',
                    style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                LinearProgressIndicator(value: progress, minHeight: 10),
                const SizedBox(height: 10),
                Text('Day ${_journey.currentDay} of ${_journey.missionsPlanned}'),
                Text('${_journey.missionsCompleted} missions completed • '
                    '${_journey.completionPercent.toStringAsFixed(0)}% completion'),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: <Widget>[
              Expanded(child: _StatCard(icon: Icons.local_fire_department_rounded, value: '${_journey.streak}', label: 'Streak')),
              const SizedBox(width: 12),
              Expanded(child: _StatCard(icon: Icons.calendar_month_rounded, value: '${(_journey.currentDay - 1) ~/ 7 + 1}', label: 'Week')),
            ],
          ),
          const SizedBox(height: 20),
          if (_journey.today != null) ...<Widget>[
            Text('Today’s Mission', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            PandaWiseCard(
              onTap: _openToday,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(_journey.today!.mission.name, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 6),
                  Text(_journey.today!.mission.description),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    children: <Widget>[
                      Chip(label: Text('${_journey.today!.mission.durationMinutes} min')),
                      Chip(label: Text(_journey.today!.mission.difficulty.toLowerCase())),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(onPressed: _openToday, child: const Text('View Today’s Mission')),
                  ),
                ],
              ),
            ),
          ] else if (_journey.status == 'Completed')
            PandaWiseCard(
              color: const Color(0xFFDCFCE7),
              child: Column(
                children: <Widget>[
                  const Icon(Icons.celebration_rounded, size: 48, color: PandaWiseColors.green),
                  const SizedBox(height: 12),
                  Text('Journey complete!', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text(
                    _journey.reassessmentUnlocked
                        ? 'Reassessment is now unlocked. Celebrate the consistent effort first.'
                        : 'This journey is complete. Keep celebrating every step of progress.',
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          else
            PandaWiseCard(
              color: const Color(0xFFEFF6FF),
              child: Column(
                children: <Widget>[
                  const Icon(Icons.check_circle_rounded, size: 48, color: PandaWiseColors.green),
                  const SizedBox(height: 12),
                  Text('Today’s mission is complete', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  const Text(
                    'Celebrate the effort. The next mission will unlock on its scheduled day.',
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          const SizedBox(height: 20),
          Text('Weekly reflections', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          for (int week = 1; week <= 3; week += 1)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: OutlinedButton.icon(
                onPressed: _journey.currentDay > week * 7 || _journey.status == 'Completed'
                    ? () => _openWeeklySummary(week)
                    : null,
                icon: const Icon(Icons.insights_rounded),
                label: Text('Week $week Summary'),
              ),
            ),
        ],
      ),
    );
  }
}

class TodayMissionScreen extends StatelessWidget {
  const TodayMissionScreen({
    required this.child,
    required this.session,
    required this.journey,
    super.key,
  });

  final ChildProfile child;
  final SessionController session;
  final JourneyView journey;

  @override
  Widget build(BuildContext context) {
    final JourneyToday today = journey.today!;
    return Scaffold(
      appBar: AppBar(title: Text('Day ${today.day} Mission')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        children: <Widget>[
          PandaWiseCard(
            color: const Color(0xFFEFF6FF),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(today.mission.name, style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 10),
                Text(today.mission.description),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  children: <Widget>[
                    Chip(label: Text('${today.mission.durationMinutes} min')),
                    Chip(label: Text(today.mission.difficulty.toLowerCase())),
                    Chip(label: Text(today.mission.indoorOutdoor.toLowerCase())),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _DetailCard(title: 'For ${child.displayName}', text: today.mission.childInstructions),
          const SizedBox(height: 12),
          _DetailCard(title: 'Parent guidance', text: today.mission.parentGuidance),
          const SizedBox(height: 12),
          _DetailCard(title: 'Materials', text: today.mission.materialsNeeded),
          const SizedBox(height: 12),
          _DetailCard(title: 'Why this mission?', text: today.reasons.join(' • ')),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () async {
              final JourneyView? updated = await Navigator.of(context).push<JourneyView>(
                MaterialPageRoute<JourneyView>(
                  builder: (_) => MissionCompletionScreen(session: session, journey: journey),
                ),
              );
              if (context.mounted && updated != null) Navigator.of(context).pop(updated);
            },
            child: const Text('Share Mission Feedback'),
          ),
        ],
      ),
    );
  }
}

class MissionCompletionScreen extends StatefulWidget {
  const MissionCompletionScreen({required this.session, required this.journey, super.key});

  final SessionController session;
  final JourneyView journey;

  @override
  State<MissionCompletionScreen> createState() => _MissionCompletionScreenState();
}

class _MissionCompletionScreenState extends State<MissionCompletionScreen> {
  final TextEditingController _notes = TextEditingController();
  String _status = 'YES';
  String _difficulty = 'JUST_RIGHT';
  int _enjoyment = 4;

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final JourneyView? updated = await widget.session.completeMission(
      widget.journey,
      status: _status,
      enjoymentScore: _enjoyment,
      difficultyFeedback: _difficulty,
      parentNotes: _notes.text,
    );
    if (!mounted) return;
    if (updated == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(widget.session.error ?? 'Please try again.')),
      );
      return;
    }
    Navigator.of(context).pop(updated);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mission Feedback')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        children: <Widget>[
          Text('How did today’s mission go?', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 18),
          SegmentedButton<String>(
            segments: const <ButtonSegment<String>>[
              ButtonSegment<String>(value: 'YES', label: Text('Yes')),
              ButtonSegment<String>(value: 'PARTIALLY', label: Text('Partially')),
              ButtonSegment<String>(value: 'NO', label: Text('Not today')),
            ],
            selected: <String>{_status},
            onSelectionChanged: (Set<String> value) => setState(() => _status = value.first),
          ),
          const SizedBox(height: 24),
          Text('Enjoyment', style: Theme.of(context).textTheme.titleMedium),
          Slider(
            value: _enjoyment.toDouble(),
            min: 1,
            max: 5,
            divisions: 4,
            label: '$_enjoyment of 5',
            onChanged: (double value) => setState(() => _enjoyment = value.round()),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _difficulty,
            decoration: const InputDecoration(labelText: 'How did the difficulty feel?'),
            items: const <DropdownMenuItem<String>>[
              DropdownMenuItem<String>(value: 'TOO_EASY', child: Text('A little easy')),
              DropdownMenuItem<String>(value: 'JUST_RIGHT', child: Text('Just right')),
              DropdownMenuItem<String>(value: 'CHALLENGING', child: Text('A good challenge')),
            ],
            onChanged: (String? value) => setState(() => _difficulty = value ?? 'JUST_RIGHT'),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _notes,
            maxLength: 500,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'Parent notes (optional)',
              hintText: 'What worked well today?',
            ),
          ),
          const SizedBox(height: 12),
          PandaWiseLoadingButton(
            label: 'Save Feedback',
            onPressed: _submit,
            loading: widget.session.busy,
          ),
        ],
      ),
    );
  }
}

class WeeklySummaryScreen extends StatelessWidget {
  const WeeklySummaryScreen({required this.summary, super.key});

  final WeeklyJourneySummary summary;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Week ${summary.week} Summary')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        children: <Widget>[
          PandaWiseCard(
            color: const Color(0xFFDCFCE7),
            child: Column(
              children: <Widget>[
                const Icon(Icons.celebration_rounded, size: 48, color: PandaWiseColors.green),
                const SizedBox(height: 12),
                Text('${summary.completed} missions completed',
                    style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 6),
                Text(summary.message, textAlign: TextAlign.center),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _DetailCard(title: 'Completion', text: '${summary.completionPercent.toStringAsFixed(0)}%'),
          const SizedBox(height: 12),
          _DetailCard(title: 'Points earned', text: '${summary.totalPoints}'),
          const SizedBox(height: 12),
          _DetailCard(title: 'Average enjoyment', text: '${summary.averageEnjoyment.toStringAsFixed(1)} of 5'),
          const SizedBox(height: 12),
          _DetailCard(title: 'Current streak', text: '${summary.streak} days'),
          if (summary.mostPracticedSkill != null) ...<Widget>[
            const SizedBox(height: 12),
            _DetailCard(title: 'Most practised skill', text: summary.mostPracticedSkill!),
          ],
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.icon, required this.value, required this.label});

  final IconData icon;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return PandaWiseCard(
      child: Column(
        children: <Widget>[
          Icon(icon, color: PandaWiseColors.green),
          const SizedBox(height: 6),
          Text(value, style: Theme.of(context).textTheme.titleLarge),
          Text(label),
        ],
      ),
    );
  }
}

class _DetailCard extends StatelessWidget {
  const _DetailCard({required this.title, required this.text});

  final String title;
  final String text;

  @override
  Widget build(BuildContext context) {
    return PandaWiseCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 6),
          Text(text),
        ],
      ),
    );
  }
}
