const SUPABASE_URL = 'https://evtkeyfjgqwarsmlzrkh.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_7lGio_RVVgkVASYYyBHQIg_GvL-8ELD';
window.JFS_SUPABASE_CONFIG = {url: SUPABASE_URL,key: SUPABASE_PUBLISHABLE_KEY};
if(location.pathname.endsWith('/orders.html')) document.write('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"><\/script><script src="admin-orders-db.js"><\/script><script src="admin-orders-bind.js"><\/script><script src="admin-orders-fix.js"><\/script>');
