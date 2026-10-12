const data = window.PRASHOES_DATA || {};

const ADMIN_BASE = "https://adminprashoes.prasapp.com";
const API_BASE = `${ADMIN_BASE}/api/public`;
const PUSH_PROMPT_SEEN_KEY = 'prashoes_push_prompt_seen';

const state = {
  pickupLatitude: null,
  pickupLongitude: null,
  pickupShareUrl: '',
  locationMessage: '',
  chatSessionId: null,
  chatOpen: false,
  chatThread: null,
  chatUnreadCount: 0,
  chatPollTimer: null,
  chatBadgeTimer: null,
  publicPushSubscription: null,
  publicPushContextual: false,
  chatUserMessageCount: 0,
};

async function fetchApi(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "content-type": "application/json" }),
      ...(options.headers || {}),
    },
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(json?.error || "Request API Prashoes gagal.");
  return json;
}

function base64ToBytes(value) {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

async function getPublicPushRegistration() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) throw new Error('Browser ini belum mendukung notifikasi web.');
  return navigator.serviceWorker.register('/sw.js');
}

async function savePublicPushSubscription(subscription) {
  const identity = getMemberInfoFromStorage();
  await fetchApi('/push-subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      chatSessionId: state.chatSessionId || getOrCreateChatSessionId(),
      whatsappNumber: identity.whatsappNumber,
      memberCode: identity.memberCode,
    }),
  });
}

function publicPushButtons() {
  return [document.getElementById('publicPushBtn'), document.getElementById('publicPushFab')].filter(Boolean);
}

function isIosDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandaloneApp() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

function showIosPushInstallGuide() {
  alert('Untuk aktifkan notifikasi di iPhone:\n\n1. Buka lewat Safari\n2. Tekan tombol Share\n3. Pilih Add to Home Screen / Tambahkan ke Layar Utama\n4. Buka Prashoes dari ikon Home Screen\n5. Tekan Aktifkan Notifikasi lagi');
}

function updatePublicPushPromptVisibility() {
  const prompt = document.getElementById('publicPushPrompt');
  if (!prompt) return;
  const unavailable = typeof Notification === 'undefined' || state.publicPushSubscription || Notification.permission === 'denied';
  const firstVisit = localStorage.getItem(PUSH_PROMPT_SEEN_KEY) !== 'true';
  const visible = !unavailable && (firstVisit || state.publicPushContextual);
  prompt.classList.toggle('hidden', !visible);
  if (visible && firstVisit) localStorage.setItem(PUSH_PROMPT_SEEN_KEY, 'true');
}

function showContextualPushPrompt() {
  if (typeof Notification === 'undefined' || state.publicPushSubscription || Notification.permission === 'denied') return;
  state.publicPushContextual = true;
  updatePublicPushPromptVisibility();
}

function dismissPublicPushPrompt() {
  localStorage.setItem(PUSH_PROMPT_SEEN_KEY, 'true');
  state.publicPushContextual = false;
  document.getElementById('publicPushPrompt')?.classList.add('hidden');
}

function updatePublicPushButton(active = false) {
  publicPushButtons().forEach((button) => {
    const label = button.dataset.pushLabel || (active ? 'Notifikasi Aktif' : 'Aktifkan Notifikasi');
    button.textContent = active ? 'Notifikasi Aktif' : label;
    button.classList.toggle('active', active);
    button.classList.toggle('hidden', active);
  });
  updatePublicPushPromptVisibility();
}

async function refreshPublicPushButton() {
  const buttons = publicPushButtons();
  if (!buttons.length) return;
  try {
    const config = await fetchApi('/push-public-key');
    if (!config.configured) { buttons.forEach((button) => button.classList.add('hidden')); return; }
    const registration = await getPublicPushRegistration();
    const subscription = await registration.pushManager.getSubscription();
    state.publicPushSubscription = subscription;
    buttons.forEach((button) => button.classList.remove('hidden'));
    updatePublicPushButton(Boolean(subscription));
    if (subscription) await savePublicPushSubscription(subscription);
  } catch {
    buttons.forEach((button) => button.classList.add('hidden'));
  }
}

async function togglePublicPush() {
  if (isIosDevice() && !isStandaloneApp()) {
    showIosPushInstallGuide();
    return;
  }
  const buttons = publicPushButtons();
  if (!buttons.length) return;
  buttons.forEach((button) => { button.disabled = true; });
  try {
    const config = await fetchApi('/push-public-key');
    if (!config.configured) throw new Error('Notifikasi belum aktif di server.');
    const registration = await getPublicPushRegistration();
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await fetchApi('/push-subscriptions', { method: 'DELETE', body: JSON.stringify({ endpoint: subscription.endpoint }) });
      await subscription.unsubscribe();
      state.publicPushSubscription = null;
      updatePublicPushButton(false);
    } else {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Izin notifikasi tidak diberikan. Di iPhone, pasang Prashoes ke Home Screen lalu buka dari ikon.');
      subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToBytes(config.publicKey) });
      state.publicPushSubscription = subscription;
      await savePublicPushSubscription(subscription);
      updatePublicPushButton(true);
    }
  } catch (error) {
    alert(error.message || 'Gagal mengatur notifikasi.');
  } finally {
    buttons.forEach((button) => { button.disabled = false; });
    updatePublicPushPromptVisibility();
  }
}

function normalizeRows(rows, fallback = []) {
  return Array.isArray(rows) && rows.length ? rows : fallback;
}

