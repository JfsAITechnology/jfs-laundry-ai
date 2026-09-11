
// config.js — Multi-Tenant Database & Master Config JFS Laundry AI

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
    "logo": "logo-jfs.png", // Gantilah dengan path logo kustom jika ada
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

// Logika Multi-Tenant Parser
const urlParams = new URLSearchParams(window.location.search);
const tenantId = urlParams.get('id') || 'default';

// Set active config secara dinamis (fallback ke default jika ID tidak ditemukan)
const APP_CONFIG = TENANTS_DATA[tenantId] || TENANTS_DATA['default'];
