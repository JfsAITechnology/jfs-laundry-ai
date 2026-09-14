const SUPABASE_URL = 'https://evtkeyfjgqwarsmlzrkh.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_7lGio_RVVgkVASYYyBHQIg_GvL-8ELD';
window.JFS_SUPABASE_CONFIG = {url: SUPABASE_URL,key: SUPABASE_PUBLISHABLE_KEY};
/* Shared JFS AI design system: Light / Dark */
document.write('<link rel="stylesheet" href="theme.css"><script src="theme.js"><\/script>');
/* Customer already has the JFS AI logo in its own header; do not add a second floating logo there. */
if(!location.pathname.endsWith('/index.html')) document.write('<script src="jfs-branding.js"><\/script>');
if(location.pathname.endsWith('/index.html')) document.write('<script src="customer-ux.js"><\/script>');
