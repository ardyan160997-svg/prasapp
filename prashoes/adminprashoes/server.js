const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Pool } = require('pg');

const PORT = Number(process.env.PORT || 3000);
const STATIC_DIR = path.join(__dirname, 'dist');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const CHAT_STATUSES = ['open', 'closed'];

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

async function ensureChatTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_threads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id text NOT NULL,
      member_id uuid REFERENCES members(id) ON DELETE SET NULL,
      member_code text NOT NULL DEFAULT '',
      customer_name text NOT NULL DEFAULT '',
      whatsapp_number text NOT NULL DEFAULT '',
      email text NOT NULL DEFAULT '',
      is_member boolean NOT NULL DEFAULT false,
      status text NOT NULL DEFAULT 'open',
      last_message_at timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT chat_threads_status_check CHECK (status IN ('open','closed')),
      CONSTRAINT chat_threads_session_id_key UNIQUE (session_id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      thread_id uuid NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
      sender_type text NOT NULL,
      message text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT chat_messages_sender_type_check CHECK (sender_type IN ('public','admin'))
    )
  `);
}

async function dashboard() {
  await ensureChatTables();
  const [services, members, orders, cashflow, pickups, promos, chats] = await Promise.all([
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
    queryRows(`
      SELECT ct.*,
        COALESCE((
          SELECT json_agg(cm ORDER BY cm.created_at ASC)
          FROM chat_messages cm WHERE cm.thread_id = ct.id
        ), '[]'::json) AS messages
      FROM chat_threads ct
      ORDER BY ct.last_message_at DESC, ct.created_at DESC
    `),
  ]);

  const normalizedOrders = orders.map((order) => {
    const items = (order.order_items || []).map((item) => ({
      ...item,
      services: item.services?.name ? item.services : null,
      order_item_photos: item.order_item_photos || [],
    }));
    return { ...order, order_items: items, items };
  });
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
    chats,
    stats: {
      chatThreads: chats.length,
      openChats: chats.filter((row) => row.status === 'open').length,
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

async function updatePickupRequest(input) {
  if (!input.id || !input.status) throw new Error('Pickup ID dan status wajib diisi.');
  const validStatuses = ['Menunggu konfirmasi', 'Dikonfirmasi', 'Kurir menuju lokasi', 'Sudah dijemput', 'Dibatalkan'];
  if (!validStatuses.includes(input.status)) throw new Error('Status pickup tidak valid.');
  const rows = await queryRows(
    'UPDATE pickup_requests SET status = $1, updated_at = now() WHERE id = $2 RETURNING *',
    [input.status, input.id]
  );
  if (!rows.length) throw new Error('Pickup request tidak ditemukan.');
  return rows[0];
}

async function updateOrderItem(input) {
  if (!input.id) throw new Error('Item order wajib dipilih.');
  if (!String(input.shoeDescription || '').trim()) throw new Error('Detail sepatu wajib diisi.');
  const stages = [
    ['received', 'Foto terima sepatu', 1],
    ['drying', 'Foto setelah cuci / pengeringan', 2],
    ['ready', 'Foto siap diambil', 3],
  ];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE order_items SET shoe_description = $1 WHERE id = $2', [String(input.shoeDescription).trim(), input.id]);
    for (const [type, caption, order] of stages) {
      const url = String(input.photos?.[type] || '').trim();
      await client.query('DELETE FROM order_item_photos WHERE order_item_id = $1 AND photo_type = $2', [input.id, type]);
      if (url) {
        await client.query(`
          INSERT INTO order_item_photos (order_item_id, photo_type, image_url, caption, sort_order)
          VALUES ($1,$2,$3,$4,$5)
        `, [input.id, type, url, caption, order]);
      }
    }
    await client.query('COMMIT');
    return { ok: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
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

function normalizeSessionId(value) {
  return String(value || '').trim().slice(0, 96);
}

async function publicChatThread(sessionId) {
  await ensureChatTables();
  if (!sessionId) return null;
  const rows = await queryRows(`
    SELECT ct.*,
      COALESCE((
        SELECT json_agg(cm ORDER BY cm.created_at ASC)
        FROM chat_messages cm WHERE cm.thread_id = ct.id
      ), '[]'::json) AS messages
    FROM chat_threads ct
    WHERE ct.session_id = $1
  `, [sessionId]);
  return rows[0] || null;
}

async function createPublicChatMessage(input) {
  await ensureChatTables();
  const sessionId = normalizeSessionId(input.sessionId);
  const message = String(input.message || '').trim();
  if (!sessionId) throw new Error('Session chat tidak valid.');
  if (!message) throw new Error('Pesan wajib diisi.');
  if (message.length > 1000) throw new Error('Pesan maksimal 1000 karakter.');

  const normalizedPhone = String(input.whatsappNumber || '').replace(/[^0-9]/g, '');
  const memberCode = String(input.memberCode || '').trim().toUpperCase();
  const memberRows = memberCode || normalizedPhone
    ? await queryRows(`
      SELECT id, member_code, full_name, whatsapp_number, email
      FROM members
      WHERE ($1 <> '' AND upper(member_code) = $1)
         OR ($2 <> '' AND regexp_replace(whatsapp_number, '[^0-9]', '', 'g') = $2)
      LIMIT 1
    `, [memberCode, normalizedPhone])
    : [];
  const member = memberRows[0] || null;
  const customerName = String(input.fullName || member?.full_name || '').trim();
  const whatsappNumber = String(input.whatsappNumber || member?.whatsapp_number || '').trim();
  const email = String(input.email || member?.email || '').trim();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const threadRows = await client.query(`
      INSERT INTO chat_threads (session_id, member_id, member_code, customer_name, whatsapp_number, email, is_member, status, last_message_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'open',now(),now())
      ON CONFLICT (session_id) DO UPDATE SET
        member_id = COALESCE(EXCLUDED.member_id, chat_threads.member_id),
        member_code = COALESCE(NULLIF(EXCLUDED.member_code, ''), chat_threads.member_code),
        customer_name = COALESCE(NULLIF(EXCLUDED.customer_name, ''), chat_threads.customer_name),
        whatsapp_number = COALESCE(NULLIF(EXCLUDED.whatsapp_number, ''), chat_threads.whatsapp_number),
        email = COALESCE(NULLIF(EXCLUDED.email, ''), chat_threads.email),
        is_member = chat_threads.is_member OR EXCLUDED.is_member,
        status = 'open',
        last_message_at = now(),
        updated_at = now()
      RETURNING *
    `, [sessionId, member?.id || null, member?.member_code || memberCode, customerName, whatsappNumber, email, Boolean(member)]);
    const thread = threadRows.rows[0];
    await client.query(
      'INSERT INTO chat_messages (thread_id, sender_type, message) VALUES ($1,$2,$3)',
      [thread.id, 'public', message]
    );
    await client.query('COMMIT');
    return await publicChatThread(sessionId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function createAdminChatReply(input) {
  await ensureChatTables();
  const message = String(input.message || '').trim();
  if (!input.threadId || !message) throw new Error('Thread dan pesan wajib diisi.');
  if (message.length > 1000) throw new Error('Pesan maksimal 1000 karakter.');
  const rows = await queryRows('SELECT id FROM chat_threads WHERE id = $1', [input.threadId]);
  if (!rows.length) throw new Error('Thread chat tidak ditemukan.');
  await queryRows('INSERT INTO chat_messages (thread_id, sender_type, message) VALUES ($1,$2,$3) RETURNING id', [input.threadId, 'admin', message]);
  await pool.query('UPDATE chat_threads SET status = $1, last_message_at = now(), updated_at = now() WHERE id = $2', ['open', input.threadId]);
  return { ok: true };
}

async function updateChatThread(input) {
  await ensureChatTables();
  if (!input.threadId || !CHAT_STATUSES.includes(input.status)) throw new Error('Status chat tidak valid.');
  const rows = await queryRows('UPDATE chat_threads SET status = $1, updated_at = now() WHERE id = $2 RETURNING *', [input.status, input.threadId]);
  if (!rows.length) throw new Error('Thread chat tidak ditemukan.');
  return rows[0];
}

const TRACKING_FIELDS = new Set(['name', 'member', 'whatsapp', 'email']);

async function publicTracking(type, value) {
  if (!TRACKING_FIELDS.has(type) || !String(value || '').trim()) return [];
  const searchValue = String(value).trim();
  return queryRows(`
    SELECT
      o.order_code AS "orderCode",
      o.customer_name AS "customerName",
      o.status,
      o.created_at AS "createdAt",
      o.updated_at AS "updatedAt",
      COALESCE((
        SELECT json_agg(json_build_object(
          'itemNumber', oi.item_number,
          'shoeDescription', oi.shoe_description,
          'serviceName', s.name,
          'itemStatus', oi.item_status,
          'notes', oi.notes,
          'photos', COALESCE((
            SELECT json_agg(json_build_object(
              'photoType', oip.photo_type,
              'imageUrl', oip.image_url,
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
    LEFT JOIN members m ON m.id = o.member_id
    WHERE
      ($1 = 'name' AND lower(trim(COALESCE(m.full_name, o.customer_name))) = lower(trim($2))) OR
      ($1 = 'member' AND upper(trim(COALESCE(m.member_code, ''))) = upper(trim($2))) OR
      ($1 = 'whatsapp' AND regexp_replace(COALESCE(NULLIF(o.whatsapp_number, ''), m.whatsapp_number, ''), '[^0-9]', '', 'g') = regexp_replace($2, '[^0-9]', '', 'g')) OR
      ($1 = 'email' AND lower(trim(COALESCE(m.email, ''))) = lower(trim($2)))
    ORDER BY o.created_at DESC
    LIMIT 20
  `, [type, searchValue]);
}

async function publicApi(req, res, url, parts) {
  const resource = parts[1] || '';
  if (resource === 'services' && req.method === 'GET') return sendJson(res, await publicServices());
  if (resource === 'promos' && req.method === 'GET') return sendJson(res, await publicPromos());
  if (resource === 'member-benefits' && req.method === 'GET') return sendJson(res, await publicMemberBenefits());
  if (resource === 'gallery' && req.method === 'GET') return sendJson(res, await publicGallery());
  if (resource === 'members' && req.method === 'POST') return sendJson(res, await createPublicMember(await readJson(req)), 201);
  if (resource === 'pickup-requests' && req.method === 'POST') return sendJson(res, await createPublicPickup(await readJson(req)), 201);
  if (resource === 'chat' && req.method === 'GET') return sendJson(res, await publicChatThread(normalizeSessionId(url.searchParams.get('sessionId'))) || { messages: [] });
  if (resource === 'chat' && req.method === 'POST') return sendJson(res, await createPublicChatMessage(await readJson(req)), 201);
  if (resource === 'tracking' && req.method === 'GET') {
    return sendJson(res, await publicTracking(url.searchParams.get('type'), url.searchParams.get('value')));
  }
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
  if (route === 'upload-photo' && req.method === 'POST') return uploadPhoto(req, res, url);
  if (route === 'upload-photo' && req.method === 'DELETE') return deletePhoto(req, res, url);
  if (route === 'orders' && req.method === 'POST') return sendJson(res, await createOrder(await readJson(req)), 201);
  if (route === 'orders' && req.method === 'PATCH') return sendJson(res, await updateOrder(await readJson(req)));
  if (route === 'pickup-requests' && req.method === 'PATCH') return sendJson(res, await updatePickupRequest(await readJson(req)));
  if (route === 'chat' && req.method === 'POST') return sendJson(res, await createAdminChatReply(await readJson(req)), 201);
  if (route === 'chat' && req.method === 'PATCH') return sendJson(res, await updateChatThread(await readJson(req)));
  if (route === 'order-items' && req.method === 'PATCH') return sendJson(res, await updateOrderItem(await readJson(req)));
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

function serveUpload(req, res, url) {
  const uploadPath = decodeURIComponent(url.pathname).replace(/^\/uploads\//, '');
  const filePath = path.resolve(UPLOAD_DIR, uploadPath);
  if (!filePath.startsWith(`${UPLOAD_DIR}${path.sep}`)) return sendJson(res, { error: 'Forbidden.' }, 403);
  fs.stat(filePath, (error, stat) => {
    if (error || !stat.isFile()) return sendJson(res, { error: 'File tidak ditemukan.' }, 404);
    res.writeHead(200, {
      'content-type': mime[path.extname(filePath)] || 'application/octet-stream',
      'content-length': stat.size,
      'cache-control': 'public, max-age=31536000',
      'x-content-type-options': 'nosniff',
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

async function uploadPhoto(req, res, url) {
  if (!isAuthed(req)) return sendJson(res, { error: 'Unauthorized.' }, 401);
  const contentType = req.headers['content-type'] || '';
  if (!contentType.startsWith('multipart/form-data')) return sendJson(res, { error: 'Content-Type harus multipart/form-data.' }, 400);
  const boundary = contentType.match(/boundary=(.+)$/)?.[1];
  if (!boundary) return sendJson(res, { error: 'Boundary tidak ditemukan.' }, 400);

  const parts = [];
  let buffer = Buffer.alloc(0);
  for await (const chunk of req) {
    buffer = Buffer.concat([buffer, chunk]);
    if (buffer.length > MAX_UPLOAD_BYTES) return sendJson(res, { error: 'File terlalu besar (maks 8MB).' }, 413);
  }

  const sections = buffer.toString('binary').split(`--${boundary}`);
  for (let part of sections) {
    if (!part || part === '--\r\n' || part === '--') continue;
    if (part.startsWith('\r\n')) part = part.slice(2);
    if (part.endsWith('\r\n')) part = part.slice(0, -2);
    if (part.endsWith('--')) part = part.slice(0, -2);
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const headers = part.slice(0, headerEnd);
    let content = part.slice(headerEnd + 4);
    if (content.endsWith('\r\n')) content = content.slice(0, -2);
    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);
    const typeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/i);
    if (!nameMatch) continue;
    parts.push({
      name: nameMatch[1],
      filename: filenameMatch?.[1] || '',
      contentType: typeMatch?.[1]?.trim() || '',
      data: Buffer.from(content, 'binary'),
    });
  }

  const filePart = parts.find(p => p.name === 'photo');
  const itemIdPart = parts.find(p => p.name === 'itemId');
  const stagePart = parts.find(p => p.name === 'stage');

  if (!filePart || !filePart.data?.length) return sendJson(res, { error: 'File foto wajib diisi.' }, 400);
  if (!itemIdPart) return sendJson(res, { error: 'Item ID wajib diisi.' }, 400);
  if (!stagePart) return sendJson(res, { error: 'Stage (received/drying/ready) wajib diisi.' }, 400);

  const itemId = itemIdPart.data.toString().trim();
  const stage = stagePart.data.toString().trim();
  const validStages = ['received', 'drying', 'ready'];
  if (!validStages.includes(stage)) return sendJson(res, { error: 'Stage tidak valid.' }, 400);

  const ext = path.extname(filePart.filename).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) return sendJson(res, { error: 'Format tidak didukung (jpg, png, webp, avif).' }, 400);

  const safeName = `${itemId}-${stage}-${Date.now()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, safeName);
  fs.writeFileSync(filePath, filePart.data);

  const photoUrl = `/uploads/${safeName}`;

  const captions = { received: 'Foto terima sepatu', drying: 'Foto setelah cuci / pengeringan', ready: 'Foto siap diambil' };
  const orders = { received: 1, drying: 2, ready: 3 };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const previous = await client.query(
      'SELECT image_url FROM order_item_photos WHERE order_item_id = $1 AND photo_type = $2',
      [itemId, stage]
    );
    await client.query('DELETE FROM order_item_photos WHERE order_item_id = $1 AND photo_type = $2', [itemId, stage]);
    await client.query(
      `INSERT INTO order_item_photos (order_item_id, photo_type, image_url, caption, sort_order)
       VALUES ($1,$2,$3,$4,$5)`,
      [itemId, stage, photoUrl, captions[stage], orders[stage]]
    );
    for (const row of previous.rows) {
      const oldName = String(row.image_url || '').split('/').pop();
      if (oldName) fs.unlink(path.join(UPLOAD_DIR, oldName), () => {});
    }
    await client.query('COMMIT');
    return sendJson(res, { ok: true, url: photoUrl, stage });
  } catch (error) {
    await client.query('ROLLBACK');
    fs.unlink(filePath, () => {});
    throw error;
  } finally {
    client.release();
  }
}

async function deletePhoto(req, res, url) {
  if (!isAuthed(req)) return sendJson(res, { error: 'Unauthorized.' }, 401);
  const body = await readJson(req);
  const itemId = body?.itemId;
  const stage = body?.stage;
  if (!itemId || !stage) return sendJson(res, { error: 'Item ID dan stage wajib diisi.' }, 400);
  const validStages = ['received', 'drying', 'ready'];
  if (!validStages.includes(stage)) return sendJson(res, { error: 'Stage tidak valid.' }, 400);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const row = await client.query(
      'SELECT image_url FROM order_item_photos WHERE order_item_id = $1 AND photo_type = $2',
      [itemId, stage]
    );
    if (row.rows.length) {
      const urlPath = row.rows[0].image_url;
      await client.query('DELETE FROM order_item_photos WHERE order_item_id = $1 AND photo_type = $2', [itemId, stage]);
      const fileName = urlPath.split('/').pop();
      if (fileName) {
        const filePath = path.join(UPLOAD_DIR, fileName);
        fs.unlink(filePath, () => {});
      }
    }
    await client.query('COMMIT');
    return sendJson(res, { ok: true });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'OPTIONS') return sendJson(res, {}, 204);
  try {
    if (url.pathname.startsWith('/api/')) await api(req, res, url);
    else if (url.pathname.startsWith('/uploads/')) serveUpload(req, res, url);
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
