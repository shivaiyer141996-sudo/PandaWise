import type {
  AgeGroupId,
  Assessment,
  AssessmentDepth,
  AssessmentQuestion,
  AssessmentResponse,
  BootstrapData,
  Child,
  ChildPassion,
  MasterOption,
  Parent,
  QuestionOption,
  SkillScore,
} from "../domain/models.js";
import type { PandaWiseStore } from "./store.js";

const skillSeeds = [
  ["SKL001", "Communication", 12, "#2563EB"],
  ["SKL002", "Confidence", 12, "#22C55E"],
  ["SKL003", "Logical Thinking", 12, "#2563EB"],
  ["SKL004", "Creativity", 10, "#22C55E"],
  ["SKL005", "Curiosity", 10, "#2563EB"],
  ["SKL006", "Reading Habit", 10, "#22C55E"],
  ["SKL007", "Emotional Intelligence", 10, "#2563EB"],
  ["SKL008", "Discipline", 10, "#22C55E"],
  ["SKL009", "Leadership", 7, "#2563EB"],
  ["SKL010", "Financial Awareness", 7, "#22C55E"],
] as const;

const skills: MasterOption[] = skillSeeds.map(([id, name, weight, colour], index) => ({
  id,
  name,
  weight,
  colour,
  displayOrder: index + 1,
  description: `Everyday ${name.toLowerCase()} development.`,
}));

const passionSeeds = [
  ["PAS001", "Drawing", "Arts", "ALL"],
  ["PAS002", "Painting", "Arts", "ALL"],
  ["PAS003", "Music", "Music", "ALL"],
  ["PAS004", "Dance", "Dance", "ALL"],
  ["PAS005", "Cricket", "Sports", "ALL"],
  ["PAS006", "Football", "Sports", "ALL"],
  ["PAS007", "Swimming", "Sports", "ALL"],
  ["PAS008", "Chess", "Strategy", "AG02|AG03"],
  ["PAS009", "Coding", "STEM", "AG02|AG03"],
  ["PAS010", "Robotics", "STEM", "AG02|AG03"],
  ["PAS011", "Reading", "Reading", "ALL"],
  ["PAS012", "Science", "STEM", "ALL"],
  ["PAS013", "Nature & Gardening", "Nature", "ALL"],
  ["PAS014", "Cooking", "Life Skills", "ALL"],
  ["PAS015", "Photography", "Arts", "AG02|AG03"],
  ["PAS016", "Public Speaking", "Performance", "AG02|AG03"],
  ["PAS017", "Acting & Storytelling", "Performance", "ALL"],
] as const;

const passions: MasterOption[] = passionSeeds.map(
  ([id, name, category, ageGroupEligibility], index) => ({
    id,
    name,
    category,
    ageGroupEligibility,
    displayOrder: index + 1,
  }),
);

const likertOptions: QuestionOption[] = [
  ["OPT-L5-01", "Strongly Agree", 5, 1],
  ["OPT-L5-02", "Agree", 4, 2],
  ["OPT-L5-03", "Neutral", 3, 3],
  ["OPT-L5-04", "Disagree", 2, 4],
  ["OPT-L5-05", "Strongly Disagree", 1, 5],
].map(([id, displayText, numericScore, displayOrder]) => ({
  id: String(id),
  questionTypeId: "LIKERT_5",
  displayText: String(displayText),
  numericScore: Number(numericScore),
  reverseScore: 6 - Number(numericScore),
  displayOrder: Number(displayOrder),
}));

function seedQuestions(): AssessmentQuestion[] {
  const ageGroups: AgeGroupId[] = ["AG01", "AG02", "AG03"];
  return ageGroups.flatMap((ageGroupId) =>
    skillSeeds.flatMap(([skillId, skillName], skillIndex) =>
      [1, 2, 3, 4, 5].map((questionIndex) => ({
        id: `Q-${ageGroupId}-${skillId}-${String(questionIndex).padStart(2, "0")}`,
        assessmentType: "SKILL" as const,
        ageGroupId,
        respondentType:
          ageGroupId === "AG03" && (questionIndex === 3 || questionIndex === 5)
            ? ("CHILD" as const)
            : ("PARENT" as const),
        skillId,
        text: `This child demonstrates ${skillName.toLowerCase()} in everyday situation ${questionIndex}.`,
        questionTypeId: "LIKERT_5",
        tier: questionIndex <= 3 ? ("CORE" as const) : ("COMPREHENSIVE" as const),
        weight: 1,
        reverseScored: false,
        displayOrder: skillIndex * 5 + questionIndex,
        version: "1.0",
        required: true,
        options: structuredClone(likertOptions),
      })),
    ),
  );
}

