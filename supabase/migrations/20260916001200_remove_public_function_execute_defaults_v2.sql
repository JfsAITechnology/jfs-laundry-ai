-- PostgreSQL grants EXECUTE to PUBLIC by default on new functions.
-- Remove implicit public access so anonymous callers cannot reach privileged RPCs.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Only these three endpoints are intentionally callable without login.
GRANT EXECUTE ON FUNCTION public.jfs_create_customer_order(text,text,text,text,text,numeric,text,text,text,text,text,text) TO anon;
GRANT EXECUTE ON FUNCTION public.jfs_get_tenant_context_by_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.jfs_track_customer_order(text,text,text) TO anon;
