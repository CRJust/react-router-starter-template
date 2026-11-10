# TPrice benchmark: ideas for Beavy

Research date: 10 November 2026

This document translates publicly available TPrice product and engineering material for Serbia and Croatia into recommendations for Beavy in Romania. It is a benchmark, not a claim that Beavy has implemented these features.

## 1. What the public TPrice material actually documents

TPrice has public product case-study pages, retailer/manufacturer partnership pages, a public product catalogue and an app listing. The detailed implementation notes below come primarily from the product-design and backend case studies authored by the TPrice builder. They are not a public REST API specification: endpoint paths, request schemas, authentication, and partner-feed schemas are not disclosed in those sources.

### Product and data model

- Product pages compare the same product across chains in a selected city.
- A chain row can show a price range when its physical stores charge different prices. This avoids presenting one store's price as though it applied to every location.
- Prices can be browsed as a history of up to six months, with a separate series per chain.
- A product's price quality label compares the current best price with the city's 30-day median. Labels described in the case study include Great price and Average price.
- The product page includes a photo, manufacturer, barcode, prices by store/chain and, where available, nutrition facts and Nutri-Score.
- Search and product discovery include a barcode scanner, category browsing, chain filters, Cheapest first and Great price filters.
- Product cards use a compact chain chip: the cheapest chain plus the number of other chains carrying the product (for example, “Maxi + 1”), rather than printing several prices in every card.
- Users can select a country and city, hide chains they do not shop at, and maintain favourites.
- The app surfaces daily deals in a short card deck and can add a deal to favourites.
- The public app listing describes shopping reminders ahead of holidays.

### Basket experience

The published case study describes three basket modes:

1. One store: the full list at the cheapest chain that carries every requested product.
2. Two stores: a compromise between convenience and savings.
3. Cheapest split: buy each item at its cheapest available chain, even if that creates more stops.

The basket UI is organised into three tabs:

- **List** — the user's products, with each product's cheapest-chain chip.
- **Plan** — a choice between one store, two stores and the cheapest split, with total price and a clear Easier/Cheaper trade-off.
- **Compare** — chains ranked by the basket total, including coverage such as “15 of 15” products and a clear marker for the cheapest complete chain.

Coverage is important. A chain with a low partial total must not look like the cheapest complete basket when products are missing. The case study says the pre-release prototype caused users to select incomplete chains; making coverage visible reduced that problem.

The case study's reported results are a useful directional signal, not a forecast for Beavy: 79% of selected plans used one or two stores; in one reported cohort the median savings were 2.6% for a two-store plan and 6.3% for the cheapest split versus the cheapest complete chain. The research cited 16 interviews and several small usability rounds, so Beavy should validate the same choices with Romanian shoppers.

### Data ingestion and infrastructure

The backend case study describes this pipeline:

1. Download retailers' published price lists on a schedule.
2. Parse the lists and normalise the product/price records.
3. Map chain prices to stores and regions/cities.
4. Import new data and recalculate price-quality labels.
5. Monitor freshness and detect silent or partial feed failures.

Croatia and Serbia used official retailer price lists; the case study records different launch dates and different counts of chains at those snapshots. It also describes a collector for Serbian files that did not have one unified daily archive.

The published stack is deliberately different from Beavy's current stack:

- Go HTTP services and workers.
- PostgreSQL for catalogue and users.
- ClickHouse for high-volume price history/time-series queries.
- Redis for frequently read counters.
- Scheduled jobs per country.
- Prometheus, Grafana, Alertmanager and Loki for monitoring.
- Integration tests against real PostgreSQL and ClickHouse services.

The author reports tens of millions of store-price observations per day across both countries. The case study describes moving price history out of PostgreSQL after the data volume and index size made historical queries too expensive, not as a requirement from day one.

### Retailer and manufacturer partnerships

TPrice's public partner pages explicitly invite:
- Retailers to provide price lists, product ranges and store addresses as a data feed.
- Manufacturers to provide product names, product photos and barcodes.
- Joint promotions, links to retailers' online stores and co-branded loyalty initiatives.
- Reports from users or retailers when a store or product is missing or displayed incorrectly.

This is a partnership/data-exchange model, not evidence of a public self-service API that Beavy can call.

