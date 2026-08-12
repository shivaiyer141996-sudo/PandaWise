export type ParentType = "Mother" | "Father" | "Guardian" | "Grandparent";
export type TimeCommitment =
  | "10_MIN"
  | "15_MIN"
  | "20_MIN"
  | "30_MIN"
  | "WEEKENDS_ONLY";
export type PlanId = "PLN001" | "PLN002" | "PLN003";
export type AgeGroupId = "AG01" | "AG02" | "AG03";
export type Gender = "Boy" | "Girl" | "Prefer Not to Say";
export type RespondentType = "PARENT" | "CHILD";
export type RespondentMode = "PARENT" | "HYBRID";
export type AssessmentDepth = "CORE" | "COMPREHENSIVE";
export type AssessmentStatus = "In Progress" | "Completed";
export type ScoreBand =
  | "PRIORITY_GROWTH_AREA"
  | "DEVELOPING"
  | "AGE_APPROPRIATE"
  | "STRONG"
  | "EXCEPTIONAL";
export type MissionDifficulty = "EASY" | "MEDIUM" | "HARD";
export type MissionCompletionStatus = "YES" | "PARTIALLY" | "NO";
export type MissionDifficultyFeedback = "TOO_EASY" | "JUST_RIGHT" | "CHALLENGING";
export type JourneyStatus = "Active" | "Paused" | "Completed";
export type JourneyScheduleStatus = "PLANNED" | "AVAILABLE" | "COMPLETED" | "SKIPPED";

