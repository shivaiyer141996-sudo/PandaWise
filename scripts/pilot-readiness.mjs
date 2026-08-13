import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const minimumNodeMajor = 22;
const currentNodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);
const failures = [];

const requiredEvidence = [
  ".github/workflows/ci.yml",
  "contracts/openapi.yaml",
  "docs/operations/google-sheets-runbook.md",
  "docs/release/pilot-defect-log.md",
  "docs/release/pilot-release-plan.md",
  "docs/release/pilot-uat-checklist.md",
  "docs/release/release-checklist.md",
  "docs/sprint-6-traceability.md",
];

if (currentNodeMajor < minimumNodeMajor) {
  failures.push(
    `Node.js ${minimumNodeMajor}+ is required; found ${process.versions.node}.`,
  );
}

for (const file of requiredEvidence) {
  if (!existsSync(file)) failures.push(`Required release evidence is missing: ${file}`);
}

const ciWorkflow = existsSync(".github/workflows/ci.yml")
  ? readFileSync(".github/workflows/ci.yml", "utf8")
  : "";

for (const marker of [
  "workflow_dispatch:",
  "flutter analyze",
  "flutter test",
  "flutter build apk --debug",
  "app-debug.apk.sha256",
  "pilot-manifest.txt",
]) {
  if (!ciWorkflow.includes(marker)) {
    failures.push(`CI workflow is missing pilot requirement: ${marker}`);
  }
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exit(1);
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const gates = [
  ["API typecheck, tests and build", ["run", "check"]],
  ["Dependency audit", ["run", "audit"]],
  ["Repository secret-pattern scan", ["run", "security:scan"]],
];

for (const [label, args] of gates) {
  process.stdout.write(`\n==> ${label}\n`);
  const result = spawnSync(npmCommand, args, {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  if (result.error) {
    process.stderr.write(`${label} could not start: ${result.error.message}\n`);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.stderr.write(`${label} failed with exit code ${result.status}.\n`);
    process.exit(result.status ?? 1);
  }
}

process.stdout.write(
  "\nPilot local readiness passed. Flutter, APK and device UAT remain CI/environment gates.\n",
);
