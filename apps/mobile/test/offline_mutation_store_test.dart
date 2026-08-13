import 'package:flutter_test/flutter_test.dart';
import 'package:pandawise_mobile/core/offline/offline_mutation_store.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('keeps only the latest answer for each assessment question', () async {
    final OfflineMutationStore store = OfflineMutationStore(
      storage: MemoryOfflineKeyValueStore(),
    );
    await store.enqueue(
      ownerId: 'PAR001',
      deduplicationKey: 'assessment:ASM001:Q001',
      type: OfflineMutationType.assessmentResponse,
      payload: <String, dynamic>{
        'assessmentId': 'ASM001',
        'questionId': 'Q001',
        'optionId': 'OPT001',
      },
    );
    await store.enqueue(
      ownerId: 'PAR001',
      deduplicationKey: 'assessment:ASM001:Q001',
      type: OfflineMutationType.assessmentResponse,
      payload: <String, dynamic>{
        'assessmentId': 'ASM001',
        'questionId': 'Q001',
        'optionId': 'OPT002',
      },
    );

    expect(await store.pending(), hasLength(1));
    expect(await store.assessmentAnswers('PAR001', 'ASM001'), <String, String>{
      'Q001': 'OPT002',
    });
  });

  test('persists mission and profile mutations until removed', () async {
    final OfflineMutationStore store = OfflineMutationStore(
      storage: MemoryOfflineKeyValueStore(),
    );
    await store.enqueue(
      ownerId: 'PAR001',
      deduplicationKey: 'mission:JRN001:SCH001',
      type: OfflineMutationType.missionCompletion,
      payload: <String, dynamic>{'journeyId': 'JRN001', 'scheduleId': 'SCH001'},
    );
    await store.enqueue(
      ownerId: 'PAR001',
      deduplicationKey: 'profile:current',
      type: OfflineMutationType.profileUpdate,
      payload: <String, dynamic>{'name': 'Shiva Iyer'},
    );

    final List<OfflineMutation> pending = await store.pending();
    expect(pending, hasLength(2));
    await store.remove(pending.first.id);
    expect(await store.pending(), hasLength(1));
  });

  test('never returns another parent account mutation for replay', () async {
    final OfflineMutationStore store = OfflineMutationStore(
      storage: MemoryOfflineKeyValueStore(),
    );
    await store.enqueue(
      ownerId: 'PAR001',
      deduplicationKey: 'profile:current',
      type: OfflineMutationType.profileUpdate,
      payload: <String, dynamic>{'name': 'Parent One'},
    );
    await store.enqueue(
      ownerId: 'PAR002',
      deduplicationKey: 'assessment:ASM002:Q001',
      type: OfflineMutationType.assessmentResponse,
      payload: <String, dynamic>{
        'assessmentId': 'ASM002',
        'questionId': 'Q001',
        'optionId': 'OPT001',
      },
    );

    expect(await store.pendingForOwner('PAR001'), hasLength(1));
    expect((await store.pendingForOwner('PAR001')).single.ownerId, 'PAR001');
  });
}
