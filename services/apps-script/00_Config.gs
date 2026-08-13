/**
 * PandaWise Apps Script runtime configuration.
 *
 * Secrets and environment values belong in Script Properties, never in source:
 *   PANDAWISE_SPREADSHEET_ID
 *   PANDAWISE_AUTH_SECRET
 *   PANDAWISE_TOKEN_TTL_SECONDS (optional, defaults to 21600 / 6 hours)
 */

var PW_VERSION = '1.0.0-sprint.11';
var PW_CALCULATION_VERSION = '1.0';
var PW_SCRIPT_PROPERTIES = {
  spreadsheetId: 'PANDAWISE_SPREADSHEET_ID',
  authSecret: 'PANDAWISE_AUTH_SECRET',
  tokenTtlSeconds: 'PANDAWISE_TOKEN_TTL_SECONDS'
};

var PW_TABS = {
  parents: '01_Parent_Master',
  children: '02_Child_Master',
  schools: '03_School_Master',
  ageGroups: '04_Age_Group_Master',
  languages: '04_Language_Master',
  grades: '04_Grade_Master',
  skills: '05_Skill_Master',
  passions: '06_Passion_Master',
  questions: '07_Question_Master',
  questionOptions: '08_Question_Options',
  missions: '09_Mission_Master',
  recommendationRules: '10_Recommendation_Rules',
  missionScheduler: '11_Mission_Scheduler',
  assessments: '12_Child_Assessments',
  responses: '13_Child_Responses',
  skillScores: '14_Child_Skill_Scores',
  childPassions: '15_Child_Passions',
  journeys: '16_Journey_Tracker',
  missionCompletion: '17_Mission_Completion',
  subscriptions: '18_Subscription_Master',
  badges: '19_Badge_Master',
  configuration: '20_App_Configuration',
  audit: '21_Audit_Log'
};

var PW_PUBLIC_ROUTES = {
  '/health': true,
  '/ready': true,
  '/v1/config/bootstrap': true,
  '/v1/auth/register': true,
  '/v1/auth/login': true,
  '/v1/auth/forgot-password': true
};

var PW_ROUTE_ALIASES = {
  '/register': '/v1/auth/register',
  '/login': '/v1/auth/login',
  '/schools': '/v1/config/bootstrap',
  '/grades': '/v1/config/bootstrap',
  '/skills': '/v1/config/bootstrap',
  '/child': '/v1/children',
  '/missions': '/v1/missions',
  '/assessment/start': '/v1/assessment/start',
  '/assessment/save': '/v1/assessment/save',
  '/assessment/submit': '/v1/assessment/submit',
  '/report': '/v1/report',
  '/dashboard': '/v1/dashboard'
};

function pwProperty_(key, required) {
  var value = PropertiesService.getScriptProperties().getProperty(key);
  if (required !== false && !value) {
    throw new PwError(
      'CONFIGURATION_ERROR',
      'PandaWise Apps Script is not configured. Complete the deployment guide.',
      503
    );
  }
  return value || '';
}

function pwNormalizeRoute_(route) {
  var value = String(route || '').trim();
  if (!value) return '/health';
  if (value.charAt(0) !== '/') value = '/' + value;
  value = value.replace(/\/+$/, '') || '/health';
  return PW_ROUTE_ALIASES[value] || value;
}

function pwTokenTtlSeconds_() {
  var configured = Number(pwProperty_(PW_SCRIPT_PROPERTIES.tokenTtlSeconds, false));
  return isFinite(configured) && configured >= 900 && configured <= 86400
    ? Math.floor(configured)
    : 21600;
}

/**
 * Run once from the Apps Script editor before deployment. A Sheet-bound project
 * can discover its spreadsheet id; the authentication secret is generated here.
 */
function configurePandaWise() {
  var properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty(PW_SCRIPT_PROPERTIES.spreadsheetId)) {
    var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!activeSpreadsheet) {
      throw new Error(
        'Bind this project to PandaWise Masters or set PANDAWISE_SPREADSHEET_ID in Script Properties.'
      );
    }
    properties.setProperty(
      PW_SCRIPT_PROPERTIES.spreadsheetId,
      activeSpreadsheet.getId()
    );
  }
  if (!properties.getProperty(PW_SCRIPT_PROPERTIES.authSecret)) {
    properties.setProperty(
      PW_SCRIPT_PROPERTIES.authSecret,
      Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid()
    );
  }
  if (!properties.getProperty(PW_SCRIPT_PROPERTIES.tokenTtlSeconds)) {
    properties.setProperty(PW_SCRIPT_PROPERTIES.tokenTtlSeconds, '21600');
  }
  return readinessCheck_();
}
