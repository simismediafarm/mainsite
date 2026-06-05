import { RegistryDependency } from "../../contracts";

export class CycleDetector {
  /**
   * Detects cycles in a directed graph of dependencies.
   * Throws an error containing the cycle path if a cycle is found.
   */
  detect(dependencies: RegistryDependency[]): void {
    const adjList = new Map<string, string[]>();

    // Exclude 'runtime' dependencies from cycle detection as per ADR
    const relevantDeps = dependencies.filter(d => d.dependencyType !== "runtime");

    for (const dep of relevantDeps) {
      if (!adjList.has(dep.definitionUid)) {
        adjList.set(dep.definitionUid, []);
      }
      adjList.get(dep.definitionUid)!.push(dep.dependsOnUid);
    }

    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = adjList.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (recursionStack.has(neighbor)) {
          path.push(neighbor);
          throw new Error(`Circular dependency detected: ${path.join(" -> ")}`);
        }
      }

      recursionStack.delete(node);
      path.pop();
    };

    for (const node of adjList.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }
  }
}
