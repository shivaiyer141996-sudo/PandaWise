import { NotFoundError } from "../domain/errors.js";
import type {
  Assessment,
  Journey,
  MissionCompletion,
  PlanEntitlements,
  SkillScore,
} from "../domain/models.js";
import type { PandaWiseStore } from "../repositories/store.js";

export class ProgressService {
  constructor(private readonly store: PandaWiseStore) {}

  async view(parentId: string, childId: string): Promise<Record<string, unknown>> {
    const child = await this.store.getChild(parentId, childId);
    if (!child) throw new NotFoundError("Child");
    const parent = await this.store.getParentById(parentId);
    if (!parent) throw new NotFoundError("Parent");

    const [entitlements, assessments, journeys, completions, bootstrap] = await Promise.all([
      this.store.getPlanEntitlements(parent.subscriptionPlanId),
      this.store.listAssessments(childId),
      this.store.listJourneys(childId),
      this.store.listMissionCompletionsByChild(childId),
      this.store.getBootstrapData(),
    ]);
    const completedAssessments = assessments
      .filter((assessment) => assessment.status === "Completed")
      .sort((left, right) => left.sequence - right.sequence);
    const latestAssessment = completedAssessments.at(-1);
    const comparisonAssessment = this.comparisonAssessment(completedAssessments, entitlements);
    const latestJourney = [...journeys].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    )[0];
    const journeyCompletions = latestJourney
      ? completions.filter((completion) => completion.journeyId === latestJourney.id)
      : [];
    const skillById = new Map(bootstrap.skills.map((skill) => [skill.id, skill]));
    const scoreSets = await Promise.all(
      completedAssessments.map(async (assessment) => ({
        assessment,
        scores: await this.store.listSkillScores(assessment.id),
      })),
    );

    const historyAssessments =
      entitlements.assessmentHistoryAccess === "Latest Only"
        ? completedAssessments.slice(-1)
        : completedAssessments;
    const journeyByAssessment = new Map(
      journeys.map((journey) => [journey.sourceAssessmentId, journey]),
    );
    const latestScore = latestAssessment?.overallGrowScore ?? null;
    const previousScore = comparisonAssessment?.overallGrowScore ?? null;
    const scoreChange =
      latestScore !== null && previousScore !== null
        ? round(latestScore - previousScore)
        : null;
    const activeJourney = journeys.find(
      (journey) => journey.status === "Active" || journey.status === "Paused",
    );
    const latestAssessmentJourney = latestAssessment
      ? journeys.find((journey) => journey.sourceAssessmentId === latestAssessment.id)
      : undefined;
    const canReassess = latestAssessmentJourney?.reassessmentUnlocked ?? false;
    const canStartJourney = Boolean(latestAssessment && !latestAssessment.journeyId && !activeJourney);

