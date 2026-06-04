# SIMIS Monetization Infrastructure discovery & Mapping Report

This artifact maps monetization targets optimized for high-RPM US traffic to the SIMIS ingestion, ranking, sandbox, and frontend layers.

---

## 🌎 1. HIGH-RPM AFFILIATE NETWORKS (US / GLOBAL)

```text id="affiliate_bom"
CATEGORY: Affiliate
NAME: Impact.com
GitHub / Website: https://impact.com
TYPE: affiliate network
RPM TARGET REGION: US / Tier-1 global
API CAPABILITY: REST / SDK / Server-to-server
SIMIS ROLE: ingestion / ranking / monetization injection
INTEGRATION LAYER: Zone A / B / D
MONETIZATION TYPE: CPA / CPC / RevShare
DETERMINISTIC SAFE: yes
```

```text id="affiliate_bom"
CATEGORY: Affiliate
NAME: CJ Affiliate (Commission Junction)
GitHub / Website: https://cj.com
TYPE: affiliate network
RPM TARGET REGION: US / Tier-1 global
API CAPABILITY: REST / GraphQL / S2S Callbacks
SIMIS ROLE: ingestion / ranking / monetization injection
INTEGRATION LAYER: Zone A / B / D
MONETIZATION TYPE: CPA / CPC / RevShare
DETERMINISTIC SAFE: yes
```

```text id="affiliate_bom"
CATEGORY: Affiliate
NAME: ShareASale (Awin Group)
GitHub / Website: https://shareasale.com
TYPE: affiliate network
RPM TARGET REGION: US / Tier-1 global
API CAPABILITY: REST / CSV Product Feeds
SIMIS ROLE: ingestion / monetization injection
INTEGRATION LAYER: Zone A / B
MONETIZATION TYPE: CPA / RevShare
DETERMINISTIC SAFE: yes
```

```text id="affiliate_bom"
CATEGORY: Affiliate
NAME: Rakuten Advertising
GitHub / Website: https://rakutenadvertising.com
TYPE: affiliate network
RPM TARGET REGION: US / Tier-1 global
API CAPABILITY: REST / Product Search APIs
SIMIS ROLE: ingestion / ranking / monetization injection
INTEGRATION LAYER: Zone A / B / D
MONETIZATION TYPE: CPA / RevShare
DETERMINISTIC SAFE: yes
```

```text id="affiliate_bom"
CATEGORY: Affiliate
NAME: PartnerStack
GitHub / Website: https://partnerstack.com
TYPE: affiliate network
RPM TARGET REGION: US / Tier-1 global
API CAPABILITY: REST / Webhooks
SIMIS ROLE: ingestion / monetization injection
INTEGRATION LAYER: Zone A / B
MONETIZATION TYPE: CPA / RevShare
DETERMINISTIC SAFE: yes
```

```text id="affiliate_bom"
CATEGORY: Affiliate
NAME: Awin Global Network
GitHub / Website: https://awin.com
TYPE: affiliate network
RPM TARGET REGION: US / Tier-1 global
API CAPABILITY: REST / GraphQL / Product Feeds
SIMIS ROLE: ingestion / ranking / monetization injection
INTEGRATION LAYER: Zone A / B / D
MONETIZATION TYPE: CPA / RevShare
DETERMINISTIC SAFE: yes
```

---

## 🛍️ 2. PRODUCT FEED AGGREGATORS (CONTENT EGG ALTERNATIVES)

```text id="affiliate_bom"
CATEGORY: Feed Aggregation
NAME: Skimlinks
GitHub / Website: https://skimlinks.com
TYPE: feed aggregator
RPM TARGET REGION: US / Tier-1 global
API CAPABILITY: REST / JS SDK / Pixel / Server-to-server
SIMIS ROLE: ingestion / monetization injection / frontend rendering
INTEGRATION LAYER: Zone A / B / E
MONETIZATION TYPE: CPA / CPC / RevShare
DETERMINISTIC SAFE: yes
```

```text id="affiliate_bom"
CATEGORY: Feed Aggregation
NAME: Sovrn Commerce (formerly VigLink)
GitHub / Website: https://sovrn.com/commerce
TYPE: feed aggregator
RPM TARGET REGION: US / Tier-1 global
API CAPABILITY: REST / JS SDK / Server-to-server
SIMIS ROLE: ingestion / monetization injection / frontend rendering
INTEGRATION LAYER: Zone A / B / E
MONETIZATION TYPE: CPC / CPA / RevShare
DETERMINISTIC SAFE: yes
```

