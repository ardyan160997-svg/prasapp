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
  if (select?.tagName === 'SELECT') {
    const selected = select.value;
    select.innerHTML = '<option value="">Pilih model HP</option>' + state.models.filter((m) => m.is_active).map((m) => `<option value="${m.id}">${escapeHtml(m.brand)} ${escapeHtml(m.model)}</option>`).join('');
    if ([...select.options].some((option) => option.value === selected)) select.value = selected;
  }
  qs('#model-list').innerHTML = state.models.map((m) => `<button class="model-card ${m.is_active ? '' : 'row-inactive'}" type="button" data-model-edit="${m.id}"><span class="model-image">${m.image_url ? `<img src="${escapeHtml(m.image_url)}" alt="${escapeHtml(`${m.brand} ${m.model}`)}">` : '<i aria-hidden="true"></i>'}</span><span class="model-card-copy"><small>${escapeHtml(m.brand)}</small><b>${escapeHtml(m.model)}</b></span><span class="model-card-status">${m.is_active ? 'Aktif' : 'Nonaktif'}</span></button>`).join('') || '<p class="muted">Belum ada database HP.</p>';
}

function fillModelForm(model) {
  const form = qs('#model-form');
  form.classList.remove('hidden');
  for (const [name, value] of Object.entries({ id: model.id, brand: model.brand, model: model.model, notes: model.notes })) form.elements[name].value = value ?? '';
  qs('#model-image-preview').innerHTML = model.image_url ? `<img src="${escapeHtml(model.image_url)}" alt="Preview ${escapeHtml(model.model)}">` : '<span>Belum ada gambar</span>';
  qs('#model-cancel').classList.remove('hidden');
  qs('#model-archive').classList.toggle('hidden', !model.is_active);
  form.querySelector('button[type="submit"]').textContent = 'Update Model';
  requestAnimationFrame(() => window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' }));
}

function resetModelForm() {
  const form = qs('#model-form');
  form.reset();
  form.elements.id.value = '';
  qs('#model-image-preview').innerHTML = '<span>Belum ada gambar</span>';
  qs('#model-cancel').classList.add('hidden');
  qs('#model-archive').classList.add('hidden');
  form.querySelector('button[type="submit"]').textContent = 'Simpan Model';
  form.classList.add('hidden');
}

function imageData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Gambar gagal dibaca.'));
    reader.readAsDataURL(file);
  });
}

