# SIMIS Multi-Agent Reasoning Specification

This specification defines the agent swarms roles during research execution.

---

## 1. Agent Roles & Swarm Collaboration

*   **Query Planner Agent:** Decomposes queries and plans research steps.
*   **Retrieval Agent:** Queries search engines and pulls source URLs.
*   **Crawling Agent:** Crawls website text via the distributed mesh.
*   **Fact Extraction Agent:** Extracts claims and resolves entities.
*   **Conflict Resolver Agent:** Analyzes contradictory signals.
*   **Citation Builder Agent:** Maps claims to source parameters.

---

## 2. Fact Verification Loop

*   **Cross-Source checks:** Claims require validation across at least two independent sources.
*   **Confidence scoring:** Ambiguous or conflicting facts are flagged for operator review or trigger recursive sub-queries.
