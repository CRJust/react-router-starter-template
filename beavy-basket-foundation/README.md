# Beavy basket foundation

This is an isolated working area in the connected GitHub repository. It is **not** the local primary Beavy application and is not wired into the repository root's build or deployment.

## Supabase state

The following migrations are already applied to the connected Supabase project. Keep their source files here for version control and future local synchronization; **do not apply them again to the live database**.

- `20261110003811_basket_fulfillment_nodes_and_rules`
- `20261110004015_restrict_fulfillment_public_write_grants`

The resulting schema adds:

- `public.beavy_fulfillment_nodes` — physical stores, delivery areas, online services and pickup points.
- `public.beavy_fulfillment_rules` — time-bounded order fees and thresholds.
- `public.beavy_product_offers.fulfillment_node_id` — optional link from an offer to its exact fulfillment node.

Both new tables have RLS enabled. Public roles have SELECT only; writes are reserved for `service_role`.

## UI/UX direction

See [`ui/shopping-list-and-comparison-flow.md`](ui/shopping-list-and-comparison-flow.md) for the proposed mobile-first flow: continuous quick-add, live basket comparison, visible coverage and one/two/three-destination plans.

## Research benchmark

See [`research/tprice-benchmark.md`](research/tprice-benchmark.md) for the Serbia/Croatia TPrice product and backend benchmark, Beavy-specific recommendations, and a phased implementation sequence.

## Contents

- `src/types/basket.ts` — draft API contracts and request validation.
- `supabase/migrations/20261110003811_basket_fulfillment_nodes_and_rules.sql` — source for the applied schema migration.
- `supabase/migrations/20261110004015_restrict_fulfillment_public_write_grants.sql` — source for the applied permission hardening.

## Comparison rules

1. Products are matched by the exact canonical `beavy_products.id`; do not silently replace brands, variants or package sizes.
2. Only fresh, verified, in-stock offers linked to a known `fulfillment_node_id` can enter optimization.
3. A `NULL` fee means unknown, not free. Use zero only when free is explicitly confirmed.
4. `price` is the price of one sellable package; `unit_price` is for normalized unit-price comparison.
5. A result is fully comparable only when every requested item and every applicable cost is known.
6. Compare both a single-store basket and a split basket, with a hard cap of three destinations.
7. Include delivery, service, packaging and small-order fees in each destination's total. Keep SGR separate.
8. Do not claim savings when either plan is incomplete or its totals are not comparable.

## API direction

- Worker endpoint: `POST /api/basket/compare`
- Request: `BasketInput`
- Response: `BasketComparisonResult`

Money is represented as integer minor units (bani) at the API boundary. Convert PostgreSQL NUMERIC values with decimal-safe arithmetic on the server.

## Not implemented yet

The optimizer, Worker endpoint, database read queries, basket persistence and application UI are not implemented in this folder. The TypeScript contracts are a draft and must be type-checked and adapted to the actual local application before integration.

## Important repository note

This folder is on the `beavy-foundation` branch of `CRJust/react-router-starter-template`. That repository is public and is a React Router + Cloudflare starter template. Do not place secrets, API keys, service-role keys or private environment values here. The local primary application on the Mac remains the source of truth.
