-- JFS Laundry AI stabilization: subscription UX lifecycle + order history archive/omzet rules.
-- Applied to the connected Supabase project during Step 8-13 stabilization.

create unique index if not exists jfs_laundry_subscription_requests_one_open_per_tenant
  on public.jfs_laundry_subscription_requests (tenant_id)
  where status in ('Pending','Payment');

alter table public.jfs_orders add column if not exists archived_at timestamptz;

-- The live database also contains the corresponding recreated functions:
-- jfs_get_my_laundry_subscription_summary()
-- jfs_admin_archive_order(uuid,uuid)
-- jfs_admin_restore_order(uuid,uuid)
-- jfs_admin_history_orders(uuid)
-- jfs_admin_omzet_orders(uuid)
-- These functions enforce tenant ownership and exclude archived orders from history/omzet.
