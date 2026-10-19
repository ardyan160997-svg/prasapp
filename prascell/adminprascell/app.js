const API = '';
const tokenKey = 'prascell_admin_token';
let token = localStorage.getItem(tokenKey) || '';
let state = { members: [], models: [], services: [], orders: [], chats: [], statuses: [] };
let selectedModelId = '';
let selectedServiceId = '';
let modelExpanded = false;
let dashboardDetailModel = null;


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
  qs('#model-list').innerHTML = state.models.map((m) => `<button class="model-card ${m.is_active ? '' : 'row-inactive'}" type="button" data-model-view="${m.id}"><span class="model-image">${m.image_url ? `<img src="${escapeHtml(m.image_url)}" alt="${escapeHtml(`${m.brand} ${m.model}`)}">` : '<i aria-hidden="true"></i>'}</span><span class="model-card-copy"><small>${escapeHtml(m.brand)}</small><b>${escapeHtml(m.model)}</b><em>${m.specification_rows?.length ? `${m.specification_rows.length} spesifikasi` : ''}${m.specification_rows?.length && m.software_links?.length ? ' · ' : ''}${m.software_links?.length ? `${m.software_links.length} link` : ''}</em></span><span class="model-card-status">${m.is_active ? 'Aktif' : 'Nonaktif'}</span></button>`).join('') || '<p class="muted">Belum ada database HP.</p>';
}

function renderModelsDashboard() {
  const searchEl = qs('#model-search');
  const toggleBtn = qs('#model-toggle-all');
  const backBtn = qs('#model-back-dashboard');
  const detailEl = qs('#model-detail-dashboard');
  if (!searchEl || !toggleBtn) return;

  const query = String(searchEl.value || '').trim().toLowerCase();
  const filtered = query
    ? state.models.filter((m) => [m.brand, m.model].some((v) => String(v || '').toLowerCase().includes(query)))
    : state.models;
  const LIMIT = 6;
  const shown = modelExpanded || query ? filtered : filtered.slice(0, LIMIT);

  qs('#model-list').innerHTML = shown.map((m) => `<button class="model-card ${m.is_active ? '' : 'row-inactive'}" type="button" data-model-view-dash="${m.id}"><span class="model-image">${m.image_url ? `<img src="${escapeHtml(m.image_url)}" alt="${escapeHtml(`${m.brand} ${m.model}`)}">` : '<i aria-hidden="true"></i>'}</span><span class="model-card-copy"><small>${escapeHtml(m.brand)}</small><b>${escapeHtml(m.model)}</b><em>${m.specification_rows?.length ? `${m.specification_rows.length} spesifikasi` : ''}${m.specification_rows?.length && m.software_links?.length ? ' · ' : ''}${m.software_links?.length ? `${m.software_links.length} link` : ''}</em></span><span class="model-card-status">${m.is_active ? 'Aktif' : 'Nonaktif'}</span></button>`).join('') || '<p class="muted">Tidak ada model yang cocok.</p>';

  const hiddenCount = filtered.length - LIMIT;
  if (modelExpanded || query) {
    toggleBtn.textContent = 'Tutup ▴';
  } else {
    toggleBtn.textContent = hiddenCount > 0 ? `Lihat Semua (${filtered.length}) ▾` : 'Lihat Semua Database HP ▾';
  }
  toggleBtn.classList.toggle('hidden', filtered.length <= LIMIT && !modelExpanded);
  if (backBtn) backBtn.classList.add('hidden');
  if (detailEl) detailEl.classList.add('hidden');
  dashboardDetailModel = null;
}

