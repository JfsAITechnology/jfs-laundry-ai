import { supabase, getSession } from './auth.js';

const ADMIN_WA_NUMBER='6282230010172';
const PLAN_MAP={trial6:'TRIAL-6D',m1:'1M',m3:'3M',m6:'6M',y1:'1Y',custom:'CUSTOM'};

async function resolveTenantContext(){
  const params=new URLSearchParams(location.search);
  const ref=params.get('id')||localStorage.getItem('jfs_current_tenant');
  const session=await getSession();
  if(!session) throw new Error('LOGIN_REQUIRED');
  let {data:tenant,error}=await supabase.from('tenants').select('id,tenant_code,business_name,whatsapp,phone').eq('tenant_code',ref||'').maybeSingle();
  if(error) throw error;
  if(!tenant && ref && /^[0-9a-f-]{36}$/i.test(ref)){
    const r=await supabase.from('tenants').select('id,tenant_code,business_name,whatsapp,phone').eq('id',ref).maybeSingle();
    if(r.error) throw r.error; tenant=r.data;
  }
  if(!tenant){
    const m=await supabase.from('tenant_users').select('tenant_id').eq('user_id',session.user.id).eq('is_active',true).in('role',['owner','admin']).limit(1).maybeSingle();
    if(m.error) throw m.error;
    if(m.data?.tenant_id){const r=await supabase.from('tenants').select('id,tenant_code,business_name,whatsapp,phone').eq('id',m.data.tenant_id).maybeSingle();if(r.error)throw r.error;tenant=r.data;}
  }
  if(!tenant) throw new Error('TENANT_NOT_FOUND');
  return {tenantId:tenant.id,tenantCode:tenant.tenant_code,tenantName:tenant.business_name||tenant.tenant_code,phone:tenant.whatsapp||tenant.phone||''};
}

async function orderSubscription(planId,packageName,price){
  try{
    const dbPlanId=PLAN_MAP[planId]||planId;
    const tenant=await resolveTenantContext();
    if(dbPlanId==='CUSTOM') throw new Error('CUSTOM_PLAN_REQUIRES_CONFIGURATION');
    const {data,error}=await supabase.rpc('jfs_request_laundry_subscription',{p_plan_id:dbPlanId,p_notes:`Request dari Subscription page: ${packageName}`});
    if(error) throw error;
    localStorage.setItem('jfs_current_tenant',tenant.tenantId);
    const harga=price?`Rp ${Number(price).toLocaleString('id-ID')}`:'Gratis / Custom';
    const message=`*HALO ADMIN JFS AI TECHNOLOGY*%0A%0A`+`Saya mengajukan subscription *JFS Laundry AI*:%0A`+`🏪 *Laundry*: ${encodeURIComponent(tenant.tenantName)}%0A`+`🆔 *Tenant ID*: ${encodeURIComponent(tenant.tenantCode)}%0A`+`📦 *Paket*: ${encodeURIComponent(packageName)}%0A`+`💰 *Harga*: ${encodeURIComponent(harga)}%0A%0A`+`Mohon prosedur pembayaran dan aktivasi. Terima kasih!`;
    window.open(`https://wa.me/${ADMIN_WA_NUMBER}?text=${message}`,'_blank');
    alert(`✅ Permintaan ${packageName} sudah tercatat.\n\nStatus: ${data?.status||'Pending'}\nTenant: ${tenant.tenantName}`);
  }catch(error){
    console.error(error);
    const msg=String(error?.message||error);
    const friendly=msg.includes('SUBSCRIPTION_REQUEST_EXISTS')?'Masih ada permintaan subscription yang menunggu diproses. Tunggu aktivasi atau pembayaran sebelumnya selesai.':msg.includes('CUSTOM_PLAN_REQUIRES_CONFIGURATION')?'Paket Custom belum dapat dipilih sebelum harga dan durasi ditentukan.':msg.includes('LOGIN_REQUIRED')?'Silakan login terlebih dahulu.':msg.includes('TENANT_ACCESS_DENIED')?'Akun tidak memiliki akses tenant.':msg;
    alert(`Gagal mengirim permintaan subscription: ${friendly}`);
  }
}

window.addEventListener('DOMContentLoaded',()=>{window.orderSubscription=orderSubscription;});