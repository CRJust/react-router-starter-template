-- Restrict fulfillment public access to SELECT only.
revoke all privileges on table public.beavy_fulfillment_nodes from anon, authenticated;
revoke all privileges on table public.beavy_fulfillment_rules from anon, authenticated;
grant select on public.beavy_fulfillment_nodes to anon, authenticated;
grant select on public.beavy_fulfillment_rules to anon, authenticated;
