-- Beavy fulfillment locations and commercial rules.
create table public.beavy_fulfillment_nodes (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references public.beavy_retailers(id) on delete restrict,
  node_key text not null,
  name text not null,
  node_type text not null check (
    node_type in ('physical_store', 'delivery_area', 'online_service', 'pickup_point')
  ),
  fulfillment_channel text not null check (
    fulfillment_channel in ('store', 'delivery', 'online')
  ),
  city text not null,
  region text,
  country_code text not null default 'RO' check (char_length(country_code) = 2),
  postal_code text,
  address text,
  external_node_id text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  source_url text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint beavy_fulfillment_nodes_lat_lon_pair_check
    check ((latitude is null and longitude is null) or (latitude is not null and longitude is not null)),
  constraint beavy_fulfillment_nodes_latitude_check
    check (latitude is null or latitude between -90 and 90),
  constraint beavy_fulfillment_nodes_longitude_check
    check (longitude is null or longitude between -180 and 180),
  constraint beavy_fulfillment_nodes_retailer_node_key unique (retailer_id, node_key)
);

create unique index beavy_fulfillment_nodes_external_id_uidx
  on public.beavy_fulfillment_nodes (retailer_id, external_node_id)
  where external_node_id is not null;
create index beavy_fulfillment_nodes_active_city_idx
  on public.beavy_fulfillment_nodes (city, fulfillment_channel, retailer_id)
  where is_active is true;

create table public.beavy_fulfillment_rules (
  id uuid primary key default gen_random_uuid(),
  fulfillment_node_id uuid not null references public.beavy_fulfillment_nodes(id) on delete cascade,
  currency text not null default 'RON' check (currency = upper(currency) and char_length(currency) = 3),
  delivery_fee numeric(12,2) check (delivery_fee is null or delivery_fee >= 0),
  service_fee numeric(12,2) check (service_fee is null or service_fee >= 0),
  packaging_fee numeric(12,2) check (packaging_fee is null or packaging_fee >= 0),
  small_order_fee numeric(12,2) check (small_order_fee is null or small_order_fee >= 0),
  small_order_fee_threshold numeric(12,2) check (small_order_fee_threshold is null or small_order_fee_threshold >= 0),
  minimum_order_value numeric(12,2) check (minimum_order_value is null or minimum_order_value >= 0),
  free_delivery_threshold numeric(12,2) check (free_delivery_threshold is null or free_delivery_threshold >= 0),
  effective_from timestamptz not null default now(),
  effective_until timestamptz,
  observed_at timestamptz not null default now(),
  source text,
  source_url text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint beavy_fulfillment_rules_effective_window_check
    check (effective_until is null or effective_until > effective_from)
);

create index beavy_fulfillment_rules_active_window_idx
  on public.beavy_fulfillment_rules (fulfillment_node_id, observed_at desc)
  where is_active is true;

alter table public.beavy_product_offers
  add column fulfillment_node_id uuid
  references public.beavy_fulfillment_nodes(id) on delete set null;
create index beavy_product_offers_node_product_active_idx
  on public.beavy_product_offers (fulfillment_node_id, product_id, observed_at desc)
  where is_active is true and fulfillment_node_id is not null;

alter table public.beavy_fulfillment_nodes enable row level security;
alter table public.beavy_fulfillment_rules enable row level security;

create policy "Public can read active Beavy fulfillment nodes"
  on public.beavy_fulfillment_nodes for select to anon, authenticated
  using (is_active is true);

create policy "Public can read current active Beavy fulfillment rules"
  on public.beavy_fulfillment_rules for select to anon, authenticated
  using (
    is_active is true
    and effective_from <= now()
    and (effective_until is null or effective_until > now())
    and exists (
      select 1 from public.beavy_fulfillment_nodes n
      where n.id = fulfillment_node_id and n.is_active is true
    )
  );

grant select on public.beavy_fulfillment_nodes to anon, authenticated;
grant select on public.beavy_fulfillment_rules to anon, authenticated;
grant select, insert, update, delete on public.beavy_fulfillment_nodes to service_role;
grant select, insert, update, delete on public.beavy_fulfillment_rules to service_role;

comment on table public.beavy_fulfillment_nodes is
  'Beavy purchase destinations: physical stores, delivery areas, online services and pickup points.';
comment on table public.beavy_fulfillment_rules is
  'Time-bounded fulfillment costs and order thresholds. NULL means unknown, not zero.';
comment on column public.beavy_product_offers.fulfillment_node_id is
  'Optional exact purchase destination; NULL is retained for legacy offers without a verified location.';
comment on column public.beavy_fulfillment_rules.delivery_fee is
  'Known delivery fee. NULL means not verified or unknown; use 0 only when explicitly confirmed free.';
comment on column public.beavy_fulfillment_rules.free_delivery_threshold is
  'Product subtotal threshold for free delivery. NULL means unknown or not applicable.';
