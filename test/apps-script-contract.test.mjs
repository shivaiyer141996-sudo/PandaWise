import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const appsScriptSource = readdirSync("services/apps-script")
  .filter((file) => file.endsWith(".gs"))
  .sort()
  .map((file) => readFileSync(`services/apps-script/${file}`, "utf8"))
  .join("\n");

test("Sprint 11 has one free Google backend", () => {
  assert.equal(existsSync("services/api"), false);
  assert.match(appsScriptSource, /SpreadsheetApp\.openById/);
  assert.doesNotMatch(appsScriptSource, /firebase|supabase|mongodb|postgresql|mysql/i);
});

test("passwords are salted SHA-256 hashes and never mapped to a plain password column", () => {
  assert.match(appsScriptSource, /DigestAlgorithm\.SHA_256/);
  assert.match(appsScriptSource, /sha256\$/);
  assert.match(appsScriptSource, /Password_Hash/);
  assert.doesNotMatch(appsScriptSource, /\bPassword:\s*password\b/);
});

test("Flutter has one Apps Script deployment setting", () => {
  const config = readFileSync("apps/mobile/lib/core/config/config.dart", "utf8");
  const api = readFileSync("apps/mobile/lib/core/api/pandawise_api.dart", "utf8");
  assert.match(config, /PANDAWISE_APPS_SCRIPT_URL/);
  assert.match(config, /script\.google\.com/);
  assert.doesNotMatch(`${config}\n${api}`, /https?:\/\/(?:localhost|127\.0\.0\.1)/);
});

test("offline assessment, mission and profile writes are persisted", () => {
  const store = readFileSync(
    "apps/mobile/lib/core/offline/offline_mutation_store.dart",
    "utf8",
  );
  const session = readFileSync(
    "apps/mobile/lib/core/session/session_controller.dart",
    "utf8",
  );
  assert.match(store, /assessmentResponse/);
  assert.match(store, /missionCompletion/);
  assert.match(store, /profileUpdate/);
  assert.match(store, /ownerId/);
  assert.match(store, /pendingForOwner/);
  assert.match(session, /syncPendingChanges/);
});

test("sheet-bound setup and feedback validation stay master-driven", () => {
  assert.match(appsScriptSource, /SpreadsheetApp\.getActiveSpreadsheet/);
  assert.match(appsScriptSource, /pwValidationNumberRange/);
  assert.match(appsScriptSource, /MISSION_PARTIAL_POINTS_PERCENT/);
});

test("assessment UI remains progress-only and supports Save & Exit", () => {
  const flow = readFileSync(
    "apps/mobile/lib/features/discovery/discovery_flow.dart",
    "utf8",
  );
  assert.match(flow, /LinearProgressIndicator/);
  assert.match(flow, /Save & Exit/);
  assert.doesNotMatch(flow, /question grid|attempted\/unattempted/i);
});
