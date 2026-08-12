import { ageGroupForAge, calculateAge } from "../domain/age-group.js";
import { DomainError, NotFoundError } from "../domain/errors.js";
import { createId } from "../domain/ids.js";
import type { Child, Gender, TimeCommitment } from "../domain/models.js";
import type { PandaWiseStore } from "../repositories/store.js";

export interface CreateChildInput {
  name: string;
  nickname?: string | undefined;
  avatarId?: string | undefined;
  dateOfBirth: string;
  gender: Gender;
  schoolId?: string | undefined;
  gradeId?: string | undefined;
  languageId: string;
  knownInterests: string[];
  parentTimeCommitment: TimeCommitment;
}

export class ChildService {
  constructor(private readonly store: PandaWiseStore) {}

  async list(parentId: string): Promise<Child[]> {
    return this.store.listChildren(parentId);
  }

  async get(parentId: string, childId: string): Promise<Child> {
    const child = await this.store.getChild(parentId, childId);
    if (!child) throw new NotFoundError("Child");
    return child;
  }

  async create(parentId: string, input: CreateChildInput): Promise<Child> {
    const parent = await this.store.getParentById(parentId);
    if (!parent) throw new NotFoundError("Parent");

    const existingChildren = await this.store.listChildren(parentId);
    const planLimit = parent.subscriptionPlanId === "PLN001" ? 1 : parent.subscriptionPlanId === "PLN002" ? 3 : Infinity;
    if (existingChildren.length >= planLimit) {
      throw new DomainError(
        "CHILD_LIMIT_REACHED",
        "Your current plan has reached its child-profile limit",
        403,
      );
    }

    const ageYears = calculateAge(input.dateOfBirth);
    const timestamp = new Date().toISOString();
    const child: Child = {
      id: createId("CHD"),
      parentId,
      name: input.name.trim(),
      dateOfBirth: input.dateOfBirth,
      ageYears,
      ageGroupId: ageGroupForAge(ageYears),
      gender: input.gender,
      languageId: input.languageId,
      knownInterests: input.knownInterests,
      parentTimeCommitment: input.parentTimeCommitment,
      currentPlanId: parent.subscriptionPlanId,
      assessmentStatus: "Not Started",
      journeyStatus: "Not Started",
      assessmentCount: 0,
      journeyCount: 0,
      currentBadgeLevel: "Starter",
      currentStreak: 0,
      recordStatus: "Active",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    if (input.nickname?.trim()) child.nickname = input.nickname.trim();
    if (input.avatarId?.trim()) child.avatarId = input.avatarId.trim();
    if (input.schoolId?.trim()) child.schoolId = input.schoolId.trim();
    if (input.gradeId?.trim()) child.gradeId = input.gradeId.trim();

    await this.store.createChild(child);
    return child;
  }
}
