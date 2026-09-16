/* Public Demo Orders — fixed tenant only. */
(function(){
  'use strict';
  const DEMO='JFS-LAUNDRY-DEMO-001';
  const params=new URLSearchParams(location.search);if(params.get('id')!==DEMO||params.get('mode')==='production')return;
  document.addEventListener('DOMContentLoaded',async()=>{
    try{
      const {supabase}=await import('./auth.js?v=20260916-2');const rpc=(n,a)=>supabase.rpc(n,a);const $=id=>document.getElementById(id);
      const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
      const idr=n=>Number(n||0).toLocaleString('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0});
      const meta=o=>{try{return JSON.parse(o.notes||'{}')}catch{return{}}};let orders=[];
      $('navAdmin').style.display='none';$('navHistory').style.display='none';$('navCustomer').href=`index.html?id=${DEMO}`;
      async function load(){const r=await rpc('jfs_public_demo_recent_orders');if(r.error)throw r.error;orders=r.data||[];render()}
      function render(){const q=$('search').value.toLowerCase();const rows=orders.filter(o=>{const m=meta(o);return !q||`${o.external_id} ${m.name||''} ${m.phone||''} ${m.service||''}`.toLowerCase().includes(q)});$('rows').innerHTML=rows.length?rows.map(o=>{const m=meta(o);return `<tr><td><b>${esc(o.external_id)}</b><div class="muted">${esc(new Date(o.created_at).toLocaleString('id-ID'))}</div></td><td><b>${esc(m.name||'-')}</b><div class="muted">${esc(m.phone||'-')}</div></td><td>${esc(m.service||'-')}<div class="muted">${esc((m.quantity||'-')+' '+(m.unit||''))}</div></td><td>${idr(o.total_amount)}</td><td><select data-pay="${o.id}"><option value="unpaid" ${o.payment_status==='unpaid'?'selected':''}>Belum Dibayar</option><option value="pending" ${o.payment_status==='pending'?'selected':''}>Menunggu</option><option value="paid" ${o.payment_status==='paid'?'selected':''}>Sudah Dibayar</option><option value="failed" ${o.payment_status==='failed'?'selected':''}>Gagal</option><option value="refunded" ${o.payment_status==='refunded'?'selected':''}>Dikembalikan</option></select></td><td><select data-status="${o.id}">${[['pending','Menunggu Jemput'],['processing','Dalam Proses'],['ready','Siap Diambil'],['completed','Selesai'],['cancelled','Dibatalkan']].map(x=>`<option value="${x[0]}" ${o.status===x[0]?'selected':''}>${x[1]}</option>`).join('')}</select></td><td><a class="nav a wa" target="_blank" rel="noopener" href="https://wa.me/${encodeURIComponent(m.phone||'')}">WA</a></td></tr>`}).join(''):'<tr><td colspan="7" style="padding:30px;text-align:center;color:#94a3b8">Belum ada pesanan.</td></tr>'}
      async function update(id,status,pay){const r=await rpc('jfs_public_demo_update_order',{p_order_id:id,p_status:status||null,p_payment_status:pay||null});if(r.error)alert(r.error.message);else load()}
      $('search').oninput=render;$('refresh').onclick=load;$('rows').onchange=e=>{if(e.target.dataset.status)update(e.target.dataset.status,e.target.value,null);if(e.target.dataset.pay)update(e.target.dataset.pay,null,e.target.value)};
      await load();setInterval(load,15000);
    }catch(e){console.error(e);$('error').textContent=e?.message||'Gagal memuat Demo';$('error').style.display='block'}
  });
})();
