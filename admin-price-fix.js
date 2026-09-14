/* Admin price-list UI fix: avoid inline module onclick and expose a reliable add-row handler. */
(function(){
  'use strict';
  function esc(value){
    return String(value ?? '').replace(/[&<>\"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'
    }[c]));
  }
  window.JFSAdminPriceUI={
    addRow(product={}){
      const box=document.getElementById('pricelist-rows');
      if(!box)return;
      const row=document.createElement('div');
      row.className='flex gap-2 price-row';
      row.dataset.id=product.id||'';
      row.innerHTML=`<input class="service-key flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs" value="${esc(product.name||'')}" placeholder="Layanan"><input class="service-price w-36 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs" type="number" min="0" value="${Number(product.price||0)}" placeholder="Harga"><button type="button" class="price-remove text-rose-400 px-2" aria-label="Hapus layanan">✕</button>`;
      row.querySelector('.price-remove').addEventListener('click',()=>row.remove());
      box.appendChild(row);
      row.querySelector('.service-key')?.focus();
    },
    bind(){
      const add=[...document.querySelectorAll('button')].find(b=>b.textContent.trim().includes('Tambah')&&b.closest('section')?.querySelector('#pricelist-rows'));
      if(!add||add.dataset.bound==='1')return;
      add.dataset.bound='1';
      add.type='button';
      add.removeAttribute('onclick');
      add.addEventListener('click',()=>window.JFSAdminPriceUI.addRow());
      const existing=[...document.querySelectorAll('#pricelist-rows .price-row')];
      existing.forEach(row=>{
        const remove=row.querySelector('button');
        if(remove&&!remove.dataset.bound){remove.dataset.bound='1';remove.type='button';remove.removeAttribute('onclick');remove.addEventListener('click',()=>row.remove())}
      });
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>window.JFSAdminPriceUI.bind());
  else window.JFSAdminPriceUI.bind();
})();
