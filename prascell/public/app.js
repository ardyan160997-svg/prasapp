const API = window.PRASCELL_API || 'http://localhost:3010';
const rupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));
const sessionId = localStorage.getItem('prascell_session') || crypto.randomUUID();
localStorage.setItem('prascell_session', sessionId);

let services = [];

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, { headers: { 'content-type': 'application/json', ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) throw new Error(data.error || 'Request gagal.');
  return data;
}

function option(value, label) {
  const el = document.createElement('option');
  el.value = value;
  el.textContent = label;
  return el;
}

function serviceLabel(service) {
  return `${service.brand || 'Umum'} ${service.model || ''} — ${service.issueName}`.replace(/\s+/g, ' ').trim();
}

function hydrateFilters() {
  const brand = document.getElementById('brand');
  const model = document.getElementById('model');
  const issue = document.getElementById('issue');
  const brands = [...new Set(services.map((item) => item.brand).filter(Boolean))].sort();
  brand.append(...brands.map((item) => option(item, item)));
  const update = () => {
    const selectedBrand = brand.value;
    const selectedModel = model.value;
    const filtered = services.filter((item) => (!selectedBrand || item.brand === selectedBrand));
    model.replaceChildren(option('', 'Semua model'), ...[...new Set(filtered.map((item) => item.model).filter(Boolean))].sort().map((item) => option(item, item)));
    if (selectedModel && [...model.options].some((item) => item.value === selectedModel)) model.value = selectedModel;
    const issueRows = services.filter((item) => (!brand.value || item.brand === brand.value) && (!model.value || item.model === model.value));
    issue.replaceChildren(option('', 'Pilih kerusakan'), ...issueRows.map((item) => option(item.id, serviceLabel(item))));
  };
  brand.addEventListener('change', update);
  model.addEventListener('change', update);
  update();
}

function renderEstimate(service) {
  const target = document.getElementById('estimate-result');
  if (!service) {
    target.className = 'result-card empty';
    target.textContent = 'Pilih data HP untuk melihat estimasi.';
    return;
  }
  target.className = 'result-card';
  target.innerHTML = `<p class="eyebrow">Estimasi servis</p><h3>${serviceLabel(service)}</h3><div class="estimate-price">${rupiah(service.priceMin)} - ${rupiah(service.priceMax)}</div><p>${service.symptoms || 'Teknisi akan cek kondisi HP dulu sebelum menentukan biaya final.'}</p><p><b>Estimasi waktu:</b> ${service.durationEstimate || 'Menyesuaikan spare part dan antrean servis.'}</p>`;
}

async function loadServices() {
  try {
    const data = await api('/api/public/services');
    services = data.services || [];
    hydrateFilters();
  } catch (error) {
    document.getElementById('estimate-result').textContent = 'Database estimasi belum tersedia. Coba lagi nanti.';
  }
}

function setupEstimate() {
  document.getElementById('estimate-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const selected = services.find((item) => item.id === document.getElementById('issue').value);
    renderEstimate(selected);
  });
}


function renderOrders(orders) {
  const target = document.getElementById('tracking-result');
  if (!orders.length) {
    target.innerHTML = '<p>Order tidak ditemukan.</p>';
    return;
  }
  target.innerHTML = orders.map((order) => `<article class="order-card"><div><b>${order.order_code}</b><p>${order.phone_brand || ''} ${order.phone_model || ''}</p><small>${order.issue_description || ''}</small></div><span class="status">${order.status}</span></article>`).join('');
}

function setupTracking() {
  document.getElementById('tracking-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = document.getElementById('tracking-query').value.trim();
    const target = document.getElementById('tracking-result');
    target.innerHTML = '<p>Mencari order...</p>';
    try {
      const data = await api(`/api/public/tracking?q=${encodeURIComponent(query)}`);
      renderOrders(data.orders || []);
    } catch (error) {
      target.innerHTML = `<p>${error.message}</p>`;
    }
  });
}

function setupChat() {
  const box = document.getElementById('chat-box');
  const open = () => box.classList.remove('hidden');
  const close = () => box.classList.add('hidden');
  document.getElementById('chat-toggle').addEventListener('click', open);
  document.getElementById('chat-nav').addEventListener('click', open);
  document.getElementById('chat-close').addEventListener('click', close);
  document.getElementById('chat-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;
    const list = document.getElementById('chat-messages');
    list.insertAdjacentHTML('beforeend', `<p class="bubble me">${message.replace(/[<>]/g, '')}</p>`);
    input.value = '';
    try {
      await api('/api/public/chat', { method: 'POST', body: JSON.stringify({ sessionId, message }) });
    } catch {
      list.insertAdjacentHTML('beforeend', '<p class="bubble admin">Pesan belum terkirim. Coba lagi nanti.</p>');
    }
    list.scrollTop = list.scrollHeight;
  });
}

setupEstimate();
setupTracking();
setupChat();
loadServices();
