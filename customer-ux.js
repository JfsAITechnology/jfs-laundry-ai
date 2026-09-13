/* JFS AI — Customer UX polish */
(function(){
  if(!/\/(index|track)\.html$/.test(location.pathname))return;
  function ready(){
    const form=document.querySelector('form[onsubmit="sendOrder(event)"]');
    if(!form)return;
    const deliveryLabel=[...form.querySelectorAll('label')].find(x=>x.textContent.includes('Cara Menerima Cucian'));
    if(deliveryLabel)deliveryLabel.childNodes[0].textContent='Cara Pengantaran Cucian';
    const submit=form.querySelector('button[type="submit"]')||form.querySelector('button:last-of-type');
    const qty=document.getElementById('order-qty'),service=document.getElementById('order-service'),unit=document.getElementById('order-unit');
    if(qty&&service&&submit&&!document.getElementById('order-total-preview')){
      const box=document.createElement('div');box.id='order-total-preview';box.className='bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between';
      box.innerHTML='<span class="text-[11px] text-emerald-700">Total Pesanan</span><b id="order-total-value" class="text-base text-emerald-700">Rp 0</b>';
      submit.before(box);
    }
    function refresh(){
      const p=Number((window.activeConfig?.pricelist||{})[String(service?.value||'').toLowerCase()]||0),q=Number(qty?.value||0);
      const total=p&&q?Math.round(p*q):0;const out=document.getElementById('order-total-value');if(out)out.textContent='Rp '+total.toLocaleString('id-ID');
    }
    [qty,service,unit].filter(Boolean).forEach(x=>x.addEventListener('input',refresh));
    [service,unit].filter(Boolean).forEach(x=>x.addEventListener('change',refresh));
    refresh();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();
