import type {
  AgeGroupId,
  Assessment,
  AssessmentDepth,
  AssessmentQuestion,
  AssessmentResponse,
  BootstrapData,
  Child,
  ChildPassion,
  Journey,
  JourneyConfiguration,
  JourneySchedule,
  Mission,
  MissionCompletion,
  Parent,
  PlanEntitlements,
  PlanId,
  RecommendationRule,
  SkillScore,
} from "../domain/models.js";

export interface PandaWiseStore {
  getParentByEmail(email: string): Promise<Parent | undefined>;
  getParentById(parentId: string): Promise<Parent | undefined>;
  getParentByReferralCode(referralCode: string): Promise<Parent | undefined>;
  createParent(parent: Parent): Promise<void>;
  updateParent(parent: Parent): Promise<void>;
  updateParentLastLogin(parentId: string, timestamp: string): Promise<void>;
  listChildren(parentId: string): Promise<Child[]>;
  getChild(parentId: string, childId: string): Promise<Child | undefined>;
  createChild(child: Child): Promise<void>;
  getBootstrapData(): Promise<BootstrapData>;
  listChildPassions(childId: string): Promise<ChildPassion[]>;
  saveChildPassionEvents(events: ChildPassion[]): Promise<void>;
  listAssessmentQuestions(
    ageGroupId: AgeGroupId,
    version: string,
    depth: AssessmentDepth,
  ): Promise<AssessmentQuestion[]>;
  listAssessments(childId: string): Promise<Assessment[]>;
  getAssessment(assessmentId: string): Promise<Assessment | undefined>;
  createAssessment(assessment: Assessment): Promise<void>;
  listAssessmentResponses(assessmentId: string): Promise<AssessmentResponse[]>;
  saveAssessmentResponse(response: AssessmentResponse): Promise<void>;
  listSkillScores(assessmentId: string): Promise<SkillScore[]>;
  saveAssessmentResult(
    assessment: Assessment,
    skillScores: SkillScore[],
    child: Child,
  ): Promise<void>;
  listMissions(ageGroupId: AgeGroupId): Promise<Mission[]>;
  listRecommendationRules(ageGroupId: AgeGroupId): Promise<RecommendationRule[]>;
  getJourneyConfiguration(): Promise<JourneyConfiguration>;
  getPlanEntitlements(planId: PlanId): Promise<PlanEntitlements>;
  listPlanEntitlements(): Promise<PlanEntitlements[]>;
  updateChildPlanSnapshots(
    childIds: string[],
    planId: PlanId,
    timestamp: string,
  ): Promise<void>;
  listJourneys(childId: string): Promise<Journey[]>;
  getJourney(journeyId: string): Promise<Journey | undefined>;
  listJourneySchedules(journeyId: string): Promise<JourneySchedule[]>;
  listMissionCompletionsByChild(childId: string): Promise<MissionCompletion[]>;
  createJourney(
    journey: Journey,
    schedules: JourneySchedule[],
    assessment: Assessment,
    child: Child,
  ): Promise<void>;
  saveJourneyProgress(
    completion: MissionCompletion,
    journey: Journey,
    schedules: JourneySchedule[],
    child: Child,
  ): Promise<void>;
}
