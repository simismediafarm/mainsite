# SIMIS LangGraph Research Engine Spec

This specification defines the LangGraph-equivalent multi-agent reasoning graph.

---

## 1. Graph State Schema

The reasoning flow uses a global state (`SIMISState`) defined in `@simis/reasoning-graph` ([resolver file](file:///Users/mac/Downloads/PROYEK/SIMIS/packages/reasoning-graph/src/index.ts)):
*   `query`: Inbound research signal text.
*   `sub_queries`: Decomposed atomic subqueries.
*   `execution_results`: Crawled web search outcomes.
*   `partial_answers`: Resolved facts and weighted truth values.
*   `confidence_score`: Self-reflection evaluation value.

---

## 2. Dynamic Research Graph Nodes

*   **Router:** Determines target reasoning paths based on query intent.
*   **Decomposer:** Splits query inputs into atomic sub-questions.
*   **DAG Builder:** Formulates dynamic execution tasks.
*   **Executor:** Parallel search, crawl, or graph retrieval workers.
*   **Validator:** Audits consistency across multiple inputs.
*   **Conflict Resolver:** Resolves contradictory facts based on source authority.
*   **Synthesis:** Composes structured markdown reports with citations.
*   **Reflection:** Calculates confidence scores and evaluates completion metrics.
*   **Memory Writer:** Persists findings to the semantic graph.
