import { DomainError } from "./errors.js";
import type { AgeGroupId } from "./models.js";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function calculateAge(dateOfBirth: string, today = new Date()): number {
  if (!isoDatePattern.test(dateOfBirth)) {
    throw new DomainError("INVALID_DATE_OF_BIRTH", "Date of birth must use YYYY-MM-DD");
  }

  const [yearText, monthText, dayText] = dateOfBirth.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const birthDate = new Date(Date.UTC(year, month - 1, day));

  if (
    birthDate.getUTCFullYear() !== year ||
    birthDate.getUTCMonth() !== month - 1 ||
    birthDate.getUTCDate() !== day
  ) {
    throw new DomainError("INVALID_DATE_OF_BIRTH", "Date of birth is not a valid calendar date");
  }

  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  if (birthDate > todayUtc) {
    throw new DomainError("INVALID_DATE_OF_BIRTH", "Date of birth cannot be in the future");
  }

  let age = todayUtc.getUTCFullYear() - birthDate.getUTCFullYear();
  const birthdayThisYear = new Date(
    Date.UTC(todayUtc.getUTCFullYear(), birthDate.getUTCMonth(), birthDate.getUTCDate()),
  );
  if (todayUtc < birthdayThisYear) age -= 1;
  return age;
}

export function ageGroupForAge(age: number): AgeGroupId {
  if (age >= 3 && age < 6) return "AG01";
  if (age >= 6 && age < 9) return "AG02";
  if (age >= 9 && age <= 12) return "AG03";
  throw new DomainError(
    "AGE_NOT_ELIGIBLE",
    "PandaWise Release 1.0 supports children aged 3 through 12",
  );
}