function rupiah(value) {
  return `Rp${Number(value || 0).toLocaleString("id-ID")}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function photoUrl(value) {
  const url = String(value || "");
  return url.startsWith("/uploads/") ? `${ADMIN_BASE}${url}` : url;
}

function formatShortDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function warrantyBlock(tracking, item) {
  const warranty = item.warranty || {};
  if (!warranty.days) return "";
  if (item.warrantyClaim) {
    return `<div class="warranty-box claimed"><strong>Klaim garansi diajukan</strong><span>Status: ${escapeHtml(item.warrantyClaim.status || "Menunggu review")}</span></div>`;
  }
  if (warranty.eligible) {
    return `<div class="warranty-box"><strong>Garansi ${escapeHtml(warranty.type)} aktif ${Number(warranty.days)} hari</strong><span>Berlaku sampai ${escapeHtml(formatShortDate(warranty.expiresAt))}</span><button class="btn btn-secondary warranty-claim-btn" type="button" data-warranty-claim="${escapeHtml(item.orderItemId)}" data-customer-name="${escapeHtml(tracking.customerName || "")}" data-whatsapp-number="${escapeHtml(tracking.whatsappNumber || "")}" data-treatment-name="${escapeHtml(warranty.type)}" data-warranty-days="${Number(warranty.days)}">Klaim Garansi</button></div>`;
  }
  if (tracking.status === "Selesai") {
    return `<div class="warranty-box expired"><strong>Garansi ${escapeHtml(warranty.type)} berakhir</strong><span>Batas klaim sampai ${escapeHtml(formatShortDate(warranty.expiresAt))}</span></div>`;
  }
  return `<div class="warranty-box waiting"><strong>Garansi aktif setelah order selesai</strong><span>${escapeHtml(warranty.type)}: ${Number(warranty.days)} hari setelah barang diterima customer.</span></div>`;
}

function dt(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
}

function downloadReceipt(button) {
  const orderCode = button.dataset.orderCode || "order";
  const customerName = button.dataset.customerName || "Customer";
  const amount = rupiah(button.dataset.amount || 0);
  const paidAt = dt(button.dataset.paidAt);
  const method = String(button.dataset.paymentMethod || "Pembayaran").toUpperCase();
  const body = [
    "NOTA PEMBAYARAN PRASHOES",
    "================================",
    `Nomor Order : ${orderCode}`,
    `Customer    : ${customerName}`,
    `Metode      : ${method}`,
    `Tanggal     : ${paidAt}`,
    `Total       : ${amount}`,
    "================================",
    "Status: LUNAS",
    "Terima kasih sudah mempercayakan treatment sepatu ke Prashoes.",
  ].join("\n");
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `nota-${orderCode}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getOrCreateChatSessionId() {
  const key = "prashoes_chat_session";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `sess_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function getMemberInfoFromStorage() {
  return {
    fullName: localStorage.getItem("prashoes_member_name") || "",
    whatsappNumber: localStorage.getItem("prashoes_member_whatsapp") || "",
    email: localStorage.getItem("prashoes_member_email") || "",
    pickupAddress: localStorage.getItem("prashoes_member_address") || "",
    memberCode: localStorage.getItem("prashoes_member_code") || "",
    profilePhotoUrl: localStorage.getItem("prashoes_member_photo") || "",
    isMember: localStorage.getItem("prashoes_is_member") === "true",
  };
}

function getChatIdentity() {
  const stored = getMemberInfoFromStorage();
  return {
    fullName: document.getElementById("chatName")?.value?.trim() || stored.fullName,
    whatsappNumber: document.getElementById("chatWhatsapp")?.value?.trim() || stored.whatsappNumber,
    email: stored.email,
  };
}

function setMemberInfoFromPayload(payload, result = {}) {
  const isMember = Boolean(result.isMember ?? result.is_member ?? payload.isMember);
  localStorage.setItem("prashoes_is_member", String(isMember));
  if (payload.fullName || result.fullName || result.customer_name) localStorage.setItem("prashoes_member_name", payload.fullName || result.fullName || result.customer_name);
  if (payload.whatsappNumber) localStorage.setItem("prashoes_member_whatsapp", payload.whatsappNumber);
  if (payload.email) localStorage.setItem("prashoes_member_email", payload.email);
  if (payload.pickupAddress) localStorage.setItem("prashoes_member_address", payload.pickupAddress);
  if (payload.profilePhotoUrl) localStorage.setItem("prashoes_member_photo", payload.profilePhotoUrl);
  if (payload.memberCode || result.memberCode) localStorage.setItem("prashoes_member_code", payload.memberCode || result.memberCode);
  if (payload.fullName) localStorage.setItem("prashoes_identity_submitted", "true");
  if (state.publicPushSubscription) savePublicPushSubscription(state.publicPushSubscription).catch(() => {});
}

async function fetchChatThread(sessionId) {
  return fetchApi(`/chat?sessionId=${encodeURIComponent(sessionId)}`);
}

async function fetchChatTemplates() {
  const templates = await fetchApi('/chat/templates');
  return Array.isArray(templates) && templates.length
    ? templates.map((item) => item.message || item).filter(Boolean)
    : [
      'Harga cuci sepatu berapa?',
      'Berapa lama proses cuci sepatu?',
      'Bisa pickup ke rumah?',
      'Bahan suede bisa dibersihkan?',
    ];
}

async function validateIdentityBeforeSend() {
  const name = document.getElementById('chatName')?.value?.trim() || getMemberInfoFromStorage().fullName;
  if (!name) { alert('Nama wajib diisi.'); return false; }
  await detectChatIdentity();
  return true;
}

function collapseChatIdentity(name) {
  const container = document.getElementById('chatIdentity');
  const customerName = String(name || '').trim();
  if (!container || !customerName) return;
  container.classList.add('submitted');
  container.innerHTML = `<span class="chat-name-badge">${escapeHtml(customerName)}</span>`;
}

async function detectChatIdentity() {
  const whatsappNumber = document.getElementById('chatWhatsapp')?.value?.trim();
  const badge = document.getElementById('chatMemberBadge');
  if (!badge || !whatsappNumber) return;
  try {
    const result = await fetchApi('/chat/identity', {
      method: 'POST',
      body: JSON.stringify({ whatsappNumber }),
    });
    const identity = getChatIdentity();
    setMemberInfoFromPayload({ ...identity, isMember: result.isMember }, result);
    badge.textContent = result.isMember ? `Member${result.fullName ? ` • ${result.fullName}` : ''}` : 'Non-member';
    badge.classList.toggle('member', Boolean(result.isMember));
  } catch {
    badge.textContent = 'Non-member';
    badge.classList.remove('member');
  }
}

async function sendChatMessage(sessionId, message) {
  const identity = getChatIdentity();
  const result = await fetchApi("/chat", {
    method: "POST",
    body: JSON.stringify({ sessionId, message, ...identity }),
  });
  setMemberInfoFromPayload(identity, result);
  collapseChatIdentity(identity.fullName);
  return result;
}

function normalizePhone(value) {
  const raw = String(value || "").replace(/[^0-9]/g, "");
  if (raw.startsWith("0")) return `62${raw.slice(1)}`;
  if (raw.startsWith("62")) return raw;
  return raw;
}

function calculatePickupPricing({ shoeQuantity, serviceType, isMember }) {
  const quantity = Math.max(1, Number(shoeQuantity || 1));
  const service = data.services?.find((item) => item.name === serviceType);
  const priceNumber = Number(String(service?.startingPrice || "0").replace(/[^0-9]/g, ""));
  const subtotal = priceNumber * quantity;
  const discountAmount = isMember ? Math.round(subtotal * (data.pricing?.memberDiscount || 0.1)) : 0;
  const deliveryFee = isMember && quantity >= (data.pricing?.freeDeliveryMinPairs || 2) ? 0 : (data.pricing?.deliveryFee || 5000);
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);

  return {
    discountAmount,
    deliveryFee,
    total,
    promoLabel: isMember ? "Diskon member 10%" : "Non-member",
    estimatedTotalLabel: service ? rupiah(total) : "Pilih layanan",
  };
}

function servicePriceValue(service) {
  const numericPrice = Number(String(service?.startingPrice || "").replace(/[^0-9]/g, ""));
  return Number.isFinite(numericPrice) && numericPrice > 0 ? numericPrice : Number.MAX_SAFE_INTEGER;
}

function renderServices() {
  const container = document.getElementById("services-grid");
  if (!container) return;

  const services = [...(data.services || [])].sort((left, right) => servicePriceValue(left) - servicePriceValue(right));
  if (!services.length) {
    container.innerHTML = `<div class="notice-card">Belum ada data layanan.</div>`;
    return;
  }

  container.innerHTML = services.map((service) => {
    const background = service.image ? ` style="--service-bg: url('${escapeHtml(service.image)}');"` : "";
    return `
      <article class="service-card" role="listitem"${background}>
        <div class="service-card-content">
          <h3>${escapeHtml(service.name)}</h3>
          <p class="service-price">${escapeHtml(service.startingPrice)}</p>
          <p class="service-desc">${escapeHtml(service.description)}</p>
        </div>
      </article>
    `;
  }).join("");
}

function renderPromos() {
  const benefitsList = document.getElementById("benefits-list");
  const promosWrapper = document.getElementById("promos-wrapper");

  if (benefitsList) {
    benefitsList.innerHTML = (data.memberBenefits || []).map((benefit) => `
      <li>${escapeHtml(benefit)}</li>
    `).join("");
  }

  if (promosWrapper) {
    const promos = data.promos || [];
    promosWrapper.innerHTML = promos.length ? promos.map((promo) => `
      <article class="promo-card">
        <div class="promo-card-header">
          <h3>${escapeHtml(promo.title)}</h3>
          <span class="promo-badge">${escapeHtml(promo.discountLabel)}</span>
        </div>
        <p>${escapeHtml(promo.description)}</p>
      </article>
    `).join("") : `<div class="notice-card">Belum ada promo aktif.</div>`;
  }
}

function renderPickupForm() {
  const wrapper = document.getElementById("pickup-form-wrapper");
  if (!wrapper) return;

  const serviceOptions = data.serviceOptions || data.services?.map((service) => service.name) || [];
  const firstService = serviceOptions[0] || "";
  const memberInfo = getMemberInfoFromStorage();

  wrapper.className = "pickup-card";
  wrapper.innerHTML = `
    <h2 id="pickup-title">Antar Jemput</h2>
    <p>Isi form di bawah ini untuk menjadwalkan penjemputan sepatu kamu.</p>

    <form id="pickup-form" class="pickup-form">
      <div class="form-group">
        <label class="form-label">Status Customer</label>
        <div class="member-status-badge ${memberInfo.isMember ? 'active' : ''}">
          ${memberInfo.isMember ? `Member • ${escapeHtml(memberInfo.fullName)}${memberInfo.memberCode ? ` (${escapeHtml(memberInfo.memberCode)})` : ''}` : 'Non-member'}
        </div>
        <input type="hidden" name="isMember" value="${memberInfo.isMember ? 'true' : 'false'}">
        <input type="hidden" name="memberCode" value="${escapeHtml(memberInfo.memberCode)}">
      </div>

      <div class="form-group">
        <label for="fullName" class="form-label">Nama Lengkap</label>
        <input id="fullName" name="fullName" type="text" required placeholder="Masukkan nama lengkap" class="form-input" value="${escapeHtml(memberInfo.fullName)}">
      </div>

      <div class="form-group">
        <label for="whatsappNumber" class="form-label">Nomor WhatsApp</label>
        <input id="whatsappNumber" name="whatsappNumber" type="tel" required placeholder="08xxxxxxxxxx" class="form-input" value="${escapeHtml(memberInfo.whatsappNumber)}">
      </div>

      <div class="form-group">
        <label for="email" class="form-label">Email (Opsional)</label>
        <input id="email" name="email" type="email" placeholder="nama@email.com" class="form-input" value="${escapeHtml(memberInfo.email)}">
      </div>


      <div class="form-group">
        <label for="pickupAddress" class="form-label">Alamat Penjemputan</label>
        <div class="location-row">
          <button type="button" id="location-btn" class="btn-location">Pakai Lokasi Saya</button>
        </div>
        <textarea id="pickupAddress" name="pickupAddress" required placeholder="Alamat lengkap penjemputan" rows="4" class="form-textarea">${escapeHtml(memberInfo.pickupAddress)}</textarea>
        <p id="location-help" class="field-help hidden"></p>
      </div>

      <div class="two-col">
        <div class="form-group">
          <label for="shoeQuantity" class="form-label">Jumlah Sepatu</label>
          <input id="shoeQuantity" name="shoeQuantity" type="number" min="1" max="20" value="1" required class="form-input">
        </div>
        <div class="form-group">
          <label for="serviceType" class="form-label">Jenis Layanan</label>
          <select id="serviceType" name="serviceType" required class="form-select">
            ${serviceOptions.length ? serviceOptions.map((option) => `<option value="${escapeHtml(option)}" ${option === firstService ? "selected" : ""}>${escapeHtml(option)}</option>`).join("") : `<option value="">Belum ada layanan</option>`}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="notes" class="form-label">Catatan Tambahan</label>
        <textarea id="notes" name="notes" rows="3" placeholder="Contoh: minta pickup sore, patokan rumah, atau detail sepatu" class="form-textarea"></textarea>
      </div>

      <div class="summary-box" id="pricing-summary"></div>

      <button type="submit" class="btn btn-primary btn-full">Kirim Request</button>
    </form>
  `;

  bindPickupForm();
}

function getPickupPayload() {
  const form = document.getElementById("pickup-form");
  if (!form) return null;
  const fd = new FormData(form);
  return {
    fullName: fd.get("fullName") || "",
    whatsappNumber: fd.get("whatsappNumber") || "",
    email: fd.get("email") || "",
    pickupAddress: fd.get("pickupAddress") || "",
    shoeQuantity: Number(fd.get("shoeQuantity") || 1),
    serviceType: fd.get("serviceType") || "",
    isMember: fd.get("isMember") === "true",
    memberCode: fd.get("memberCode") || "",
    notes: fd.get("notes") || "",
  };
}

function updatePricingSummary() {
  const summary = document.getElementById("pricing-summary");
  const payload = getPickupPayload();
  if (!summary || !payload) return;

  const pricing = calculatePickupPricing(payload);
  summary.innerHTML = `
    <strong>Ringkasan Benefit & Ongkir</strong>
    <p>Promo: ${escapeHtml(pricing.promoLabel)}</p>
    <p>Diskon estimasi: ${rupiah(pricing.discountAmount)}</p>
    <p>Ongkir: ${rupiah(pricing.deliveryFee)}</p>
    <p>Total estimasi: ${escapeHtml(pricing.estimatedTotalLabel)}</p>
    <p class="summary-note">Member baru mendapat diskon 10%. Member gratis ongkir minimal 2 pair. Non-member dikenakan ongkir Rp5.000. Program loyalti: ${escapeHtml(data.pricing?.loyaltyReward || "gratis 1x cuci setelah 10x Deep Clean")}.</p>
  `;
}

function bindPickupForm() {
  const form = document.getElementById("pickup-form");
  const locationBtn = document.getElementById("location-btn");
  const locationHelp = document.getElementById("location-help");
  if (!form) return;

  form.addEventListener("input", updatePricingSummary);
  form.addEventListener("change", updatePricingSummary);

  locationBtn?.addEventListener("click", () => {
    if (!navigator.geolocation) {
      if (locationHelp) {
        locationHelp.textContent = "Browser ini belum mendukung GPS perangkat.";
        locationHelp.classList.remove("hidden", "success");
      }
      return;
    }

    locationBtn.textContent = "Mengambil lokasi...";
    locationBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        state.pickupLatitude = position.coords.latitude;
        state.pickupLongitude = position.coords.longitude;
        state.pickupShareUrl = `https://maps.google.com/?q=${state.pickupLatitude},${state.pickupLongitude}`;
        if (locationHelp) {
          locationHelp.textContent = `Share location siap: ${state.pickupShareUrl}`;
          locationHelp.classList.remove("hidden");
          locationHelp.classList.add("success");
        }
        locationBtn.textContent = "Pakai Lokasi Saya";
        locationBtn.disabled = false;
      },
      () => {
        if (locationHelp) {
          locationHelp.textContent = "Izin lokasi ditolak. Lanjutkan dengan alamat manual.";
          locationHelp.classList.remove("hidden", "success");
        }
        locationBtn.textContent = "Pakai Lokasi Saya";
        locationBtn.disabled = false;
      }
    );
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = getPickupPayload();
    if (!payload) return;

    const pricing = calculatePickupPricing(payload);
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Mengirim...";
    }

    try {
      const result = await fetchApi("/pickup-requests", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          pickupLatitude: state.pickupLatitude,
          pickupLongitude: state.pickupLongitude,
          pickupShareUrl: state.pickupShareUrl,
          deliveryFee: pricing.deliveryFee,
          discountAmount: pricing.discountAmount,
          promoLabel: pricing.promoLabel,
        }),
      });
      setMemberInfoFromPayload(payload, result);
      showContextualPushPrompt();

      const wrapper = document.getElementById("pickup-form-wrapper");
      if (wrapper) {
        wrapper.className = "pickup-card success";
        wrapper.innerHTML = `
          <div class="success-icon">✅</div>
          <h2>Request Pickup Terkirim</h2>
          <p>Kode request kamu: <strong>${escapeHtml(result.requestCode || "-")}</strong></p>
          <p>Admin Prashoes akan menghubungi nomor WhatsApp kamu untuk konfirmasi jadwal.</p>
          <a href="#antar-jemput" class="btn btn-primary" id="new-request-btn">Buat Request Baru</a>
        `;
        document.getElementById("new-request-btn")?.addEventListener("click", (e) => {
          e.preventDefault();
          renderPickupForm();
          document.getElementById("antar-jemput")?.scrollIntoView({ behavior: "smooth" });
        });
      }
    } catch (error) {
      alert(error.message || "Gagal mengirim request pickup.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Kirim Request";
      }
    }
  });

  updatePricingSummary();
}

