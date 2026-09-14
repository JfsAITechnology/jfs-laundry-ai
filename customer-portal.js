/* Customer portal: Supabase orders + payment choice */
let dbTenant = null;
let orderSubmitting = false;
const customerParams = new URLSearchParams(location.search);
const tenantId = customerParams.get('id') || 'JFS-LAUNDRY-DEMO-001';
const ORDER_KEY = `jfs_orders_${tenantId}`;
function applyResolvedCustomerIdentity() {
    const cfg = window.activeConfig || {};
    const name = cfg.name || 'JFS Laundry AI';
    const address = cfg.address || 'Alamat laundry';
    const header = document.getElementById('display-store-name');
    const addressEl = document.getElementById('display-store-address');
    const wa = document.getElementById('btn-wa-direct');
    if (header)
        header.textContent = /\s+laundry$/i.test(name) ? name : `${name} Laundry`;
    if (addressEl)
        addressEl.textContent = address;
    if (wa)
        wa.href = cfg.waNumber ? `https://wa.me/${cfg.waNumber}?text=${encodeURIComponent('Halo ' + name + ', saya ingin bertanya.')}` : '#';
    document.querySelectorAll('h2').forEach(el => {
        if (el.textContent.trim() === 'JFS Laundry AI Assistant')
            el.textContent = `JFS AI Assistant — ${/\s+laundry$/i.test(name) ? name : `${name} Laundry`}`;
    }
    );
}
async function resolveDbTenant() {
    if (!window.jfsDb)
        return null;
    const {data, error} = await jfsDb.from('tenants').select('id,tenant_code,business_name,address,city,province,whatsapp,phone,ai_enabled').eq('tenant_code', tenantId).maybeSingle();
    if (!error && data)
        dbTenant = data;
    if (error)
        console.warn('Tenant resolve failed', error);
    return dbTenant;
}
async function syncPortalConfig() {
    const tenant = await resolveDbTenant();
    if (!tenant) {
        activeConfig = {
            name: 'JFS Laundry AI',
            address: 'Alamat laundry',
            waNumber: '',
            pricelist: {}
        };
        window.activeConfig = activeConfig;
        applyResolvedCustomerIdentity();
        document.dispatchEvent(new CustomEvent('jfs:portal-config-ready'));
        return activeConfig;
    }
    /* Resolve identity first and apply it immediately; product loading must never block branding. */
    activeConfig = {
        name: tenant.business_name || 'JFS Laundry AI',
        address: tenant.address || [tenant.city, tenant.province].filter(Boolean).join(', ') || 'Alamat laundry',
        waNumber: tenant.whatsapp || tenant.phone || '',
        pricelist: {}
    };
    window.activeConfig = activeConfig;
    applyResolvedCustomerIdentity();
    document.dispatchEvent(new CustomEvent('jfs:portal-config-ready'));
    let products = [];
    try {
        const {data, error} = await jfsDb.from('products').select('name,description,price,category').eq('tenant_id', tenant.id).eq('is_active', true).gt('price', 0).order('name');
        if (error)
            throw error;
        products = data || [];
    } catch (error) {
        console.warn('Portal products sync failed', error)
    }
    const pricelist = {};
    products.forEach(p => {
        const key = String(p.name || '').trim().toLowerCase();
        if (key)
            pricelist[key] = Number(p.price || 0)
    }
    );
    activeConfig.pricelist = pricelist;
    window.activeConfig = activeConfig;
    window.jfsPortalProducts = products;
    const unitSelect = document.getElementById('order-unit');
    if (unitSelect) {
        const allPerKg = products.filter(p => Number(p.price) > 0).every(p => /kilogram|per\s*kg|\/\s*kg/i.test(`${p.name || ''} ${p.description || ''}`));
        if (products.length && allPerKg) {
            unitSelect.value = 'Kg';
            unitSelect.innerHTML = '<option value="Kg">Kg</option>';
            unitSelect.disabled = true
        } else
            unitSelect.disabled = false;
    }
    applyResolvedCustomerIdentity();
    document.dispatchEvent(new CustomEvent('jfs:portal-config-ready'));
    return activeConfig;
}
function ensurePaymentField() {
    const form = document.querySelector('form[onsubmit="sendOrder(event)"]');
    if (!form || document.getElementById('order-payment'))
        return;
    const wrap = document.createElement('div');
    wrap.innerHTML = '<label class="block text-[11px] mb-1">Pembayaran</label><select id="order-payment" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2"><option value="cash">Bayar saat selesai / di toko</option><option value="transfer">Transfer bank</option><option value="qris">QRIS</option></select><p class="text-[9px] text-slate-500 mt-1">Pembayaran online dapat dikonfirmasi admin.</p>';
    const notes = document.getElementById('order-notes');
    notes?.parentElement?.before(wrap)
}
async function createDbOrder(order) {
    const tenant = await resolveDbTenant();
    if (!tenant)
        throw new Error('Tenant database tidak ditemukan');
    const payload = {
        tenant_id: tenant.id,
        status: 'pending',
        total_amount: order.total,
        currency: 'IDR',
        source: 'customer_portal',
        external_id: order.id,
        payment_status: order.payment === 'cash' ? 'unpaid' : 'pending',
        payment_method: order.payment,
        notes: JSON.stringify({
            name: order.name,
            phone: order.phone,
            service: order.service,
            quantity: order.qty,
            unit: order.unit,
            delivery: order.delivery,
            address: order.address,
            pickupTime: order.pickupTime,
            notes: order.notes
        })
    };
    const {data, error} = await jfsDb.from('jfs_orders').insert(payload).select('id,external_id,status,total_amount,payment_status,payment_method,created_at').single();
    if (error)
        throw error;
    return data
}
function newOrderId() {
    if (window.crypto?.randomUUID)
        return 'ORD-' + crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
    return 'ORD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase()
}
function calculateTotal(service, qty, unit) {
    const price = Number((activeConfig.pricelist || {})[service] || 0);
    if (!Number(qty) || !price || unit !== 'Kg')
        return 0;
    return Math.round(Number(qty) * price)
}
async function sendOrder(e) {
    e.preventDefault();
    if (orderSubmitting)
        return;
    const form = e.target
      , button = form.querySelector('button[type="submit"]') || form.querySelector('button:last-of-type')
      , name = document.getElementById('order-name').value.trim()
      , phone = normalizePhone(document.getElementById('order-phone').value)
      , service = document.getElementById('order-service').value
      , qty = Number(document.getElementById('order-qty').value)
      , unit = document.getElementById('order-unit').value
      , delivery = selectedDelivery()
      , address = delivery === 'pickup' ? document.getElementById('order-address').value.trim() : 'Antar sendiri'
      , pickupTime = delivery === 'pickup' ? document.getElementById('pickup-time').value : '-'
      , notes = document.getElementById('order-notes').value.trim() || '-'
      , payment = document.getElementById('order-payment')?.value || 'cash'
      , total = calculateTotal(service, qty, unit)
      , id = newOrderId()
      , order = {
        id,
        name,
        phone,
        service,
        qty,
        unit,
        delivery,
        address,
        pickupTime,
        total,
        notes,
        payment
    };
    if (!total) {
        alert(unit !== 'Kg' ? 'Tarif per Pcs belum tersedia untuk layanan ini. Silakan gunakan Kg.' : 'Harga layanan belum tersedia. Silakan pilih layanan yang memiliki tarif.');
        return
    }
    orderSubmitting = true;
    if (button) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = 'Mengirim order...';
        button.classList.add('opacity-60')
    }
    try {
        await createDbOrder(order);
        document.getElementById('track-id').value = id;
        document.getElementById('track-link').href = `track.html?id=${encodeURIComponent(tenantId)}&order=${encodeURIComponent(id)}`;
        document.getElementById('track-link').classList.remove('hidden');
        alert(`✅ Order ${id} berhasil dikirim. Tidak perlu konfirmasi WhatsApp.`);
        form.reset();
        document.querySelector('input[name="delivery"][value="pickup"]').checked = true;
        togglePickupFields();
        updateCustomerTotal()
    } catch (err) {
        console.error(err);
        alert('Order belum terkirim ke server. Silakan coba lagi.')
    } finally {
        orderSubmitting = false;
        if (button) {
            button.disabled = false;
            button.textContent = button.dataset.originalText || '🚀 Kirim Order';
            button.classList.remove('opacity-60')
        }
    }
}
function normalizePhone(v) {
    let p = v.replace(/\D/g, '');
    if (p.startsWith('0'))
        p = '62' + p.slice(1);
    if (!p.startsWith('62'))
        p = '62' + p;
    return p
}
function selectedDelivery() {
    return document.querySelector('input[name="delivery"]:checked')?.value || 'pickup'
}
function togglePickupFields() {
    const x = selectedDelivery() === 'pickup';
    document.getElementById('pickup-fields').classList.toggle('hidden', !x);
    document.getElementById('order-address').required = x
}
function estimateTotal(service, qty) {
    const price = Number((activeConfig.pricelist || {})[service] || 0);
    return Number(qty) && price ? Math.round(Number(qty) * price) : 0
}
function updateCustomerTotal() {
    const service = document.getElementById('order-service')?.value
      , qty = Number(document.getElementById('order-qty')?.value || 0)
      , unit = document.getElementById('order-unit')?.value || 'Kg'
      , price = Number((activeConfig.pricelist || {})[service] || 0)
      , box = document.getElementById('customer-total-preview');
    if (!box)
        return;
    if (!service || !qty || !price) {
        box.classList.add('hidden');
        return
    }
    if (unit !== 'Kg') {
        document.getElementById('customer-total-value').textContent = 'Rp 0';
        document.getElementById('customer-total-formula').textContent = 'Harga per Pcs belum tersedia. Silakan pilih Kg.';
        box.classList.remove('hidden');
        return
    }
    const total = Math.round(qty * price);
    document.getElementById('customer-total-value').textContent = `Rp ${total.toLocaleString('id-ID')}`;
    document.getElementById('customer-total-formula').textContent = `${qty} Kg × Rp ${price.toLocaleString('id-ID')} = TOTAL Rp ${total.toLocaleString('id-ID')}`;
    box.classList.remove('hidden')
}
function quickAsk(type) {
    document.getElementById('chat-input').value = type;
    sendMessage()
}
function addBubble(t, u=false) {
    const b = document.createElement('div');
    b.className = 'chat-bubble ' + (u ? 'bg-blue-600 text-white max-w-[85%] ml-auto' : 'bg-slate-100 dark:bg-slate-700 max-w-[92%]');
    b.innerText = t;
    const box = document.getElementById('chat-box');
    box.appendChild(b);
    box.scrollTop = box.scrollHeight
}
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input[name="delivery"]').forEach(x => x.addEventListener('change', togglePickupFields));
    document.getElementById('chat-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage()
        }
    }
    );
    document.getElementById('order-service').addEventListener('change', updateCustomerTotal);
    document.getElementById('order-qty').addEventListener('input', updateCustomerTotal);
    document.getElementById('order-unit').addEventListener('change', updateCustomerTotal);
    togglePickupFields()
}
);
/* FIX: loadTenantPortal belum pernah didefinisikan di file manapun.
   Sebelumnya baris ini memanggil identifier yang tidak ada -> ReferenceError
   di level atas script -> seluruh listener DOMContentLoaded di bawahnya
   (termasuk yang memanggil syncPortalConfig() untuk mengisi nama toko)
   tidak pernah terdaftar. Guard dengan typeof supaya tidak pernah crash,
   baik loadTenantPortal akhirnya didefinisikan di file lain atau tidak. */
document.addEventListener('jfs:portal-config-ready', () => {
    if (typeof loadTenantPortal === 'function')
        loadTenantPortal();
});
document.addEventListener('DOMContentLoaded', async () => {
    const header = document.getElementById('display-store-name');
    const address = document.getElementById('display-store-address');
    if (header)
        header.textContent = 'JFS Laundry AI';
    if (address)
        address.textContent = 'Memuat data usaha...';
    ensurePaymentField();
    window.sendOrder = sendOrder;
    window.trackOrder = trackOrder;
    try {
        await syncPortalConfig();
        if (typeof loadTenantPortal === 'function')
            loadTenantPortal();
    } catch (e) {
        console.warn('Portal config sync failed', e)
    }
}
);
