import { ConflictError, DomainError, NotFoundError } from "../domain/errors.js";
import { toPublicParent, type Parent, type ParentType, type PlanId, type TimeCommitment } from "../domain/models.js";
import type { PandaWiseStore } from "../repositories/store.js";

export interface UpdateProfileInput {
  name: string;
  parentType: ParentType;
  mobileNumber: string;
  preferredLanguageId: string;
  dailyTimeCommitment: TimeCommitment;
}

export interface UpdateNotificationPreferencesInput {
  pushNotification: boolean;
  emailNotification: boolean;
  whatsAppNotification: boolean;
  weeklySummary: boolean;
  missionReminder: boolean;
}

export class AccountService {
  constructor(private readonly store: PandaWiseStore) {}

  async listPlans(parentId: string): Promise<Record<string, unknown>> {
    const parent = await this.parent(parentId);
    const plans = await this.store.listPlanEntitlements();
    return {
      currentPlanId: parent.subscriptionPlanId,
      billingMode: "MANUAL_V1",
      paymentGatewayEnabled: false,
      plans,
    };
  }

  async changePlan(parentId: string, planId: PlanId): Promise<Record<string, unknown>> {
    const parent = await this.parent(parentId);
    const [plan, children] = await Promise.all([
      this.store.getPlanEntitlements(planId),
      this.store.listChildren(parentId),
    ]);
    if (plan.maxChildren !== null && children.length > plan.maxChildren) {
      throw new ConflictError(
        `This plan supports ${plan.maxChildren} child profile${plan.maxChildren === 1 ? "" : "s"}. Keep the current plan or reduce active profiles first.`,
      );
    }

    const currentYear = new Date().getUTCFullYear();
    const assessments = (
      await Promise.all(children.map((child) => this.store.listAssessments(child.id)))
    ).flat();
    const attemptsThisYear = assessments.filter(
      (assessment) => new Date(assessment.startedAt).getUTCFullYear() === currentYear,
    ).length;
    if (attemptsThisYear > plan.includedAssessmentsPerYear) {
      throw new ConflictError(
        `This family has already used ${attemptsThisYear} Development Checks this year; the selected plan includes ${plan.includedAssessmentsPerYear}.`,
      );
    }

    const timestamp = new Date().toISOString();
    const updated: Parent = {
      ...parent,
      subscriptionPlanId: planId,
      subscriptionStartDate: timestamp.slice(0, 10),
      weeklySummary: plan.weeklySummaryEnabled ? parent.weeklySummary : false,
      updatedAt: timestamp,
    };
    await this.store.updateParent(updated);
    await this.store.updateChildPlanSnapshots(
      children.map((child) => child.id),
      planId,
      timestamp,
    );
    return { parent: toPublicParent(updated), plan };
  }

  async updateProfile(
    parentId: string,
    input: UpdateProfileInput,
  ): Promise<Record<string, unknown>> {
    const parent = await this.parent(parentId);
    const bootstrap = await this.store.getBootstrapData();
    if (!bootstrap.languages.some((language) => language.id === input.preferredLanguageId)) {
      throw new DomainError(
        "LANGUAGE_NOT_SUPPORTED",
        "Choose one of the supported PandaWise languages",
      );
    }
    const updated: Parent = {
      ...parent,
      name: input.name.trim(),
      parentType: input.parentType,
      mobileNumber: input.mobileNumber.trim(),
      preferredLanguageId: input.preferredLanguageId,
      dailyTimeCommitment: input.dailyTimeCommitment,
      updatedAt: new Date().toISOString(),
    };
    await this.store.updateParent(updated);
    return { parent: toPublicParent(updated) };
  }

