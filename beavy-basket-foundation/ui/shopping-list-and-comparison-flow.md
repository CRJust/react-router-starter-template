# Beavy UI proposal: build a list fast, compare faster

Version: UX direction v1  
Date: 10 November 2026  
Status: proposed flow, not yet implemented in the primary app.

## Product goal

A shopper should be able to:
1. Start a list without navigating through categories.
2. Add several exact products in a continuous flow.
3. See comparison progress without pressing a separate button after every change.
4. Understand the trade-off between fewer shopping stops and a lower total.
5. Trust that the displayed total includes known fulfilment costs and clearly exposes incomplete data.

The list is the main workspace. Product search and basket comparison should feel like one continuous task, not three separate screens.

## 1. Main screen: the shopping list is the home screen

### Header
- Beavy mark and a compact context selector: selected city + shopping mode (physical stores / delivery).
- Do not request location on every visit. Let the user change it from the header.
- The selected city/channel must remain visible because prices and availability depend on them.

### Always-visible add field
Label: **Adaugă produse în listă**

The search field is the primary action and stays at the top while scrolling. Secondary input methods can be shown as compact icons:
- Barcode scan.
- Voice input.
- Paste a text list.

Do not give these secondary methods equal visual weight to typing in the first MVP.

### Search results
Show results inline below the field; never navigate to a separate search page merely to add one product.

Each result should contain:
- Small product image.
- Product name.
- Brand and exact package/variant (for example, 1 L, 500 g).
- A concise price signal when a verified offer exists (for example, “de la 8,49 lei · 4 magazine”).
- A clear plus button.

Interaction:
- Tap plus: add the exact product and keep the user in the list/search flow.
- The field clears and remains focused for the next item.
- If the same canonical product is added again, increment its quantity instead of creating a duplicate row.
- If a query matches several sizes, brands or flavours, make the exact variant obvious before adding. Never silently swap one variant for another.
- Search suggestions should tolerate small spelling mistakes and common Romanian diacritics variations.

### Fast paths for repeat shopping
When the field is empty, show a short horizontal section:
- **Cumpărate recent** or **Adăugate recent**.
- Saved lists such as “Săptămânal”.
- A short “Adaugă din nou” action for a previous basket.

Keep this section small. Do not let category tiles push the add field and the current list below the fold. Categories are a fallback for discovery, not the primary list-building path.

### Current list
Rows should be compact and scannable:
- Product image, name, brand/package size.
- Quantity stepper (− / count / +).
- Remove action.
- Optional expand for product details and available stores.

Avoid forcing the user to open a product detail page to change quantity.

## 2. Live comparison: visible before the user asks for it

A compact sticky panel at the bottom of the list should update after each item is added, removed or repriced.

When there is enough complete data:
- Main line: **Cel mai bun coș complet: 184,50 lei**
- Context: **2 magazine · economisești 12,30 lei față de un singur magazin**
- CTA: **Vezi comparația**

When the data is incomplete:
- Show coverage, e.g. **9 din 10 produse găsite**.
- Explain what is missing or which cost is unknown.
- CTA: **Vezi ce lipsește**, not “Cel mai ieftin coș”.

Important:
- Start/refresh comparison after a list mutation, not on every keystroke.
- Debounce rapid successive list changes and cancel or ignore stale responses.
- Cache eligible offers by exact product ID, node and freshness window.
- Recompute the totals incrementally where safe.
- A partial basket must never be presented as the cheapest complete basket.
- Unknown delivery/service/packaging fees must not be treated as zero.
- If costs are unknown, show “Total incomplet” or a range only when the range is mathematically and factually supported. Never invent an exact final total.

The user should be able to continue adding products while a comparison refreshes. Show a quiet progress state; do not block the list.

## 3. Comparison screen: one glance, one decision

Use two simple sections or tabs:

### A. Planuri — where should I buy?

Lead with the most useful trade-off, not a long retailer table.

Recommended hierarchy:
1. **Un singur magazin** — easiest, all available items at one retailer.
2. **Două magazine** — recommended compromise between time and savings.
3. **Cel mai mic preț** — lowest supported total, with up to three destinations in the first release.

Each option card must show:
- Total payable amount, or a clear incomplete status.
- Number of destinations/stops.
- Number of requested products covered (for example, 15/15).
- Savings relative to the complete one-store plan, but only when both plans are complete and comparable.
- A short label: **Mai comod**, **Echilibru**, or **Cel mai ieftin**.

Default emphasis should be on one and two stores. The maximum-savings plan can be visually secondary or expandable. Do not hide it; just do not make a route through many shops look like the default recommendation.

### B. Magazine — compare retailers

Rank retailers by the basket total, but show coverage beside every total:
- Complete: 15/15.
- Partial: 12/15, with missing products available on expansion.
- Unavailable: no valid comparable basket.

