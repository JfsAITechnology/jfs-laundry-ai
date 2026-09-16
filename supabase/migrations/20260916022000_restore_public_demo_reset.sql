create or replace function public.jfs_public_demo_reset()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return public.jfs_reset_demo_tenant('JFS-LAUNDRY-DEMO-001');
end;
$$;

revoke all on function public.jfs_public_demo_reset() from public;
grant execute on function public.jfs_public_demo_reset() to anon, authenticated;
