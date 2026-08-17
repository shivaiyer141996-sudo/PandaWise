import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function appsScriptRuntime() {
  const context = vm.createContext({
    console,
    Date,
    Error,
    JSON,
    Math,
    Number,
    Object,
    String,
    Boolean,
    Array,
    RegExp,
    isFinite,
    SpreadsheetApp: {
      DataValidationCriteria: {
        VALUE_IN_LIST: 'VALUE_IN_LIST',
        VALUE_IN_RANGE: 'VALUE_IN_RANGE',
        NUMBER_BETWEEN: 'NUMBER_BETWEEN',
      },
    },
  });
  const source = readdirSync('services/apps-script')
    .filter((file) => file.endsWith('.gs'))
    .sort()
    .map((file) => readFileSync(`services/apps-script/${file}`, 'utf8'))
    .join('\n');
  vm.runInContext(source, context);
  return context;
}

test('passion ranks map to the live Child Passions validation vocabulary', () => {
  const runtime = appsScriptRuntime();
  runtime.pwValidationOptions_ = () => ['PRIMARY', 'SECONDARY', 'EMERGING'];

  assert.equal(runtime.pwPassionStatusForRank_(1), 'PRIMARY');
  assert.equal(runtime.pwPassionStatusForRank_(2), 'SECONDARY');
  assert.equal(runtime.pwPassionStatusForRank_(3), 'EMERGING');
  assert.equal(runtime.pwPassionStatusForRank_(5), 'EMERGING');
});

test('assessment storage enums are converted without changing the Flutter contract', () => {
  const runtime = appsScriptRuntime();
  runtime.pwValidationOptions_ = (_tab, header) =>
    header === 'Respondent_Mode' ? ['PARENT_ONLY', 'HYBRID'] : [];

  assert.equal(runtime.pwAssessmentStatusFromSheet_('IN_PROGRESS'), 'In Progress');
  assert.equal(runtime.pwAssessmentStatusFromSheet_('COMPLETED'), 'Completed');
  assert.equal(runtime.pwAssessmentRespondentModeForSheet_('PARENT'), 'PARENT_ONLY');
  assert.equal(runtime.pwAssessmentRespondentModeForSheet_('HYBRID'), 'HYBRID');
});

test('journey storage enums are converted without changing the Flutter contract', () => {
  const runtime = appsScriptRuntime();
  const base = {
    Journey_ID: 'JRN-1',
    Child_ID: 'CHD-1',
    Journey_Status: 'ACTIVE',
    Current_Day: 1,
  };

  assert.equal(runtime.pwJourneyFromRow_(base).status, 'Active');
  assert.equal(
    runtime.pwJourneyFromRow_({ ...base, Journey_Status: 'COMPLETED' }).status,
    'Completed',
  );
});

test('mission recommendation source always matches the strict scheduler dropdown', () => {
  const runtime = appsScriptRuntime();
  const mission = {
    id: 'MSN-1',
    skillId: 'SKL001',
    name: 'Drawing story',
    description: 'Draw a short story',
    category: 'Creative',
    durationMinutes: 10,
    difficulty: 'EASY',
    displayOrder: 1,
  };
  const base = {
    missions: [mission],
    skillId: 'SKL001',
    score: { scoreBand: 'DEVELOPING' },
    rule: { recommendedDifficulty: 'EASY' },
    focusSkillIds: [],
    passionTerms: [],
    recentMissionIds: {},
    usedMissionIds: {},
    timeCommitment: '10_MIN',
    scheduledDate: '2026-08-17',
    week: 1,
  };

  assert.equal(runtime.pwChooseMission_(base).prioritySource, 'ASSESSMENT');
  assert.equal(
    runtime.pwChooseMission_({ ...base, focusSkillIds: ['SKL001'] }).prioritySource,
    'PARENT_FOCUS',
  );
  assert.equal(
    runtime.pwChooseMission_({ ...base, passionTerms: ['drawing'] }).prioritySource,
    'PASSION',
  );
});

test('strict dropdown mismatches are rejected before a Sheet write starts', () => {
  const runtime = appsScriptRuntime();
  const listValidation = {
    getCriteriaType: () => 'VALUE_IN_LIST',
    getCriteriaValues: () => [['PRIMARY', 'SECONDARY', 'EMERGING']],
  };
  const table = {
    headers: ['Passion_Status'],
    sheet: {
      getRange: () => ({
        getDataValidations: () => [[listValidation]],
      }),
    },
  };

  assert.doesNotThrow(() =>
    runtime.pwValidateRecordsForWrite_('15_Child_Passions', table, [
      { Passion_Status: 'PRIMARY' },
    ]),
  );
  assert.throws(
    () => runtime.pwValidateRecordsForWrite_('15_Child_Passions', table, [
      { Passion_Status: 'Selected' },
    ]),
    (error) => error.code === 'WORKBOOK_CONTRACT_ERROR' && error.status === 503,
  );
});
