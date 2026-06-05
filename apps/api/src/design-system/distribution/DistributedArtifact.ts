import { CompiledThemeArtifact } from "../../compiler/CompilerContracts";

type DeepReadonly<T> = T extends (infer R)[]
  ? ReadonlyArray<DeepReadonly<R>>
  : T extends Function
  ? T
  : T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T;

export interface DistributedArtifact {
  readonly artifactId: string;
  readonly artifactSchemaVersion: number;
  readonly artifactSignature: string;
  readonly contentHash: string;
  readonly compiledAt: string;
  readonly payload: DeepReadonly<CompiledThemeArtifact>;
}
