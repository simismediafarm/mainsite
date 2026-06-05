# SIMIS Mediafarm Unified Enterprise Blueprint (v3.1)

This document represents the unified project blueprint, architectural definition, and execution contract for SIMIS Mediafarm. It serves as the master **North Star Architecture** for both human operators and autonomous developers.

---

## 🚀 1. The Unified Enterprise Blueprint

```json
{
  "system": {
    "name": "SIMIS MEDIAFARM",
    "version": "v3.1-UNIFIED-ENTERPRISE",
    "type": "Distributed Multi-Tenant Arbitration + Monetization Intelligence OS",
    "execution_model": "Hybrid Deterministic Kernel + Event-Driven Edge + Simulated AI Layers",
    "core_principle": "Deterministic arbitration first, probabilistic intelligence second, UI as real-time truth mirror"
  },

  "architecture_phases": {
    "phase_01_09": "Foundation + CDN + Multi-Tenant + Edge Convergence",
    "phase_10": "Global Arbitration Kernel (GAK-X)",
    "phase_11": {
      "name": "Self-Evolving Arbitration DSL",
      "status": "SPEC_ONLY",
      "execution": "ADR + Formal Spec"
    },
    "phase_12": {
      "name": "Meta-Reality Governance System",
      "status": "FORMAL_SPEC_ONLY",
      "model": ["Category Theory", "Lattice Systems", "Functorial State Transitions"]
    },
    "phase_13": "API Productization Layer (Hardened Kernel + SDK + OpenAPI)",
    "phase_14": "Frontend Control Console (SIMIS MEDIAFARM DASHBOARD)"
  },

  "backend_architecture": {
    "core_kernel": {
      "GlobalArbitrationKernel": {
        "role": "Single entry point for all write operations",
        "pipeline": [
          "NamespaceRegistryValidation",
          "PreCompileValidationGraph",
          "RiskWeightedModeSelector",
          "MarketplaceArbitrator",
          "SystemConflictLedger"
        ],
        "mode": ["STRICT", "ADAPTIVE"],
        "determinism": "100%"
      }
    },

    "services": {
      "cds": "CdnDistributionService",
      "edge": "MultiRegionCdnProvider",
      "convergence": "EdgeConvergenceTracker",
      "retry": "InvalidationRetryWorker",
      "marketplace": "MarketplaceArbitrator",
      "namespace": "NamespaceRegistry"
    },

    "monetization_stack": {
      "engine": "RTMMEngine",
      "auction": "SoftmaxAuctionEngine",
      "agents": [
        "ad_agent",
        "affiliate_agent",
        "content_agent",
        "fraud_agent"
      ],
      "trust_layer": "GNN Trust Embedding (Simulated TS Layer)",
      "rl_layer": "BanditEngine + Contextual RL Simulator"
    }
  },

  "api_specification": {
    "base_url": "/api/kernel",

    "endpoints": {
      "GET /trust/embeddings": {
        "output": "256-dim vector + trust score + anomaly score"
      },

      "POST /monetization/auction": {
        "input": "UMESBidContext",
        "output": "SMKDecisionPayload",
        "process": "4-agent softmax auction + fraud suppression"
      },

      "GET /telemetry/stream": {
        "type": "SSE",
        "streams": [
          "auction_events",
          "trust_updates",
          "edge_convergence",
          "conflict_logs"
        ]
      },

      "POST /arbitration/execute": {
        "input": "artifact + namespace + context",
        "output": "GAK-X decision trace"
      }
    }
  },

  "sdk_design": {
    "package": "@simis/sdk",

    "client": {
      "SimisClient": {
        "methods": [
          "getTrustEmbeddings()",
          "runAuction(context)",
          "subscribeTelemetry()",
          "executeArbitration(request)"
        ]
      }
    },

    "types": {
      "UMESBid": {
        "provider": "string",
        "bid": "number",
        "conversionProbability": "number",
        "latencyMs": "number",
        "trustDependency": "number",
        "revenueModel": ["CPA", "CPM", "CPC", "RevShare"]
      },

      "SMKDecisionPayload": {
        "action": ["ad", "affiliate", "hybrid", "suppress", "block"],
        "expectedRpm": "number",
        "fraudRisk": "number",
        "confidence": "number"
      }
    }
  },

  "frontend_architecture": {
    "stack": "Next.js 15 + App Router + React Flow + SSE Streams",

    "layout": {
      "admin_shell": {
        "sidebar": [
          "Arbitration DAG",
          "CDN Live Map",
          "Monetization Engine",
          "Conflict Replay",
          "Namespace Registry"
        ],

        "global_state": "WebSocket + SSE Hybrid Stream"
      }
    },

    "pages": {
      "/admin/arbitration": {
        "ui_type": "React Flow DAG",
        "visualization": [
          "Namespace Isolation",
          "Compilation Flow",
          "STRICT vs ADAPTIVE Gates",
          "Cross-Tenant Conflict Blocks"
        ]
      },

      "/admin/cdn-live": {
        "ui_type": "Grid Edge Map",
        "visualization": "Propagation latency heatmap"
      },

      "/admin/monetization": {
        "ui_type": "Live Auction Dashboard",
        "features": [
          "Real-time bidding stream",
          "GNN trust score visualization",
          "RL decision overlay",
          "Softmax clearing animation"
        ]
      },

      "/admin/conflicts": {
        "ui_type": "Ledger Inspector",
        "features": [
          "SystemConflictLedger viewer",
          "Replay arbitration decisions",
          "Manual override simulation"
        ]
      }
    }
  },

  "ui_wireframe_json": {
    "dashboard_layout": {
      "type": "grid_system",
      "columns": 12,
      "rows": 8,

      "widgets": [
        {
          "id": "arbitration_dag",
          "type": "graph",
          "position": "left",
          "span": "8x6"
        },
        {
          "id": "cdn_heatmap",
          "type": "geo-grid",
          "position": "top-right",
          "span": "4x3"
        },
        {
          "id": "auction_stream",
          "type": "realtime-feed",
          "position": "bottom-right",
          "span": "4x5"
        }
      ]
    }
  },

  "simulation_layer": {
    "mode": "deterministic + probabilistic hybrid simulation",

    "phase_12_simulation": {
      "category_theory_model": {
        "objects": ["Artifact", "Tenant", "EdgeNode"],
        "morphisms": ["compile", "promote", "invalidate", "rollback"],
        "functor": "F: DesignSpace → DistributedStateSpace"
      },

      "lattice_model": {
        "ordering": "consistency_level",
        "join": "state_merge",
        "meet": "safe_intersection"
      }
    },

    "phase_10_5": {
      "name": "Deterministic Replay Engine",
      "role": "Re-executes arbitration decisions with identical outcomes",
      "guarantee": "bitwise deterministic reproduction of decision trace"
    }
  },

  "failure_modes": {
    "multi_tenant_conflict_storm": {
      "description": "Simultaneous cross-tenant promotion collisions",
      "mitigation": [
        "PreCompileValidationGraph",
        "Namespace isolation hard gate",
        "Ledger-based replay suppression"
      ]
    },

    "cdn_split_brain": {
      "description": "Edge nodes diverge state",
      "mitigation": "EdgeConvergenceTracker + retry worker bounded by epoch"
    },

    "arbitration_deadlock": {
      "description": "Competing STRICT rules",
      "mitigation": "RiskWeightedModeSelector fallback to ADAPTIVE"
    }
  },

  "frontend_backend_contract": {
    "principle": "Frontend is a real-time projection of backend truth state",

    "data_flow": [
      "Kernel Decision → SSE Stream → UI Renderer → DAG / Auction / Heatmap"
    ],

    "state_source_of_truth": "GlobalArbitrationKernel + SystemConflictLedger",

    "ui_mutation_rule": "Frontend NEVER decides truth, only visualizes kernel state"
  },

  "production_readiness": {
    "status": "Phase 14 COMPLETE = UI Layer",
    "next_required_steps": [
      "Phase 15: Full RL + GNN production replacement",
      "Phase 16: Real-time fraud immunity system",
      "Phase 17: Multi-region active-active deployment",
      "Phase 18: Formal verification integration (TLA+/Lean)"
    ]
  }
}
```

