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
