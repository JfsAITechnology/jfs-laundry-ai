const SUPABASE_URL = 'https://evtkeyfjgqwarsmlzrkh.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_7lGio_RVVgkVASYYyBHQIg_GvL-8ELD';
window.JFS_SUPABASE_CONFIG = {url: SUPABASE_URL,key: SUPABASE_PUBLISHABLE_KEY};
/* Shared JFS AI design system: Light / Dark */
document.write('<link rel="stylesheet" href="theme.css"><script src="theme.js"><\/script>');
/* Shared tenant identity: admin-entered business name drives customer branding. */
document.write('<script src="tenant-branding.js"><\/script>');
/* Customer already has the JFS AI logo in its own header; do not add a second floating logo there. */
if(!location.pathname.endsWith('/index.html')) document.write('<script src="jfs-branding.js"><\/script>');
if(location.pathname.endsWith('/index.html')) document.write('<script src="customer-ux.js"><\/script>');
/* Admin price list UI fix. */
if(location.pathname.endsWith('/admin.html')) document.write('<script src="admin-price-fix.js?v=20260914-1"><\/script>');
/* Tenant admin subscription status: package, start, expiry and remaining days. */
if(location.pathname.endsWith('/admin.html')) document.write('<script src="admin-subscription-status.js?v=20260914-2"><\/script>');
/* Subscription page must persist real requests to Supabase; the page keeps a local demo fallback. */
if(location.pathname.endsWith('/subscription.html')) document.write('<script type="module" src="subscription-fix.js"><\/script>');
