import { google, type sheets_v4 } from "googleapis";
import type { Environment } from "../config/env.js";
import { workbookTabs } from "../config/workbook.js";
import type {
  AgeGroupId,
  BootstrapData,
  Child,
  Gender,
  MasterOption,
  Parent,
  ParentType,
  PlanId,
  TimeCommitment,
} from "../domain/models.js";
import type { PandaWiseStore } from "./store.js";

type SheetRow = Record<string, string> & { __rowNumber: string };

interface SheetTable {
  headers: string[];
  rows: SheetRow[];
}

function parseBoolean(value: string): boolean {
  return value.trim().toUpperCase() === "TRUE";
}

function parseNumber(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function cell(row: SheetRow, header: string): string {
  return row[header] ?? "";
}

function toSheetValue(value: unknown): string | number | boolean {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.join("|");
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return String(value);
}

function columnName(index: number): string {
  let value = index + 1;
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

function normalizeServiceAccount(raw: string): Record<string, unknown> {
  const credentials = JSON.parse(raw) as Record<string, unknown>;
  if (typeof credentials.private_key === "string") {
    credentials.private_key = credentials.private_key.replaceAll("\\n", "\n");
  }
  return credentials;
}

export class GoogleSheetsStore implements PandaWiseStore {
  private readonly sheets: sheets_v4.Sheets;
  private readonly spreadsheetId: string;

  constructor(environment: Environment) {
    if (!environment.GOOGLE_SHEET_ID || !environment.GOOGLE_SERVICE_ACCOUNT_JSON) {
      throw new Error("Google Sheets provider is missing its required configuration");
    }

    const auth = new google.auth.GoogleAuth({
      credentials: normalizeServiceAccount(environment.GOOGLE_SERVICE_ACCOUNT_JSON),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    this.sheets = google.sheets({ version: "v4", auth });
    this.spreadsheetId = environment.GOOGLE_SHEET_ID;
  }

  async getParentByEmail(email: string): Promise<Parent | undefined> {
    const table = await this.readTable(workbookTabs.parents, ["Parent_ID", "Email"]);
    const normalized = email.trim().toLowerCase();
    const row = table.rows.find(
      (candidate) => cell(candidate, "Email").trim().toLowerCase() === normalized,
    );
    return row ? this.parentFromRow(row) : undefined;
  }

  async getParentById(parentId: string): Promise<Parent | undefined> {
    const table = await this.readTable(workbookTabs.parents, ["Parent_ID"]);
    const row = table.rows.find((candidate) => cell(candidate, "Parent_ID") === parentId);
    return row ? this.parentFromRow(row) : undefined;
  }

  async createParent(parent: Parent): Promise<void> {
    await this.appendObject(workbookTabs.parents, {
      Parent_ID: parent.id,
      Parent_Name: parent.name,
      Parent_Type: parent.parentType,
      Mobile_Number: parent.mobileNumber,
      Email: parent.email,
      Password_Hash: parent.passwordHash,
      Subscription_Plan_ID: parent.subscriptionPlanId,
      Subscription_Start_Date: "",
      Subscription_End_Date: "",
      Preferred_Language_ID: parent.preferredLanguageId,
      Daily_Time_Commitment: parent.dailyTimeCommitment,
      Push_Notification: false,
      Email_Notification: false,
      WhatsApp_Notification: false,
      Weekly_Summary: false,
      Mission_Reminder: false,
      Marketing_Consent: parent.marketingConsent,
      Terms_Accepted_At: parent.termsAcceptedAt,
      Referral_Code: "",
      Referred_By: "",
      Referral_Status: "Not Applicable",
      Last_Login_At: parent.lastLoginAt ?? "",
      Account_Status: parent.accountStatus,
      Created_At: parent.createdAt,
      Updated_At: parent.updatedAt,
      Created_By: "SELF_REGISTRATION",
    });
  }

  async updateParentLastLogin(parentId: string, timestamp: string): Promise<void> {
    const table = await this.readTable(workbookTabs.parents, ["Parent_ID", "Last_Login_At"]);
    const row = table.rows.find((candidate) => cell(candidate, "Parent_ID") === parentId);
    if (!row) return;

    const columnIndex = table.headers.indexOf("Last_Login_At");
    const range = `'${workbookTabs.parents}'!${columnName(columnIndex)}${row.__rowNumber}`;
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: { values: [[timestamp]] },
    });
  }

  async listChildren(parentId: string): Promise<Child[]> {
    const table = await this.readTable(workbookTabs.children, [
      "Child_ID",
      "Parent_ID",
      "Record_Status",
    ]);
    return table.rows
      .filter(
        (row) => cell(row, "Parent_ID") === parentId && cell(row, "Record_Status") === "Active",
      )
      .map((row) => this.childFromRow(row));
  }

  async getChild(parentId: string, childId: string): Promise<Child | undefined> {
    const table = await this.readTable(workbookTabs.children, ["Child_ID", "Parent_ID"]);
    const row = table.rows.find(
      (candidate) =>
        cell(candidate, "Child_ID") === childId &&
        cell(candidate, "Parent_ID") === parentId &&
        cell(candidate, "Record_Status") !== "Deleted",
    );
    return row ? this.childFromRow(row) : undefined;
  }

  async createChild(child: Child): Promise<void> {
    await this.appendObject(workbookTabs.children, {
      Child_ID: child.id,
      Parent_ID: child.parentId,
      Child_Name: child.name,
      Nickname: child.nickname ?? "",
      Avatar_ID: child.avatarId ?? "",
      Date_of_Birth: child.dateOfBirth,
      Age_Years: child.ageYears,
      Age_Group_ID: child.ageGroupId,
      Gender: child.gender,
      School_ID: child.schoolId ?? "",
      Grade_ID: child.gradeId ?? "",
      Language_ID: child.languageId,
      Known_Interests: child.knownInterests,
      Parent_Time_Commitment_Code: child.parentTimeCommitment,
      Current_Plan_ID: child.currentPlanId,
      Assessment_Status: child.assessmentStatus,
      Journey_Status: child.journeyStatus,
      Assessment_Count: child.assessmentCount,
      Journey_Count: child.journeyCount,
      Current_GrowScore: child.currentGrowScore ?? "",
      Current_Badge_Level: child.currentBadgeLevel,
      Current_Streak: child.currentStreak,
      Record_Status: child.recordStatus,
      Created_At: child.createdAt,
      Updated_At: child.updatedAt,
      Created_By: child.parentId,
      Updated_By: child.parentId,
    });
  }

  async getBootstrapData(): Promise<BootstrapData> {
    const [ageGroups, languages, schools, grades, skills, passions] = await Promise.all([
      this.readOptions(workbookTabs.ageGroups, "Age_Group_ID", "Age_Group_Name", {
        respondentMode: "Respondent_Mode",
      }),
      this.readOptions(workbookTabs.languages, "Language_ID", "Language_Name", {
        isoCode: "ISO_Code",
        rtl: "RTL_Flag",
      }),
      this.readOptions(workbookTabs.schools, "School_ID", "School_Name", {
        city: "City",
        area: "Area",
        board: "Board",
        schoolType: "School_Type",
      }),
      this.readOptions(workbookTabs.grades, "Grade_ID", "Grade_Name", {
        ageGroupId: "Age_Group_ID",
        stage: "School_Stage",
      }),
      this.readOptions(workbookTabs.skills, "Skill_ID", "Skill_Name", {
        weight: "Weight_Percent",
        colour: "Colour_Hex",
      }),
      this.readOptions(workbookTabs.passions, "Passion_ID", "Passion_Name", {
        category: "Category",
        indoorOutdoor: "Indoor_Outdoor",
        participationMode: "Participation_Mode",
        thinkingStyle: "Thinking_Style",
      }),
    ]);

    return {
      ageGroups,
      languages,
      schools,
      grades,
      skills,
      passions,
      timeCommitments: ["10_MIN", "15_MIN", "20_MIN", "30_MIN", "WEEKENDS_ONLY"],
    };
  }

  private async readTable(tab: string, requiredHeaders: string[]): Promise<SheetTable> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `'${tab}'!A:ZZ`,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const values = response.data.values ?? [];
    const headers = (values[0] ?? []).map((value) => String(value).trim());

    const missing = requiredHeaders.filter((header) => !headers.includes(header));
    if (missing.length > 0) {
      throw new Error(`${tab} is missing required headers: ${missing.join(", ")}`);
    }

    const rows = values.slice(1).flatMap((valuesRow, index) => {
      if (valuesRow.every((value) => String(value ?? "").trim() === "")) return [];
      const row = Object.fromEntries(
        headers.map((header, column) => [header, String(valuesRow[column] ?? "").trim()]),
      ) as SheetRow;
      row.__rowNumber = String(index + 2);
      return [row];
    });
    return { headers, rows };
  }

  private async appendObject(tab: string, record: Record<string, unknown>): Promise<void> {
    const table = await this.readTable(tab, Object.keys(record));
    const values = table.headers.map((header) => toSheetValue(record[header]));
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `'${tab}'!A:ZZ`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [values] },
    });
  }

  private async readOptions(
    tab: string,
    idHeader: string,
    nameHeader: string,
    extras: Record<string, string>,
  ): Promise<MasterOption[]> {
    const table = await this.readTable(tab, [idHeader, nameHeader]);
    return table.rows.flatMap((row) => {
      if (!cell(row, idHeader) || !cell(row, nameHeader)) return [];
      const status = cell(row, "Record_Status") || cell(row, "Status") || "Active";
      if (status !== "Active") return [];

      const option: MasterOption = { id: cell(row, idHeader), name: cell(row, nameHeader) };
      for (const [key, header] of Object.entries(extras)) {
        const value = cell(row, header);
        if (value === "TRUE" || value === "FALSE") option[key] = parseBoolean(value);
        else if (value !== "" && Number.isFinite(Number(value))) option[key] = Number(value);
        else option[key] = value;
      }
      return [option];
    });
  }

  private parentFromRow(row: SheetRow): Parent {
    const get = (header: string): string => cell(row, header);
    const parent: Parent = {
      id: get("Parent_ID"),
      name: get("Parent_Name"),
      parentType: (get("Parent_Type") || "Guardian") as ParentType,
      mobileNumber: get("Mobile_Number"),
      email: get("Email").trim().toLowerCase(),
      passwordHash: get("Password_Hash"),
      subscriptionPlanId: (get("Subscription_Plan_ID") || "PLN001") as PlanId,
      preferredLanguageId: get("Preferred_Language_ID") || "LNG001",
      dailyTimeCommitment: (get("Daily_Time_Commitment") || "15_MIN") as TimeCommitment,
      marketingConsent: parseBoolean(get("Marketing_Consent")),
      termsAcceptedAt: get("Terms_Accepted_At"),
      accountStatus: (get("Account_Status") || "Active") as Parent["accountStatus"],
      createdAt: get("Created_At"),
      updatedAt: get("Updated_At"),
    };
    if (get("Last_Login_At")) parent.lastLoginAt = get("Last_Login_At");
    return parent;
  }

  private childFromRow(row: SheetRow): Child {
    const get = (header: string): string => cell(row, header);
    const child: Child = {
      id: get("Child_ID"),
      parentId: get("Parent_ID"),
      name: get("Child_Name"),
      dateOfBirth: get("Date_of_Birth"),
      ageYears: parseNumber(get("Age_Years")),
      ageGroupId: get("Age_Group_ID") as AgeGroupId,
      gender: get("Gender") as Gender,
      languageId: get("Language_ID") || "LNG001",
      knownInterests: get("Known_Interests")
        ? get("Known_Interests").split("|").filter(Boolean)
        : [],
      parentTimeCommitment: (get("Parent_Time_Commitment_Code") || "15_MIN") as TimeCommitment,
      currentPlanId: (get("Current_Plan_ID") || "PLN001") as PlanId,
      assessmentStatus: (get("Assessment_Status") || "Not Started") as Child["assessmentStatus"],
      journeyStatus: (get("Journey_Status") || "Not Started") as Child["journeyStatus"],
      assessmentCount: parseNumber(get("Assessment_Count")),
      journeyCount: parseNumber(get("Journey_Count")),
      currentBadgeLevel: (get("Current_Badge_Level") || "Starter") as Child["currentBadgeLevel"],
      currentStreak: parseNumber(get("Current_Streak")),
      recordStatus: (get("Record_Status") || "Active") as Child["recordStatus"],
      createdAt: get("Created_At"),
      updatedAt: get("Updated_At"),
    };
    if (get("Nickname")) child.nickname = get("Nickname");
    if (get("Avatar_ID")) child.avatarId = get("Avatar_ID");
    if (get("School_ID")) child.schoolId = get("School_ID");
    if (get("Grade_ID")) child.gradeId = get("Grade_ID");
    if (get("Current_GrowScore")) {
      child.currentGrowScore = parseNumber(get("Current_GrowScore"));
    }
    return child;
  }
}
