import { z } from "zod";

export const PrimitiveTokenSetSchema = z.object({
  subtype: z.literal("token-set"),
  tokenLevel: z.literal("primitive"),
  tokens: z.record(z.string(), z.string().or(z.number())),
  description: z.string().optional(),
});

export const SemanticThemeSchema = z.object({
  subtype: z.literal("theme"),
  tokenLevel: z.literal("semantic"),
  // Semantic themes map a semantic key to a primitive token key (e.g., "button.primary.bg": "colors.blue.500")
  semantics: z.record(z.string(), z.string()),
  description: z.string().optional(),
});

export const MotionTokenSchema = z.object({
  subtype: z.literal("motion-token"),
  transitions: z.record(z.string(), z.string()),
  easings: z.record(z.string(), z.string()),
  durations: z.record(z.string(), z.string().or(z.number())),
});

export const IconSetSchema = z.object({
  subtype: z.literal("icon-set"),
  prefix: z.string(),
  icons: z.record(z.string(), z.string()), // icon name -> svg path/content
});

export const ComponentStyleSchema = z.object({
  subtype: z.literal("component-style"),
  componentId: z.string(),
  variants: z.record(z.string(), z.record(z.string(), z.string())), 
  // e.g., { "primary": { "background": "button.primary.bg" } }
});

export const RegistryBundleSchema = z.object({
  subtype: z.literal("bundle"),
  bundleHash: z.string(),
  includes: z.array(z.string()), // UIDs of themes, tokens, components
});

export const CompiledArtifactSchema = z.object({
  subtype: z.literal("compiled-artifact"),
  cssVariables: z.record(z.string(), z.string()),
  componentMappings: z.record(z.string(), z.any()), // Compiled component styles
  provenance: z.object({
    compiledFromBundleHash: z.string(),
    compiledAt: z.string(),
    compiledBy: z.string(),
    compilerVersion: z.string(),
    compilerHash: z.string(),
    dependencyFingerprint: z.string(),
    artifactSignature: z.string(),
    sourceManifest: z.object({
      themeVersionUid: z.string(),
      tokenVersionUids: z.array(z.string()),
      motionVersionUids: z.array(z.string()),
      iconVersionUids: z.array(z.string()),
      componentStyleVersionUids: z.array(z.string()),
    }),
  }),
});

// A union of all Design System specific definitions
export const DesignSystemDefinitionSchema = z.discriminatedUnion("subtype", [
  PrimitiveTokenSetSchema,
  SemanticThemeSchema,
  MotionTokenSchema,
  IconSetSchema,
  ComponentStyleSchema,
  RegistryBundleSchema,
  CompiledArtifactSchema,
]);

export type DesignSystemDefinition = z.infer<typeof DesignSystemDefinitionSchema>;
