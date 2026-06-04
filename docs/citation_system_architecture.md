# SIMIS Citation System Architecture Spec

This specification defines the citation integrity graph model.

---

## 1. Citation Graph Schema

Claims, facts, and entities are tied back to their provenance sources:

```
[Claim / Entity] ──> [entity_mentions] ──> [Provenance Source URL]
```

This guarantees full auditability, letting users verify the factual grounds of any report back to its source URL.

---

## 2. Invariant Rules

*   **Explicit Mapping:** Every published fact or entity claim must contain a citation reference object mapping to a source URL and confidence score.
*   **Decay Persistence:** Decayed node weights do not alter provenance metadata records.
*   **Conflict Resolution:** If sources contradict, the resolver assigns weights based on source trust metrics.
