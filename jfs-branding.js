/* JFS AI shared branding — keeps JFS AI visible across every app view. */
(function(){
  function mount(){
    /* Keep the admin business name readable when dark mode is enabled. */
    if(!document.getElementById('jfs-admin-header-contrast')){
      const style=document.createElement('style');
      style.id='jfs-admin-header-contrast';
      style.textContent='body.dark #display-business{color:#334155!important}';
      document.head.appendChild(style);
    }
    /* Never add a second floating logo to the customer portal; its header already owns the JFS AI logo. */
    if(location.pathname.endsWith('/index.html') || location.pathname.endsWith('/')){
      const customerHeader=document.querySelector('#display-store-name');
      if(customerHeader)return;
    }
    /* Admin should never visually remain on a generic loading label. */
    const tenantLabel=document.getElementById('display-tenant-id');
    if(tenantLabel && /^Memuat/i.test(tenantLabel.textContent||'')){
      const code=new URLSearchParams(location.search).get('id')||'demo-asosiasi';
      tenantLabel.textContent=code;
    }
    if(document.querySelector('[data-jfs-branding]') || document.querySelector('img[src*="logo-jfs.png"]')) return;
    const brand=document.createElement('div');
    brand.setAttribute('data-jfs-branding','1');
    brand.className='fixed bottom-3 left-1/2 -translate-x-1/2 z-[9999] flex items-center justify-center gap-1.5 rounded-md border border-slate-700/70 bg-slate-950/90 px-2 py-1 shadow-lg backdrop-blur';
    brand.innerHTML='<img src="logo-jfs.png" alt="JFS AI" class="w-2.5 h-2.5 rounded-sm object-contain bg-white p-0.5"><div class="leading-tight whitespace-nowrap"><span class="text-[7px] font-semibold text-slate-300">Powered by </span><span class="text-[7px] font-extrabold text-white">JFS AI Technology</span></div>';
    document.body.appendChild(brand);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount); else mount();
})();
