import { randomUUID } from "node:crypto";

export type IdPrefix =
  | "PAR"
  | "CHD"
  | "CPA"
  | "ASM"
  | "RSP"
  | "SSC"
  | "JRN"
  | "SCH"
  | "CMP";

export function createId(prefix: IdPrefix): string {
  const compactUuid = randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase();
  return `${prefix}${compactUuid}`;
}
