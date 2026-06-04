import { DSLValidator, MonetizationRule } from './validator';

export interface VisualNode {
  id: string;
  type: "condition" | "action" | "root";
  data: {
    field?: string;
    operator?: "==" | ">" | "<";
    value?: string;
    actionType?: "affiliate" | "ad" | "sponsored_block";
    params?: string; // JSON string parameters
  };
}

export interface VisualEdge {
  id: string;
  source: string;
  target: string;
  relation?: "AND" | "OR" | "THEN";
}

export interface VisualGraph {
  nodes: VisualNode[];
  edges: VisualEdge[];
}

export class DSLParser {
  /**
   * Compiles a React Flow visual node/edge schema into clean MonetizationRules.
   * Performs graph traversal and AST validation.
   */
  static compileGraph(graph: VisualGraph): { rules: MonetizationRule[]; errors: string[] } {
    const rules: MonetizationRule[] = [];
    const errors: string[] = [];

    // Find all action nodes as compilation endpoints
    const actionNodes = graph.nodes.filter(n => n.type === 'action');

    for (const actionNode of actionNodes) {
      try {
        const expression = this.resolveConditionsForAction(actionNode.id, graph);
        
        // Validate the compiled expression string
        const validation = DSLValidator.validateConditionString(expression);
        if (!validation.valid) {
          errors.push(`Action [${actionNode.id}]: ${validation.error}`);
          continue;
        }

        let parsedParams: Record<string, any> = {};
        if (actionNode.data.params) {
          try {
            parsedParams = JSON.parse(actionNode.data.params);
          } catch {
            errors.push(`Action [${actionNode.id}]: Invalid JSON parameters`);
            continue;
          }
        }

        rules.push({
          when: expression,
          type: actionNode.data.actionType || 'ad',
          params: parsedParams
        });
      } catch (err: any) {
        errors.push(`Action [${actionNode.id}]: Compilation error - ${err.message}`);
      }
    }

    return { rules, errors };
  }

  /**
   * Traces back from an action node through its incoming edges to construct a logical string.
   */
  private static resolveConditionsForAction(actionNodeId: string, graph: VisualGraph): string {
    const incomingEdges = graph.edges.filter(e => e.target === actionNodeId);
    if (incomingEdges.length === 0) {
      return "always";
    }

    const conditions: string[] = [];

    for (const edge of incomingEdges) {
      const sourceNode = graph.nodes.find(n => n.id === edge.source);
      if (!sourceNode) continue;

      if (sourceNode.type === 'condition') {
        const condStr = this.compileConditionNode(sourceNode);
        conditions.push(condStr);
      }
    }

    if (conditions.length === 0) {
      return "always";
    }

    // Combine conditions: default to AND unless specified otherwise on relation
    const logicalOperator = incomingEdges[0].relation === 'OR' ? ' OR ' : ' AND ';
    return conditions.join(logicalOperator);
  }

  private static compileConditionNode(node: VisualNode): string {
    const { field, operator, value } = node.data;
    if (!field || !operator || value === undefined) {
      throw new Error(`Condition node [${node.id}] is missing parameters`);
    }
    // E.g. "geo == 'US'"
    return `${field} ${operator} ${value}`;
  }
}
