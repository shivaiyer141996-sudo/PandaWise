import bcrypt from "bcryptjs";
import { ConflictError, UnauthorizedError } from "../domain/errors.js";
import { createId } from "../domain/ids.js";
import type { Parent, ParentType, TimeCommitment } from "../domain/models.js";
import type { PandaWiseStore } from "../repositories/store.js";

export interface RegisterParentInput {
  name: string;
  parentType: ParentType;
  mobileNumber: string;
  email: string;
  password: string;
  preferredLanguageId: string;
  dailyTimeCommitment: TimeCommitment;
  marketingConsent: boolean;
}

export class AuthService {
  constructor(private readonly store: PandaWiseStore) {}

  async register(input: RegisterParentInput): Promise<Parent> {
    const email = input.email.trim().toLowerCase();
    if (await this.store.getParentByEmail(email)) {
      throw new ConflictError("An account already exists for this email address");
    }

    const timestamp = new Date().toISOString();
    const parentId = createId("PAR");
    const parent: Parent = {
      id: parentId,
      name: input.name.trim(),
      parentType: input.parentType,
      mobileNumber: input.mobileNumber.trim(),
      email,
      passwordHash: await bcrypt.hash(input.password, 12),
      subscriptionPlanId: "PLN001",
      preferredLanguageId: input.preferredLanguageId,
      dailyTimeCommitment: input.dailyTimeCommitment,
      pushNotification: false,
      emailNotification: false,
      whatsAppNotification: false,
      weeklySummary: false,
      missionReminder: false,
      marketingConsent: input.marketingConsent,
      termsAcceptedAt: timestamp,
      referralCode: `PW${parentId.slice(-8)}`,
      referralStatus: "Not Applicable",
      accountStatus: "Active",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await this.store.createParent(parent);
    return parent;
  }

  async login(email: string, password: string): Promise<Parent> {
    const parent = await this.store.getParentByEmail(email.trim().toLowerCase());
    if (!parent || !(await bcrypt.compare(password, parent.passwordHash))) {
      throw new UnauthorizedError();
    }
    if (parent.accountStatus !== "Active") {
      throw new UnauthorizedError("This PandaWise account is not active");
    }

    const timestamp = new Date().toISOString();
    await this.store.updateParentLastLogin(parent.id, timestamp);
    return { ...parent, lastLoginAt: timestamp, updatedAt: timestamp };
  }
}
