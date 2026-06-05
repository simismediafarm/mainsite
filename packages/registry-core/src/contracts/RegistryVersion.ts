export interface RegistryVersion {
  uid: string;
  definitionUid: string;
  versionNumber: number;
  status: "draft" | "review" | "published" | "archived" | "rollback_pending";
  payloadHash: string;
  definition: Record<string, any>;
  createdAt: Date;
}

