import type { BootstrapData, Child, Parent } from "../domain/models.js";
import type { PandaWiseStore } from "./store.js";

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
  skills: [],
  passions: [],
  timeCommitments: ["10_MIN", "15_MIN", "20_MIN", "30_MIN", "WEEKENDS_ONLY"],
};

export class MemoryStore implements PandaWiseStore {
  private readonly parents = new Map<string, Parent>();
  private readonly children = new Map<string, Child>();

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
}
