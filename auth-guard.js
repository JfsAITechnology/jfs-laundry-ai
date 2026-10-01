import { getSession, isSuperAdmin, requireTenantRole, requireSuperAdmin, redirectToLogin } from './auth.js';

export async function guardTenantPage(options = {}) {
  const params = new URLSearchParams(location.search);
  const ref = params.get('id') || localStorage.getItem('jfs_current_tenant');
  if(!ref){ redirectToLogin(location.href); return false; }
  const result = await requireTenantRole(ref, options.roles || ['owner', 'admin'], { allowDemo:false });
  if (result.mode === 'login') { redirectToLogin(location.href); return false; }
  if (result.mode === 'forbidden') { document.body.innerHTML = '<main style="font-family:Arial;padding:40px;text-align:center"><h1>Akses ditolak</h1><p>Akun Anda tidak memiliki akses ke tenant ini.</p><a href="login.html">Kembali ke Login</a></main>'; return false; }
  if (result.tenant && result.tenant.tenant_code && ref !== result.tenant.tenant_code) {
    const next = new URL(location.href);
    next.searchParams.set('id', result.tenant.tenant_code);
    history.replaceState(null, '', next.toString());
  }
  window.JFS_AUTH_CONTEXT = result;
  return true;
}

export async function guardSuperAdmin(options = {}) {
  const result = await requireSuperAdmin({ allowDemo:false });
  if (result.mode === 'login') { redirectToLogin(location.href); return false; }
  if (result.mode === 'forbidden') { document.body.innerHTML = '<main style="font-family:Arial;padding:40px;text-align:center"><h1>Akses Super Admin ditolak</h1><p>Gunakan akun Super Admin JFS AI.</p><a href="login.html">Kembali ke Login</a></main>'; return false; }
  window.JFS_AUTH_CONTEXT = result;
  return true;
}

export async function guardTenantOrSuperAdmin() {
  const session = await getSession();
  if (!session) return guardTenantPage();
  if (await isSuperAdmin()) { window.JFS_AUTH_CONTEXT = { mode: 'super-admin', session }; return true; }
  return guardTenantPage();
}
