export interface RuleCondition {
  field: string;
  operator: "==" | ">" | "<";
  value: string;
}

export interface RuleASTNode {
  type: "AND" | "OR" | "CONDITION";
  left?: RuleASTNode;
  right?: RuleASTNode;
  condition?: RuleCondition;
}

export interface MonetizationRule {
  when: string; // The raw conditional expression
  type: "affiliate" | "ad" | "sponsored_block";
  params: Record<string, any>;
}

export class DSLValidator {
  private static readonly WHITELIST_OPERATORS = ["==", ">", "<"];
  private static readonly WHITELIST_LOGIC_OPERATORS = ["AND", "OR"];
  private static readonly WHITELIST_FIELDS = ["geo", "device", "intent", "dwell_time", "scroll_depth"];

  /**
   * Validates a raw condition string to ensure it is not executing arbitrary JS.
   * Parse it securely and checks syntax tree rules.
   */
  static validateConditionString(expression: string): { valid: boolean; error?: string } {
    if (!expression || expression.trim() === '') {
      return { valid: false, error: "Condition expression cannot be empty" };
    }

    const trimmed = expression.trim();
    if (trimmed === "always") {
      return { valid: true };
    }

    // Basic threat check: reject common injection vectors
    const dangerousPatterns = [
      "eval", "function", "=>", "(", ")", ";", "{", "}", "[", "]", "window", "document", "process", "require", "import"
    ];
    for (const pattern of dangerousPatterns) {
      if (trimmed.includes(pattern)) {
        return { valid: false, error: `Forbidden pattern detected: "${pattern}"` };
      }
    }

    // Tokenize logic structure
    try {
      const ast = this.parseExpressionToAST(trimmed);
      return this.validateAST(ast);
    } catch (err: any) {
      return { valid: false, error: `AST Parsing failed: ${err.message}` };
    }
  }

  /**
   * Evaluates the AST to verify depth, condition limits, and whitelists.
   */
  static validateAST(node: RuleASTNode, currentDepth = 1, state = { totalConditions: 0 }): { valid: boolean; error?: string } {
    if (currentDepth > 5) {
      return { valid: false, error: `Exceeded maximum condition nesting depth (Max: 5)` };
    }

    if (node.type === 'CONDITION') {
      state.totalConditions++;
      if (state.totalConditions > 5) {
        return { valid: false, error: `Exceeded maximum conditions per rule (Max: 5)` };
      }

      const cond = node.condition;
      if (!cond) {
        return { valid: false, error: "Condition details are missing" };
      }

      if (!this.WHITELIST_FIELDS.includes(cond.field)) {
        return { valid: false, error: `Forbidden field: "${cond.field}". Whitelist: ${this.WHITELIST_FIELDS.join(", ")}` };
      }

      if (!this.WHITELIST_OPERATORS.includes(cond.operator)) {
        return { valid: false, error: `Forbidden operator: "${cond.operator}". Whitelist: ${this.WHITELIST_OPERATORS.join(", ")}` };
      }

      // Value safety: Whitelist alphanumeric and simple dash values
      if (!/^[a-zA-Z0-9_\-\.]+$/.test(cond.value.replace(/['"]/g, ''))) {
        return { valid: false, error: `Invalid characters in value: "${cond.value}"` };
      }

      return { valid: true };
    }

    if (node.type === 'AND' || node.type === 'OR') {
      if (!node.left || !node.right) {
        return { valid: false, error: `Logic operator "${node.type}" requires two sub-nodes` };
      }

      const leftVal = this.validateAST(node.left, currentDepth + 1, state);
      if (!leftVal.valid) return leftVal;

      const rightVal = this.validateAST(node.right, currentDepth + 1, state);
      if (!rightVal.valid) return rightVal;

      return { valid: true };
    }

    return { valid: false, error: `Unknown AST node type: "${node.type}"` };
  }

  /**
   * Helper parser that translates condition strings to AST without using eval/Function.
   * Assumes expressions are space-delimited sequences, e.g., "geo == 'US' AND dwell_time > 20"
   */
  private static parseExpressionToAST(expression: string): RuleASTNode {
    // Trim simple parentheses formatting if present (though scanner filters them)
    let clean = expression.replace(/[\(\)]/g, '').trim();

    // Check for logical operators at top level
    const tokens = clean.split(/\s+/);
    
    // Search for logic operator
    for (const operator of this.WHITELIST_LOGIC_OPERATORS) {
      const idx = tokens.findIndex(t => t.toUpperCase() === operator);
      if (idx !== -1) {
        const leftExpr = tokens.slice(0, idx).join(" ");
        const rightExpr = tokens.slice(idx + 1).join(" ");
        
        return {
          type: operator as "AND" | "OR",
          left: this.parseExpressionToAST(leftExpr),
          right: this.parseExpressionToAST(rightExpr)
        };
      }
    }

    // Must be a base condition: field operator value
    if (tokens.length !== 3) {
      throw new Error(`Malformed conditional phrase: "${clean}". Expected syntax: "field operator value"`);
    }

    const [field, op, val] = tokens;
    
    return {
      type: "CONDITION",
      condition: {
        field: field.trim(),
        operator: op.trim() as "==" | ">" | "<",
        value: val.trim()
      }
    };
  }
}
