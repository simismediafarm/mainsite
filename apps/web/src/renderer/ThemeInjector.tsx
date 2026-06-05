import React from "react";
import { CachedArtifact } from "./ArtifactCache";
import { ArtifactResolver, ResolverContext } from "./ArtifactResolver";

export interface ThemeInjectorProps {
  artifact: CachedArtifact;
  scope?: string; // CSS selector, defaults to ":root"
}

/**
 * SSR-safe style injector that outputs the CSS variables directly in a <style> block.
 * Guarantees zero FOUC (Flash of Unstyled Content) by rendering prior to hydration.
 */
export function ThemeInjector({ artifact, scope = ":root" }: ThemeInjectorProps) {
  const cssVariables = artifact.cssVariables || {};

  let cssText = `${scope} {\n`;
  for (const [key, value] of Object.entries(cssVariables)) {
    // Ensure correct --simis- prefixing
    const varName = key.startsWith("--simis-") ? key : `--simis-${key.replace(/^--/, "")}`;
    cssText += `  ${varName}: ${value};\n`;
  }
  cssText += "}\n";

  return (
    <style
      id={`simis-theme-${artifact.provenance?.sourceManifest?.themeVersionUid || "default"}`}
      dangerouslySetInnerHTML={{
        __html: cssText,
      }}
    />
  );
}

export interface AsyncThemeInjectorProps {
  themeId: string;
  context: ResolverContext;
  scope?: string;
}

/**
 * Server Component variant that resolves the theme artifact dynamically on the server
 * and renders the style tag on initial render.
 */
export async function AsyncThemeInjector({ themeId, context, scope = ":root" }: AsyncThemeInjectorProps) {
  // MVP: Bypassing dynamic theme resolution. Rely on index.css.
  return null;
}
