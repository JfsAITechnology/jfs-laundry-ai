const SUPABASE_URL = 'https://jzbtymkzwvacrqucaiit.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_T6EQntH4cZgwf3nzKbPpYA_a_TqxO9G';
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
if(location.pathname.endsWith('/admin.html')) document.write('<script src="admin-subscription-status.js?v=20260914-3"><\/script>');
/* Subscription page must persist real requests to Supabase; the page keeps a local demo fallback. */
if(location.pathname.endsWith('/subscription.html')) document.write('<script type="module" src="subscription-fix.js"><\/script>');
/* Fixed public demo workflow. Production pages do not use these handlers. */
if(location.pathname.endsWith('/admin.html')) document.write('<script src="demo-admin-public.js?v=20260916-2"><\/script>');
if(location.pathname.endsWith('/orders.html')) document.write('<script src="demo-orders-public.js?v=20260916-1"><\/script>');
/* Admin Dashboard UX enhancements: quick actions and clearer navigation. */
if(location.pathname.endsWith('/admin.html')) document.write('<script src="admin-dashboard-ux.js?v=20260916-1"><\/script>');
