const PUBLIC_API = window.PRASCELL_API || 'http://localhost:3010';
const modelState = { rows: [], query: '' };

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[char]));

function publicImageUrl(value = '') {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${PUBLIC_API}${value.startsWith('/') ? '' : '/'}${value}`;
}

function filteredModels() {
  const query = modelState.query.trim().toLowerCase();
  return modelState.rows.filter((model) => !query || `${model.brand} ${model.model}`.toLowerCase().includes(query));
}

function renderModelCards() {
  const grid = document.getElementById('public-model-grid');
  const count = document.getElementById('public-model-count');
  const rows = filteredModels();
  count.textContent = `${rows.length} model`;
  if (!rows.length) {
    grid.innerHTML = '<p class="public-model-empty">Model HP tidak ditemukan.</p>';
    return;
  }
  grid.innerHTML = rows.map((model) => {
    const title = `${model.brand || ''} ${model.model || ''}`.trim();
    const image = publicImageUrl(model.image_url);
    const specs = Array.isArray(model.specification_rows) ? model.specification_rows.length : 0;
    return `<button class="public-model-card" type="button" data-public-model="${escapeHtml(model.id)}" aria-label="Lihat spesifikasi ${escapeHtml(title)}">
      <span class="public-model-image">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy">` : '<i aria-hidden="true"></i>'}</span>
      <span class="public-model-copy"><small>${escapeHtml(model.brand)}</small><b>${escapeHtml(model.model)}</b><em>${specs ? `${specs} spesifikasi` : 'Detail perangkat'}</em><span>Lihat detail <strong>›</strong></span></span>
    </button>`;
  }).join('');
}

function openModelDetail(id) {
  const model = modelState.rows.find((item) => String(item.id) === String(id));
  if (!model) return;
  const browser = document.getElementById('public-model-browser');
  const detail = document.getElementById('public-model-detail');
  const content = document.getElementById('public-model-detail-content');
  const title = `${model.brand || ''} ${model.model || ''}`.trim();
  const image = publicImageUrl(model.image_url);
  let category = '';
  const rows = (Array.isArray(model.specification_rows) ? model.specification_rows : []).map((row) => {
    const showCategory = row.category && row.category !== category;
    category = row.category || category;
    return `<div class="public-spec-row ${showCategory ? 'public-spec-group' : ''}"><b>${showCategory ? escapeHtml(row.category) : ''}</b><strong>${escapeHtml(row.label)}</strong><span>${escapeHtml(row.value)}</span></div>`;
  }).join('');
  content.innerHTML = `<header class="public-model-detail-head"><span class="public-model-detail-image">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}">` : '<i aria-hidden="true"></i>'}</span><div><p class="eyebrow">${escapeHtml(model.brand)}</p><h3>${escapeHtml(model.model)}</h3><p>${escapeHtml(model.notes || 'Informasi perangkat dari database PrasCell.')}</p></div></header><section><h4>Spesifikasi</h4><div class="public-spec-list">${rows || '<p class="public-model-empty">Spesifikasi belum tersedia.</p>'}</div></section>`;
  browser.hidden = true;
  detail.hidden = false;
  document.getElementById('database-hp').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeModelDetail() {
  document.getElementById('public-model-detail').hidden = true;
  document.getElementById('public-model-browser').hidden = false;
  renderModelCards();
  document.getElementById('database-hp').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadPublicModels() {
  const grid = document.getElementById('public-model-grid');
  try {
    const response = await fetch(`${PUBLIC_API}/api/public/services`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || 'Database HP gagal dimuat.');
    modelState.rows = Array.isArray(data.models) ? data.models : [];
    renderModelCards();
  } catch (error) {
    document.getElementById('public-model-count').textContent = 'Tidak tersedia';
    grid.innerHTML = `<p class="public-model-empty">${escapeHtml(error.message || 'Database HP belum tersedia. Coba lagi nanti.')}</p>`;
  }
}

document.getElementById('public-model-query')?.addEventListener('input', (event) => {
  modelState.query = event.target.value;
  renderModelCards();
});
document.getElementById('public-model-grid')?.addEventListener('click', (event) => {
  const card = event.target.closest('[data-public-model]');
  if (card) openModelDetail(card.dataset.publicModel);
});
document.getElementById('public-model-back')?.addEventListener('click', closeModelDetail);

loadPublicModels();
