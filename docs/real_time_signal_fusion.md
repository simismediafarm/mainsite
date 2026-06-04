# SIMIS Real-Time Signal Fusion Specification

This specification defines the signal aggregation and fusion loops.

---

## 1. Multi-Source Inbound Ingestion

Signals from diverse sources (academic journals, RSS feeds, search APIs) are resolved to a single topic cluster using vector space matches.

---

## 2. Ingestion Execution Loops

*   **30-Second Aggregation:** Fetches and hashes raw signal mentions.
*   **5-Minute Recomputation:** Recalculates trend velocity scores for active clusters.
*   **1-Hour Global Normalization:** Clamps metrics and flushes decay weights to graph nodes.
