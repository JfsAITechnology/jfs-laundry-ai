create or replace function public.jfs_public_tenant_catalog(p_tenant_code text)
returns table(tenant_code text,business_name text,address text,city text,province text,whatsapp text,phone text,ai_enabled boolean)
language sql stable security definer
set search_path = public, pg_temp
as $$
  select t.tenant_code,t.business_name,t.address,t.city,t.province,t.whatsapp,t.phone,t.ai_enabled
  from public.tenants t
  where t.tenant_code=trim(p_tenant_code)
    and t.status not in ('archived','inactive')
  limit 1;
$$;

create or replace function public.jfs_public_products(p_tenant_code text)
returns table(name text,description text,price numeric,category text)
language sql stable security definer
set search_path = public, pg_temp
as $$
  select p.name,p.description,p.price,p.category
  from public.products p
  join public.tenants t on t.id=p.tenant_id
  where t.tenant_code=trim(p_tenant_code)
    and t.status not in ('archived','inactive')
    and p.is_active=true
    and p.price>0
  order by p.name;
$$;

revoke all on function public.jfs_public_tenant_catalog(text) from public;
revoke all on function public.jfs_public_products(text) from public;
grant execute on function public.jfs_public_tenant_catalog(text) to anon, authenticated;
grant execute on function public.jfs_public_products(text) to anon, authenticated;
