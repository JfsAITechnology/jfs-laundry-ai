/* Production access gate: owner/admin must sign in and have an active trial/subscription. */
import { getSession, redirectToLogin, requireTenantRole } from './auth.js';
const page=(location.pathname.split('/').pop()||'').toLowerCase();
const gated=new Set(['admin.html','orders.html','history.html','omzet.html','subscription.html']);
if(gated.has(page)){
  const session=await getSession();
  if(!session){redirectToLogin(location.href);throw new Error('AUTH_REQUIRED')}
  const params=new URLSearchParams(location.search);
  let ref=params.get('id')||localStorage.getItem('jfs_current_tenant');
  if(!ref){
    const {data}=await (await import('./auth.js')).supabase.rpc('jfs_get_my_laundry_subscription_summary');
    ref=data?.[0]?.tenant_code||null;
  }
  if(!ref){location.href='login.html?next='+encodeURIComponent(location.href);throw new Error('TENANT_REQUIRED')}
  const access=await requireTenantRole(ref,['owner','admin'],{allowDemo:false});
  if(access.mode==='login'){redirectToLogin(location.href);throw new Error('AUTH_REQUIRED')}
  if(access.mode==='forbidden'){location.href='login.html?error=forbidden';throw new Error('FORBIDDEN')}
  if(access.tenant?.tenant_code){localStorage.setItem('jfs_current_tenant',access.tenant.tenant_code)}
  const {data,error}=await (await import('./auth.js')).supabase.rpc('jfs_get_my_laundry_subscription_summary');
  if(error)throw error;
  const s=data?.[0];
  if(s?.subscription_status==='Expired' && page!=='subscription.html'){
    location.href='subscription.html?id='+encodeURIComponent(s.tenant_code);
    throw new Error('SUBSCRIPTION_EXPIRED');
  }
}