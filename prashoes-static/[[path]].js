const SUPABASE_URL = 'https://xundkncjdiywagsqdjdr.supabase.co';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function cors(response) {
  response.headers.set('access-control-allow-origin', '*');
  response.headers.set('access-control-allow-methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  response.headers.set('access-control-allow-headers', 'content-type,authorization');
  return response;
}

function tokenFor(password, secret) {
  return btoa(`${password}:${secret}`).replace(/=+$/g, '');
}

function isAuthed(request, env) {
  const header = request.headers.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '');
  const password = env.ADMIN_PASSWORD;
  const secret = env.ADMIN_SECRET || env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(password && secret && token && token === tokenFor(password, secret));
}

async function sb(env, path, options = {}) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY belum diset di Cloudflare Pages secret.');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) throw new Error(typeof body === 'string' ? body : body?.message || 'Supabase request gagal.');
  return body;
}

function num(v) { return Number(v || 0); }
function makeOrderCode() {
  const d = new Date();
  const y = String(d.getFullYear()).slice(2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${y}${m}${day}-${rand}`;
}

async function dashboard(env) {
  const [services, members, orders, cashflow, pickups, promos] = await Promise.all([
    sb(env, 'services?select=id,name,slug,starting_price&order=created_at.asc'),
    sb(env, 'members?select=*&order=created_at.desc'),
    sb(env, 'orders?select=*,order_items(*,services(name),order_item_photos(*))&order=created_at.desc'),
    sb(env, 'cashflow_transactions?select=*&order=transaction_date.desc'),
    sb(env, 'pickup_requests?select=*&order=created_at.desc'),
    sb(env, 'promos?select=id&is_active=eq.true'),
  ]);
  const totalRevenue = orders.reduce((s, o) => s + num(o.revenue_amount), 0);
  const totalCost = orders.reduce((s, o) => s + num(o.production_cost) + num(o.raw_material_cost) + num(o.other_cost), 0);
  const cashIn = cashflow.filter(c => c.transaction_type === 'pemasukkan').reduce((s, c) => s + num(c.amount), 0);
  const cashOut = cashflow.filter(c => c.transaction_type === 'pengeluaran').reduce((s, c) => s + num(c.amount), 0);
  return { services, members, orders, cashflow, pickups, promos, stats: { pickupRequests: pickups.length, orders: orders.length, members: members.length, activePromos: promos.length, services: services.length, totalRevenue, totalCost, totalProfit: totalRevenue - totalCost, cashIn, cashOut } };
}

async function createOrder(env, input) {
  if (!input.customerName || !input.whatsappNumber) throw new Error('Nama dan WhatsApp wajib diisi.');
  const items = Array.isArray(input.items) ? input.items.filter(i => i.shoeDescription && i.serviceId) : [];
  if (!items.length) throw new Error('Minimal satu item sepatu wajib diisi.');
  const order = (await sb(env, 'orders', { method: 'POST', body: JSON.stringify({ order_code: makeOrderCode(), customer_name: input.customerName, whatsapp_number: input.whatsappNumber, status: input.status || 'Pesanan dibuat', payment_method: input.paymentMethod || '', revenue_amount: num(input.revenueAmount), production_cost: num(input.productionCost), raw_material_cost: num(input.rawMaterialCost), other_cost: num(input.otherCost), finance_notes: input.financeNotes || '' }) }))[0];
  const rows = items.map((item, index) => ({ order_id: order.id, item_number: index + 1, shoe_description: item.shoeDescription, service_id: item.serviceId, item_status: input.status || 'Pesanan dibuat', notes: item.notes || '' }));
  await sb(env, 'order_items', { method: 'POST', body: JSON.stringify(rows) });
  if (num(input.revenueAmount) > 0) {
    await sb(env, 'cashflow_transactions', { method: 'POST', body: JSON.stringify({ transaction_type: 'pemasukkan', description: `Order ${order.order_code} - ${input.customerName}`, amount: num(input.revenueAmount), quantity: items.length, order_id: order.id }) });
  }
  return order;
}

async function updateOrder(env, input) {
  if (!input.id) throw new Error('Order ID wajib ada.');
  const body = {};
  if (input.status) body.status = input.status;
  if (input.paymentMethod !== undefined) body.payment_method = input.paymentMethod;
  if (input.revenueAmount !== undefined) body.revenue_amount = num(input.revenueAmount);
  await sb(env, `orders?id=eq.${encodeURIComponent(input.id)}`, { method: 'PATCH', body: JSON.stringify(body) });
  if (input.status) await sb(env, `order_items?order_id=eq.${encodeURIComponent(input.id)}`, { method: 'PATCH', body: JSON.stringify({ item_status: input.status }) });
  return { ok: true };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));
  try {
    const url = new URL(request.url);
    const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
    const route = parts[0] || 'dashboard';

    if (route === 'login' && request.method === 'POST') {
      const body = await request.json();
      const password = env.ADMIN_PASSWORD;
      const secret = env.ADMIN_SECRET || env.SUPABASE_SERVICE_ROLE_KEY;
      if (!password || !secret) return cors(json({ error: 'Admin secret belum dikonfigurasi.' }, 500));
      if (body.password !== password) return cors(json({ error: 'Password admin salah.' }, 401));
      return cors(json({ token: tokenFor(password, secret) }));
    }

    if (!isAuthed(request, env)) return cors(json({ error: 'Unauthorized.' }, 401));

    if (route === 'dashboard' && request.method === 'GET') return cors(json(await dashboard(env)));

    if (route === 'export' && request.method === 'GET') {
      const tables = ['services', 'promos', 'member_benefits', 'gallery', 'members', 'pickup_requests', 'orders', 'order_items', 'order_item_photos', 'cashflow_transactions'];
      const rows = await Promise.all(tables.map((table) => sb(env, `${table}?select=*`)));
      return cors(json(Object.fromEntries(tables.map((table, index) => [table, rows[index]]))));
    }

    if (route === 'orders') {
      if (request.method === 'POST') return cors(json(await createOrder(env, await request.json()), 201));
      if (request.method === 'PATCH') return cors(json(await updateOrder(env, await request.json())));
      if (request.method === 'DELETE') {
        const id = url.searchParams.get('id');
        if (!id) throw new Error('Order ID wajib ada.');
        await sb(env, `orders?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
        return cors(json({ ok: true }));
      }
    }

    if (route === 'members' && request.method === 'POST') {
      const body = await request.json();
      const row = (await sb(env, 'members', { method: 'POST', body: JSON.stringify({ full_name: body.fullName, whatsapp_number: body.whatsappNumber, email: body.email || '', pickup_address: body.pickupAddress || '' }) }))[0];
      return cors(json(row, 201));
    }

    if (route === 'cashflow' && request.method === 'POST') {
      const body = await request.json();
      const row = (await sb(env, 'cashflow_transactions', { method: 'POST', body: JSON.stringify({ transaction_type: body.transactionType, description: body.description, amount: num(body.amount), quantity: Math.max(1, num(body.quantity) || 1) }) }))[0];
      return cors(json(row, 201));
    }

    return cors(json({ error: 'Route tidak ditemukan.' }, 404));
  } catch (error) {
    return cors(json({ error: error.message || 'Server error.' }, 500));
  }
}
