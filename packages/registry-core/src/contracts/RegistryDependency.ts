export interface RegistryDependency {
  uid: string;
  definitionUid: string;
  dependsOnUid: string;
  dependsOnVersionUid?: string; // Used when mode is 'pinned'
  dependencyMode: "floating" | "pinned";
  dependencyType: "hard" | "optional" | "generated" | "runtime";
}
