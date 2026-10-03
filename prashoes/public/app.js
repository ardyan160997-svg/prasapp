const data = window.PRASHOES_DATA || {};

const API_BASE = "https://adminprashoes.prasapp.com/api/public";

const state = {
  pickupLatitude: null,
  pickupLongitude: null,
  pickupShareUrl: "",
  locationMessage: "",
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

function renderGallery() {
  const container = document.getElementById("gallery-grid");
  if (!container) return;

  const items = data.galleryItems || [];
  if (!items.length) {
    container.innerHTML = `<div class="notice-card">Belum ada data gallery before/after.</div>`;
    return;
  }

  container.innerHTML = items.map((item) => `
    <article class="gallery-card" role="listitem">
      <div class="gallery-images">
        <div class="gallery-panel">
          <img src="${escapeHtml(item.beforeUrl)}" alt="Before ${escapeHtml(item.label)}" loading="lazy">
          <p class="gallery-label">BEFORE</p>
        </div>
        <div class="gallery-panel after">
          <img src="${escapeHtml(item.afterUrl)}" alt="After ${escapeHtml(item.label)}" loading="lazy">
          <p class="gallery-label">AFTER</p>
        </div>
      </div>
      <div class="gallery-caption">${escapeHtml(item.label)}</div>
    </article>
  `).join("");
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
  const input = document.getElementById("order-id");
  const button = document.getElementById("track-btn");
  const error = document.getElementById("tracking-error");
  const result = document.getElementById("tracking-result");

  async function track() {
    const value = input?.value?.trim();
    if (!value) {
      if (error) {
        error.textContent = "Masukkan ID pesanan terlebih dahulu.";
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
      const tracking = await fetchApi(`/tracking?orderCode=${encodeURIComponent(value)}`);
      if (!tracking) throw new Error("Pesanan tidak ditemukan.");
      const items = tracking.items || [];
      result.innerHTML = `
        <div class="tracking-card">
          <h3>Order: ${escapeHtml(tracking.orderCode || value)}</h3>
          <p>Status: <strong>${escapeHtml(tracking.status || "-")}</strong></p>
          <p>Customer: ${escapeHtml(tracking.customerName || "-")}</p>
          ${items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item.shoeDescription || "Sepatu")} — ${escapeHtml(item.itemStatus || "-")}</li>`).join("")}</ul>` : ""}
        </div>
      `;
    } catch (err) {
      result.innerHTML = `
        <div class="notice-card">
          <strong>Pesanan belum ditemukan.</strong><br>
          Pastikan kode pesanan benar atau hubungi admin Prashoes via WhatsApp.
          <div style="margin-top:1rem">
            <a class="btn btn-primary" href="${escapeHtml(data.contact?.whatsapp || "https://wa.me/6285601679005")}?text=${encodeURIComponent(`Halo Prashoes, saya mau cek status pesanan ${value}`)}" target="_blank" rel="noopener noreferrer">Cek via WhatsApp</a>
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
    const [services, promos, memberBenefits, galleryItems] = await Promise.all([
      fetchApi("/services"),
      fetchApi("/promos"),
      fetchApi("/member-benefits"),
      fetchApi("/gallery"),
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
    data.galleryItems = normalizeRows(galleryItems, data.galleryItems).map((item) => ({
      id: item.id,
      beforeUrl: item.before_url || item.beforeUrl,
      afterUrl: item.after_url || item.afterUrl,
      label: item.label,
    }));
  } catch (error) {
    console.warn("Memakai fallback data lokal:", error.message);
  }
  renderServices();
  renderPromos();
  renderPickupForm();
  renderGallery();
  bindTracking();
  bindMobileMenu();
}

document.addEventListener("DOMContentLoaded", init);
