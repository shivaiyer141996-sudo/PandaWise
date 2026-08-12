import { randomUUID } from "node:crypto";

export function createId(prefix: "PAR" | "CHD"): string {
  const compactUuid = randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase();
  return `${prefix}${compactUuid}`;
}
