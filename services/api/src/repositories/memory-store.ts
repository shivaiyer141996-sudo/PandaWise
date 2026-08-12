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
  MasterOption,
  Mission,
  MissionCompletion,
  Parent,
  QuestionOption,
  RecommendationRule,
  ScoreBand,
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

const missionDifficultySeeds = [
  { difficulty: "EASY", durationMinutes: 10, points: 10, planEligibility: "ALL" },
  {
    difficulty: "MEDIUM",
    durationMinutes: 15,
    points: 20,
    planEligibility: "GROWTH_AND_MASTERY",
  },
  { difficulty: "HARD", durationMinutes: 20, points: 30, planEligibility: "MASTERY" },
] as const;

function seedMissions(): Mission[] {
  const ageGroups: AgeGroupId[] = ["AG01", "AG02", "AG03"];
  return ageGroups.flatMap((ageGroupId) =>
    skillSeeds.flatMap(([skillId, skillName], skillIndex) =>
      missionDifficultySeeds.map((seed, difficultyIndex) => ({
        id: `MIS-${ageGroupId}-${skillId}-${String(difficultyIndex + 1).padStart(2, "0")}`,
        skillId,
        ageGroupId,
        name: `${skillName} ${["Starter", "Builder", "Challenge"][difficultyIndex]} Mission`,
        description: `Practice ${skillName.toLowerCase()} through one calm, age-appropriate family activity.`,
        difficulty: seed.difficulty,
        durationMinutes: seed.durationMinutes,
        materialsNeeded: "Everyday household items",
        parentGuidance: "Encourage effort, allow choices and keep the activity pressure-free.",
        childInstructions: `Try the ${skillName.toLowerCase()} activity and share what you noticed.`,
        learningOutcome: `Build everyday ${skillName.toLowerCase()} through consistent practice.`,
        points: seed.points,
        repeatable: true,
        indoorOutdoor: "BOTH" as const,
        planEligibility: seed.planEligibility,
        category: skillName,
        displayOrder: skillIndex * 3 + difficultyIndex + 1,
      })),
    ),
  );
}

const recommendationBands: Array<{
  minScore: number;
  maxScore: number;
  scoreBand: ScoreBand;
  priorityRank: number;
  recommendedDifficulty: RecommendationRule["recommendedDifficulty"];
  focusPercent: number;
}> = [
  {
    minScore: 0,
    maxScore: 39.99,
    scoreBand: "PRIORITY_GROWTH_AREA",
    priorityRank: 1,
    recommendedDifficulty: "EASY",
    focusPercent: 30,
  },
  {
    minScore: 40,
    maxScore: 59.99,
    scoreBand: "DEVELOPING",
    priorityRank: 2,
    recommendedDifficulty: "EASY_TO_MEDIUM",
    focusPercent: 25,
  },
  {
    minScore: 60,
    maxScore: 74.99,
    scoreBand: "AGE_APPROPRIATE",
    priorityRank: 3,
    recommendedDifficulty: "MEDIUM",
    focusPercent: 20,
  },
  {
    minScore: 75,
    maxScore: 89.99,
    scoreBand: "STRONG",
    priorityRank: 4,
    recommendedDifficulty: "MEDIUM_TO_HARD",
    focusPercent: 15,
  },
  {
    minScore: 90,
    maxScore: 100,
    scoreBand: "EXCEPTIONAL",
    priorityRank: 5,
    recommendedDifficulty: "HARD",
    focusPercent: 10,
  },
];

function seedRecommendationRules(): RecommendationRule[] {
  return skillSeeds.flatMap(([skillId, skillName], skillIndex) =>
    recommendationBands.map((band, bandIndex) => ({
      id: `REC${String(skillIndex * 5 + bandIndex + 1).padStart(3, "0")}`,
      ageGroupId: "ALL",
      skillId,
      ...band,
      missionCategory: "ANY",
      parentMessageTemplate: `Build ${skillName} through regular, achievable practice and supportive feedback.`,
      excludeCompletedWithinDays: 42,
      minimumJourneyCompletionPercent: 70,
    })),
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
  private readonly missions = seedMissions();
  private readonly recommendationRules = seedRecommendationRules();
  private readonly journeys = new Map<string, Journey>();
  private readonly journeySchedules = new Map<string, JourneySchedule[]>();
  private readonly missionCompletions = new Map<string, MissionCompletion>();

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

  async listMissions(ageGroupId: AgeGroupId): Promise<Mission[]> {
    return this.missions
      .filter((mission) => mission.ageGroupId === ageGroupId)
      .sort((left, right) => left.displayOrder - right.displayOrder)
      .map((mission) => structuredClone(mission));
  }

  async listRecommendationRules(ageGroupId: AgeGroupId): Promise<RecommendationRule[]> {
    return this.recommendationRules
      .filter((rule) => rule.ageGroupId === "ALL" || rule.ageGroupId === ageGroupId)
      .map((rule) => structuredClone(rule));
  }

  async getJourneyConfiguration(): Promise<JourneyConfiguration> {
    return { journeyDays: 21, reassessmentMinCompletionPercent: 70 };
  }

  async listJourneys(childId: string): Promise<Journey[]> {
    return [...this.journeys.values()]
      .filter((journey) => journey.childId === childId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .map((journey) => structuredClone(journey));
  }

  async getJourney(journeyId: string): Promise<Journey | undefined> {
    const journey = this.journeys.get(journeyId);
    return journey ? structuredClone(journey) : undefined;
  }

  async listJourneySchedules(journeyId: string): Promise<JourneySchedule[]> {
    return structuredClone(this.journeySchedules.get(journeyId) ?? []).sort(
      (left, right) => left.day - right.day,
    );
  }

  async listMissionCompletionsByChild(childId: string): Promise<MissionCompletion[]> {
    return [...this.missionCompletions.values()]
      .filter((completion) => completion.childId === childId)
      .sort((left, right) => left.completedAt.localeCompare(right.completedAt))
      .map((completion) => structuredClone(completion));
  }

  async createJourney(
    journey: Journey,
    schedules: JourneySchedule[],
    assessment: Assessment,
    child: Child,
  ): Promise<void> {
    this.journeys.set(journey.id, structuredClone(journey));
    this.journeySchedules.set(journey.id, structuredClone(schedules));
    this.assessments.set(assessment.id, structuredClone(assessment));
    this.children.set(child.id, structuredClone(child));
  }

  async saveJourneyProgress(
    completion: MissionCompletion,
    journey: Journey,
    schedules: JourneySchedule[],
    child: Child,
  ): Promise<void> {
    this.missionCompletions.set(completion.scheduleId, structuredClone(completion));
    this.journeys.set(journey.id, structuredClone(journey));
    this.journeySchedules.set(journey.id, structuredClone(schedules));
    this.children.set(child.id, structuredClone(child));
  }
}
