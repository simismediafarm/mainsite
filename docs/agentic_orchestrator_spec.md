# SIMIS Agentic Swarm Orchestrator Spec

This specification defines the competitive multi-agent swarm economy layer.

---

## 1. Agent Swarm Economy Model

Instead of executing predefined pipelines, agents compete internally to execute broadcasted tasks.

*   **Registry:** Agents register their capability profiles and cost profiles in the database.
*   **Bidding Pool:** When a task is broadcasted, eligible agents submit a proposal estimate containing their plan, cost, and confidence score.
*   **Selection:** The orchestrator selects the winning bid using the cost-effectiveness formula:
    
    $$\text{Selection Score} = \frac{\text{Confidence} \times \text{Reward Value}}{\text{Cost Estimate}}$$

---

## 2. Competitive Reward Signals

*   The winning agent receives a reinforcement boost to its `reward_score` upon successful execution.
*   Losing agents are penalized or updated via gradient-style delta reductions.
*   Periodic mutation triggers spawn new agent variations based on high-performing profiles.