export interface Parent {
  id: string;
  name: string;
  parentType: ParentType;
  mobileNumber: string;
  email: string;
  passwordHash: string;
  subscriptionPlanId: PlanId;
  preferredLanguageId: string;
  dailyTimeCommitment: TimeCommitment;
  marketingConsent: boolean;
  termsAcceptedAt: string;
  accountStatus: "Active" | "Inactive" | "Locked" | "Pending Activation";
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicParent {
  id: string;
  name: string;
  parentType: ParentType;
  mobileNumber: string;
  email: string;
  subscriptionPlanId: PlanId;
  preferredLanguageId: string;
  dailyTimeCommitment: TimeCommitment;
}

export interface Child {
  id: string;
  parentId: string;
  name: string;
  nickname?: string;
  avatarId?: string;
  dateOfBirth: string;
  ageYears: number;
  ageGroupId: AgeGroupId;
  gender: Gender;
  schoolId?: string;
  gradeId?: string;
  languageId: string;
  knownInterests: string[];
  parentTimeCommitment: TimeCommitment;
  currentPlanId: PlanId;
  assessmentStatus: "Not Started" | "In Progress" | "Completed" | "Reassessment Due";
  journeyStatus: "Not Started" | "Active" | "Paused" | "Completed";
  assessmentCount: number;
  journeyCount: number;
  currentGrowScore?: number;
  currentBadgeLevel: "Starter" | "Explorer" | "Achiever" | "Champion";
  currentStreak: number;
  recordStatus: "Active" | "Inactive" | "Deleted";
  createdAt: string;
  updatedAt: string;
}

export interface MasterOption {
  id: string;
  name: string;
  [key: string]: string | number | boolean;
}

export interface BootstrapData {
  ageGroups: MasterOption[];
  languages: MasterOption[];
  schools: MasterOption[];
  grades: MasterOption[];
  skills: MasterOption[];
  passions: MasterOption[];
  timeCommitments: TimeCommitment[];
}

export interface QuestionOption {
  id: string;
  questionTypeId: string;
  displayText: string;
  numericScore: number;
  reverseScore: number;
  displayOrder: number;
}

export interface AssessmentQuestion {
  id: string;
  assessmentType: "SKILL";
  ageGroupId: AgeGroupId;
  respondentType: RespondentType;
  skillId: string;
  text: string;
  questionTypeId: string;
  tier: AssessmentDepth;
  weight: number;
  reverseScored: boolean;
  displayOrder: number;
  version: string;
  required: boolean;
  options: QuestionOption[];
}

export interface ChildPassion {
  id: string;
  childId: string;
  passionId: string;
  preferenceRank: number;
  status: "Selected" | "Removed";
  source: "Parent Selection";
  capturedAt: string;
  assessmentId?: string;
  recordStatus: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface Assessment {
  id: string;
  childId: string;
  version: string;
  depth: AssessmentDepth;
  respondentMode: RespondentMode;
  startedAt: string;
  completedAt?: string;
  overallGrowScore?: number;
  scoreBand?: ScoreBand;
  journeyId?: string;
  questionCount: number;
  sequence: number;
  status: AssessmentStatus;
  createdAt: string;
  updatedAt: string;
  calculationVersion: string;
}

export interface AssessmentResponse {
  id: string;
  assessmentId: string;
  childId: string;
  questionId: string;
  respondentType: RespondentType;
  optionId: string;
  rawScore: number;
  adjustedScore: number;
  responseText?: string;
  answeredAt: string;
  recordStatus: "Active";
  createdAt: string;
  updatedAt: string;
}

export interface SkillScore {
  id: string;
  assessmentId: string;
  childId: string;
  skillId: string;
  weightedRawScore: number;
  normalizedScore: number;
  skillWeightPercent: number;
  weightedContribution: number;
  scoreBand: ScoreBand;
  previousScore?: number;
  changeFromPrevious?: number;
  calculatedAt: string;
  calculationVersion: string;
}

export interface Mission {
  id: string;
  skillId: string;
  ageGroupId: AgeGroupId;
  name: string;
  description: string;
  difficulty: MissionDifficulty;
  durationMinutes: number;
  materialsNeeded: string;
  parentGuidance: string;
  childInstructions: string;
  learningOutcome: string;
  points: number;
  repeatable: boolean;
  indoorOutdoor: "INDOOR" | "OUTDOOR" | "BOTH";
  planEligibility: "ALL" | "GROWTH_AND_MASTERY" | "MASTERY";
  category: string;
  displayOrder: number;
}

export interface RecommendationRule {
  id: string;
  ageGroupId: AgeGroupId | "ALL";
  skillId: string;
  minScore: number;
  maxScore: number;
  scoreBand: ScoreBand;
  priorityRank: number;
  recommendedDifficulty:
    | MissionDifficulty
    | "EASY_TO_MEDIUM"
    | "MEDIUM_TO_HARD";
  missionCategory: string;
  focusPercent: number;
  parentMessageTemplate: string;
  excludeCompletedWithinDays: number;
  minimumJourneyCompletionPercent: number;
}

export interface JourneyConfiguration {
  journeyDays: number;
  reassessmentMinCompletionPercent: number;
}

export interface Journey {
  id: string;
  childId: string;
  sourceAssessmentId: string;
  planId: PlanId;
  startDate: string;
  plannedEndDate: string;
  actualEndDate?: string;
  status: JourneyStatus;
  currentDay: number;
  missionsPlanned: number;
  missionsCompleted: number;
  completionPercent: number;
  reassessmentUnlocked: boolean;
  createdAt: string;
  updatedAt: string;
  version: string;
}

export interface JourneySchedule {
  id: string;
  journeyId: string;
  childId: string;
  missionId: string;
  day: number;
  week: number;
  scheduledDate: string;
  status: JourneyScheduleStatus;
  unlocked: boolean;
  prioritySource: string;
  skillId: string;
  completionId?: string;
  generatedAt: string;
  createdBy: string;
  updatedAt: string;
  notes?: string;
}

export interface MissionCompletion {
  id: string;
  journeyId: string;
  scheduleId: string;
  childId: string;
  missionId: string;
  status: MissionCompletionStatus;
  enjoymentScore: number;
  difficultyFeedback: MissionDifficultyFeedback;
  parentNotes?: string;
  completedAt: string;
  pointsAwarded: number;
  streakDay: number;
  submissionSource: "PARENT";
  recordStatus: "Active";
  createdAt: string;
  updatedAt: string;
}

export function toPublicParent(parent: Parent): PublicParent {
  return {
    id: parent.id,
    name: parent.name,
    parentType: parent.parentType,
    mobileNumber: parent.mobileNumber,
    email: parent.email,
    subscriptionPlanId: parent.subscriptionPlanId,
    preferredLanguageId: parent.preferredLanguageId,
    dailyTimeCommitment: parent.dailyTimeCommitment,
  };
}
