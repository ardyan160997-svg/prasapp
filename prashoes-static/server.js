const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Pool } = require('pg');

const PORT = Number(process.env.PORT || 3000);
const STATIC_DIR = path.join(__dirname, 'dist');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.avif': 'image/avif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function sendJson(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    'x-content-type-options': 'nosniff',
  });
  res.end(body);
}

function tokenFor(password) {
  return Buffer.from(`${password}:${ADMIN_SECRET}`).toString('base64').replace(/=+$/g, '');
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function isAuthed(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  return Boolean(ADMIN_PASSWORD && ADMIN_SECRET && token && safeEqual(token, tokenFor(ADMIN_PASSWORD)));
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) throw new Error('Payload terlalu besar.');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('JSON tidak valid.'); }
}

function num(value) { return Number(value || 0); }
function makeOrderCode() {
  const now = new Date();
  const y = String(now.getFullYear()).slice(2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `ORD-${y}${m}${d}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

async function queryRows(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

async function dashboard() {
  const [services, members, orders, cashflow, pickups, promos] = await Promise.all([
    queryRows('SELECT id, name, slug, starting_price FROM services ORDER BY created_at ASC'),
    queryRows('SELECT * FROM members ORDER BY created_at DESC'),
    queryRows(`
      SELECT o.*,
        COALESCE((
          SELECT json_agg(item_row ORDER BY item_row.item_number)
          FROM (
            SELECT oi.*,
              json_build_object('name', s.name) AS services,
              COALESCE((
                SELECT json_agg(oip ORDER BY oip.sort_order, oip.created_at)
                FROM order_item_photos oip WHERE oip.order_item_id = oi.id
              ), '[]'::json) AS order_item_photos
            FROM order_items oi
            LEFT JOIN services s ON s.id = oi.service_id
            WHERE oi.order_id = o.id
          ) item_row
        ), '[]'::json) AS order_items
      FROM orders o ORDER BY o.created_at DESC
    `),
    queryRows('SELECT * FROM cashflow_transactions ORDER BY transaction_date DESC'),
    queryRows('SELECT * FROM pickup_requests ORDER BY created_at DESC'),
    queryRows('SELECT id FROM promos WHERE is_active = true'),
  ]);

  const normalizedOrders = orders.map((order) => ({
    ...order,
    order_items: (order.order_items || []).map((item) => ({
      ...item,
      services: item.services?.name ? item.services : null,
      order_item_photos: item.order_item_photos || [],
    })),
  }));
  const totalRevenue = normalizedOrders.reduce((sum, order) => sum + num(order.revenue_amount), 0);
  const totalCost = normalizedOrders.reduce((sum, order) => sum + num(order.production_cost) + num(order.raw_material_cost) + num(order.other_cost), 0);
  const cashIn = cashflow.filter((row) => row.transaction_type === 'pemasukkan').reduce((sum, row) => sum + num(row.amount), 0);
  const cashOut = cashflow.filter((row) => row.transaction_type === 'pengeluaran').reduce((sum, row) => sum + num(row.amount), 0);
  return {
    services,
    members,
    orders: normalizedOrders,
    cashflow,
    pickups,
    promos,
    stats: {
      pickupRequests: pickups.length,
      orders: normalizedOrders.length,
      members: members.length,
      activePromos: promos.length,
      services: services.length,
      totalRevenue,
      totalCost,
      totalProfit: totalRevenue - totalCost,
      cashIn,
      cashOut,
    },
  };
}

async function createOrder(input) {
  if (!input.customerName) throw new Error('Nama customer wajib diisi.');
  const items = Array.isArray(input.items) ? input.items.filter((item) => item.shoeDescription) : [];
  if (!items.length) throw new Error('Data sepatu wajib diisi.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderResult = await client.query(`
      INSERT INTO orders
        (order_code, customer_name, whatsapp_number, member_id, status)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
    `, [
      makeOrderCode(), input.customerName, input.whatsappNumber || '', input.memberId || null, 'Sepatu diterima',
    ]);
    const order = orderResult.rows[0];
    for (const [index, item] of items.entries()) {
      await client.query(`
        INSERT INTO order_items (order_id, item_number, shoe_description, item_status, notes)
        VALUES ($1,$2,$3,$4,$5)
      `, [order.id, index + 1, item.shoeDescription, 'Sepatu diterima', '']);
    }
    await client.query('COMMIT');
    return order;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updateOrder(input) {
  if (!input.id) throw new Error('Order ID wajib ada.');
  const fields = [];
  const values = [];
  const add = (column, value) => { values.push(value); fields.push(`${column} = $${values.length}`); };
  if (input.status !== undefined) add('status', input.status);
  if (input.paymentMethod !== undefined) add('payment_method', input.paymentMethod);
  if (input.revenueAmount !== undefined) add('revenue_amount', num(input.revenueAmount));
  if (!fields.length) return { ok: true };
  values.push(input.id);
  await pool.query(`UPDATE orders SET ${fields.join(', ')} WHERE id = $${values.length}`, values);
  if (input.status !== undefined) await pool.query('UPDATE order_items SET item_status = $1 WHERE order_id = $2', [input.status, input.id]);
  return { ok: true };
}

async function publicServices() {
  return queryRows('SELECT id, name, slug, description, starting_price FROM services ORDER BY created_at ASC');
}

async function publicPromos() {
  return queryRows('SELECT id, title, description, discount_label FROM promos WHERE is_active = true ORDER BY created_at ASC');
}

async function publicMemberBenefits() {
  return queryRows('SELECT benefit FROM member_benefits ORDER BY sort_order ASC, created_at ASC');
}

async function publicGallery() {
  return queryRows('SELECT id, before_url, after_url, label FROM gallery WHERE is_active = true ORDER BY sort_order ASC, created_at ASC');
}

async function createPublicMember(input) {
  if (!input.fullName || !input.whatsappNumber || !input.pickupAddress) throw new Error('Nama, WhatsApp, dan alamat pickup wajib diisi.');
  const rows = await queryRows(`
    INSERT INTO members (full_name, whatsapp_number, email, pickup_address, pickup_latitude, pickup_longitude, pickup_share_url)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (whatsapp_number) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      pickup_address = EXCLUDED.pickup_address,
      pickup_latitude = EXCLUDED.pickup_latitude,
      pickup_longitude = EXCLUDED.pickup_longitude,
      pickup_share_url = EXCLUDED.pickup_share_url
    RETURNING member_code
  `, [
    input.fullName,
    input.whatsappNumber,
    input.email || '',
    input.pickupAddress,
    input.pickupLatitude || null,
    input.pickupLongitude || null,
    input.pickupShareUrl || '',
  ]);
  return { success: true, memberCode: rows[0]?.member_code };
}

async function createPublicPickup(input) {
  if (!input.fullName || !input.whatsappNumber || !input.pickupAddress) throw new Error('Nama, WhatsApp, dan alamat pickup wajib diisi.');
  const memberRows = input.memberCode
    ? await queryRows('SELECT id, member_code FROM members WHERE member_code = $1', [String(input.memberCode).toUpperCase()])
    : [];
  const member = memberRows[0] || null;
  const rows = await queryRows(`
    INSERT INTO pickup_requests (
      full_name, whatsapp_number, email, pickup_address, pickup_latitude, pickup_longitude,
      pickup_share_url, shoe_quantity, service_type, is_member, member_id, member_code,
      delivery_fee, discount_amount, promo_label, notes
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    RETURNING request_code
  `, [
    input.fullName,
    input.whatsappNumber,
    input.email || '',
    input.pickupAddress,
    input.pickupLatitude || null,
    input.pickupLongitude || null,
    input.pickupShareUrl || '',
    Math.max(1, Math.min(20, num(input.shoeQuantity) || 1)),
    input.serviceType || '',
    Boolean(input.isMember),
    member?.id || null,
    input.memberCode || '',
    num(input.deliveryFee),
    num(input.discountAmount),
    input.promoLabel || '',
    input.notes || '',
  ]);
  return { success: true, requestCode: rows[0]?.request_code };
}

async function publicTracking(orderCode) {
  if (!orderCode) return null;
  const rows = await queryRows(`
    SELECT o.order_code, o.status, o.created_at, o.updated_at,
      COALESCE((
        SELECT json_agg(json_build_object(
          'item_number', oi.item_number,
          'shoe_description', oi.shoe_description,
          'service_name', s.name,
          'item_status', oi.item_status,
          'notes', oi.notes,
          'photos', COALESCE((
            SELECT json_agg(json_build_object(
              'photo_type', oip.photo_type,
              'image_url', oip.image_url,
              'caption', oip.caption
            ) ORDER BY oip.sort_order, oip.created_at)
            FROM order_item_photos oip WHERE oip.order_item_id = oi.id
          ), '[]'::json)
        ) ORDER BY oi.item_number)
        FROM order_items oi
        LEFT JOIN services s ON s.id = oi.service_id
        WHERE oi.order_id = o.id
      ), '[]'::json) AS items
    FROM orders o
    WHERE upper(o.order_code) = upper($1)
    LIMIT 1
  `, [orderCode]);
  return rows[0] || null;
}

async function publicApi(req, res, url, parts) {
  const resource = parts[1] || '';
  if (resource === 'services' && req.method === 'GET') return sendJson(res, await publicServices());
  if (resource === 'promos' && req.method === 'GET') return sendJson(res, await publicPromos());
  if (resource === 'member-benefits' && req.method === 'GET') return sendJson(res, await publicMemberBenefits());
  if (resource === 'gallery' && req.method === 'GET') return sendJson(res, await publicGallery());
  if (resource === 'members' && req.method === 'POST') return sendJson(res, await createPublicMember(await readJson(req)), 201);
  if (resource === 'pickup-requests' && req.method === 'POST') return sendJson(res, await createPublicPickup(await readJson(req)), 201);
  if (resource === 'tracking' && req.method === 'GET') return sendJson(res, await publicTracking(url.searchParams.get('orderCode')));
  return sendJson(res, { error: 'Route publik tidak ditemukan.' }, 404);
}

async function api(req, res, url) {
  const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const route = parts[0] || 'dashboard';
  if (route === 'health' && req.method === 'GET') {
    await pool.query('SELECT 1');
    return sendJson(res, { ok: true, service: 'adminprashoes-api', database: 'connected' });
  }
  if (route === 'login' && req.method === 'POST') {
    const body = await readJson(req);
    if (!ADMIN_PASSWORD || !ADMIN_SECRET) return sendJson(res, { error: 'Admin secret belum dikonfigurasi.' }, 500);
    if (!safeEqual(body.password, ADMIN_PASSWORD)) return sendJson(res, { error: 'Password admin salah.' }, 401);
    return sendJson(res, { token: tokenFor(ADMIN_PASSWORD) });
  }
  if (route === 'public') return publicApi(req, res, url, parts);
  if (!isAuthed(req)) return sendJson(res, { error: 'Unauthorized.' }, 401);
  if (route === 'dashboard' && req.method === 'GET') return sendJson(res, await dashboard());
  if (route === 'orders' && req.method === 'POST') return sendJson(res, await createOrder(await readJson(req)), 201);
  if (route === 'orders' && req.method === 'PATCH') return sendJson(res, await updateOrder(await readJson(req)));
  if (route === 'orders' && req.method === 'DELETE') {
    const id = url.searchParams.get('id');
    if (!id) throw new Error('Order ID wajib ada.');
    await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    return sendJson(res, { ok: true });
  }
  if (route === 'members' && req.method === 'POST') {
    const body = await readJson(req);
    if (!body.fullName || !body.whatsappNumber) throw new Error('Nama dan WhatsApp wajib diisi.');
    const rows = await queryRows(`
      INSERT INTO members (full_name, whatsapp_number, email, pickup_address)
      VALUES ($1,$2,$3,$4) RETURNING *
    `, [body.fullName, body.whatsappNumber, body.email || '', body.pickupAddress || '']);
    return sendJson(res, rows[0], 201);
  }
  if (route === 'cashflow' && req.method === 'POST') {
    const body = await readJson(req);
    const rows = await queryRows(`
      INSERT INTO cashflow_transactions (transaction_type, description, amount, quantity)
      VALUES ($1,$2,$3,$4) RETURNING *
    `, [body.transactionType, body.description || '', num(body.amount), Math.max(1, num(body.quantity) || 1)]);
    return sendJson(res, rows[0], 201);
  }
  return sendJson(res, { error: 'Route tidak ditemukan.' }, 404);
}

function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.resolve(STATIC_DIR, `.${pathname}`);
  if (!filePath.startsWith(`${STATIC_DIR}${path.sep}`)) return sendJson(res, { error: 'Forbidden.' }, 403);
  fs.stat(filePath, (error, stat) => {
    const target = !error && stat.isFile() ? filePath : path.join(STATIC_DIR, 'index.html');
    fs.readFile(target, (readError, data) => {
      if (readError) return sendJson(res, { error: 'File tidak ditemukan.' }, 404);
      res.writeHead(200, {
        'content-type': mime[path.extname(target)] || 'application/octet-stream',
        'content-length': data.length,
        'cache-control': target.endsWith('index.html') ? 'no-cache' : 'public, max-age=3600',
        'x-content-type-options': 'nosniff',
      });
      res.end(data);
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'OPTIONS') return sendJson(res, {}, 204);
  try {
    if (url.pathname.startsWith('/api/')) await api(req, res, url);
    else serveStatic(req, res, url);
  } catch (error) {
    console.error(error.message);
    sendJson(res, { error: error.message || 'Server error.' }, 500);
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(`Admin Prashoes listening on ${PORT}`));

process.on('SIGTERM', async () => {
  server.close();
  await pool.end();
  process.exit(0);
});