---

## 📺 2. Phase 14 - Frontend Control Console Spec

```json
{
  "phase_14": {
    "name": "SIMIS MEDIAFARM Frontend Control Console (Production UI Layer)",
    "stack": {
      "framework": "Next.js 15 (App Router)",
      "ui": "React 19 + TailwindCSS + Glassmorphism System",
      "visualization": "React Flow (@xyflow/react)",
      "realtime": "SSE + WebSocket Hybrid Stream",
      "state": "Server-driven UI (Kernel is Source of Truth)"
    },

    "folder_structure": {
      "apps/web/app/admin": {
        "layout.tsx": "AdminShellLayout (sidebar + header + stream status)",
        "page.tsx": "DashboardOverview",

        "arbitration": {
          "page.tsx": "ArbitrationDAGPage",
          "components": [
            "ArbitrationGraph.tsx",
            "NodeRenderer.tsx",
            "EdgeRenderer.tsx",
            "ConflictBadge.tsx"
          ]
        },

        "cdn-live": {
          "page.tsx": "CDNLiveMapPage",
          "components": [
            "EdgeGrid.tsx",
            "LatencyHeatmap.tsx",
            "NodeStatusCard.tsx"
          ]
        },

        "monetization": {
          "page.tsx": "MonetizationDashboard",
          "components": [
            "AuctionStream.tsx",
            "BidCard.tsx",
            "TrustScoreMeter.tsx",
            "RLDecisionPanel.tsx"
          ]
        },

        "conflicts": {
          "page.tsx": "ConflictReplayPage",
          "components": [
            "ConflictLedgerTable.tsx",
            "ReplayTimeline.tsx",
            "OverrideModal.tsx"
          ]
        }
      },

      "lib": {
        "sse": {
          "useKernelStream.ts": "SSE hook for /kernel/telemetry/stream",
          "useAuctionStream.ts": "Real-time auction event hook",
          "useCDNStream.ts": "Edge convergence stream hook"
        },

        "api": {
          "kernelClient.ts": "Typed fetch client for GAK-X API",
          "sdkBridge.ts": "Wrapper around @simis/sdk"
        },

        "state": {
          "kernelStore.ts": "Zustand global UI state (read-only kernel mirror)"
        }
      },

      "styles": {
        "glass": "glassmorphism.css",
        "theme": "dark-arbitration-theme.css",
        "tokens": "design-tokens.ts"
      }
    },

    "ui_system": {
      "design_language": "Dark Glass Arbitration Console",
      "principles": [
        "Kernel Truth First",
        "No UI-side mutation of state",
        "Everything is stream-driven",
        "Latency is a visible metric"
      ],

      "layout_grid": {
        "columns": 12,
        "rows": 8,
        "zones": {
          "left": "Arbitration DAG (8x8)",
          "right_top": "CDN Live Map (4x4)",
          "right_bottom": "Auction Stream (4x4)",
          "bottom_overlay": "Conflict Replay Timeline"
        }
      },

      "visual_effects": {
        "glassmorphism": true,
        "blur_intensity": "medium-high",
        "neon_accents": ["#00E5FF", "#7C4DFF", "#FF2E63"],
        "motion": "framer-motion driven state transitions"
      }
    }
  }
}
```

