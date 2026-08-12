import { DomainError, NotFoundError } from "../domain/errors.js";
import { createId } from "../domain/ids.js";
import type {
  Assessment,
  AssessmentQuestion,
  AssessmentResponse,
  Child,
  ChildPassion,
  MasterOption,
  ScoreBand,
  SkillScore,
} from "../domain/models.js";
import type { PandaWiseStore } from "../repositories/store.js";

const assessmentVersion = "1.0";
const calculationVersion = "1.0";

export interface SaveResponseInput {
  optionId: string;
  responseText?: string | undefined;
}

export class AssessmentService {
  constructor(private readonly store: PandaWiseStore) {}

  async getPassions(parentId: string, childId: string): Promise<string[]> {
    await this.ownedChild(parentId, childId);
    return (await this.store.listChildPassions(childId)).map((passion) => passion.passionId);
  }

  async selectPassions(parentId: string, childId: string, passionIds: string[]): Promise<string[]> {
    const child = await this.ownedChild(parentId, childId);
    const uniqueIds = [...new Set(passionIds)];
    if (uniqueIds.length < 1 || uniqueIds.length > 5) {
      throw new DomainError(
        "PASSION_SELECTION_INVALID",
        "Choose between one and five passions",
      );
    }

    const bootstrap = await this.store.getBootstrapData();
    const allowed = new Set(
      bootstrap.passions
        .filter((passion) => this.passionApplies(passion, child.ageGroupId))
        .map((passion) => passion.id),
    );
    if (uniqueIds.some((passionId) => !allowed.has(passionId))) {
      throw new DomainError(
        "PASSION_NOT_ELIGIBLE",
        "One or more passions are not available for this age group",
      );
    }

    const current = await this.store.listChildPassions(childId);
    const currentIds = new Set(current.map((passion) => passion.passionId));
    const timestamp = new Date().toISOString();
    const events: ChildPassion[] = uniqueIds.map((passionId, index) => ({
      id: createId("CPA"),
      childId,
      passionId,
      preferenceRank: index + 1,
      status: "Selected",
      source: "Parent Selection",
      capturedAt: timestamp,
      recordStatus: "Active",
      createdAt: timestamp,
      updatedAt: timestamp,
    }));
    for (const passionId of currentIds) {
      if (uniqueIds.includes(passionId)) continue;
      events.push({
        id: createId("CPA"),
        childId,
        passionId,
        preferenceRank: 0,
        status: "Removed",
        source: "Parent Selection",
        capturedAt: timestamp,
        recordStatus: "Inactive",
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
    await this.store.saveChildPassionEvents(events);
    return uniqueIds;
  }

  async start(parentId: string, childId: string): Promise<Record<string, unknown>> {
    const child = await this.ownedChild(parentId, childId);
    const parent = await this.store.getParentById(parentId);
    if (!parent) throw new NotFoundError("Parent");

    if ((await this.store.listChildPassions(childId)).length === 0) {
      throw new DomainError(
        "PASSION_DISCOVERY_REQUIRED",
        "Complete Passion Discovery before starting the Development Check",
        409,
      );
    }

    const assessments = await this.store.listAssessments(childId);
    const inProgress = assessments.find((assessment) => assessment.status === "In Progress");
    if (inProgress) return this.view(parentId, inProgress.id);
    if (
      assessments.some((assessment) => assessment.status === "Completed") &&
      child.assessmentStatus !== "Reassessment Due"
    ) {
      throw new DomainError(
        "REASSESSMENT_LOCKED",
        "Complete the active journey with at least 70% mission completion before reassessing",
        409,
      );
    }

    const entitlements = await this.store.getPlanEntitlements(parent.subscriptionPlanId);
    const currentYear = new Date().getUTCFullYear();
    const attemptsThisYear = assessments.filter(
      (assessment) => new Date(assessment.startedAt).getUTCFullYear() === currentYear,
    ).length;
    if (attemptsThisYear >= entitlements.includedAssessmentsPerYear) {
      throw new DomainError(
        "ASSESSMENT_LIMIT_REACHED",
        "Your plan has reached its annual Development Check limit",
        403,
      );
    }

    const depth = entitlements.questionCount <= 30 ? "CORE" : "COMPREHENSIVE";
    const questions = await this.store.listAssessmentQuestions(
      child.ageGroupId,
      assessmentVersion,
      depth,
    );
    this.validateQuestionBank(questions, entitlements.questionCount);

    const timestamp = new Date().toISOString();
    const assessment: Assessment = {
      id: createId("ASM"),
      childId,
      version: assessmentVersion,
      depth,
      respondentMode: child.ageGroupId === "AG03" ? "HYBRID" : "PARENT",
      startedAt: timestamp,
      questionCount: questions.length,
      sequence: assessments.length + 1,
      status: "In Progress",
      createdAt: timestamp,
      updatedAt: timestamp,
      calculationVersion,
    };
    await this.store.createAssessment(assessment);
    return this.view(parentId, assessment.id);
  }

  async view(parentId: string, assessmentId: string): Promise<Record<string, unknown>> {
    const { assessment, child } = await this.ownedAssessment(parentId, assessmentId);
    const questions = await this.store.listAssessmentQuestions(
      child.ageGroupId,
      assessment.version,
      assessment.depth,
    );
    const responses = await this.store.listAssessmentResponses(assessmentId);
    const responseByQuestion = new Map(responses.map((response) => [response.questionId, response]));
    return {
      assessment: this.publicAssessment(assessment),
      child: { id: child.id, name: child.name, nickname: child.nickname, ageGroupId: child.ageGroupId },
      questions: questions.map((question) => ({
        id: question.id,
        skillId: question.skillId,
        text: question.text,
        respondentType: question.respondentType,
        displayOrder: question.displayOrder,
        required: question.required,
        options: question.options.map((option) => ({ id: option.id, text: option.displayText })),
        selectedOptionId: responseByQuestion.get(question.id)?.optionId ?? null,
      })),
      progress: {
        answered: responses.length,
        total: assessment.questionCount,
        percent: Math.round((responses.length / assessment.questionCount) * 100),
      },
    };
  }

  async saveResponse(
    parentId: string,
    assessmentId: string,
    questionId: string,
    input: SaveResponseInput,
  ): Promise<Record<string, unknown>> {
    const { assessment, child } = await this.ownedAssessment(parentId, assessmentId);
    if (assessment.status !== "In Progress") {
      throw new DomainError("ASSESSMENT_COMPLETED", "This Development Check is already complete", 409);
    }
    const questions = await this.store.listAssessmentQuestions(
      child.ageGroupId,
      assessment.version,
      assessment.depth,
    );
    const question = questions.find((candidate) => candidate.id === questionId);
    if (!question) throw new NotFoundError("Question");
    const option = question.options.find((candidate) => candidate.id === input.optionId);
    if (!option) {
      throw new DomainError("OPTION_INVALID", "Choose one of the available responses");
    }

    const timestamp = new Date().toISOString();
    const response: AssessmentResponse = {
      id: createId("RSP"),
      assessmentId,
      childId: child.id,
      questionId,
      respondentType: question.respondentType,
      optionId: option.id,
      rawScore: option.numericScore,
      adjustedScore: question.reverseScored ? option.reverseScore : option.numericScore,
      answeredAt: timestamp,
      recordStatus: "Active",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    if (input.responseText?.trim()) response.responseText = input.responseText.trim();
    await this.store.saveAssessmentResponse(response);
    const answered = (await this.store.listAssessmentResponses(assessmentId)).length;
    return {
      saved: true,
      progress: {
        answered,
        total: assessment.questionCount,
        percent: Math.round((answered / assessment.questionCount) * 100),
      },
    };
  }

  async complete(parentId: string, assessmentId: string): Promise<Record<string, unknown>> {
    const { assessment, child } = await this.ownedAssessment(parentId, assessmentId);
    if (assessment.status === "Completed") return this.report(parentId, assessmentId);

    const questions = await this.store.listAssessmentQuestions(
      child.ageGroupId,
      assessment.version,
      assessment.depth,
    );
    const responses = await this.store.listAssessmentResponses(assessmentId);
    const responseByQuestion = new Map(responses.map((response) => [response.questionId, response]));
    const unanswered = questions.filter(
      (question) => question.required && !responseByQuestion.has(question.id),
    );
    if (unanswered.length > 0) {
      throw new DomainError(
        "ASSESSMENT_INCOMPLETE",
        `${unanswered.length} required responses are still pending`,
        409,
      );
    }

    const bootstrap = await this.store.getBootstrapData();
    const skills = new Map(bootstrap.skills.map((skill) => [skill.id, skill]));
    const previousScores = await this.previousScores(child.id, assessment.sequence);
    const timestamp = new Date().toISOString();
    const skillScores = this.calculateSkillScores(
      assessment,
      child,
      questions,
      responseByQuestion,
      skills,
      previousScores,
      timestamp,
    );
    const overallGrowScore = round(
      skillScores.reduce((total, score) => total + score.weightedContribution, 0),
    );
    const completedAssessment: Assessment = {
      ...assessment,
      completedAt: timestamp,
      overallGrowScore,
      scoreBand: scoreBandFor(overallGrowScore),
      status: "Completed",
      updatedAt: timestamp,
    };
    const completedChild: Child = {
      ...child,
      assessmentStatus: "Completed",
      assessmentCount: child.assessmentCount + 1,
      currentGrowScore: overallGrowScore,
      currentBadgeLevel: child.currentBadgeLevel === "Starter" ? "Explorer" : child.currentBadgeLevel,
      updatedAt: timestamp,
    };
    await this.store.saveAssessmentResult(completedAssessment, skillScores, completedChild);
    return this.report(parentId, assessmentId);
  }

  async report(parentId: string, assessmentId: string): Promise<Record<string, unknown>> {
    const { assessment, child } = await this.ownedAssessment(parentId, assessmentId);
    if (assessment.status !== "Completed") {
      throw new DomainError(
        "ASSESSMENT_NOT_COMPLETED",
        "Complete the Development Check before viewing GrowScore",
        409,
      );
    }
    const parent = await this.store.getParentById(parentId);
    if (!parent) throw new NotFoundError("Parent");
    const [scores, bootstrap, entitlements] = await Promise.all([
      this.store.listSkillScores(assessmentId),
      this.store.getBootstrapData(),
      this.store.getPlanEntitlements(parent.subscriptionPlanId),
    ]);
    const skillById = new Map(bootstrap.skills.map((skill) => [skill.id, skill]));
    const ranked = scores
      .map((score) => this.scoreView(score, skillById.get(score.skillId)))
      .sort((left, right) => right.score - left.score);
    const visible = ranked.slice(0, entitlements.skillsVisible);
    const focusAreas = [...visible].sort((left, right) => left.score - right.score).slice(0, 3);
    return {
      assessment: this.publicAssessment(assessment),
      child: { id: child.id, name: child.name, nickname: child.nickname },
      growScore: assessment.overallGrowScore,
      scoreBand: assessment.scoreBand,
      scoreBandLabel: positiveBandLabel(assessment.scoreBand ?? "DEVELOPING"),
      skills: visible,
      strengths: visible.slice(0, 3),
      recommendedFocusAreas: focusAreas,
      entitlements: {
        visibleSkillCount: visible.length,
        lockedSkillCount: Math.max(0, ranked.length - visible.length),
        planId: parent.subscriptionPlanId,
      },
    };
  }

  async latestReport(parentId: string, childId: string): Promise<Record<string, unknown>> {
    await this.ownedChild(parentId, childId);
    const latest = (await this.store.listAssessments(childId))
      .filter((assessment) => assessment.status === "Completed")
      .sort((left, right) => right.sequence - left.sequence)[0];
    if (!latest) throw new NotFoundError("GrowScore report");
    return this.report(parentId, latest.id);
  }

  private async ownedChild(parentId: string, childId: string): Promise<Child> {
    const child = await this.store.getChild(parentId, childId);
    if (!child) throw new NotFoundError("Child");
    return child;
  }

  private async ownedAssessment(
    parentId: string,
    assessmentId: string,
  ): Promise<{ assessment: Assessment; child: Child }> {
    const assessment = await this.store.getAssessment(assessmentId);
    if (!assessment) throw new NotFoundError("Assessment");
    const child = await this.ownedChild(parentId, assessment.childId);
    return { assessment, child };
  }

  private validateQuestionBank(questions: AssessmentQuestion[], expectedCount: number): void {
    const skillIds = new Set(questions.map((question) => question.skillId));
    if (
      questions.length !== expectedCount ||
      skillIds.size !== 10 ||
      questions.some((question) => question.options.length === 0)
    ) {
      throw new DomainError(
        "ASSESSMENT_CONTENT_INVALID",
        "The active Development Check content is incomplete",
        503,
      );
    }
  }

  private passionApplies(passion: MasterOption, ageGroupId: string): boolean {
    const eligibility = String(passion.ageGroupEligibility ?? "ALL");
    return eligibility === "ALL" || eligibility.split("|").includes(ageGroupId);
  }

  private async previousScores(childId: string, sequence: number): Promise<Map<string, number>> {
    const previous = (await this.store.listAssessments(childId))
      .filter((assessment) => assessment.status === "Completed" && assessment.sequence < sequence)
      .sort((left, right) => right.sequence - left.sequence)[0];
    if (!previous) return new Map<string, number>();
    return new Map(
      (await this.store.listSkillScores(previous.id)).map((score) => [
        score.skillId,
        score.normalizedScore,
      ]),
    );
  }

  private calculateSkillScores(
    assessment: Assessment,
    child: Child,
    questions: AssessmentQuestion[],
    responses: Map<string, AssessmentResponse>,
    skills: Map<string, MasterOption>,
    previousScores: Map<string, number>,
    timestamp: string,
  ): SkillScore[] {
    const bySkill = new Map<string, AssessmentQuestion[]>();
    for (const question of questions) {
      const values = bySkill.get(question.skillId) ?? [];
      values.push(question);
      bySkill.set(question.skillId, values);
    }
    return [...bySkill.entries()].map(([skillId, skillQuestions]) => {
      const adjustedTotal = skillQuestions.reduce(
        (total, question) => total + (responses.get(question.id)?.adjustedScore ?? 0),
        0,
      );
      const normalizedScore = round(
        ((adjustedTotal - skillQuestions.length) / (skillQuestions.length * 4)) * 100,
      );
      const skillWeightPercent = Number(skills.get(skillId)?.weight ?? 0);
      const previousScore = previousScores.get(skillId);
      const score: SkillScore = {
        id: createId("SSC"),
        assessmentId: assessment.id,
        childId: child.id,
        skillId,
        weightedRawScore: adjustedTotal,
        normalizedScore,
        skillWeightPercent,
        weightedContribution: round((normalizedScore * skillWeightPercent) / 100),
        scoreBand: scoreBandFor(normalizedScore),
        calculatedAt: timestamp,
        calculationVersion,
      };
      if (previousScore !== undefined) {
        score.previousScore = previousScore;
        score.changeFromPrevious = round(normalizedScore - previousScore);
      }
      return score;
    });
  }

  private publicAssessment(assessment: Assessment): Record<string, unknown> {
    return {
      id: assessment.id,
      childId: assessment.childId,
      version: assessment.version,
      depth: assessment.depth,
      respondentMode: assessment.respondentMode,
      status: assessment.status,
      questionCount: assessment.questionCount,
      sequence: assessment.sequence,
      startedAt: assessment.startedAt,
      completedAt: assessment.completedAt ?? null,
    };
  }

  private scoreView(score: SkillScore, skill?: MasterOption): Record<string, unknown> & {
    score: number;
  } {
    return {
      skillId: score.skillId,
      name: skill?.name ?? score.skillId,
      description: String(skill?.description ?? ""),
      colour: String(skill?.colour ?? "#2563EB"),
      weightPercent: score.skillWeightPercent,
      score: score.normalizedScore,
      band: score.scoreBand,
      bandLabel: positiveBandLabel(score.scoreBand),
      message: positiveSkillMessage(skill?.name ?? "This skill", score.scoreBand),
      previousScore: score.previousScore ?? null,
      changeFromPrevious: score.changeFromPrevious ?? null,
    };
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function scoreBandFor(score: number): ScoreBand {
  if (score >= 90) return "EXCEPTIONAL";
  if (score >= 75) return "STRONG";
  if (score >= 60) return "AGE_APPROPRIATE";
  if (score >= 40) return "DEVELOPING";
  return "PRIORITY_GROWTH_AREA";
}

function positiveBandLabel(band: ScoreBand): string {
  return {
    PRIORITY_GROWTH_AREA: "Ready to Grow",
    DEVELOPING: "Building Foundations",
    AGE_APPROPRIATE: "Growing Well",
    STRONG: "Strong",
    EXCEPTIONAL: "Exceptional Strength",
  }[band];
}

function positiveSkillMessage(skillName: string, band: ScoreBand): string {
  return {
    PRIORITY_GROWTH_AREA: `Start with short, achievable ${skillName} missions and celebrate steady effort.`,
    DEVELOPING: `Build ${skillName} through regular practice and supportive feedback.`,
    AGE_APPROPRIATE: `Maintain ${skillName} while gradually adding new challenges.`,
    STRONG: `Extend this ${skillName} strength through new contexts and responsibility.`,
    EXCEPTIONAL: `Nurture advanced ${skillName} without pressure and apply it meaningfully.`,
  }[band];
}
