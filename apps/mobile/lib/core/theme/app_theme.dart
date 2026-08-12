import 'package:flutter/material.dart';

abstract final class PandaWiseColors {
  static const Color blue = Color(0xFF2563EB);
  static const Color green = Color(0xFF22C55E);
  static const Color surface = Color(0xFFF8FAFC);
  static const Color ink = Color(0xFF1E293B);
  static const Color muted = Color(0xFF64748B);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
}

ThemeData buildPandaWiseTheme() {
  final ColorScheme scheme = ColorScheme.fromSeed(
    seedColor: PandaWiseColors.blue,
    primary: PandaWiseColors.blue,
    secondary: PandaWiseColors.green,
    surface: Colors.white,
    error: PandaWiseColors.error,
    brightness: Brightness.light,
  );
  final ThemeData base = ThemeData(useMaterial3: true, colorScheme: scheme);
  return base.copyWith(
    scaffoldBackgroundColor: PandaWiseColors.surface,
    textTheme: base.textTheme.copyWith(
      headlineLarge: const TextStyle(
        color: PandaWiseColors.ink,
        fontSize: 30,
        fontWeight: FontWeight.w700,
      ),
      headlineSmall: const TextStyle(
        color: PandaWiseColors.ink,
        fontSize: 24,
        fontWeight: FontWeight.w700,
      ),
      titleLarge: const TextStyle(
        color: PandaWiseColors.ink,
        fontSize: 20,
        fontWeight: FontWeight.w700,
      ),
      titleMedium: const TextStyle(
        color: PandaWiseColors.ink,
        fontSize: 18,
        fontWeight: FontWeight.w600,
      ),
      bodyLarge: const TextStyle(color: PandaWiseColors.ink, fontSize: 16),
      bodyMedium: const TextStyle(color: PandaWiseColors.muted, fontSize: 14),
      labelLarge: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: PandaWiseColors.surface,
      foregroundColor: PandaWiseColors.ink,
      centerTitle: false,
      elevation: 0,
      scrolledUnderElevation: 0,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(56),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(56),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: PandaWiseColors.blue, width: 2),
      ),
    ),
    navigationBarTheme: const NavigationBarThemeData(
      backgroundColor: Colors.white,
      indicatorColor: Color(0xFFDBEAFE),
      height: 72,
    ),
  );
}