```text id="affiliate_bom"
CATEGORY: Feed Aggregation
NAME: Datafeedr
GitHub / Website: https://datafeedr.com
TYPE: feed aggregator
RPM TARGET REGION: US / Tier-1 global
API CAPABILITY: REST (Unified multi-network product catalog query API)
SIMIS ROLE: ingestion / monetization injection
INTEGRATION LAYER: Zone A / B
MONETIZATION TYPE: CPA / RevShare
DETERMINISTIC SAFE: yes
```

```text id="affiliate_bom"
CATEGORY: Feed Aggregation
NAME: Admitad
GitHub / Website: https://admitad.com
TYPE: feed aggregator
RPM TARGET REGION: US / Tier-1 global / mixed
API CAPABILITY: REST / S2S Postbacks
SIMIS ROLE: ingestion / monetization injection
INTEGRATION LAYER: Zone A / B
MONETIZATION TYPE: CPA / CPC / RevShare
DETERMINISTIC SAFE: yes
```

---

## 📈 3. HIGH CPM AD NETWORKS (US TRAFFIC MONETIZATION)

```text id="affiliate_bom"
CATEGORY: Ads
NAME: Google Ad Manager (GAM)
GitHub / Website: https://admanager.google.com
TYPE: ad network
RPM TARGET REGION: US / Tier-1 global
API CAPABILITY: REST / SDK / Google Publisher Tag (GPT) / OpenRTB
SIMIS ROLE: frontend rendering
INTEGRATION LAYER: Zone E
MONETIZATION TYPE: CPM / CPC
DETERMINISTIC SAFE: yes
```

```text id="affiliate_bom"
CATEGORY: Ads
NAME: Mediavine
GitHub / Website: https://mediavine.com
TYPE: ad network
RPM TARGET REGION: US
API CAPABILITY: Script tag / Wrapper SDK
SIMIS ROLE: frontend rendering
INTEGRATION LAYER: Zone E
MONETIZATION TYPE: CPM
DETERMINISTIC SAFE: yes
```

```text id="affiliate_bom"
CATEGORY: Ads
NAME: Raptive (formerly AdThrive)
GitHub / Website: https://raptive.com
TYPE: ad network
RPM TARGET REGION: US
API CAPABILITY: Script tag / Wrapper SDK
SIMIS ROLE: frontend rendering
INTEGRATION LAYER: Zone E
MONETIZATION TYPE: CPM
DETERMINISTIC SAFE: yes
```

```text id="affiliate_bom"
CATEGORY: Ads
NAME: Ezoic
GitHub / Website: https://ezoic.com
TYPE: ad network
RPM TARGET REGION: US / Tier-1 global / mixed
API CAPABILITY: DNS integration / REST API / JS SDK
SIMIS ROLE: frontend rendering
INTEGRATION LAYER: Zone E
MONETIZATION TYPE: CPM / CPC
DETERMINISTIC SAFE: yes
```

```text id="affiliate_bom"
CATEGORY: Ads
NAME: Amazon Publisher Services (APS)
GitHub / Website: https://publisher.amazon.com
TYPE: ad network
RPM TARGET REGION: US / Tier-1 global
API CAPABILITY: JS SDK / Server-to-server Header Bidding
SIMIS ROLE: frontend rendering
INTEGRATION LAYER: Zone E
MONETIZATION TYPE: CPM
DETERMINISTIC SAFE: yes
```

```text id="affiliate_bom"
CATEGORY: Ads
NAME: PubMatic
GitHub / Website: https://pubmatic.com
TYPE: ad network
RPM TARGET REGION: US / Tier-1 global
API CAPABILITY: OpenRTB / REST / OpenWrap SDK
SIMIS ROLE: frontend rendering
INTEGRATION LAYER: Zone E
MONETIZATION TYPE: CPM
DETERMINISTIC SAFE: yes
```

---

## 🧠 4. PROGRAMMATIC MONETIZATION INFRASTRUCTURE

```text id="affiliate_bom"
CATEGORY: Ads
NAME: Prebid.js
GitHub / Website: https://prebid.org
TYPE: ad network
RPM TARGET REGION: US / Tier-1 global
API CAPABILITY: JS Client API / Prebid Server (REST/OpenRTB)
SIMIS ROLE: monetization injection / frontend rendering
INTEGRATION LAYER: Zone B / E
MONETIZATION TYPE: CPM
DETERMINISTIC SAFE: yes
```

```text id="affiliate_bom"
CATEGORY: Ads
NAME: Google Publisher Tag (GPT)
GitHub / Website: https://developers.google.com/publisher-tag
TYPE: ad network
RPM TARGET REGION: US / Tier-1 global
API CAPABILITY: JS Client API / Server-Side Tags
SIMIS ROLE: frontend rendering
INTEGRATION LAYER: Zone E
MONETIZATION TYPE: CPM / CPC
DETERMINISTIC SAFE: yes
```

---

## 🔗 5. TRACKING + ATTRIBUTION + LINK MONETIZATION

