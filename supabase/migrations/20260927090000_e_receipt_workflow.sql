-- E-Receipt workflow: initial receipt notification, unpaid-first payment state, status/payment history, secure receipt data
create or replace function public.jfs_create_customer_order(
  p_tenant_code text,p_external_id text,p_name text,p_phone text,p_service text,p_quantity numeric,p_unit text,
  p_delivery text,p_address text,p_pickup_time text,p_notes text,p_payment_method text
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_tenant public.tenants%rowtype; v_product public.products%rowtype; v_order public.jfs_orders%rowtype; v_total numeric; v_token text;
begin
  if coalesce(trim(p_tenant_code),'')='' then raise exception 'INVALID_TENANT'; end if;
  if p_external_id is null or p_external_id !~ '^ORD-[A-Z0-9]{8,32}$' then raise exception 'INVALID_ORDER_ID'; end if;
  if coalesce(trim(p_name),'')='' or coalesce(trim(p_phone),'')='' then raise exception 'CUSTOMER_REQUIRED'; end if;
  if coalesce(p_quantity,0)<=0 then raise exception 'INVALID_QUANTITY'; end if;
  if lower(coalesce(p_unit,''))<>'kg' then raise exception 'INVALID_UNIT'; end if;
  if lower(coalesce(p_payment_method,'')) not in ('cash','transfer','qris') then raise exception 'INVALID_PAYMENT_METHOD'; end if;
  select * into v_tenant from public.tenants where tenant_code=trim(p_tenant_code) limit 1;
  if not found then raise exception 'TENANT_NOT_FOUND'; end if;
  if not public.jfs_laundry_subscription_allows_order(v_tenant.id) then raise exception 'SUBSCRIPTION_EXPIRED'; end if;
  select * into v_product from public.products where tenant_id=v_tenant.id and is_active=true and lower(trim(name))=lower(trim(p_service)) limit 1;
  if not found or coalesce(v_product.price,0)<=0 then raise exception 'SERVICE_NOT_AVAILABLE'; end if;
  v_total:=round(p_quantity*v_product.price);
  if exists(select 1 from public.jfs_orders where tenant_id=v_tenant.id and external_id=upper(trim(p_external_id))) then raise exception 'ORDER_ID_EXISTS'; end if;
  v_token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
  insert into public.jfs_orders(tenant_id,status,total_amount,currency,source,external_id,tracking_token,payment_status,payment_method,notes)
  values(v_tenant.id,'pending',v_total,'IDR','customer_portal',upper(trim(p_external_id)),v_token,'unpaid',lower(p_payment_method),
    jsonb_build_object('name',trim(p_name),'phone',trim(p_phone),'service',trim(p_service),'quantity',p_quantity,'unit',upper(p_unit),'delivery',p_delivery,'address',p_address,'pickupTime',p_pickup_time,'notes',coalesce(p_notes,'-'))::text)
  returning * into v_order;
  insert into public.jfs_order_status_history(order_id,tenant_id,from_status,to_status,note) values(v_order.id,v_order.tenant_id,null,'pending','Order baru dibuat dari Customer Portal');
  insert into public.jfs_order_notifications(order_id,tenant_id,channel,title,message) values(v_order.id,v_order.tenant_id,'portal','E-Receipt siap','E-Receipt untuk order '||v_order.external_id||' sudah tersedia. Status cucian: Menunggu Jemput. Pembayaran: Belum Dibayar.');
  return jsonb_build_object('id',v_order.id,'external_id',v_order.external_id,'tracking_token',v_order.tracking_token,'status',v_order.status,'total_amount',v_order.total_amount,'payment_status',v_order.payment_status,'payment_method',v_order.payment_method,'created_at',v_order.created_at);
end; $$;

create or replace function public.jfs_admin_update_order(p_tenant_id uuid,p_order_id uuid,p_status text default null,p_payment_status text default null)
returns boolean language plpgsql security definer set search_path='public'
as $$
declare v_code text; v_old_status text; v_old_payment text; v_external_id text;
begin
  select tenant_code into v_code from public.tenants where id=p_tenant_id;
  if not (v_code='JFS-LAUNDRY-DEMO-001' or public.jfs_is_super_admin() or exists(select 1 from public.tenant_users tu where tu.tenant_id=p_tenant_id and tu.user_id=auth.uid() and tu.is_active=true and tu.role in ('owner','admin'))) then raise exception 'TENANT_ACCESS_DENIED'; end if;
  if p_status is not null and p_status not in ('pending','processing','ready','completed','cancelled') then raise exception 'INVALID_STATUS'; end if;
  if p_payment_status is not null and p_payment_status not in ('unpaid','pending','paid','failed','refunded') then raise exception 'INVALID_PAYMENT_STATUS'; end if;
  select status,payment_status,external_id into v_old_status,v_old_payment,v_external_id from public.jfs_orders where id=p_order_id and tenant_id=p_tenant_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  update public.jfs_orders set status=coalesce(p_status,status),payment_status=coalesce(p_payment_status,payment_status),paid_at=case when p_payment_status='paid' then coalesce(paid_at,now()) when p_payment_status is not null and p_payment_status<>'paid' then null else paid_at end,updated_at=now() where id=p_order_id and tenant_id=p_tenant_id;
  if p_status is not null and p_status<>v_old_status then
    insert into public.jfs_order_status_history(order_id,tenant_id,from_status,to_status,note) values(p_order_id,p_tenant_id,v_old_status,p_status,'Status diperbarui Admin/Kasir');
    insert into public.jfs_order_notifications(order_id,tenant_id,channel,title,message) values(p_order_id,p_tenant_id,'portal','Status pesanan diperbarui','Status order '||v_external_id||' berubah menjadi '||case p_status when 'pending' then 'Menunggu Jemput' when 'processing' then 'Dalam Proses' when 'ready' then 'Siap Diambil' when 'completed' then 'Selesai' when 'cancelled' then 'Dibatalkan' else p_status end||'.');
  end if;
  if p_payment_status is not null and p_payment_status<>v_old_payment then
    insert into public.jfs_order_notifications(order_id,tenant_id,channel,title,message) values(p_order_id,p_tenant_id,'portal','Status pembayaran diperbarui','Pembayaran order '||v_external_id||' berubah menjadi '||case p_payment_status when 'unpaid' then 'Belum Dibayar' when 'pending' then 'Menunggu Pembayaran' when 'paid' then 'LUNAS' when 'failed' then 'Gagal' when 'refunded' then 'Dikembalikan' else p_payment_status end||'.');
  end if;
  return true;
end; $$;

create or replace function public.jfs_track_customer_order(p_tenant_code text,p_external_id text,p_tracking_token text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_order public.jfs_orders%rowtype; v_history jsonb; v_notifications jsonb; v_tenant public.tenants%rowtype;
begin
  if coalesce(trim(p_tenant_code),'')='' or coalesce(trim(p_external_id),'')='' or coalesce(trim(p_tracking_token),'')='' then raise exception 'TRACKING_CREDENTIALS_REQUIRED'; end if;
  select o.* into v_order from public.jfs_orders o join public.tenants t on t.id=o.tenant_id where t.tenant_code=trim(p_tenant_code) and o.external_id=upper(trim(p_external_id)) and o.tracking_token=trim(p_tracking_token) limit 1;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  select * into v_tenant from public.tenants where id=v_order.tenant_id;
  select coalesce(jsonb_agg(jsonb_build_object('from_status',h.from_status,'to_status',h.to_status,'created_at',h.created_at,'note',h.note) order by h.created_at desc),'[]'::jsonb) into v_history from public.jfs_order_status_history h where h.order_id=v_order.id;
  select coalesce(jsonb_agg(jsonb_build_object('title',n.title,'message',n.message,'created_at',n.created_at) order by n.created_at desc),'[]'::jsonb) into v_notifications from public.jfs_order_notifications n where n.order_id=v_order.id;
  return jsonb_build_object('id',v_order.id,'external_id',v_order.external_id,'status',v_order.status,'total_amount',v_order.total_amount,'payment_status',v_order.payment_status,'payment_method',v_order.payment_method,'created_at',v_order.created_at,'updated_at',v_order.updated_at,'tracking_token',v_order.tracking_token,'notes',v_order.notes,'history',v_history,'notifications',v_notifications,'business_name',v_tenant.business_name,'whatsapp',coalesce(v_tenant.whatsapp,v_tenant.phone),'address',v_tenant.address,'city',v_tenant.city,'province',v_tenant.province);
end; $$;

revoke execute on function public.jfs_create_customer_order(text,text,text,text,text,numeric,text,text,text,text,text,text) from public,anon;
grant execute on function public.jfs_create_customer_order(text,text,text,text,text,numeric,text,text,text,text,text,text) to anon,authenticated;
revoke execute on function public.jfs_admin_update_order(uuid,uuid,text,text) from public,anon;
grant execute on function public.jfs_admin_update_order(uuid,uuid,text,text) to authenticated;