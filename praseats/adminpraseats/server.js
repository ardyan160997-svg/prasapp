const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');
const webpush = require('web-push');
const {
  normalizePhone,
  makeOrderCode,
  calculateCart,
  requireFields,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  FULFILLMENT_TYPES,
} = require('./domain');

const PORT = Number(process.env.PORT || 3020);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'praseats-admin';
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
const tokens = new Set();
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const PAYMENT_STATUSES = ['pending', 'paid'];
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) webpush.setVapidDetails('mailto:admin@prasapp.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
const fallback = {
  brands: [
    { id: 1, name: 'Sayur', description: 'Menu sayuran harian', is_active: true },
    { id: 2, name: 'Lauk', description: 'Lauk pendamping nasi', is_active: true },
    { id: 3, name: 'Gorengan', description: 'Aneka gorengan hangat', is_active: true },
    { id: 4, name: 'Makanan', description: 'Menu makanan utama', is_active: true },
    { id: 5, name: 'Minuman', description: 'Minuman segar', is_active: true },
  ],  menus: [
    { id: 1, brand_id: 1, brand_name: 'Sayur', name: 'Chicken Teriyaki Bowl', description: 'Nasi, ayam teriyaki, sayur', price: 22000, category: 'Rice Bowl', is_available: true },
    { id: 2, brand_id: 2, brand_name: 'Lauk', name: 'Ayam Geprek Sambal Bawang', description: 'Nasi, ayam crispy, sambal bawang', price: 18000, category: 'Ayam', is_available: true },
    { id: 3, brand_id: 5, brand_name: 'Minuman', name: 'Es Teh Lemon', description: 'Teh lemon dingin', price: 8000, category: 'Minuman', is_available: true },
  ],
  orders: [],
  chats: [],
  members: [],
  memberCarts: new Map(),
  memberAddresses: [],
  pushSubscriptions: [],
  dailyMenuIds: [1, 2, 3],
};

function saveMenuImage(body) {
  if (!body.imageData) return body.imageUrl || '';
  const match = String(body.imageData).match(/^data:(image\/(?:png|jpe?g|webp|avif));base64,(.+)$/);
  if (!match) throw new Error('Format gambar tidak valid');
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 3 * 1024 * 1024) throw new Error('Ukuran gambar maksimal 3MB');
  const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp', 'image/avif': 'avif' }[match[1]];
  const name = `menu-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buffer);
  return `/uploads/${name}`;
}

function json(res, status, data) {
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type,authorization',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 5 * 1024 * 1024) throw Object.assign(new Error('Payload terlalu besar'), { status: 413 });
  }
  return raw ? JSON.parse(raw) : {};
}

function needAuth(req) {
  const value = (req.headers.authorization || '').replace('Bearer ', '');
  if (!tokens.has(value)) throw Object.assign(new Error('Unauthorized'), { status: 401 });
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function passwordMatches(password, stored) {
  const [salt, expected] = String(stored || '').split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(String(password), salt, 64);
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
}

function memberToken(member) {
  const payload = Buffer.from(JSON.stringify({ id: member.id, phone: member.whatsapp_number })).toString('base64url');
  const signature = crypto.createHmac('sha256', ADMIN_PASSWORD).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function memberFromRequest(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const [payload, signature] = token.split('.');
  if (!payload || !signature) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  const expected = crypto.createHmac('sha256', ADMIN_PASSWORD).update(payload).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  return JSON.parse(Buffer.from(payload, 'base64url').toString());
}

function validateProfilePhoto(value) {
  if (!value) return '';
  if (!/^data:image\/(?:jpeg|png|webp);base64,/.test(value) || value.length > 450000) throw new Error('Foto profil tidak valid atau terlalu besar');
  return value;
}

async function query(sql, params = []) {
  if (!pool) return null;
  return pool.query(sql, params);
}

async function setup() {
  if (!pool) return;
  await query(`
    CREATE TABLE IF NOT EXISTS brands(id SERIAL PRIMARY KEY,name TEXT NOT NULL,description TEXT DEFAULT '',is_active BOOLEAN DEFAULT true,created_at TIMESTAMPTZ DEFAULT now());
    CREATE TABLE IF NOT EXISTS menus(id SERIAL PRIMARY KEY,brand_id INTEGER REFERENCES brands(id),name TEXT NOT NULL,description TEXT DEFAULT '',category TEXT DEFAULT '',price INTEGER DEFAULT 0,image_url TEXT DEFAULT '',is_available BOOLEAN DEFAULT true,created_at TIMESTAMPTZ DEFAULT now());
    CREATE TABLE IF NOT EXISTS orders(id SERIAL PRIMARY KEY,order_code TEXT UNIQUE NOT NULL,customer_name TEXT NOT NULL,whatsapp_number TEXT NOT NULL,fulfillment_type TEXT NOT NULL,payment_method TEXT NOT NULL,address TEXT DEFAULT '',notes TEXT DEFAULT '',status TEXT DEFAULT 'baru',payment_status TEXT DEFAULT 'pending',subtotal INTEGER DEFAULT 0,delivery_fee INTEGER DEFAULT 0,total INTEGER DEFAULT 0,created_at TIMESTAMPTZ DEFAULT now());
    ALTER TABLE menus ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
    CREATE TABLE IF NOT EXISTS order_items(id SERIAL PRIMARY KEY,order_id INTEGER REFERENCES orders(id),menu_id INTEGER,menu_name TEXT NOT NULL,brand_name TEXT DEFAULT '',qty INTEGER DEFAULT 1,price INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS chats(id SERIAL PRIMARY KEY,session_id TEXT NOT NULL,message TEXT NOT NULL,from_admin BOOLEAN DEFAULT false,created_at TIMESTAMPTZ DEFAULT now());
    CREATE TABLE IF NOT EXISTS daily_menus(id SERIAL PRIMARY KEY,menu_id INTEGER UNIQUE REFERENCES menus(id) ON DELETE CASCADE,is_available BOOLEAN DEFAULT true,display_order INTEGER DEFAULT 0,created_at TIMESTAMPTZ DEFAULT now());
    CREATE TABLE IF NOT EXISTS members(id SERIAL PRIMARY KEY,name TEXT NOT NULL,whatsapp_number TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,profile_photo TEXT DEFAULT '',home_address TEXT DEFAULT '',home_detail TEXT DEFAULT '',created_at TIMESTAMPTZ DEFAULT now());
    ALTER TABLE members ADD COLUMN IF NOT EXISTS profile_photo TEXT DEFAULT '';
    ALTER TABLE members ADD COLUMN IF NOT EXISTS home_address TEXT DEFAULT '';
    ALTER TABLE members ADD COLUMN IF NOT EXISTS home_detail TEXT DEFAULT '';
    CREATE TABLE IF NOT EXISTS member_carts(member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,qty INTEGER NOT NULL DEFAULT 1,updated_at TIMESTAMPTZ DEFAULT now(),PRIMARY KEY(member_id,menu_id));
    CREATE TABLE IF NOT EXISTS member_addresses(id SERIAL PRIMARY KEY,member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,label TEXT NOT NULL,address TEXT NOT NULL,detail TEXT DEFAULT '',latitude DOUBLE PRECISION,longitude DOUBLE PRECISION,is_default BOOLEAN DEFAULT false,created_at TIMESTAMPTZ DEFAULT now());
    ALTER TABLE member_addresses ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
    ALTER TABLE member_addresses ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
    CREATE INDEX IF NOT EXISTS member_addresses_member_id_idx ON member_addresses(member_id);
    CREATE TABLE IF NOT EXISTS push_subscriptions(id SERIAL PRIMARY KEY,member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,endpoint TEXT UNIQUE NOT NULL,p256dh TEXT NOT NULL,auth TEXT NOT NULL,chat_session_id TEXT DEFAULT '',created_at TIMESTAMPTZ DEFAULT now(),updated_at TIMESTAMPTZ DEFAULT now());
    CREATE INDEX IF NOT EXISTS push_subscriptions_member_id_idx ON push_subscriptions(member_id);
    CREATE INDEX IF NOT EXISTS push_subscriptions_chat_session_idx ON push_subscriptions(chat_session_id);
  `);
  const dailyCount = await query('SELECT COUNT(*)::int AS count FROM daily_menus');
  if (!dailyCount.rows[0].count) await query('INSERT INTO daily_menus(menu_id,display_order) SELECT id,id FROM menus WHERE is_available=true ON CONFLICT(menu_id) DO NOTHING');
  const count = await query('SELECT COUNT(*)::int AS count FROM brands');
  if (count.rows[0].count) return;
  for (const brand of fallback.brands) {
    await query('INSERT INTO brands(name,description,is_active) VALUES($1,$2,true)', [brand.name, brand.description]);
  }
  for (const menu of fallback.menus) {
    await query('INSERT INTO menus(brand_id,name,description,category,price,image_url,is_available) VALUES($1,$2,$3,$4,$5,$6,true)', [menu.brand_id, menu.name, menu.description, menu.category, menu.price, menu.image_url || '']);
  }
  await query('INSERT INTO daily_menus(menu_id,display_order) SELECT id,id FROM menus WHERE is_available=true ON CONFLICT(menu_id) DO NOTHING');
}

async function catalog(dailyOnly = false) {
  if (!pool) {
    const menus = dailyOnly ? fallback.menus.filter((menu) => fallback.dailyMenuIds.includes(menu.id)) : fallback.menus;
    return { brands: fallback.brands, menus };
  }
  const brands = (await query('SELECT * FROM brands ORDER BY id')).rows;
  const sql = dailyOnly
    ? 'SELECT m.*,b.name brand_name,dm.display_order FROM daily_menus dm JOIN menus m ON m.id=dm.menu_id LEFT JOIN brands b ON b.id=m.brand_id WHERE dm.is_available=true ORDER BY dm.display_order,m.id'
    : 'SELECT m.*,b.name brand_name FROM menus m LEFT JOIN brands b ON b.id=m.brand_id ORDER BY m.id';
  const menus = (await query(sql)).rows;
  return { brands, menus };
}

async function sendPushRows(rows, payload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return 0;
  let sent = 0;
  for (const row of rows) {
    try {
      await webpush.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, JSON.stringify(payload));
      sent += 1;
    } catch (error) {
      if ((error.statusCode === 404 || error.statusCode === 410) && pool) await query('DELETE FROM push_subscriptions WHERE endpoint=$1', [row.endpoint]);
    }
  }
  return sent;
}
async function pushOrderStatus(order) {
  if (!pool || !order) return 0;
  const rows = (await query('SELECT ps.* FROM push_subscriptions ps JOIN members m ON m.id=ps.member_id WHERE m.whatsapp_number=$1', [normalizePhone(order.whatsapp_number)])).rows;
  const labels = { baru: 'Pesanan diterima', diterima: 'Pesanan dikonfirmasi', dimasak: 'Pesanan sedang dimasak', siap: 'Pesanan siap', diantar: 'Pesanan sedang diantar', selesai: 'Pesanan selesai', batal: 'Pesanan dibatalkan' };
  const status = labels[order.status] || String(order.status);
  return sendPushRows(rows, { title: status, body: `${order.order_code} · ${status}`, url: `/tracking.html?code=${encodeURIComponent(order.order_code)}`, tag: `order-${order.id}` });
}
async function pushChatReply(sessionId, message) {
  if (!pool) return 0;
  const rows = (await query('SELECT * FROM push_subscriptions WHERE chat_session_id=$1', [sessionId])).rows;
  return sendPushRows(rows, { title: 'Balasan Chat PrasEats', body: String(message).slice(0, 180), url: '/index.html?openChat=1', tag: `chat-${sessionId}` });
}

async function dashboard() {
  if (!pool) return { ...fallback, dailyMenus: fallback.menus.filter((menu) => fallback.dailyMenuIds.includes(menu.id)), statuses: ORDER_STATUSES, paymentStatuses: PAYMENT_STATUSES };
  const data = await catalog();
  const dailyMenus = pool ? (await query('SELECT dm.*,m.name,m.price,m.category,b.name brand_name FROM daily_menus dm JOIN menus m ON m.id=dm.menu_id LEFT JOIN brands b ON b.id=m.brand_id ORDER BY dm.display_order,dm.id')).rows : fallback.menus.filter((menu) => fallback.dailyMenuIds.includes(menu.id));
  const orders = (await query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100')).rows;
  const items = (await query('SELECT * FROM order_items WHERE order_id = ANY($1::int[]) ORDER BY id', [orders.map((order) => order.id)])).rows;
  for (const order of orders) order.items = items.filter((item) => item.order_id === order.id);
  const chats = (await query('SELECT session_id,max(created_at) last_message,count(*)::int total FROM chats GROUP BY session_id ORDER BY last_message DESC LIMIT 50')).rows;
  return { ...data, dailyMenus, orders, chats, statuses: ORDER_STATUSES, paymentStatuses: PAYMENT_STATUSES };
}

function serveStatic(req, res, pathname) {
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  const file = path.join(__dirname, relative);
  if (!file.startsWith(__dirname) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return json(res, 404, { ok: false, error: 'Not found' });
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.webmanifest': 'application/manifest+json', '.avif': 'image/avif', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

async function handle(req, res) {
  try {
    if (req.method === 'OPTIONS') return json(res, 204, {});
    const url = new URL(req.url, 'http://local');

    if (url.pathname === '/api/health') return json(res, 200, { ok: true, service: 'adminpraseats' });
    if (url.pathname === '/api/public/catalog') {
      const data = await catalog(true);
      data.brands = data.brands.filter((brand) => brand.is_active);
      data.menus = data.menus.filter((menu) => menu.is_available && data.brands.some((brand) => brand.id === menu.brand_id));
      return json(res, 200, { ok: true, data });
    }
    if (url.pathname === '/api/public/members/register' && req.method === 'POST') {
      const body = await readBody(req);
      requireFields(body, ['name', 'whatsapp', 'password', 'homeAddress']);
      if (String(body.password).length < 6) throw new Error('Password minimal 6 karakter');
      const phone = normalizePhone(body.whatsapp);
      const profilePhoto = validateProfilePhoto(body.profilePhoto);
      const homeAddress = String(body.homeAddress || '').trim();
      const homeDetail = String(body.homeDetail || '').trim();
      if (pool) {
        const existing = await query('SELECT id FROM members WHERE whatsapp_number=$1', [phone]);
        if (existing.rows.length) throw new Error('Nomor WhatsApp sudah terdaftar');
        const member = (await query('INSERT INTO members(name,whatsapp_number,password_hash,profile_photo,home_address,home_detail) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,name,whatsapp_number,profile_photo,home_address,home_detail', [String(body.name).trim(), phone, hashPassword(body.password), profilePhoto, homeAddress, homeDetail])).rows[0];
        return json(res, 200, { ok: true, token: memberToken(member), member });
      }
      if (fallback.members.some((member) => member.whatsapp_number === phone)) throw new Error('Nomor WhatsApp sudah terdaftar');
      const member = { id: Date.now(), name: String(body.name).trim(), whatsapp_number: phone, password_hash: hashPassword(body.password), profile_photo: profilePhoto, home_address: homeAddress, home_detail: homeDetail };
      fallback.members.push(member);
      return json(res, 200, { ok: true, token: memberToken(member), member: { id: member.id, name: member.name, whatsapp_number: member.whatsapp_number, profile_photo: member.profile_photo, home_address: member.home_address, home_detail: member.home_detail } });
    }
    if (url.pathname === '/api/public/members/login' && req.method === 'POST') {
      const body = await readBody(req);
      requireFields(body, ['whatsapp', 'password']);
      const phone = normalizePhone(body.whatsapp);
      const member = pool
        ? (await query('SELECT id,name,whatsapp_number,password_hash,profile_photo,home_address,home_detail FROM members WHERE whatsapp_number=$1', [phone])).rows[0]
        : fallback.members.find((item) => item.whatsapp_number === phone);
      if (!member || !passwordMatches(body.password, member.password_hash)) return json(res, 401, { ok: false, error: 'WhatsApp atau password salah' });
      return json(res, 200, { ok: true, token: memberToken(member), member: { id: member.id, name: member.name, whatsapp_number: member.whatsapp_number, profile_photo: member.profile_photo || '', home_address: member.home_address || '', home_detail: member.home_detail || '' } });
    }
    if (url.pathname === '/api/public/members/profile' && req.method === 'PATCH') {
      const identity = memberFromRequest(req);
      const body = await readBody(req);
      const wantsPhoto = Object.prototype.hasOwnProperty.call(body, 'profilePhoto');
      const wantsAddress = Object.prototype.hasOwnProperty.call(body, 'homeAddress');
      const wantsDetail = Object.prototype.hasOwnProperty.call(body, 'homeDetail');
      const profilePhoto = wantsPhoto ? validateProfilePhoto(body.profilePhoto) : undefined;
      const homeAddress = wantsAddress ? String(body.homeAddress || '').trim() : undefined;
      const homeDetail = wantsDetail ? String(body.homeDetail || '').trim() : undefined;
      if (pool) {
        const member = (await query('UPDATE members SET profile_photo=COALESCE($1,profile_photo),home_address=COALESCE($2,home_address),home_detail=COALESCE($3,home_detail) WHERE id=$4 RETURNING id,name,whatsapp_number,profile_photo,home_address,home_detail', [profilePhoto, homeAddress, homeDetail, identity.id])).rows[0];
        if (!member) throw Object.assign(new Error('Member tidak ditemukan'), { status: 404 });
        return json(res, 200, { ok: true, member });
      }
      const member = fallback.members.find((item) => item.id === identity.id);
      if (!member) throw Object.assign(new Error('Member tidak ditemukan'), { status: 404 });
      if (wantsPhoto) member.profile_photo = profilePhoto;
      if (wantsAddress) member.home_address = homeAddress;
      if (wantsDetail) member.home_detail = homeDetail;
      return json(res, 200, { ok: true, member: { id: member.id, name: member.name, whatsapp_number: member.whatsapp_number, profile_photo: member.profile_photo, home_address: member.home_address || '', home_detail: member.home_detail || '' } });
    }
    if (url.pathname === '/api/public/members/orders' && req.method === 'GET') {
      const identity = memberFromRequest(req);
      if (!pool) {
        const orders = fallback.orders.filter((order) => order.whatsapp_number === identity.phone);
        return json(res, 200, { ok: true, orders });
      }
      const orders = (await query('SELECT * FROM orders WHERE whatsapp_number=$1 ORDER BY created_at DESC LIMIT 50', [identity.phone])).rows;
      if (orders.length) {
        const items = (await query('SELECT oi.*,m.image_url FROM order_items oi LEFT JOIN menus m ON m.id=oi.menu_id WHERE oi.order_id=ANY($1::int[]) ORDER BY oi.id', [orders.map((order) => order.id)])).rows;
        for (const order of orders) order.items = items.filter((item) => item.order_id === order.id);
      }
      return json(res, 200, { ok: true, orders });
    }
    if (url.pathname === '/api/public/members/addresses' && req.method === 'GET') {
      const identity = memberFromRequest(req);
      if (pool) {
        let addresses = (await query('SELECT id,label,address,detail,latitude,longitude,is_default FROM member_addresses WHERE member_id=$1 ORDER BY is_default DESC,id', [identity.id])).rows;
        if (!addresses.length) {
          const member = (await query('SELECT home_address,home_detail FROM members WHERE id=$1', [identity.id])).rows[0];
          if (member?.home_address) addresses = (await query('INSERT INTO member_addresses(member_id,label,address,detail,is_default) VALUES($1,$2,$3,$4,true) RETURNING id,label,address,detail,latitude,longitude,is_default', [identity.id, 'Rumah', member.home_address, member.home_detail || ''])).rows;
        }
        return json(res, 200, { ok: true, addresses });
      }
      let addresses = fallback.memberAddresses.filter((item) => item.member_id === identity.id);
      if (!addresses.length) {
        const member = fallback.members.find((item) => item.id === identity.id);
        if (member?.home_address) {
          const address = { id: Date.now(), member_id: identity.id, label: 'Rumah', address: member.home_address, detail: member.home_detail || '', is_default: true };
          fallback.memberAddresses.push(address); addresses = [address];
        }
      }
      return json(res, 200, { ok: true, addresses });
    }
    if (url.pathname === '/api/public/members/addresses' && req.method === 'POST') {
      const identity = memberFromRequest(req), body = await readBody(req);
      requireFields(body, ['label', 'address']);
      const label = String(body.label).trim().slice(0, 40), address = String(body.address).trim(), detail = String(body.detail || '').trim(), makeDefault = Boolean(body.isDefault);
      const latitude = body.latitude !== undefined && body.latitude !== '' && Number.isFinite(Number(body.latitude)) ? Number(body.latitude) : null;
      const longitude = body.longitude !== undefined && body.longitude !== '' && Number.isFinite(Number(body.longitude)) ? Number(body.longitude) : null;
      if ((latitude !== null && (latitude < -90 || latitude > 90)) || (longitude !== null && (longitude < -180 || longitude > 180))) throw new Error('Koordinat lokasi tidak valid');
      if (pool) {
        if (makeDefault) await query('UPDATE member_addresses SET is_default=false WHERE member_id=$1', [identity.id]);
        const saved = (await query('INSERT INTO member_addresses(member_id,label,address,detail,latitude,longitude,is_default) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,label,address,detail,latitude,longitude,is_default', [identity.id, label, address, detail, latitude, longitude, makeDefault])).rows[0];
        return json(res, 200, { ok: true, address: saved });
      }
      if (makeDefault) fallback.memberAddresses.filter((item) => item.member_id === identity.id).forEach((item) => { item.is_default = false; });
      const saved = { id: Date.now(), member_id: identity.id, label, address, detail, latitude, longitude, is_default: makeDefault };
      fallback.memberAddresses.push(saved);
      return json(res, 200, { ok: true, address: saved });
    }
    const addressMatch = url.pathname.match(/^\/api\/public\/members\/addresses\/(\d+)$/);
    if (addressMatch && req.method === 'DELETE') {
      const identity = memberFromRequest(req), addressId = Number(addressMatch[1]);
      if (pool) {
        const removed = await query('DELETE FROM member_addresses WHERE id=$1 AND member_id=$2 RETURNING id', [addressId, identity.id]);
        if (!removed.rowCount) throw Object.assign(new Error('Alamat tidak ditemukan'), { status: 404 });
      } else {
        const index = fallback.memberAddresses.findIndex((item) => item.id === addressId && item.member_id === identity.id);
        if (index < 0) throw Object.assign(new Error('Alamat tidak ditemukan'), { status: 404 });
        fallback.memberAddresses.splice(index, 1);
      }
      return json(res, 200, { ok: true });
    }
    if (url.pathname === '/api/public/members/cart' && req.method === 'GET') {
      const identity = memberFromRequest(req);
      if (!pool) return json(res, 200, { ok: true, items: fallback.memberCarts.get(identity.id) || [] });
      const items = (await query('SELECT m.*,b.name brand_name,mc.qty FROM member_carts mc JOIN menus m ON m.id=mc.menu_id LEFT JOIN brands b ON b.id=m.brand_id WHERE mc.member_id=$1 ORDER BY mc.updated_at,m.id', [identity.id])).rows;
      return json(res, 200, { ok: true, items });
    }
    if (url.pathname === '/api/public/members/cart' && req.method === 'PUT') {
      const identity = memberFromRequest(req);
      const body = await readBody(req);
      const requested = (body.items || []).map((item) => ({ id: Number(item.id), qty: Math.max(1, Math.min(99, Number(item.qty || 1))) })).filter((item) => Number.isInteger(item.id));
      const quantities = new Map();
      for (const item of requested) quantities.set(item.id, Math.min(99, (quantities.get(item.id) || 0) + item.qty));
      if (!pool) {
        const items = fallback.menus.filter((menu) => quantities.has(menu.id) && menu.is_available).map((menu) => ({ ...menu, qty: quantities.get(menu.id), brandName: menu.brand_name }));
        fallback.memberCarts.set(identity.id, items);
        return json(res, 200, { ok: true, items });
      }
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM member_carts WHERE member_id=$1', [identity.id]);
        for (const [menuId, qty] of quantities) await client.query('INSERT INTO member_carts(member_id,menu_id,qty) SELECT $1,id,$3 FROM menus WHERE id=$2 AND is_available=true', [identity.id, menuId, qty]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
      const items = (await query('SELECT m.*,b.name brand_name,mc.qty FROM member_carts mc JOIN menus m ON m.id=mc.menu_id LEFT JOIN brands b ON b.id=m.brand_id WHERE mc.member_id=$1 ORDER BY mc.updated_at,m.id', [identity.id])).rows;
      return json(res, 200, { ok: true, items });
    }
    if (url.pathname === '/api/public/orders' && req.method === 'POST') {
      const body = await readBody(req);
      requireFields(body, ['customerName', 'whatsapp', 'fulfillmentType', 'paymentMethod']);
      if (!FULFILLMENT_TYPES.includes(body.fulfillmentType) || !PAYMENT_METHODS.includes(body.paymentMethod)) throw new Error('Metode tidak valid');
      let identity = null;
      try { identity = memberFromRequest(req); } catch {}
      let items = (body.items || []).map((item) => ({ ...item, qty: Math.max(1, Number(item.qty || 1)) }));
      if (identity) {
        if (pool) items = (await query('SELECT m.id,m.name,m.price,b.name "brandName",mc.qty FROM member_carts mc JOIN menus m ON m.id=mc.menu_id LEFT JOIN brands b ON b.id=m.brand_id WHERE mc.member_id=$1', [identity.id])).rows;
        else items = fallback.memberCarts.get(identity.id) || [];
        body.whatsapp = identity.phone;
      }
      if (!items.length) throw new Error('Keranjang kosong');
      const deliveryFee = body.fulfillmentType === 'delivery' ? 5000 : 0;
      const totals = calculateCart(items, deliveryFee);
      const order = {
        id: Date.now(), order_code: makeOrderCode(), customer_name: body.customerName,
        whatsapp_number: normalizePhone(body.whatsapp), fulfillment_type: body.fulfillmentType,
        payment_method: body.paymentMethod, payment_status: 'pending', address: body.address || '',
        notes: body.notes || '', status: 'baru', ...totals, items,
      };
      if (!pool) { fallback.orders.unshift(order); if (identity) fallback.memberCarts.delete(identity.id); return json(res, 200, { ok: true, order }); }
      const saved = (await query('INSERT INTO orders(order_code,customer_name,whatsapp_number,fulfillment_type,payment_method,address,notes,subtotal,delivery_fee,total) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *', [order.order_code, order.customer_name, order.whatsapp_number, order.fulfillment_type, order.payment_method, order.address, order.notes, order.subtotal, deliveryFee, order.total])).rows[0];
      for (const item of items) await query('INSERT INTO order_items(order_id,menu_id,menu_name,brand_name,qty,price) VALUES($1,$2,$3,$4,$5,$6)', [saved.id, item.id, item.name, item.brandName || '', item.qty, item.price]);
      if (identity) await query('DELETE FROM member_carts WHERE member_id=$1', [identity.id]);
      return json(res, 200, { ok: true, order: saved });
    }
    if (url.pathname === '/api/public/push/key' && req.method === 'GET') return json(res, 200, { ok: true, publicKey: VAPID_PUBLIC_KEY });
    if (url.pathname === '/api/public/push/subscribe' && req.method === 'POST') {
      const identity = memberFromRequest(req), body = await readBody(req), subscription = body.subscription || {}, keys = subscription.keys || {};
      requireFields({ endpoint: subscription.endpoint, p256dh: keys.p256dh, auth: keys.auth }, ['endpoint', 'p256dh', 'auth']);
      const chatSessionId = `member-${identity.id}`;
      if (pool) await query('INSERT INTO push_subscriptions(member_id,endpoint,p256dh,auth,chat_session_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT(endpoint) DO UPDATE SET member_id=EXCLUDED.member_id,p256dh=EXCLUDED.p256dh,auth=EXCLUDED.auth,chat_session_id=EXCLUDED.chat_session_id,updated_at=now()', [identity.id, subscription.endpoint, keys.p256dh, keys.auth, chatSessionId]);
      else {
        const existing = fallback.pushSubscriptions.find((item) => item.endpoint === subscription.endpoint), row = { member_id: identity.id, endpoint: subscription.endpoint, p256dh: keys.p256dh, auth: keys.auth, chat_session_id: chatSessionId };
        existing ? Object.assign(existing, row) : fallback.pushSubscriptions.push(row);
      }
      return json(res, 200, { ok: true });
    }
    if (url.pathname === '/api/public/tracking') {
      const code = url.searchParams.get('code') || '';
      const phone = normalizePhone(url.searchParams.get('phone') || '');
      const orders = pool
        ? (await query('SELECT * FROM orders WHERE order_code=$1 OR whatsapp_number=$2 ORDER BY created_at DESC LIMIT 20', [code, phone])).rows
        : fallback.orders.filter((order) => order.order_code === code || order.whatsapp_number === phone);
      return json(res, 200, { ok: true, orders });
    }
    if (url.pathname === '/api/public/chat' && req.method === 'GET') {
      const sessionId = url.searchParams.get('sessionId') || '';
      if (!sessionId) throw new Error('Session chat tidak valid');
      const messages = pool ? (await query('SELECT id,message,from_admin,created_at FROM chats WHERE session_id=$1 ORDER BY created_at', [sessionId])).rows : fallback.chats.filter((chat) => chat.session_id === sessionId);
      return json(res, 200, { ok: true, messages });
    }
    if (url.pathname === '/api/public/chat' && req.method === 'POST') {
      const body = await readBody(req); requireFields(body, ['sessionId', 'message']);
      if (pool) await query('INSERT INTO chats(session_id,message,from_admin) VALUES($1,$2,false)', [body.sessionId, body.message]);
      else fallback.chats.push({ id: Date.now(), session_id: body.sessionId, message: body.message, from_admin: false, created_at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (url.pathname === '/api/admin/login' && req.method === 'POST') {
      const body = await readBody(req);
      if (body.password !== ADMIN_PASSWORD) return json(res, 401, { ok: false, error: 'Password salah' });
      const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
      tokens.add(token); return json(res, 200, { ok: true, token });
    }
    if (url.pathname === '/api/admin/dashboard') { needAuth(req); return json(res, 200, { ok: true, data: await dashboard() }); }
    if (url.pathname === '/api/admin/brands' && req.method === 'POST') {
      needAuth(req); const body = await readBody(req); requireFields(body, ['name']);
      if (pool) await query('INSERT INTO brands(name,description,is_active) VALUES($1,$2,true)', [body.name, body.description || '']);
      else fallback.brands.push({ id: Date.now(), name: body.name, description: body.description || '', is_active: true });
      return json(res, 200, { ok: true });
    }
    if (url.pathname === '/api/admin/brands' && req.method === 'PATCH') {
      needAuth(req); const body = await readBody(req);
      if (pool) await query('UPDATE brands SET is_active=$1 WHERE id=$2', [Boolean(body.isActive), body.id]);
      else { const brand = fallback.brands.find((item) => String(item.id) === String(body.id)); if (brand) brand.is_active = Boolean(body.isActive); }
      return json(res, 200, { ok: true });
    }
    if (url.pathname === '/api/admin/menus' && req.method === 'POST') {
      needAuth(req); const body = await readBody(req); requireFields(body, ['brandId', 'name', 'price']);
      const imageUrl = saveMenuImage(body);
      if (pool) await query('INSERT INTO menus(brand_id,name,description,category,price,image_url,is_available) VALUES($1,$2,$3,$4,$5,$6,true)', [body.brandId, body.name, body.description || '', body.category || '', Number(body.price), imageUrl]);
      else fallback.menus.push({ id: Date.now(), brand_id: Number(body.brandId), brand_name: fallback.brands.find((brand) => String(brand.id) === String(body.brandId))?.name || '', name: body.name, description: body.description || '', category: body.category || '', price: Number(body.price), image_url: imageUrl, is_available: true });
      return json(res, 200, { ok: true });
    }
    if (url.pathname === '/api/admin/menus' && req.method === 'PATCH') {
      needAuth(req); const body = await readBody(req);
      if (body.name || body.brandId || body.price !== undefined || body.description !== undefined || body.imageData) {
        requireFields(body, ['id', 'brandId', 'name', 'price']);
        const imageUrl = body.imageData ? saveMenuImage(body) : (body.imageUrl || '');
        if (pool) {
          const current = (await query('SELECT image_url FROM menus WHERE id=$1', [body.id])).rows[0] || {};
          await query('UPDATE menus SET brand_id=$1,name=$2,description=$3,category=$4,price=$5,image_url=$6 WHERE id=$7', [body.brandId, body.name, body.description || '', '', Number(body.price), imageUrl || current.image_url || '', body.id]);
        } else {
          const menu = fallback.menus.find((item) => String(item.id) === String(body.id));
          const brand = fallback.brands.find((item) => String(item.id) === String(body.brandId));
          if (menu) Object.assign(menu, { brand_id: Number(body.brandId), brand_name: brand?.name || '', name: body.name, description: body.description || '', category: '', price: Number(body.price), image_url: imageUrl || menu.image_url || '' });
        }
      } else if (pool) await query('UPDATE menus SET is_available=$1 WHERE id=$2', [Boolean(body.isAvailable), body.id]);
      else { const menu = fallback.menus.find((item) => String(item.id) === String(body.id)); if (menu) menu.is_available = Boolean(body.isAvailable); }
      return json(res, 200, { ok: true });
    }
    if (url.pathname === '/api/admin/daily-menus' && req.method === 'POST') {
      needAuth(req); const body = await readBody(req); requireFields(body, ['menuId']);
      if (pool) await query('INSERT INTO daily_menus(menu_id,display_order,is_available) VALUES($1,$2,true) ON CONFLICT(menu_id) DO UPDATE SET is_available=true,display_order=EXCLUDED.display_order', [body.menuId, Number(body.displayOrder || 0)]);
      else if (!fallback.dailyMenuIds.includes(Number(body.menuId))) fallback.dailyMenuIds.push(Number(body.menuId));
      return json(res, 200, { ok: true });
    }
    if (url.pathname === '/api/admin/daily-menus' && req.method === 'PATCH') {
      needAuth(req); const body = await readBody(req); requireFields(body, ['menuId']);
      if (pool) await query('UPDATE daily_menus SET is_available=$1,display_order=$2 WHERE menu_id=$3', [Boolean(body.isAvailable), Number(body.displayOrder || 0), body.menuId]);
      else fallback.dailyMenuIds = Boolean(body.isAvailable) ? Array.from(new Set([...fallback.dailyMenuIds, Number(body.menuId)])) : fallback.dailyMenuIds.filter((id) => id !== Number(body.menuId));
      return json(res, 200, { ok: true });
    }
    if (url.pathname === '/api/admin/orders' && req.method === 'PATCH') {
      needAuth(req); const body = await readBody(req);
      if (!ORDER_STATUSES.includes(body.status) || !PAYMENT_STATUSES.includes(body.paymentStatus)) throw new Error('Status tidak valid');
      let order;
      if (pool) order = (await query('UPDATE orders SET status=$1,payment_status=$2 WHERE id=$3 RETURNING *', [body.status, body.paymentStatus, body.id])).rows[0];
      else { order = fallback.orders.find((item) => String(item.id) === String(body.id)); if (order) { order.status = body.status; order.payment_status = body.paymentStatus; } }
      const sent = await pushOrderStatus(order);
      return json(res, 200, { ok: true, sent });
    }
    if (url.pathname === '/api/admin/chat' && req.method === 'GET') {
      needAuth(req); const sessionId = url.searchParams.get('sessionId') || '';
      const messages = pool ? (await query('SELECT * FROM chats WHERE session_id=$1 ORDER BY created_at', [sessionId])).rows : fallback.chats.filter((chat) => chat.session_id === sessionId);
      return json(res, 200, { ok: true, messages });
    }
    if (url.pathname === '/api/admin/chat' && req.method === 'POST') {
      needAuth(req); const body = await readBody(req); requireFields(body, ['sessionId', 'message']);
      if (pool) await query('INSERT INTO chats(session_id,message,from_admin) VALUES($1,$2,true)', [body.sessionId, body.message]);
      else fallback.chats.push({ id: Date.now(), session_id: body.sessionId, message: body.message, from_admin: true, created_at: new Date().toISOString() });
      const sent = await pushChatReply(body.sessionId, body.message);
      return json(res, 200, { ok: true, sent });
    }

    if (req.method === 'GET') return serveStatic(req, res, url.pathname);
    return json(res, 404, { ok: false, error: 'Not found' });
  } catch (error) {
    return json(res, error.status || 400, { ok: false, error: error.message });
  }
}

setup().then(() => http.createServer(handle).listen(PORT, () => console.log(`adminpraseats on ${PORT}`)));
