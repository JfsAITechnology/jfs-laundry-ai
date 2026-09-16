/* JFS Laundry AI — customer chatbot: official data first, safe fallback */
(function(){
const cfg=window.JFS_SUPABASE_CONFIG;if(!cfg||!window.supabase)return;
window.jfsDb=window.supabase.createClient(cfg.url,cfg.key);
window.JFS_ORDER_STATUS={pending:'Menunggu Jemput',processing:'Dalam Proses',ready:'Siap Diambil',completed:'Selesai',cancelled:'Dibatalkan'};
window.jfsStatusLabel=s=>window.JFS_ORDER_STATUS[s]||s||'Menunggu Jemput';

async function getKbTenant(){
  if(window.dbTenant)return window.dbTenant;
  const id=new URLSearchParams(location.search).get('id')||'JFS-LAUNDRY-DEMO-001';
  const{data,error}=await jfsDb.rpc('jfs_public_tenant_catalog',{p_tenant_code:id});
  if(!error&&data?.length)window.dbTenant=data[0];
  else if(error)console.warn('Tenant catalog resolve failed',error);
  return window.dbTenant||null;
}
function tokens(s){return String(s||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(x=>x.length>2)}
function score(q,text){const a=new Set(tokens(q)),b=tokens(text);return[...a].filter(x=>b.includes(x)).length}
function has(q,words){return words.some(w=>q.includes(w))}
function rupiah(n){return`Rp ${Number(n||0).toLocaleString('id-ID')}`}

async function getProducts(){
  const t=await getKbTenant();if(!t)return[];
  const{data,error}=await jfsDb.rpc('jfs_public_products',{p_tenant_code:t.tenant_code});
  if(error)throw error;return data||[];
}
async function priceAnswer(){
  const data=await getProducts();if(!data.length)return null;
  return`Berikut tarif resmi yang tersedia:\n${data.map(x=>`• ${x.name}: ${rupiah(x.price)}`).join('\n')}\n\nTarif di atas diambil dari data resmi laundry. Jika Kakak mau pesan, silakan isi form “Pesan Laundry”.`;
}
async function serviceAnswer(question){
  const data=await getProducts();
  if(!data.length)return null;
  const q=question.toLowerCase();
  const best=data.filter(x=>score(q,`${x.name} ${x.description||''} ${x.category||''}`)>0);
  if(!best.length)return null;
  return best.slice(0,4).map(x=>`• ${x.name}${x.description?`: ${x.description}`:''}${x.price?` — ${rupiah(x.price)}`:''}`).join('\n');
}
async function knowledgeAnswer(question){
  const t=await getKbTenant();if(!t)return null;
  const{data:k,error}=await jfsDb.from('jfs_public_knowledge').select('category,title,content').eq('tenant_code',t.tenant_code);
  if(error)console.warn('Knowledge base unavailable',error);
  const p=await getProducts();
  const docs=[
    ...(k||[]).map(x=>({content:x.content,score:score(question,`${x.category||''} ${x.title||''} ${x.content||''}`)})),
    ...(p||[]).map(x=>({content:`${x.name}: ${x.description||''}${x.price?` Harga ${rupiah(x.price)}.`:''}`,score:score(question,`${x.name} ${x.description||''} ${x.category||''}`)}))
  ].sort((a,b)=>b.score-a.score);
  const best=docs.filter(x=>x.score>0).slice(0,2);return best.length?best.map(x=>x.content).join('\n'):null;
}
function getChatHistory(){return Array.isArray(window.jfsChatHistory)?window.jfsChatHistory.slice(-6):[]}
function pushChat(role,content){window.jfsChatHistory=window.jfsChatHistory||[];window.jfsChatHistory.push({role,content:String(content||'').slice(0,1200)});window.jfsChatHistory=window.jfsChatHistory.slice(-6)}
function handoverAnswer(label='KOMPLAIN'){const t=window.activeConfig||{};const wa=t.waNumber?` Silakan hubungi admin melalui tombol WA Toko agar dapat ditangani langsung.`:'';return`[${label}]\nMaaf Kak, untuk masalah khusus seperti ini saya tidak akan mengambil keputusan atau menjanjikan kompensasi sendiri. Saya bantu arahkan ke admin agar bisa diperiksa dan ditangani dengan benar.${wa}`}
function orderGuide(){return`Untuk membuat pesanan, silakan isi form “Pesan Laundry”. Data yang diperlukan: nama, nomor WhatsApp, layanan, jumlah cucian, pilihan jemput/antar sendiri, alamat jika dijemput, dan waktu yang diinginkan.\n\nSetelah Kakak menekan “Kirim Order”, pesanan masuk ke sistem admin. Tidak perlu konfirmasi lewat WhatsApp.`}
function statusGuide(){return`Untuk melacak pesanan, buka bagian “Lacak Pesanan” di bawah form. Masukkan nomor order dan kode pelacakan yang diberikan saat order berhasil dibuat. Status resmi yang dapat muncul: Menunggu Jemput → Dalam Proses → Siap Diambil → Selesai.`}
async function kbSendMessage(){
  const i=document.getElementById('chat-input'),text=i.value.trim();if(!text)return;
  const historyBeforeMessage=getChatHistory();addBubble(text,true);pushChat('user',text);i.value='';
  try{
    const q=text.toLowerCase();
    if(has(q,['komplain','keluhan','hilang','kehilangan','rusak','sobek','luntur','tertukar','kurang','telat','terlambat','salah cuci','bau','warna berubah','ganti rugi','refund','uang kembali','protes'])){const a=handoverAnswer('KOMPLAIN');addBubble(a);pushChat('assistant',a);return}
    if(has(q,['status pesanan','status order','lacak pesanan','tracking','pesanan saya','order saya'])){const a=statusGuide();addBubble(a);pushChat('assistant',a);return}
    if(has(q,['pesan','order','booking','pesan laundry','mau cuci','mau laundry'])){const a=orderGuide();addBubble(a);pushChat('assistant',a);return}
    if(/\b(harga|tarif|price|berapa|biaya)\b/.test(q)){const direct=await priceAnswer();if(direct){addBubble(direct);pushChat('assistant',direct);return}const a='Saya belum menemukan tarif resmi di data laundry. Agar tidak memberi harga yang salah, silakan hubungi toko melalui WhatsApp.';addBubble(a);pushChat('assistant',a);return}
    if(has(q,['estimasi','perkiraan total','total biaya','hitung total','kira kira total','kira-kira total'])){const weight=q.match(/(\d+(?:[.,]\d+)?)\s*(kg|kilo|kilogram)/i);if(!weight){const a='Bisa Kak. Untuk estimasi, berapa perkiraan berat cucian dalam Kg? Setelah itu saya hitungkan berdasarkan tarif resmi yang tersedia.';addBubble(a);pushChat('assistant',a);return}const a='Berat sudah dicatat sebagai perkiraan. Untuk menghitung total dengan benar, pilih layanan yang akan digunakan pada form “Pesan Laundry”. Total di form dihitung dari tarif resmi dan jumlah Kg. Jika ada ketentuan area/waktu jemput khusus, admin akan memeriksanya sebelum pelaksanaan.';addBubble(a);pushChat('assistant',a);return}
    if(has(q,['jemput','pickup','ambil cucian','waktu jemput','jam jemput'])){const a='Kakak bisa memilih “Jemput Cucian” pada form. Waktu yang dipilih adalah permintaan waktu jemput; bukan jaminan jadwal sampai dikonfirmasi oleh sistem/admin.';addBubble(a);pushChat('assistant',a);return}
    const service=await serviceAnswer(q);if(service){addBubble(service);pushChat('assistant',service);return}
    let a=await knowledgeAnswer(text);if(!a)a='Saya belum menemukan informasi itu di data resmi laundry. Agar tidak memberi informasi yang salah, silakan hubungi toko melalui WhatsApp untuk pertanyaan khusus.';addBubble(a);pushChat('assistant',a);
  }catch(e){console.error('Chatbot error',e);const a='Maaf Kak, data layanan sedang tidak dapat dimuat. Saya tidak mau menebak informasinya. Silakan coba lagi atau hubungi toko melalui WhatsApp.';addBubble(a);pushChat('assistant',a)}
}
document.addEventListener('DOMContentLoaded',()=>{if(document.getElementById('chat-input')){window.jfsSendMessage=kbSendMessage;window.sendMessage=kbSendMessage}});
})();