-- Legacy public catalog views are not used by the current JFS Laundry AI frontend/RPC workflow.
-- Remove them from the exposed public schema so they cannot become an accidental RLS bypass.
DROP VIEW IF EXISTS public.jfs_public_tenant_catalog;
DROP VIEW IF EXISTS public.jfs_public_products;
DROP VIEW IF EXISTS public.jfs_public_knowledge;
