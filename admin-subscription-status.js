/* Tenant subscription status for Admin Dashboard. */
(function(){
  'use strict';
  let clientPromise=null;
  function client(){return clientPromise||(clientPromise=import('./auth.js').then(m=>m.supabase));}
  function fmtDate(v){const d=new Date(v);return v&&!Number.isNaN(d.getTime())?d.toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric'}):'-'}
  function set(id,v){const e=document.getElementById(id);if(e)e.textContent=v}
  async function load(){
    try{
      const supabase=await client();
      const code=new URLSearchParams(location.search).get('id')||'JFS-LAUNDRY-DEMO-001';
      const t=await supabase.from('tenants').select('id,status').eq('tenant_code',code).maybeSingle();
      if(t.error||!t.data)return;
      const [r,p]=await Promise.all([
        supabase.from('jfs_laundry_subscription_requests').select('plan_id,status,activated_at,requested_at').eq('tenant_id',t.data.id).order('requested_at',{ascending:false}).limit(20),
        supabase.from('jfs_laundry_subscription_plans').select('id,name,days').eq('is_active',true)
      ]);
      const active=(r.data||[]).find(x=>x.status==='Active');
      const card=document.getElementById('jfs-sub-card');
      if(!card)return;
      if(!active){set('jfsSubStatus','Belum Aktif');set('jfsSubPlan','-');set('jfsSubStart','-');set('jfsSubEnd','-');set('jfsSubLeft','-');return}
      const plan=(p.data||[]).find(x=>x.id===active.plan_id);
      const start=new Date(active.activated_at);const end=plan?.days?new Date(start.getTime()+Number(plan.days)*86400000):null;const left=end?Math.ceil((end.getTime()-Date.now())/86400000):null;
      set('jfsSubStatus',left!==null&&left<0?'Expired':left!==null&&left<=7?'Akan Berakhir':t.data.status==='trial'?'Trial':'Aktif');
      set('jfsSubPlan',plan?.name||active.plan_id);set('jfsSubStart',fmtDate(start));set('jfsSubEnd',fmtDate(end));set('jfsSubLeft',left===null?'-':left<0?'Sudah berakhir':`${left} hari`);
    }catch(e){console.warn('subscription status',e)}
  }
  function mount(){
    if(document.getElementById('jfs-sub-card')){load();return}
    const anchor=document.querySelector('#recentOrders')?.closest('section');if(!anchor)return;
    const sec=document.createElement('section');sec.id='jfs-sub-card';sec.className='bg-slate-900/80 border border-slate-800 rounded-xl p-5';
    sec.innerHTML='<div class="flex items-center justify-between gap-3 mb-4"><div><h2 class="font-bold">🚀 Status Subscription</h2><p class="text-[10px] text-slate-500">Status paket dan masa berlaku tenant.</p></div><a id="jfsSubLink" class="text-[10px] bg-indigo-600 px-3 py-2 rounded-lg">Kelola Subscription</a></div><div class="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs"><div><p class="text-slate-500">Status</p><b id="jfsSubStatus" class="text-emerald-400">-</b></div><div><p class="text-slate-500">Paket</p><b id="jfsSubPlan">-</b></div><div><p class="text-slate-500">Mulai</p><b id="jfsSubStart">-</b></div><div><p class="text-slate-500">Berakhir</p><b id="jfsSubEnd">-</b></div><div><p class="text-slate-500">Sisa</p><b id="jfsSubLeft" class="text-amber-300">-</b></div></div>';
    anchor.parentNode.insertBefore(sec,anchor);
    const code=new URLSearchParams(location.search).get('id')||'JFS-LAUNDRY-DEMO-001';const link=document.getElementById('jfsSubLink');if(link)link.href=`subscription.html?id=${encodeURIComponent(code)}`;
    load();
  }
  window.loadSubscriptionStatus=load;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
