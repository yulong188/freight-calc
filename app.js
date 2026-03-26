/* =============================================
   海运费查询平台 - 主逻辑
   ============================================= */

// ─────────────────────────────────────────────
// 港口数据
// ─────────────────────────────────────────────
const PORTS = [
  // 中国主要港口
  { code: 'CNSHA', name: '上海', country: '中国', region: 'CN' },
  { code: 'CNSZX', name: '深圳', country: '中国', region: 'CN' },
  { code: 'CNNBO', name: '宁波', country: '中国', region: 'CN' },
  { code: 'CNTAO', name: '青岛', country: '中国', region: 'CN' },
  { code: 'CNGZH', name: '广州', country: '中国', region: 'CN' },
  { code: 'CNXMN', name: '厦门', country: '中国', region: 'CN' },
  { code: 'CNTJN', name: '天津', country: '中国', region: 'CN' },
  { code: 'CNLYG', name: '连云港', country: '中国', region: 'CN' },
  // 美国
  { code: 'USLAX', name: '洛杉矶', country: '美国', region: 'US' },
  { code: 'USNYC', name: '纽约', country: '美国', region: 'US' },
  { code: 'USSEA', name: '西雅图', country: '美国', region: 'US' },
  { code: 'USHOU', name: '休斯顿', country: '美国', region: 'US' },
  { code: 'USSAV', name: '萨凡纳', country: '美国', region: 'US' },
  // 欧洲
  { code: 'NLRTM', name: '鹿特丹', country: '荷兰', region: 'EU' },
  { code: 'DEHAM', name: '汉堡', country: '德国', region: 'EU' },
  { code: 'GBFXT', name: '费利克斯托', country: '英国', region: 'EU' },
  { code: 'BEANR', name: '安特卫普', country: '比利时', region: 'EU' },
  { code: 'ESVLC', name: '巴伦西亚', country: '西班牙', region: 'EU' },
  // 东南亚
  { code: 'SGSIN', name: '新加坡', country: '新加坡', region: 'SEA' },
  { code: 'MYPKG', name: '巴生港', country: '马来西亚', region: 'SEA' },
  { code: 'THBKK', name: '曼谷', country: '泰国', region: 'SEA' },
  { code: 'VNSGN', name: '胡志明市', country: '越南', region: 'SEA' },
  { code: 'IDJKT', name: '雅加达', country: '印度尼西亚', region: 'SEA' },
  { code: 'IDSUB', name: '泗水', country: '印度尼西亚', region: 'SEA' },
  { code: 'IDMDC', name: '棉兰', country: '印度尼西亚', region: 'SEA' },
  { code: 'PHMNL', name: '马尼拉', country: '菲律宾', region: 'SEA' },
  { code: 'MMRGN', name: '仰光', country: '缅甸', region: 'SEA' },
  // 日韩
  { code: 'JPOSA', name: '大阪', country: '日本', region: 'JP' },
  { code: 'JPTYO', name: '东京', country: '日本', region: 'JP' },
  { code: 'KRPUS', name: '釜山', country: '韩国', region: 'KR' },
  // 澳洲 & 中东
  { code: 'AUSYD', name: '悉尼', country: '澳大利亚', region: 'AU' },
  { code: 'AEDXB', name: '迪拜', country: '阿联酋', region: 'ME' },
];

const POPULAR_ORIGIN = ['CNSHA', 'CNSZX', 'CNNBO', 'CNTAO'];
const POPULAR_DEST   = ['IDJKT', 'USLAX', 'NLRTM', 'SGSIN'];

// ─────────────────────────────────────────────
// DOM Refs
// ─────────────────────────────────────────────
const $  = id => document.getElementById(id);
const form           = $('searchForm');
const originInput    = $('originPort');
const destInput      = $('destPort');
const containerGrid  = $('containerTypeGrid');
const containerHidden= $('containerType');
const searchBtn      = $('searchBtn');
const resetBtn       = $('resetBtn');
const resultsSection = $('resultsSection');
const loadingState   = $('loadingState');
const ratesList      = $('ratesList');
const emptyState     = $('emptyState');
const resultsSummary = $('resultsSummary');
const sortSelect     = $('sortSelect');
const modalOverlay   = $('modalOverlay');
const modalClose     = $('modalClose');
const modalContent   = $('modalContent');

