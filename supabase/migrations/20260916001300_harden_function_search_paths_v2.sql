-- Pin function search_path to prevent search_path injection.
ALTER FUNCTION public.jfs_laundry_subscription_allows_order(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.jfs_laundry_enforce_order_subscription() SET search_path = public, pg_temp;
ALTER FUNCTION public.jfs_get_my_tenant_context() SET search_path = public, pg_temp;