function bindTracking() {
  const type = document.getElementById("tracking-type");
  const input = document.getElementById("order-id");
  const button = document.getElementById("track-btn");
  const error = document.getElementById("tracking-error");
  const result = document.getElementById("tracking-result");
  const placeholders = {
    name: "Masukkan nama customer",
    member: "Contoh: MBR-XXXX",
    whatsapp: "Contoh: 081234567890",
    email: "Contoh: nama@email.com",
  };

  type?.addEventListener("change", () => {
    if (!input) return;
    input.placeholder = placeholders[type.value] || placeholders.whatsapp;
    input.type = type.value === "whatsapp" ? "tel" : "text";
    input.inputMode = type.value === "whatsapp" ? "tel" : "text";
  });

  async function track() {
    const searchType = type?.value || "whatsapp";
    const value = input?.value?.trim();
    if (!value) {
      if (error) {
        error.textContent = "Masukkan data pencarian terlebih dahulu.";
        error.classList.remove("hidden");
      }
      result?.classList.add("hidden");
      return;
    }

    if (error) error.classList.add("hidden");
    if (result) {
      result.innerHTML = `<div class="notice-card">Mengecek status pesanan...</div>`;
      result.classList.remove("hidden");
    }

    try {
      const orders = await fetchApi(`/tracking?type=${encodeURIComponent(searchType)}&value=${encodeURIComponent(value)}`);
      if (!Array.isArray(orders) || !orders.length) throw new Error("Pesanan tidak ditemukan.");
      result.innerHTML = orders.map((tracking) => {
        const items = tracking.items || [];
        const reviewCta = tracking.status === "Selesai" ? `
          <div class="tracking-review-cta">
            <div>
              <strong>Puas dengan hasil treatment?</strong>
              <p>Kasih rating untuk bantu Prashoes makin dipercaya.</p>
            </div>
            <a class="btn btn-primary" href="https://g.page/r/CdOtP09kbngiEBM/review" target="_blank" rel="noopener noreferrer">Beri Review di Google</a>
          </div>
        ` : "";
        const reviewClaim = tracking.status === "Selesai" ? `
          <details class="tracking-review-claim">
            <summary>Klaim Voucher 20% Review</summary>
            <div class="review-claim-form">
              <p>Sudah kasih review 5 bintang di Google Maps? Upload screenshot untuk klaim voucher 20% yang berlaku 7 hari.</p>
              <input type="file" accept="image/*" capture="environment" data-review-screenshot-input>
              <input type="hidden" data-review-screenshot-url>
              <button class="btn btn-primary" data-submit-review-claim data-customer-name="${escapeHtml(tracking.customerName || '')}" data-whatsapp-number="${escapeHtml(tracking.whatsappNumber || '')}" data-email="${escapeHtml(tracking.email || '')}" type="button" disabled>Kirim Klaim Review</button>
              <p class="review-claim-msg" data-review-claim-msg></p>
            </div>
          </details>
        ` : "";
        const itemsHtml = items.length ? `<div class="tracking-items-result">${items.map((item, index) => {
          const parts = String(item.shoeDescription || "").split(" • ").filter(Boolean);
          const photos = Array.isArray(item.photos) ? item.photos : [];
          const stageLabel = { received: "Sepatu diterima", drying: "Setelah cuci / pengeringan", ready: "Siap diambil" };
          return `<div class="tracking-item-result"><span class="tracking-item-number">${index + 1}</span><div><strong>${escapeHtml(parts.join(" • ") || "Sepatu")}</strong><p>Status item: ${escapeHtml(item.itemStatus || "-")}${item.notes ? ` • ${escapeHtml(item.notes)}` : ""}</p>${warrantyBlock(tracking, item)}${photos.length ? `<div class="tracking-photo-grid">${photos.map((photo) => `<figure class="tracking-photo-card"><img src="${escapeHtml(photoUrl(photo.imageUrl))}" alt="${escapeHtml(stageLabel[photo.photoType] || photo.caption || "Progress sepatu")}" loading="lazy"><figcaption>${escapeHtml(stageLabel[photo.photoType] || photo.caption || "Progress sepatu")}</figcaption></figure>`).join("")}</div>` : ""}</div></div>`;
        }).join("")}</div>` : "";
        const paymentAmount = Number(tracking.revenueAmount || 0);
        const isPaid = tracking.paymentStatus === "terbayar";
        const proof = tracking.paymentProof || null;
        const delivery = tracking.deliveryRequest || null;
        const deliveryRequest = delivery ? `
          <div class="tracking-delivery-card active">
            <div><span class="tracking-kicker">Request Antar</span><strong>${escapeHtml(delivery.requestCode || "-")}</strong></div>
            <p>Antar ke: ${escapeHtml(delivery.address || "-")}</p>
            <div class="delivery-summary"><span>${(Number(delivery.distanceMeters || 0) / 1000).toFixed(1)} km</span><span>${escapeHtml(rupiah(delivery.deliveryFee || 0))}</span><span>${escapeHtml(delivery.status || "Menunggu konfirmasi")}</span></div>
          </div>
        ` : tracking.status === "Siap diambil" && !isPaid ? `
          <details class="tracking-delivery-card">
            <summary>Request Antar</summary>
            <div class="delivery-request-form" data-delivery-form data-order-id="${escapeHtml(tracking.orderId || "")}" data-whatsapp-number="${escapeHtml(tracking.whatsappNumber || "")}">
              <p>Bagikan lokasi tujuan untuk melihat estimasi jarak, waktu, dan ongkir otomatis.</p>
              <button class="btn btn-primary" type="button" data-delivery-location>Gunakan Lokasi Saya</button>
              <span data-delivery-location-status>Lokasi belum dibagikan.</span>
              <input type="hidden" data-delivery-latitude>
              <input type="hidden" data-delivery-longitude>
              <div class="delivery-quote hidden" data-delivery-quote-result></div>
              <button class="btn btn-primary hidden" type="button" data-delivery-submit>Konfirmasi Request Antar</button>
              <p class="form-message" data-delivery-message></p>
            </div>
          </details>
        ` : "";
        const paymentName = `payment-${escapeHtml(tracking.orderCode || tracking.customerName || 'order')}`;
        const paymentConfirm = isPaid ? `
          <div class="tracking-payment-confirm paid">
            <div class="payment-total-box">
              <span>Total pembayaran</span>
              <strong>${escapeHtml(rupiah(paymentAmount))}</strong>
            </div>
            <div class="payment-paid-status">
              <span class="payment-paid-icon">✓</span>
              <div><strong>Sudah Terbayar / Lunas</strong><p>Dibayar ${escapeHtml(dt(tracking.paidAt))} melalui ${escapeHtml(String(tracking.paymentMethod || "Pembayaran").toUpperCase())}.</p></div>
            </div>
            <button class="btn btn-primary" type="button" data-download-receipt
              data-order-code="${escapeHtml(tracking.orderCode || '')}"
              data-customer-name="${escapeHtml(tracking.customerName || '')}"
              data-amount="${Number(tracking.revenueAmount || 0)}"
              data-paid-at="${escapeHtml(tracking.paidAt || '')}"
              data-payment-method="${escapeHtml(tracking.paymentMethod || '')}">Cetak / Download Nota</button>
          </div>
        ` : `
          <div class="tracking-payment-confirm">
            <div class="tracking-payment-head">
              <div>
                <strong>Konfirmasi Pembayaran</strong>
                <p>Pilih metode pembayaran. Untuk QRIS, scan atau download gambar QRIS.</p>
              </div>
            </div>
            <div class="payment-total-box">
              <span>Total yang harus dibayar</span>
              <strong>${escapeHtml(rupiah(paymentAmount))}</strong>
            </div>
            <div class="payment-toggle" role="radiogroup" aria-label="Pilihan pembayaran">
              <label>
                <input type="radio" name="${paymentName}" value="cod" checked data-payment-method>
                <span>COD</span>
              </label>
              <label>
                <input type="radio" name="${paymentName}" value="qris" data-payment-method>
                <span>QRIS</span>
              </label>
            </div>
            <div class="qris-box hidden" data-qris-box>
              <img src="images/qris.avif" alt="QRIS Prashoes" loading="lazy">
              <a class="btn btn-primary" href="images/qris.avif" download="qris-prashoes.avif">Download QRIS</a>
              <div class="payment-proof-upload">
                <strong>Sudah transfer?</strong>
                <p>Upload screenshot pembayaran untuk diperiksa admin.</p>
                <input type="file" accept="image/*" capture="environment" data-payment-proof-input>
                <input type="hidden" data-payment-proof-url>
                <button class="btn btn-secondary" type="button" data-submit-payment-proof data-order-id="${escapeHtml(tracking.orderId || '')}" disabled>Kirim Bukti Pembayaran</button>
                <p class="payment-proof-message" data-payment-proof-message>${proof ? `Status bukti: ${escapeHtml(proof.status || 'pending')}` : ''}</p>
              </div>
            </div>
          </div>
        `;
        return `
          <article class="tracking-order-result">
            <div class="tracking-result-head">
              <div>
                <span class="tracking-kicker">Order ditemukan</span>
                <h3>${escapeHtml(tracking.orderCode || "-")}</h3>
              </div>
              <span class="tracking-status-pill">${escapeHtml(tracking.status || "-")}</span>
            </div>
            <div class="tracking-customer-chip">
              <span>Customer</span>
              <strong>${escapeHtml(tracking.customerName || "-")}</strong>
            </div>
            ${itemsHtml}
            ${reviewCta}
            ${reviewClaim}
            ${deliveryRequest}
            ${paymentConfirm}
          </article>
        `;
      }).join("");
      showContextualPushPrompt();
    } catch (err) {
      result.innerHTML = `
        <div class="notice-card">
          <strong>Pesanan belum ditemukan.</strong><br>
          Pastikan data yang dipilih benar atau hubungi admin Prashoes via WhatsApp.
          <div style="margin-top:1rem">
            <a class="btn btn-primary" href="${escapeHtml(data.contact?.whatsapp || "https://wa.me/6285601679005")}?text=${encodeURIComponent(`Halo Prashoes, saya mau cek status pesanan untuk ${value}`)}" target="_blank" rel="noopener noreferrer">Cek via WhatsApp</a>
          </div>
        </div>
      `;
    }
  }

  result?.addEventListener("change", async (event) => {
    const paymentMethod = event.target.closest("[data-payment-method]");
    if (paymentMethod) {
      const box = paymentMethod.closest(".tracking-payment-confirm")?.querySelector("[data-qris-box]");
      if (box) box.classList.toggle("hidden", paymentMethod.value !== "qris" || !paymentMethod.checked);
      return;
    }

    const proofInput = event.target.closest("[data-payment-proof-input]");
    if (proofInput) {
      if (!proofInput.files?.[0]) return;
      const form = proofInput.closest(".payment-proof-upload");
      const msg = form?.querySelector("[data-payment-proof-message]");
      const hidden = form?.querySelector("[data-payment-proof-url]");
      const submit = form?.querySelector("[data-submit-payment-proof]");
      const fd = new FormData();
      fd.append("photo", proofInput.files[0]);
      if (msg) msg.textContent = "Mengupload bukti pembayaran...";
      try {
        const upload = await fetchApi("/payment-proof-upload", { method: "POST", body: fd });
        if (hidden) hidden.value = upload.url || "";
        if (submit) submit.disabled = !upload.url;
        if (msg) msg.textContent = "Bukti tersimpan. Klik Kirim Bukti Pembayaran.";
      } catch (error) {
        if (msg) msg.textContent = error.message || "Upload bukti gagal.";
      }
      return;
    }

    const input = event.target.closest("[data-review-screenshot-input]");
    if (!input || !input.files?.[0]) return;
    const form = input.closest(".review-claim-form");
    const msg = form?.querySelector("[data-review-claim-msg]");
    const hidden = form?.querySelector("[data-review-screenshot-url]");
    const submit = form?.querySelector("[data-submit-review-claim]");
    const fd = new FormData();
    fd.append("photo", input.files[0]);
    if (msg) msg.textContent = "Mengupload screenshot...";
    try {
      const upload = await fetchApi("/review-screenshot", { method: "POST", body: fd });
      if (hidden) hidden.value = upload.url || "";
      if (submit) submit.disabled = !upload.url;
      if (msg) msg.textContent = "Screenshot tersimpan. Klik Kirim Klaim Review.";
    } catch (error) {
      if (msg) msg.textContent = error.message || "Upload screenshot gagal.";
    }
  });

  result?.addEventListener("click", async (event) => {
    const locButton = event.target.closest("[data-delivery-location]");
    if (locButton) {
      const form = locButton.closest("[data-delivery-form]");
      const msg = form?.querySelector("[data-delivery-location-status]");
      if (!navigator.geolocation) { if (msg) msg.textContent = "Browser belum mendukung share lokasi."; return; }
      locButton.disabled = true;
      if (msg) msg.textContent = "Mengambil lokasi...";
      navigator.geolocation.getCurrentPosition(async (pos) => {
        form.querySelector("[data-delivery-latitude]").value = pos.coords.latitude;
        form.querySelector("[data-delivery-longitude]").value = pos.coords.longitude;
        const quoteBox = form?.querySelector("[data-delivery-quote-result]");
        const submit = form?.querySelector("[data-delivery-submit]");
        if (msg) msg.textContent = "Lokasi ditemukan. Menghitung estimasi ongkir...";
        try {
          const quote = await fetchApi("/delivery-quote", { method: "POST", body: JSON.stringify({ orderId: form.dataset.orderId, whatsappNumber: form.dataset.whatsappNumber, latitude: pos.coords.latitude, longitude: pos.coords.longitude }) });
          form.dataset.deliveryQuote = JSON.stringify(quote);
          if (quoteBox) {
            quoteBox.innerHTML = `<strong>Estimasi jarak ${(Number(quote.distanceMeters || 0) / 1000).toFixed(1)} km</strong><span>Estimasi waktu ${Math.round(Number(quote.durationSeconds || 0) / 60)} menit</span><span>Estimasi ongkir: ${escapeHtml(rupiah(quote.deliveryFee || 0))}</span><small>Total COD: ${escapeHtml(rupiah(quote.totalCod || 0))}</small>`;
            quoteBox.classList.remove("hidden");
          }
          submit?.classList.remove("hidden");
          if (msg) msg.textContent = "Estimasi siap. Konfirmasi untuk kirim request antar.";
        } catch (error) {
          if (msg) msg.textContent = "Estimasi jarak belum tersedia. Coba lagi beberapa saat.";
        } finally {
          locButton.disabled = false;
        }
      }, () => {
        if (msg) msg.textContent = "Gagal mengambil lokasi. Aktifkan izin lokasi.";
        locButton.disabled = false;
      }, { enableHighAccuracy: true, timeout: 15000 });
      return;
    }

    const deliverySubmit = event.target.closest("[data-delivery-submit]");
    if (deliverySubmit) {
      const form = deliverySubmit.closest("[data-delivery-form]");
      const msg = form?.querySelector("[data-delivery-message]");
      deliverySubmit.disabled = true;
      if (msg) msg.textContent = "Mengirim request antar...";
      try {
        await fetchApi("/delivery-requests", { method: "POST", body: JSON.stringify({ orderId: form.dataset.orderId, whatsappNumber: form.dataset.whatsappNumber, latitude: form.querySelector("[data-delivery-latitude]")?.value || null, longitude: form.querySelector("[data-delivery-longitude]")?.value || null }) });
        if (msg) msg.textContent = "Request antar terkirim. Admin akan konfirmasi.";
        deliverySubmit.classList.add("hidden");
      } catch (error) {
        if (msg) msg.textContent = error.message || "Request antar gagal.";
        deliverySubmit.disabled = false;
      }
      return;
    }

    const reviewButton = event.target.closest("[data-submit-review-claim]");
    if (reviewButton) {
      const form = reviewButton.closest(".review-claim-form");
      const msg = form?.querySelector("[data-review-claim-msg]");
      const screenshotUrl = form?.querySelector("[data-review-screenshot-url]")?.value || "";
      if (!screenshotUrl) return;
      reviewButton.disabled = true;
      if (msg) msg.textContent = "Mengirim klaim review...";
      try {
        await fetchApi("/review-claim", {
          method: "POST",
          body: JSON.stringify({
            screenshotUrl,
            customerName: reviewButton.dataset.customerName,
            whatsappNumber: reviewButton.dataset.whatsappNumber,
            email: reviewButton.dataset.email,
          }),
        });
        if (msg) msg.textContent = "Klaim terkirim. Admin akan cek screenshot dan menerbitkan voucher 20%.";
      } catch (error) {
        if (msg) msg.textContent = error.message || "Klaim review gagal.";
        reviewButton.disabled = false;
      }
      return;
    }

    const proofButton = event.target.closest("[data-submit-payment-proof]");
    if (proofButton) {
      const form = proofButton.closest(".payment-proof-upload");
      const msg = form?.querySelector("[data-payment-proof-message]");
      const proofUrl = form?.querySelector("[data-payment-proof-url]")?.value || "";
      if (!proofUrl) return;
      proofButton.disabled = true;
      if (msg) msg.textContent = "Mengirim bukti pembayaran...";
      try {
        await fetchApi("/payment-proof", {
          method: "POST",
          body: JSON.stringify({ orderId: proofButton.dataset.orderId, proofUrl }),
        });
        if (msg) msg.textContent = "Bukti terkirim. Admin akan cek, lalu status menjadi Lunas setelah disetujui.";
      } catch (error) {
        if (msg) msg.textContent = error.message || "Bukti pembayaran gagal dikirim.";
        proofButton.disabled = false;
      }
      return;
    }

    const receiptButton = event.target.closest("[data-download-receipt]");
    if (receiptButton) {
      downloadReceipt(receiptButton);
      return;
    }

    const button = event.target.closest("[data-warranty-claim]");
    if (!button) return;
    openWarrantyClaimDialog(button);
  });

  button?.addEventListener("click", track);
  input?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") track();
  });
}

