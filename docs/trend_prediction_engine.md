# SIMIS Trend Prediction Engine Spec

This specification defines the real-time global trend prediction calculations.

---

## 1. Mathematical Trend Score Formula

Trends are scored dynamically based on their rate of discovery and entity connection changes:

$$\text{Trend Score} = \frac{\text{Signal Velocity} \times \text{Entity Growth}}{\text{Graph Decay Factor}}$$

*   `Signal Velocity`: Ingestion rate of related topic mentions over time.
*   `Entity Growth`: Ratio of new edges created around the target node.
*   `Graph Decay Factor`: Dynamic weight decay ($5\%$ monthly) computed from last reinforcement timestamp.

---

## 2. Trend Classification

*   **Emerging Trend:** High signal velocity, low entity connections (high novelty).
*   **Declining Trend:** Low signal velocity, high decay factor.
*   **Saturated Trend:** High entity connections, low signal growth.
*   **Viral Spike Event:** Vertical signal velocity spike in a short duration.
