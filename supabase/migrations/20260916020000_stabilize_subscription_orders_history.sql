-- JFS Laundry AI stabilization: subscription lifecycle + order history/omzet.

create unique index if not exists jfs_laundry_subscription_requests_one_open_per_tenant
  on public.jfs_laundry_subscription_requests (tenant_id)
  where status in ('Pending','Payment');

alter table public.jfs_orders add column if not exists archived_at timestamptz;

drop function if exists public.jfs_get_my_laundry_subscription_summary();
create function public.jfs_get_my_laundry_subscription_summary()
returns table(tenant_id uuid,tenant_code text,tenant_status text,plan_id text,plan_name text,plan_days integer,subscription_status text,activated_at timestamptz,expires_at timestamptz,remaining_days integer,pending_plan_id text,pending_plan_name text,pending_status text,pending_requested_at timestamptz)
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid();v_tenant uuid;v_active record;v_pending record;v_expires timestamptz;
begin
 if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
 select tu.tenant_id into v_tenant from public.tenant_users tu where tu.user_id=v_user and tu.is_active=true and tu.role in('owner','admin') order by case when tu.role='owner' then 0 else 1 end,tu.created_at asc limit 1;
 if v_tenant is null then return; end if;
 select r.plan_id,r.status,r.activated_at,p.name,p.days into v_active from public.jfs_laundry_subscription_requests r left join public.jfs_laundry_subscription_plans p on p.id=r.plan_id where r.tenant_id=v_tenant and r.status='Active' order by r.activated_at desc nulls last,r.requested_at desc limit 1;
 select r.plan_id,r.status,r.requested_at,p.name into v_pending from public.jfs_laundry_subscription_requests r left join public.jfs_laundry_subscription_plans p on p.id=r.plan_id where r.tenant_id=v_tenant and r.status in('Pending','Payment') order by r.requested_at desc limit 1;
 select t.status,t.tenant_code,t.trial_started_at,t.trial_ends_at into tenant_status,tenant_code,activated_at,v_expires from public.tenants t where t.id=v_tenant;
 tenant_id:=v_tenant;
 if v_active.plan_id is not null then plan_id:=v_active.plan_id;plan_name:=v_active.name;plan_days:=v_active.days;activated_at:=v_active.activated_at;v_expires:=v_active.activated_at+make_interval(days=>v_active.days); else plan_id:='TRIAL-6D';plan_name:='Trial 6 Hari';plan_days:=6;end if;
 expires_at:=v_expires;
 if v_expires is null then subscription_status:='Belum Aktif';remaining_days:=null;elsif v_expires<now() then subscription_status:='Expired';remaining_days:=0;elsif v_active.plan_id is null then subscription_status:=case when v_expires<=now()+interval '1 day' then 'Akan Berakhir' else 'Trial' end;remaining_days:=greatest(0,ceil(extract(epoch from(v_expires-now()))/86400)::integer);elsif v_expires<=now()+interval '7 days' then subscription_status:='Akan Berakhir';remaining_days:=greatest(0,ceil(extract(epoch from(v_expires-now()))/86400)::integer);else subscription_status:='Aktif';remaining_days:=greatest(0,ceil(extract(epoch from(v_expires-now()))/86400)::integer);end if;
 pending_plan_id:=v_pending.plan_id;pending_plan_name:=v_pending.name;pending_status:=v_pending.status;pending_requested_at:=v_pending.requested_at;return next;
end;$$;
revoke execute on function public.jfs_get_my_laundry_subscription_summary() from public,anon;grant execute on function public.jfs_get_my_laundry_subscription_summary() to authenticated;

create or replace function public.jfs_admin_archive_order(p_tenant_id uuid,p_order_id uuid) returns boolean language plpgsql security definer set search_path=public as $$ begin if not(public.jfs_is_super_admin() or exists(select 1 from public.tenant_users tu where tu.tenant_id=p_tenant_id and tu.user_id=auth.uid() and tu.is_active=true and tu.role in('owner','admin'))) then raise exception 'TENANT_ACCESS_DENIED';end if;update public.jfs_orders set archived_at=now(),updated_at=now() where id=p_order_id and tenant_id=p_tenant_id and status in('completed','cancelled');return found;end;$$;
create or replace function public.jfs_admin_restore_order(p_tenant_id uuid,p_order_id uuid) returns boolean language plpgsql security definer set search_path=public as $$ begin if not(public.jfs_is_super_admin() or exists(select 1 from public.tenant_users tu where tu.tenant_id=p_tenant_id and tu.user_id=auth.uid() and tu.is_active=true and tu.role in('owner','admin'))) then raise exception 'TENANT_ACCESS_DENIED';end if;update public.jfs_orders set archived_at=null,updated_at=now() where id=p_order_id and tenant_id=p_tenant_id;return found;end;$$;
revoke execute on function public.jfs_admin_archive_order(uuid,uuid),public.jfs_admin_restore_order(uuid,uuid) from public,anon;grant execute on function public.jfs_admin_archive_order(uuid,uuid),public.jfs_admin_restore_order(uuid,uuid) to authenticated;

drop function if exists public.jfs_admin_history_orders(uuid);
create function public.jfs_admin_history_orders(p_tenant_id uuid) returns table(id uuid,external_id text,status text,total_amount numeric,payment_status text,payment_method text,notes text,created_at timestamptz,updated_at timestamptz,archived_at timestamptz) language sql security definer set search_path=public as $$ select o.id,o.external_id,o.status,o.total_amount,o.payment_status,o.payment_method,o.notes,o.created_at,o.updated_at,o.archived_at from public.jfs_orders o where o.tenant_id=p_tenant_id and o.status in('completed','cancelled') and o.archived_at is null and(public.jfs_is_super_admin() or exists(select 1 from public.tenant_users tu where tu.tenant_id=o.tenant_id and tu.user_id=auth.uid() and tu.is_active=true and tu.role in('owner','admin'))) order by o.created_at desc;$$;

drop function if exists public.jfs_admin_omzet_orders(uuid);
create function public.jfs_admin_omzet_orders(p_tenant_id uuid) returns table(id uuid,external_id text,status text,total_amount numeric,payment_status text,notes text,created_at timestamptz) language sql security definer set search_path=public as $$ select o.id,o.external_id,o.status,o.total_amount,o.payment_status,o.notes,o.created_at from public.jfs_orders o where o.tenant_id=p_tenant_id and o.status='completed' and o.payment_status='paid' and o.archived_at is null and(public.jfs_is_super_admin() or exists(select 1 from public.tenant_users tu where tu.tenant_id=o.tenant_id and tu.user_id=auth.uid() and tu.is_active=true and tu.role in('owner','admin'))) order by o.created_at desc;$$;
