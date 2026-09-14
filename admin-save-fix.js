/* Shared admin button handlers: save + dashboard refresh. */
(function(){
  'use strict';
  function bind(){
    const save=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Simpan Perubahan'));
    if(save&&save.dataset.boundSave!=='1'){
      save.dataset.boundSave='1'; save.type='button';
      save.addEventListener('click',async()=>{
        if(typeof window.JFSAdminSave==='function') await window.JFSAdminSave();
        else alert('Fungsi simpan belum siap. Muat ulang halaman.');
      });
    }
    const refresh=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Refresh')&&b.closest('section'));
    if(refresh&&refresh.dataset.boundRefresh!=='1'){
      refresh.dataset.boundRefresh='1'; refresh.type='button'; refresh.removeAttribute('onclick');
      refresh.addEventListener('click',async()=>{
        refresh.disabled=true;
        const old=refresh.textContent;
        refresh.textContent='↻ Memuat...';
        try{
          if(typeof window.refreshDashboard==='function') await window.refreshDashboard();
        }catch(e){console.error(e);alert('Gagal me-refresh dashboard: '+(e?.message||e));}
        finally{refresh.disabled=false;refresh.textContent=old||'↻ Refresh';}
      });
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind); else bind();
})();
