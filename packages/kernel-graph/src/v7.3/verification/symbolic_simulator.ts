export function runSymbolicSimulation(intent: any, ctx: any): any[] {
  // Only evaluates LangGraph decision nodes + syscall edges

  const nodes = intent?.graph?.nodes ?? [];
  const edges = intent?.graph?.edges ?? [];

  const paths: any[] = [];

  function traverse(nodeId: string, path: any[]) {
    const outgoing = edges.filter((e: any) => e.from === nodeId);

    if (outgoing.length === 0) {
      paths.push([...path, nodeId]);
      return;
    }

    for (const edge of outgoing) {
      traverse(edge.to, [...path, nodeId]);
    }
  }

  const root = nodes.find((n: any) => n.root)?.id;
  if (!root) return [];

  traverse(root, []);

  return paths;
}
