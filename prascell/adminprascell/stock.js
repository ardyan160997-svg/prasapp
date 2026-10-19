const API = '';
const tokenKey = 'prascell_admin_token';
let token = localStorage.getItem(tokenKey) || '';
let inventory = [];
let selectedStockId = '';
const qs = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, { headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) throw new Error(data.error || 'Request gagal.');
  return data;
}

function showApp() {
  qs('#login').classList.add('hidden');
  qs('#app').classList.remove('hidden');
}

function setStockPage(mode, item) {
  const browsing = mode === 'browse';
  qs('#stock-page-title').textContent = browsing ? 'Database Stok' : item?.name || 'Tambah Barang';
  qs('#stock-page-eyebrow').textContent = browsing ? 'Inventori toko' : mode === 'detail' ? 'Detail barang' : item ? 'Edit barang' : 'Barang baru';
  qs('#stock-back').classList.toggle('hidden', browsing);
  qs('#stock-add').classList.toggle('hidden', !browsing);
  qs('#stock-browser').classList.toggle('hidden', !browsing);
  qs('#stock-detail').classList.toggle('hidden', mode !== 'detail');
  qs('#stock-editor').classList.toggle('hidden', !['add', 'edit'].includes(mode));
  if (!browsing) requestAnimationFrame(() => window.scrollTo({ top: qs('#stock-page-head').getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' }));
}

function resetForm() {
  const form = qs('#stock-form');
  form.reset();
  form.elements.id.value = '';
  form.elements.category.value = 'Sparepart';
  form.elements.quantity.value = 0;
  form.elements.minimumStock.value = 0;
  qs('#stock-image-preview').innerHTML = '<span>Belum ada foto</span>';
  qs('#stock-feedback').textContent = '';
}

function render() {
  const query = qs('#stock-search').value.trim().toLowerCase();
  const items = inventory.filter((item) => [item.name, item.sku, item.category, item.location].some((value) => String(value || '').toLowerCase().includes(query)));
  qs('#stock-list').innerHTML = items.map((item) => {
    const low = item.is_active && Number(item.quantity) <= Number(item.minimum_stock);
    return `<button class="stock-card ${low ? 'stock-low' : ''}" type="button" data-stock-view="${item.id}"><span class="stock-card-image">${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}">` : '<span class="stock-image-empty"><i aria-hidden="true"></i><small>Belum ada foto</small></span>'}</span><span class="stock-card-copy"><small>${escapeHtml(item.category)} · ${escapeHtml(item.sku || 'Tanpa SKU')}</small><b>${escapeHtml(item.name)}</b><strong>${Number(item.quantity)} stok</strong><em>${item.is_active ? (low ? 'Stok menipis' : 'Aktif') : 'Nonaktif'}</em></span></button>`;
  }).join('') || `<p class="muted">${query ? 'Tidak ada barang yang cocok.' : 'Belum ada barang atau sparepart.'}</p>`;
}

function movementHtml(item) {
  const movements = item.movements || [];
  return movements.map((movement) => `<p><b>${Number(movement.quantity_change) > 0 ? '+' : ''}${Number(movement.quantity_change)}</b> · ${Number(movement.quantity_before)} → ${Number(movement.quantity_after)}<small>${escapeHtml(movement.notes)} · ${new Date(movement.created_at).toLocaleString('id-ID')}</small></p>`).join('') || '<p>Belum ada pergerakan.</p>';
}

function showStockDetail(item) {
  if (!item) return;
  selectedStockId = item.id;
  const low = item.is_active && Number(item.quantity) <= Number(item.minimum_stock);
  qs('#stock-detail').innerHTML = `<header class="stock-detail-head"><span class="stock-detail-image">${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}">` : '<span class="stock-image-empty"><i aria-hidden="true"></i><small>Belum ada foto</small></span>'}</span><div><small>${escapeHtml(item.category)} · ${escapeHtml(item.sku || 'Tanpa SKU')}</small><h3>${escapeHtml(item.name)}</h3><p>${item.is_active ? (low ? 'Stok menipis' : 'Barang aktif') : 'Barang nonaktif'}</p></div><button type="button" data-stock-edit="${item.id}">Edit</button></header><div class="stock-detail-facts"><div><small>Stok saat ini</small><strong>${Number(item.quantity)}</strong></div><div><small>Batas minimum</small><strong>${Number(item.minimum_stock)}</strong></div><div><small>Harga beli</small><strong>${rupiah(item.buy_price)}</strong></div><div><small>Harga jual</small><strong>${rupiah(item.sell_price)}</strong></div><div><small>Lokasi</small><strong>${escapeHtml(item.location || '-')}</strong></div><div><small>Catatan</small><strong>${escapeHtml(item.notes || '-')}</strong></div></div><details class="stock-history"><summary>Riwayat stok (${(item.movements || []).length})</summary>${movementHtml(item)}</details>`;
  setStockPage('detail', item);
}

function fillForm(item) {
  if (!item) return;
  selectedStockId = item.id;
  const form = qs('#stock-form');
  for (const [name, key] of Object.entries({ id: 'id', name: 'name', sku: 'sku', category: 'category', quantity: 'quantity', minimumStock: 'minimum_stock', buyPrice: 'buy_price', sellPrice: 'sell_price', location: 'location', notes: 'notes' })) form.elements[name].value = item[key] ?? '';
  form.elements.isActive.checked = item.is_active;
  form.elements.image.value = '';
  qs('#stock-image-preview').innerHTML = item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}">` : '<span>Belum ada foto</span>';
  setStockPage('edit', item);
}

function filePayload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ mimeType: file.type, data: String(reader.result).split(',')[1] });
    reader.onerror = () => reject(new Error('Foto gagal dibaca.'));
    reader.readAsDataURL(file);
  });
}

