import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

abstract interface class OfflineKeyValueStore {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
  Future<void> delete(String key);
}

class SecureOfflineKeyValueStore implements OfflineKeyValueStore {
  const SecureOfflineKeyValueStore();

  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  @override
  Future<String?> read(String key) => _storage.read(key: key);

  @override
  Future<void> write(String key, String value) =>
      _storage.write(key: key, value: value);

  @override
  Future<void> delete(String key) => _storage.delete(key: key);
}

class MemoryOfflineKeyValueStore implements OfflineKeyValueStore {
  final Map<String, String> _values = <String, String>{};

  @override
  Future<String?> read(String key) async => _values[key];

  @override
  Future<void> write(String key, String value) async => _values[key] = value;

  @override
  Future<void> delete(String key) async => _values.remove(key);
}

enum OfflineMutationType {
  assessmentResponse,
  missionCompletion,
  profileUpdate,
}

class OfflineMutation {
  const OfflineMutation({
    required this.id,
    required this.ownerId,
    required this.deduplicationKey,
    required this.type,
    required this.payload,
    required this.createdAt,
  });

  factory OfflineMutation.fromJson(Map<String, dynamic> json) {
    return OfflineMutation(
      id: json['id'] as String,
      ownerId: json['ownerId'] as String? ?? '',
      deduplicationKey: json['deduplicationKey'] as String,
      type: OfflineMutationType.values.byName(json['type'] as String),
      payload: Map<String, dynamic>.from(
        json['payload'] as Map<dynamic, dynamic>,
      ),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  final String id;
  final String ownerId;
  final String deduplicationKey;
  final OfflineMutationType type;
  final Map<String, dynamic> payload;
  final DateTime createdAt;

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'ownerId': ownerId,
        'deduplicationKey': deduplicationKey,
        'type': type.name,
        'payload': payload,
        'createdAt': createdAt.toUtc().toIso8601String(),
      };
}

class OfflineMutationStore {
  OfflineMutationStore({OfflineKeyValueStore? storage})
      : _storage = storage ?? const SecureOfflineKeyValueStore();

  static const String _storageEntry = 'pw_offline_queue';
  final OfflineKeyValueStore _storage;

  Future<List<OfflineMutation>> pending() async {
    final String? encoded = await _storage.read(_storageEntry);
    if (encoded == null || encoded.isEmpty) return <OfflineMutation>[];
    try {
      return (jsonDecode(encoded) as List<dynamic>)
          .map(
            (dynamic value) => OfflineMutation.fromJson(
              Map<String, dynamic>.from(value as Map<dynamic, dynamic>),
            ),
          )
          .toList(growable: false);
    } catch (_) {
      await _storage.delete(_storageEntry);
      return <OfflineMutation>[];
    }
  }

  Future<void> enqueue({
    required String ownerId,
    required String deduplicationKey,
    required OfflineMutationType type,
    required Map<String, dynamic> payload,
  }) async {
    final List<OfflineMutation> values = (await pending())
        .where(
          (OfflineMutation item) =>
              item.ownerId != ownerId ||
              item.deduplicationKey != deduplicationKey,
        )
        .toList();
    final DateTime now = DateTime.now().toUtc();
    values.add(
      OfflineMutation(
        id: '${now.microsecondsSinceEpoch}-$deduplicationKey',
        ownerId: ownerId,
        deduplicationKey: deduplicationKey,
        type: type,
        payload: payload,
        createdAt: now,
      ),
    );
    await _write(values);
  }

  Future<void> remove(String id) async {
    await _write(
      (await pending()).where((OfflineMutation item) => item.id != id).toList(),
    );
  }

  Future<void> removeByDeduplicationKey(
    String ownerId,
    String deduplicationKey,
  ) async {
    await _write(
      (await pending())
          .where(
            (OfflineMutation item) =>
                item.ownerId != ownerId ||
                item.deduplicationKey != deduplicationKey,
          )
          .toList(),
    );
  }

  Future<List<OfflineMutation>> pendingForOwner(String ownerId) async {
    return (await pending())
        .where((OfflineMutation item) => item.ownerId == ownerId)
        .toList(growable: false);
  }

  Future<bool> hasAssessmentResponses(
    String ownerId,
    String assessmentId,
  ) async {
    return (await pending()).any(
      (OfflineMutation item) =>
          item.ownerId == ownerId &&
          item.type == OfflineMutationType.assessmentResponse &&
          item.payload['assessmentId'] == assessmentId,
    );
  }

  Future<Map<String, String>> assessmentAnswers(
    String ownerId,
    String assessmentId,
  ) async {
    final Map<String, String> values = <String, String>{};
    for (final OfflineMutation item in await pending()) {
      if (item.ownerId == ownerId &&
          item.type == OfflineMutationType.assessmentResponse &&
          item.payload['assessmentId'] == assessmentId) {
        values[item.payload['questionId'] as String] =
            item.payload['optionId'] as String;
      }
    }
    return values;
  }

  Future<void> clear() async {
    await _storage.delete(_storageEntry);
  }

  Future<void> _write(List<OfflineMutation> values) async {
    await _storage.write(
      _storageEntry,
      jsonEncode(values.map((OfflineMutation item) => item.toJson()).toList()),
    );
  }
}
