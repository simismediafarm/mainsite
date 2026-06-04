# SIMIS Signal Engine Specification

This specification defines the core signal intelligence layer which extracts actionable insights from crawled raw text.

---

## 1. Signal Taxonomy

Ingested events are categorized into five semantic signal types:

*   **`TREND_SIGNAL`**: Spikes in keyword velocity or social media signal counts.
*   **`ENTITY_SIGNAL`**: Discovered references to new products, tools, services, or brands.
*   **`CONTENT_GAP_SIGNAL`**: Emerging search terms lacking authoritative review pages.
*   **`RISK_SIGNAL`**: Regulatory actions, security advisories, or pricing updates.
*   **`OPPORTUNITY_SIGNAL`**: Programmatic advertiser commission boosts or new affiliate offers.

---

## 2. Ingestion to Semantic Graph Extraction

1.  **Named Entity Recognition (NER):** Extract entities and aliases from crawl payloads.
2.  **Semantic Embedding generation:** Compute 768-dimension vector representation using Gemini text-embedding-004.
3.  **Cosine Similarity Check:** Execute cosine distance matching against the database:
    
    $$\text{distance} = 1 - \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|}$$
    
    *   `distance < 0.20`: Auto-link as alias.
    *   `distance >= 0.20` and `distance < 0.35`: Prompt for disambiguation check.
    *   `distance >= 0.35`: Create a new Canonical Entity.

---

## 3. Signal Scoring Formula

Signals are ranked dynamically by importance:

$$\text{Importance Score} = \text{Freshness} \times 0.3 + \text{Novelty} \times 0.4 + \text{Authority} \times 0.3$$

*   `Freshness`: Velocity delta from ingestion timestamp.
*   `Novelty`: Uniqueness of claims compared to matching entities.
*   `Authority`: Ingestion source trust score rating.