const bootstrapData: BootstrapData = {
  ageGroups: [
    { id: "AG01", name: "Ages 3–6", respondentMode: "PARENT" },
    { id: "AG02", name: "Ages 6–9", respondentMode: "PARENT" },
    { id: "AG03", name: "Ages 9–12", respondentMode: "HYBRID" },
  ],
  languages: [
    { id: "LNG001", name: "English", isoCode: "en", rtl: false },
    { id: "LNG002", name: "Tamil", isoCode: "ta", rtl: false },
  ],
  schools: [],
  grades: [],
  skills,
  passions,
  timeCommitments: ["10_MIN", "15_MIN", "20_MIN", "30_MIN", "WEEKENDS_ONLY"],
};

export class MemoryStore implements PandaWiseStore {
  private readonly parents = new Map<string, Parent>();
  private readonly children = new Map<string, Child>();
  private readonly passionEvents: ChildPassion[] = [];
  private readonly questions = seedQuestions();
  private readonly assessments = new Map<string, Assessment>();
  private readonly responses = new Map<string, AssessmentResponse>();
  private readonly skillScores = new Map<string, SkillScore[]>();

  async getParentByEmail(email: string): Promise<Parent | undefined> {
    const normalized = email.trim().toLowerCase();
    return [...this.parents.values()].find((parent) => parent.email === normalized);
  }

  async getParentById(parentId: string): Promise<Parent | undefined> {
    return this.parents.get(parentId);
  }

  async createParent(parent: Parent): Promise<void> {
    this.parents.set(parent.id, parent);
  }

  async updateParentLastLogin(parentId: string, timestamp: string): Promise<void> {
    const parent = this.parents.get(parentId);
    if (!parent) return;
    this.parents.set(parentId, { ...parent, lastLoginAt: timestamp, updatedAt: timestamp });
  }

  async listChildren(parentId: string): Promise<Child[]> {
    return [...this.children.values()]
      .filter((child) => child.parentId === parentId && child.recordStatus === "Active")
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async getChild(parentId: string, childId: string): Promise<Child | undefined> {
    const child = this.children.get(childId);
    return child?.parentId === parentId && child.recordStatus === "Active" ? child : undefined;
  }

  async createChild(child: Child): Promise<void> {
    this.children.set(child.id, child);
  }

  async getBootstrapData(): Promise<BootstrapData> {
    return structuredClone(bootstrapData);
  }

  async listChildPassions(childId: string): Promise<ChildPassion[]> {
    const latest = new Map<string, ChildPassion>();
    for (const event of this.passionEvents.filter((value) => value.childId === childId)) {
      latest.set(event.passionId, event);
    }
    return [...latest.values()]
      .filter((event) => event.recordStatus === "Active" && event.status === "Selected")
      .sort((left, right) => left.preferenceRank - right.preferenceRank)
      .map((event) => structuredClone(event));
  }

  async saveChildPassionEvents(events: ChildPassion[]): Promise<void> {
    this.passionEvents.push(...structuredClone(events));
  }

  async listAssessmentQuestions(
    ageGroupId: AgeGroupId,
    version: string,
    depth: AssessmentDepth,
  ): Promise<AssessmentQuestion[]> {
    return this.questions
      .filter(
        (question) =>
          question.ageGroupId === ageGroupId &&
          question.version === version &&
          (depth === "COMPREHENSIVE" || question.tier === "CORE"),
      )
      .sort((left, right) => left.displayOrder - right.displayOrder)
      .map((question) => structuredClone(question));
  }

  async listAssessments(childId: string): Promise<Assessment[]> {
    return [...this.assessments.values()]
      .filter((assessment) => assessment.childId === childId)
      .sort((left, right) => left.sequence - right.sequence)
      .map((assessment) => structuredClone(assessment));
  }

  async getAssessment(assessmentId: string): Promise<Assessment | undefined> {
    const assessment = this.assessments.get(assessmentId);
    return assessment ? structuredClone(assessment) : undefined;
  }

  async createAssessment(assessment: Assessment): Promise<void> {
    this.assessments.set(assessment.id, structuredClone(assessment));
    const child = this.children.get(assessment.childId);
    if (child) {
      this.children.set(child.id, {
        ...child,
        assessmentStatus: "In Progress",
        updatedAt: assessment.updatedAt,
      });
    }
  }

  async listAssessmentResponses(assessmentId: string): Promise<AssessmentResponse[]> {
    return [...this.responses.values()]
      .filter((response) => response.assessmentId === assessmentId)
      .map((response) => structuredClone(response));
  }

  async saveAssessmentResponse(response: AssessmentResponse): Promise<void> {
    this.responses.set(`${response.assessmentId}:${response.questionId}`, structuredClone(response));
  }

  async listSkillScores(assessmentId: string): Promise<SkillScore[]> {
    return structuredClone(this.skillScores.get(assessmentId) ?? []);
  }

  async saveAssessmentResult(
    assessment: Assessment,
    scores: SkillScore[],
    child: Child,
  ): Promise<void> {
    this.assessments.set(assessment.id, structuredClone(assessment));
    this.skillScores.set(assessment.id, structuredClone(scores));
    this.children.set(child.id, structuredClone(child));
  }
}