## 2. What Beavy should borrow

| Priority | TPrice idea | Beavy adaptation | Reason |
|---|---|---|---|
| P0 | One-store / two-store / cheapest-split plans | Present one-store, two-destination and up-to-three-destination plans, with a separate “lowest item prices” comparison | Makes the savings/convenience trade-off understandable |
| P0 | Basket coverage such as 15/15 | Show complete, partial and unavailable coverage prominently; never rank a partial basket as the cheapest complete option | Prevents misleading totals |
| P0 | Compare chains, not dozens of individual stores by default | Group results by retailer, then expand to physical stores or delivery nodes and show a verified price range | Keeps comparison readable while retaining location accuracy |
| P0 | A selected city controls prices | Use Beavy's city plus delivery/fulfilment area as the comparison context; show the selected context clearly | Store and delivery prices are geographically dependent |
| P0 | Store price range when branches differ | Calculate ranges only from fresh, comparable offers for known stores/nodes; identify how many nodes contributed | Avoids implying a single uniform chain price |
| P1 | Price quality against a 30-day city median | Add a “Good price / Usual price / High price” indicator only after sufficient history exists for the exact canonical product and comparable package | Helps users decide whether a promotion is genuinely good |
| P1 | Up to six months of price history | Retain daily observations and graph retailer/fulfilment-channel series; start with a shorter reliable history if coverage is sparse | Builds trust and price context |
| P1 | Chain chip on cards | Show “cheapest at X + N other stores” or “price from X”; keep exact comparisons on the product page | High information density without clutter |
| P1 | Cheapest-first and good-price filters | Add filters after search quality and offer coverage are reliable | Turns catalogue search into a shopping decision tool |
| P1 | Favourites and price alerts | Save exact canonical product IDs and optional target prices; notify only when a verified offer crosses the threshold | Useful repeat-use loop |
| P1 | Daily deals deck | Curated daily offers with source, validity, package size and comparison to normal price; do not treat leaflet-only items as verified current shelf prices | Discovery without misleading deal claims |
| P2 | Retailer/manufacturer data exchange | Publish a simple partner intake specification for catalogue, barcode, image, store/node and price feeds | Could improve data quality and reduce scraper dependence |
| P2 | Report incorrect/missing data | Add “Report price/product/store” with the source and observation ID attached | Creates a traceable correction workflow |
| P2 | Shopping reminders | Allow user-defined reminders or recurring list prompts; avoid generic notification spam | Encourages useful repeat shopping |

## 3. Important Beavy-specific improvements beyond TPrice

Beavy has already prepared a fulfilment-node and fee-rule model in Supabase. This should remain a differentiator rather than be removed to imitate TPrice.

### Compare the true payable amount

For Beavy, each destination total should include:

- Product subtotal.
- Delivery fee.
- Service fee.
- Packaging fee.
- Small-order fee, if applicable.
- Minimum basket value and free-delivery threshold rules.
- SGR shown separately from the product price.

Unknown costs must remain unknown. A NULL fee is not zero. Do not call one plan cheaper if its fee rules are unknown or if its item coverage is incomplete.

### Keep exact product identity

Use the exact canonical `beavy_products.id` and matched package/variant. Do not replace a requested brand, size, flavour or formulation merely to make a basket appear complete. Any substitute suggestion must be labelled as a substitute and accepted by the user.

### Separate store and delivery fulfilment

The same chain may have different prices, fees, stock and coverage by physical store, delivery area and online service. Keep `fulfillment_node_id` on eligible offers, and never infer local availability from a generic chain-level price list.

### Label source and freshness

Every offer shown to a shopper should be traceable to a source and observation time. Display a freshness label such as “Updated today” or “Last checked …” only when the ingestion timestamp supports it. Distinguish:
- Published/list price.
- Promotion price and its validity window.
- Online/delivery price.
- Physical-store price.
- User-reported or unverified observation.

A public price list does not establish stock availability. A price shown for information can differ from the shelf price at purchase time; show a concise disclaimer.

## 4. Recommended Beavy implementation sequence

### Phase A — Make basket comparisons trustworthy

