const API = '';
const key = 'praseats_admin_token';
let token = localStorage.getItem(key) || '';
let activeChat = '';
let state = { brands: [], menus: [], orders: [], chats: [], statuses: [], paymentStatuses: [] };

const $ = (selector) => document.querySelector(selector);
const rupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
const esc = (value) => String(value ?? '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));

async function api(path, options = {}) {
  const response = await fetch(API + path, {
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) throw new Error(data.error || 'Request gagal');
  return data;
}

function toast(message) {
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  document.body.append(node);
  setTimeout(() => node.remove(), 2500);
}

function render() {
  $('#stats').innerHTML = [
    ['Brand', state.brands.length],
    ['Menu aktif', state.menus.filter((menu) => menu.is_available).length],
    ['Order', state.orders.length],
    ['Chat', state.chats.length],
  ].map(([label, value]) => `<div class="stat"><small>${label}</small><b>${value}</b></div>`).join('');

  $('#brand-list').innerHTML = state.brands.map((brand) => `
    <div class="row">
      <div><b>${esc(brand.name)}</b><small>${esc(brand.description || '-')}</small></div>
      <button class="ghost" data-brand-toggle="${brand.id}" data-active="${brand.is_active ? '0' : '1'}">${brand.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button>
    </div>
  `).join('') || '<p>Belum ada brand.</p>';

  $('#menu-form select').innerHTML = '<option value="">Pilih brand</option>' + state.brands.map((brand) => `<option value="${brand.id}">${esc(brand.name)}</option>`).join('');
  $('#menu-list').innerHTML = state.menus.map((menu) => `
    <div class="row">
      <div><b>${esc(menu.name)}</b><small>${esc(menu.brand_name)} · ${esc(menu.category || 'Menu')}</small></div>
      <div class="actions"><b>${rupiah(menu.price)}</b><button class="ghost" data-menu-toggle="${menu.id}" data-available="${menu.is_available ? '0' : '1'}">${menu.is_available ? 'Habis' : 'Tersedia'}</button></div>
    </div>
  `).join('') || '<p>Belum ada menu.</p>';

  $('#order-list').innerHTML = state.orders.map((order) => `
    <article class="order-card">
      <div class="order-main">
        <div><b>${esc(order.order_code)} · ${esc(order.customer_name)}</b><small>${esc(order.fulfillment_type)} · ${esc(order.payment_method)} · ${esc(order.whatsapp_number)}</small></div>
        <strong>${rupiah(order.total)}</strong>
      </div>
      <div class="order-items">${(order.items || []).map((item) => `<span>${esc(item.qty)}× ${esc(item.menu_name)} <b>${rupiah(item.price)}</b></span>`).join('') || '<span>Item belum tersedia.</span>'}</div>
      <form class="order-edit" data-id="${order.id}">
        <label>Status<select name="status">${state.statuses.map((status) => `<option ${status === order.status ? 'selected' : ''}>${status}</option>`).join('')}</select></label>
        <label>Pembayaran<select name="paymentStatus">${state.paymentStatuses.map((status) => `<option value="${status}" ${status === (order.payment_status || 'pending') ? 'selected' : ''}>${status === 'paid' ? 'Lunas' : 'Pending'}</option>`).join('')}</select></label>
        <button>Simpan</button>
      </form>
    </article>
  `).join('') || '<p>Belum ada order.</p>';

  $('#chat-list').innerHTML = state.chats.map((chat) => `
    <button class="chat-row ${chat.session_id === activeChat ? 'active' : ''}" data-chat="${esc(chat.session_id)}"><b>${esc(chat.session_id)}</b><small>${chat.total || 1} pesan</small></button>
  `).join('') || '<p>Belum ada chat.</p>';
}

async function load() {
  const response = await api('/api/admin/dashboard');
  state = response.data;
  render();
}

async function openChat(sessionId) {
  activeChat = sessionId;
  render();
  const response = await api(`/api/admin/chat?sessionId=${encodeURIComponent(sessionId)}`);
  $('#chat-messages').innerHTML = response.messages.map((message) => `
    <p class="bubble ${message.from_admin ? 'admin' : ''}"><span>${message.from_admin ? 'Admin' : 'Pelanggan'}</span>${esc(message.message)}</p>
  `).join('') || '<p>Belum ada pesan.</p>';
  $('#chat-form').classList.remove('hidden');
}

$('#login-form').onsubmit = async (event) => {
  event.preventDefault();
  try {
    const response = await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: $('#password').value }) });
    token = response.token;
    localStorage.setItem(key, token);
    $('#login').classList.add('hidden');
    $('#app').classList.remove('hidden');
    await load();
  } catch (error) {
    $('#login-feedback').textContent = error.message;
  }
};

$('#refresh').onclick = () => load().then(() => toast('Data diperbarui'));

$('#brand-form').onsubmit = async (event) => {
  event.preventDefault();
  await api('/api/admin/brands', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
  event.target.reset(); await load(); toast('Brand tersimpan');
};

$('#menu-form').onsubmit = async (event) => {
  event.preventDefault();
  await api('/api/admin/menus', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
  event.target.reset(); await load(); toast('Menu tersimpan');
};

document.addEventListener('click', async (event) => {
  const brand = event.target.closest('[data-brand-toggle]');
  const menu = event.target.closest('[data-menu-toggle]');
  const chat = event.target.closest('[data-chat]');
  if (brand) {
    await api('/api/admin/brands', { method: 'PATCH', body: JSON.stringify({ id: brand.dataset.brandToggle, isActive: brand.dataset.active === '1' }) });
    await load(); toast('Status brand diperbarui');
  }
  if (menu) {
    await api('/api/admin/menus', { method: 'PATCH', body: JSON.stringify({ id: menu.dataset.menuToggle, isAvailable: menu.dataset.available === '1' }) });
    await load(); toast('Status menu diperbarui');
  }
  if (chat) await openChat(chat.dataset.chat);
});

document.addEventListener('submit', async (event) => {
  const orderForm = event.target.closest('.order-edit');
  if (!orderForm) return;
  event.preventDefault();
  const body = Object.fromEntries(new FormData(orderForm));
  body.id = orderForm.dataset.id;
  await api('/api/admin/orders', { method: 'PATCH', body: JSON.stringify(body) });
  await load(); toast('Order diperbarui');
});

$('#chat-form').onsubmit = async (event) => {
  event.preventDefault();
  if (!activeChat) return;
  const message = new FormData(event.target).get('message');
  await api('/api/admin/chat', { method: 'POST', body: JSON.stringify({ sessionId: activeChat, message }) });
  event.target.reset(); await openChat(activeChat); await load(); toast('Balasan terkirim');
};

if (token) {
  $('#login').classList.add('hidden');
  $('#app').classList.remove('hidden');
  load().catch(() => {
    localStorage.removeItem(key);
    token = '';
    $('#login').classList.remove('hidden');
    $('#app').classList.add('hidden');
  });
}
