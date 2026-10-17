const API = '';
const tokenKey = 'prascell_admin_token';
let token = localStorage.getItem(tokenKey) || '';
let state = { members: [], models: [], services: [], orders: [], chats: [], statuses: [] };

const rupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));
const qs = (sel) => document.querySelector(sel);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function toast(message, tone = 'success') {
  document.querySelectorAll('.toast').forEach((el) => el.remove());
  const el = document.createElement('div');
  el.className = `toast ${tone === 'error' ? 'error' : ''}`;
  el.textContent = message;
  document.body.append(el);
  setTimeout(() => el.remove(), 3200);
}

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) throw new Error(data.error || 'Request gagal.');
  return data;
}

function showApp() {
  qs('#login').classList.add('hidden');
  qs('#app').classList.remove('hidden');
}

function stats() {
  const items = [
    ['Order', state.orders.length],
    ['Baru', state.orders.filter((o) => o.status === 'baru').length],
    ['Dikerjakan', state.orders.filter((o) => o.status === 'dikerjakan').length],
    ['Member', state.members.length],
    ['Panduan', state.services.length],
  ];
  qs('#stats').innerHTML = items.map(([label, value]) => `<div class="stat"><small>${label}</small><strong>${value}</strong></div>`).join('');
}

function renderModels() {
  const select = qs('#service-form [name="phoneModelId"]');
  const selected = select.value;
  select.innerHTML = '<option value="">Pilih model HP</option>' + state.models.filter((m) => m.is_active).map((m) => `<option value="${m.id}">${escapeHtml(m.brand)} ${escapeHtml(m.model)}</option>`).join('');
  if ([...select.options].some((option) => option.value === selected)) select.value = selected;
  qs('#model-list').innerHTML = state.models.map((m) => `<div class="row"><div><b>${escapeHtml(m.brand)} ${escapeHtml(m.model)}</b><small>${escapeHtml(m.notes || '')}</small></div><span class="pill">${m.is_active ? 'Aktif' : 'Nonaktif'}</span></div>`).join('') || '<p class="muted">Belum ada database HP.</p>';
}

function renderServices() {
  qs('#service-list').innerHTML = state.services.map((s) => `<article class="row guide ${s.is_active ? '' : 'row-inactive'}"><div><div class="row-title"><b>${escapeHtml(s.brand || 'Umum')} ${escapeHtml(s.model || '')} — ${escapeHtml(s.issue_name)}</b><span class="pill">${escapeHtml(s.issue_category || 'hardware')}</span></div><small>${rupiah(s.price_min)} - ${rupiah(s.price_max)} · ${escapeHtml(s.duration_estimate || 'Waktu fleksibel')}</small><details><summary>Baca panduan teknisi</summary><div class="guide-grid"><div><b>Gejala</b><br>${escapeHtml(s.symptoms)}</div><div><b>Penyebab</b><br>${escapeHtml(s.cause)}</div><div><b>Perbaikan</b><br>${escapeHtml(s.repair_method)}</div><div><b>Assembly</b><br>${escapeHtml(s.assembly_steps)}</div><div><b>Alat</b><br>${escapeHtml(s.tools)}</div><div><b>Spare part</b><br>${escapeHtml(s.spare_parts)}</div></div></details></div><div class="row-actions"><button type="button" data-service-edit="${s.id}">Edit</button>${s.is_active ? `<button class="button-danger" type="button" data-service-archive="${s.id}">Nonaktifkan</button>` : '<span class="pill">Nonaktif</span>'}</div></article>`).join('') || '<p class="muted">Belum ada panduan servis.</p>';
}