function showDashboardModelDetail(model) {
  if (!model) return;
  dashboardDetailModel = model;
  const detailEl = qs('#model-detail-dashboard');
  const backBtn = qs('#model-back-dashboard');
  if (!detailEl) return;

  let category = '';
  const specifications = (model.specification_rows || []).map((row) => {
    const showCategory = row.category !== category;
    category = row.category;
    return `<div class="spec-view-row ${showCategory ? 'spec-view-group' : ''}"><b>${showCategory ? escapeHtml(row.category) : ''}</b><strong>${escapeHtml(row.label)}</strong><span>${escapeHtml(row.value)}</span></div>`;
  }).join('') || '<p class="muted">Belum ada spesifikasi.</p>';
  const links = (model.software_links || []).map((item) => `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.label)} ↗</a>`).join('') || '<p class="muted">Belum ada link software.</p>';

  detailEl.innerHTML = `<header class="model-detail-head"><span class="model-detail-image">${model.image_url ? `<img src="${escapeHtml(model.image_url)}" alt="${escapeHtml(`${model.brand} ${model.model}`)}">` : '<i aria-hidden="true"></i>'}</span><div><small>${escapeHtml(model.brand)}</small><h3>${escapeHtml(model.model)}</h3><p>${escapeHtml(model.notes || 'Tanpa catatan')}</p></div></header><section><h3>Spesifikasi HP</h3><div class="spec-view">${specifications}</div></section><section><h3>Download Software</h3><div class="model-software-links">${links}</div></section>`;
  detailEl.classList.remove('hidden');
  if (backBtn) backBtn.classList.remove('hidden');
  requestAnimationFrame(() => window.scrollTo({ top: qs('#models').getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' }));
}


function setModelPage(mode, model) {
  const browsing = mode === 'browse';
  qs('#model-page-title').textContent = browsing ? 'Database HP' : model ? `${model.brand} ${model.model}` : 'Tambahkan Model';
  qs('#model-page-eyebrow').textContent = browsing ? 'Database perangkat' : mode === 'detail' ? 'Detail perangkat' : model ? 'Edit perangkat' : 'Model baru';
  qs('#model-back').classList.toggle('hidden', browsing);
  qs('#model-add').classList.toggle('hidden', !browsing);
  qs('#model-browser').classList.toggle('hidden', !browsing);
  qs('#model-detail').classList.toggle('hidden', mode !== 'detail');
  qs('#model-editor').classList.toggle('hidden', mode !== 'edit');
}

function showModelDetail(model) {
  if (!model) return;
  selectedModelId = model.id;
  resetModelForm(false);
  setModelPage('detail', model);
  const detail = qs('#model-detail');
  let category = '';
  const specifications = (model.specification_rows || []).map((row) => {
    const showCategory = row.category !== category;
    category = row.category;
    return `<div class="spec-view-row ${showCategory ? 'spec-view-group' : ''}"><b>${showCategory ? escapeHtml(row.category) : ''}</b><strong>${escapeHtml(row.label)}</strong><span>${escapeHtml(row.value)}</span></div>`;
  }).join('') || '<p class="muted">Belum ada spesifikasi.</p>';
  const links = (model.software_links || []).map((item) => `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.label)} ↗</a>`).join('') || '<p class="muted">Belum ada link software.</p>';
  detail.innerHTML = `<header class="model-detail-head"><span class="model-detail-image">${model.image_url ? `<img src="${escapeHtml(model.image_url)}" alt="${escapeHtml(`${model.brand} ${model.model}`)}">` : '<i aria-hidden="true"></i>'}</span><div><small>${escapeHtml(model.brand)}</small><h3>${escapeHtml(model.model)}</h3><p>${escapeHtml(model.notes || 'Tanpa catatan')}</p></div></header><section><h3>Spesifikasi HP</h3><div class="spec-view">${specifications}</div></section><section><h3>Download Software</h3><div class="model-software-links">${links}</div></section>`;
  detail.classList.remove('hidden');
  requestAnimationFrame(() => window.scrollTo({ top: qs('#models').getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' }));
}

function fillModelForm(model) {
  const form = qs('#model-form');
  setModelPage('edit', model);
  form.classList.remove('hidden');
  for (const [name, value] of Object.entries({ id: model.id, brand: model.brand, model: model.model, notes: model.notes, softwareLinksText: (model.software_links || []).map((item) => `${item.label} | ${item.url}`).join('\n') })) form.elements[name].value = value ?? '';
  renderSpecificationRows(model.specification_rows || []);
  qs('#model-software-preview').innerHTML = (model.software_links || []).map((item) => `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.label)} ↗</a>`).join('');
  qs('#model-image-preview').innerHTML = model.image_url ? `<img src="${escapeHtml(model.image_url)}" alt="Preview ${escapeHtml(model.model)}">` : '<span>Belum ada gambar</span>';
  qs('#model-cancel').classList.remove('hidden');
  qs('#model-archive').classList.toggle('hidden', !model.is_active);
  form.querySelector('button[type="submit"]').textContent = 'Update Model';
  requestAnimationFrame(() => window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' }));
}

function resetModelForm(hideDetail = true) {
  const form = qs('#model-form');
  form.reset();
  form.elements.id.value = '';
  renderSpecificationRows();
  qs('#model-software-preview').innerHTML = '';
  qs('#model-image-preview').innerHTML = '<span>Belum ada gambar</span>';
  qs('#model-cancel').classList.add('hidden');
  qs('#model-archive').classList.add('hidden');
  form.querySelector('button[type="submit"]').textContent = 'Simpan Model';
  form.classList.add('hidden');
  if (hideDetail) qs('#model-detail').classList.add('hidden');
}

function specificationRows() {
  return [...document.querySelectorAll('#spec-rows .spec-edit-row')].map((row) => ({
    category: row.querySelector('[data-spec-category]').value.trim(),
    label: row.querySelector('[data-spec-label]').value.trim(),
    value: row.querySelector('[data-spec-value]').value.trim(),
  })).filter((row) => row.label || row.value);
}

function syncSpecificationRows() {
  qs('#model-form').elements.specificationRows.value = JSON.stringify(specificationRows());
}

function addSpecificationRow(item = {}) {
  const row = document.createElement('div');
  row.className = 'spec-edit-row';
  row.innerHTML = `<input data-spec-category aria-label="Kategori" placeholder="PLATFORM" value="${escapeHtml(item.category || '')}"><input data-spec-label aria-label="Label" placeholder="Chipset" value="${escapeHtml(item.label || '')}"><textarea data-spec-value aria-label="Nilai" rows="2" placeholder="XRing O3 (3 nm)">${escapeHtml(item.value || '')}</textarea><span class="spec-row-actions"><button type="button" data-spec-remove aria-label="Hapus baris">×</button></span>`;
  qs('#spec-rows').append(row);
  syncSpecificationRows();
  return row;
}

function addSpecificationField(type) {
  const rows = specificationRows();
  const category = [...rows].reverse().find((row) => row.category)?.category || '';
  const row = addSpecificationRow({ category });
  row.querySelector(type === 'label' ? '[data-spec-label]' : '[data-spec-value]').focus();
}

function renderSpecificationRows(rows = []) {
  qs('#spec-rows').innerHTML = '';
  rows.forEach(addSpecificationRow);
  if (!rows.length) addSpecificationRow();
}

function parseSpecificationText(value) {
  let category = 'LAINNYA';
  const rows = [];
  for (const raw of String(value || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const divider = line.indexOf(':');
    if (divider < 0 && line.length <= 40) { category = line.toUpperCase(); continue; }
    rows.push({ category, label: divider < 0 ? '' : line.slice(0, divider).trim(), value: divider < 0 ? line : line.slice(divider + 1).trim() });
  }
  return rows;
}

function imageData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Gambar gagal dibaca.'));
    reader.readAsDataURL(file);
  });
}

function renderSoftwarePreview(value) {
  const links = String(value || '').split(/\r?\n/).map((line) => {
    const divider = line.indexOf('|');
    const label = divider < 0 ? 'Download' : line.slice(0, divider).trim();
    const url = (divider < 0 ? line : line.slice(divider + 1)).trim();
    return /^https:\/\//i.test(url) ? { label: label || 'Download', url } : null;
  }).filter(Boolean);
  qs('#model-software-preview').innerHTML = links.map((item) => `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.label)} ↗</a>`).join('');
}

function renderServices() {
  const guides = document.body.classList.contains('admin-page-guides');
  const list = qs('#service-list');
  list.className = 'service-grid';
  const query = String(qs('#service-search')?.value || '').trim().toLowerCase();
  const services = query ? state.services.filter((service) => [service.brand, service.model, service.issue_category, service.issue_name].some((value) => String(value || '').toLowerCase().includes(query))) : state.services;
  list.innerHTML = services.map((service) => {
    const model = state.models.find((item) => item.id === service.phone_model_id);
    const image = model?.image_url;
    const guideReady = Boolean(service.repair_method || service.symptoms || service.cause);
    return `<button class="service-card ${service.is_active ? '' : 'row-inactive'}" type="button" data-service-view="${service.id}"><span class="service-card-image">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(`${service.brand || ''} ${service.model || ''}`)}">` : '<i aria-hidden="true"></i>'}</span><span class="service-card-copy"><small>${escapeHtml(service.brand || 'Umum')}</small><b>${escapeHtml(service.model || '')}</b><strong>${escapeHtml(service.issue_name)}</strong></span><span class="service-card-category">${escapeHtml(service.issue_category || 'hardware')}</span><span class="service-card-footer"><span class="service-card-state">${guides ? (guideReady ? 'Panduan tersedia' : 'Belum diisi') : rupiah(service.price_min)}</span><span class="service-card-open">Buka ›</span></span></button>`;
  }).join('') || `<p class="muted">${query ? 'Tidak ada data yang cocok.' : 'Belum ada data servis.'}</p>`;
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

function setServicePage(mode, service) {
  const guides = document.body.classList.contains('admin-page-guides');
  const browsing = mode === 'browse';
  const title = guides ? 'Panduan Teknisi' : 'Biaya Servis';
  qs('#service-page-title').textContent = browsing ? title : service ? `${service.brand || 'Umum'} ${service.model || ''}`.trim() : 'Tambah Biaya Servis';
  qs('#service-page-eyebrow').textContent = browsing ? (guides ? 'Referensi teknisi' : 'Estimasi layanan') : mode === 'detail' ? escapeHtml(service?.issue_name || 'Detail layanan') : guides ? 'Edit panduan' : service ? 'Edit biaya' : 'Biaya baru';
  qs('#service-back').classList.toggle('hidden', browsing);
  qs('#service-add')?.classList.toggle('hidden', !browsing);
  qs('#service-browser').classList.toggle('hidden', !browsing);
  qs('#service-detail').classList.toggle('hidden', mode !== 'detail');
  qs('#service-editor').classList.toggle('hidden', mode !== 'edit');
}

function showServiceDetail(service) {
  if (!service) return;
  const guides = document.body.classList.contains('admin-page-guides');
  selectedServiceId = service.id;
  resetServiceForm();
  setServicePage('detail', service);
  const model = state.models.find((item) => item.id === service.phone_model_id);
  const image = model?.image_url;
  const facts = guides
    ? [['Gejala', service.symptoms], ['Penyebab', service.cause], ['Tindakan / Perbaikan', service.repair_method], ['Catatan Bongkar Pasang', service.assembly_steps], ['Alat', service.tools], ['Spare Part', service.spare_parts]]
    : [['Kategori', service.issue_category], ['Harga Minimum', rupiah(service.price_min)], ['Harga Maksimum', rupiah(service.price_max)], ['Estimasi Waktu', service.duration_estimate], ['Garansi', service.warranty_enabled ? `${service.warranty_days || 0} hari · ${service.warranty_scope || 'jasa'}` : 'Tidak ada'], ['Syarat Garansi', service.warranty_terms], ['Pengecualian', service.warranty_exclusions]];
  const rows = facts.filter(([, value]) => value !== null && value !== undefined && value !== '').map(([label, value]) => `<div><small>${escapeHtml(label)}</small><p>${escapeHtml(value)}</p></div>`).join('') || '<p class="muted">Detail belum diisi.</p>';
  qs('#service-detail').innerHTML = `<header class="service-detail-head"><span class="model-detail-image">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(`${service.brand || ''} ${service.model || ''}`)}">` : '<i aria-hidden="true"></i>'}</span><div><small>${escapeHtml(service.issue_category || 'Layanan')}</small><h3>${escapeHtml(service.issue_name)}</h3><p>${escapeHtml(`${service.brand || 'Umum'} ${service.model || ''}`.trim())}</p></div><button type="button" data-service-edit="${service.id}">Edit</button></header><section class="service-detail-facts">${rows}</section>`;
  requestAnimationFrame(() => window.scrollTo({ top: qs('#services').getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' }));
}

function fillServiceForm(service) {
  const form = qs('#service-form');
  const guides = document.body.classList.contains('admin-page-guides');
  selectedServiceId = service.id;
  setServicePage('edit', service);
  form.classList.remove('hidden');
  for (const [name, value] of Object.entries({ id: service.id, phoneModelId: service.phone_model_id, issueCategory: service.issue_category || 'hardware', issueName: service.issue_name, priceMin: service.price_min, priceMax: service.price_max, durationEstimate: service.duration_estimate, symptoms: service.symptoms, cause: service.cause, repairMethod: service.repair_method, assemblySteps: service.assembly_steps, tools: service.tools, spareParts: service.spare_parts, warrantyDays: service.warranty_days, warrantyScope: service.warranty_scope, warrantyTerms: service.warranty_terms, warrantyExclusions: service.warranty_exclusions })) {
    if (form.elements[name]) form.elements[name].value = value ?? '';
  }
  if (form.elements.warrantyEnabled) form.elements.warrantyEnabled.checked = Boolean(service.warranty_enabled);
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

function warrantyStatusOptions(current) {
  const transitions = {
    aktif: ['aktif', 'klaim', 'dibatalkan'],
    klaim: ['klaim', 'disetujui', 'ditolak', 'dibatalkan'],
    disetujui: ['disetujui', 'selesai', 'dibatalkan'],
    ditolak: ['ditolak'],
    selesai: ['selesai'],
    dibatalkan: ['dibatalkan'],
  };
  return transitions[current] || [current];
}

function renderOrders() {
  qs('#order-list').innerHTML = state.orders.map((order) => {
    const serviceOptions = state.services.map((service) => `<option value="${service.id}" ${service.id === order.repair_service_id ? 'selected' : ''}>${escapeHtml(`${service.brand || ''} ${service.model || ''} · ${service.issue_name}`)}</option>`).join('');
    const warranty = order.warranty_code ? `<section class="warranty-admin"><div><span><small>Kode garansi</small><b>${escapeHtml(order.warranty_code)}</b></span><span><small>Status garansi</small><strong class="pill warranty-${escapeHtml(order.warranty_status)}">${escapeHtml(order.warranty_status)}</strong></span></div><p>${escapeHtml(order.warranty_scope || '')} · Berlaku sampai ${order.warranty_ends_at ? new Date(order.warranty_ends_at).toLocaleDateString('id-ID') : '-'}</p>${order.warranty_status === 'kedaluwarsa' ? '<p class="warranty-muted">Masa garansi telah berakhir dan status tidak dapat diubah.</p>' : `<form class="warranty-edit" data-id="${order.id}"><label><span>Ubah status menjadi</span><select name="status">${warrantyStatusOptions(order.warranty_status).map((status) => `<option value="${status}" ${status === order.warranty_status ? 'selected' : ''}>${status}</option>`).join('')}</select></label><label><span>Catatan keputusan</span><textarea name="notes" placeholder="Alasan keputusan / catatan klaim">${escapeHtml(order.warranty_claim_notes || '')}</textarea></label><button>Simpan status garansi</button></form>`}<details><summary>Riwayat garansi (${order.warranty_history?.length || 0})</summary>${(order.warranty_history || []).map((event) => `<p><b>${escapeHtml(event.status)}</b> · ${new Date(event.created_at).toLocaleString('id-ID')}<br>${escapeHtml(event.notes || '')}</p>`).join('')}</details></section>` : '<p class="warranty-muted">Garansi belum aktif. Pilih layanan bergaransi lalu ubah status order menjadi selesai.</p>';
    return `<article class="row order-row"><div><b>${escapeHtml(order.order_code)}</b><small>${escapeHtml(order.customer_name)} · ${escapeHtml(order.whatsapp_number)}</small><p>${escapeHtml(order.phone_brand)} ${escapeHtml(order.phone_model)} — ${escapeHtml(order.issue_description)}</p><small>Status servis</small><span class="pill">${escapeHtml(order.status)}</span></div><form class="order-edit" data-id="${order.id}"><label>Layanan<select name="repairServiceId"><option value="">Pilih layanan</option>${serviceOptions}</select></label><select name="status">${state.statuses.map((status) => `<option value="${status}" ${status === order.status ? 'selected' : ''}>${status}</option>`).join('')}</select><input name="finalTotal" type="number" placeholder="Total final" value="${Number(order.final_total || 0)}"><label>Status pembayaran<select name="paymentStatus"><option value="belum_lunas" ${order.payment_status !== 'lunas' ? 'selected' : ''}>Belum lunas</option><option value="lunas" ${order.payment_status === 'lunas' ? 'selected' : ''}>Lunas</option></select></label><textarea name="technicianNotes" placeholder="Catatan teknisi">${escapeHtml(order.technician_notes || '')}</textarea><button>Simpan update order</button></form><form class="inventory-use order-inventory-use" data-id="${order.id}"><label>Sparepart dipakai<select name="itemId" required><option value="">Pilih stok</option>${(state.inventory||[]).filter((item)=>item.is_active&&Number(item.quantity)>0).map((item)=>`<option value="${item.id}">${escapeHtml(item.name)} · stok ${Number(item.quantity)}</option>`).join('')}</select></label><label>Jumlah<input name="quantity" type="number" min="1" value="1" required></label><input name="usageType" type="hidden" value="service"><label>Catatan<input name="notes" placeholder="Sparepart untuk servis"></label><button>Gunakan stok</button></form>${warranty}</article>`;
  }).join('') || '<p class="muted">Belum ada order.</p>';
}

function renderMembers() {
  qs('#member-list').innerHTML = state.members.map((m) => `<div class="row"><div><b>${escapeHtml(m.full_name)}</b><small>${escapeHtml(m.member_code)} · ${escapeHtml(m.whatsapp_number)}</small></div><div>${escapeHtml(m.email || '')}</div><small>${escapeHtml(m.device_notes || '')}</small></div>`).join('') || '<p class="muted">Belum ada member.</p>';
}

function renderChats() {
  qs('#chat-list').innerHTML = state.chats.map((c) => `<div class="row"><div><b>${escapeHtml(c.customer_name || 'Pengunjung')}</b><small>${escapeHtml(c.session_id)}</small></div><span class="pill">${escapeHtml(c.status)}</span></div>`).join('') || '<p class="muted">Belum ada chat.</p>';
}

function render() {
  stats();
  if (document.body.classList.contains('admin-page-dashboard')) {
    renderModelsDashboard();
  } else {
    renderModels();
  }
  renderServices(); renderOrders(); renderMembers(); renderChats();
}


async function loadDashboard() {
  const data = await api('/api/admin/dashboard');
  state = data.data;
  window.updateAdminNavBadges?.(state.notifications);
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
qs('#model-add').addEventListener('click', () => { selectedModelId = ''; resetModelForm(); setModelPage('edit'); qs('#model-form').classList.remove('hidden'); });
qs('#model-back')?.addEventListener('click', () => { selectedModelId = ''; resetModelForm(); setModelPage('browse'); });
qs('#model-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  syncSpecificationRows();
  const body = Object.fromEntries(new FormData(form).entries());
  const file = form.elements.image.files[0];
  delete body.image;
  const editing = Boolean(body.id);
  try {
    const saved = await api('/api/admin/models', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(body) });
    if (file) await api('/api/admin/models/image', { method: 'POST', body: JSON.stringify({ id: saved.model.id, mimeType: file.type, data: await imageData(file) }) });
    resetModelForm();
    await loadDashboard();
    showModelDetail(state.models.find((model) => model.id === saved.model.id));
    toast(editing ? 'Model HP diperbarui' : 'Model HP ditambahkan');
  } catch (e) { toast(e.message, 'error'); }
});
document.querySelectorAll('[data-spec-add="label"], #spec-add-label, #spec-add-label-bottom').forEach((btn) => {
  btn.addEventListener('click', () => addSpecificationField('label'));
});
document.querySelectorAll('[data-spec-add="value"], #spec-add-value, #spec-add-value-bottom').forEach((btn) => {
  btn.addEventListener('click', () => addSpecificationField('value'));
});
qs('#spec-parse')?.addEventListener('click', () => {
  const rows = parseSpecificationText(qs('#spec-import').value);
  if (!rows.length) return toast('Belum ada spesifikasi yang dapat dibuat menjadi tabel.', 'error');
  renderSpecificationRows(rows);
  toast(`${rows.length} baris spesifikasi dibuat`);
});
qs('#spec-rows')?.addEventListener('input', syncSpecificationRows);
qs('#spec-rows')?.addEventListener('click', (event) => {
  const remove = event.target.closest('[data-spec-remove]');
  if (!remove) return;
  remove.closest('.spec-edit-row').remove();
  if (!qs('#spec-rows').children.length) addSpecificationRow();
  syncSpecificationRows();
});
qs('#model-form [name="softwareLinksText"]')?.addEventListener('input', (event) => renderSoftwarePreview(event.target.value));
qs('#model-form [name="image"]')?.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { event.target.value = ''; return toast('Ukuran gambar maksimal 2 MB.', 'error'); }
  qs('#model-image-preview').innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Preview gambar HP">`;
});
qs('#model-cancel').addEventListener('click', () => {
  const model = state.models.find((item) => item.id === selectedModelId);
  model ? showModelDetail(model) : resetModelForm();
});
qs('#model-archive').addEventListener('click', async () => {
  const id = qs('#model-form').elements.id.value;
  if (!id || !confirm('Nonaktifkan model ini dari halaman estimasi? Data biaya, panduan, dan histori tetap tersimpan.')) return;
  try { await api('/api/admin/models', { method: 'DELETE', body: JSON.stringify({ id }) }); resetModelForm(); await loadDashboard(); toast('Model HP dinonaktifkan'); } catch (e) { toast(e.message, 'error'); }
});
qs('#model-list').addEventListener('click', (event) => {
  const viewDash = event.target.closest('[data-model-view-dash]');
  if (viewDash) { showDashboardModelDetail(state.models.find((model) => model.id === viewDash.dataset.modelViewDash)); return; }
  const view = event.target.closest('[data-model-view]');
  if (view) showModelDetail(state.models.find((model) => model.id === view.dataset.modelView));
});
qs('#model-detail')?.addEventListener('click', (event) => {
  const edit = event.target.closest('[data-model-edit]');
  if (edit) fillModelForm(state.models.find((model) => model.id === edit.dataset.modelEdit));
});
qs('#model-toggle-all')?.addEventListener('click', () => {
  modelExpanded = !modelExpanded;
  renderModelsDashboard();
});
qs('#model-back-dashboard')?.addEventListener('click', () => {
  dashboardDetailModel = null;
  const detailEl = qs('#model-detail-dashboard');
  const backBtn = qs('#model-back-dashboard');
  if (detailEl) detailEl.classList.add('hidden');
  if (backBtn) backBtn.classList.add('hidden');
});
qs('#model-search')?.addEventListener('input', () => {
  if (document.body.classList.contains('admin-page-dashboard')) {
    modelExpanded = false;
    renderModelsDashboard();
  }
});

qs('#service-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.target).entries());
  const editing = Boolean(body.id);
  const guides = document.body.classList.contains('admin-page-guides');
  if (!guides) body.warrantyEnabled = Boolean(event.target.elements.warrantyEnabled?.checked);
  try {
    const saved = await api('/api/admin/services', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(body) });
    if (guides) await saveDisassembly(saved.service.id);
    resetServiceForm();
    await loadDashboard();
    showServiceDetail(state.services.find((service) => service.id === saved.service.id));
    toast(guides ? 'Panduan diperbarui' : editing ? 'Masalah dan biaya diperbarui' : 'Masalah dan biaya ditambahkan');
  } catch (e) { toast(e.message, 'error'); }
});
qs('#service-cancel').addEventListener('click', () => {
  const service = state.services.find((item) => item.id === selectedServiceId);
  service ? showServiceDetail(service) : setServicePage('browse');
});
qs('#service-add')?.addEventListener('click', () => {
  selectedServiceId = '';
  resetServiceForm();
  setServicePage('edit');
  qs('#service-form').classList.remove('hidden');
});
qs('#service-archive')?.addEventListener('click', async () => {
  const id = qs('#service-form').elements.id.value;
  if (!id || !confirm('Nonaktifkan masalah ini dari halaman estimasi? Data tetap tersimpan.')) return;
  try { await api('/api/admin/services', { method: 'DELETE', body: JSON.stringify({ id }) }); resetServiceForm(); await loadDashboard(); toast('Masalah dinonaktifkan'); } catch (e) { toast(e.message, 'error'); }
});
qs('#service-list').addEventListener('click', (event) => {
  const view = event.target.closest('[data-service-view]');
  if (view) showServiceDetail(state.services.find((service) => service.id === view.dataset.serviceView));
});
qs('#service-detail')?.addEventListener('click', (event) => {
  const edit = event.target.closest('[data-service-edit]');
  if (edit) fillServiceForm(state.services.find((service) => service.id === edit.dataset.serviceEdit));
});
qs('#service-back')?.addEventListener('click', () => {
  selectedServiceId = '';
  resetServiceForm();
  setServicePage('browse');
});
qs('#service-search')?.addEventListener('input', renderServices);
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
qs('#order-list').addEventListener('submit', async (event) => {
  const form = event.target.closest('.order-edit, .warranty-edit, .inventory-use');
  if (!form) return;
  event.preventDefault();
  const body = Object.fromEntries(new FormData(form).entries());
  body.id = form.dataset.id;
  const warranty = form.classList.contains('warranty-edit');
  const inventory = form.classList.contains('inventory-use');
  if (inventory) { body.orderId = form.dataset.id; body.operationId = form.dataset.operationId ||= crypto.randomUUID(); }
  try {
    await api(inventory ? '/api/admin/inventory/use' : warranty ? '/api/admin/warranties' : '/api/admin/orders', { method: inventory ? 'POST' : 'PATCH', body: JSON.stringify(body) });
    if (inventory) delete form.dataset.operationId;
    await loadDashboard();
    toast(inventory ? 'Pemakaian stok dicatat' : warranty ? 'Status garansi diperbarui' : 'Order diperbarui');
  } catch (error) { toast(error.message, 'error'); }
});

if (token) { showApp(); loadDashboard().catch(() => localStorage.removeItem(tokenKey)); }
