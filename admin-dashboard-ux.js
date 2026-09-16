/* JFS Laundry AI — Admin Dashboard UX enhancements (UI-only). */
(function(){
  'use strict';
  function q(id){return document.getElementById(id)}
  function tenantQuery(){
    const p=new URLSearchParams(location.search), id=p.get('id');
    return id ? `?id=${encodeURIComponent(id)}` : '';
  }
  function addQuickActions(){
    if(q('jfs-admin-quick-actions')) return;
    const stats=q('statOrders')?.closest('section');
    if(!stats) return;
    const sec=document.createElement('section');
    sec.id='jfs-admin-quick-actions';
    sec.className='panel bg-slate-900/60 border border-slate-800 rounded-2xl p-5 md:p-6';
    const query=tenantQuery();
    sec.innerHTML=`<div class="flex items-center justify-between gap-3 mb-4"><div><h2 class="text-lg md:text-xl font-extrabold">⚡ Aksi Cepat</h2><p class="text-sm subtle text-slate-500 mt-1">Akses pekerjaan admin yang paling sering digunakan.</p></div></div><div class="grid grid-cols-2 md:grid-cols-4 gap-3"><a href="orders.html${query}" class="jfs-quick bg-sky-600 hover:bg-sky-500"><span>📦</span><b>Kelola Pesanan</b><small>Lihat & update order</small></a><button type="button" id="jfsQuickAdd" class="jfs-quick bg-blue-600 hover:bg-blue-500"><span>➕</span><b>Tambah Layanan</b><small>Tambah tarif baru</small></button><a href="index.html${query}" class="jfs-quick bg-violet-600 hover:bg-violet-500"><span>👁️</span><b>Lihat Customer</b><small>Cek tampilan publik</small></a><a href="subscription.html${query}" class="jfs-quick bg-indigo-600 hover:bg-indigo-500"><span>🚀</span><b>Subscription</b><small>Cek paket & masa aktif</small></a></div>`;
    stats.insertAdjacentElement('afterend',sec);
    const style=document.createElement('style');
    style.id='jfs-admin-ux-style';
    style.textContent='.jfs-quick{min-height:94px;border-radius:1rem;padding:1rem;color:#fff;display:flex;flex-direction:column;justify-content:center;gap:.2rem;text-decoration:none;border:1px solid rgba(255,255,255,.08);transition:transform .15s ease,filter .15s ease}.jfs-quick:hover{transform:translateY(-1px);filter:brightness(1.06)}.jfs-quick span{font-size:1.25rem}.jfs-quick b{font-size:.95rem}.jfs-quick small{font-size:.72rem;opacity:.85}';
    document.head.appendChild(style);
    q('jfsQuickAdd')?.addEventListener('click',()=>{
      q('add-price-row')?.click();
      q('pricelist-rows')?.scrollIntoView({behavior:'smooth',block:'center'});
      setTimeout(()=>document.querySelector('#pricelist-rows .price-row:last-child .service-key')?.focus(),250);
    });
  }
  function enhanceStats(){
    const query=tenantQuery();
    const links=[`orders.html${query}`,`omzet.html${query}`,`history.html${query}`,`orders.html${query}`];
    const cards=[...document.querySelectorAll('#statOrders,#statRevenue,#statCustomers,#statPending')].map(e=>e.closest('.stat')).filter(Boolean);
    cards.forEach((card,i)=>{
      if(card.dataset.jfsEnhanced)return;
      card.dataset.jfsEnhanced='1';card.classList.add('jfs-stat-card');
      if(i!==1){const a=document.createElement('a');a.href=links[i];a.className='absolute inset-0 rounded-2xl';a.setAttribute('aria-label','Buka detail');card.style.position='relative';card.appendChild(a)}
    });
    const style=document.createElement('style');
    style.id='jfs-admin-stat-style';
    style.textContent='.jfs-stat-card{transition:transform .15s ease,box-shadow .15s ease}.jfs-stat-card:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(15,23,42,.12)}';
    document.head.appendChild(style);
  }
  function improveNav(){
    const nav=document.querySelector('main nav');
    if(!nav||nav.dataset.jfsEnhanced)return;
    nav.dataset.jfsEnhanced='1';
    nav.classList.add('pb-1');
    [...nav.querySelectorAll('a,button')].forEach(el=>el.classList.add('transition','duration-150'));
  }
  function mount(){addQuickActions();enhanceStats();improveNav()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
