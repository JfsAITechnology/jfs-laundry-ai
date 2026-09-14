import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cfg = window.JFS_SUPABASE_CONFIG;
if (!cfg?.url || !cfg?.key) throw new Error('JFS Supabase config belum tersedia.');

export const supabase = createClient(cfg.url, cfg.key);

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function isDemoTenant(ref) {
  return !ref || ref === 'demo-asosiasi';
}

export async function resolveTenant(ref) {
  if (isDemoTenant(ref)) return { id: null, tenant_code: 'demo-asosiasi', demo: true };

  let { data, error } = await supabase
    .from('tenants')
    .select('id, tenant_code, business_name, status')
    .eq('tenant_code', ref)
    .maybeSingle();
  if (error) throw error;

  // Login/signup flows may carry the tenant UUID. Resolve it separately rather than
  // interpolating untrusted URL input into a PostgREST OR expression.
  if (!data && /^[0-9a-f-]{36}$/i.test(ref)) {
    const result = await supabase
      .from('tenants')
      .select('id, tenant_code, business_name, status')
      .eq('id', ref)
      .maybeSingle();
    if (result.error) throw result.error;
    data = result.data;
  }

  if (!data) throw new Error('Tenant tidak ditemukan.');
  return { ...data, demo: false };
}

export async function getTenantMembership(tenantId) {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const { data, error } = await supabase
    .from('tenant_users')
    .select('user_id, tenant_id, role, is_active')
    .eq('user_id', session.user.id)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function isSuperAdmin() {
  const session = await getSession();
  if (!session) return false;
  const { data, error } = await supabase.rpc('jfs_is_super_admin');
  if (error) return false;
  return data === true;
}

export async function requireTenantRole(ref, roles = ['owner', 'admin'], options = {}) {
  const tenant = await resolveTenant(ref);
  if (tenant.demo && options.allowDemo !== false) return { mode: 'demo', tenant };
  const session = await getSession();
  if (!session) return { mode: 'login', tenant };
  if (await isSuperAdmin()) return { mode: 'super-admin', tenant };
  const membership = await getTenantMembership(tenant.id);
  if (!membership || !roles.includes(membership.role)) return { mode: 'forbidden', tenant, membership };
  return { mode: 'tenant', tenant, membership };
}

export async function requireSuperAdmin(options = {}) {
  const session = await getSession();
  if (!session) return options.allowDemo ? { mode: 'demo' } : { mode: 'login' };
  if (!(await isSuperAdmin())) return { mode: 'forbidden' };
  return { mode: 'super-admin', session };
}

export function redirectToLogin(next = location.href) {
  location.href = `login.html?next=${encodeURIComponent(next)}`;
}