---

## 📰 3. SIMIS Media Surface (UI / UX Blueprint)

```json
{
  "system": "SIMIS_MEDIAFARM_UI_LAYER",
  "version": "1.0-production-blueprint",
  "philosophy": {
    "core": "Content + Arbitration + Monetization fused into one interface",
    "render_model": "Server-first + Streaming-enhanced + Edge-personalized UI"
  },
  "route_structure": {
    "/": "Landing + Live Content Feed",
    "/read/[slug]": "Single Content View (canonical media page)",
    "/topic/[id]": "Topic Cluster Page (knowledge graph view)",
    "/author/[id]": "Creator Profile + Revenue + Trust Score"
  },
  "missing_gap_analysis": {
    "already_done": [
      "Kernel arbitration (Phase 10)",
      "Marketplace multi-tenant isolation",
      "CDN convergence engine",
      "Monetization engine backend"
    ],
    "still_missing_frontend_truth_surface": [
      "Feed system (TikTok-like governed stream)",
      "Post renderer (block-based dynamic UI)",
      "Author economy pages",
      "Topic graph UI",
      "Real-time SSE integration layer",
      "Visual arbitration debugger",
      "Trust transparency UX layer"
    ]
  }
}
```

---

## 🧭 4. Layer-to-Workspace Code Mapping

We will implement the next phase by laying down:
1. **API Productization (`apps/api/src/routers/kernel.ts`)**: Adding the mock GNN `/trust/embeddings`, multi-agent `/monetization/auction`, and `/telemetry/stream` SSE endpoints.
2. **SDK client (`packages/sdk`)**: Distributing types like `UMESBid` and `SMKDecisionPayload` and the `SimisClient`.
3. **Frontend Console (`apps/web/app/admin`)**: Hardening the UI layout and implementing the panels for Arbitration DAG, CDN live convergence status, live monetization auction, and conflict replay.
4. **Media Surface (`apps/web/app`)**: Evolving the homepage feed and single article renderer to reflect live trust scores and dynamically cleared monetization slots.
