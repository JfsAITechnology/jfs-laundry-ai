-- JFS Laundry AI: production trial standard = 30 days.
-- Trial is automatic, tied to the tenant's first trial_started_at, and is not a selectable plan.

create or replace function public.jfs_enforce_laundry_30_day_trial()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'trial' then
    new.trial_started_at := coalesce(new.trial_started_at, now());
    new.trial_ends_at := new.trial_started_at + interval '30 days';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_jfs_laundry_30_day_trial on public.tenants;
create trigger trg_jfs_laundry_30_day_trial
before insert on public.tenants
for each row
execute function public.jfs_enforce_laundry_30_day_trial();

-- Normalize existing trial tenants created under the legacy 6-day policy.
update public.tenants
set trial_ends_at = trial_started_at + interval '30 days',
    updated_at = now()
where status = 'trial'
  and trial_started_at is not null
  and (
    trial_ends_at is null
    or trial_ends_at < trial_started_at + interval '30 days'
  );

-- The free trial is automatic, not a customer-selectable subscription plan.
update public.jfs_laundry_subscription_plans
set is_active = false
where id = 'TRIAL-6D';

create or replace function public.jfs_get_my_laundry_subscription_summary()
returns table(
  tenant_id uuid,
  tenant_code text,
  tenant_status text,
  plan_id text,
  plan_name text,
  plan_days integer,
  subscription_status text,
  activated_at timestamptz,
  expires_at timestamptz,
  remaining_days integer,
  pending_plan_id text,
  pending_plan_name text,
  pending_status text,
  pending_requested_at timestamptz
)
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_tenant uuid;
  v_active record;
  v_pending record;
  v_trial_started timestamptz;
  v_expires timestamptz;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;

  select tu.tenant_id
    into v_tenant
  from public.tenant_users tu
  where tu.user_id=v_user
    and tu.is_active=true
    and tu.role in('owner','admin')
  order by case when tu.role='owner' then 0 else 1 end,tu.created_at asc
  limit 1;

  if v_tenant is null then return; end if;

  select r.plan_id,r.status,r.activated_at,p.name,p.days
    into v_active
  from public.jfs_laundry_subscription_requests r
  left join public.jfs_laundry_subscription_plans p on p.id=r.plan_id
  where r.tenant_id=v_tenant
    and r.status='Active'
  order by r.activated_at desc nulls last,r.requested_at desc
  limit 1;

  select r.plan_id,r.status,r.requested_at,p.name
    into v_pending
  from public.jfs_laundry_subscription_requests r
  left join public.jfs_laundry_subscription_plans p on p.id=r.plan_id
  where r.tenant_id=v_tenant
    and r.status in('Pending','Payment')
  order by r.requested_at desc
  limit 1;

  select t.status,t.tenant_code,t.trial_started_at,t.trial_ends_at
    into tenant_status,tenant_code,v_trial_started,v_expires
  from public.tenants t
  where t.id=v_tenant;

  tenant_id := v_tenant;

  if v_active.plan_id is not null then
    plan_id := v_active.plan_id;
    plan_name := v_active.name;
    plan_days := v_active.days;
    activated_at := v_active.activated_at;
    v_expires := v_active.activated_at + make_interval(days=>v_active.days);
  else
    plan_id := 'TRIAL-30D';
    plan_name := 'Trial Gratis 30 Hari';
    plan_days := 30;
    activated_at := v_trial_started;
  end if;

  expires_at := v_expires;

  if v_expires is null then
    subscription_status := 'Belum Aktif';
    remaining_days := null;
  elsif v_expires < now() then
    subscription_status := 'Expired';
    remaining_days := 0;
  elsif v_active.plan_id is null then
    subscription_status := case
      when v_expires <= now()+interval '1 day' then 'Akan Berakhir'
      else 'Trial'
    end;
    remaining_days := greatest(0,ceil(extract(epoch from(v_expires-now()))/86400)::integer);
  elsif v_expires <= now()+interval '7 days' then
    subscription_status := 'Akan Berakhir';
    remaining_days := greatest(0,ceil(extract(epoch from(v_expires-now()))/86400)::integer);
  else
    subscription_status := 'Aktif';
    remaining_days := greatest(0,ceil(extract(epoch from(v_expires-now()))/86400)::integer);
  end if;

  pending_plan_id := v_pending.plan_id;
  pending_plan_name := v_pending.name;
  pending_status := v_pending.status;
  pending_requested_at := v_pending.requested_at;
  return next;
end;
$$;

revoke execute on function public.jfs_get_my_laundry_subscription_summary() from public,anon;
grant execute on function public.jfs_get_my_laundry_subscription_summary() to authenticated;

revoke all on function public.jfs_enforce_laundry_30_day_trial() from public,anon,authenticated;
grant execute on function public.jfs_enforce_laundry_30_day_trial() to postgres;