const ADMIN_BASE = 'https://adminprashoes.prasapp.com';
const API_BASE = `${ADMIN_BASE}/api/public`;
const form = document.getElementById('memberRegistrationForm');
const photoInput = document.getElementById('profilePhoto');
const previewText = document.getElementById('profilePreviewText');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function parseResponse(response) {
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(json?.error || 'Request gagal.');
  return json;
}

async function uploadProfilePhoto(file) {
  const body = new FormData();
  body.append('photo', file);
  return parseResponse(await fetch(`${API_BASE}/member-photo`, { method: 'POST', body }));
}

function saveMember(payload, result) {
  localStorage.setItem('prashoes_is_member', 'true');
  localStorage.setItem('prashoes_member_name', payload.fullName);
  localStorage.setItem('prashoes_member_whatsapp', payload.whatsappNumber);
  localStorage.setItem('prashoes_member_email', payload.email || '');
  localStorage.setItem('prashoes_member_address', payload.pickupAddress);
  localStorage.setItem('prashoes_member_photo', payload.profilePhotoUrl);
  localStorage.setItem('prashoes_member_code', result.memberCode || '');
  localStorage.setItem('prashoes_identity_submitted', 'true');
}

photoInput?.addEventListener('change', () => {
  const file = photoInput.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert('File harus berupa gambar.');
    photoInput.value = '';
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    alert('Ukuran foto maksimal 8 MB.');
    photoInput.value = '';
    return;
  }
  previewText?.classList.add('has-photo');
});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const file = photoInput.files?.[0];
  if (!file) return alert('Foto profil wajib ditambahkan.');

  const button = document.getElementById('memberSubmitButton');
  button.disabled = true;
  button.textContent = 'Mendaftarkan...';

  try {
    const uploaded = await uploadProfilePhoto(file);
    const payload = {
      fullName: String(data.get('fullName') || '').trim(),
      whatsappNumber: String(data.get('whatsappNumber') || '').trim(),
      birthDate: String(data.get('birthDate') || ''),
      email: String(data.get('email') || '').trim(),
      pickupAddress: String(data.get('pickupAddress') || '').trim(),
      profilePhotoUrl: uploaded.url,
    };
    const result = await parseResponse(await fetch(`${API_BASE}/members`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }));
    saveMember(payload, result);

    document.getElementById('memberFormCard').innerHTML = `
      <div class="member-success">
        <img class="member-success-avatar" src="${ADMIN_BASE}${escapeHtml(uploaded.url)}" alt="Foto profil ${escapeHtml(payload.fullName)}">
        <h2>Selamat, ${escapeHtml(payload.fullName)}!</h2>
        <p>Kamu sudah terdaftar sebagai member Prashoes.</p>
        <span class="member-code">${escapeHtml(result.memberCode || 'MEMBER')}</span>
        <a href="index.html#antar-jemput" class="btn btn-primary btn-full">Lanjut Antar Jemput</a>
      </div>
    `;
  } catch (error) {
    alert(error.message || 'Pendaftaran member gagal.');
    button.disabled = false;
    button.textContent = 'Daftar Member';
  }
});