1. Build the List / Plan / Compare flow around the exact canonical product IDs.
2. Return three clear plan options: one store, two destinations, and best split up to three destinations.
3. Show item coverage and missing items on every plan.
4. Include known fees and thresholds in each destination total.
5. Refuse to claim savings when prices, coverage or applicable fees are incomplete.
6. Group by retailer for scanability, with expandable fulfilment-node detail and branch price ranges.

### Phase B — Add price intelligence

1. Store daily offer observations with source, node, timestamp and validity.
2. Build a per-product/per-city price-history query.
3. Calculate a 30-day median only from comparable package sizes, channels and valid observations.
4. Add six-month history when data retention and coverage justify it.
5. Add a price-quality label with a clear explanation and a minimum-observation threshold.

### Phase C — Improve discovery and retention

1. Cheapest retailer chip and other-store count in search/cards.
2. Cheapest-first and good-price filters.
3. Favourites and target-price alerts.
4. Daily deals with validity and source details.
5. User reports for incorrect prices, products and missing retailers.

### Phase D — Scale only when measurements require it

Do not move to Go, ClickHouse, Kubernetes or Redis merely because TPrice uses them. Beavy currently has a Supabase/PostgreSQL + Cloudflare direction and no active offer volume in the current data snapshot. Start with a robust, idempotent importer, suitable indexes, bounded queries and monitoring. Measure row counts, import time, query latency and storage. Consider a columnar price-history store only when historical volume or aggregation performance justifies operating another database.

## 5. Data-pipeline requirements worth adopting now

- **Idempotent imports:** rerunning a source file should not duplicate offers.
- **Incremental downloads:** use source modification dates, checksums or known date ranges where available.
- **Streaming parsers:** process large CSV/JSON files row by row instead of loading the full archive into memory.
- **Per-source run records:** start/end time, source, file/checksum, records seen, inserted, updated, rejected and reason.
- **Freshness monitoring:** alert when a retailer feed stops updating or suddenly loses most of its stores/products.
- **Anomaly checks:** unexpected price jumps, empty files, currency/unit changes, duplicate barcodes and implausible package sizes.
- **Store mapping:** keep retailer, physical store, city/region and delivery area as separate concepts.
- **Reconciliation:** preserve raw source data and parser version so an incorrect mapping can be reviewed and reprocessed.
- **Tests:** parser fixtures per retailer, idempotency tests, basket coverage tests, fee-boundary tests and stale-offer tests.

## 6. Decisions for Beavy

Recommended decisions based on this benchmark:

1. Keep the existing Supabase canonical catalogue and Smart Search. Do not replace it with a chain-specific catalogue.
2. Keep the new `beavy_fulfillment_nodes` and `beavy_fulfillment_rules` model.
3. Implement List / Plan / Compare as the primary basket experience.
4. Use retailer grouping in the main view and exact fulfilment nodes in detail.
5. Make price history and price quality follow-on features, not blockers for the first basket MVP.
6. Prioritise completeness, source freshness and known final fees over a visually impressive “lowest price” number.
7. Build partner feed support as an intake contract; do not assume access to TPrice APIs or retailer integrations.

## 7. Public sources

- TPrice product comparison and UX case study: https://yarunin.vercel.app/tprice/price-comparison
- TPrice backend and infrastructure case study: https://yarunin.vercel.app/tprice/backend
- TPrice retailer partnerships, Serbia: https://www.tprice.app/en/srb/for-stores
- TPrice retailer partnerships, Croatia: https://www.tprice.app/en/hrv/for-stores
- TPrice manufacturer partnerships, Croatia: https://www.tprice.app/en/hrv/for-manufacturers
- TPrice public Croatia catalogue: https://www.tprice.app/en/hrv
- TPrice app listing and published feature summary: https://play.google.com/store/apps/details?id=com.tprice.mobile
- Serbia open-data portal reuse listing for TPrice: https://data.gov.rs/sr/reuses/tprice-uporedi-cene/

**Source limitation:** The sources above describe product behaviour, high-level data practices, stack choices and partnership options. They do not publish TPrice's private backend API contract, detailed database schema or retailer-feed specification. Any implementation detail not explicitly published is marked here as a recommendation for Beavy, not a TPrice fact.
