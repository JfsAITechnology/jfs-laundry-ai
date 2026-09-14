/* JFS AI shared branding — keeps JFS AI visible across every app view. */
(function(){
  function mount(){
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
    brand.className='fixed top-3 left-3 z-[9999] flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-950/90 px-2.5 py-2 shadow-lg backdrop-blur';
    brand.innerHTML='<img src="logo-jfs.png" alt="JFS AI" class="w-8 h-8 rounded-lg object-contain bg-white p-0.5"><div class="leading-tight"><div class="text-[10px] font-extrabold text-white">JFS AI</div><div class="text-[8px] text-slate-400">TECHNOLOGY</div></div>';
    document.body.appendChild(brand);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount); else mount();
})();
