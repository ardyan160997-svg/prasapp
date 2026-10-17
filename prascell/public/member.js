const API = window.PRASCELL_API || 'http://localhost:3010';
async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, { headers: { 'content-type': 'application/json', ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) throw new Error(data.error || 'Request gagal.');
  return data;
}
const form = document.getElementById('order-form');
const feedback = document.getElementById('order-feedback');
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