Do not allow a lower partial total to outrank or visually masquerade as the cheapest complete basket.

Group by retailer by default. Allow expansion to the exact physical store or delivery node, where prices, stock or fees differ. Show a price range across locations only when it is calculated from fresh, comparable offers and label how many locations contributed.

### Destination details

When a user opens a plan:
- Group items by destination/store.
- Show each destination subtotal.
- Show delivery, service, packaging and small-order fees separately.
- Show SGR separately from product prices.
- For delivery, show the selected delivery area/online service.
- Clearly label source and last update where available.

## 4. Recommended mobile interaction flow

The intended loop is:

1. Open Beavy → cursor goes straight to “Adaugă produse”.
2. Type “lapte” → exact product/variant suggestions appear.
3. Tap plus → product is added; search remains ready.
4. Type “ouă” → add; type “pâine” → add.
5. Sticky comparison panel updates in the background.
6. Tap “Vezi comparația” at any time.
7. Choose the plan based on total, coverage and number of destinations.

The user should not have to:
- Open categories to start.
- Open a product detail page for every item.
- Press a “Compare” button after each addition.
- Re-enter the city or shopping mode.
- Guess whether a total includes delivery.
- Discover only at the end that a supposedly cheapest basket was incomplete.

## 5. Input methods and scope

### MVP — implement first
- Fast text search with inline results.
- Add from results without leaving the list.
- Quantity steppers and duplicate aggregation.
- Recent products / saved list shortcut.
- Sticky comparison summary that refreshes after basket changes.
- Plan comparison with coverage and explicit fees.

### Next
- Paste multiple lines or comma-separated items and resolve them into canonical products.
- Barcode scanning.
- Saved/favourite products and price alerts.
- Voice input, once Romanian recognition and product matching are reliable enough.

Do not put all input methods in the first release. Search quality and the add loop matter more.

## 6. Empty state and examples

Empty state:
- Main heading: **Ce punem pe listă?**
- Field: **Caută produse sau scanează codul de bare**
- Small helper: **Adaugă produsele pe rând. Comparăm coșul pe măsură ce îl construiești.**
- Optional starter suggestions: Lapte, Ouă, Pâine, Cafea.

After first item:
- Show the first row immediately.
- Keep the add field visible.
- Show a small progress/status line: **1 produs în listă**.

Do not display a made-up saving or estimated basket total before the data supports it.

## 7. Performance and interaction targets to validate

These are proposed product targets, not measured results:
- Search suggestions should feel immediate; use cached/local results where possible and avoid full-page transitions.
- For a common exact query, aim for one tap from suggestion to added item.
- After adding an item, the user can immediately type the next query without dismissing a modal.
- A comparison refresh should not freeze scrolling or input.
- Keep the comparison panel visible without covering the final list row or keyboard controls.

Validate with 5–8 Romanian shoppers using realistic tasks:
- Build a 10-item list from memory.
- Add a repeat basket.
- Find the cheapest complete plan.
- Understand why an apparently cheaper plan is incomplete.
- Decide whether savings justify an extra stop.

Measure:
- Time to add 5 and 10 items.
- Taps per added product.
- Search-to-add success rate.
- Percentage of people who notice the coverage count.
- Time from last list change to a useful comparison.
- Whether shoppers choose a plan they can realistically follow.

## 8. Design principles

- Beavy should feel quick and calm, not like a supermarket catalogue.
- One primary action per screen state.
- Search first; categories second.
- Exact product identity over approximate matches.
- Visible coverage over misleading low totals.
- Show total payable cost, not just shelf-price subtotal.
- Keep the list usable while comparison refreshes.
- Use the Beavy brand book for typography, colours, illustration and component styling; this document defines interaction and information hierarchy, not final visual tokens.

## 9. Benchmark evidence and references

TPrice's published case study describes a List / Plan / Compare basket flow. Its reported basket choices were 44% one-store, 35% two-store and 21% cheapest split. It also reports 79% of selected plans used one or two stores. These figures come from TPrice's own users and should be treated as directional, not predicted Beavy conversion.

The TPrice case study describes product-level barcode/name search, chain chips, and basket coverage such as 15/15. Its usability rounds found that showing coverage reduced users mistakenly selecting a low-cost but incomplete chain.

Sources:
- TPrice product and basket case study: https://yarunin.vercel.app/tprice/price-comparison
- TPrice Serbia retailer page and simple “build list → compare → choose” explanation: https://www.tprice.app/en/srb/for-stores
- Baymard online grocery UX research: https://baymard.com/research/online-grocery
- TPrice app listing: https://play.google.com/store/apps/details?id=com.tprice.mobile

## 10. Explicitly not part of this change

This file is a UI/UX proposal only. It does not change the primary app, deploy anything, create a React screen, or claim the live comparison API exists. The main application source remains on the user's Mac until it is made available in the correct application repository.