async function load() {
  const response = await api('/api/admin/dashboard');
  inventory = response.data.inventory || [];
  window.updateAdminNavBadges?.(response.data.notifications);
  render();
}

qs('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const response = await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: qs('#password').value }) });
    token = response.token;
    localStorage.setItem(tokenKey, token);
    showApp();
    await load();
  } catch (error) { qs('#login-feedback').textContent = error.message; }
});

qs('#stock-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const image = form.get('image');
  const payload = Object.fromEntries(form);
  delete payload.image;
  payload.isActive = form.get('isActive') === 'on';
  let saved;
  try {
    if (image?.size > 2 * 1024 * 1024) throw new Error('Ukuran gambar maksimal 2 MB.');
    saved = await api('/api/admin/inventory', { method: payload.id ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
    if (image?.size) {
      const encoded = await filePayload(image);
      await api('/api/admin/inventory/image', { method: 'POST', body: JSON.stringify({ id: saved.item.id, ...encoded }) });
    }
    selectedStockId = saved.item.id;
    resetForm();
    await load();
    showStockDetail(inventory.find((item) => item.id === selectedStockId));
  } catch (error) {
    qs('#stock-feedback').textContent = saved ? `Barang sudah tersimpan, tetapi foto gagal: ${error.message}` : error.message;
  }
});

qs('#stock-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-stock-view]');
  if (button) showStockDetail(inventory.find((item) => item.id === button.dataset.stockView));
});
qs('#stock-detail').addEventListener('click', (event) => {
  const button = event.target.closest('[data-stock-edit]');
  if (button) fillForm(inventory.find((item) => item.id === button.dataset.stockEdit));
});
qs('#stock-add').addEventListener('click', () => { selectedStockId = ''; resetForm(); setStockPage('add'); });
qs('#stock-back').addEventListener('click', () => { selectedStockId = ''; resetForm(); setStockPage('browse'); });
qs('#stock-reset').addEventListener('click', () => {
  const item = inventory.find((entry) => entry.id === selectedStockId);
  resetForm();
  if (item) showStockDetail(item); else setStockPage('browse');
});
qs('#stock-search').addEventListener('input', render);
qs('#stock-form [name="image"]').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  qs('#stock-image-preview').innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Preview foto barang">`;
});
qs('#refresh').addEventListener('click', load);
if (token) { showApp(); load().catch(() => { token = ''; localStorage.removeItem(tokenKey); location.reload(); }); }
