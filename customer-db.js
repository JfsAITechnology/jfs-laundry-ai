/* JFS Laundry AI — customer portal database layer */
(function(){
  const cfg=window.JFS_SUPABASE_CONFIG;
  if(!cfg||!window.supabase){console.warn('Supabase customer layer unavailable');return;}
  window.jfsDb=window.supabase.createClient(cfg.url,cfg.key);
  window.JFS_ORDER_STATUS={pending:'Menunggu Jemput',processing:'Dalam Proses',ready:'Siap Diambil',completed:'Selesai',cancelled:'Dibatalkan'};
  window.jfsStatusLabel=s=>window.JFS_ORDER_STATUS[s]||s||'Menunggu Jemput';
})();
