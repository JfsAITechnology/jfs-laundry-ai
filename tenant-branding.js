/* JFS AI — shared multi-tenant laundry identity */
(function(){
  'use strict';
  const cleanBaseName = value => String(value || '').trim().replace(/\s+laundry\s*$/i,'').trim();
  const displayName = value => { const base = cleanBaseName(value); return base ? `${base} Laundry` : 'JFS Laundry AI'; };

  function applyCustomerBranding(){
    const cfg = window.activeConfig || {};
    const name = document.getElementById('display-store-name');
    if(name) name.textContent = displayName(cfg.name || '');
    document.querySelectorAll('h2').forEach(el => {
      if(el.textContent.trim() === 'JFS Laundry AI Assistant') el.textContent = cfg.name ? `JFS AI Assistant — ${displayName(cfg.name)}` : 'JFS AI Assistant';
    });
    if(document.title && cfg.name) document.title = `${displayName(cfg.name)} — JFS Laundry AI`;
  }

  function setupAdminBranding(){
    const input = document.getElementById('admin-store-name');
    if(!input) return;
    input.placeholder = 'Isi nama usaha laundry Anda';
    input.value = cleanBaseName(input.value);

    if(!document.getElementById('copyCustomerUrl')){
      const btn = document.createElement('button');
      btn.id = 'copyCustomerUrl';
      btn.type = 'button';
      btn.className = 'w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl';
      btn.textContent = '🔗 Copy URL Customer';
      btn.addEventListener('click', async () => {
        const id = new URLSearchParams(location.search).get('id') || 'JFS-LAUNDRY-DEMO-001';
        const url = new URL('./', location.href);
        url.searchParams.set('id', id);
        try { await navigator.clipboard.writeText(url.href); btn.textContent = '✅ URL Customer tersalin'; }
        catch { window.prompt('Salin URL Customer:', url.href); }
        setTimeout(() => { btn.textContent = '🔗 Copy URL Customer'; }, 2200);
      });

      const host = document.getElementById('save-admin-changes')?.parentElement ||
        document.querySelector('button[onclick="saveAdminData()"]')?.parentElement;
      if(host) host.insertBefore(btn, document.getElementById('save-admin-changes') || host.querySelector('button[onclick="saveAdminData()"]'));
    }
  }

  document.addEventListener('DOMContentLoaded', () => { setupAdminBranding(); applyCustomerBranding(); });
  document.addEventListener('jfs:portal-config-ready', applyCustomerBranding);
})();
