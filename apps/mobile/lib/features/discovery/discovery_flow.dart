import 'package:flutter/material.dart';
import 'package:pandawise_mobile/core/api/pandawise_api.dart';
import 'package:pandawise_mobile/core/models/models.dart';
import 'package:pandawise_mobile/core/session/session_controller.dart';
import 'package:pandawise_mobile/core/theme/app_theme.dart';
import 'package:pandawise_mobile/core/widgets/pandawise_card.dart';
import 'package:pandawise_mobile/features/journey/journey_flow.dart';

class PassionDiscoveryScreen extends StatefulWidget {
  const PassionDiscoveryScreen({
    required this.api,
    required this.session,
    required this.child,
    super.key,
  });

  final PandaWiseApi api;
  final SessionController session;
  final ChildProfile child;

  @override
  State<PassionDiscoveryScreen> createState() => _PassionDiscoveryScreenState();
}

class _PassionDiscoveryScreenState extends State<PassionDiscoveryScreen> {
  late Future<_PassionState> _state;
  final Set<String> _selected = <String>{};

  @override
  void initState() {
    super.initState();
    _state = _load();
  }

  Future<_PassionState> _load() async {
    final BootstrapData data = await widget.api.getBootstrapData();
    final List<String> selected = await widget.session.getSelectedPassions(
      widget.child.id,
    );
    _selected
      ..clear()
      ..addAll(selected);
    final List<MasterOption> passions = data.passions
        .where(
          (MasterOption passion) =>
              _appliesToAgeGroup(passion, widget.child.ageGroupId),
        )
        .toList(growable: false);
    return _PassionState(passions: passions);
  }

  Future<void> _continue() async {
    if (_selected.isEmpty || _selected.length > 5) {
      _message('Choose between one and five passions.');
      return;
    }
    final bool saved = await widget.session.selectPassions(
      widget.child.id,
      _selected.toList(growable: false),
    );
    if (!mounted) return;
    if (!saved) {
      _message(widget.session.error ?? 'Please try again.');
      return;
    }
    await Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        builder: (_) => DevelopmentCheckScreen(
          session: widget.session,
          child: widget.child,
        ),
      ),
    );
  }

  void _toggle(String passionId) {
    setState(() {
      if (_selected.contains(passionId)) {
        _selected.remove(passionId);
      } else if (_selected.length < 5) {
        _selected.add(passionId);
      } else {
        _message('You can choose up to five passions.');
      }
    });
  }

  void _message(String value) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(value)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Passion Discovery')),
      body: FutureBuilder<_PassionState>(
        future: _state,
        builder: (BuildContext context, AsyncSnapshot<_PassionState> snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError || !snapshot.hasData) {
            return _RetryState(
              message: 'We could not load passions.',
              onRetry: () => setState(() => _state = _load()),
            );
          }
          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
            children: <Widget>[
              PandaWiseCard(
                color: const Color(0xFFEFF6FF),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      'What lights up ${widget.child.displayName}?',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Choose 1–5 interests. Passions personalize missions but do not affect GrowScore.',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: snapshot.data!.passions.map((MasterOption passion) {
                  final bool selected = _selected.contains(passion.id);
                  return FilterChip(
                    selected: selected,
                    showCheckmark: true,
                    avatar: Icon(_passionIcon(passion.category), size: 18),
                    label: Text(passion.name),
                    onSelected: (_) => _toggle(passion.id),
                  );
                }).toList(growable: false),
              ),
              const SizedBox(height: 20),
              Text(
                '${_selected.length} of 5 selected',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: PandaWiseColors.blue,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 16),
              PandaWiseLoadingButton(
                label: 'Continue to Development Check',
                onPressed: _continue,
                loading: widget.session.busy,
              ),
            ],
          );
        },
      ),
    );
  }
}

class DevelopmentCheckScreen extends StatelessWidget {
  const DevelopmentCheckScreen({
    required this.session,
    required this.child,
    super.key,
  });

  final SessionController session;
  final ChildProfile child;