function fillServiceForm(service) {
  const form = qs('#service-form');
  for (const [name, value] of Object.entries({ id: service.id, phoneModelId: service.phone_model_id, issueCategory: service.issue_category || 'hardware', issueName: service.issue_name, priceMin: service.price_min, priceMax: service.price_max, durationEstimate: service.duration_estimate, symptoms: service.symptoms, cause: service.cause, repairMethod: service.repair_method, assemblySteps: service.assembly_steps, tools: service.tools, spareParts: service.spare_parts })) {
    if (form.elements[name]) form.elements[name].value = value ?? '';
  }
  qs('#service-cancel').classList.remove('hidden');
  form.querySelector('button[type="submit"]').textContent = 'Update Masalah';
  requestAnimationFrame(() => window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' }));
}

function resetServiceForm() {
  const form = qs('#service-form');
  form.reset();
  form.elements.id.value = '';
  qs('#service-cancel').classList.add('hidden');
  form.querySelector('button[type="submit"]').textContent = 'Simpan Masalah';
}

function renderOrders() {
  qs('#order-list').innerHTML = state.orders.map((o) => `<article class="row order-row"><div><b>${escapeHtml(o.order_code)}</b><small>${escapeHtml(o.customer_name)} · ${escapeHtml(o.whatsapp_number)}</small><p>${escapeHtml(o.phone_brand)} ${escapeHtml(o.phone_model)} — ${escapeHtml(o.issue_description)}</p><span class="pill">${escapeHtml(o.status)}</span></div><form class="order-edit" data-id="${o.id}"><select name="status">${state.statuses.map((s) => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select><input name="finalTotal" type="number" placeholder="Total final" value="${Number(o.final_total || 0)}"><textarea name="technicianNotes" placeholder="Catatan teknisi">${escapeHtml(o.technician_notes || '')}</textarea><button>Simpan update order</button></form></article>`).join('') || '<p class="muted">Belum ada order.</p>';
}

function renderMembers() {
  qs('#member-list').innerHTML = state.members.map((m) => `<div class="row"><div><b>${escapeHtml(m.full_name)}</b><small>${escapeHtml(m.member_code)} · ${escapeHtml(m.whatsapp_number)}</small></div><div>${escapeHtml(m.email || '')}</div><small>${escapeHtml(m.device_notes || '')}</small></div>`).join('') || '<p class="muted">Belum ada member.</p>';
}

function renderChats() {
  qs('#chat-list').innerHTML = state.chats.map((c) => `<div class="row"><div><b>${escapeHtml(c.customer_name || 'Pengunjung')}</b><small>${escapeHtml(c.session_id)}</small></div><span class="pill">${escapeHtml(c.status)}</span></div>`).join('') || '<p class="muted">Belum ada chat.</p>';
}

function render() {
  stats(); renderModels(); renderServices(); renderOrders(); renderMembers(); renderChats();
}

async function loadDashboard() {
  const data = await api('/api/admin/dashboard');
  state = data.data;
  render();
}

function formJson(form) {
  return JSON.stringify(Object.fromEntries(new FormData(form).entries()));
}

qs('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  qs('#login-feedback').textContent = 'Masuk...';
  try {
    const data = await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: qs('#password').value }) });
    token = data.token;
    localStorage.setItem(tokenKey, token);
    showApp();
    await loadDashboard();
  } catch (error) {
    qs('#login-feedback').textContent = error.message;
  }
});

qs('#refresh').addEventListener('click', () => loadDashboard().then(() => toast('Data diperbarui')).catch((e) => toast(e.message, 'error')));
qs('#model-form').addEventListener('submit', async (event) => { event.preventDefault(); try { await api('/api/admin/models', { method: 'POST', body: formJson(event.target) }); event.target.reset(); await loadDashboard(); toast('Database HP tersimpan'); } catch (e) { toast(e.message, 'error'); } });
qs('#service-form').addEventListener('submit', async (event) => { event.preventDefault(); const body = Object.fromEntries(new FormData(event.target).entries()); const editing = Boolean(body.id); try { await api('/api/admin/services', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(body) }); resetServiceForm(); await loadDashboard(); toast(editing ? 'Masalah dan biaya diperbarui' : 'Masalah dan biaya ditambahkan'); } catch (e) { toast(e.message, 'error'); } });
qs('#service-cancel').addEventListener('click', resetServiceForm);
qs('#service-list').addEventListener('click', async (event) => {
  const edit = event.target.closest('[data-service-edit]');
  if (edit) return fillServiceForm(state.services.find((service) => service.id === edit.dataset.serviceEdit));
  const archive = event.target.closest('[data-service-archive]');
  if (!archive || !confirm('Nonaktifkan masalah ini dari halaman estimasi? Data tetap tersimpan.')) return;
  try { await api('/api/admin/services', { method: 'DELETE', body: JSON.stringify({ id: archive.dataset.serviceArchive }) }); await loadDashboard(); toast('Masalah dinonaktifkan'); } catch (e) { toast(e.message, 'error'); }
});
qs('#order-list').addEventListener('submit', async (event) => { const form = event.target.closest('.order-edit'); if (!form) return; event.preventDefault(); const body = Object.fromEntries(new FormData(form).entries()); body.id = form.dataset.id; try { await api('/api/admin/orders', { method: 'PATCH', body: JSON.stringify(body) }); await loadDashboard(); toast('Order diperbarui'); } catch (e) { toast(e.message, 'error'); } });

if (token) { showApp(); loadDashboard().catch(() => localStorage.removeItem(tokenKey)); }
