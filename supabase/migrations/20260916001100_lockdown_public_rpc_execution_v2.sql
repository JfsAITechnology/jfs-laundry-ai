-- Never allow anonymous callers to execute authenticated/admin SECURITY DEFINER RPCs.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Re-open only the three intentionally public customer endpoints.
GRANT EXECUTE ON FUNCTION public.jfs_create_customer_order(text,text,text,text,text,numeric,text,text,text,text,text,text) TO anon;
GRANT EXECUTE ON FUNCTION public.jfs_get_tenant_context_by_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.jfs_track_customer_order(text,text,text) TO anon;

-- Authenticated users may use application RPCs; their SECURITY DEFINER bodies enforce authorization.
GRANT EXECUTE ON FUNCTION public.jfs_create_laundry_tenant(text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.jfs_get_my_tenant_context() TO authenticated;
GRANT EXECUTE ON FUNCTION public.jfs_user_tenant_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.jfs_is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.jfs_request_laundry_subscription(text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.jfs_reset_demo_tenant(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.jfs_super_admin_set_tenant_active(uuid,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.jfs_activate_laundry_subscription(uuid,text,text) TO authenticated;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname LIKE 'jfs_admin_%'
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated', r.proname, r.args);
  END LOOP;
END $$;
