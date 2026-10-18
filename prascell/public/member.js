const API = window.PRASCELL_API || 'http://localhost:3010';
async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, { headers: { 'content-type': 'application/json', ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) throw new Error(data.error || 'Request gagal.');
  return data;
}
const escapeHtml = (value) => String(value ?? '').replace(/[&<>\"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[character]));
const form = document.getElementById('order-form');
const feedback = document.getElementById('order-feedback');
const serviceSelect = document.getElementById('repair-service');
const warrantyHint = document.getElementById('warranty-hint');
let services = [];
api('/api/public/services').then((data) => {
  services = data.services || [];
  serviceSelect.insertAdjacentHTML('beforeend', services.map((service) => `<option value="${service.id}">${escapeHtml(service.brand || '')} ${escapeHtml(service.model || '')} · ${escapeHtml(service.issueName)}</option>`).join(''));
}).catch(() => {});
serviceSelect.addEventListener('change', () => {
  const service = services.find((item) => item.id === serviceSelect.value);
  warrantyHint.textContent = service?.warrantyEnabled ? `Garansi ${service.warrantyDays} hari · ${service.warrantyScope.replace('_', ' + ')}` : 'Layanan ini belum memiliki garansi atau akan ditentukan setelah pengecekan.';
});
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(form).entries());
  body.createMember = Boolean(form.createMember.checked);
  feedback.textContent = 'Mengirim permintaan...';
  try {
    const data = await api('/api/public/orders', { method: 'POST', body: JSON.stringify(body) });
    feedback.textContent = `Order dibuat: ${data.order.order_code}. Simpan kode ini untuk tracking.`;
    form.reset();
    form.createMember.checked = true;
  } catch (error) {
    feedback.textContent = error.message;
  }
});
