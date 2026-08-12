import { DomainError, NotFoundError } from "../domain/errors.js";
import { createId } from "../domain/ids.js";
import type {
  Assessment,
  Child,
  Journey,
  JourneySchedule,
  Mission,
  MissionCompletion,
  MissionCompletionStatus,
  MissionDifficulty,
  MissionDifficultyFeedback,
  PlanId,
  RecommendationRule,
  SkillScore,
  TimeCommitment,
} from "../domain/models.js";
import type { PandaWiseStore } from "../repositories/store.js";

const journeyVersion = "1.0";

export interface CreateJourneyInput {
  focusSkillIds: string[];
}

export interface CompleteMissionInput {
  status: MissionCompletionStatus;
  enjoymentScore: number;
  difficultyFeedback: MissionDifficultyFeedback;
  parentNotes?: string | undefined;
}

interface MissionChoice {
  mission: Mission;
  prioritySource: string;
}

export class JourneyService {
  constructor(
    private readonly store: PandaWiseStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async create(
    parentId: string,
    childId: string,
    input: CreateJourneyInput,
  ): Promise<Record<string, unknown>> {
    const child = await this.ownedChild(parentId, childId);
    const parent = await this.store.getParentById(parentId);
    if (!parent) throw new NotFoundError("Parent");

    const existing = (await this.store.listJourneys(childId)).find(
      (journey) => journey.status === "Active" || journey.status === "Paused",
    );
    if (existing) return this.view(parentId, existing.id);

    const assessments = (await this.store.listAssessments(childId))
      .filter((assessment) => assessment.status === "Completed")
      .sort((left, right) => right.sequence - left.sequence);
    const assessment = assessments[0];
    if (!assessment) {
      throw new DomainError(
        "DEVELOPMENT_CHECK_REQUIRED",
        "Complete the Development Check before building a journey",
        409,
      );
    }
    if (assessment.journeyId) {
      const priorJourney = await this.store.getJourney(assessment.journeyId);
      if (priorJourney) return this.view(parentId, priorJourney.id);
    }

    const scores = await this.store.listSkillScores(assessment.id);
    if (scores.length === 0) {
      throw new DomainError(
        "GROWSCORE_REQUIRED",
        "GrowScore results are required before building a journey",
        409,
      );
    }
    const focusSkillIds = [...new Set(input.focusSkillIds)];
    const validSkillIds = new Set(scores.map((score) => score.skillId));
    if (
      focusSkillIds.length < 1 ||
      focusSkillIds.length > 3 ||
      focusSkillIds.some((skillId) => !validSkillIds.has(skillId))
    ) {
      throw new DomainError(
        "FOCUS_AREAS_INVALID",
        "Choose between one and three GrowScore focus areas",
      );
    }

    const [missions, rules, configuration, entitlements, passions, bootstrap, priorCompletions] =
      await Promise.all([
        this.store.listMissions(child.ageGroupId),
        this.store.listRecommendationRules(child.ageGroupId),
        this.store.getJourneyConfiguration(),
        this.store.getPlanEntitlements(parent.subscriptionPlanId),
        this.store.listChildPassions(child.id),
        this.store.getBootstrapData(),
        this.store.listMissionCompletionsByChild(child.id),
      ]);
    const eligibleMissions = this.limitMissionsPerSkill(
      missions.filter((mission) => this.planAllows(parent.subscriptionPlanId, mission)),
      entitlements.missionsPerSkill,
    );
    if (eligibleMissions.length === 0) {
      throw new DomainError(
        "MISSION_CONTENT_UNAVAILABLE",
        "Mission content is not available for this age group and plan",
        503,
      );
    }

    const passionById = new Map(bootstrap.passions.map((passion) => [passion.id, passion]));
    const passionTerms = passions.flatMap((passion) => {
      const option = passionById.get(passion.passionId);
      return option
        ? [String(option.name).toLowerCase(), String(option.category ?? "").toLowerCase()]
            .filter(Boolean)
        : [];
    });
    const scoreBySkill = new Map(scores.map((score) => [score.skillId, score]));
    const ruleBySkill = new Map(
      scores.map((score) => [
        score.skillId,
        rules.find(
          (rule) =>
            rule.skillId === score.skillId &&
            score.normalizedScore >= rule.minScore &&
            score.normalizedScore <= rule.maxScore,
        ),
      ]),
    );
    const orderedScores = [...scores].sort((left, right) => {
      const leftFocused = focusSkillIds.includes(left.skillId) ? 0 : 1;
      const rightFocused = focusSkillIds.includes(right.skillId) ? 0 : 1;
      return leftFocused - rightFocused || left.normalizedScore - right.normalizedScore;
    });
    const skillRotation = [
      ...orderedScores.map((score) => score.skillId),
      ...focusSkillIds,
      ...focusSkillIds,
    ];
    const recentMissionIds = this.recentMissionIds(priorCompletions, rules);
    const usedMissionIds = new Set<string>();
    const timestamp = this.now().toISOString();
    const startDate = timestamp.slice(0, 10);
    const journeyId = createId("JRN");
    const schedules: JourneySchedule[] = [];

    const journeyDays = entitlements.journeyLengthDays || configuration.journeyDays;
    for (let day = 1; day <= journeyDays; day += 1) {
      const skillId = skillRotation[(day - 1) % skillRotation.length];
      if (!skillId) {
        throw new DomainError("MISSION_CONTENT_INVALID", "Mission skill coverage is incomplete", 503);
      }
      const week = Math.ceil(day / 7);
      const scheduledDate = addDays(startDate, day - 1);
      const choice = this.chooseMission({
        missions: eligibleMissions,
        skillId,
        score: scoreBySkill.get(skillId),
        rule: ruleBySkill.get(skillId),
        focusSkillIds,
        passionTerms,
        recentMissionIds,
        usedMissionIds,
        timeCommitment: child.parentTimeCommitment,
        scheduledDate,
        week,
      });
      usedMissionIds.add(choice.mission.id);
      schedules.push({
        id: createId("SCH"),
        journeyId,
        childId: child.id,
        missionId: choice.mission.id,
        day,
        week,
        scheduledDate,
        status: day === 1 ? "AVAILABLE" : "PLANNED",
        unlocked: day === 1,
        prioritySource: choice.prioritySource,
        skillId,
        generatedAt: timestamp,
        createdBy: parentId,
        updatedAt: timestamp,
      });
    }

    const journey: Journey = {
      id: journeyId,
      childId: child.id,
      sourceAssessmentId: assessment.id,
      planId: parent.subscriptionPlanId,
      startDate,
      plannedEndDate: addDays(startDate, journeyDays - 1),
      status: "Active",
      currentDay: 1,
      missionsPlanned: journeyDays,
      missionsCompleted: 0,
      completionPercent: 0,
      reassessmentUnlocked: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      version: journeyVersion,
    };
    const linkedAssessment: Assessment = {
      ...assessment,
      journeyId,
      updatedAt: timestamp,
    };
    const activeChild: Child = {
      ...child,
      journeyStatus: "Active",
      updatedAt: timestamp,
    };
    await this.store.createJourney(journey, schedules, linkedAssessment, activeChild);
    return this.view(parentId, journey.id);
  }

  async current(parentId: string, childId: string): Promise<Record<string, unknown>> {
    await this.ownedChild(parentId, childId);
    const journeys = (await this.store.listJourneys(childId)).sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
    const current = journeys.find(
      (journey) => journey.status === "Active" || journey.status === "Paused",
    ) ?? journeys[0];
    if (!current) throw new NotFoundError("Journey");
    return this.view(parentId, current.id);
  }

  async view(parentId: string, journeyId: string): Promise<Record<string, unknown>> {
    const { journey, child } = await this.ownedJourney(parentId, journeyId);
    const [schedules, missions, completions] = await Promise.all([
      this.store.listJourneySchedules(journey.id),
      this.store.listMissions(child.ageGroupId),
      this.store.listMissionCompletionsByChild(child.id),
    ]);
    const missionById = new Map(missions.map((mission) => [mission.id, mission]));
    const completionBySchedule = new Map(
      completions
        .filter((completion) => completion.journeyId === journey.id)
        .map((completion) => [completion.scheduleId, completion]),
    );
    const visible = this.availableSchedule(schedules, completionBySchedule);
    const mission = visible ? missionById.get(visible.missionId) : undefined;
    return {
      journey: this.publicJourney(journey),
      child: { id: child.id, name: child.name, nickname: child.nickname },
      progress: {
        currentDay: journey.currentDay,
        planned: journey.missionsPlanned,
        completed: journey.missionsCompleted,
        completionPercent: journey.completionPercent,
        streak: child.currentStreak,
      },
      schedules: schedules.map((schedule) => ({
        id: schedule.id,
        day: schedule.day,
        week: schedule.week,
        scheduledDate: schedule.scheduledDate,
        status: schedule.id === visible?.id ? "AVAILABLE" : schedule.status,
        unlocked: schedule.id === visible?.id,
        feedbackSubmitted: completionBySchedule.has(schedule.id),
      })),
      today:
        visible && mission
          ? {
              scheduleId: visible.id,
              day: visible.day,
              week: visible.week,
              scheduledDate: visible.scheduledDate,
              reason: this.reasonView(visible.prioritySource),
              mission: this.publicMission(mission),
            }
          : null,
      reassessment: {
        unlocked: journey.reassessmentUnlocked,
        requirement: "Complete the journey with at least 70% mission completion",
      },
    };
  }

  async completeMission(
    parentId: string,
    journeyId: string,
    scheduleId: string,
    input: CompleteMissionInput,
  ): Promise<Record<string, unknown>> {
    const { journey, child } = await this.ownedJourney(parentId, journeyId);
    if (journey.status !== "Active") {
      throw new DomainError("JOURNEY_NOT_ACTIVE", "This journey is not active", 409);
    }
    const [schedules, missions, allCompletions, configuration] = await Promise.all([
      this.store.listJourneySchedules(journey.id),
      this.store.listMissions(child.ageGroupId),
      this.store.listMissionCompletionsByChild(child.id),
      this.store.getJourneyConfiguration(),
    ]);
    const schedule = schedules.find((candidate) => candidate.id === scheduleId);
    if (!schedule || schedule.journeyId !== journey.id) throw new NotFoundError("Mission schedule");
    const existing = allCompletions.find(
      (completion) => completion.journeyId === journey.id && completion.scheduleId === scheduleId,
    );
    if (existing) return this.view(parentId, journey.id);
    const completionBySchedule = new Map(
      allCompletions
        .filter((completion) => completion.journeyId === journey.id)
        .map((completion) => [completion.scheduleId, completion]),
    );
    const available = this.availableSchedule(schedules, completionBySchedule);
    if (!available || available.id !== schedule.id) {
      throw new DomainError(
        "MISSION_LOCKED",
        "Complete the currently available mission before continuing",
        409,
      );
    }
    const mission = missions.find((candidate) => candidate.id === schedule.missionId);
    if (!mission) throw new NotFoundError("Mission");

    const timestamp = this.now().toISOString();
    const countsAsCompleted = input.status === "YES" || input.status === "PARTIALLY";
    const streak = countsAsCompleted ? child.currentStreak + 1 : 0;
    const pointsAwarded =
      input.status === "YES" ? mission.points : input.status === "PARTIALLY" ? Math.round(mission.points / 2) : 0;
    const completion: MissionCompletion = {
      id: createId("CMP"),
      journeyId: journey.id,
      scheduleId: schedule.id,
      childId: child.id,
      missionId: mission.id,
      status: input.status,
      enjoymentScore: input.enjoymentScore,
      difficultyFeedback: input.difficultyFeedback,
      completedAt: timestamp,
      pointsAwarded,
      streakDay: streak,
      submissionSource: "PARENT",
      recordStatus: "Active",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    if (input.parentNotes?.trim()) completion.parentNotes = input.parentNotes.trim();

    const updatedSchedules = schedules.map((candidate) => {
      if (candidate.id === schedule.id) {
        return {
          ...candidate,
          status: countsAsCompleted ? ("COMPLETED" as const) : ("SKIPPED" as const),
          unlocked: false,
          completionId: completion.id,
          updatedAt: timestamp,
        };
      }
      return candidate;
    });
    const journeyCompletions = allCompletions.filter(
      (candidate) => candidate.journeyId === journey.id,
    );
    const answeredCount = journeyCompletions.length + 1;
    const completedCount =
      journeyCompletions.filter(
        (candidate) => candidate.status === "YES" || candidate.status === "PARTIALLY",
      ).length + (countsAsCompleted ? 1 : 0);
    const completionPercent = round((completedCount / journey.missionsPlanned) * 100);
    const journeyComplete = answeredCount >= journey.missionsPlanned;
    const reassessmentUnlocked =
      journeyComplete && completionPercent >= configuration.reassessmentMinCompletionPercent;
    const updatedJourney: Journey = {
      ...journey,
      status: journeyComplete ? "Completed" : "Active",
      currentDay: Math.min(schedule.day + 1, journey.missionsPlanned),
      missionsCompleted: completedCount,
      completionPercent,
      reassessmentUnlocked,
      updatedAt: timestamp,
    };
    if (journeyComplete) updatedJourney.actualEndDate = timestamp.slice(0, 10);
    const updatedChild: Child = {
      ...child,
      assessmentStatus: reassessmentUnlocked ? "Reassessment Due" : child.assessmentStatus,
      journeyStatus: journeyComplete ? "Completed" : "Active",
      journeyCount: journeyComplete ? child.journeyCount + 1 : child.journeyCount,
      currentStreak: streak,
      updatedAt: timestamp,
    };
    await this.store.saveJourneyProgress(
      completion,
      updatedJourney,
      updatedSchedules,
      updatedChild,
    );
    return this.view(parentId, journey.id);
  }

  async weeklySummary(
    parentId: string,
    journeyId: string,
    week: number,
  ): Promise<Record<string, unknown>> {
    const { journey, child } = await this.ownedJourney(parentId, journeyId);
    const parent = await this.store.getParentById(parentId);
    if (!parent) throw new NotFoundError("Parent");
    const [schedules, completions, bootstrap, entitlements] = await Promise.all([
      this.store.listJourneySchedules(journey.id),
      this.store.listMissionCompletionsByChild(child.id),
      this.store.getBootstrapData(),
      this.store.getPlanEntitlements(parent.subscriptionPlanId),
    ]);
    if (!entitlements.weeklySummaryEnabled) {
      throw new DomainError(
        "WEEKLY_SUMMARY_REQUIRES_GROWTH",
        "Weekly reflections are available on Growth and Mastery plans",
        403,
      );
    }
    const weekSchedules = schedules.filter((schedule) => schedule.week === week);
    if (weekSchedules.length === 0) throw new NotFoundError("Journey week");
    const ids = new Set(weekSchedules.map((schedule) => schedule.id));
    const weekCompletions = completions.filter(
      (completion) => completion.journeyId === journey.id && ids.has(completion.scheduleId),
    );
    if (weekCompletions.length < weekSchedules.length) {
      throw new DomainError(
        "WEEKLY_SUMMARY_LOCKED",
        "The weekly summary appears after all seven daily check-ins",
        409,
      );
    }
    const scheduleById = new Map(weekSchedules.map((schedule) => [schedule.id, schedule]));
    const skillCounts = new Map<string, number>();
    for (const completion of weekCompletions) {
      const skillId = scheduleById.get(completion.scheduleId)?.skillId;
      if (skillId) skillCounts.set(skillId, (skillCounts.get(skillId) ?? 0) + 1);
    }
    const leadingSkillId = [...skillCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0];
    const skill = bootstrap.skills.find((candidate) => candidate.id === leadingSkillId);
    const successful = weekCompletions.filter(
      (completion) => completion.status === "YES" || completion.status === "PARTIALLY",
    );
    return {
      journeyId: journey.id,
      week,
      days: weekSchedules.length,
      completed: successful.length,
      completionPercent: round((successful.length / weekSchedules.length) * 100),
      totalPoints: weekCompletions.reduce((total, completion) => total + completion.pointsAwarded, 0),
      averageEnjoyment: round(
        weekCompletions.reduce((total, completion) => total + completion.enjoymentScore, 0) /
          weekCompletions.length,
      ),
      mostPracticedSkill: leadingSkillId
        ? { skillId: leadingSkillId, name: skill?.name ?? leadingSkillId }
        : null,
      streak: child.currentStreak,
      message:
        successful.length >= Math.ceil(weekSchedules.length * 0.7)
          ? "A steady week of growth—celebrate the effort and keep the routine gentle."
          : "Every check-in helps. Choose a comfortable pace and begin again tomorrow.",
    };
  }

  private chooseMission(input: {
    missions: Mission[];
    skillId: string;
    score?: SkillScore | undefined;
    rule?: RecommendationRule | undefined;
    focusSkillIds: string[];
    passionTerms: string[];
    recentMissionIds: Set<string>;
    usedMissionIds: Set<string>;
    timeCommitment: TimeCommitment;
    scheduledDate: string;
    week: number;
  }): MissionChoice {
    const maxMinutes = this.maxMinutes(input.timeCommitment, input.scheduledDate);
    let candidates = input.missions.filter(
      (mission) => mission.skillId === input.skillId && mission.durationMinutes <= maxMinutes,
    );
    if (candidates.length === 0) {
      candidates = input.missions.filter((mission) => mission.skillId === input.skillId);
    }
    if (candidates.length === 0) {
      throw new DomainError(
        "MISSION_CONTENT_INVALID",
        `Mission content is missing for skill ${input.skillId}`,
        503,
      );
    }
    const desiredDifficulty = this.desiredDifficulty(input.rule, input.week);
    const scored = candidates.map((mission) => ({
      mission,
      passionFit: this.passionFit(mission, input.passionTerms),
      score:
        (input.recentMissionIds.has(mission.id) ? 0 : 100) +
        (input.usedMissionIds.has(mission.id) ? 0 : 30) +
        (mission.difficulty === desiredDifficulty ? 25 : 0) +
        (this.passionFit(mission, input.passionTerms) ? 10 : 0) -
        Math.abs(maxMinutes - mission.durationMinutes),
    }));
    scored.sort(
      (left, right) => right.score - left.score || left.mission.displayOrder - right.mission.displayOrder,
    );
    const selected = scored[0];
    if (!selected) {
      throw new DomainError("MISSION_CONTENT_INVALID", "No eligible mission could be selected", 503);
    }
    const reasons = [
      input.focusSkillIds.includes(input.skillId) ? "PARENT_FOCUS" : "GROWSCORE_PRIORITY",
      `SCORE_${input.score?.scoreBand ?? "UNKNOWN"}`,
      selected.passionFit ? "PASSION_FIT" : "AGE_FIT",
      `TIME_${maxMinutes}_MIN`,
      `DIFFICULTY_${selected.mission.difficulty}`,
    ];
    if (input.recentMissionIds.size > 0 && !input.recentMissionIds.has(selected.mission.id)) {
      reasons.push("RECENT_MISSIONS_EXCLUDED");
    }
    return { mission: selected.mission, prioritySource: reasons.join("|") };
  }

  private desiredDifficulty(
    rule: RecommendationRule | undefined,
    week: number,
  ): MissionDifficulty {
    const value = rule?.recommendedDifficulty ?? "EASY";
    if (value === "EASY_TO_MEDIUM") return week === 1 ? "EASY" : "MEDIUM";
    if (value === "MEDIUM_TO_HARD") return week === 1 ? "MEDIUM" : "HARD";
    return value;
  }

  private recentMissionIds(
    completions: MissionCompletion[],
    rules: RecommendationRule[],
  ): Set<string> {
    const exclusionDays = Math.max(0, ...rules.map((rule) => rule.excludeCompletedWithinDays));
    const cutoff = this.now().getTime() - exclusionDays * 24 * 60 * 60 * 1000;
    return new Set(
      completions
        .filter((completion) => Date.parse(completion.completedAt) >= cutoff)
        .map((completion) => completion.missionId),
    );
  }

  private maxMinutes(timeCommitment: TimeCommitment, scheduledDate: string): number {
    if (timeCommitment !== "WEEKENDS_ONLY") return Number(timeCommitment.split("_")[0]);
    const day = new Date(`${scheduledDate}T00:00:00.000Z`).getUTCDay();
    return day === 0 || day === 6 ? 30 : 10;
  }

  private passionFit(mission: Mission, terms: string[]): boolean {
    const haystack = `${mission.name} ${mission.description} ${mission.category}`.toLowerCase();
    return terms.some((term) => term.length > 2 && haystack.includes(term));
  }

  private availableSchedule(
    schedules: JourneySchedule[],
    completionBySchedule: Map<string, MissionCompletion>,
  ): JourneySchedule | undefined {
    const today = this.now().toISOString().slice(0, 10);
    return schedules
      .filter(
        (schedule) =>
          !completionBySchedule.has(schedule.id) && schedule.scheduledDate <= today,
      )
      .sort((left, right) => left.day - right.day)[0];
  }

  private planAllows(planId: PlanId, mission: Mission): boolean {
    if (mission.planEligibility === "ALL") return true;
    if (mission.planEligibility === "GROWTH_AND_MASTERY") return planId !== "PLN001";
    return planId === "PLN003";
  }

  private limitMissionsPerSkill(missions: Mission[], limit: number): Mission[] {
    const counts = new Map<string, number>();
    return [...missions]
      .sort((left, right) => left.displayOrder - right.displayOrder)
      .filter((mission) => {
        const count = counts.get(mission.skillId) ?? 0;
        if (count >= limit) return false;
        counts.set(mission.skillId, count + 1);
        return true;
      });
  }

  private reasonView(prioritySource: string): string[] {
    return prioritySource.split("|").map((value) =>
      ({
        PARENT_FOCUS: "Chosen parent focus area",
        GROWSCORE_PRIORITY: "Selected from the GrowScore profile",
        PASSION_FIT: "Connected to a selected passion",
        AGE_FIT: "Matched to the child’s age group",
        RECENT_MISSIONS_EXCLUDED: "Avoids recently completed missions",
      })[value] ?? value.replaceAll("_", " ").toLowerCase(),
    );
  }

  private publicMission(mission: Mission): Record<string, unknown> {
    return {
      id: mission.id,
      skillId: mission.skillId,
      name: mission.name,
      description: mission.description,
      difficulty: mission.difficulty,
      durationMinutes: mission.durationMinutes,
      materialsNeeded: mission.materialsNeeded,
      parentGuidance: mission.parentGuidance,
      childInstructions: mission.childInstructions,
      learningOutcome: mission.learningOutcome,
      points: mission.points,
      indoorOutdoor: mission.indoorOutdoor,
      category: mission.category,
    };
  }

  private publicJourney(journey: Journey): Record<string, unknown> {
    return {
      id: journey.id,
      childId: journey.childId,
      sourceAssessmentId: journey.sourceAssessmentId,
      planId: journey.planId,
      startDate: journey.startDate,
      plannedEndDate: journey.plannedEndDate,
      actualEndDate: journey.actualEndDate ?? null,
      status: journey.status,
      currentDay: journey.currentDay,
      missionsPlanned: journey.missionsPlanned,
      missionsCompleted: journey.missionsCompleted,
      completionPercent: journey.completionPercent,
      reassessmentUnlocked: journey.reassessmentUnlocked,
      version: journey.version,
    };
  }

  private async ownedChild(parentId: string, childId: string): Promise<Child> {
    const child = await this.store.getChild(parentId, childId);
    if (!child) throw new NotFoundError("Child");
    return child;
  }

  private async ownedJourney(
    parentId: string,
    journeyId: string,
  ): Promise<{ journey: Journey; child: Child }> {
    const journey = await this.store.getJourney(journeyId);
    if (!journey) throw new NotFoundError("Journey");
    const child = await this.ownedChild(parentId, journey.childId);
    return { journey, child };
  }
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
