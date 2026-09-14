/* Admin price-list UI fix: avoid inline module onclick and expose a reliable add-row handler. */
(function(){
  'use strict';
  function esc(value){
    return String(value ?? '').replace(/[&<>\"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'
    }[c]));
  }

  window.JFSAdminPriceUI = {
    addRow(product = {}){
      const box = document.getElementById('pricelist-rows');
      if(!box) return;
      const row = document.createElement('div');
      row.className = 'flex gap-2 price-row';
      row.dataset.id = product.id || '';
      row.innerHTML = `
        <input class="service-key flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs" value="${esc(product.name || '')}" placeholder="Layanan">
        <input class="service-price w-36 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs" type="number" min="0" value="${Number(product.price || 0)}" placeholder="Harga">
        <button type="button" class="price-remove text-rose-400 px-2" aria-label="Hapus layanan">✕</button>`;
      row.querySelector('.price-remove').addEventListener('click', () => row.remove());
      box.appendChild(row);
      row.querySelector('.service-key')?.focus();
    },
    bind(){
      const add = document.getElementById('add-price-row');
      if(!add || add.dataset.bound === '1') return;
      add.dataset.bound = '1';
      add.type = 'button';
      add.addEventListener('click', () => window.JFSAdminPriceUI.addRow());
    }
  };

  document.addEventListener('DOMContentLoaded', () => window.JFSAdminPriceUI.bind());
})();
