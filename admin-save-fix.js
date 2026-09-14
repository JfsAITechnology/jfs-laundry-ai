/* Demo admin save fix: keep save handler outside module scope and show real errors. */
(function(){
  'use strict';
  function bind(){
    const button=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Simpan Perubahan'));
    if(!button||button.dataset.boundSave==='1') return;
    button.dataset.boundSave='1';
    button.type='button';
    button.onclick=async function(){
      if(typeof window.JFSAdminSave==='function'){
        await window.JFSAdminSave();
        return;
      }
      alert('Fungsi simpan belum siap. Muat ulang halaman.');
    };
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind); else bind();
})();
