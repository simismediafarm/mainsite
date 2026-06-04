export function injectSchema(artifact: any) {
  return {
    ...artifact,
    jsonld: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": artifact.title,
      "keywords": artifact.entities
    }
  };
}
