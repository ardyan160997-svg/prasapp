const ADMIN_BASE = 'https://adminprashoes.prasapp.com';
const PUBLIC_API = `${ADMIN_BASE}/api/public`;
const API = `${ADMIN_BASE}/api`;
const TOKEN_KEY = 'prashoes_member_token';

const loginCard = document.getElementById('loginCard');
const dashboard = document.getElementById('memberDashboard');
const loginForm = document.getElementById('memberLoginForm');
const loginButton = document.getElementById('loginButton');
const loginMessage = document.getElementById('loginMessage');
const ordersRoot = document.getElementById('memberOrders');
const photoInput = document.getElementById('memberPhotoInput');
const photoUpdateMessage = document.getElementById('photoUpdateMessage');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function rupiah(value) {
  return `Rp${Number(value || 0).toLocaleString('id-ID')}`;
}

function photoUrl(value) {
  const url = String(value || '');
  return url.startsWith('/uploads/') ? `${ADMIN_BASE}${url}` : url || 'images/icon.avif';
}

async function parseResponse(response) {
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(json?.error || 'Request Prashoes gagal.');
  return json;
}

async function api(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY) || '';
  const isFormData = options.body instanceof FormData;
  return parseResponse(await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'content-type': 'application/json' }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  }));
}

async function publicApi(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  return parseResponse(await fetch(`${PUBLIC_API}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'content-type': 'application/json' }),
      ...(options.headers || {}),
    },
  }));
}

async function uploadMemberPhoto(file) {
  const body = new FormData();
  body.append('photo', file);
  return publicApi('/member-photo', { method: 'POST', body });
}

function storedMemberLoginPayload() {
  const emailOrName = localStorage.getItem('prashoes_member_email') || localStorage.getItem('prashoes_member_name') || '';
  const whatsappNumber = localStorage.getItem('prashoes_member_whatsapp') || '';
  return { emailOrName: emailOrName.trim(), whatsappNumber: whatsappNumber.trim() };
}

async function loginWithPayload(payload) {
  const result = await api('/member-login', { method: 'POST', body: JSON.stringify(payload) });
  saveMember(result.member || result, result.token);
  renderProfile(await api('/member-profile'));
}

function saveMember(member, token) {
  member = member || {};
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem('prashoes_is_member', 'true');
  localStorage.setItem('prashoes_member_name', member.fullName || member.full_name || 'Member');
  localStorage.setItem('prashoes_member_whatsapp', member.whatsappNumber || member.whatsapp_number || '');
  localStorage.setItem('prashoes_member_email', member.email || '');
  if (member.profile_photo_url) localStorage.setItem('prashoes_member_photo', member.profile_photo_url);
}

function downloadReceipt(order) {
  const body = [
    'NOTA PEMBAYARAN PRASHOES',
    '================================',
    `Nomor Order : ${order.order_code}`,
    `Customer    : ${order.customer_name || '-'}`,
    `Metode      : ${String(order.payment_method || 'Pembayaran').toUpperCase()}`,
    `Total       : ${rupiah(order.revenue_amount)}`,
    '================================',
    'Status: LUNAS',
  ].join('\n');
  const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nota-${order.order_code}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function orderCard(order) {
  const paid = order.payment_status === 'terbayar';
  const proof = order.paymentProof || null;
  const items = (order.items || []).filter(Boolean).map((item) => `
    <li>${escapeHtml(item.service_name || 'Treatment')} — ${escapeHtml(item.shoe_description || 'Sepatu')} <span>${rupiah(Number(item.treatment_price || item.unit_price || 0) * Number(item.quantity || 1))}</span></li>
  `).join('');
  return `
    <article class="member-order-card" data-order-id="${escapeHtml(order.id)}">
      <div class="member-order-top">
        <div>
          <strong>${escapeHtml(order.order_code || '-')}</strong>
          <p>${escapeHtml(order.status || 'Diproses')}</p>
        </div>
        <span class="member-payment-badge ${paid ? 'paid' : ''}">${paid ? 'Lunas' : escapeHtml(order.payment_status || 'Belum bayar')}</span>
      </div>
      <ul class="member-order-items">${items || '<li>Item treatment belum tersedia.</li>'}</ul>
      <div class="member-order-total"><span>Total</span><strong>${rupiah(order.revenue_amount || 0)}</strong></div>
      ${paid ? `
        <button class="btn btn-primary btn-full" type="button" data-receipt="${escapeHtml(order.id)}">Download Nota</button>
      ` : `
        <details class="member-payment-box">
          <summary>Bayar pakai QRIS / Upload Bukti</summary>
          <img src="images/qris.avif" alt="QRIS Prashoes" loading="lazy">
          <a class="btn btn-primary btn-full" href="images/qris.avif" download="qris-prashoes.avif">Download QRIS</a>
          <input type="file" accept="image/*" capture="environment" data-proof-input>
          <input type="hidden" data-proof-url>
          <button class="btn btn-secondary btn-full" type="button" data-proof-submit disabled>Kirim Bukti Pembayaran</button>
          <p class="profile-message" data-proof-message>${proof ? `Status bukti: ${escapeHtml(proof.status || 'pending')}` : ''}</p>
        </details>
      `}
    </article>
  `;
}

function renderProfile(payload) {
  const member = payload.member || {};
  saveMember(member, localStorage.getItem(TOKEN_KEY) || '');
  loginCard.classList.add('hidden');
  dashboard.classList.remove('hidden');
  document.getElementById('memberAvatar').src = photoUrl(member.profile_photo_url);
  document.getElementById('memberName').textContent = member.full_name || 'Member Prashoes';
  document.getElementById('memberMeta').textContent = `${member.member_code || '-'} • ${member.email || member.whatsapp_number || '-'}`;
  const orders = payload.orders || [];
  ordersRoot.innerHTML = orders.length ? orders.map(orderCard).join('') : '<div class="member-empty">Belum ada order berjalan. Buat order baru dari dashboard Prashoes.</div>';
}

async function loadProfile() {
  if (!localStorage.getItem(TOKEN_KEY)) {
    const stored = storedMemberLoginPayload();
    if (!stored.emailOrName || !stored.whatsappNumber) return;
    try {
      await loginWithPayload(stored);
    } catch (error) {
      loginForm.emailOrName.value = stored.emailOrName;
      loginForm.whatsappNumber.value = stored.whatsappNumber;
    }
    return;
  }
  try {
    renderProfile(await api('/member-profile'));
  } catch (error) {
    localStorage.removeItem(TOKEN_KEY);
    loginCard.classList.remove('hidden');
    dashboard.classList.add('hidden');
  }
}

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(loginForm);
  const payload = {
    emailOrName: String(data.get('emailOrName') || '').trim(),
    whatsappNumber: String(data.get('whatsappNumber') || '').trim(),
  };
  if (!payload.emailOrName || !payload.whatsappNumber) {
    loginMessage.textContent = 'Email/nama dan nomor WhatsApp wajib diisi.';
    return;
  }
  loginButton.disabled = true;
  loginButton.textContent = 'Login...';
  loginMessage.textContent = '';
  try {
    await loginWithPayload(payload);
  } catch (error) {
    loginMessage.textContent = error.message || 'Login gagal.';
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = 'Login';
  }
});

ordersRoot?.addEventListener('change', async (event) => {
  const input = event.target.closest('[data-proof-input]');
  if (!input?.files?.[0]) return;
  const card = input.closest('.member-order-card');
  const message = card.querySelector('[data-proof-message]');
  const hidden = card.querySelector('[data-proof-url]');
  const submit = card.querySelector('[data-proof-submit]');
  const body = new FormData();
  body.append('photo', input.files[0]);
  message.textContent = 'Mengupload bukti pembayaran...';
  try {
    const upload = await publicApi('/payment-proof-upload', { method: 'POST', body });
    hidden.value = upload.url || '';
    submit.disabled = !upload.url;
    message.textContent = 'Bukti tersimpan. Klik Kirim Bukti Pembayaran.';
  } catch (error) {
    message.textContent = error.message || 'Upload gagal.';
  }
});

ordersRoot?.addEventListener('click', async (event) => {
  const receiptButton = event.target.closest('[data-receipt]');
  if (receiptButton) {
    const payload = await api('/member-profile');
    const order = (payload.orders || []).find((item) => item.id === receiptButton.dataset.receipt);
    if (order) downloadReceipt(order);
    return;
  }
  const submit = event.target.closest('[data-proof-submit]');
  if (!submit) return;
  const card = submit.closest('.member-order-card');
  const message = card.querySelector('[data-proof-message]');
  const proofUrl = card.querySelector('[data-proof-url]')?.value || '';
  if (!proofUrl) return;
  submit.disabled = true;
  message.textContent = 'Mengirim bukti pembayaran...';
  try {
    await publicApi('/payment-proof', {
      method: 'POST',
      body: JSON.stringify({ orderId: card.dataset.orderId, proofUrl, method: 'qris' }),
    });
    message.textContent = 'Bukti pembayaran terkirim. Admin akan cek dan konfirmasi lunas.';
  } catch (error) {
    submit.disabled = false;
    message.textContent = error.message || 'Gagal mengirim bukti.';
  }
});

photoInput?.addEventListener('change', async () => {
  const file = photoInput.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    photoUpdateMessage.textContent = 'File harus berupa gambar.';
    photoInput.value = '';
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    photoUpdateMessage.textContent = 'Ukuran foto maksimal 8 MB.';
    photoInput.value = '';
    return;
  }
  photoUpdateMessage.textContent = 'Mengupload foto profil...';
  try {
    const uploaded = await uploadMemberPhoto(file);
    await api('/member-profile-photo', { method: 'PATCH', body: JSON.stringify({ profilePhotoUrl: uploaded.url || '' }) });
    localStorage.setItem('prashoes_member_photo', uploaded.url || '');
    document.getElementById('memberAvatar').src = photoUrl(uploaded.url);
    photoUpdateMessage.textContent = 'Foto profil berhasil diupdate.';
  } catch (error) {
    photoUpdateMessage.textContent = error.message || 'Update foto gagal.';
  } finally {
    photoInput.value = '';
  }
});

document.getElementById('logoutButton')?.addEventListener('click', () => {
  localStorage.removeItem(TOKEN_KEY);
  loginCard.classList.remove('hidden');
  dashboard.classList.add('hidden');
});

loadProfile();
