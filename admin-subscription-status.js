/* Tenant subscription status for Admin Dashboard. */
(function(){
  'use strict';
  function fmtDate(value){
    if(!value) return '-';
    const d=new Date(value);
    return Number.isNaN(d.getTime())?'-':d.toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric'});
  }
  function daysLeft(end){
    if(!end) return null;
    return Math.ceil((new Date(end).getTime()-Date.now())/86400000);
  }
  function setText(id,text){const el=document.getElementById(id);if(el)el.textContent=text;}
  async function loadSubscriptionStatus(){
    try{
      if(!window.supabase) return;
      const code=new URLSearchParams(location.search).get('id')||'JFS-LAUNDRY-DEMO-001';
      const {data:tenant,error:te}=await window.supabase.from('tenants').select('id,status').eq('tenant_code',code).maybeSingle();
      if(te||!tenant) return;
      const [{data:req},{data:plans}]=await Promise.all([
        window.supabase.from('jfs_laundry_subscription_requests').select('plan_id,status,activated_at,requested_at').eq('tenant_id',tenant.id).order('requested_at',{ascending:false}).limit(10),
        window.supabase.from('jfs_laundry_subscription_plans').select('id,name,days').eq('is_active',true)
      ]);
      const active=(req||[]).find(r=>r.status==='Active')||null;
      const plan=active?(plans||[]).find(p=>p.id===active.plan_id):null;
      const section=document.getElementById('subscription-status-card');
      if(!section) return;
      section.classList.remove('hidden');
      if(!active){
        setText('subscription-status','Belum Aktif');
        setText('subscription-plan','Belum ada paket aktif');
        setText('subscription-start','-');
        setText('subscription-end','-');
        setText('subscription-remaining','-');
        return;
      }
      const start=active.activated_at;
      const end=plan?.days?new Date(new Date(start).getTime()+Number(plan.days)*86400000):null;
      const left=end?daysLeft(end):null;
      let statusLabel=tenant.status==='trial'?'Trial':'Aktif';
      if(left!==null&&left<0)statusLabel='Expired';
      else if(left!==null&&left<=7)statusLabel='Akan Berakhir';
      setText('subscription-status',statusLabel);
      setText('subscription-plan',plan?.name||active.plan_id);
      setText('subscription-start',fmtDate(start));
      setText('subscription-end',fmtDate(end));
      setText('subscription-remaining',left===null?'-':(left<0?'Sudah berakhir':`${left} hari`));
    }catch(e){console.warn('Subscription status load failed',e)}
  }
  window.loadSubscriptionStatus=loadSubscriptionStatus;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',loadSubscriptionStatus); else loadSubscriptionStatus();
})();
