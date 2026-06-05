import { RegistryDefinition, RegistryVersion } from "@simis/registry-core";

export interface CompilerSourceManifest {
  themeVersionUid: string;
  tokenVersionUids: string[];
  motionVersionUids: string[];
  iconVersionUids: string[];
  componentStyleVersionUids: string[];
}

export interface CompilerInput {
  sourceManifest: CompilerSourceManifest;
  compilerVersion: string;
  compilerHash: string;
  dependencyFingerprint: string;
  compiledBy: string;
  compiledAt: string;
  compiledFromBundleHash?: string;
}

export interface CompilerOutput {
  definition: RegistryDefinition;
  version: RegistryVersion;
  artifactPayload: {
    subtype: "compiled-artifact";
    artifactSchemaVersion: number;
    cssVariables: Record<string, string>;
    componentMappings: Record<string, any>;
    provenance: {
      compiledFromBundleHash: string;
      compiledAt: string;
      compiledBy: string;
      compilerVersion: string;
      compilerHash: string;
      dependencyFingerprint: string;
      artifactSignature: string;
      sourceManifest: CompilerSourceManifest;
    };
  };
}