function openWarrantyClaimDialog(button) {
  const dialog = document.createElement("dialog");
  dialog.className = "warranty-dialog";
  dialog.innerHTML = `
    <div class="warranty-dialog-content">
      <div class="warranty-dialog-header">
        <strong>Klaim Garansi</strong>
        <button class="warranty-dialog-close" type="button" aria-label="Tutup">✕</button>
      </div>
      <p class="warranty-dialog-desc">Tulis kendala yang ingin diklaim garansi:</p>
      <textarea class="warranty-dialog-textarea" placeholder="Contoh: noda tidak hilang, warna memudar, dll." required></textarea>
      <p class="warranty-dialog-error" aria-live="polite"></p>
      <div class="warranty-dialog-actions">
        <button class="btn btn-secondary" type="button" data-warranty-cancel>Batal</button>
        <button class="btn btn-primary" type="button" data-warranty-submit>Kirim Klaim</button>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);

  const close = () => {
    dialog.close();
    dialog.remove();
  };

  const cancelBtn = dialog.querySelector("[data-warranty-cancel]");
  const submitBtn = dialog.querySelector("[data-warranty-submit]");
  const closeBtn = dialog.querySelector(".warranty-dialog-close");
  const textarea = dialog.querySelector(".warranty-dialog-textarea");
  const errorEl = dialog.querySelector(".warranty-dialog-error");

  cancelBtn?.addEventListener("click", close);
  closeBtn?.addEventListener("click", close);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });

  submitBtn?.addEventListener("click", async () => {
    const reason = textarea.value.trim();
    if (!reason) {
      if (errorEl) errorEl.textContent = "Isi alasan klaim dulu.";
      textarea.focus();
      return;
    }
    if (errorEl) errorEl.textContent = "";
    submitBtn.disabled = true;
    submitBtn.textContent = "Mengirim...";
    try {
      await fetchApi("/warranty-claim", {
        method: "POST",
        body: JSON.stringify({
          orderItemId: button.dataset.warrantyClaim,
          customerName: button.dataset.customerName,
          whatsappNumber: button.dataset.whatsappNumber,
          treatmentName: button.dataset.treatmentName,
          warrantyDays: Number(button.dataset.warrantyDays || 0),
          reason,
        }),
      });
      close();
      button.closest(".warranty-box").outerHTML = '<div class="warranty-box claimed"><strong>Klaim garansi diajukan</strong><span>Admin Prashoes akan menghubungi kamu.</span></div>';
    } catch (error) {
      if (errorEl) errorEl.textContent = error.message || "Klaim garansi gagal.";
      submitBtn.disabled = false;
      submitBtn.textContent = "Kirim Klaim";
    }
  });

  dialog.showModal();
  textarea.focus();
}

function renderChatMessages() {
  const container = document.getElementById("chatMessages");
  if (!container) return;
  const messages = state.chatThread?.messages || [];
  if (!messages.length) {
    container.innerHTML = `<div class="chat-empty">Halo! Ada yang bisa kami bantu seputar layanan cuci sepatu?</div>`;
    return;
  }
  container.innerHTML = messages.map((message) => `
    <div class="chat-bubble ${message.sender_type === "admin" ? "admin" : "user"}">
      <span>${message.sender_type === "admin" ? "Admin Prashoes" : "Anda"}</span>
      <p>${escapeHtml(message.message)}</p>
      <small>${dt(message.created_at)}</small>
    </div>
  `).join("");
  container.scrollTop = container.scrollHeight;
}

function updateChatFabBadge(count = state.chatUnreadCount) {
  state.chatUnreadCount = Number(count || 0);
  const badge = document.getElementById("chatFabBadge");
  if (!badge) return;
  badge.textContent = state.chatUnreadCount > 99 ? "99+" : String(state.chatUnreadCount);
  badge.classList.toggle("hidden", state.chatUnreadCount < 1);
}

async function markPublicChatRead() {
  if (!state.chatSessionId) return;
  await fetchApi('/chat/read', {
    method: 'PATCH',
    body: JSON.stringify({ sessionId: state.chatSessionId }),
  });
  updateChatFabBadge(0);
}

async function loadChatHistory(markRead = false) {
  if (!state.chatSessionId) return;
  try {
    state.chatThread = await fetchChatThread(state.chatSessionId);
    state.chatUserMessageCount = (state.chatThread?.messages || []).filter((message) => message.sender_type === 'user').length;
    const unread = Number(state.chatThread?.unreadAdminCount || 0);
    updateChatFabBadge(state.chatOpen ? 0 : unread);
    renderChatMessages();
    if (markRead && unread > 0) await markPublicChatRead();
  } catch {
    renderChatMessages();
  }
}

async function handleChatSend(form) {
  const message = new FormData(form).get("message")?.trim();
  if (!message) return;
  const button = form.querySelector("button");
  const textarea = form.querySelector("textarea");
  if (button) button.disabled = true;
  try {
    state.chatThread = await sendChatMessage(state.chatSessionId, message);
    state.chatUserMessageCount += 1;
    if (state.chatUserMessageCount >= 2) showContextualPushPrompt();
    if (textarea) textarea.value = "";
    renderChatMessages();
  } catch (error) {
    alert(error.message || "Gagal mengirim pesan.");
  } finally {
    if (button) button.disabled = false;
  }
}

function toggleChatPanel(open) {
  state.chatOpen = open;
  document.getElementById("chatPanel")?.classList.toggle("hidden", !open);
  document.getElementById("chatFab")?.classList.toggle("hidden", open);
  clearInterval(state.chatPollTimer);
  state.chatPollTimer = null;
  if (open) {
    loadChatHistory(true);
    state.chatPollTimer = setInterval(() => loadChatHistory(true), 5000);
  }
}

async function renderChatWidget() {
  const root = document.getElementById("chat-widget-root");
  if (!root) return;
  state.chatSessionId = getOrCreateChatSessionId();
  const identity = getMemberInfoFromStorage();
  const templates = await fetchChatTemplates().catch(() => [
    'Harga cuci sepatu berapa?',
    'Berapa lama proses cuci sepatu?',
    'Bisa pickup ke rumah?',
    'Bahan suede bisa dibersihkan?',
  ]);
  const hasSubmittedIdentity = identity.fullName && localStorage.getItem('prashoes_identity_submitted') === 'true';
  root.innerHTML = `
    <div class="push-prompt hidden" id="publicPushPrompt">
      <button class="push-fab" id="publicPushFab" data-push-label="🔔 Dapatkan Notifikasi" aria-label="Dapatkan notifikasi Prashoes" type="button">🔔 Dapatkan Notifikasi</button>
      <button class="push-prompt-close" id="publicPushPromptClose" aria-label="Tutup pengingat notifikasi" type="button">×</button>
    </div>
    <button class="chat-fab" id="chatFab" aria-label="Buka chat Prashoes" type="button">
      <svg class="chat-fab-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 3.5a7.5 7.5 0 0 0-7.5 7.5v3.1c0 .86.7 1.56 1.56 1.56h1.2v-5.2h-1.1A5.86 5.86 0 0 1 12 5.1a5.86 5.86 0 0 1 5.84 5.36h-1.1v5.2h1.08a4.54 4.54 0 0 1-4.13 2.65h-1.2a1.1 1.1 0 0 0 0 2.2h1.2a6.75 6.75 0 0 0 6.6-5.32 1.56 1.56 0 0 0 1.21-1.52V11A7.5 7.5 0 0 0 12 3.5Z" />
        <path d="M12 7.4a3.2 3.2 0 0 0-3.2 3.2v.35a3.2 3.2 0 0 0 6.4 0v-.35A3.2 3.2 0 0 0 12 7.4Zm-5.2 11.1c.9-2.05 2.9-3.35 5.2-3.35 1.28 0 2.45.4 3.39 1.1a6.04 6.04 0 0 1-1.7.46h-1.2a2.7 2.7 0 0 0-2.55 1.79H6.8Z" />
      </svg>
      <span>Chat</span>
      <em class="chat-fab-badge hidden" id="chatFabBadge">0</em>
    </button>
    <div class="chat-panel hidden" id="chatPanel" role="dialog" aria-label="Chat Prashoes">
      <div class="chat-header">
        <div><strong>Chat Prashoes</strong><small>Tanya layanan, harga, atau bahan sepatu.</small></div>
        <button class="chat-close" id="chatClose" type="button" aria-label="Tutup chat">×</button>
      </div>
      <button class="public-push-btn hidden" id="publicPushBtn" type="button">Aktifkan Notifikasi</button>
      <div class="chat-identity" id="chatIdentity">
        ${hasSubmittedIdentity && identity.fullName
          ? `<span class="chat-name-badge">${escapeHtml(identity.fullName)}</span>`
          : `<input id="chatName" type="text" placeholder="Nama" value="${escapeHtml(identity.fullName)}">
             <input id="chatWhatsapp" type="tel" placeholder="WhatsApp (opsional)" value="${escapeHtml(identity.whatsappNumber)}">
             <span class="chat-member-badge ${identity.isMember ? 'member' : ''}" id="chatMemberBadge">${identity.isMember ? 'Member' : 'Non-member'}</span>`
        }
      </div>
      <div class="chat-templates" id="chatTemplates">
        ${templates.map((message) => `<button type="button" data-chat-template="${escapeHtml(message)}">${escapeHtml(message)}</button>`).join('')}
      </div>
      <div class="chat-messages" id="chatMessages"></div>
      <form class="chat-input-form" id="chatInputForm">
        <textarea name="message" rows="2" maxlength="1000" placeholder="Tulis pesan..." required></textarea>
        <button class="btn btn-primary" type="submit">Kirim</button>
      </form>
    </div>
  `;
  document.getElementById("chatFab")?.addEventListener("click", () => toggleChatPanel(true));
  document.getElementById("chatClose")?.addEventListener("click", () => toggleChatPanel(false));
  document.getElementById("publicPushBtn")?.addEventListener("click", togglePublicPush);
  document.getElementById("publicPushFab")?.addEventListener("click", togglePublicPush);
  document.getElementById("publicPushPromptClose")?.addEventListener("click", dismissPublicPushPrompt);
  document.getElementById("chatWhatsapp")?.addEventListener("blur", detectChatIdentity);
  document.getElementById("chatTemplates")?.addEventListener("click", async (event) => {
    const button = event.target.closest('[data-chat-template]');
    if (!button) return;
    const ok = await validateIdentityBeforeSend();
    if (!ok) return;
    state.chatThread = await sendChatMessage(state.chatSessionId, button.dataset.chatTemplate);
    state.chatUserMessageCount += 1;
    if (state.chatUserMessageCount >= 2) showContextualPushPrompt();
    renderChatMessages();
  });
  document.getElementById("chatInputForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const ok = await validateIdentityBeforeSend();
    if (!ok) return;
    await handleChatSend(event.target);
  });
  if (identity.whatsappNumber) detectChatIdentity();
  loadChatHistory();
  refreshPublicPushButton();
  updateChatFabBadge(0);
  clearInterval(state.chatBadgeTimer);
  state.chatBadgeTimer = setInterval(() => {
    if (!state.chatOpen) loadChatHistory();
  }, 15000);
  if (location.hash === '#chat') toggleChatPanel(true);
}

function bindHeaderLogoVisibility() {
  const header = document.querySelector(".header");
  const footerLogo = document.querySelector(".footer-logo");
  if (!header || !footerLogo || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(([entry]) => {
    header.classList.toggle("footer-logo-visible", entry.isIntersecting);
  }, { threshold: 0.35 });

  observer.observe(footerLogo);
}

function bindPublicBottomNav() {
  const navItems = Array.from(document.querySelectorAll(".public-bottom-nav-item[data-public-nav]"));
  if (!navItems.length) return;

  function setActive(key) {
    navItems.forEach((item) => item.classList.toggle("active", item.dataset.publicNav === key));
  }

  function scrollToTarget(hash, behavior = "smooth") {
    const target = hash === "#top" ? document.body : document.getElementById(hash.slice(1));
    if (!target) return false;
    const headerHeight = document.querySelector(".header")?.offsetHeight || 0;
    const top = target === document.body ? 0 : target.getBoundingClientRect().top + window.scrollY - headerHeight - 8;
    window.scrollTo({ top: Math.max(0, top), behavior });
    return true;
  }

  navItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      const key = item.dataset.publicNav;
      if (key && key !== "profile") setActive(key);
      const hash = item.getAttribute("href") || "";
      if (!hash.startsWith("#")) return;
      event.preventDefault();
      scrollToTarget(hash);
    });
  });

  const sections = [
    ["lacak", document.getElementById("lacak")],
    ["harga", document.getElementById("harga")],
    ["antar-jemput", document.getElementById("antar-jemput")],
  ].filter(([, section]) => section);

  window.addEventListener("scroll", () => {
    if (window.scrollY < 180) {
      setActive("home");
      return;
    }
    let current = null;
    sections.forEach((entry) => {
      if (entry[1].getBoundingClientRect().top < window.innerHeight * 0.45) current = entry;
    });
    if (current) setActive(current[0]);
  }, { passive: true });

  if (window.location.hash && window.location.hash !== "#top") {
    setTimeout(() => scrollToTarget(window.location.hash, "auto"), 60);
  }
}

function bindMobileMenu() {
  const button = document.querySelector(".mobile-menu-btn");
  const menu = document.getElementById("mobile-menu");
  const menuIcon = document.querySelector(".menu-icon");
  const closeIcon = document.querySelector(".close-icon");
  if (!button || !menu) return;

  function setOpen(open) {
    menu.classList.toggle("hidden", !open);
    menuIcon?.classList.toggle("hidden", open);
    closeIcon?.classList.toggle("hidden", !open);
    button.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
  }

  button.addEventListener("click", () => {
    setOpen(menu.classList.contains("hidden"));
  });

  document.addEventListener("click", (event) => {
    const isOpen = !menu.classList.contains("hidden");
    const target = event.target;
    if (!isOpen || button.contains(target) || menu.contains(target)) return;
    setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) setOpen(false);
  });
}

async function init() {
  document.getElementById("current-year").textContent = new Date().getFullYear();
  try {
    const [services, promos, memberBenefits] = await Promise.all([
      fetchApi("/services"),
      fetchApi("/promos"),
      fetchApi("/member-benefits"),
    ]);
    const localServicesBySlug = new Map((window.PRASHOES_DATA?.services || []).map((service) => [service.slug, service]));
    data.services = normalizeRows(services, data.services).map((item) => {
      const localService = localServicesBySlug.get(item.slug) || {};
      return {
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        startingPrice: item.starting_price || item.startingPrice,
        image: item.image || item.image_url || localService.image,
      };
    });
    data.serviceOptions = data.services.map((service) => service.name);
    data.promos = normalizeRows(promos, data.promos).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      discountLabel: item.discount_label || item.discountLabel,
    }));
    data.memberBenefits = normalizeRows(memberBenefits, data.memberBenefits).map((item) => item.benefit || item);
  } catch (error) {
    console.warn("Memakai fallback data lokal:", error.message);
  }
  renderServices();
  renderPromos();
  renderPickupForm();
  renderChatWidget();
  bindTracking();
  bindMobileMenu();
  bindPublicBottomNav();
  bindHeaderLogoVisibility();
}

document.addEventListener("DOMContentLoaded", init);
