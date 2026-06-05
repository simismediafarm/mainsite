export const RegistryTypes = [
  "component",
  "layout",
  "page",
  "schema",
  "setting",
  "design-system",
  "seo",
  "workflow"
] as const;

export type RegistryType = (typeof RegistryTypes)[number];
