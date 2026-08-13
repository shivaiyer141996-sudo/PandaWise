class PandaWiseConfig {
  const PandaWiseConfig._();

  /// The single deployment value that changes between PandaWise environments.
  /// Supply it with:
  /// --dart-define=PANDAWISE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
  static const String apiBaseUrl = String.fromEnvironment(
    'PANDAWISE_APPS_SCRIPT_URL',
    defaultValue: '',
  );

  static bool get isConfigured => apiBaseUrl.trim().isNotEmpty;

  static String requireApiBaseUrl([String? override]) {
    final String value = (override ?? apiBaseUrl).trim();
    if (value.isEmpty) {
      throw const FormatException(
        'PandaWise is not connected to its Google Apps Script deployment.',
      );
    }
    final Uri? uri = Uri.tryParse(value);
    if (uri == null ||
        uri.scheme != 'https' ||
        uri.host != 'script.google.com' ||
        !uri.path.startsWith('/macros/s/') ||
        !uri.path.endsWith('/exec')) {
      throw const FormatException(
        'PANDAWISE_APPS_SCRIPT_URL must be a deployed Google Apps Script /exec URL.',
      );
    }
    return value;
  }
}
