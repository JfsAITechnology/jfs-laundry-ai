/* Public Demo Admin — fixed tenant only. Production tenants never use this path. */
(function(){
  'use strict';
  const DEMO='JFS-LAUNDRY-DEMO-001';
  const params=new URLSearchParams(location.search);
  if(params.get('id')!==DEMO || params.get('mode')==='production') return;
  document.addEventListener('DOMContentLoaded', async ()=>{
    try{
      const {supabase}=await import('./auth.js?v=20260916-2');
      const rpc=(name,args)=>supabase.rpc(name,args);
      const $=id=>document.getElementById(id);
      const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
      const idr=n=>Number(n||0).toLocaleString('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0});
      let business=null,products=[];
      $('reset-demo-data')?.classList.remove('hidden');
      $('logoutBtn')?.classList.add('hidden');
      $('historyLink')?.classList.add('hidden');
      $('omzetLink')?.classList.add('hidden');
      $('subscriptionLink')?.classList.add('hidden');
      $('display-business').textContent='JFS Laundry AI Demo — Mode Demo';
      const customerUrl=`index.html?id=${encodeURIComponent(DEMO)}`;
      $('customerLink').href=customerUrl;
      $('ordersLink').href=`orders.html?id=${encodeURIComponent(DEMO)}`;
      $('viewAll').href=`orders.html?id=${encodeURIComponent(DEMO)}`;
      async function loadBusiness(){
        const r=await rpc('jfs_public_demo_context'); if(r.error)throw r.error; business=r.data?.[0]; if(!business)throw Error('Demo tenant tidak ditemukan.');
        $('display-business').textContent=(business.business_name||'JFS Laundry AI Demo')+' — Demo';
        $('admin-store-name').value=business.business_name||''; $('admin-store-wa').value=business.whatsapp||business.phone||''; $('admin-store-address').value=business.address||'';
      }
      async function loadProducts(){
        const r=await rpc('jfs_public_demo_products'); if(r.error)throw r.error; products=r.data||[];
        const box=$('pricelist-rows'); box.innerHTML=''; const active=products.filter(p=>p.is_active); if(active.length)active.forEach(addRow); else addRow();
      }
      function addRow(p={}){const box=$('pricelist-rows'),row=document.createElement('div');row.className='price-row grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3';row.dataset.id=p.id||'';row.innerHTML=`<input class="service-key bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-base" placeholder="Nama layanan, contoh: Cuci Kering" value="${esc(p.name||'')}"><input class="service-price bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-base" type="number" min="1" step="1000" placeholder="Harga (Rp)" value="${p.price??''}"><button type="button" class="remove-row bg-rose-700 hover:bg-rose-600 text-white rounded-xl px-4 py-3 font-bold">Hapus</button>`;row.querySelector('.remove-row').onclick=()=>{if(row.dataset.id){row.dataset.delete='1';row.classList.add('hidden')}else row.remove()};box.appendChild(row)}
      async function loadOrders(){
        const r=await rpc('jfs_public_demo_recent_orders');if(r.error)throw r.error;const data=r.data||[];const active=data.filter(o=>!['completed','cancelled'].includes(o.status));
        $('statOrders').textContent=active.length;$('statRevenue').textContent=idr(active.reduce((s,o)=>s+Number(o.total_amount||0),0));
        $('statCustomers').textContent=new Set(active.map(o=>{try{const m=JSON.parse(o.notes||'{}');return m.phone||m.name}catch{return''}}).filter(Boolean)).size;
        $('statPending').textContent=active.filter(o=>o.status==='pending').length;
        const box=$('recentOrders');box.innerHTML='';active.slice(0,5).forEach(o=>{let m={};try{m=JSON.parse(o.notes||'{}')}catch{}const status={pending:'Menunggu Jemput',processing:'Dalam Proses',ready:'Siap Diambil'}[o.status]||o.status;box.insertAdjacentHTML('beforeend',`<div class="order-card flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-xl p-4"><div><b>${esc(m.name||'Customer')}</b><p class="text-sm muted text-slate-400 mt-1">${esc(m.service||'-')} • ${esc((m.quantity||'-')+' '+(m.unit||''))} • ${esc(o.external_id||o.id)}</p></div><div class="flex items-center gap-3"><b class="text-emerald-400">${idr(o.total_amount)}</b><span class="text-sm text-amber-300 font-semibold">${esc(status)}</span><a href="orders.html?id=${encodeURIComponent(DEMO)}" class="text-sm bg-slate-800 px-3 py-2 rounded-lg">Kelola</a></div></div>`)});if(!active.length)box.innerHTML='<p class="text-sm muted text-slate-500 py-3">Belum ada pesanan aktif.</p>';
      }
      async function save(){
        const button=$('save-admin-changes');button.disabled=true;button.textContent='Menyimpan...';
        try{
          const name=$('admin-store-name').value.trim(),wa=$('admin-store-wa').value.replace(/\D/g,''),address=$('admin-store-address').value.trim();if(!name)throw Error('Nama usaha wajib diisi.');
          /* Demo branding is intentionally not editable anonymously. Branding is changed only by Super Admin or an authenticated tenant owner/admin. */
          for(const row of [...document.querySelectorAll('.price-row')]){
            if(row.classList.contains('hidden')&&row.dataset.id){r=await rpc('jfs_public_demo_deactivate_product',{p_product_id:row.dataset.id});if(r.error)throw r.error;continue}
            const service=row.querySelector('.service-key')?.value.trim(),price=Number(row.querySelector('.service-price')?.value||0);if(!service&&!price)continue;if(!service||price<=0)throw Error('Nama layanan dan harga harus diisi.');
            r=await rpc('jfs_public_demo_upsert_product',{p_product_id:row.dataset.id||null,p_name:service,p_price:price});if(r.error)throw r.error;
          }
          alert('✅ Data Demo berhasil disimpan. Halaman Customer akan langsung memakai data terbaru.');await loadBusiness();await loadProducts();await loadOrders();
        }catch(e){console.error(e);alert('Gagal menyimpan Demo: '+(e?.message||e))}
        finally{button.disabled=false;button.textContent='💾 Simpan Perubahan'}
      }
      async function resetDemo(){
        const button=$('reset-demo-data');
        if(!button)return;
        if(!confirm('Reset semua data Demo? Nama usaha, tarif/layanan, pesanan, dan permintaan paket akan dikembalikan ke kondisi awal Demo.'))return;
        button.disabled=true;button.textContent='⏳ Mereset...';
        try{
          const r=await rpc('jfs_public_demo_reset');
          if(r.error)throw r.error;
          alert('✅ Data Demo berhasil di-reset.');
          await Promise.all([loadBusiness(),loadProducts(),loadOrders()]);
        }catch(e){console.error(e);alert('Gagal reset Demo: '+(e?.message||e))}
        finally{button.disabled=false;button.textContent='🧹 Reset Data Demo'}
      }
      const saveButton=$('save-admin-changes');if(saveButton){const fresh=saveButton.cloneNode(true);saveButton.replaceWith(fresh);fresh.addEventListener('click',save)}
      const add=$('add-price-row');if(add){const fresh=add.cloneNode(true);add.replaceWith(fresh);fresh.addEventListener('click',()=>addRow())}
      const reset=$('reset-demo-data');if(reset){const fresh=reset.cloneNode(true);reset.replaceWith(fresh);fresh.classList.remove('hidden');fresh.addEventListener('click',resetDemo)}
      await Promise.all([loadBusiness(),loadProducts(),loadOrders()]);
    }catch(e){console.error('Public demo admin error',e);alert('Demo Dashboard gagal dimuat: '+(e?.message||e))}
  });
})();
