export function renderPage(schemaArtifact: any) {
  return {
    html: `<article>${schemaArtifact.body}</article>`,
    meta: schemaArtifact.jsonld
  };
}