  async updateNotifications(
    parentId: string,
    input: UpdateNotificationPreferencesInput,
  ): Promise<Record<string, unknown>> {
    const parent = await this.parent(parentId);
    if (input.whatsAppNotification) {
      throw new DomainError(
        "WHATSAPP_NOT_AVAILABLE",
        "WhatsApp notifications are reserved for a future release",
        409,
      );
    }
    const plan = await this.store.getPlanEntitlements(parent.subscriptionPlanId);
    if (input.weeklySummary && !plan.weeklySummaryEnabled) {
      throw new DomainError(
        "WEEKLY_SUMMARY_REQUIRES_GROWTH",
        "Weekly summaries are available on Growth and Mastery plans",
        403,
      );
    }
    const updated: Parent = {
      ...parent,
      ...input,
      whatsAppNotification: false,
      updatedAt: new Date().toISOString(),
    };
    await this.store.updateParent(updated);
    return { parent: toPublicParent(updated) };
  }

  async updateMarketingConsent(
    parentId: string,
    marketingConsent: boolean,
  ): Promise<Record<string, unknown>> {
    const parent = await this.parent(parentId);
    const updated: Parent = {
      ...parent,
      marketingConsent,
      updatedAt: new Date().toISOString(),
    };
    await this.store.updateParent(updated);
    return {
      parent: toPublicParent(updated),
      termsAcceptedAt: parent.termsAcceptedAt,
    };
  }

  async applyReferral(parentId: string, referralCode: string): Promise<Record<string, unknown>> {
    const parent = await this.parent(parentId);
    if (parent.referredBy) {
      throw new ConflictError("A referral code has already been applied to this account");
    }
    const normalized = referralCode.trim().toUpperCase();
    const referrer = await this.store.getParentByReferralCode(normalized);
    if (!referrer || referrer.id === parent.id) {
      throw new DomainError("REFERRAL_CODE_INVALID", "Enter a valid referral code");
    }
    const updated: Parent = {
      ...parent,
      referredBy: referrer.referralCode,
      referralStatus: "Pending",
      updatedAt: new Date().toISOString(),
    };
    await this.store.updateParent(updated);
    return { parent: toPublicParent(updated) };
  }

  async notifications(parentId: string): Promise<Record<string, unknown>> {
    const parent = await this.parent(parentId);
    const children = await this.store.listChildren(parentId);
    const items: Record<string, unknown>[] = [];
    if (children.length === 0) {
      items.push({
        id: "WELCOME_ADD_CHILD",
        type: "GET_STARTED",
        title: "Begin your PandaWise journey",
        message: "Add a child profile when your family is ready.",
        action: "ADD_CHILD",
        createdAt: parent.createdAt,
      });
    }
    for (const child of children) {
      const displayName = child.nickname || child.name;
      if (child.assessmentStatus === "Not Started") {
        items.push({
          id: `CHECK_${child.id}`,
          type: "DEVELOPMENT_CHECK",
          title: `${displayName}'s growth baseline is ready to begin`,
          message: "Start with Passion Discovery, then complete the Development Check.",
          childId: child.id,
          action: "START_DISCOVERY",
          createdAt: child.updatedAt,
        });
      } else if (child.assessmentStatus === "Reassessment Due") {
        items.push({
          id: `REASSESS_${child.id}`,
          type: "REASSESSMENT",
          title: `${displayName} is ready for a new growth snapshot`,
          message: "The journey gate is complete. Reassess when it feels comfortable.",
          childId: child.id,
          action: "START_REASSESSMENT",
          createdAt: child.updatedAt,
        });
      } else if (child.journeyStatus === "Active") {
        items.push({
          id: `MISSION_${child.id}`,
          type: "MISSION_REMINDER",
          title: `${displayName}'s next mission is available`,
          message: "A short, consistent activity is enough for today.",
          childId: child.id,
          action: "OPEN_JOURNEY",
          createdAt: child.updatedAt,
        });
      }
    }
    return {
      items: items.sort((left, right) =>
        String(right.createdAt).localeCompare(String(left.createdAt)),
      ),
      preferences: {
        pushNotification: parent.pushNotification,
        emailNotification: parent.emailNotification,
        whatsAppNotification: false,
        weeklySummary: parent.weeklySummary,
        missionReminder: parent.missionReminder,
      },
    };
  }

  private async parent(parentId: string): Promise<Parent> {
    const parent = await this.store.getParentById(parentId);
    if (!parent) throw new NotFoundError("Parent");
    return parent;
  }
}
