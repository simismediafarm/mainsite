import fs from "fs";
import fg from "fast-glob";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";

export async function streamAST() {
  const files = await fg([
    "apps/web/**/*.{ts,tsx}",
    "packages/**/*.{ts,tsx}"
  ]);

  const astNodes: any[] = [];

  for (const file of files) {
    const code = fs.readFileSync(file, "utf-8");

    try {
      const ast = parse(code, {
        sourceType: "module",
        plugins: ["typescript", "jsx"],
      });

      traverse(ast, {
        enter(path) {
          if (path.node.type) {
            astNodes.push({
              type: "AST_NODE",
              file,
              kind: path.node.type,
              loc: path.node.loc,
            });
          }
        },
      });
    } catch (e) {
      // Ignore parse errors for strict AST stream
    }
  }

  return astNodes;
}
