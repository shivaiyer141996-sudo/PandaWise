import type { BootstrapData, Child, Parent } from "../domain/models.js";

export interface PandaWiseStore {
  getParentByEmail(email: string): Promise<Parent | undefined>;
  getParentById(parentId: string): Promise<Parent | undefined>;
  createParent(parent: Parent): Promise<void>;
  updateParentLastLogin(parentId: string, timestamp: string): Promise<void>;
  listChildren(parentId: string): Promise<Child[]>;
  getChild(parentId: string, childId: string): Promise<Child | undefined>;
  createChild(child: Child): Promise<void>;
  getBootstrapData(): Promise<BootstrapData>;
}
