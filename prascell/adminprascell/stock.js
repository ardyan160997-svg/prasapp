const API = '';
const tokenKey = 'prascell_admin_token';
let token = localStorage.getItem(tokenKey) || '';
let inventory = [];
const qs = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));
async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, { headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) throw new Error(data.error || 'Request gagal.');
  return data;
}
function showApp() { qs('#login').classList.add('hidden'); qs('#app').classList.remove('hidden'); }
function resetForm() { qs('#stock-form').reset(); qs('#stock-form').elements.id.value = ''; qs('#stock-form-title').textContent = 'Tambah barang'; }
function render() {
  qs('#stock-list').innerHTML = inventory.map((item) => {
    const low = item.is_active && Number(item.quantity) <= Number(item.minimum_stock);
    const movements = item.movements || [];
    return `<article class="stock-card ${low ? 'stock-low' : ''}"><div class="stock-card-head"><div><small>${escapeHtml(item.category)} · ${escapeHtml(item.sku || 'Tanpa SKU')}</small><h3>${escapeHtml(item.name)}</h3></div><span class="pill">${item.is_active ? (low ? 'Stok menipis' : 'Aktif') : 'Nonaktif'}</span></div><div class="stock-numbers"><strong>${Number(item.quantity)}</strong><span>Minimum ${Number(item.minimum_stock)}</span></div><p>${escapeHtml(item.location || 'Lokasi belum diisi')} · Beli ${rupiah(item.buy_price)} · Jual ${rupiah(item.sell_price)}</p><div class="row-actions"><button type="button" data-stock-edit="${item.id}">Edit / Atur stok</button></div><details><summary>Riwayat stok (${movements.length})</summary>${movements.map((movement) => `<p><b>${Number(movement.quantity_change) > 0 ? '+' : ''}${Number(movement.quantity_change)}</b> · ${Number(movement.quantity_before)} → ${Number(movement.quantity_after)}<small>${escapeHtml(movement.notes)} · ${new Date(movement.created_at).toLocaleString('id-ID')}</small></p>`).join('') || '<p>Belum ada pergerakan.</p>'}</details></article>`;
  }).join('') || '<p class="muted">Belum ada barang atau sparepart.</p>';
}
async function load() { const response = await api('/api/admin/dashboard'); inventory = response.data.inventory || []; window.updateAdminNavBadges?.(response.data.notifications); render(); }
qs('#login-form').addEventListener('submit', async (event) => { event.preventDefault(); try { const response = await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: qs('#password').value }) }); token = response.token; localStorage.setItem(tokenKey, token); showApp(); await load(); } catch (error) { qs('#login-feedback').textContent = error.message; } });
qs('#stock-form').addEventListener('submit', async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const payload = Object.fromEntries(form); payload.isActive = form.get('isActive') === 'on'; try { await api('/api/admin/inventory', { method: payload.id ? 'PATCH' : 'POST', body: JSON.stringify(payload) }); resetForm(); await load(); } catch (error) { qs('#stock-feedback').textContent = error.message; } });
qs('#stock-list').addEventListener('click', (event) => { const button = event.target.closest('[data-stock-edit]'); if (!button) return; const item = inventory.find((entry) => entry.id === button.dataset.stockEdit); if (!item) return; const form = qs('#stock-form'); for (const [name, key] of Object.entries({ id:'id',name:'name',sku:'sku',category:'category',quantity:'quantity',minimumStock:'minimum_stock',buyPrice:'buy_price',sellPrice:'sell_price',location:'location',notes:'notes' })) form.elements[name].value = item[key] ?? ''; form.elements.isActive.checked = item.is_active; qs('#stock-form-title').textContent = `Edit ${item.name}`; form.scrollIntoView({ behavior: 'smooth' }); });
qs('#stock-reset').addEventListener('click', resetForm);
qs('#refresh').addEventListener('click', load);
if (token) { showApp(); load().catch(() => { token = ''; localStorage.removeItem(tokenKey); location.reload(); }); }
