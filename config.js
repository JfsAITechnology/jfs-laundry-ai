// config.js — Master Config & Multi-Tenant Reader

const TENANTS_DATA = {
  "default": {
    "name": "JFS Laundry AI Demo",
    "company": "JFS AI Technology",
    "logo": "logo-jfs.png",
    "waNumber": "6282230010172",
    "address": "Sidosermo, Wonocolo",
    "pricelist": {
      "kiloan": 6000,
      "setrika": 8000,
      "express": 15000
    }
  },
  "sumber-rejeki": {
    "name": "Laundry Sumber Rejeki",
    "company": "Sumber Rejeki Group",
    "logo": "logo-jfs.png",
    "waNumber": "6281234567890",
    "address": "Jl. Raya Tunjungan No. 12, Surabaya",
    "pricelist": {
      "kiloan": 8000,
      "setrika": 10000,
      "express": 18000
    }
  },
  "clean-express": {
    "name": "Clean Express Laundry",
    "company": "Clean Express Corp",
    "logo": "logo-jfs.png",
    "waNumber": "6289876543210",
    "address": "Jl. Gubeng Masjid No. 45, Surabaya",
    "pricelist": {
      "kiloan": 7000,
      "setrika": 9000,
      "express": 16000
    }
  }
};

// Ambil ID tenant dari URL query parameter
function getActiveTenantData() {
  const urlParams = new URLSearchParams(window.location.search);
  const activeTenantId = urlParams.get('id') || 'default';

  // 1. Cek apakah ada data editan dari Admin di LocalStorage
  const savedData = localStorage.getItem(`tenant_cfg_${activeTenantId}`);
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (e) {
      console.error("Gagal parse localstorage:", e);
    }
  }

  // 2. Jika tidak ada di LocalStorage, ambil dari master data bawaan
  if (TENANTS_DATA[activeTenantId]) {
    return TENANTS_DATA[activeTenantId];
  }

  // 3. Fallback untuk tenant baru yang belum ada di master data
  return {
    name: `Laundry ${activeTenantId.replace(/-/g, ' ').toUpperCase()}`,
    company: "JFS AI Partner",
    logo: "logo-jfs.png",
    waNumber: "6282230010172",
    address: "Surabaya",
    pricelist: { kiloan: 7000, setrika: 9000, express: 15000 }
  };
}

const APP_CONFIG = getActiveTenantData();