    return {
      child: {
        id: child.id,
        name: child.name,
        nickname: child.nickname ?? null,
      },
      entitlements: this.publicEntitlements(entitlements),
      assessmentSnapshot: {
        latestAssessmentId: latestAssessment?.id ?? null,
        latestGrowScore: latestScore,
        previousGrowScore: previousScore,
        changeFromPrevious: scoreChange,
        completedAt: latestAssessment?.completedAt ?? null,
        scoreBand: latestAssessment?.scoreBand ?? null,
        comparisonAvailable: comparisonAssessment !== undefined,
        message: this.assessmentMessage(latestScore, scoreChange),
      },
      activitySnapshot: this.activitySnapshot(latestJourney, journeyCompletions, child.currentStreak),
      skillTrends: entitlements.growthTrackerEnabled
        ? this.skillTrends(scoreSets, entitlements, skillById)
        : [],
      assessmentHistory: historyAssessments
        .slice()
        .reverse()
        .map((assessment) =>
          this.historyItem(
            assessment,
            journeyByAssessment.get(assessment.id),
            completedAssessments.find(
              (candidate) => candidate.sequence === assessment.sequence - 1,
            ),
            entitlements,
          ),
        ),
      actions: {
        canReassess,
        canStartJourney,
        nextAction: this.nextAction(latestAssessment, activeJourney, canReassess),
      },
    };
  }

  private comparisonAssessment(
    assessments: Assessment[],
    entitlements: PlanEntitlements,
  ): Assessment | undefined {
    if (entitlements.assessmentComparison === "None" || assessments.length < 2) {
      return undefined;
    }
    return assessments.at(-2);
  }

  private publicEntitlements(entitlements: PlanEntitlements): Record<string, unknown> {
    return {
      planId: entitlements.planId,
      planName: entitlements.planName,
      growthTrackerEnabled: entitlements.growthTrackerEnabled,
      assessmentHistoryAccess: entitlements.assessmentHistoryAccess,
      assessmentComparison: entitlements.assessmentComparison,
      advancedAnalyticsEnabled: entitlements.advancedAnalyticsEnabled,
    };
  }

  private activitySnapshot(
    journey: Journey | undefined,
    completions: MissionCompletion[],
    streak: number,
  ): Record<string, unknown> {
    if (!journey) {
      return {
        journeyId: null,
        status: "Not Started",
        missionsPlanned: 0,
        missionsCompleted: 0,
        completionPercent: 0,
        streak,
        points: 0,
      };
    }
    return {
      journeyId: journey.id,
      status: journey.status,
      missionsPlanned: journey.missionsPlanned,
      missionsCompleted: journey.missionsCompleted,
      completionPercent: journey.completionPercent,
      streak,
      points: completions.reduce((total, completion) => total + completion.pointsAwarded, 0),
    };
  }

  private skillTrends(
    scoreSets: Array<{ assessment: Assessment; scores: SkillScore[] }>,
    entitlements: PlanEntitlements,
    skillById: Map<string, { [key: string]: string | number | boolean; id: string; name: string }>,
  ): Record<string, unknown>[] {
    const visibleSets =
      entitlements.assessmentComparison === "Full History" ? scoreSets : scoreSets.slice(-2);
    const skillIds = new Set(visibleSets.flatMap((set) => set.scores.map((score) => score.skillId)));
    return [...skillIds]
      .map((skillId) => {
        const points = visibleSets.flatMap(({ assessment, scores }) => {
          const score = scores.find((candidate) => candidate.skillId === skillId);
          return score
            ? [{
                assessmentId: assessment.id,
                sequence: assessment.sequence,
                completedAt: assessment.completedAt ?? null,
                score: score.normalizedScore,
              }]
            : [];
        });
        const latest = points.at(-1)?.score ?? 0;
        const previous = points.at(-2)?.score;
        return {
          skillId,
          name: skillById.get(skillId)?.name ?? skillId,
          colour: String(skillById.get(skillId)?.colour ?? "#2563EB"),
          latestScore: latest,
          changeFromPrevious: previous === undefined ? null : round(latest - previous),
          points,
        };
      })
      .sort((left, right) => String(left.name).localeCompare(String(right.name)));
  }

  private historyItem(
    assessment: Assessment,
    journey: Journey | undefined,
    previousAssessment: Assessment | undefined,
    entitlements: PlanEntitlements,
  ): Record<string, unknown> {
    const comparisonAllowed = entitlements.assessmentComparison !== "None";
    const change =
      assessment.overallGrowScore !== undefined && previousAssessment?.overallGrowScore !== undefined
        ? round(assessment.overallGrowScore - previousAssessment.overallGrowScore)
        : null;
    return {
      assessmentId: assessment.id,
      sequence: assessment.sequence,
      completedAt: assessment.completedAt ?? null,
      growScore: assessment.overallGrowScore ?? null,
      scoreBand: assessment.scoreBand ?? null,
      changeFromPrevious: comparisonAllowed ? change : null,
      journey: journey
        ? {
            id: journey.id,
            status: journey.status,
            completionPercent: journey.completionPercent,
          }
        : null,
    };
  }

  private assessmentMessage(score: number | null, change: number | null): string {
    if (score === null) return "Complete the Development Check to establish a growth baseline.";
    if (change === null) return "This GrowScore is the current assessment baseline.";
    if (change > 0) return `GrowScore has increased by ${change} points since the previous check.`;
    if (change < 0) return "Growth can vary over time. Use the latest profile to choose gentle next steps.";
    return "GrowScore is steady. Mission activity remains a separate measure of practice.";
  }

  private nextAction(
    assessment: Assessment | undefined,
    activeJourney: Journey | undefined,
    canReassess: boolean,
  ): "DEVELOPMENT_CHECK" | "START_JOURNEY" | "CONTINUE_JOURNEY" | "REASSESS" | "VIEW_PROGRESS" {
    if (!assessment) return "DEVELOPMENT_CHECK";
    if (activeJourney) return "CONTINUE_JOURNEY";
    if (canReassess) return "REASSESS";
    if (!assessment.journeyId) return "START_JOURNEY";
    return "VIEW_PROGRESS";
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