// ─────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────
function init() {
  // 设置默认日期为7天后
  const d = new Date();
  d.setDate(d.getDate() + 7);
  $('departureDate').value = d.toISOString().slice(0, 10);

  // 填充 datalist
  populateDatalist('originPortList');
  populateDatalist('destPortList');

  // 热门港口快捷标签
  renderPopularPorts('originPopular', POPULAR_ORIGIN, originInput);
  renderPopularPorts('destPopular',   POPULAR_DEST,   destInput);

  // 箱型切换
  containerGrid.addEventListener('click', e => {
    const btn = e.target.closest('.container-btn');
    if (!btn) return;
    containerGrid.querySelectorAll('.container-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    containerHidden.value = btn.dataset.type;

    // LCL 显示体积，FCL 显示重量
    const isLCL = btn.dataset.type === 'LCL';
    $('weightGroup').style.display  = isLCL ? 'none' : '';
    $('volumeGroup').style.display  = isLCL ? '' : 'none';
    $('containerCount').parentElement.parentElement.style.display = isLCL ? 'none' : '';
  });

  // 表单提交
  form.addEventListener('submit', e => { e.preventDefault(); handleSearch(); });
  resetBtn.addEventListener('click', handleReset);

  // 排序
  sortSelect.addEventListener('change', () => {
    if (window._currentRates) renderRates(sortRates(window._currentRates, sortSelect.value));
  });

  // 模态框
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function populateDatalist(listId) {
  const list = document.getElementById(listId);
  PORTS.forEach(p => {
    const opt = document.createElement('option');
    opt.value = `${p.name} (${p.code})`;
    list.appendChild(opt);
  });
}

function renderPopularPorts(containerId, codes, input) {
  const el = $(containerId);
  codes.forEach(code => {
    const port = PORTS.find(p => p.code === code);
    if (!port) return;
    const tag = document.createElement('span');
    tag.className = 'port-tag';
    tag.textContent = port.name;
    tag.addEventListener('click', () => {
      input.value = `${port.name} (${port.code})`;
    });
    el.appendChild(tag);
  });
}

function extractPortCode(inputVal) {
  // 支持 "上海 (CNSHA)" 或 直接输入 "CNSHA"
  const match = inputVal.match(/\(([A-Z]{5})\)/);
  if (match) return match[1];
  const direct = inputVal.trim().toUpperCase();
  if (PORTS.find(p => p.code === direct)) return direct;
  // 按名称模糊匹配
  const byName = PORTS.find(p => p.name.includes(inputVal.trim()));
  return byName ? byName.code : inputVal.trim().toUpperCase();
}

function sortRates(rates, key) {
  return [...rates].sort((a, b) => {
    if (key === 'price_asc')   return a.price - b.price;
    if (key === 'price_desc')  return b.price - a.price;
    if (key === 'transit_asc') return a.transitDays - b.transitDays;
    if (key === 'valid_desc')  return new Date(b.validUntil) - new Date(a.validUntil);
    return 0;
  });
}

function daysBetween(d1, d2) {
  return Math.round((new Date(d2) - new Date(d1)) / 86400000);
}

function formatDate(str) {
  if (!str) return '-';
  const d = new Date(str);
  return `${d.getMonth()+1}月${d.getDate()}日`;
}

// ─────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────
async function handleSearch() {
  const originCode = extractPortCode(originInput.value);
  const destCode   = extractPortCode(destInput.value);

  if (!originInput.value || !destInput.value) {
    alert('请填写起运港和目的港');
    return;
  }

  const params = {
    originPort:      originCode,
    destPort:        destCode,
    containerType:   containerHidden.value,
    containerCount:  $('containerCount').value || 1,
    weight:          $('weight').value || 0,
    volume:          $('volume').value || 0,
    departureDate:   $('departureDate').value,
    cargoType:       $('cargoType').value,
  };

  // 显示加载
  resultsSection.style.display = '';
  loadingState.style.display   = '';
  ratesList.innerHTML          = '';
  emptyState.style.display     = 'none';
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // 重置加载条动画
  const bar = $('loadingBar');
  bar.style.animation = 'none';
  bar.offsetHeight; // reflow
  bar.style.animation = '';

  searchBtn.classList.add('loading');
  searchBtn.querySelector('.btn-text').textContent = '查询中...';

  try {
    const rates = await fetchRates(params);
    window._currentRates = rates;
    window._currentParams = params;

    loadingState.style.display = 'none';
    searchBtn.classList.remove('loading');
    searchBtn.querySelector('.btn-text').textContent = '查询实时运价';

    const originPort = PORTS.find(p => p.code === originCode);
    const destPort   = PORTS.find(p => p.code === destCode);
    const oName = originPort ? originPort.name : originCode;
    const dName = destPort   ? destPort.name   : destCode;

    resultsSummary.innerHTML = `
      找到 <strong>${rates.length}</strong> 条运价 ·
      ${oName} → ${dName} ·
      ${containerHidden.value} × ${params.containerCount}
    `;

    if (rates.length === 0) {
      emptyState.style.display = '';
    } else {
      renderRates(sortRates(rates, sortSelect.value));
    }
  } catch (err) {
    loadingState.style.display = 'none';
    searchBtn.classList.remove('loading');
    searchBtn.querySelector('.btn-text').textContent = '查询实时运价';
    alert('查询失败：' + err.message);
  }
}

// ─────────────────────────────────────────────
// API 调用（自动切换演示/真实模式）
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// W/M 计算（拼箱计费单位）
// ─────────────────────────────────────────────
function calcWM(weightKg, volumeCBM) {
  const weightTon = weightKg / 1000;      // 重量吨（MT）
  const volTon    = parseFloat(volumeCBM); // 体积吨（CBM，1CBM = 1 W/M）
  return Math.max(weightTon, volTon);
}

async function fetchRates(params) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 2000));
    const isLCL = params.containerType === 'LCL';
    if (isLCL) {
      const wm = calcWM(parseFloat(params.weight) || 0, parseFloat(params.volume) || 1);
      return MOCK_LCL_RATES.map(r => ({
        ...r,
        price: Math.round(r.unitPrice * wm),   // 总价 = 单价 × W/M
        wmValue: wm.toFixed(3),
        unitPrice: r.unitPrice,
        isLCL: true,
      }));
    }
    return MOCK_RATES.map(r => ({
      ...r,
      price: Math.round(r.price * (1 + (Math.random() * 0.1 - 0.05))),
      surcharges: r.surcharges,
    }));
  }

  // ── 真实 API 调用 ──
  const url = API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.SEARCH_RATES;
  const body = API_CONFIG.buildSearchParams(params);

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: API_CONFIG.getHeaders(),
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    console.warn('API 请求失败（可能是 CORS 限制）:', networkErr.message);
    await new Promise(r => setTimeout(r, 1000));
    const isLCL = params.containerType === 'LCL';
    if (isLCL) {
      const wm = calcWM(parseFloat(params.weight) || 0, parseFloat(params.volume) || 1);
      return MOCK_LCL_RATES.map(r => ({
        ...r,
        price: Math.round(r.unitPrice * wm),
        wmValue: wm.toFixed(3),
        isLCL: true,
      }));
    }
    return MOCK_RATES.map(r => ({
      ...r,
      price: Math.round(r.price * (1 + (Math.random() * 0.1 - 0.05))),
      tag: r.tag,
    }));
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API 返回 ${res.status}: ${err}`);
  }

  const json = await res.json();
  const parsed = API_CONFIG.parseRatesResponse(json);

  // 如果 API 返回空数据，降级到演示数据
  if (!parsed || parsed.length === 0) {
    return MOCK_RATES;
  }
  return parsed;
}

// ─────────────────────────────────────────────
// Render
// ─────────────────────────────────────────────
function renderRates(rates) {
  ratesList.innerHTML = '';

  rates.forEach((rate, idx) => {
    const card = document.createElement('div');
    card.className = `rate-card${rate.tag ? ' tag-' + rate.tag : ''}`;

    const tagLabels = { cheapest: '最低价', fastest: '最快', recommended: '推荐' };
    const tagHtml = rate.tag
      ? `<div class="card-tag">${tagLabels[rate.tag] || ''}</div>` : '';

    const surchargeTotal = (rate.surcharges || []).reduce((s, x) => s + x.amount, 0);
    const totalPrice = rate.price + surchargeTotal;
    const containerCount = parseInt(window._currentParams?.containerCount) || 1;
    const grandTotal = totalPrice * containerCount;

    // 有效期提示
    const daysLeft = rate.validUntil ? daysBetween(new Date(), rate.validUntil) : null;
    const validClass = daysLeft !== null && daysLeft <= 5 ? 'expiring' : '';
    const validText  = daysLeft !== null
      ? (daysLeft <= 0 ? '已过期' : `有效期剩 ${daysLeft} 天`)
      : '-';

    // 船公司缩写
    const abbr = rate.carrier.replace(/[^A-Z\u4e00-\u9fa5]/g, '').slice(0, 2);
    const isLCL = rate.isLCL;

    // LCL 专属价格展示
    const priceBlock = isLCL ? `
      <div class="price-label">拼箱运费（含附加费）</div>
      <div>
        <span class="price-currency">${rate.currency} </span>
        <span class="price-amount">$${rate.price.toLocaleString()}</span>
      </div>
      <div class="price-total">$${rate.unitPrice}/W·M × ${rate.wmValue} W·M</div>
      <div class="price-total" style="font-size:11px;color:#888;margin-top:2px">W/M = max(重量吨, 体积吨)</div>
    ` : `
      <div class="price-label">基本海运费/箱</div>
      <div>
        <span class="price-currency">${rate.currency} </span>
        <span class="price-amount">$${rate.price.toLocaleString()}</span>
      </div>
      <div class="price-total">含附加费 $${totalPrice.toLocaleString()}/箱</div>
      ${containerCount > 1 ? `<div class="price-total" style="color:#1a56db;font-weight:600">合计 $${grandTotal.toLocaleString()}</div>` : ''}
    `;

    const cargoMeta = isLCL
      ? `LCL · 拼箱 · ${rate.wmValue} W/M`
      : `${rate.serviceType || 'FCL'} · 整箱`;

    card.innerHTML = `
      ${tagHtml}
      <div class="carrier-info">
        <div class="carrier-logo">${abbr}</div>
        <div>
          <div class="carrier-name">${rate.carrier}</div>
          <div class="carrier-meta">${cargoMeta}</div>
          <div class="valid-until ${validClass}">⏱ ${validText}</div>
        </div>
      </div>

      <div class="rate-details">
        <div class="detail-item">
          <div class="detail-label">离港日期</div>
          <div class="detail-value">${formatDate(rate.departure)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">预计到港</div>
          <div class="detail-value">${formatDate(rate.arrival)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">航行时效</div>
          <div class="detail-value">
            <span class="transit-badge">⚡ ${rate.transitDays} 天</span>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">${isLCL ? '计费单位' : '附加费合计'}</div>
          <div class="detail-value highlight">${isLCL ? `${rate.wmValue} W·M` : `+$${surchargeTotal.toLocaleString()}`}</div>
        </div>
      </div>

      <div class="rate-price-area">
        <div>${priceBlock}</div>
        <button class="btn-book" onclick="openModal(${idx})">查看详情</button>
        <button class="btn-detail" onclick="event.stopPropagation();openModal(${idx})">报价单</button>
      </div>
    `;

    card.addEventListener('click', () => openModal(idx));
    ratesList.appendChild(card);
  });
}

// ─────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────
function openModal(idx) {
  const rates = sortRates(window._currentRates || [], sortSelect.value);
  const rate  = rates[idx];
  if (!rate) return;

  const surchargeTotal = (rate.surcharges || []).reduce((s, x) => s + x.amount, 0);
  const totalPerBox = rate.price + surchargeTotal;
  const qty = parseInt(window._currentParams?.containerCount) || 1;
  const grandTotal = totalPerBox * qty;

  const abbr = rate.carrier.replace(/[^A-Z\u4e00-\u9fa5]/g, '').slice(0, 2);

  const surchargeRows = (rate.surcharges || []).map(s =>
    `<tr><td>${s.name}</td><td class="text-right">$${s.amount.toLocaleString()}</td></tr>`
  ).join('');

  modalContent.innerHTML = `
    <div class="modal-header">
      <div class="modal-carrier">
        <div class="modal-carrier-logo">${abbr}</div>
        <div>
          <div class="modal-carrier-name">${rate.carrier}</div>
          <div class="modal-carrier-type">${rate.serviceType || 'FCL'} · 整箱运输</div>
        </div>
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">航线信息</div>
      <div class="modal-grid">
        <div class="modal-item">
          <div class="modal-item-label">起运港</div>
          <div class="modal-item-value">${window._currentParams?.originPort || '-'}</div>
        </div>
        <div class="modal-item">
          <div class="modal-item-label">目的港</div>
          <div class="modal-item-value">${window._currentParams?.destPort || '-'}</div>
        </div>
        <div class="modal-item">
          <div class="modal-item-label">离港日期</div>
          <div class="modal-item-value">${formatDate(rate.departure)}</div>
        </div>
        <div class="modal-item">
          <div class="modal-item-label">预计到港</div>
          <div class="modal-item-value">${formatDate(rate.arrival)}</div>
        </div>
        <div class="modal-item">
          <div class="modal-item-label">航行时效</div>
          <div class="modal-item-value" style="color:var(--primary)">${rate.transitDays} 天</div>
        </div>
        <div class="modal-item">
          <div class="modal-item-label">箱型 × 箱量</div>
          <div class="modal-item-value">${window._currentParams?.containerType || '-'} × ${qty}</div>
        </div>
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">费用明细</div>
      <table class="surcharge-table">
        <thead>
          <tr>
            <th>费用项目</th>
            <th class="text-right">金额/箱</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>基本海运费 (Ocean Freight)</td><td class="text-right">$${rate.price.toLocaleString()}</td></tr>
          ${surchargeRows}
          <tr class="total">
            <td>每箱合计</td>
            <td class="text-right" style="color:var(--primary)">$${totalPerBox.toLocaleString()}</td>
          </tr>
          ${qty > 1 ? `<tr class="total"><td>总价 (×${qty}箱)</td><td class="text-right" style="color:var(--primary)">$${grandTotal.toLocaleString()}</td></tr>` : ''}
        </tbody>
      </table>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">报价有效期</div>
      <div class="modal-item-value">${rate.validUntil || '请联系确认'}</div>
      <div style="font-size:12px;color:var(--text-3);margin-top:6px">
        ⚠ 以上价格为参考报价，最终价格以船公司书面确认为准
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn-primary-lg" onclick="alert('请联系业务员进行订舱')">立即订舱</button>
      <button class="btn-outline-lg" onclick="closeModal()">返回</button>
    </div>
  `;

  modalOverlay.classList.add('open');
}

function closeModal() {
  modalOverlay.classList.remove('open');
}

// ─────────────────────────────────────────────
// Reset
// ─────────────────────────────────────────────
function handleReset() {
  form.reset();
  containerGrid.querySelectorAll('.container-btn').forEach((b, i) => {
    b.classList.toggle('active', i === 0);
  });
  containerHidden.value = '20GP';
  $('weightGroup').style.display  = '';
  $('volumeGroup').style.display  = 'none';
  const d = new Date();
  d.setDate(d.getDate() + 7);
  $('departureDate').value = d.toISOString().slice(0, 10);
  resultsSection.style.display = 'none';
  window._currentRates = null;
}

// ─────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

// =============================================
// AI 智能搜索 — 港口智能匹配（v2）
// =============================================

// ── 港口知识库（新增非洲、印度、中东、南美等）──────────────
const AI_PORT_MAP = [
  // ── 中国出发港 ──
  { keys: ['中国','大陆','国内'],               port: { code:'CNSHA', name:'上海'    }, isCN: true  },
  { keys: ['上海','洋山'],                       port: { code:'CNSHA', name:'上海'    }, isCN: true  },
  { keys: ['深圳','盐田','南沙','蛇口','广东'],  port: { code:'CNSZX', name:'深圳'    }, isCN: true  },
  { keys: ['宁波','浙江'],                       port: { code:'CNNBO', name:'宁波'    }, isCN: true  },
  { keys: ['青岛','山东'],                       port: { code:'CNTAO', name:'青岛'    }, isCN: true  },
  { keys: ['天津','北京','北方','河北'],         port: { code:'CNTJN', name:'天津'    }, isCN: true  },
  { keys: ['厦门','福建'],                       port: { code:'CNXMN', name:'厦门'    }, isCN: true  },
  { keys: ['广州'],                              port: { code:'CNGZH', name:'广州'    }, isCN: true  },
  { keys: ['连云港'],                            port: { code:'CNLYG', name:'连云港'  }, isCN: true  },

  // ── 东南亚 ──
  { keys: ['印度尼西亚','印尼','雅加达'],        port: { code:'IDJKT', name:'雅加达'   } },
  { keys: ['泗水','苏拉巴亚'],                   port: { code:'IDSUB', name:'泗水'     } },
  { keys: ['新加坡'],                            port: { code:'SGSIN', name:'新加坡'   } },
  { keys: ['马来西亚','吉隆坡','巴生'],          port: { code:'MYPKG', name:'巴生港'   } },
  { keys: ['泰国','曼谷','林查班'],              port: { code:'THBKK', name:'曼谷'     } },
  { keys: ['越南','胡志明','西贡'],              port: { code:'VNSGN', name:'胡志明市' } },
  { keys: ['河内','海防'],                       port: { code:'VNHPH', name:'海防'     } },
  { keys: ['菲律宾','马尼拉'],                   port: { code:'PHMNL', name:'马尼拉'   } },
  { keys: ['缅甸','仰光'],                       port: { code:'MMRGN', name:'仰光'     } },
  { keys: ['柬埔寨','金边','西哈努克'],          port: { code:'KHPNH', name:'西哈努克港'} },

  // ── 南亚 ──
  { keys: ['印度','孟买','孟买港','Nhava Sheva'], port: { code:'INNSA', name:'孟买(JNPT)'} },
  { keys: ['印度钦奈','马德拉斯','金奈'],         port: { code:'INCHD', name:'钦奈'    } },
  { keys: ['巴基斯坦','卡拉奇'],                 port: { code:'PKKAR', name:'卡拉奇'   } },
  { keys: ['孟加拉','孟加拉国','吉大港','达卡'], port: { code:'BGCGP', name:'吉大港'   } },
  { keys: ['斯里兰卡','科伦坡'],                 port: { code:'LKCMB', name:'科伦坡'   } },

  // ── 东北亚 ──
  { keys: ['日本','大阪','神户','京都'],          port: { code:'JPOSA', name:'大阪'    } },
  { keys: ['东京','横滨'],                        port: { code:'JPTYO', name:'东京'    } },
  { keys: ['韩国','釜山','首尔'],                 port: { code:'KRPUS', name:'釜山'    } },

  // ── 中东 ──
  { keys: ['迪拜','阿联酋','UAE'],               port: { code:'AEDXB', name:'迪拜'     } },
  { keys: ['沙特','利雅得','吉达','沙特阿拉伯'], port: { code:'SAJED', name:'吉达'     } },
  { keys: ['阿曼','马斯喀特'],                   port: { code:'OMMCT', name:'马斯喀特' } },
  { keys: ['科威特'],                            port: { code:'KWKWI', name:'科威特港' } },
  { keys: ['卡塔尔','多哈'],                     port: { code:'QADOH', name:'多哈'     } },
  { keys: ['以色列','海法'],                     port: { code:'ILHFA', name:'海法'     } },
  { keys: ['土耳其','伊斯坦布尔','土国'],        port: { code:'TRIST', name:'伊斯坦布尔'} },

  // ── 非洲东部 ──
  { keys: ['肯尼亚','内罗毕','蒙巴萨'],          port: { code:'KEMBA', name:'蒙巴萨'   } },
  { keys: ['坦桑尼亚','达累斯萨拉姆','达萨'],    port: { code:'TZDAR', name:'达累斯萨拉姆'} },
  { keys: ['埃塞俄比亚','亚的斯亚贝巴'],         port: { code:'DJJIB', name:'吉布提'   } },
  { keys: ['吉布提'],                            port: { code:'DJJIB', name:'吉布提'   } },
  { keys: ['莫桑比克','马普托'],                 port: { code:'MZMPM', name:'马普托'   } },
  { keys: ['马达加斯加'],                        port: { code:'MGTNR', name:'塔那那利佛港'} },

  // ── 非洲南部 ──
  { keys: ['南非','德班','南非共和国'],           port: { code:'ZADUR', name:'德班'     } },
  { keys: ['开普敦'],                            port: { code:'ZACPT', name:'开普敦'   } },
  { keys: ['津巴布韦','哈拉雷'],                 port: { code:'ZADUR', name:'德班(转)'  } },

  // ── 非洲西部 ──
  { keys: ['尼日利亚','拉各斯','阿帕帕'],        port: { code:'NGAPP', name:'拉各斯(阿帕帕)'} },
  { keys: ['加纳','特马','阿克拉'],              port: { code:'GHTEM', name:'特马'     } },
  { keys: ['科特迪瓦','象牙海岸','阿比让'],      port: { code:'CIABJ', name:'阿比让'   } },
  { keys: ['喀麦隆','杜阿拉'],                   port: { code:'CMDLA', name:'杜阿拉'   } },
  { keys: ['塞内加尔','达喀尔'],                 port: { code:'SNDRK', name:'达喀尔'   } },
  { keys: ['刚果','金沙萨','马塔迪'],            port: { code:'CGPNR', name:'黑角'     } },
  { keys: ['安哥拉','罗安达'],                   port: { code:'AOLAD', name:'罗安达'   } },

  // ── 非洲北部 ──
  { keys: ['埃及','亚历山大','塞得港'],           port: { code:'EGALY', name:'亚历山大' } },
  { keys: ['摩洛哥','卡萨布兰卡'],               port: { code:'MACAS', name:'卡萨布兰卡'} },

  // ── 欧洲 ──
  { keys: ['荷兰','鹿特丹','欧洲','EU'],         port: { code:'NLRTM', name:'鹿特丹'   } },
  { keys: ['德国','汉堡'],                       port: { code:'DEHAM', name:'汉堡'     } },
  { keys: ['英国','伦敦','费利克斯托'],           port: { code:'GBFXT', name:'费利克斯托'} },
  { keys: ['比利时','安特卫普'],                 port: { code:'BEANR', name:'安特卫普' } },
  { keys: ['西班牙','巴伦西亚','马德里'],        port: { code:'ESVLC', name:'巴伦西亚' } },
  { keys: ['意大利','热那亚','那不勒斯'],        port: { code:'ITGOA', name:'热那亚'   } },
  { keys: ['希腊','比雷埃夫斯'],                 port: { code:'GRPIR', name:'比雷埃夫斯'} },

  // ── 北美 ──
  { keys: ['美国','北美','西海岸','洛杉矶'],      port: { code:'USLAX', name:'洛杉矶'   } },
  { keys: ['美国东岸','纽约','东海岸'],           port: { code:'USNYC', name:'纽约'     } },
  { keys: ['西雅图'],                            port: { code:'USSEA', name:'西雅图'   } },
  { keys: ['休斯顿','德克萨斯'],                 port: { code:'USHOU', name:'休斯顿'   } },
  { keys: ['萨凡纳','迈阿密'],                   port: { code:'USSAV', name:'萨凡纳'   } },
  { keys: ['加拿大','温哥华'],                   port: { code:'CAVAN', name:'温哥华'   } },
  { keys: ['墨西哥','曼萨尼约'],                 port: { code:'MXZLO', name:'曼萨尼约' } },

  // ── 南美 ──
  { keys: ['巴西','桑托斯','圣保罗'],            port: { code:'BRSSZ', name:'桑托斯'   } },
  { keys: ['阿根廷','布宜诺斯艾利斯'],           port: { code:'ARBUE', name:'布宜诺斯艾利斯'} },
  { keys: ['智利','圣安东尼奥','瓦尔帕莱索'],    port: { code:'CLSAI', name:'圣安东尼奥'} },
  { keys: ['秘鲁','卡亚俄','利马'],              port: { code:'PECLL', name:'卡亚俄'   } },

  // ── 大洋洲 ──
  { keys: ['澳大利亚','澳洲','悉尼','墨尔本'],   port: { code:'AUSYD', name:'悉尼'     } },
  { keys: ['新西兰','奥克兰'],                   port: { code:'NZAKL', name:'奥克兰'   } },
];

// 中国港口代码集合
const CN_PORT_CODES = new Set(['CNSHA','CNSZX','CNNBO','CNTAO','CNTJN','CNXMN','CNGZH','CNLYG']);

// 用端口知识库补充 PORTS（让表单 datalist 也能提示）
(function extendPorts() {
  const existingCodes = new Set(PORTS.map(p => p.code));
  AI_PORT_MAP.forEach(({ keys, port, isCN }) => {
    if (!existingCodes.has(port.code)) {
      const country = isCN ? '中国' : keys[0];
      PORTS.push({ code: port.code, name: port.name, country, region: isCN ? 'CN' : 'WORLD' });
      existingCodes.add(port.code);
    }
  });
})();

// 关键词匹配 → 港口
function matchKeyword(text) {
  for (const entry of AI_PORT_MAP) {
    if (entry.keys.some(k => text.includes(k))) return entry.port;
  }
  return null;
}

// 解析自然语言输入
function parseAiInput(raw) {
  const text = raw.trim();
  const splitRe = /到|去|发往|运往|运到|寄往|发|→|->|──|>|至/;
  const parts = text.split(splitRe).map(p => p.trim()).filter(Boolean);

  let origin = null, destination = null;

  if (parts.length >= 2) {
    origin      = matchKeyword(parts[0]);
    destination = matchKeyword(parts[1]);
    // 如果两端都识别到但都是非中国港口，尝试默认起运港
    if (origin && destination && !CN_PORT_CODES.has(origin.code) && !CN_PORT_CODES.has(destination.code)) {
      // 保持不变，让用户自行判断
    }
    // 如果起运端没识别但目的端是中国港口 → 交换
    if (!origin && destination && CN_PORT_CODES.has(destination.code)) {
      [origin, destination] = [destination, null];
    }
  } else {
    // 整段扫描
    for (const entry of AI_PORT_MAP) {
      if (entry.keys.some(k => text.includes(k))) {
        if (!origin && (entry.isCN || CN_PORT_CODES.has(entry.port.code))) {
          origin = entry.port;
        } else if (!destination && !CN_PORT_CODES.has(entry.port.code)) {
          destination = entry.port;
        }
      }
      if (origin && destination) break;
    }
  }

  // 识别到目的地但没识别起运港 → 默认上海
  if (!origin && destination) {
    origin = { code: 'CNSHA', name: '上海' };
  }

  return { origin, destination };
}

// 全局匹配结果（挂在 window 上避免作用域问题）
window._aiMatch = null;

function handleAiSearch() {
  const raw = (document.getElementById('aiSearchInput').value || '').trim();
  const tipEl  = document.getElementById('aiResultTip');
  const noRes  = document.getElementById('aiNoResult');
  const textEl = document.getElementById('aiResultText');

  if (!raw) { document.getElementById('aiSearchInput').focus(); return; }

  tipEl.style.display = 'none';
  noRes.style.display = 'none';

  const { origin, destination } = parseAiInput(raw);

  if (!origin && !destination) {
    noRes.style.display = '';
    return;
  }

  // 保存到全局
  window._aiMatch = { origin, destination };

  // 构建提示文案
  let msg = '已识别：';
  if (origin)                    msg += `<strong>起运港 → ${origin.name}（${origin.code}）</strong>`;
  if (origin && destination)     msg += ' &nbsp;✈&nbsp; ';
  if (destination)               msg += `<strong>目的港 → ${destination.name}（${destination.code}）</strong>`;
  if (origin && !destination)    msg += ' &nbsp;&nbsp; ⚠ 未识别目的港，已帮你匹配起运港，请手动选择目的港';
  if (!origin && destination)    msg += ' &nbsp;&nbsp; ⚠ 未识别起运港，已默认上海';

  textEl.innerHTML = msg;
  tipEl.style.display = '';
}

// 应用到表单（HTML onclick 直接调用）
function applyAiMatch() {
  const match = window._aiMatch;
  if (!match) return;

  const { origin, destination } = match;
  const originInput = document.getElementById('originPort');
  const destInput   = document.getElementById('destPort');

  function fillInput(inputEl, portInfo) {
    if (!portInfo) return;
    // 优先从已有 PORTS 数组找完整名称
    const found = PORTS.find(p => p.code === portInfo.code);
    const label = found ? `${found.name} (${found.code})` : `${portInfo.name} (${portInfo.code})`;
    inputEl.value = label;
    // 触发 input 事件让浏览器感知变化
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    // 高亮动画
    inputEl.classList.remove('input-highlight');
    void inputEl.offsetWidth;
    inputEl.classList.add('input-highlight');
    setTimeout(() => inputEl.classList.remove('input-highlight'), 800);
  }

  fillInput(originInput, origin);
  fillInput(destInput, destination);

  // 收起提示，清空搜索框
  document.getElementById('aiResultTip').style.display = 'none';
  document.getElementById('aiSearchInput').value = '';
  window._aiMatch = null;

  // 滚动到表单
  setTimeout(() => {
    document.getElementById('searchForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

function fillAiExample(btn) {
  const input = document.getElementById('aiSearchInput');
  input.value = btn.textContent.replace(/[→]/g, '到').trim();
  handleAiSearch();
}

// Enter 键绑定（兼容已加载 DOM）
(function bindAiEnter() {
  function bind() {
    const el = document.getElementById('aiSearchInput');
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') handleAiSearch(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
