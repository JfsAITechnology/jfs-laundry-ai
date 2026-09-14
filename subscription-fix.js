import { supabase, getSession } from './auth.js';

const ADMIN_WA_NUMBER = '6282230010172';
const readJSON = (key, fallback) => { try { const value = JSON.parse(localStorage.getItem(key) || ''); return value ?? fallback; } catch { return fallback; } };

async function resolveTenantContext() {
  const params = new URLSearchParams(location.search);
  const ref = params.get('id') || localStorage.getItem('jfs_current_tenant') || 'demo-asosiasi';
  const session = await getSession();
  if (!session) {
    const tenants = readJSON('jfs_tenants', []);
    const tenant = Array.isArray(tenants) ? tenants.find(t => t.id === ref) : null;
    const cfg = readJSON(`tenant_cfg_${ref}`, {});
    return { demo: true, tenantId: ref, tenantName: cfg.name || tenant?.name || ref, phone: cfg.phone || cfg.waNumber || '' };
  }

  let { data: tenant, error } = await supabase.from('tenants')
    .select('id,tenant_code,business_name,whatsapp,phone')
    .eq('tenant_code', ref).maybeSingle();
  if (error) throw error;
  if (!tenant && /^[0-9a-f-]{36}$/i.test(ref)) {
    const result = await supabase.from('tenants')
      .select('id,tenant_code,business_name,whatsapp,phone')
      .eq('id', ref).maybeSingle();
    if (result.error) throw result.error;
    tenant = result.data;
  }
  if (!tenant) {
    const membership = await supabase.from('tenant_users').select('tenant_id').eq('user_id', session.user.id).eq('is_active', true).in('role', ['owner','admin']).limit(1).maybeSingle();
    if (membership.error) throw membership.error;
    if (membership.data?.tenant_id) {
      const result = await supabase.from('tenants').select('id,tenant_code,business_name,whatsapp,phone').eq('id', membership.data.tenant_id).maybeSingle();
      if (result.error) throw result.error;
      tenant = result.data;
    }
  }
  if (!tenant) throw new Error('Tenant tidak ditemukan.');
  return { demo: false, tenantId: tenant.id, tenantCode: tenant.tenant_code, tenantName: tenant.business_name || tenant.tenant_code, phone: tenant.whatsapp || tenant.phone || '' };
}

async function orderSubscription(planId, packageName, price) {
  try {
    const tenant = await resolveTenantContext();
    const harga = price ? `Rp ${Number(price).toLocaleString('id-ID')}` : 'Gratis / Custom';

    if (tenant.demo) {
      const requests = readJSON('jfs_subscription_requests', []);
      const list = Array.isArray(requests) ? requests : [];
      list.push({ id: `REQ-${Date.now()}`, tenantId: tenant.tenantId, tenantName: tenant.tenantName, phone: tenant.phone, planId, packageName, price, status: 'Pending', requestedAt: new Date().toISOString() });
      localStorage.setItem('jfs_subscription_requests', JSON.stringify(list));
    } else {
      const existing = await supabase.from('jfs_laundry_subscription_requests')
        .select('id,status').eq('tenant_id', tenant.tenantId).eq('plan_id', planId).eq('status', 'Pending').limit(1).maybeSingle();
      if (existing.error) throw existing.error;
      if (!existing.data) {
        const { error } = await supabase.from('jfs_laundry_subscription_requests').insert({
          tenant_id: tenant.tenantId,
          plan_id: planId,
          status: 'Pending',
          notes: `Request dari Subscription page: ${packageName} (${harga})`
        });
        if (error) throw error;
      }
    }

    localStorage.setItem('jfs_current_tenant', tenant.tenantId);
    const message = `*HALO ADMIN JFS AI TECHNOLOGY*%0A%0A` +
      `Saya mengajukan subscription *JFS Laundry AI*:%0A` +
      `🏪 *Laundry*: ${encodeURIComponent(tenant.tenantName)}%0A` +
      `🆔 *Tenant ID*: ${encodeURIComponent(tenant.tenantCode || tenant.tenantId)}%0A` +
      `📦 *Paket*: ${encodeURIComponent(packageName)}%0A` +
      `💰 *Harga*: ${encodeURIComponent(harga)}%0A%0A` +
      `Mohon prosedur pembayaran dan aktivasi. Terima kasih!`;
    window.open(`https://wa.me/${ADMIN_WA_NUMBER}?text=${message}`, '_blank');
    alert(`✅ Permintaan ${packageName} sudah tercatat.\n\nStatus: Pending\nTenant: ${tenant.tenantName}`);
  } catch (error) {
    console.error(error);
    alert(`Gagal mengirim permintaan subscription: ${error.message || error}`);
  }
}

window.addEventListener('DOMContentLoaded', () => { window.orderSubscription = orderSubscription; });
