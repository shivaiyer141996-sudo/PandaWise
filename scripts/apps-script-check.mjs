import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import vm from "node:vm";

const directory = "services/apps-script";
assert.ok(existsSync(directory), "Apps Script source directory is missing");
assert.ok(!existsSync("services/api"), "The obsolete Node backend must not exist");

const requiredFiles = [
  "00_Config.gs",
  "01_ErrorsAndUtils.gs",
  "02_SheetStore.gs",
  "03_Auth.gs",
  "04_MasterAndProfiles.gs",
  "05_Assessments.gs",
  "06_JourneysAndProgress.gs",
  "07_Router.gs",
  "Code.gs",
  "appsscript.json",
];
for (const file of requiredFiles) {
  assert.ok(existsSync(`${directory}/${file}`), `Missing ${file}`);
}

const gsFiles = readdirSync(directory).filter((file) => file.endsWith(".gs")).sort();
const source = gsFiles
  .map((file) => {
    const contents = readFileSync(`${directory}/${file}`, "utf8");
    new vm.Script(contents, { filename: file });
    return contents;
  })
  .join("\n");

for (const marker of [
  "function doGet(",
  "function doPost(",
  "SpreadsheetApp.openById",
  "Utilities.DigestAlgorithm.SHA_256",
  "Password_Hash",
  "function pwDispatch_(",
]) {
  assert.ok(source.includes(marker), `Apps Script source is missing ${marker}`);
}

for (const route of [
  "/v1/auth/register",
  "/v1/auth/login",
  "/v1/config/bootstrap",
  "/v1/children",
  "pwStartAssessment_",
  "pwSaveResponse_",
  "pwCompleteAssessment_",
  "pwCreateJourney_",
  "pwProgress_",
  "/v1/plans",
]) {
  assert.ok(source.includes(route), `Router is missing route marker ${route}`);
}

for (const tab of [
  "01_Parent_Master",
  "02_Child_Master",
  "03_School_Master",
  "04_Age_Group_Master",
  "05_Skill_Master",
  "07_Question_Master",
  "09_Mission_Master",
  "12_Child_Assessments",
  "13_Child_Responses",
  "14_Child_Skill_Scores",
  "18_Subscription_Master",
  "20_App_Configuration",
  "21_Audit_Log",
]) {
  assert.ok(source.includes(tab), `Workbook contract is missing ${tab}`);
}

const manifest = JSON.parse(readFileSync(`${directory}/appsscript.json`, "utf8"));
assert.equal(manifest.runtimeVersion, "V8");
assert.ok(manifest.oauthScopes.includes("https://www.googleapis.com/auth/spreadsheets"));

const flutterConfig = readFileSync("apps/mobile/lib/core/config/config.dart", "utf8");
assert.ok(flutterConfig.includes("PANDAWISE_APPS_SCRIPT_URL"));
assert.ok(flutterConfig.includes("script.google.com"));

const repositoryText = [source, flutterConfig].join("\n");
assert.ok(!repositoryText.includes(["api", "invalid", "pandawise", "example"].join(".")));

process.stdout.write(`Apps Script check passed for ${gsFiles.length} source files.\n`);
