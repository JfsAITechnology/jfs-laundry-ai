/* Safe reset for the fixed demo tenant only. Reset is never exposed on the public demo dashboard. */
(function(){
  'use strict';
  const DEMO='JFS-LAUNDRY-DEMO-001';
  function bind(){
    const btn=document.getElementById('reset-demo-data');
    if(!btn||btn.dataset.bound==='1') return;
    const params=new URLSearchParams(location.search);
    const isProduction=params.get('mode')==='production';
    if(params.get('id')===DEMO && !isProduction){
      btn.classList.add('hidden');
      return;
    }
    btn.dataset.bound='1';
    btn.addEventListener('click',async()=>{
      if(params.get('id')!==DEMO){alert('Reset hanya tersedia untuk Demo Tenant.');return;}
      const ok=confirm('Reset Demo Tenant?\n\nNama usaha, kontak, alamat, tarif, order, dan subscription demo akan dikosongkan. Tenant produksi tidak tersentuh.');
      if(!ok)return;
      btn.disabled=true;btn.textContent='Mereset...';
      try{
        const {supabase}=await import('./auth.js');
        const {data,error}=await supabase.rpc('jfs_reset_demo_tenant',{p_tenant_code:DEMO});
        if(error)throw error;
        if(data!==true)throw new Error('Reset tidak dikonfirmasi server.');
        alert('✅ Demo berhasil di-reset. Halaman akan dimuat ulang.');
        location.reload();
      }catch(e){
        console.error(e);alert('Gagal reset: '+(e?.message||e));
      }finally{btn.disabled=false;btn.textContent='🧹 Reset Data Demo';}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();