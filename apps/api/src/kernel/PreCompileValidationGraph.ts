export interface ArtifactNode {
  artifactId: string;
  tenantId: string;
  namespace: string;
  dependencies: string[]; // artifactIds this node depends on
}

export interface ValidationGraphResult {
  valid: boolean;
  /** The full DAG constructed, keyed by artifactId */
  graph: Map<string, ArtifactNode>;
  violations: ValidationViolation[];
}

export interface ValidationViolation {
  type: "CROSS_TENANT_DEPENDENCY" | "CIRCULAR_REFERENCE";
  sourceArtifactId: string;
  targetArtifactId: string;
  message: string;
}

export class PreCompileValidationGraph {
  /**
   * Constructs and validates a dependency DAG before any compilation is allowed.
   * This is the pre-compile truth gate — it catches late-binding conflicts early.
   *
   * Hard constraints enforced here:
   * 1. No cross-tenant implicit dependencies
   * 2. No circular artifact references
   */
  validate(nodes: ArtifactNode[]): ValidationGraphResult {
    const graph = new Map<string, ArtifactNode>(nodes.map(n => [n.artifactId, n]));
    const violations: ValidationViolation[] = [];

    for (const node of nodes) {
      for (const depId of node.dependencies) {
        const dep = graph.get(depId);

        if (!dep) continue; // Dependency is external / unknown — not our domain to validate here

        // Constraint 1: No cross-tenant implicit dependencies
        if (dep.tenantId !== node.tenantId) {
          violations.push({
            type: "CROSS_TENANT_DEPENDENCY",
            sourceArtifactId: node.artifactId,
            targetArtifactId: depId,
            message: `Artifact ${node.artifactId} (tenant: ${node.tenantId}) has an implicit dependency on ${depId} (tenant: ${dep.tenantId}). Cross-tenant dependencies must be explicitly exported and signed.`
          });
        }
      }

      // Constraint 2: No circular artifact references
      const cycle = this.detectCycle(node.artifactId, graph);
      if (cycle) {
        violations.push({
          type: "CIRCULAR_REFERENCE",
          sourceArtifactId: node.artifactId,
          targetArtifactId: cycle,
          message: `Circular dependency detected: ${node.artifactId} → ... → ${cycle}`
        });
      }
    }

    return {
      valid: violations.length === 0,
      graph,
      violations
    };
  }

  private detectCycle(
    startId: string,
    graph: Map<string, ArtifactNode>
  ): string | null {
    const visited = new Set<string>();
    const stack = new Set<string>();

    const dfs = (id: string): string | null => {
      if (stack.has(id)) return id;
      if (visited.has(id)) return null;

      visited.add(id);
      stack.add(id);

      const node = graph.get(id);
      if (node) {
        for (const depId of node.dependencies) {
          const cycle = dfs(depId);
          if (cycle) return cycle;
        }
      }

      stack.delete(id);
      return null;
    };

    return dfs(startId);
  }
}
