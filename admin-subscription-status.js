/* Tenant subscription status for Admin Dashboard. */
(function(){
  'use strict';
  let clientPromise=null;
  function client(){return clientPromise||(clientPromise=import('./auth.js?v=20260916-2').then(m=>m.supabase));}
  function fmtDate(v){const d=new Date(v);return v&&!Number.isNaN(d.getTime())?d.toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric'}):'-'}
  function set(id,v){const e=document.getElementById(id);if(e)e.textContent=v}
  async function load(){
    try{
      const supabase=await client();
      const {data,error}=await supabase.rpc('jfs_get_my_laundry_subscription_summary');
      if(error)throw error;
      const row=data?.[0];
      const card=document.getElementById('jfs-sub-card');
      if(!card)return;
      if(!row){set('jfsSubStatus','Belum Aktif');set('jfsSubPlan','-');set('jfsSubStart','-');set('jfsSubEnd','-');set('jfsSubLeft','-');return}
      set('jfsSubStatus',row.subscription_status||'-');
      set('jfsSubPlan',row.plan_name||row.plan_id||'Trial');
      set('jfsSubStart',fmtDate(row.activated_at));
      set('jfsSubEnd',fmtDate(row.expires_at));
      set('jfsSubLeft',row.remaining_days==null?'-':row.remaining_days===0?'Berakhir hari ini':`${row.remaining_days} hari`);
      const statusEl=document.getElementById('jfsSubStatus');
      if(statusEl)statusEl.className=(row.subscription_status==='Akan Berakhir'||row.subscription_status==='Expired')?'text-amber-300':'text-emerald-400';
      const link=document.getElementById('jfsSubLink');
      if(link&&row.tenant_code)link.href=`subscription.html?id=${encodeURIComponent(row.tenant_code)}`;
    }catch(e){console.warn('subscription status',e)}
  }
  function mount(){
    if(document.getElementById('jfs-sub-card')){load();return}
    const anchor=document.querySelector('#recentOrders')?.closest('section');if(!anchor)return;
    const sec=document.createElement('section');sec.id='jfs-sub-card';sec.className='panel bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-6';
    sec.innerHTML='<div class="flex items-center justify-between gap-3 mb-4"><div><h2 class="text-lg font-extrabold">🚀 Status Subscription</h2><p class="text-sm text-slate-500">Status paket dan masa berlaku tenant.</p></div><a id="jfsSubLink" class="text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-2 rounded-lg">Kelola Subscription</a></div><div class="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm"><div><p class="text-slate-500">Status</p><b id="jfsSubStatus" class="text-emerald-400">-</b></div><div><p class="text-slate-500">Paket</p><b id="jfsSubPlan">-</b></div><div><p class="text-slate-500">Mulai</p><b id="jfsSubStart">-</b></div><div><p class="text-slate-500">Berakhir</p><b id="jfsSubEnd">-</b></div><div><p class="text-slate-500">Sisa</p><b id="jfsSubLeft" class="text-amber-300">-</b></div></div>';
    anchor.parentNode.insertBefore(sec,anchor);
    load();
  }
  window.loadSubscriptionStatus=load;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
