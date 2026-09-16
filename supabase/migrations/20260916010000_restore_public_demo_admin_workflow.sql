-- Public demo is intentionally a sandbox tenant. These existing admin RPCs already
-- hard-lock anonymous access to JFS-LAUNDRY-DEMO-001 in their function bodies.
grant execute on function public.jfs_get_tenant_context_by_code(text) to anon, authenticated;
grant execute on function public.jfs_admin_recent_orders(uuid) to anon, authenticated;
grant execute on function public.jfs_admin_list_products_v2() to anon, authenticated;
grant execute on function public.jfs_admin_list_products_v2(uuid) to authenticated;
grant execute on function public.jfs_admin_update_tenant(uuid,text,text,text) to anon, authenticated;
grant execute on function public.jfs_admin_upsert_product(uuid,uuid,text,numeric) to anon, authenticated;
grant execute on function public.jfs_admin_deactivate_product(uuid,uuid) to anon, authenticated;
grant execute on function public.jfs_admin_update_order(uuid,uuid,text,text) to anon, authenticated;

-- Reset remains authenticated-only; the public demo dashboard must never expose it.
revoke execute on function public.jfs_reset_demo_tenant(text) from anon, authenticated;
grant execute on function public.jfs_reset_demo_tenant(text) to authenticated;
