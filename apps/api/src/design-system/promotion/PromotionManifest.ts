export interface PromotionManifest {
  id: string;

  sourceEnvironment: string;
  targetEnvironment: string;

  themeDefinitionUid: string;
  themeVersionId: string;
  
  // SHA256 of the dependency graph structure
  dependencyGraphHash: string;

  bundleHash: string;
  artifactSignature: string;

  promotedAt: Date;
  promotedBy: string;
}

export interface RollbackManifest {
  rollbackFromManifestId: string;
}
