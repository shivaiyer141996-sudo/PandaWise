import 'package:flutter/material.dart';
import 'package:pandawise_mobile/core/api/pandawise_api.dart';
import 'package:pandawise_mobile/core/models/models.dart';
import 'package:pandawise_mobile/core/session/session_controller.dart';
import 'package:pandawise_mobile/core/theme/app_theme.dart';
import 'package:pandawise_mobile/core/widgets/pandawise_card.dart';
import 'package:pandawise_mobile/features/children/add_child_screen.dart';
import 'package:pandawise_mobile/features/children/child_profile_screen.dart';
import 'package:pandawise_mobile/features/discovery/discovery_flow.dart';
import 'package:pandawise_mobile/features/journey/journey_flow.dart';
import 'package:pandawise_mobile/features/progress/progress_flow.dart';
import 'package:pandawise_mobile/features/settings/settings_flow.dart';

class AppShell extends StatefulWidget {
  const AppShell({required this.api, required this.session, super.key});

  final PandaWiseApi api;
  final SessionController session;

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    final List<Widget> pages = <Widget>[
      _DashboardPage(api: widget.api, session: widget.session),
      _ChildrenPage(api: widget.api, session: widget.session),
      JourneyTab(session: widget.session),
      ProgressTab(api: widget.api, session: widget.session),
      ProfileTab(api: widget.api, session: widget.session),
    ];

    return Scaffold(
      body: SafeArea(
        child: IndexedStack(index: _selectedIndex, children: pages),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (int index) =>
            setState(() => _selectedIndex = index),
        destinations: const <NavigationDestination>[
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.child_care_outlined),
            selectedIcon: Icon(Icons.child_care),
            label: 'Children',
          ),
          NavigationDestination(
            icon: Icon(Icons.route_outlined),
            selectedIcon: Icon(Icons.route),
            label: 'Journey',
          ),
          NavigationDestination(
            icon: Icon(Icons.insights_outlined),
            selectedIcon: Icon(Icons.insights),
            label: 'Progress',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

class _DashboardPage extends StatelessWidget {
  const _DashboardPage({required this.api, required this.session});

  final PandaWiseApi api;
  final SessionController session;

  @override
  Widget build(BuildContext context) {
    final ChildProfile? child =
        session.children.isEmpty ? null : session.children.first;
    return CustomScrollView(
      slivers: <Widget>[
        SliverAppBar.large(
          title: Text(
            'Hi ${session.parent?.name.split(' ').first ?? 'there'} 👋',
          ),
          actions: <Widget>[
            IconButton(
              tooltip: 'Notifications',
              onPressed: () => Navigator.of(context).push<void>(
                MaterialPageRoute<void>(
                  builder: (_) => NotificationCentreScreen(session: session),
                ),
              ),
              icon: const Icon(Icons.notifications_none_rounded),
            ),
          ],
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
          sliver: SliverList.list(
            children: <Widget>[
              PandaWiseCard(
                color: const Color(0xFFEFF6FF),
                child: Row(
                  children: <Widget>[
                    const CircleAvatar(
                      radius: 28,
                      backgroundColor: Colors.white,
                      child: Icon(
                        Icons.pets_rounded,
                        color: PandaWiseColors.blue,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            'Pando says',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            child == null
                                ? 'Add your child to begin a thoughtful growth journey.'
                                : child.assessmentStatus == 'Not Started'
                                    ? 'Start ${child.displayName}’s Development Check when you are ready.'
                                    : 'Small, consistent missions create meaningful progress.',
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              if (child == null)
                _FirstChildCard(api: api, session: session)
              else ...<Widget>[
                Text(
                  'Your child',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                _ChildSummaryCard(api: api, session: session, child: child),
                const SizedBox(height: 20),
                Text(
                  'What’s next',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                PandaWiseCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: <Widget>[
                      const Icon(
                        Icons.explore_outlined,
                        size: 42,
                        color: PandaWiseColors.green,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Development Check',
                        style: Theme.of(context).textTheme.titleMedium,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Understand strengths and growth opportunities through age-appropriate questions.',
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: () =>
                            _openDiscovery(context, api, session, child),
                        child: const Text('Start Discovery'),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _FirstChildCard extends StatelessWidget {
  const _FirstChildCard({required this.api, required this.session});

  final PandaWiseApi api;
  final SessionController session;

  @override
  Widget build(BuildContext context) {
    return PandaWiseCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          const Icon(
            Icons.child_care_rounded,
            size: 48,
            color: PandaWiseColors.green,
          ),
          const SizedBox(height: 12),
          Text(
            'Tell us about your child',
            style: Theme.of(context).textTheme.titleLarge,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          const Text(
            'We use their age and family preferences to choose the right journey.',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () => _openAddChild(context, api, session),
            child: const Text('Add Child'),
          ),
        ],
      ),
    );
  }
}

class _ChildSummaryCard extends StatelessWidget {
  const _ChildSummaryCard({
    required this.api,
    required this.session,
    required this.child,
  });

  final PandaWiseApi api;
  final SessionController session;
  final ChildProfile child;

  @override
  Widget build(BuildContext context) {
    return PandaWiseCard(
      onTap: () => Navigator.of(context).push<void>(
        MaterialPageRoute<void>(
          builder: (_) =>
              ChildProfileScreen(api: api, session: session, child: child),
        ),
      ),
      child: Row(
        children: <Widget>[
          const CircleAvatar(
            radius: 32,
            backgroundColor: Color(0xFFDCFCE7),
            child: Icon(Icons.pets_rounded, size: 30),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  child.displayName,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                Text('${child.ageYears} years • ${child.ageGroupId}'),
                const SizedBox(height: 8),
                Text(
                  child.currentGrowScore == null
                      ? 'Development Check not started'
                      : 'GrowScore ${child.currentGrowScore!.round()}',
                  style: const TextStyle(
                    color: PandaWiseColors.blue,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded),
        ],
      ),
    );
  }
}

class _ChildrenPage extends StatelessWidget {
  const _ChildrenPage({required this.api, required this.session});

  final PandaWiseApi api;
  final SessionController session;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Children')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openAddChild(context, api, session),
        icon: const Icon(Icons.add),
        label: const Text('Add Child'),
      ),
      body: RefreshIndicator(
        onRefresh: session.refreshChildren,
        child: session.children.isEmpty
            ? ListView(
                padding: const EdgeInsets.all(24),
                children: <Widget>[
                  const SizedBox(height: 80),
                  const Icon(
                    Icons.child_care_rounded,
                    size: 64,
                    color: PandaWiseColors.green,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No child profiles yet',
                    style: Theme.of(context).textTheme.titleLarge,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Add a child to begin Passion Discovery and the Development Check.',
                    textAlign: TextAlign.center,
                  ),
                ],
              )
            : ListView.separated(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
                itemCount: session.children.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (BuildContext context, int index) =>
                    _ChildSummaryCard(
                  api: api,
                  session: session,
                  child: session.children[index],
                ),
              ),
      ),
    );
  }
}

Future<void> _openAddChild(
  BuildContext context,
  PandaWiseApi api,
  SessionController session,
) async {
  await Navigator.of(context).push<void>(
    MaterialPageRoute<void>(
      builder: (_) => AddChildScreen(api: api, session: session),
    ),
  );
}

Future<void> _openDiscovery(
  BuildContext context,
  PandaWiseApi api,
  SessionController session,
  ChildProfile child,
) async {
  await Navigator.of(context).push<void>(
    MaterialPageRoute<void>(
      builder: (_) =>
          PassionDiscoveryScreen(api: api, session: session, child: child),
    ),
  );
}
