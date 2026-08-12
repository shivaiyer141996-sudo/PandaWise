import { google, type sheets_v4 } from "googleapis";
import type { Environment } from "../config/env.js";
import { workbookTabs } from "../config/workbook.js";
import type {
  AgeGroupId,
  Assessment,
  AssessmentDepth,
  AssessmentQuestion,
  AssessmentResponse,
  BootstrapData,
  Child,
  ChildPassion,
  Gender,
  Journey,
  JourneyConfiguration,
  JourneySchedule,
  MasterOption,
  Mission,
  MissionCompletion,
  MissionDifficulty,
  MissionDifficultyFeedback,
  MissionCompletionStatus,
  Parent,
  ParentType,
  PlanEntitlements,
  PlanId,
  QuestionOption,
  RecommendationRule,
  RespondentMode,
  RespondentType,
  ScoreBand,
  SkillScore,
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

  async getParentByReferralCode(referralCode: string): Promise<Parent | undefined> {
    const table = await this.readTable(workbookTabs.parents, ["Parent_ID", "Referral_Code"]);
    const normalized = referralCode.trim().toUpperCase();
    const row = table.rows.find(
      (candidate) => cell(candidate, "Referral_Code").toUpperCase() === normalized,
    );
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
      Subscription_Start_Date: parent.subscriptionStartDate ?? "",
      Subscription_End_Date: parent.subscriptionEndDate ?? "",
      Preferred_Language_ID: parent.preferredLanguageId,
      Daily_Time_Commitment: parent.dailyTimeCommitment,
      Push_Notification: parent.pushNotification,
      Email_Notification: parent.emailNotification,
      WhatsApp_Notification: parent.whatsAppNotification,
      Weekly_Summary: parent.weeklySummary,
      Mission_Reminder: parent.missionReminder,
      Marketing_Consent: parent.marketingConsent,
      Terms_Accepted_At: parent.termsAcceptedAt,
      Referral_Code: parent.referralCode,
      Referred_By: parent.referredBy ?? "",
      Referral_Status: parent.referralStatus,
      Last_Login_At: parent.lastLoginAt ?? "",
      Account_Status: parent.accountStatus,
      Created_At: parent.createdAt,
      Updated_At: parent.updatedAt,
      Created_By: "SELF_REGISTRATION",
    });
  }

  async updateParent(parent: Parent): Promise<void> {
    await this.updateRowFields(workbookTabs.parents, "Parent_ID", parent.id, {
      Parent_Name: parent.name,
      Parent_Type: parent.parentType,
      Mobile_Number: parent.mobileNumber,
      Subscription_Plan_ID: parent.subscriptionPlanId,
      Subscription_Start_Date: parent.subscriptionStartDate ?? "",
      Subscription_End_Date: parent.subscriptionEndDate ?? "",
      Preferred_Language_ID: parent.preferredLanguageId,
      Daily_Time_Commitment: parent.dailyTimeCommitment,
      Push_Notification: parent.pushNotification,
      Email_Notification: parent.emailNotification,
      WhatsApp_Notification: parent.whatsAppNotification,
      Weekly_Summary: parent.weeklySummary,
      Mission_Reminder: parent.missionReminder,
      Marketing_Consent: parent.marketingConsent,
      Referral_Code: parent.referralCode,
      Referred_By: parent.referredBy ?? "",
      Referral_Status: parent.referralStatus,
      Updated_At: parent.updatedAt,
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
        ageGroupEligibility: "Age_Group_Eligibility",
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

  async listChildPassions(childId: string): Promise<ChildPassion[]> {
    const table = await this.readTable(workbookTabs.childPassions, [
      "Child_Passion_ID",
      "Child_ID",
      "Passion_ID",
      "Record_Status",
    ]);
    const latest = new Map<string, SheetRow>();
    for (const row of table.rows.filter((candidate) => cell(candidate, "Child_ID") === childId)) {
      latest.set(cell(row, "Passion_ID"), row);
    }
    return [...latest.values()]
      .filter(
        (row) =>
          cell(row, "Record_Status") === "Active" &&
          (cell(row, "Passion_Status") || "Selected") === "Selected",
      )
      .map((row) => this.childPassionFromRow(row))
      .sort((left, right) => left.preferenceRank - right.preferenceRank);
  }

  async saveChildPassionEvents(events: ChildPassion[]): Promise<void> {
    await this.appendObjects(
      workbookTabs.childPassions,
      events.map((event) => ({
        Child_Passion_ID: event.id,
        Child_ID: event.childId,
        Passion_ID: event.passionId,
        Preference_Rank: event.preferenceRank,
        Passion_Status: event.status,
        Source: event.source,
        Captured_At: event.capturedAt,
        Assessment_ID: event.assessmentId ?? "",
        Record_Status: event.recordStatus,
        Created_At: event.createdAt,
        Updated_At: event.updatedAt,
      })),
    );
  }

  async listAssessmentQuestions(
    ageGroupId: AgeGroupId,
    version: string,
    depth: AssessmentDepth,
  ): Promise<AssessmentQuestion[]> {
    const [questionTable, optionTable] = await Promise.all([
      this.readTable(workbookTabs.questions, [
        "Question_ID",
        "Assessment_Type",
        "Age_Group_ID",
        "Respondent_Type",
        "Skill_ID",
        "Question_Text",
        "Question_Type_ID",
        "Question_Set_Tier",
        "Assessment_Version",
        "Record_Status",
      ]),
      this.readTable(workbookTabs.questionOptions, [
        "Option_ID",
        "Question_Type_ID",
        "Display_Text",
        "Numeric_Score",
        "Reverse_Score",
        "Record_Status",
      ]),
    ]);
    const optionsByType = new Map<string, QuestionOption[]>();
    for (const row of optionTable.rows.filter(
      (candidate) => cell(candidate, "Record_Status") === "Active",
    )) {
      const option = this.questionOptionFromRow(row);
      const values = optionsByType.get(option.questionTypeId) ?? [];
      values.push(option);
      optionsByType.set(option.questionTypeId, values);
    }
    for (const values of optionsByType.values()) {
      values.sort((left, right) => left.displayOrder - right.displayOrder);
    }

    return questionTable.rows
      .filter(
        (row) =>
          cell(row, "Assessment_Type") === "SKILL" &&
          cell(row, "Age_Group_ID") === ageGroupId &&
          cell(row, "Assessment_Version") === version &&
          cell(row, "Record_Status") === "Active" &&
          (depth === "COMPREHENSIVE" || cell(row, "Question_Set_Tier") === "CORE"),
      )
      .map((row) => {
        const questionTypeId = cell(row, "Question_Type_ID");
        return {
          id: cell(row, "Question_ID"),
          assessmentType: "SKILL" as const,
          ageGroupId: cell(row, "Age_Group_ID") as AgeGroupId,
          respondentType: cell(row, "Respondent_Type") as RespondentType,
          skillId: cell(row, "Skill_ID"),
          text: cell(row, "Question_Text"),
          questionTypeId,
          tier: cell(row, "Question_Set_Tier") as AssessmentDepth,
          weight: parseNumber(cell(row, "Weight"), 1),
          reverseScored: parseBoolean(cell(row, "Reverse_Scored_Flag")),
          displayOrder: parseNumber(cell(row, "Display_Order")),
          version: cell(row, "Assessment_Version"),
          required: parseBoolean(cell(row, "Required_Flag")),
          options: structuredClone(optionsByType.get(questionTypeId) ?? []),
        };
      })
      .sort((left, right) => left.displayOrder - right.displayOrder);
  }

  async listAssessments(childId: string): Promise<Assessment[]> {
    const table = await this.readTable(workbookTabs.assessments, [
      "Assessment_ID",
      "Child_ID",
      "Assessment_Status",
    ]);
    return table.rows
      .filter((row) => cell(row, "Child_ID") === childId)
      .map((row) => this.assessmentFromRow(row))
      .sort((left, right) => left.sequence - right.sequence);
  }

  async getAssessment(assessmentId: string): Promise<Assessment | undefined> {
    const table = await this.readTable(workbookTabs.assessments, ["Assessment_ID"]);
    const row = table.rows.find(
      (candidate) => cell(candidate, "Assessment_ID") === assessmentId,
    );
    return row ? this.assessmentFromRow(row) : undefined;
  }

  async createAssessment(assessment: Assessment): Promise<void> {
    await this.appendObject(workbookTabs.assessments, this.assessmentRecord(assessment));
    await this.updateChildFields(assessment.childId, {
      Assessment_Status: "In Progress",
      Updated_At: assessment.updatedAt,
    });
  }

  async listAssessmentResponses(assessmentId: string): Promise<AssessmentResponse[]> {
    const table = await this.readTable(workbookTabs.responses, [
      "Response_ID",
      "Assessment_ID",
      "Question_ID",
    ]);
    const latest = new Map<string, SheetRow>();
    for (const row of table.rows.filter(
      (candidate) => cell(candidate, "Assessment_ID") === assessmentId,
    )) {
      latest.set(cell(row, "Question_ID"), row);
    }
    return [...latest.values()].map((row) => this.responseFromRow(row));
  }

  async saveAssessmentResponse(response: AssessmentResponse): Promise<void> {
    await this.appendObject(workbookTabs.responses, {
      Response_ID: response.id,
      Assessment_ID: response.assessmentId,
      Child_ID: response.childId,
      Question_ID: response.questionId,
      Respondent_Type: response.respondentType,
      Option_ID: response.optionId,
      Raw_Score: response.rawScore,
      Adjusted_Score: response.adjustedScore,
      Response_Text: response.responseText ?? "",
      Answered_At: response.answeredAt,
      Record_Status: response.recordStatus,
      Created_At: response.createdAt,
      Updated_At: response.updatedAt,
    });
  }

  async listSkillScores(assessmentId: string): Promise<SkillScore[]> {
    const table = await this.readTable(workbookTabs.skillScores, [
      "Skill_Score_ID",
      "Assessment_ID",
      "Skill_ID",
    ]);
    return table.rows
      .filter((row) => cell(row, "Assessment_ID") === assessmentId)
      .map((row) => this.skillScoreFromRow(row));
  }

  async saveAssessmentResult(
    assessment: Assessment,
    skillScores: SkillScore[],
    child: Child,
  ): Promise<void> {
    const existingSkillIds = new Set(
      (await this.listSkillScores(assessment.id)).map((score) => score.skillId),
    );
    const missingScores = skillScores.filter((score) => !existingSkillIds.has(score.skillId));
    await this.appendObjects(
      workbookTabs.skillScores,
      missingScores.map((score) => ({
        Skill_Score_ID: score.id,
        Assessment_ID: score.assessmentId,
        Child_ID: score.childId,
        Skill_ID: score.skillId,
        Weighted_Raw_Score: score.weightedRawScore,
        Normalized_Score: score.normalizedScore,
        Skill_Weight_Percent: score.skillWeightPercent,
        Weighted_Contribution: score.weightedContribution,
        Score_Band: score.scoreBand,
        Previous_Score: score.previousScore ?? "",
        Change_From_Previous: score.changeFromPrevious ?? "",
        Calculated_At: score.calculatedAt,
        Calculation_Version: score.calculationVersion,
      })),
    );

    await this.updateRowFields(workbookTabs.assessments, "Assessment_ID", assessment.id, {
      Completed_At: assessment.completedAt ?? "",
      Overall_GrowScore: assessment.overallGrowScore ?? "",
      Score_Band: assessment.scoreBand ?? "",
      Assessment_Status: assessment.status,
      Updated_At: assessment.updatedAt,
      Calculation_Version: assessment.calculationVersion,
    });
    await this.updateChildFields(child.id, {
      Assessment_Status: child.assessmentStatus,
      Assessment_Count: child.assessmentCount,
      Current_GrowScore: child.currentGrowScore ?? "",
      Updated_At: child.updatedAt,
      Updated_By: child.parentId,
    });
  }

  async listMissions(ageGroupId: AgeGroupId): Promise<Mission[]> {
    const table = await this.readTable(workbookTabs.missions, [
      "Mission_ID",
      "Skill_ID",
      "Age_Group_ID",
      "Mission_Name",
      "Mission_Description",
      "Difficulty_Level",
      "Duration_Minutes",
      "Record_Status",
    ]);
    return table.rows
      .filter(
        (row) =>
          cell(row, "Age_Group_ID") === ageGroupId && cell(row, "Record_Status") === "Active",
      )
      .map((row) => this.missionFromRow(row))
      .sort((left, right) => left.displayOrder - right.displayOrder);
  }

  async listRecommendationRules(ageGroupId: AgeGroupId): Promise<RecommendationRule[]> {
    const table = await this.readTable(workbookTabs.recommendationRules, [
      "Rule_ID",
      "Age_Group_ID",
      "Skill_ID",
      "Min_Score",
      "Max_Score",
      "Recommended_Difficulty",
      "Record_Status",
    ]);
    return table.rows
      .filter(
        (row) =>
          (cell(row, "Age_Group_ID") === "ALL" || cell(row, "Age_Group_ID") === ageGroupId) &&
          cell(row, "Record_Status") === "Active",
      )
      .map((row) => this.recommendationRuleFromRow(row));
  }

  async getJourneyConfiguration(): Promise<JourneyConfiguration> {
    const table = await this.readTable(workbookTabs.configuration, [
      "Config_Key",
      "Config_Value",
      "Record_Status",
    ]);
    const active = new Map(
      table.rows
        .filter((row) => cell(row, "Record_Status") === "Active")
        .map((row) => [cell(row, "Config_Key"), cell(row, "Config_Value")]),
    );
    const journeyDays = parseNumber(active.get("DEFAULT_JOURNEY_DAYS") ?? "", 21);
    const reassessmentMinCompletionPercent = parseNumber(
      active.get("REASSESSMENT_MIN_COMPLETION_PERCENT") ?? "",
      70,
    );
    if (
      journeyDays < 1 ||
      journeyDays > 90 ||
      reassessmentMinCompletionPercent < 0 ||
      reassessmentMinCompletionPercent > 100
    ) {
      throw new Error("Journey configuration contains values outside supported bounds");
    }
    return { journeyDays, reassessmentMinCompletionPercent };
  }

  async getPlanEntitlements(planId: PlanId): Promise<PlanEntitlements> {
    const plan = (await this.listPlanEntitlements()).find((candidate) => candidate.planId === planId);
    if (!plan) throw new Error(`Subscription plan ${planId} was not found`);
    return plan;
  }

  async listPlanEntitlements(): Promise<PlanEntitlements[]> {
    const table = await this.readTable(workbookTabs.subscriptions, [
      "Plan_ID",
      "Plan_Name",
      "Plan_Positioning",
      "Monthly_Price_INR",
      "Annual_Price_INR",
      "Max_Children",
      "Included_Assessments_Per_Year",
      "Question_Count",
      "Skills_Visible",
      "Missions_Per_Skill",
      "Journey_Length_Days",
      "Passion_Insights_Level",
      "GrowScore_Enabled",
      "Growth_Tracker_Enabled",
      "Growth_Timeline_Enabled",
      "Assessment_History_Access",
      "Assessment_Comparison",
      "Weekly_Summary_Enabled",
      "Monthly_Report_Enabled",
      "Advanced_Analytics_Enabled",
      "Parent_Guidance_Level",
      "Priority_Support",
      "Report_Export",
      "Multi_Language_Level",
      "Display_Order",
      "Recommended_Flag",
    ]);
    return table.rows
      .filter((row) => cell(row, "Plan_ID") !== "")
      .map((row) => this.planEntitlementsFromRow(row))
      .sort((left, right) => left.displayOrder - right.displayOrder);
  }

  async updateChildPlanSnapshots(
    childIds: string[],
    planId: PlanId,
    timestamp: string,
  ): Promise<void> {
    await Promise.all(
      childIds.map((childId) =>
        this.updateChildFields(childId, {
          Current_Plan_ID: planId,
          Updated_At: timestamp,
        }),
      ),
    );
  }

  async listJourneys(childId: string): Promise<Journey[]> {
    const table = await this.readTable(workbookTabs.journeys, [
      "Journey_ID",
      "Child_ID",
      "Journey_Status",
    ]);
    return table.rows
      .filter((row) => cell(row, "Child_ID") === childId)
      .map((row) => this.journeyFromRow(row))
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async getJourney(journeyId: string): Promise<Journey | undefined> {
    const table = await this.readTable(workbookTabs.journeys, ["Journey_ID"]);
    const row = table.rows.find((candidate) => cell(candidate, "Journey_ID") === journeyId);
    return row ? this.journeyFromRow(row) : undefined;
  }

  async listJourneySchedules(journeyId: string): Promise<JourneySchedule[]> {
    const table = await this.readTable(workbookTabs.missionScheduler, [
      "Schedule_ID",
      "Journey_ID",
      "Mission_ID",
    ]);
    return table.rows
      .filter((row) => cell(row, "Journey_ID") === journeyId)
      .map((row) => this.journeyScheduleFromRow(row))
      .sort((left, right) => left.day - right.day);
  }

  async listMissionCompletionsByChild(childId: string): Promise<MissionCompletion[]> {
    const table = await this.readTable(workbookTabs.missionCompletion, [
      "Completion_ID",
      "Child_ID",
      "Schedule_ID",
    ]);
    return table.rows
      .filter((row) => cell(row, "Child_ID") === childId && cell(row, "Record_Status") === "Active")
      .map((row) => this.missionCompletionFromRow(row))
      .sort((left, right) => left.completedAt.localeCompare(right.completedAt));
  }

  async createJourney(
    journey: Journey,
    schedules: JourneySchedule[],
    assessment: Assessment,
    child: Child,
  ): Promise<void> {
    await this.appendObject(workbookTabs.journeys, this.journeyRecord(journey));
    await this.appendObjects(
      workbookTabs.missionScheduler,
      schedules.map((schedule) => this.journeyScheduleRecord(schedule)),
    );
    await this.updateRowFields(workbookTabs.assessments, "Assessment_ID", assessment.id, {
      Journey_ID: assessment.journeyId ?? "",
      Updated_At: assessment.updatedAt,
    });
    await this.updateChildFields(child.id, {
      Journey_Status: child.journeyStatus,
      Updated_At: child.updatedAt,
      Updated_By: child.parentId,
    });
  }

  async saveJourneyProgress(
    completion: MissionCompletion,
    journey: Journey,
    schedules: JourneySchedule[],
    child: Child,
  ): Promise<void> {
    await this.appendObject(workbookTabs.missionCompletion, {
      Completion_ID: completion.id,
      Journey_ID: completion.journeyId,
      Schedule_ID: completion.scheduleId,
      Child_ID: completion.childId,
      Mission_ID: completion.missionId,
      Completion_Status: completion.status,
      Enjoyment_Score: completion.enjoymentScore,
      Difficulty_Feedback: completion.difficultyFeedback,
      Parent_Notes: completion.parentNotes ?? "",
      Completed_At: completion.completedAt,
      Mission_Points_Awarded: completion.pointsAwarded,
      Streak_Day: completion.streakDay,
      Submission_Source: completion.submissionSource,
      Record_Status: completion.recordStatus,
      Created_At: completion.createdAt,
      Updated_At: completion.updatedAt,
    });
    await this.updateRowFields(workbookTabs.journeys, "Journey_ID", journey.id, {
      Actual_End_Date: journey.actualEndDate ?? "",
      Journey_Status: journey.status,
      Current_Day: journey.currentDay,
      Missions_Completed: journey.missionsCompleted,
      Completion_Percent: journey.completionPercent,
      Reassessment_Unlocked_Flag: journey.reassessmentUnlocked,
      Updated_At: journey.updatedAt,
    });
    for (const schedule of schedules.filter(
      (candidate) => candidate.completionId === completion.id,
    )) {
      await this.updateRowFields(workbookTabs.missionScheduler, "Schedule_ID", schedule.id, {
        Schedule_Status: schedule.status,
        Unlocked_Flag: schedule.unlocked,
        Completion_ID: schedule.completionId ?? "",
        Updated_At: schedule.updatedAt,
      });
    }
    await this.updateChildFields(child.id, {
      Assessment_Status: child.assessmentStatus,
      Journey_Status: child.journeyStatus,
      Journey_Count: child.journeyCount,
      Current_Streak: child.currentStreak,
      Updated_At: child.updatedAt,
      Updated_By: child.parentId,
    });
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
    await this.appendObjects(tab, [record]);
  }

  private async appendObjects(
    tab: string,
    records: Record<string, unknown>[],
  ): Promise<void> {
    if (records.length === 0) return;
    const table = await this.readTable(tab, Object.keys(records[0] ?? {}));
    const values = records.map((record) =>
      table.headers.map((header) => toSheetValue(record[header])),
    );
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `'${tab}'!A:ZZ`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values },
    });
  }

  private async updateChildFields(
    childId: string,
    fields: Record<string, unknown>,
  ): Promise<void> {
    await this.updateRowFields(workbookTabs.children, "Child_ID", childId, fields);
  }

  private async updateRowFields(
    tab: string,
    idHeader: string,
    id: string,
    fields: Record<string, unknown>,
  ): Promise<void> {
    const table = await this.readTable(tab, [idHeader, ...Object.keys(fields)]);
    const row = table.rows.find((candidate) => cell(candidate, idHeader) === id);
    if (!row) return;
    await this.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        valueInputOption: "RAW",
        data: Object.entries(fields).map(([header, value]) => ({
          range: `'${tab}'!${columnName(table.headers.indexOf(header))}${row.__rowNumber}`,
          values: [[toSheetValue(value)]],
        })),
      },
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
      pushNotification: parseBoolean(get("Push_Notification")),
      emailNotification: parseBoolean(get("Email_Notification")),
      whatsAppNotification: parseBoolean(get("WhatsApp_Notification")),
      weeklySummary: parseBoolean(get("Weekly_Summary")),
      missionReminder: parseBoolean(get("Mission_Reminder")),
      marketingConsent: parseBoolean(get("Marketing_Consent")),
      termsAcceptedAt: get("Terms_Accepted_At"),
      referralCode: get("Referral_Code") || `PW${get("Parent_ID").slice(-8)}`,
      referralStatus: (get("Referral_Status") || "Not Applicable") as Parent["referralStatus"],
      accountStatus: (get("Account_Status") || "Active") as Parent["accountStatus"],
      createdAt: get("Created_At"),
      updatedAt: get("Updated_At"),
    };
    if (get("Subscription_Start_Date")) {
      parent.subscriptionStartDate = get("Subscription_Start_Date");
    }
    if (get("Subscription_End_Date")) {
      parent.subscriptionEndDate = get("Subscription_End_Date");
    }
    if (get("Referred_By")) parent.referredBy = get("Referred_By");
    if (get("Last_Login_At")) parent.lastLoginAt = get("Last_Login_At");
    return parent;
  }

  private planEntitlementsFromRow(row: SheetRow): PlanEntitlements {
    const maxChildrenValue = cell(row, "Max_Children");
    return {
      planId: cell(row, "Plan_ID") as PlanId,
      planName: cell(row, "Plan_Name"),
      positioning: cell(row, "Plan_Positioning"),
      monthlyPriceInr: parseNumber(cell(row, "Monthly_Price_INR")),
      annualPriceInr: parseNumber(cell(row, "Annual_Price_INR")),
      maxChildren: maxChildrenValue === "Unlimited" ? null : parseNumber(maxChildrenValue),
      includedAssessmentsPerYear: parseNumber(cell(row, "Included_Assessments_Per_Year")),
      questionCount: parseNumber(cell(row, "Question_Count")),
      skillsVisible: parseNumber(cell(row, "Skills_Visible")),
      missionsPerSkill: parseNumber(cell(row, "Missions_Per_Skill")),
      journeyLengthDays: parseNumber(cell(row, "Journey_Length_Days")),
      passionInsightsLevel: cell(row, "Passion_Insights_Level"),
      growScoreEnabled: parseBoolean(cell(row, "GrowScore_Enabled")),
      growthTrackerEnabled: parseBoolean(cell(row, "Growth_Tracker_Enabled")),
      growthTimelineEnabled: parseBoolean(cell(row, "Growth_Timeline_Enabled")),
      assessmentHistoryAccess: cell(
        row,
        "Assessment_History_Access",
      ) as PlanEntitlements["assessmentHistoryAccess"],
      assessmentComparison: cell(
        row,
        "Assessment_Comparison",
      ) as PlanEntitlements["assessmentComparison"],
      weeklySummaryEnabled: parseBoolean(cell(row, "Weekly_Summary_Enabled")),
      monthlyReportEnabled: parseBoolean(cell(row, "Monthly_Report_Enabled")),
      advancedAnalyticsEnabled: parseBoolean(cell(row, "Advanced_Analytics_Enabled")),
      parentGuidanceLevel: cell(row, "Parent_Guidance_Level"),
      prioritySupport: cell(row, "Priority_Support"),
      reportExport: cell(row, "Report_Export"),
      multiLanguageLevel: cell(row, "Multi_Language_Level"),
      displayOrder: parseNumber(cell(row, "Display_Order")),
      recommended: parseBoolean(cell(row, "Recommended_Flag")),
    };
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

  private childPassionFromRow(row: SheetRow): ChildPassion {
    const value: ChildPassion = {
      id: cell(row, "Child_Passion_ID"),
      childId: cell(row, "Child_ID"),
      passionId: cell(row, "Passion_ID"),
      preferenceRank: parseNumber(cell(row, "Preference_Rank")),
      status: (cell(row, "Passion_Status") || "Selected") as ChildPassion["status"],
      source: "Parent Selection",
      capturedAt: cell(row, "Captured_At"),
      recordStatus: (cell(row, "Record_Status") || "Active") as ChildPassion["recordStatus"],
      createdAt: cell(row, "Created_At"),
      updatedAt: cell(row, "Updated_At"),
    };
    if (cell(row, "Assessment_ID")) value.assessmentId = cell(row, "Assessment_ID");
    return value;
  }

  private questionOptionFromRow(row: SheetRow): QuestionOption {
    return {
      id: cell(row, "Option_ID"),
      questionTypeId: cell(row, "Question_Type_ID"),
      displayText: cell(row, "Display_Text"),
      numericScore: parseNumber(cell(row, "Numeric_Score")),
      reverseScore: parseNumber(cell(row, "Reverse_Score")),
      displayOrder: parseNumber(cell(row, "Display_Order")),
    };
  }

  private assessmentFromRow(row: SheetRow): Assessment {
    const assessment: Assessment = {
      id: cell(row, "Assessment_ID"),
      childId: cell(row, "Child_ID"),
      version: cell(row, "Assessment_Version"),
      depth: cell(row, "Assessment_Depth") as AssessmentDepth,
      respondentMode: cell(row, "Respondent_Mode") as RespondentMode,
      startedAt: cell(row, "Started_At"),
      questionCount: parseNumber(cell(row, "Question_Count")),
      sequence: parseNumber(cell(row, "Assessment_Sequence")),
      status: cell(row, "Assessment_Status") as Assessment["status"],
      createdAt: cell(row, "Created_At"),
      updatedAt: cell(row, "Updated_At"),
      calculationVersion: cell(row, "Calculation_Version") || "1.0",
    };
    if (cell(row, "Completed_At")) assessment.completedAt = cell(row, "Completed_At");
    if (cell(row, "Overall_GrowScore")) {
      assessment.overallGrowScore = parseNumber(cell(row, "Overall_GrowScore"));
    }
    if (cell(row, "Score_Band")) assessment.scoreBand = cell(row, "Score_Band") as ScoreBand;
    if (cell(row, "Journey_ID")) assessment.journeyId = cell(row, "Journey_ID");
    return assessment;
  }

  private assessmentRecord(assessment: Assessment): Record<string, unknown> {
    return {
      Assessment_ID: assessment.id,
      Child_ID: assessment.childId,
      Assessment_Version: assessment.version,
      Assessment_Depth: assessment.depth,
      Respondent_Mode: assessment.respondentMode,
      Started_At: assessment.startedAt,
      Completed_At: assessment.completedAt ?? "",
      Overall_GrowScore: assessment.overallGrowScore ?? "",
      Score_Band: assessment.scoreBand ?? "",
      Journey_ID: assessment.journeyId ?? "",
      Question_Count: assessment.questionCount,
      Assessment_Sequence: assessment.sequence,
      Assessment_Status: assessment.status,
      Created_At: assessment.createdAt,
      Updated_At: assessment.updatedAt,
      Calculation_Version: assessment.calculationVersion,
    };
  }

  private responseFromRow(row: SheetRow): AssessmentResponse {
    const response: AssessmentResponse = {
      id: cell(row, "Response_ID"),
      assessmentId: cell(row, "Assessment_ID"),
      childId: cell(row, "Child_ID"),
      questionId: cell(row, "Question_ID"),
      respondentType: cell(row, "Respondent_Type") as RespondentType,
      optionId: cell(row, "Option_ID"),
      rawScore: parseNumber(cell(row, "Raw_Score")),
      adjustedScore: parseNumber(cell(row, "Adjusted_Score")),
      answeredAt: cell(row, "Answered_At"),
      recordStatus: "Active",
      createdAt: cell(row, "Created_At"),
      updatedAt: cell(row, "Updated_At"),
    };
    if (cell(row, "Response_Text")) response.responseText = cell(row, "Response_Text");
    return response;
  }

  private skillScoreFromRow(row: SheetRow): SkillScore {
    const score: SkillScore = {
      id: cell(row, "Skill_Score_ID"),
      assessmentId: cell(row, "Assessment_ID"),
      childId: cell(row, "Child_ID"),
      skillId: cell(row, "Skill_ID"),
      weightedRawScore: parseNumber(cell(row, "Weighted_Raw_Score")),
      normalizedScore: parseNumber(cell(row, "Normalized_Score")),
      skillWeightPercent: parseNumber(cell(row, "Skill_Weight_Percent")),
      weightedContribution: parseNumber(cell(row, "Weighted_Contribution")),
      scoreBand: cell(row, "Score_Band") as ScoreBand,
      calculatedAt: cell(row, "Calculated_At"),
      calculationVersion: cell(row, "Calculation_Version"),
    };
    if (cell(row, "Previous_Score")) score.previousScore = parseNumber(cell(row, "Previous_Score"));
    if (cell(row, "Change_From_Previous")) {
      score.changeFromPrevious = parseNumber(cell(row, "Change_From_Previous"));
    }
    return score;
  }

  private missionFromRow(row: SheetRow): Mission {
    return {
      id: cell(row, "Mission_ID"),
      skillId: cell(row, "Skill_ID"),
      ageGroupId: cell(row, "Age_Group_ID") as AgeGroupId,
      name: cell(row, "Mission_Name"),
      description: cell(row, "Mission_Description"),
      difficulty: cell(row, "Difficulty_Level") as MissionDifficulty,
      durationMinutes: parseNumber(cell(row, "Duration_Minutes")),
      materialsNeeded: cell(row, "Materials_Needed") || "None",
      parentGuidance: cell(row, "Parent_Guidance"),
      childInstructions: cell(row, "Child_Instructions"),
      learningOutcome: cell(row, "Learning_Outcome"),
      points: parseNumber(cell(row, "Mission_Points")),
      repeatable: parseBoolean(cell(row, "Repeatable_Flag")),
      indoorOutdoor: (cell(row, "Indoor_Outdoor") || "BOTH") as Mission["indoorOutdoor"],
      planEligibility: (cell(row, "Plan_Eligibility") || "ALL") as Mission["planEligibility"],
      category: cell(row, "Mission_Category"),
      displayOrder: parseNumber(cell(row, "Display_Order")),
    };
  }

  private recommendationRuleFromRow(row: SheetRow): RecommendationRule {
    return {
      id: cell(row, "Rule_ID"),
      ageGroupId: (cell(row, "Age_Group_ID") || "ALL") as RecommendationRule["ageGroupId"],
      skillId: cell(row, "Skill_ID"),
      minScore: parseNumber(cell(row, "Min_Score")),
      maxScore: parseNumber(cell(row, "Max_Score")),
      scoreBand: cell(row, "Score_Band") as ScoreBand,
      priorityRank: parseNumber(cell(row, "Priority_Rank")),
      recommendedDifficulty: cell(
        row,
        "Recommended_Difficulty",
      ) as RecommendationRule["recommendedDifficulty"],
      missionCategory: cell(row, "Mission_Category") || "ANY",
      focusPercent: parseNumber(cell(row, "Focus_Percent")),
      parentMessageTemplate: cell(row, "Parent_Message_Template"),
      excludeCompletedWithinDays: parseNumber(cell(row, "Exclude_Completed_Within_Days"), 42),
      minimumJourneyCompletionPercent: parseNumber(
        cell(row, "Minimum_Journey_Completion_Percent"),
        70,
      ),
    };
  }

  private journeyFromRow(row: SheetRow): Journey {
    const journey: Journey = {
      id: cell(row, "Journey_ID"),
      childId: cell(row, "Child_ID"),
      sourceAssessmentId: cell(row, "Source_Assessment_ID"),
      planId: cell(row, "Plan_ID") as PlanId,
      startDate: cell(row, "Start_Date"),
      plannedEndDate: cell(row, "Planned_End_Date"),
      status: cell(row, "Journey_Status") as Journey["status"],
      currentDay: parseNumber(cell(row, "Current_Day"), 1),
      missionsPlanned: parseNumber(cell(row, "Missions_Planned")),
      missionsCompleted: parseNumber(cell(row, "Missions_Completed")),
      completionPercent: parseNumber(cell(row, "Completion_Percent")),
      reassessmentUnlocked: parseBoolean(cell(row, "Reassessment_Unlocked_Flag")),
      createdAt: cell(row, "Created_At"),
      updatedAt: cell(row, "Updated_At"),
      version: cell(row, "Journey_Version") || "1.0",
    };
    if (cell(row, "Actual_End_Date")) journey.actualEndDate = cell(row, "Actual_End_Date");
    return journey;
  }

  private journeyRecord(journey: Journey): Record<string, unknown> {
    return {
      Journey_ID: journey.id,
      Child_ID: journey.childId,
      Source_Assessment_ID: journey.sourceAssessmentId,
      Plan_ID: journey.planId,
      Start_Date: journey.startDate,
      Planned_End_Date: journey.plannedEndDate,
      Actual_End_Date: journey.actualEndDate ?? "",
      Journey_Status: journey.status,
      Current_Day: journey.currentDay,
      Missions_Planned: journey.missionsPlanned,
      Missions_Completed: journey.missionsCompleted,
      Completion_Percent: journey.completionPercent,
      Reassessment_Unlocked_Flag: journey.reassessmentUnlocked,
      Created_At: journey.createdAt,
      Updated_At: journey.updatedAt,
      Journey_Version: journey.version,
    };
  }

  private journeyScheduleFromRow(row: SheetRow): JourneySchedule {
    const schedule: JourneySchedule = {
      id: cell(row, "Schedule_ID"),
      journeyId: cell(row, "Journey_ID"),
      childId: cell(row, "Child_ID"),
      missionId: cell(row, "Mission_ID"),
      day: parseNumber(cell(row, "Journey_Day")),
      week: parseNumber(cell(row, "Journey_Week")),
      scheduledDate: cell(row, "Scheduled_Date"),
      status: cell(row, "Schedule_Status") as JourneySchedule["status"],
      unlocked: parseBoolean(cell(row, "Unlocked_Flag")),
      prioritySource: cell(row, "Priority_Source"),
      skillId: cell(row, "Skill_ID"),
      generatedAt: cell(row, "Generated_At"),
      createdBy: cell(row, "Created_By"),
      updatedAt: cell(row, "Updated_At"),
    };
    if (cell(row, "Completion_ID")) schedule.completionId = cell(row, "Completion_ID");
    if (cell(row, "Notes")) schedule.notes = cell(row, "Notes");
    return schedule;
  }

  private journeyScheduleRecord(schedule: JourneySchedule): Record<string, unknown> {
    return {
      Schedule_ID: schedule.id,
      Journey_ID: schedule.journeyId,
      Child_ID: schedule.childId,
      Mission_ID: schedule.missionId,
      Journey_Day: schedule.day,
      Journey_Week: schedule.week,
      Scheduled_Date: schedule.scheduledDate,
      Schedule_Status: schedule.status,
      Unlocked_Flag: schedule.unlocked,
      Priority_Source: schedule.prioritySource,
      Skill_ID: schedule.skillId,
      Completion_ID: schedule.completionId ?? "",
      Generated_At: schedule.generatedAt,
      Created_By: schedule.createdBy,
      Updated_At: schedule.updatedAt,
      Notes: schedule.notes ?? "",
    };
  }

  private missionCompletionFromRow(row: SheetRow): MissionCompletion {
    const completion: MissionCompletion = {
      id: cell(row, "Completion_ID"),
      journeyId: cell(row, "Journey_ID"),
      scheduleId: cell(row, "Schedule_ID"),
      childId: cell(row, "Child_ID"),
      missionId: cell(row, "Mission_ID"),
      status: cell(row, "Completion_Status") as MissionCompletionStatus,
      enjoymentScore: parseNumber(cell(row, "Enjoyment_Score")),
      difficultyFeedback: cell(row, "Difficulty_Feedback") as MissionDifficultyFeedback,
      completedAt: cell(row, "Completed_At"),
      pointsAwarded: parseNumber(cell(row, "Mission_Points_Awarded")),
      streakDay: parseNumber(cell(row, "Streak_Day")),
      submissionSource: "PARENT",
      recordStatus: "Active",
      createdAt: cell(row, "Created_At"),
      updatedAt: cell(row, "Updated_At"),
    };
    if (cell(row, "Parent_Notes")) completion.parentNotes = cell(row, "Parent_Notes");
    return completion;
  }
}
