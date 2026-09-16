-- STEP 2: RLS + Public Data Security hardening
-- Remove direct anonymous access to all internal public-schema tables.
REVOKE ALL ON TABLE public.jfs_admins FROM anon, authenticated;
REVOKE ALL ON TABLE public.jfs_knowledge FROM anon;
REVOKE ALL ON TABLE public.jfs_laundry_subscription_plans FROM anon, authenticated;
REVOKE ALL ON TABLE public.jfs_laundry_subscription_requests FROM anon;
REVOKE ALL ON TABLE public.jfs_order_items FROM anon;
REVOKE ALL ON TABLE public.jfs_order_notifications FROM anon;
REVOKE ALL ON TABLE public.jfs_order_status_history FROM anon;
REVOKE ALL ON TABLE public.jfs_orders FROM anon;
REVOKE ALL ON TABLE public.products FROM anon;
REVOKE ALL ON TABLE public.tenant_users FROM anon;
REVOKE ALL ON TABLE public.tenants FROM anon;
GRANT SELECT ON TABLE public.jfs_laundry_subscription_plans TO anon, authenticated;

ALTER TABLE public.jfs_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jfs_laundry_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jfs_laundry_subscription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jfs_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jfs_order_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jfs_order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jfs_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Rebuild the public tenant view without the internal tenant UUID.
DROP VIEW public.jfs_public_tenant_catalog;
CREATE VIEW public.jfs_public_tenant_catalog
WITH (security_barrier = true)
AS
SELECT tenant_code, business_name, business_type, logo_url, whatsapp, phone, address, city, province, ai_enabled
FROM public.tenants
WHERE status IN ('active','trial');

-- Public views are read-only client surfaces.
REVOKE ALL ON TABLE public.jfs_public_tenant_catalog FROM anon, authenticated;
REVOKE ALL ON TABLE public.jfs_public_products FROM anon, authenticated;
REVOKE ALL ON TABLE public.jfs_public_knowledge FROM anon, authenticated;
GRANT SELECT ON TABLE public.jfs_public_tenant_catalog TO anon, authenticated;
GRANT SELECT ON TABLE public.jfs_public_products TO anon, authenticated;
GRANT SELECT ON TABLE public.jfs_public_knowledge TO anon, authenticated;

-- Subscription status is internal tenant/admin information.
REVOKE ALL ON TABLE public.jfs_laundry_subscription_status FROM anon, authenticated;
