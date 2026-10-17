const API = window.PRASCELL_API || 'http://localhost:3010';
const rupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));
const categoryLabel = (value) => value === 'software' ? 'Software' : 'Hardware';
let services = [];
let models = [];

async function api(path) {
  const response = await fetch(`${API}${path}`, { headers: { 'content-type': 'application/json' } });
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
  const category = document.getElementById('category');
  const issue = document.getElementById('issue');
  const issueField = document.getElementById('issue-field');
  const help = document.getElementById('estimate-help');
  const submit = document.getElementById('estimate-submit');
  const modelRows = models.length ? models : services.map(({ brand: itemBrand, model: itemModel }) => ({ brand: itemBrand, model: itemModel }));
  const brands = [...new Set(modelRows.map((item) => item.brand).filter(Boolean))].sort();
  brand.append(...brands.map((item) => option(item, item)));

  const resetIssue = () => {
    issue.replaceChildren(option('', 'Pilih kendala atau tindakan'));
    issue.disabled = true;
    submit.disabled = true;
    issueField.classList.add('hidden');
  };

  const updateModels = () => {
    const rows = modelRows.filter((item) => item.brand === brand.value);
    model.replaceChildren(option('', 'Pilih model'), ...[...new Set(rows.map((item) => item.model).filter(Boolean))].sort().map((item) => option(item, item)));
    model.disabled = !brand.value;
    category.value = '';
    category.disabled = true;
    resetIssue();
    help.textContent = brand.value ? 'Pilih model HP.' : 'Pilih merek dan model HP terlebih dahulu.';
  };

  const updateCategory = () => {
    category.value = '';
    category.disabled = !model.value;
    resetIssue();
    help.textContent = model.value ? 'Pilih jenis masalah: Software atau Hardware.' : 'Pilih model HP.';
  };

  const updateIssues = () => {
    const rows = services.filter((item) => item.brand === brand.value && item.model === model.value && item.issueCategory === category.value);
    issue.replaceChildren(option('', rows.length ? 'Pilih kendala atau tindakan' : `Belum ada masalah ${categoryLabel(category.value).toLowerCase()}`), ...rows.map((item) => option(item.id, item.issueName)));
    issue.disabled = !rows.length;
    issueField.classList.toggle('hidden', !category.value);
    help.textContent = rows.length ? `Pilih kendala atau tindakan ${categoryLabel(category.value).toLowerCase()}.` : `Biaya ${categoryLabel(category.value).toLowerCase()} untuk model ini belum ditambahkan admin.`;
  };

  brand.addEventListener('change', updateModels);
  model.addEventListener('change', updateCategory);
  category.addEventListener('change', updateIssues);
  issue.addEventListener('change', () => {
    submit.disabled = !issue.value;
    help.textContent = issue.value ? 'Pilihan siap. Tampilkan estimasi biaya dan tindakan.' : `Pilih kendala atau tindakan ${categoryLabel(category.value).toLowerCase()}.`;
  });
}

function renderEstimate(service) {
  const target = document.getElementById('estimate-result');
  if (!service) {
    target.className = 'result-card empty';
    target.textContent = 'Pilih model, masalah, lalu kendala untuk melihat estimasi.';
    return;
  }
  target.className = 'result-card';
  target.innerHTML = `<p class="eyebrow">Estimasi ${categoryLabel(service.issueCategory)}</p><h3>${serviceLabel(service)}</h3><div class="estimate-price">${rupiah(service.priceMin)} - ${rupiah(service.priceMax)}</div><p>${service.symptoms || 'Teknisi akan cek kondisi HP dulu sebelum menentukan biaya final.'}</p><p><b>Tindakan:</b> ${service.repairMethod || service.issueName}</p><p><b>Estimasi waktu:</b> ${service.durationEstimate || 'Menyesuaikan spare part dan antrean servis.'}</p>`;
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function loadServices() {
  try {
    const data = await api('/api/public/services');
    services = (data.services || []).map((service) => ({ ...service, issueCategory: service.issueCategory || 'hardware' }));
    models = data.models || [];
    hydrateFilters();
  } catch {
    document.getElementById('estimate-result').textContent = 'Database estimasi belum tersedia. Coba lagi nanti.';
  }
}

document.getElementById('estimate-form').addEventListener('submit', (event) => {
  event.preventDefault();
  renderEstimate(services.find((item) => item.id === document.getElementById('issue').value));
});

loadServices();
