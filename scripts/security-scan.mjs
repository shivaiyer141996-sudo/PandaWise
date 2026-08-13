import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

const trackedFiles = execFileSync(
  "git",
  ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);

const forbiddenFilePatterns = [
  /(^|\/)\.env$/,
  /(^|\/)\.env\.(?!example$)/,
  /(^|\/)(service-account|service_account).*\.json$/i,
  /\.(pem|p12|pfx|jks|keystore)$/i,
];

const secretPatterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["Google API key", /AIza[0-9A-Za-z_-]{30,}/],
  ["GitHub token", /(?:ghp|github_pat)_[0-9A-Za-z_]{30,}/],
  ["AWS access key", /AKIA[0-9A-Z]{16}/],
  ["Google service-account key", /"private_key"\s*:\s*"-----BEGIN PRIVATE KEY/],
];

const findings = [];
for (const file of trackedFiles) {
  if (forbiddenFilePatterns.some((pattern) => pattern.test(file))) {
    findings.push(`${file}: forbidden secret-bearing file type`);
  }
  if (statSync(file).size > 1_000_000) continue;
  const contents = readFileSync(file);
  if (contents.includes(0)) continue;
  const text = contents.toString("utf8");
  for (const [label, pattern] of secretPatterns) {
    if (pattern.test(text)) findings.push(`${file}: possible ${label}`);
  }
}

if (findings.length > 0) {
  process.stderr.write(`Secret scan failed:\n${findings.join("\n")}\n`);
  process.exit(1);
}

process.stdout.write(
  `Secret scan passed for ${trackedFiles.length} tracked/untracked files.\n`,
);
