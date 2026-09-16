create extension if not exists pg_cron with schema extensions;

create or replace function public.jfs_laundry_expire_subscriptions()
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  update public.tenants t
  set status = 'expired', updated_at = now()
  where t.status in ('trial','active')
    and (
      (t.trial_started_at is not null and t.trial_ends_at is not null and t.trial_ends_at <= now()
       and not exists (
         select 1
         from public.jfs_laundry_subscription_requests r
         join public.jfs_laundry_subscription_plans p on p.id = r.plan_id
         where r.tenant_id = t.id
           and r.status = 'Active'
           and r.activated_at is not null
           and r.activated_at + make_interval(days => p.days) > now()
       ))
      or
      (exists (
         select 1
         from public.jfs_laundry_subscription_requests r
         join public.jfs_laundry_subscription_plans p on p.id = r.plan_id
         where r.tenant_id = t.id
           and r.status = 'Active'
           and r.activated_at is not null
           and r.activated_at + make_interval(days => p.days) <= now()
           and not exists (
             select 1
             from public.jfs_laundry_subscription_requests r2
             join public.jfs_laundry_subscription_plans p2 on p2.id = r2.plan_id
             where r2.tenant_id = t.id
               and r2.status = 'Active'
               and r2.activated_at is not null
               and r2.activated_at + make_interval(days => p2.days) > now()
           )
      ))
    );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.jfs_laundry_expire_subscriptions() from public;
grant execute on function public.jfs_laundry_expire_subscriptions() to postgres;

select cron.unschedule(jobid)
from cron.job
where jobname = 'jfs-laundry-subscription-expiry';

select cron.schedule(
  'jfs-laundry-subscription-expiry',
  '*/15 * * * *',
  $$select public.jfs_laundry_expire_subscriptions();$$
)
where not exists (
  select 1 from cron.job where jobname = 'jfs-laundry-subscription-expiry'
);

select public.jfs_laundry_expire_subscriptions();
