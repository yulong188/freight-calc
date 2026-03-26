/**
 * 海运费 API 配置 — Freightos Freight Rate Estimator
 * 文档：https://sandbox.freightos.com/api/v1
 */

const API_CONFIG = {
  BASE_URL: 'https://sandbox.freightos.com/api/v1',

  API_KEY: '出海龙',

  ENDPOINTS: {
    SEARCH_RATES: '/freightEstimates',
  },

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-apikey': this.API_KEY,
    };
  },

  // 将前端表单数据转换为 Freightos API 请求格式
  buildSearchParams(formData) {
    const isLCL = formData.containerType === 'LCL';

    const body = {
      origin: {
        locationCode: formData.originPort,
      },
      destination: {
        locationCode: formData.destPort,
      },
    };

    if (isLCL) {
      body.load = {
        loadType: 'LCL',
        totalWeight: { value: parseFloat(formData.weight) || 0, unit: 'KG' },
        totalVolume: { value: parseFloat(formData.volume) || 1, unit: 'CBM' },
      };
    } else {
      const containerTypeMap = {
        '20GP': 'DRY_20',
        '40GP': 'DRY_40',
        '40HQ': 'DRY_40_HIGH_CUBE',
      };
      body.load = {
        loadType: 'FCL',
        containerType: containerTypeMap[formData.containerType] || 'DRY_40',
        containerCount: parseInt(formData.containerCount) || 1,
      };
    }

    return body;
  },

  // 将 Freightos API 响应解析为前端展示格式
  parseRatesResponse(apiResponse) {
    const items = apiResponse.estimates || apiResponse.results || apiResponse.data || [];

    return items.map(item => {
      const price = item.totalPrice?.amount || item.price?.amount || item.price || 0;
      const currency = item.totalPrice?.currency || item.price?.currency || 'USD';

      const surcharges = (item.charges || item.surcharges || []).map(c => ({
        name: c.name || c.chargeType || c.type,
        amount: c.amount?.value || c.amount || 0,
      }));

      return {
        carrier:     item.carrier?.name || item.carrierName || item.scac || '未知船公司',
        logo:        item.carrier?.logo || null,
        price:       typeof price === 'number' ? price : parseFloat(price) || 0,
        currency,
        transitDays: item.transitTime?.days || item.transitDays || item.transit_days || '-',
        validUntil:  item.validUntil || item.expiryDate || null,
        departure:   item.departureDate || null,
        arrival:     item.arrivalDate || null,
        serviceType: item.serviceType || 'FCL',
        surcharges,
        tag: null,
      };
    });
  },
};

// ============================================================
// DEMO_MODE = true  → 使用模拟数据（无需 API Key）
// DEMO_MODE = false → 调用真实 Freightos API
// ============================================================
const DEMO_MODE = false;

// 模拟数据（DEMO_MODE = true 时使用）
const MOCK_RATES = [
  {
    carrier: 'COSCO 中远海运',
    logo: null,
    price: 1250,
    currency: 'USD',
    transitDays: 28,
    validUntil: '2026-04-15',
    departure: '2026-04-02',
    arrival: '2026-04-30',
    serviceType: 'FCL',
    surcharges: [
      { name: '燃油附加费 BAF', amount: 180 },
      { name: '港口附加费 THC', amount: 95 },
    ],
    tag: 'cheapest',
  },
  {
    carrier: 'MSC 地中海航运',
    logo: null,
    price: 1380,
    currency: 'USD',
    transitDays: 24,
    validUntil: '2026-04-10',
    departure: '2026-04-05',
    arrival: '2026-04-29',
    serviceType: 'FCL',
    surcharges: [
      { name: '燃油附加费 BAF', amount: 165 },
      { name: '港口附加费 THC', amount: 90 },
    ],
    tag: 'fastest',
  },
  {
    carrier: 'Maersk 马士基',
    logo: null,
    price: 1490,
    currency: 'USD',
    transitDays: 26,
    validUntil: '2026-04-20',
    departure: '2026-04-03',
    arrival: '2026-04-29',
    serviceType: 'FCL',
    surcharges: [
      { name: '燃油附加费 BAF', amount: 200 },
      { name: '港口附加费 THC', amount: 100 },
    ],
    tag: 'recommended',
  },
  {
    carrier: 'CMA CGM 达飞',
    logo: null,
    price: 1320,
    currency: 'USD',
    transitDays: 30,
    validUntil: '2026-04-12',
    departure: '2026-04-06',
    arrival: '2026-05-06',
    serviceType: 'FCL',
    surcharges: [
      { name: '燃油附加费 BAF', amount: 175 },
      { name: '港口附加费 THC', amount: 88 },
    ],
    tag: null,
  },
  {
    carrier: 'Evergreen 长荣海运',
    logo: null,
    price: 1180,
    currency: 'USD',
    transitDays: 32,
    validUntil: '2026-04-08',
    departure: '2026-04-08',
    arrival: '2026-05-10',
    serviceType: 'FCL',
    surcharges: [
      { name: '燃油附加费 BAF', amount: 160 },
      { name: '港口附加费 THC', amount: 85 },
    ],
    tag: null,
  },
];

