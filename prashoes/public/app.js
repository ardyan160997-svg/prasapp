const data = window.PRASHOES_DATA || {};

const ADMIN_BASE = "https://adminprashoes.prasapp.com";
const API_BASE = `${ADMIN_BASE}/api/public`;

const state = {
  pickupLatitude: null,
  pickupLongitude: null,
  pickupShareUrl: '',
  locationMessage: '',
  chatSessionId: null,
  chatOpen: false,
  chatThread: null,
  chatPollTimer: null,
};

async function fetchApi(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(json?.error || "Request API Prashoes gagal.");
  return json;
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

function dt(iso) {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
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
    memberCode: localStorage.getItem("prashoes_member_code") || "",
    whatsappNumber: localStorage.getItem("prashoes_member_whatsapp") || "",
    email: localStorage.getItem("prashoes_member_email") || "",
    isMember: localStorage.getItem("prashoes_is_member") === "true",
  };
}

function getChatIdentity() {
  const stored = getMemberInfoFromStorage();
  return {
    fullName: document.getElementById("chatName")?.value?.trim() || stored.fullName,
    whatsappNumber: document.getElementById("chatWhatsapp")?.value?.trim() || stored.whatsappNumber,
    memberCode: document.getElementById("chatMemberCode")?.value?.trim() || stored.memberCode,
    email: stored.email,
    isMember: document.getElementById("chatIsMember")?.checked || stored.isMember,
  };
}

function setMemberInfoFromPayload(payload, result = {}) {
  localStorage.setItem("prashoes_is_member", String(Boolean(payload.isMember)));
  if (payload.fullName) localStorage.setItem("prashoes_member_name", payload.fullName);
  if (payload.whatsappNumber) localStorage.setItem("prashoes_member_whatsapp", payload.whatsappNumber);
  if (payload.email) localStorage.setItem("prashoes_member_email", payload.email);
  if (payload.memberCode || result.memberCode) localStorage.setItem("prashoes_member_code", payload.memberCode || result.memberCode);
}

async function fetchChatThread(sessionId) {
  return fetchApi(`/chat?sessionId=${encodeURIComponent(sessionId)}`);
}

