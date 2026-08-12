import 'package:flutter/material.dart';
import 'package:pandawise_mobile/core/api/pandawise_api.dart';
import 'package:pandawise_mobile/core/models/models.dart';
import 'package:pandawise_mobile/core/session/session_controller.dart';
import 'package:pandawise_mobile/core/theme/app_theme.dart';
import 'package:pandawise_mobile/core/widgets/pandawise_card.dart';

class ProfileTab extends StatelessWidget {
  const ProfileTab({required this.api, required this.session, super.key});

  final PandaWiseApi api;
  final SessionController session;

  @override
  Widget build(BuildContext context) {
    final ParentProfile? parent = session.parent;
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        children: <Widget>[
          PandaWiseCard(
            child: Row(
              children: <Widget>[
                const CircleAvatar(radius: 30, child: Icon(Icons.person_rounded)),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(parent?.name ?? '', style: Theme.of(context).textTheme.titleLarge),
                      Text(parent?.email ?? ''),
                      const SizedBox(height: 4),
                      Text(
                        _planName(parent?.subscriptionPlanId),
                        style: const TextStyle(
                          color: PandaWiseColors.green,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          PandaWiseCard(
            color: const Color(0xFFEFF6FF),
            child: Row(
              children: <Widget>[
                const Icon(Icons.card_giftcard_rounded, color: PandaWiseColors.blue),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      const Text('Your referral code'),
                      Text(
                        parent?.referralCode ?? '',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () => Navigator.of(context).push<void>(
                    MaterialPageRoute<void>(
                      builder: (_) => ReferralScreen(session: session),
                    ),
                  ),
                  child: const Text('Apply code'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          PandaWiseCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: <Widget>[
                ListTile(
                  leading: const Icon(Icons.workspace_premium_outlined),
                  title: const Text('Subscription Plans'),
                  subtitle: Text(_planName(parent?.subscriptionPlanId)),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.of(context).push<void>(
                    MaterialPageRoute<void>(
                      builder: (_) => SubscriptionPlansScreen(session: session),
                    ),
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.edit_outlined),
                  title: const Text('Parent Profile'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.of(context).push<void>(
                    MaterialPageRoute<void>(
                      builder: (_) => ParentProfileEditScreen(api: api, session: session),
                    ),
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.notifications_outlined),
                  title: const Text('Notification Centre'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.of(context).push<void>(
                    MaterialPageRoute<void>(
                      builder: (_) => NotificationCentreScreen(session: session),
                    ),
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.settings_outlined),
                  title: const Text('Settings'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.of(context).push<void>(
                    MaterialPageRoute<void>(
                      builder: (_) => SettingsScreen(api: api, session: session),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          OutlinedButton.icon(
            onPressed: session.logout,
            icon: const Icon(Icons.logout_rounded),
            label: const Text('Logout'),
          ),
          const SizedBox(height: 16),
          const Text('PandaWise 0.5.0', textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

class SubscriptionPlansScreen extends StatefulWidget {
  const SubscriptionPlansScreen({required this.session, super.key});

  final SessionController session;

  @override
  State<SubscriptionPlansScreen> createState() => _SubscriptionPlansScreenState();
}

class _SubscriptionPlansScreenState extends State<SubscriptionPlansScreen> {
  late Future<PlanCatalogue?> _catalogue = widget.session.getPlans();

  Future<void> _select(PlanOption plan) async {
    final bool saved = await widget.session.changePlan(plan.planId);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(saved ? '${plan.planName} plan selected.' : widget.session.error ?? 'Please try again.'),
      ),
    );
    if (saved) setState(() => _catalogue = widget.session.getPlans());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Subscription Plans')),
      body: FutureBuilder<PlanCatalogue?>(
        future: _catalogue,
        builder: (BuildContext context, AsyncSnapshot<PlanCatalogue?> snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          final PlanCatalogue? catalogue = snapshot.data;
          if (catalogue == null) {
            return _SettingsError(message: widget.session.error);
          }
          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
            children: <Widget>[
              const PandaWiseCard(
                color: Color(0xFFFFFBEB),
                child: Text(
                  'Release 1.0 uses manual plan selection. No payment is collected in the app.',
                ),
              ),
              const SizedBox(height: 16),
              for (final PlanOption plan in catalogue.plans) ...<Widget>[
                _PlanCard(
                  plan: plan,
                  current: plan.planId == catalogue.currentPlanId,
                  busy: widget.session.busy,
                  onSelect: () => _select(plan),
                ),
                const SizedBox(height: 14),
              ],
            ],
          );
        },
      ),
    );
  }
}

class NotificationCentreScreen extends StatefulWidget {
  const NotificationCentreScreen({required this.session, super.key});

  final SessionController session;

  @override
  State<NotificationCentreScreen> createState() => _NotificationCentreScreenState();
}

class _NotificationCentreScreenState extends State<NotificationCentreScreen> {
  late Future<NotificationCentre?> _notifications = widget.session.getNotifications();

  Future<void> _refresh() async {
    setState(() => _notifications = widget.session.getNotifications());
    await _notifications;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notification Centre'),
        actions: <Widget>[
          IconButton(
            tooltip: 'Notification preferences',
            onPressed: () => Navigator.of(context).push<void>(
              MaterialPageRoute<void>(
                builder: (_) => NotificationPreferencesScreen(session: widget.session),
              ),
            ),
            icon: const Icon(Icons.tune_rounded),
          ),
        ],
      ),
      body: FutureBuilder<NotificationCentre?>(
        future: _notifications,
        builder: (BuildContext context, AsyncSnapshot<NotificationCentre?> snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          final NotificationCentre? centre = snapshot.data;
          if (centre == null) return _SettingsError(message: widget.session.error);
          return RefreshIndicator(
            onRefresh: _refresh,
            child: centre.items.isEmpty
                ? ListView(
                    padding: const EdgeInsets.all(40),
                    children: const <Widget>[
                      Icon(Icons.notifications_none_rounded, size: 64, color: PandaWiseColors.blue),
                      SizedBox(height: 16),
                      Text('You are all caught up.', textAlign: TextAlign.center),
                    ],
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
                    itemCount: centre.items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (BuildContext context, int index) {
                      final PandaWiseNotification item = centre.items[index];
                      return PandaWiseCard(
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            CircleAvatar(
                              backgroundColor: const Color(0xFFEFF6FF),
                              child: Icon(_notificationIcon(item.type), color: PandaWiseColors.blue),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: <Widget>[
                                  Text(item.title, style: Theme.of(context).textTheme.titleMedium),
                                  const SizedBox(height: 5),
                                  Text(item.message),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          );
        },
      ),
    );
  }
}

class ParentProfileEditScreen extends StatefulWidget {
  const ParentProfileEditScreen({required this.api, required this.session, super.key});

  final PandaWiseApi api;
  final SessionController session;

  @override
  State<ParentProfileEditScreen> createState() => _ParentProfileEditScreenState();
}

class _ParentProfileEditScreenState extends State<ParentProfileEditScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _mobile;
  late String _parentType;
  late String _languageId;
  late String _timeCommitment;
  late final Future<BootstrapData> _bootstrap;

  @override
  void initState() {
    super.initState();
    final ParentProfile parent = widget.session.parent!;
    _name = TextEditingController(text: parent.name);
    _mobile = TextEditingController(text: parent.mobileNumber);
    _parentType = parent.parentType;
    _languageId = parent.preferredLanguageId;
    _timeCommitment = parent.dailyTimeCommitment;
    _bootstrap = widget.api.getBootstrapData();
  }

  @override
  void dispose() {
    _name.dispose();
    _mobile.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final bool saved = await widget.session.updateParentProfile(
      name: _name.text,
      parentType: _parentType,
      mobileNumber: _mobile.text,
      preferredLanguageId: _languageId,
      dailyTimeCommitment: _timeCommitment,
    );
    if (!mounted) return;
    if (saved) {
      Navigator.of(context).pop();
    } else {
      _showSettingsError(context, widget.session.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Parent Profile')),
      body: FutureBuilder<BootstrapData>(
        future: _bootstrap,
        builder: (BuildContext context, AsyncSnapshot<BootstrapData> snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final BootstrapData bootstrap = snapshot.data!;
          return Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
              children: <Widget>[
                TextFormField(
                  controller: _name,
                  decoration: const InputDecoration(labelText: 'Parent name'),
                  validator: (String? value) =>
                      (value?.trim().length ?? 0) < 2 ? 'Enter your name' : null,
                ),
                const SizedBox(height: 14),
                DropdownButtonFormField<String>(
                  initialValue: _parentType,
                  decoration: const InputDecoration(labelText: 'Relationship'),
                  items: const <String>['Mother', 'Father', 'Guardian', 'Grandparent']
                      .map(
                        (String value) => DropdownMenuItem<String>(
                          value: value,
                          child: Text(value),
                        ),
                      )
                      .toList(growable: false),
                  onChanged: (String? value) => setState(() => _parentType = value ?? _parentType),
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _mobile,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'Mobile number'),
                  validator: (String? value) =>
                      (value?.trim().length ?? 0) < 8 ? 'Enter a valid mobile number' : null,
                ),
                const SizedBox(height: 14),
                DropdownButtonFormField<String>(
                  initialValue: _languageId,
                  decoration: const InputDecoration(labelText: 'Preferred language'),
                  items: bootstrap.languages
                      .map(
                        (MasterOption language) => DropdownMenuItem<String>(
                          value: language.id,
                          child: Text(language.name),
                        ),
                      )
                      .toList(growable: false),
                  onChanged: (String? value) => setState(() => _languageId = value ?? _languageId),
                ),
                const SizedBox(height: 14),
                DropdownButtonFormField<String>(
                  initialValue: _timeCommitment,
                  decoration: const InputDecoration(labelText: 'Family time commitment'),
                  items: bootstrap.timeCommitments
                      .map(
                        (String value) => DropdownMenuItem<String>(
                          value: value,
                          child: Text(_timeLabel(value)),
                        ),
                      )
                      .toList(growable: false),
                  onChanged: (String? value) =>
                      setState(() => _timeCommitment = value ?? _timeCommitment),
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: widget.session.busy ? null : _save,
                  child: const Text('Save Profile'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class NotificationPreferencesScreen extends StatefulWidget {
  const NotificationPreferencesScreen({required this.session, super.key});

  final SessionController session;

  @override
  State<NotificationPreferencesScreen> createState() => _NotificationPreferencesScreenState();
}

class _NotificationPreferencesScreenState extends State<NotificationPreferencesScreen> {
  late bool _push = widget.session.parent!.pushNotification;
  late bool _email = widget.session.parent!.emailNotification;
  late bool _weekly = widget.session.parent!.weeklySummary;
  late bool _missions = widget.session.parent!.missionReminder;

  Future<void> _save() async {
    final bool saved = await widget.session.updateNotificationPreferences(
      pushNotification: _push,
      emailNotification: _email,
      weeklySummary: _weekly,
      missionReminder: _missions,
    );
    if (!mounted) return;
    if (saved) {
      Navigator.of(context).pop();
    } else {
      _showSettingsError(context, widget.session.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool weeklyAvailable = widget.session.parent?.subscriptionPlanId != 'PLN001';
    return Scaffold(
      appBar: AppBar(title: const Text('Notification Preferences')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        children: <Widget>[
          SwitchListTile(
            value: _push,
            title: const Text('Push notifications'),
            subtitle: const Text('Important in-app journey updates'),
            onChanged: (bool value) => setState(() => _push = value),
          ),
          SwitchListTile(
            value: _email,
            title: const Text('Email notifications'),
            subtitle: const Text('Account and progress updates by email'),
            onChanged: (bool value) => setState(() => _email = value),
          ),
          const SwitchListTile(
            value: false,
            title: Text('WhatsApp notifications'),
            subtitle: Text('Planned for a future release'),
            onChanged: null,
          ),
          SwitchListTile(
            value: weeklyAvailable && _weekly,
            title: const Text('Weekly summary'),
            subtitle: Text(
              weeklyAvailable ? 'A gentle weekly progress reflection' : 'Available on Growth and Mastery',
            ),
            onChanged: weeklyAvailable ? (bool value) => setState(() => _weekly = value) : null,
          ),
          SwitchListTile(
            value: _missions,
            title: const Text('Mission reminder'),
            subtitle: const Text('A reminder when the next mission is available'),
            onChanged: (bool value) => setState(() => _missions = value),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: widget.session.busy ? null : _save,
            child: const Text('Save Preferences'),
          ),
        ],
      ),
    );
  }
}

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({required this.api, required this.session, super.key});

  final PandaWiseApi api;
  final SessionController session;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late bool _marketing = widget.session.parent!.marketingConsent;

  Future<void> _changeMarketing(bool value) async {
    setState(() => _marketing = value);
    final bool saved = await widget.session.updateMarketingConsent(value);
    if (!mounted) return;
    if (!saved) {
      setState(() => _marketing = !value);
      _showSettingsError(context, widget.session.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ParentProfile parent = widget.session.parent!;
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        children: <Widget>[
          PandaWiseCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: <Widget>[
                ListTile(
                  leading: const Icon(Icons.translate_rounded),
                  title: const Text('Language and family time'),
                  subtitle: Text('${parent.preferredLanguageId} • ${_timeLabel(parent.dailyTimeCommitment)}'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.of(context).push<void>(
                    MaterialPageRoute<void>(
                      builder: (_) => ParentProfileEditScreen(api: widget.api, session: widget.session),
                    ),
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.notifications_outlined),
                  title: const Text('Notification preferences'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.of(context).push<void>(
                    MaterialPageRoute<void>(
                      builder: (_) => NotificationPreferencesScreen(session: widget.session),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Text('Privacy and consent', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 10),
          PandaWiseCard(
            child: Column(
              children: <Widget>[
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _marketing,
                  title: const Text('Optional PandaWise updates'),
                  subtitle: const Text('Separate from the Terms and Privacy Policy'),
                  onChanged: widget.session.busy ? null : _changeMarketing,
                ),
                const Divider(),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.verified_user_outlined),
                  title: const Text('Terms accepted'),
                  subtitle: Text(_dateOnly(parent.termsAcceptedAt)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class ReferralScreen extends StatefulWidget {
  const ReferralScreen({required this.session, super.key});

  final SessionController session;

  @override
  State<ReferralScreen> createState() => _ReferralScreenState();
}

class _ReferralScreenState extends State<ReferralScreen> {
  final TextEditingController _code = TextEditingController();

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _apply() async {
    final bool saved = await widget.session.applyReferral(_code.text);
    if (!mounted) return;
    if (saved) {
      Navigator.of(context).pop();
    } else {
      _showSettingsError(context, widget.session.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ParentProfile parent = widget.session.parent!;
    return Scaffold(
      appBar: AppBar(title: const Text('Referral')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        children: <Widget>[
          PandaWiseCard(
            color: const Color(0xFFEFF6FF),
            child: Text('Share your code ${parent.referralCode} with another family.'),
          ),
          const SizedBox(height: 20),
          if (parent.referredBy == null) ...<Widget>[
            TextField(
              controller: _code,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(labelText: 'Referral code received'),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: widget.session.busy ? null : _apply,
              child: const Text('Apply Referral Code'),
            ),
          ] else
            PandaWiseCard(
              child: Text(
                'Applied code: ${parent.referredBy}\nStatus: ${parent.referralStatus}',
              ),
            ),
        ],
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.plan,
    required this.current,
    required this.busy,
    required this.onSelect,
  });

  final PlanOption plan;
  final bool current;
  final bool busy;
  final VoidCallback onSelect;

  @override
  Widget build(BuildContext context) {
    return PandaWiseCard(
      color: plan.recommended ? const Color(0xFFEFF6FF) : Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(child: Text(plan.planName, style: Theme.of(context).textTheme.titleLarge)),
              if (plan.recommended) const Chip(label: Text('Recommended')),
            ],
          ),
          const SizedBox(height: 6),
          Text(plan.positioning),
          const SizedBox(height: 14),
          Text(
            plan.annualPriceInr == 0
                ? 'Free'
                : '₹${plan.monthlyPriceInr} / month  •  ₹${plan.annualPriceInr} / year',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: PandaWiseColors.blue),
          ),
          const SizedBox(height: 14),
          _PlanFeature(text: _childAllowance(plan.maxChildren)),
          _PlanFeature(
            text: '${plan.includedAssessmentsPerYear} Development Checks / year '
                '(${plan.questionCount} questions)',
          ),
          _PlanFeature(text: '${plan.journeyLengthDays}-day personalized journey'),
          _PlanFeature(text: '${plan.missionsPerSkill} mission levels per skill'),
          _PlanFeature(text: '${plan.skillsVisible} visible skills'),
          _PlanFeature(text: '${plan.passionInsightsLevel} passion insights'),
          _PlanFeature(
            text: '${plan.assessmentHistoryAccess} assessment history • '
                '${plan.assessmentComparison}',
          ),
          _PlanFeature(
            text: plan.growthTimelineEnabled ? 'Growth timeline' : 'Latest GrowScore snapshot',
          ),
          _PlanFeature(text: plan.weeklySummaryEnabled ? 'Weekly summaries' : 'No weekly summaries'),
          _PlanFeature(text: plan.monthlyReportEnabled ? 'Monthly reports' : 'No monthly reports'),
          _PlanFeature(text: '${plan.parentGuidanceLevel} parent guidance'),
          _PlanFeature(text: 'Languages: ${plan.multiLanguageLevel}'),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: current || busy ? null : onSelect,
            child: Text(current ? 'Current Plan' : 'Select ${plan.planName}'),
          ),
        ],
      ),
    );
  }
}

class _PlanFeature extends StatelessWidget {
  const _PlanFeature({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 7),
      child: Row(
        children: <Widget>[
          const Icon(Icons.check_circle_outline_rounded, size: 19, color: PandaWiseColors.green),
          const SizedBox(width: 8),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}

class _SettingsError extends StatelessWidget {
  const _SettingsError({this.message});

  final String? message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Text(message ?? 'This setting is unavailable right now.'),
      ),
    );
  }
}

String _planName(String? planId) {
  return switch (planId) {
    'PLN002' => 'Growth Plan',
    'PLN003' => 'Mastery Plan',
    _ => 'Explorer Plan',
  };
}

String _childAllowance(int? maxChildren) {
  if (maxChildren == null) return 'Unlimited child profiles';
  return maxChildren == 1 ? '1 child profile' : '$maxChildren child profiles';
}

String _timeLabel(String value) {
  if (value == 'WEEKENDS_ONLY') return 'Weekends only';
  return '${value.split('_').first} minutes';
}

String _dateOnly(String timestamp) {
  final DateTime? parsed = DateTime.tryParse(timestamp);
  if (parsed == null) return timestamp;
  return '${parsed.day}/${parsed.month}/${parsed.year}';
}

IconData _notificationIcon(String type) {
  return switch (type) {
    'MISSION_REMINDER' => Icons.route_rounded,
    'REASSESSMENT' => Icons.refresh_rounded,
    'DEVELOPMENT_CHECK' => Icons.fact_check_outlined,
    _ => Icons.auto_awesome_outlined,
  };
}

void _showSettingsError(BuildContext context, String? message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(message ?? 'Please try again.')),
  );
}