// ─── LCL 拼箱模拟数据（单价 USD/W·M）───────────────────────
const MOCK_LCL_RATES = [
  {
    carrier: 'COSCO 中远海运',
    logo: null,
    unitPrice: 68,
    price: 0,           // 由 fetchRates 动态计算
    currency: 'USD',
    transitDays: 18,
    validUntil: '2026-04-15',
    departure: '2026-04-05',
    arrival: '2026-04-23',
    serviceType: 'LCL',
    surcharges: [
      { name: '拼箱操作费 CFS', amount: 45 },
      { name: '燃油附加费 BAF', amount: 12 },
    ],
    tag: 'cheapest',
    wmValue: '0',
    isLCL: true,
  },
  {
    carrier: 'MSC 地中海航运',
    logo: null,
    unitPrice: 75,
    price: 0,
    currency: 'USD',
    transitDays: 15,
    validUntil: '2026-04-10',
    departure: '2026-04-03',
    arrival: '2026-04-18',
    serviceType: 'LCL',
    surcharges: [
      { name: '拼箱操作费 CFS', amount: 50 },
      { name: '燃油附加费 BAF', amount: 15 },
    ],
    tag: 'fastest',
    wmValue: '0',
    isLCL: true,
  },
  {
    carrier: 'Maersk 马士基',
    logo: null,
    unitPrice: 82,
    price: 0,
    currency: 'USD',
    transitDays: 17,
    validUntil: '2026-04-20',
    departure: '2026-04-04',
    arrival: '2026-04-21',
    serviceType: 'LCL',
    surcharges: [
      { name: '拼箱操作费 CFS', amount: 55 },
      { name: '燃油附加费 BAF', amount: 18 },
    ],
    tag: 'recommended',
    wmValue: '0',
    isLCL: true,
  },
  {
    carrier: 'PIL 太平船务',
    logo: null,
    unitPrice: 72,
    price: 0,
    currency: 'USD',
    transitDays: 20,
    validUntil: '2026-04-12',
    departure: '2026-04-06',
    arrival: '2026-04-26',
    serviceType: 'LCL',
    surcharges: [
      { name: '拼箱操作费 CFS', amount: 42 },
      { name: '燃油附加费 BAF', amount: 10 },
    ],
    tag: null,
    wmValue: '0',
    isLCL: true,
  },
  {
    carrier: 'Evergreen 长荣海运',
    logo: null,
    unitPrice: 65,
    price: 0,
    currency: 'USD',
    transitDays: 22,
    validUntil: '2026-04-08',
    departure: '2026-04-07',
    arrival: '2026-04-29',
    serviceType: 'LCL',
    surcharges: [
      { name: '拼箱操作费 CFS', amount: 40 },
      { name: '燃油附加费 BAF', amount: 10 },
    ],
    tag: null,
    wmValue: '0',
    isLCL: true,
  },
];
