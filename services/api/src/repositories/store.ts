import type {
  AgeGroupId,
  Assessment,
  AssessmentDepth,
  AssessmentQuestion,
  AssessmentResponse,
  BootstrapData,
  Child,
  ChildPassion,
  Parent,
  SkillScore,
} from "../domain/models.js";

export interface PandaWiseStore {
  getParentByEmail(email: string): Promise<Parent | undefined>;
  getParentById(parentId: string): Promise<Parent | undefined>;
  createParent(parent: Parent): Promise<void>;
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
}