async function sendChatMessage(sessionId, message) {
  const identity = getChatIdentity();
  setMemberInfoFromPayload(identity);
  return fetchApi("/chat", {
    method: "POST",
    body: JSON.stringify({ sessionId, message, ...identity }),
  });
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

function renderServices() {
  const container = document.getElementById("services-grid");
  if (!container) return;

  const services = data.services || [];
  if (!services.length) {
    container.innerHTML = `<div class="notice-card">Belum ada data layanan.</div>`;
    return;
  }

  container.innerHTML = services.map((service) => `
    <article class="service-card" role="listitem">
      <h3>${escapeHtml(service.name)}</h3>
      <p class="service-price">${escapeHtml(service.startingPrice)}</p>
      <p class="service-desc">${escapeHtml(service.description)}</p>
    </article>
  `).join("");
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

  wrapper.className = "pickup-card";
  wrapper.innerHTML = `
    <h2 id="pickup-title">Antar Jemput</h2>
    <p>Isi form di bawah ini untuk menjadwalkan penjemputan sepatu kamu.</p>

    <form id="pickup-form" class="pickup-form">
      <div class="form-group">
        <label class="form-label">Status Customer</label>
        <div class="radio-grid">
          <label class="radio-card">
            <input type="radio" name="isMember" value="false" checked>
            <span>Non-member</span>
          </label>
          <label class="radio-card">
            <input type="radio" name="isMember" value="true">
            <span>Member</span>
          </label>
        </div>
      </div>

      <div class="form-group">
        <label for="fullName" class="form-label">Nama Lengkap</label>
        <input id="fullName" name="fullName" type="text" required placeholder="Masukkan nama lengkap" class="form-input">
      </div>

      <div class="form-group">
        <label for="whatsappNumber" class="form-label">Nomor WhatsApp</label>
        <input id="whatsappNumber" name="whatsappNumber" type="tel" required placeholder="08xxxxxxxxxx" class="form-input">
      </div>

      <div class="form-group">
        <label for="email" class="form-label">Email (Opsional)</label>
        <input id="email" name="email" type="email" placeholder="nama@email.com" class="form-input">
      </div>

      <div id="member-code-group" class="form-group hidden">
        <label for="memberCode" class="form-label">Kode Member</label>
        <input id="memberCode" name="memberCode" type="text" class="form-input">
      </div>

      <div class="form-group">
        <label for="pickupAddress" class="form-label">Alamat Penjemputan</label>
        <div class="location-row">
          <button type="button" id="location-btn" class="btn-location">Pakai Lokasi Saya</button>
        </div>
        <textarea id="pickupAddress" name="pickupAddress" required placeholder="Alamat lengkap penjemputan" rows="4" class="form-textarea"></textarea>
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
  const memberGroup = document.getElementById("member-code-group");

  if (!form) return;

  form.addEventListener("input", updatePricingSummary);
  form.addEventListener("change", () => {
    const payload = getPickupPayload();
    if (memberGroup) memberGroup.classList.toggle("hidden", !payload?.isMember);
    updatePricingSummary();
  });

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
    if (input) input.placeholder = placeholders[type.value] || placeholders.name;
  });

  async function track() {
    const searchType = type?.value || "name";
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
            ${items.length ? `<div class="tracking-items-result">${items.map((item, index) => {
              const parts = String(item.shoeDescription || "").split(" • ").filter(Boolean);
              const photos = Array.isArray(item.photos) ? item.photos : [];
              const stageLabel = { received: "Sepatu diterima", drying: "Setelah cuci / pengeringan", ready: "Siap diambil" };
              return `<div class="tracking-item-result"><span class="tracking-item-number">${index + 1}</span><div><strong>${escapeHtml(parts.join(" • ") || "Sepatu")}</strong><p>Status item: ${escapeHtml(item.itemStatus || "-")}${item.notes ? ` • ${escapeHtml(item.notes)}` : ""}</p>${photos.length ? `<div class="tracking-photo-grid">${photos.map((photo) => `<figure class="tracking-photo-card"><img src="${escapeHtml(photoUrl(photo.imageUrl))}" alt="${escapeHtml(stageLabel[photo.photoType] || photo.caption || "Progress sepatu")}" loading="lazy"><figcaption>${escapeHtml(stageLabel[photo.photoType] || photo.caption || "Progress sepatu")}</figcaption></figure>`).join("")}</div>` : ""}</div></div>`;
            }).join("")}</div>` : ""}
          </article>
        `;
      }).join("");
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

  button?.addEventListener("click", track);
  input?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") track();
  });
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

async function loadChatHistory() {
  if (!state.chatSessionId) return;
  try {
    state.chatThread = await fetchChatThread(state.chatSessionId);
    renderChatMessages();
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
    loadChatHistory();
    state.chatPollTimer = setInterval(loadChatHistory, 10000);
  }
}

function renderChatWidget() {
  const root = document.getElementById("chat-widget-root");
  if (!root) return;
  state.chatSessionId = getOrCreateChatSessionId();
  const identity = getMemberInfoFromStorage();
  root.innerHTML = `
    <button class="chat-fab" id="chatFab" aria-label="Buka chat Prashoes" type="button">Chat</button>
    <div class="chat-panel hidden" id="chatPanel" role="dialog" aria-label="Chat Prashoes">
      <div class="chat-header">
        <div><strong>Chat Prashoes</strong><small>Tanya layanan, harga, atau bahan sepatu.</small></div>
        <button class="chat-close" id="chatClose" type="button" aria-label="Tutup chat">×</button>
      </div>
      <div class="chat-identity">
        <input id="chatName" type="text" placeholder="Nama" value="${escapeHtml(identity.fullName)}">
        <input id="chatWhatsapp" type="tel" placeholder="WhatsApp" value="${escapeHtml(identity.whatsappNumber)}">
        <label><input id="chatIsMember" type="checkbox" ${identity.isMember ? "checked" : ""}> Member</label>
        <input id="chatMemberCode" type="text" placeholder="Kode member (opsional)" value="${escapeHtml(identity.memberCode)}">
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
  document.getElementById("chatInputForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleChatSend(event.target);
  });
  loadChatHistory();
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
    data.services = normalizeRows(services, data.services).map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      startingPrice: item.starting_price || item.startingPrice,
    }));
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
}

document.addEventListener("DOMContentLoaded", init);
