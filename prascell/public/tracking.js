const API = window.PRASCELL_API || 'http://localhost:3010';
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character]));
async function api(path) {
  const response = await fetch(`${API}${path}`, { headers: { 'content-type': 'application/json' } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) throw new Error(data.error || 'Request gagal.');
  return data;
}
function warrantyCard(order) {
  if (!order.warranty_code) return '';
  const active = order.warranty_status === 'aktif';
  const scope = String(order.warranty_scope || '').replace('_', ' + ');
  const claimText = encodeURIComponent(`Halo PrasCell, saya ingin klaim garansi.\nKode garansi: ${order.warranty_code}\nKode order: ${order.order_code}\nPerangkat: ${order.phone_brand || ''} ${order.phone_model || ''}\nKeluhan: `);
  return `<section class="warranty-card"><div class="warranty-head"><div><small>Garansi servis</small><b>${escapeHtml(order.warranty_code)}</b></div><div class="warranty-status-wrap"><small>Status garansi</small><span class="warranty-status warranty-${escapeHtml(order.warranty_status)}">${escapeHtml(order.warranty_status)}</span></div></div><dl><div><dt>Cakupan</dt><dd>${escapeHtml(scope)}</dd></div><div><dt>Berlaku sampai</dt><dd>${order.warranty_ends_at ? new Date(order.warranty_ends_at).toLocaleDateString('id-ID') : '-'}</dd></div></dl>${order.warranty_terms ? `<p><b>Syarat:</b> ${escapeHtml(order.warranty_terms)}</p>` : ''}${order.warranty_exclusions ? `<p><b>Tidak termasuk:</b> ${escapeHtml(order.warranty_exclusions)}</p>` : ''}${active ? `<a class="warranty-claim" href="https://wa.me/?text=${claimText}" target="_blank" rel="noopener">Klaim lewat WhatsApp</a>` : ''}</section>`;
}
function renderOrders(orders) {
  const target = document.getElementById('tracking-result');
  if (!orders.length) { target.innerHTML = '<p>Order tidak ditemukan.</p>'; return; }
  target.innerHTML = orders.map((order) => `<article class="order-card"><div><b>${escapeHtml(order.order_code)}</b><p>${escapeHtml(order.phone_brand || '')} ${escapeHtml(order.phone_model || '')}</p><small>${escapeHtml(order.issue_description || '')}</small></div><span class="status">${escapeHtml(order.status)}</span>${warrantyCard(order)}</article>`).join('');
}
document.getElementById('tracking-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = document.getElementById('tracking-query').value.trim();
  const target = document.getElementById('tracking-result');
  target.innerHTML = '<p>Mencari order...</p>';
  try {
    const data = await api(`/api/public/tracking?q=${encodeURIComponent(query)}`);
    renderOrders(data.orders || []);
  } catch (error) { target.innerHTML = `<p>${escapeHtml(error.message)}</p>`; }
});
