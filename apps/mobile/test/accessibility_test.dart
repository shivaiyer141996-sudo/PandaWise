import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pandawise_mobile/core/theme/app_theme.dart';
import 'package:pandawise_mobile/core/widgets/pandawise_card.dart';

void main() {
  testWidgets('primary actions remain usable at large text scale', (
    WidgetTester tester,
  ) async {
    bool pressed = false;
    await tester.pumpWidget(
      MaterialApp(
        theme: buildPandaWiseTheme(),
        home: MediaQuery(
          data: const MediaQueryData(textScaler: TextScaler.linear(2)),
          child: Scaffold(
            body: Center(
              child: SizedBox(
                width: 320,
                child: PandaWiseLoadingButton(
                  label: 'Continue your family growth journey',
                  loading: false,
                  onPressed: () => pressed = true,
                ),
              ),
            ),
          ),
        ),
      ),
    );

    expect(tester.takeException(), isNull);
    expect(
      tester.getSize(find.byType(FilledButton)).height,
      greaterThanOrEqualTo(48),
    );
    await tester.tap(find.byType(FilledButton));
    expect(pressed, isTrue);
  });

  testWidgets(
    'loading action exposes progress semantics and cannot be tapped',
    (WidgetTester tester) async {
      bool pressed = false;
      await tester.pumpWidget(
        MaterialApp(
          theme: buildPandaWiseTheme(),
          home: Scaffold(
            body: PandaWiseLoadingButton(
              label: 'Save Profile',
              loading: true,
              onPressed: () => pressed = true,
            ),
          ),
        ),
      );

      final SemanticsHandle handle = tester.ensureSemantics();
      expect(
        find.bySemanticsLabel(RegExp('Save Profile in progress')),
        findsOneWidget,
      );
      await tester.tap(find.byType(FilledButton));
      expect(pressed, isFalse);
      handle.dispose();
    },
  );
}