```text id="affiliate_bom"
CATEGORY: Tracking
NAME: Voluum
GitHub / Website: https://voluum.com
TYPE: tracking system
RPM TARGET REGION: US / Tier-1 global
API CAPABILITY: REST / S2S postbacks / Redirect API
SIMIS ROLE: ranking / monetization injection
INTEGRATION LAYER: Zone B / D
MONETIZATION TYPE: CPC / CPA
DETERMINISTIC SAFE: yes
```

```text id="affiliate_bom"
CATEGORY: Tracking
NAME: RedTrack
GitHub / Website: https://redtrack.io
TYPE: tracking system
RPM TARGET REGION: US / Tier-1 global
API CAPABILITY: REST / Conversions API (CAPI) / S2S / Redirect
SIMIS ROLE: ranking / monetization injection
INTEGRATION LAYER: Zone B / D
MONETIZATION TYPE: CPC / CPA
DETERMINISTIC SAFE: yes
```

---

## 🧱 6. SIMIS MONETIZATION INJECTION MODEL

```text id="monetization_mapping"
ZONE A (Ingestion):
- affiliate feeds ingestion APIs
- product catalog normalization

ZONE B (Sandbox):
- price normalization
- deal scoring
- conversion probability tagging

ZONE D (Ranking Engine):
- monetization_weight scoring injection
- CTR prediction signals
- RPM optimization scoring

ZONE E (Frontend):
- ad slots (non-intrusive feed integration)
- affiliate cards
- deal stream blocks
```

---

## 🧾 7. PRIORITY SELECTION RULE

| System | Category | US RPM | API Maturity | Integration Simplicity | Feed Quality | Scalability | Total (50) |
|---|---|---|---|---|---|---|---|
| **Impact.com** | Affiliate | 9.0 | 9.5 | 8.0 | 9.0 | 9.5 | **45.0** |
| **Skimlinks** | Feed Aggregation | 9.0 | 9.0 | 9.5 | 8.5 | 9.5 | **45.5** |
| **CJ Affiliate** | Affiliate | 8.5 | 9.0 | 7.5 | 8.5 | 9.0 | **42.5** |
| **Sovrn Commerce**| Feed Aggregation | 8.5 | 8.5 | 9.0 | 8.0 | 9.0 | **43.0** |
| **Datafeedr** | Feed Aggregation | 8.0 | 8.5 | 9.0 | 9.5 | 8.5 | **43.5** |
| **Raptive** | Ads | 10.0| 6.0 | 9.5 | N/A | 8.0 | **33.5** (N/A feed) |
| **Mediavine** | Ads | 9.5 | 6.0 | 9.5 | N/A | 8.0 | **33.0** (N/A feed) |
| **Prebid.js** | Infrastructure | 9.0 | 9.5 | 5.0 | N/A | 10.0| **33.5** (N/A feed) |
| **Voluum** | Tracking | 9.0 | 9.0 | 7.5 | N/A | 9.5 | **35.0** (N/A feed) |

---

## 🧠 8. FINAL CONSOLIDATION REQUIREMENT

```text id="final_monetization_map"

SIMIS MONETIZATION STACK (US-OPTIMIZED)

1. PRIMARY AFFILIATE LAYER
   - Impact.com + CJ Affiliate: Main direct programmatic integration targets. Direct REST and GraphQL product discovery queries to build the high-value deal catalogs.

2. SECONDARY AFFILIATE AGGREGATION
   - Skimlinks + Datafeedr: Datafeedr for multi-network programmatic product catalog normalization. Skimlinks for dynamic client-side link optimization to monetize organic references.

3. AD NETWORK STACK (HEADER BIDDING + DIRECT ADS)
   - Prebid.js (Client + Server) + Google Ad Manager: Client-side header bidding wrapper communicating with Amazon Publisher Services and PubMatic, orchestrated via GAM. Raptive/Mediavine serving as premium ad representative overlays once session targets are achieved.

4. TRACKING + ATTRIBUTION LAYER
   - RedTrack API: Handles server-side click tracking, postback loops for payout synchronization, and conversions attribution metrics fed into Zone B sandbox.

5. RANKING INTEGRATED MONETIZATION SIGNALS
   - Zone B/D integration: Map attribution reports (e.g. EPC - Earnings Per Click) back into ContentBlockV2 `ranking.monetization_weight` to dynamically prioritize high-yield posts.

6. FRONTEND MONETIZATION SURFACE DESIGN
   - Section B (Deals Strip): Houses direct AffiliateBlocks normalized from Impact/CJ.
   - Section C (Discovery Stream): Injects native display/native ad units from Google Publisher Tag at fixed scroll intervals (e.g., every 5 items in infinite scroll).
```