function renderServices() {
  const guides = document.body.classList.contains('admin-page-guides');
  const list = qs('#service-list');
  list.className = 'service-grid';
  const query = guides ? String(qs('#guide-search')?.value || '').trim().toLowerCase() : '';
  const services = query ? state.services.filter((service) => [service.brand, service.model, service.issue_category, service.issue_name].some((value) => String(value || '').toLowerCase().includes(query))) : state.services;
  list.innerHTML = services.map((service) => {
    const model = state.models.find((item) => item.id === service.phone_model_id);
    const image = model?.image_url;
    const guideReady = Boolean(service.repair_method || service.symptoms || service.cause);
    return `<button class="service-card ${service.is_active ? '' : 'row-inactive'}" type="button" data-service-edit="${service.id}"><span class="service-card-image">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(`${service.brand || ''} ${service.model || ''}`)}">` : '<i aria-hidden="true"></i>'}</span><span class="service-card-copy"><small>${escapeHtml(service.brand || 'Umum')}</small><b>${escapeHtml(service.model || '')}</b><strong>${escapeHtml(service.issue_name)}</strong></span><span class="service-card-category">${escapeHtml(service.issue_category || 'hardware')}</span><span class="service-card-footer"><span class="service-card-state">${guides ? (guideReady ? 'Panduan tersedia' : 'Belum diisi') : rupiah(service.price_min)}</span><span class="service-card-open">Buka ›</span></span></button>`;
  }).join('') || '<p class="muted">Belum ada data servis.</p>';
}

function guideImagePreview(id, url, label) {
  qs(`#${id}`).innerHTML = url ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(label)}">` : '<span>Belum ada foto</span>';
}

function renderDisassembly(service) {
  const list = qs('#disassembly-list');
  if (!list) return;
  const images = Array.isArray(service.disassembly_images) ? service.disassembly_images : [];
  list.innerHTML = images.map((item, index) => `<article class="disassembly-step"><span class="step-number">${index + 1}</span><img src="${escapeHtml(item.url)}" alt="Langkah ${index + 1}"><textarea data-step-caption="${index}" placeholder="Caption langkah">${escapeHtml(item.caption || '')}</textarea><div><button type="button" data-step-move="${index}" data-direction="-1" ${index ? '' : 'disabled'}>Naik</button><button type="button" data-step-move="${index}" data-direction="1" ${index < images.length - 1 ? '' : 'disabled'}>Turun</button><button type="button" data-step-remove="${index}">Hapus</button></div></article>${index < images.length - 1 ? '<span class="step-arrow" aria-hidden="true">→</span>' : ''}`).join('') || '<p class="disassembly-empty">Belum ada foto langkah bongkar pasang.</p>';
}

function renderGuideMedia(service) {
  if (!document.body.classList.contains('admin-page-guides')) return;
  guideImagePreview('cause-media', service.cause_image_url, 'Foto penyebab');
  guideImagePreview('repair-media', service.repair_image_url, 'Foto tindakan perbaikan');
  guideImagePreview('sparePart-media', service.spare_part_image_url, 'Foto spare part');
  renderDisassembly(service);
}

function fillServiceForm(service) {
  const form = qs('#service-form');
  const guides = document.body.classList.contains('admin-page-guides');
  form.classList.remove('hidden');
  for (const [name, value] of Object.entries({ id: service.id, phoneModelId: service.phone_model_id, issueCategory: service.issue_category || 'hardware', issueName: service.issue_name, priceMin: service.price_min, priceMax: service.price_max, durationEstimate: service.duration_estimate, symptoms: service.symptoms, cause: service.cause, repairMethod: service.repair_method, assemblySteps: service.assembly_steps, tools: service.tools, spareParts: service.spare_parts })) {
    if (form.elements[name]) form.elements[name].value = value ?? '';
  }
  if (guides) {
    const context = qs('#guide-context');
    context.innerHTML = `<small>${escapeHtml(service.brand || 'Umum')}</small><b>${escapeHtml(service.model || '')}</b><span>${escapeHtml(service.issue_category || 'hardware')} · ${escapeHtml(service.issue_name)}</span>`;
    renderGuideMedia(service);
  }
  qs('#service-cancel').classList.remove('hidden');
  qs('#service-archive')?.classList.toggle('hidden', guides || !service.is_active);
  form.querySelector('button[type="submit"]').textContent = guides ? 'Update Panduan' : 'Update Biaya';
  requestAnimationFrame(() => window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' }));
}

function resetServiceForm() {
  const form = qs('#service-form');
  form.reset();
  form.elements.id.value = '';
  form.classList.add('hidden');
  qs('#service-archive')?.classList.add('hidden');
  form.querySelector('button[type="submit"]').textContent = document.body.classList.contains('admin-page-guides') ? 'Simpan Panduan' : 'Simpan Biaya';
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

function currentGuide() {
  const id = qs('#service-form').elements.id.value;
  return state.services.find((service) => service.id === id);
}

function disassemblyFromForm() {
  const service = currentGuide();
  const images = Array.isArray(service?.disassembly_images) ? service.disassembly_images : [];
  return images.map((item, index) => ({ ...item, caption: qs(`[data-step-caption="${index}"]`)?.value.trim() || '' }));
}

async function saveDisassembly(id, images = disassemblyFromForm()) {
  if (!id) return;
  const result = await api('/api/admin/services/images', { method: 'PATCH', body: JSON.stringify({ id, disassemblyImages: images }) });
  const index = state.services.findIndex((service) => service.id === id);
  if (index >= 0) state.services[index] = result.service;
  renderDisassembly(result.service);
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
qs('#model-add').addEventListener('click', () => { resetModelForm(); qs('#model-form').classList.remove('hidden'); });
qs('#model-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const body = Object.fromEntries(new FormData(form).entries());
  const file = form.elements.image.files[0];
  delete body.image;
  const editing = Boolean(body.id);
  try {
    const saved = await api('/api/admin/models', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(body) });
    if (file) await api('/api/admin/models/image', { method: 'POST', body: JSON.stringify({ id: saved.model.id, mimeType: file.type, data: await imageData(file) }) });
    resetModelForm();
    await loadDashboard();
    toast(editing ? 'Model HP diperbarui' : 'Model HP ditambahkan');
  } catch (e) { toast(e.message, 'error'); }
});
qs('#model-form [name="image"]').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { event.target.value = ''; return toast('Ukuran gambar maksimal 2 MB.', 'error'); }
  qs('#model-image-preview').innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Preview gambar HP">`;
});
qs('#model-cancel').addEventListener('click', resetModelForm);
qs('#model-archive').addEventListener('click', async () => {
  const id = qs('#model-form').elements.id.value;
  if (!id || !confirm('Nonaktifkan model ini dari halaman estimasi? Data biaya, panduan, dan histori tetap tersimpan.')) return;
  try { await api('/api/admin/models', { method: 'DELETE', body: JSON.stringify({ id }) }); resetModelForm(); await loadDashboard(); toast('Model HP dinonaktifkan'); } catch (e) { toast(e.message, 'error'); }
});
qs('#model-list').addEventListener('click', async (event) => {
  const edit = event.target.closest('[data-model-edit]');
  if (edit) return fillModelForm(state.models.find((model) => model.id === edit.dataset.modelEdit));
  const archive = event.target.closest('[data-model-archive]');
  if (!archive || !confirm('Nonaktifkan model ini dari halaman estimasi? Data layanan dan histori tetap tersimpan.')) return;
  try { await api('/api/admin/models', { method: 'DELETE', body: JSON.stringify({ id: archive.dataset.modelArchive }) }); await loadDashboard(); toast('Model HP dinonaktifkan'); } catch (e) { toast(e.message, 'error'); }
});
qs('#service-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.target).entries());
  const editing = Boolean(body.id);
  const guides = document.body.classList.contains('admin-page-guides');
  try {
    await api('/api/admin/services', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(body) });
    if (guides) await saveDisassembly(body.id);
    resetServiceForm();
    await loadDashboard();
    toast(guides ? 'Panduan diperbarui' : editing ? 'Masalah dan biaya diperbarui' : 'Masalah dan biaya ditambahkan');
  } catch (e) { toast(e.message, 'error'); }
});
qs('#service-cancel').addEventListener('click', resetServiceForm);
qs('#service-add')?.addEventListener('click', () => { resetServiceForm(); qs('#service-form').classList.remove('hidden'); });
qs('#service-archive')?.addEventListener('click', async () => {
  const id = qs('#service-form').elements.id.value;
  if (!id || !confirm('Nonaktifkan masalah ini dari halaman estimasi? Data tetap tersimpan.')) return;
  try { await api('/api/admin/services', { method: 'DELETE', body: JSON.stringify({ id }) }); resetServiceForm(); await loadDashboard(); toast('Masalah dinonaktifkan'); } catch (e) { toast(e.message, 'error'); }
});
qs('#service-list').addEventListener('click', async (event) => {
  const edit = event.target.closest('[data-service-edit]');
  if (edit) return fillServiceForm(state.services.find((service) => service.id === edit.dataset.serviceEdit));
  const archive = event.target.closest('[data-service-archive]');
  if (!archive || !confirm('Nonaktifkan masalah ini dari halaman estimasi? Data tetap tersimpan.')) return;
  try { await api('/api/admin/services', { method: 'DELETE', body: JSON.stringify({ id: archive.dataset.serviceArchive }) }); await loadDashboard(); toast('Masalah dinonaktifkan'); } catch (e) { toast(e.message, 'error'); }
});
qs('#guide-search')?.addEventListener('input', renderServices);
qs('#service-form').addEventListener('change', async (event) => {
  const input = event.target.closest('[data-guide-image]');
  if (!input?.files[0]) return;
  const id = qs('#service-form').elements.id.value;
  if (!id) { input.value = ''; return toast('Pilih panduan terlebih dahulu.', 'error'); }
  const file = input.files[0];
  if (file.size > 2 * 1024 * 1024) { input.value = ''; return toast('Ukuran gambar maksimal 2 MB.', 'error'); }
  try {
    const type = input.dataset.guideImage;
    const caption = type === 'disassembly' ? qs('#disassembly-caption').value.trim() : '';
    const result = await api('/api/admin/services/image', { method: 'POST', body: JSON.stringify({ id, type, caption, mimeType: file.type, data: await imageData(file) }) });
    const index = state.services.findIndex((service) => service.id === id);
    if (index >= 0) state.services[index] = result.service;
    renderGuideMedia(result.service);
    if (type === 'disassembly') qs('#disassembly-caption').value = '';
    input.value = '';
    toast(type === 'disassembly' ? 'Langkah foto ditambahkan' : 'Foto panduan diperbarui');
  } catch (error) { input.value = ''; toast(error.message, 'error'); }
});
qs('#disassembly-list')?.addEventListener('click', async (event) => {
  const remove = event.target.closest('[data-step-remove]');
  const move = event.target.closest('[data-step-move]');
  if (!remove && !move) return;
  const images = disassemblyFromForm();
  if (remove) images.splice(Number(remove.dataset.stepRemove), 1);
  if (move) {
    const from = Number(move.dataset.stepMove);
    const to = from + Number(move.dataset.direction);
    if (to >= 0 && to < images.length) [images[from], images[to]] = [images[to], images[from]];
  }
  try { await saveDisassembly(qs('#service-form').elements.id.value, images); toast(remove ? 'Langkah dihapus' : 'Urutan diperbarui'); }
  catch (error) { toast(error.message, 'error'); }
});
qs('#order-list').addEventListener('submit', async (event) => { const form = event.target.closest('.order-edit'); if (!form) return; event.preventDefault(); const body = Object.fromEntries(new FormData(form).entries()); body.id = form.dataset.id; try { await api('/api/admin/orders', { method: 'PATCH', body: JSON.stringify(body) }); await loadDashboard(); toast('Order diperbarui'); } catch (e) { toast(e.message, 'error'); } });

if (token) { showApp(); loadDashboard().catch(() => localStorage.removeItem(tokenKey)); }