  Future<void> _start(BuildContext context) async {
    final AssessmentDetail? assessment = await session.startAssessment(
      child.id,
    );
    if (!context.mounted) return;
    if (assessment == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(session.error ?? 'Please try again.')),
      );
      return;
    }
    await Navigator.of(context).pushReplacement<void, void>(
      MaterialPageRoute<void>(
        builder: (_) => AssessmentQuestionsScreen(
          session: session,
          child: child,
          assessment: assessment,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Development Check')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 40),
        children: <Widget>[
          const Icon(
            Icons.fact_check_outlined,
            size: 72,
            color: PandaWiseColors.blue,
          ),
          const SizedBox(height: 20),
          Text(
            'A thoughtful snapshot—not a test',
            style: Theme.of(context).textTheme.headlineSmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          const Text(
            'Answer based on everyday behaviour. There are no right or wrong answers, and progress is saved after every response.',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          const PandaWiseCard(
            child: Column(
              children: <Widget>[
                const _CheckDetail(
                  icon: Icons.schedule_rounded,
                  label: 'About 10–15 minutes',
                ),
                const Divider(),
                _CheckDetail(
                  icon: Icons.family_restroom_rounded,
                  label: 'Age-appropriate parent and child prompts',
                ),
                const Divider(),
                const _CheckDetail(
                  icon: Icons.lock_outline_rounded,
                  label: 'Responses stay private to your family',
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          PandaWiseLoadingButton(
            label: 'Begin Development Check',
            onPressed: () => _start(context),
            loading: session.busy,
          ),
        ],
      ),
    );
  }
}

class AssessmentQuestionsScreen extends StatefulWidget {
  const AssessmentQuestionsScreen({
    required this.session,
    required this.child,
    required this.assessment,
    super.key,
  });

  final SessionController session;
  final ChildProfile child;
  final AssessmentDetail assessment;

  @override
  State<AssessmentQuestionsScreen> createState() =>
      _AssessmentQuestionsScreenState();
}

class _AssessmentQuestionsScreenState extends State<AssessmentQuestionsScreen> {
  final Map<String, String> _answers = <String, String>{};
  int _index = 0;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    for (final AssessmentQuestion question in widget.assessment.questions) {
      if (question.selectedOptionId != null)
        _answers[question.id] = question.selectedOptionId!;
    }
    final int firstUnanswered = widget.assessment.questions.indexWhere(
      (AssessmentQuestion question) => !_answers.containsKey(question.id),
    );
    if (firstUnanswered >= 0) _index = firstUnanswered;
  }

  Future<void> _select(AssessmentQuestion question, String optionId) async {
    if (_saving) return;
    setState(() => _saving = true);
    final bool saved = await widget.session.saveAssessmentResponse(
      widget.assessment.id,
      question.id,
      optionId,
    );
    if (!mounted) return;
    setState(() {
      _saving = false;
      if (saved) {
        _answers[question.id] = optionId;
        if (_index < widget.assessment.questions.length - 1) _index += 1;
      }
    });
    if (!saved) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.session.error ?? 'Response was not saved.'),
        ),
      );
    }
  }

  void _finish() {
    Navigator.of(context).pushReplacement<void, void>(
      MaterialPageRoute<void>(
        builder: (_) => AssessmentCompleteScreen(
          session: widget.session,
          child: widget.child,
          assessmentId: widget.assessment.id,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final AssessmentQuestion question = widget.assessment.questions[_index];
    final bool allAnswered = _answers.length == widget.assessment.questionCount;
    final double progress = _answers.length / widget.assessment.questionCount;
    return Scaffold(
      appBar: AppBar(
        title: Text('${_index + 1} of ${widget.assessment.questionCount}'),
        actions: <Widget>[
          TextButton(
            onPressed: _saving ? null : () => Navigator.of(context).pop(),
            child: const Text('Save & Exit'),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: <Widget>[
            LinearProgressIndicator(value: progress, minHeight: 6),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
                children: <Widget>[
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Chip(
                      avatar: Icon(
                        question.respondentType == 'CHILD'
                            ? Icons.child_care
                            : Icons.person,
                        size: 18,
                      ),
                      label: Text(
                        question.respondentType == 'CHILD'
                            ? 'Ask ${widget.child.displayName}'
                            : 'Parent response',
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    question.text,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 24),
                  ...question.options.map((AssessmentOption option) {
                    final bool selected = _answers[question.id] == option.id;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: PandaWiseCard(
                        onTap:
                            _saving ? null : () => _select(question, option.id),
                        color:
                            selected ? const Color(0xFFDBEAFE) : Colors.white,
                        child: Row(
                          children: <Widget>[
                            Icon(
                              selected
                                  ? Icons.radio_button_checked
                                  : Icons.radio_button_off,
                              color: selected
                                  ? PandaWiseColors.blue
                                  : PandaWiseColors.muted,
                            ),
                            const SizedBox(width: 12),
                            Expanded(child: Text(option.text)),
                          ],
                        ),
                      ),
                    );
                  }),
                  if (_saving) ...<Widget>[
                    const SizedBox(height: 8),
                    const Center(child: Text('Saving response…')),
                  ],
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
              child: Row(
                children: <Widget>[
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _index == 0
                          ? null
                          : () => setState(() => _index -= 1),
                      child: const Text('Previous'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: allAnswered
                          ? _finish
                          : _answers.containsKey(question.id) &&
                                  _index <
                                      widget.assessment.questions.length - 1
                              ? () => setState(() => _index += 1)
                              : null,
                      child: Text(allAnswered ? 'Finish' : 'Next'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AssessmentCompleteScreen extends StatelessWidget {
  const AssessmentCompleteScreen({
    required this.session,
    required this.child,
    required this.assessmentId,
    super.key,
  });

  final SessionController session;
  final ChildProfile child;
  final String assessmentId;

  Future<void> _showReport(BuildContext context) async {
    final GrowScoreReport? report = await session.completeAssessment(
      assessmentId,
    );
    if (!context.mounted) return;
    if (report == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(session.error ?? 'Please try again.')),
      );
      return;
    }
    await Navigator.of(context).pushReplacement<void, void>(
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
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(28),
            child: Column(
              children: <Widget>[
                const CircleAvatar(
                  radius: 48,
                  backgroundColor: Color(0xFFDCFCE7),
                  child: Icon(
                    Icons.check_rounded,
                    size: 56,
                    color: PandaWiseColors.green,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Development Check complete!',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 12),
                Text(
                  'Pando is preparing ${child.displayName}’s strengths-first GrowScore report.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                PandaWiseLoadingButton(
                  label: 'See GrowScore',
                  onPressed: () => _showReport(context),
                  loading: session.busy,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class GrowScoreReportScreen extends StatelessWidget {
  const GrowScoreReportScreen({
    required this.report,
    required this.child,
    required this.session,
    super.key,
  });

  final GrowScoreReport report;
  final ChildProfile child;
  final SessionController session;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('GrowScore Report')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        children: <Widget>[
          PandaWiseCard(
            color: const Color(0xFFEFF6FF),
            child: Column(
              children: <Widget>[
                Text(
                  child.displayName,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  report.growScore.round().toString(),
                  style: Theme.of(context)
                      .textTheme
                      .headlineLarge
                      ?.copyWith(color: PandaWiseColors.blue, fontSize: 54),
                ),
                const Text('GrowScore'),
                const SizedBox(height: 8),
                Chip(label: Text(report.scoreBandLabel)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Strengths to celebrate',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          ...report.strengths.map(_SkillCard.new),
          const SizedBox(height: 16),
          Text(
            'All visible skills',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          ...report.skills.map(_SkillCard.new),
          if (report.lockedSkillCount > 0) ...<Widget>[
            const SizedBox(height: 8),
            PandaWiseCard(
              color: const Color(0xFFFFFBEB),
              child: Text(
                '${report.lockedSkillCount} additional skill insights are available on Growth and Mastery plans.',
              ),
            ),
          ],
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () => Navigator.of(context).push<void>(
              MaterialPageRoute<void>(
                builder: (_) => ParentFocusAreasScreen(
                  child: child,
                  areas: report.recommendedFocusAreas,
                  session: session,
                ),
              ),
            ),
            child: const Text('Choose Focus Areas'),
          ),
        ],
      ),
    );
  }
}

class ParentFocusAreasScreen extends StatefulWidget {
  const ParentFocusAreasScreen({
    required this.child,
    required this.areas,
    required this.session,
    super.key,
  });

  final ChildProfile child;
  final List<GrowScoreSkill> areas;
  final SessionController session;

  @override
  State<ParentFocusAreasScreen> createState() => _ParentFocusAreasScreenState();
}

class _ParentFocusAreasScreenState extends State<ParentFocusAreasScreen> {
  final Set<String> _selected = <String>{};

  void _toggle(String skillId) {
    setState(() {
      if (_selected.contains(skillId)) {
        _selected.remove(skillId);
      } else if (_selected.length < 3) {
        _selected.add(skillId);
      }
    });
  }

  Future<void> _continue() async {
    if (_selected.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Choose at least one focus area.')),
      );
      return;
    }
    final JourneyView? journey = await widget.session.createJourney(
      widget.child.id,
      _selected.toList(growable: false),
    );
    if (!mounted) return;
    if (journey == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(widget.session.error ?? 'Please try again.')),
      );
      return;
    }
    await Navigator.of(context).pushReplacement<void, void>(
      MaterialPageRoute<void>(
        builder: (_) => JourneyOverviewScreen(
          child: widget.child,
          session: widget.session,
          initialJourney: journey,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Parent Focus Areas')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        children: <Widget>[
          Text(
            'What would you like to nurture?',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          const Text(
            'Choose up to three areas. This complements GrowScore with your family priorities.',
          ),
          const SizedBox(height: 20),
          ...widget.areas.map((GrowScoreSkill skill) {
            final bool selected = _selected.contains(skill.skillId);
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: PandaWiseCard(
                onTap: () => _toggle(skill.skillId),
                color: selected ? const Color(0xFFDCFCE7) : Colors.white,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Icon(
                      selected ? Icons.check_circle : Icons.circle_outlined,
                      color: selected
                          ? PandaWiseColors.green
                          : PandaWiseColors.muted,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            skill.name,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 4),
                          Text(skill.message),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
          const SizedBox(height: 12),
          PandaWiseLoadingButton(
            label: 'Build 21-Day Journey',
            onPressed: _continue,
            loading: widget.session.busy,
          ),
        ],
      ),
    );
  }
}

class _SkillCard extends StatelessWidget {
  const _SkillCard(this.skill);

  final GrowScoreSkill skill;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: PandaWiseCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    skill.name,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                Text(
                  '${skill.score.round()}',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ],
            ),
            const SizedBox(height: 8),
            LinearProgressIndicator(
              value: skill.score / 100,
              minHeight: 8,
              borderRadius: BorderRadius.circular(8),
            ),
            const SizedBox(height: 8),
            Text(
              skill.bandLabel,
              style: const TextStyle(color: PandaWiseColors.green),
            ),
            const SizedBox(height: 4),
            Text(skill.message),
          ],
        ),
      ),
    );
  }
}

class _CheckDetail extends StatelessWidget {
  const _CheckDetail({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: <Widget>[
          Icon(icon, color: PandaWiseColors.blue),
          const SizedBox(width: 12),
          Expanded(child: Text(label)),
        ],
      ),
    );
  }
}

class _PassionState {
  const _PassionState({required this.passions});

  final List<MasterOption> passions;
}

class _RetryState extends StatelessWidget {
  const _RetryState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}

bool _appliesToAgeGroup(MasterOption passion, String ageGroupId) {
  final String eligibility = passion.ageGroupEligibility ?? 'ALL';
  return eligibility == 'ALL' || eligibility.split('|').contains(ageGroupId);
}

IconData _passionIcon(String? category) {
  return switch (category) {
    'Sports' => Icons.sports_soccer,
    'STEM' => Icons.science_outlined,
    'Reading' => Icons.menu_book_outlined,
    'Music' || 'Dance' || 'Performance' => Icons.music_note_rounded,
    'Nature' => Icons.eco_outlined,
    'Life Skills' => Icons.restaurant_outlined,
    _ => Icons.palette_outlined,
  };
}
