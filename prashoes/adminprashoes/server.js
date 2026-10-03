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
    CREATE TABLE IF NOT EXISTS members (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      member_code text NOT NULL UNIQUE DEFAULT ('MBR-' || upper(substr(md5(random()::text), 1, 6))),
      full_name text NOT NULL,
      whatsapp_number text NOT NULL UNIQUE,
      email text,
      birth_date date,
      profile_photo_url text,
      pickup_address text,
      pickup_latitude numeric,
      pickup_longitude numeric,
      pickup_share_url text,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS birth_date date`);
  await pool.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS profile_photo_url text`);
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_templates (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      message text NOT NULL,
      sort_order integer NOT NULL DEFAULT 0,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  // seed default templates if empty
  const cnt = await pool.query('SELECT count(*) FROM chat_templates');
  if (Number(cnt.rows[0]?.count || 0) === 0) {
    const defaults = [
      ['Harga cuci sepatu berapa?', 10],
      ['Berapa lama proses cuci sepatu?', 20],
      ['Bisa pickup ke rumah?', 30],
      ['Bahan suede bisa dibersihkan?', 40],
      ['Jam buka outlet?', 50],
      ['Alamat outlet di mana?', 60],
    ];
    for (const [msg, order] of defaults) {
      await pool.query('INSERT INTO chat_templates (message, sort_order) VALUES ($1,$2)', [msg, order]);
    }
  }
}

async function ensureFinanceTables() {
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS revenue_amount numeric NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS production_cost numeric NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS raw_material_cost numeric NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS other_cost numeric NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'belum_bayar'`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamptz`);
  await pool.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS treatment_price numeric NOT NULL DEFAULT 0`);
}

async function ensureWarrantyTables() {
  await ensureFinanceTables();
  await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at timestamptz');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS warranty_claims (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
      customer_name text NOT NULL,
      whatsapp_number text NOT NULL DEFAULT '',
      treatment_name text NOT NULL,
      warranty_days integer NOT NULL,
      reason text NOT NULL DEFAULT '',
      status text NOT NULL DEFAULT 'Menunggu review',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT warranty_claims_item_key UNIQUE (order_item_id)
    )
  `);
}

async function dashboard() {
  await ensureChatTables();
  await ensureWarrantyTables();
  const [services, members, orders, cashflow, pickups, promos, chats, chatTemplates] = await Promise.all([
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
    queryRows('SELECT * FROM chat_templates ORDER BY sort_order ASC, created_at ASC'),
  ]);

  const normalizedOrders = orders.map((order) => {
    const items = (order.order_items || []).map((item) => ({
      ...item,
      services: item.services?.name ? item.services : null,
      order_item_photos: item.order_item_photos || [],
    }));
    return { ...order, order_items: items, items };
  });
  const paymentGroups = normalizedOrders.reduce((groups, order) => {
    const key = String(order.customer_name || 'Tanpa nama').trim().toLowerCase();
    const current = groups.get(key) || { customerName: order.customer_name || 'Tanpa nama', totalAmount: 0, paidAmount: 0, orderIds: [], unpaidOrderIds: [], status: 'belum_bayar' };
    const amount = num(order.revenue_amount);
    current.totalAmount += amount;
    current.orderIds.push(order.id);
    if (order.payment_status === 'terbayar') current.paidAmount += amount;
    else current.unpaidOrderIds.push(order.id);
    current.status = current.unpaidOrderIds.length ? 'belum_bayar' : 'terbayar';
    groups.set(key, current);
    return groups;
  }, new Map());
  const totalRevenue = cashflow.filter((row) => row.transaction_type === 'revenue' || row.transaction_type === 'pemasukkan').reduce((sum, row) => sum + num(row.amount), 0);
  const totalCost = cashflow.filter((row) => row.transaction_type === 'cost' || row.transaction_type === 'pengeluaran').reduce((sum, row) => sum + num(row.amount), 0);
  const financeRows = cashflow.map((row) => ({ ...row, transaction_type: row.transaction_type === 'pemasukkan' ? 'revenue' : row.transaction_type === 'pengeluaran' ? 'cost' : row.transaction_type }));
  return {
    services,
    members,
    orders: normalizedOrders,
    paymentGroups: Array.from(paymentGroups.values()),
    cashflow: financeRows,
    pickups,
    promos,
    chats,
    chatTemplates,
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
      cashIn: totalRevenue,
      cashOut: totalCost,
    },
  };
}

async function createOrder(input) {
  await ensureFinanceTables();
  if (!input.customerName) throw new Error('Nama customer wajib diisi.');
  const items = Array.isArray(input.items) ? input.items.filter((item) => item.shoeDescription) : [];
  if (!items.length) throw new Error('Data sepatu wajib diisi.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderResult = await client.query(`
      INSERT INTO orders
        (order_code, customer_name, whatsapp_number, member_id, status, revenue_amount, payment_status)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `, [
      makeOrderCode(), input.customerName, input.whatsappNumber || '', input.memberId || null, 'Sepatu diterima', num(input.revenueAmount), 'belum_bayar',
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
  await ensureWarrantyTables();
  if (!input.id) throw new Error('Order ID wajib ada.');
  const fields = [];
  const values = [];
  const add = (column, value) => { values.push(value); fields.push(`${column} = $${values.length}`); };
  if (input.status !== undefined) {
    add('status', input.status);
    if (input.status === 'Selesai') add('completed_at', new Date().toISOString());
    else add('completed_at', null);
  }
  if (input.paymentMethod !== undefined) add('payment_method', input.paymentMethod);
  if (input.revenueAmount !== undefined) add('revenue_amount', num(input.revenueAmount));
  if (input.paymentStatus !== undefined) add('payment_status', input.paymentStatus);
  if (input.paidAt !== undefined) add('paid_at', input.paidAt);
  if (!fields.length) return { ok: true };
  values.push(input.id);
  await pool.query(`UPDATE orders SET ${fields.join(', ')} WHERE id = $${values.length}`, values);
  if (input.status !== undefined) await pool.query('UPDATE order_items SET item_status = $1 WHERE order_id = $2', [input.status, input.id]);
  return { ok: true };
}

async function markCustomerOrdersPaid(input) {
  await ensureFinanceTables();
  const orderIds = Array.isArray(input.orderIds) ? input.orderIds.filter(Boolean) : [];
  if (!orderIds.length) throw new Error('Order untuk pembayaran wajib dipilih.');

  const rows = await queryRows(`
    UPDATE orders
    SET payment_status = 'terbayar', paid_at = COALESCE(paid_at, now())
    WHERE id = ANY($1::uuid[])
    RETURNING id, order_code, customer_name, revenue_amount
  `, [orderIds]);
  const amount = rows.reduce((sum, order) => sum + num(order.revenue_amount), 0);
  if (amount > 0) {
    await pool.query(`
      INSERT INTO cashflow_transactions (transaction_type, description, amount, quantity)
      VALUES ($1,$2,$3,$4)
    `, ['revenue', `Pembayaran treatment ${rows[0]?.customer_name || 'customer'}`, amount, rows.length]);
  }
  return { ok: true, orders: rows, amount };
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
  await ensureFinanceTables();
  if (!input.id) throw new Error('Item order wajib dipilih.');
  if (!String(input.shoeDescription || '').trim()) throw new Error('Detail sepatu wajib diisi.');
  if (!input.serviceId) throw new Error('Treatment wajib dipilih.');
  const treatmentPrice = Math.max(0, num(input.treatmentPrice));
  const stages = [
    ['received', 'Foto terima sepatu', 1],
    ['drying', 'Foto setelah cuci / pengeringan', 2],
    ['ready', 'Foto siap diambil', 3],
  ];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const itemResult = await client.query(`
      SELECT oi.order_id, o.payment_status
      FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE oi.id = $1 FOR UPDATE
    `, [input.id]);
    if (!itemResult.rows.length) throw new Error('Item order tidak ditemukan.');
    if (itemResult.rows[0].payment_status === 'terbayar') throw new Error('Treatment dan biaya tidak dapat diubah setelah pembayaran masuk Revenue.');
    const orderId = itemResult.rows[0].order_id;
    await client.query(`
      UPDATE order_items SET shoe_description = $1, service_id = $2, treatment_price = $3 WHERE id = $4
    `, [String(input.shoeDescription).trim(), input.serviceId, treatmentPrice, input.id]);
    await client.query(`
      UPDATE orders SET revenue_amount = (
        SELECT COALESCE(SUM(treatment_price), 0) FROM order_items WHERE order_id = $1
      ) WHERE id = $1
    `, [orderId]);
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
  await ensureChatTables();
  if (!input.fullName || !input.whatsappNumber || !input.pickupAddress) throw new Error('Nama, WhatsApp, dan alamat pickup wajib diisi.');
  const memberCode = 'MBR-' + crypto.randomBytes(3).toString('hex').toUpperCase();
  const rows = await queryRows(`
    INSERT INTO members (member_code, full_name, whatsapp_number, email, birth_date, profile_photo_url, pickup_address, pickup_latitude, pickup_longitude, pickup_share_url)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT (whatsapp_number) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      birth_date = EXCLUDED.birth_date,
      profile_photo_url = EXCLUDED.profile_photo_url,
      pickup_address = EXCLUDED.pickup_address,
      pickup_latitude = EXCLUDED.pickup_latitude,
      pickup_longitude = EXCLUDED.pickup_longitude,
      pickup_share_url = EXCLUDED.pickup_share_url
    RETURNING member_code
  `, [
    memberCode,
    input.fullName,
    input.whatsappNumber,
    input.email || '',
    input.birthDate || null,
    input.profilePhotoUrl || '',
    input.pickupAddress,
    input.pickupLatitude || null,
    input.pickupLongitude || null,
    input.pickupShareUrl || '',
  ]);
  return { success: true, memberCode: rows[0]?.member_code };
}

async function createPublicPickup(input) {
  if (!input.fullName || !input.whatsappNumber || !input.pickupAddress) throw new Error('Nama, WhatsApp, dan alamat pickup wajib diisi.');
  const phone = String(input.whatsappNumber || '').replace(/[^0-9]/g, '');
  const localPhone = phone.startsWith('62') ? `0${phone.slice(2)}` : phone;
  const internationalPhone = phone.startsWith('0') ? `62${phone.slice(1)}` : phone;
  const memberRows = await queryRows(
    `SELECT id, member_code FROM members
     WHERE member_code = $1 OR regexp_replace(whatsapp_number, '[^0-9]', '', 'g') = ANY($2::text[])
     LIMIT 1`,
    [String(input.memberCode || '').toUpperCase(), [phone, localPhone, internationalPhone].filter(Boolean)]
  );
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
    Boolean(member || input.isMember),
    member?.id || null,
    member?.member_code || input.memberCode || '',
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

async function publicChatIdentity(whatsappNumber) {
  const phone = String(whatsappNumber || '').replace(/[^0-9]/g, '');
  if (!phone) return { isMember: false };
  const localPhone = phone.startsWith('62') ? `0${phone.slice(2)}` : phone;
  const internationalPhone = phone.startsWith('0') ? `62${phone.slice(1)}` : phone;
  const rows = await queryRows(`
    SELECT member_code, full_name
    FROM members
    WHERE regexp_replace(whatsapp_number, '[^0-9]', '', 'g') IN ($1, $2, $3)
    LIMIT 1
  `, [phone, localPhone, internationalPhone]);
  const member = rows[0];
  return member
    ? { isMember: true, memberCode: member.member_code, fullName: member.full_name }
    : { isMember: false };
}

async function publicChatTemplates() {
  await ensureChatTables();
  return queryRows('SELECT id, message FROM chat_templates WHERE is_active = true ORDER BY sort_order ASC, created_at ASC');
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
  const localPhone = normalizedPhone.startsWith('62') ? `0${normalizedPhone.slice(2)}` : normalizedPhone;
  const internationalPhone = normalizedPhone.startsWith('0') ? `62${normalizedPhone.slice(1)}` : normalizedPhone;
  const memberRows = normalizedPhone
    ? await queryRows(`
      SELECT id, member_code, full_name, whatsapp_number, email
      FROM members
      WHERE regexp_replace(whatsapp_number, '[^0-9]', '', 'g') IN ($1, $2, $3)
      LIMIT 1
    `, [normalizedPhone, localPhone, internationalPhone])
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
    `, [sessionId, member?.id || null, member?.member_code || '', customerName, whatsappNumber, email, Boolean(member)]);
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

async function getChatTemplates() {
  await ensureChatTables();
  return queryRows('SELECT * FROM chat_templates ORDER BY sort_order ASC, created_at ASC');
}

async function createChatTemplate(input) {
  await ensureChatTables();
  const message = String(input.message || '').trim();
  if (!message) throw new Error('Pesan template wajib diisi.');
  if (message.length > 200) throw new Error('Template maksimal 200 karakter.');
  const sortOrder = num(input.sortOrder);
  const rows = await queryRows('INSERT INTO chat_templates (message, sort_order) VALUES ($1,$2) RETURNING *', [message, sortOrder]);
  return rows[0];
}

async function updateChatTemplate(input) {
  await ensureChatTables();
  const id = input.id;
  const message = String(input.message || '').trim();
  const sortOrder = num(input.sortOrder);
  const isActive = Boolean(input.isActive);
  if (!id || !message) throw new Error('ID dan pesan wajib diisi.');
  const rows = await queryRows('UPDATE chat_templates SET message = $1, sort_order = $2, is_active = $3, updated_at = now() WHERE id = $4 RETURNING *', [message, sortOrder, isActive, id]);
  if (!rows.length) throw new Error('Template tidak ditemukan.');
  return rows[0];
}

async function deleteChatTemplate(id) {
  await ensureChatTables();
  await queryRows('DELETE FROM chat_templates WHERE id = $1', [id]);
  return { ok: true };
}

const TRACKING_FIELDS = new Set(['name', 'member', 'whatsapp', 'email']);

async function publicTracking(type, value) {
  if (!TRACKING_FIELDS.has(type) || !String(value || '').trim()) return [];
  await ensureWarrantyTables();
  const searchValue = String(value).trim();
  const rows = await queryRows(`
    SELECT
      o.id AS "orderId",
      o.order_code AS "orderCode",
      o.customer_name AS "customerName",
      COALESCE(NULLIF(o.whatsapp_number, ''), m.whatsapp_number, '') AS "whatsappNumber",
      o.status,
      o.created_at AS "createdAt",
      o.updated_at AS "updatedAt",
      o.completed_at AS "completedAt",
      COALESCE((
        SELECT json_agg(json_build_object(
          'orderItemId', oi.id,
          'itemNumber', oi.item_number,
          'shoeDescription', oi.shoe_description,
          'serviceName', s.name,
          'itemStatus', oi.item_status,
          'notes', oi.notes,
          'warrantyClaim', (
            SELECT json_build_object('id', wc.id, 'status', wc.status, 'createdAt', wc.created_at)
            FROM warranty_claims wc WHERE wc.order_item_id = oi.id LIMIT 1
          ),
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

  return rows.map((order) => {
    const completedAt = order.completedAt || order.updatedAt;
    const completedTime = completedAt ? new Date(completedAt).getTime() : 0;
    const isCompleted = order.status === 'Selesai' && completedTime > 0;
    const items = (order.items || []).map((item) => {
      const treatmentText = `${item.serviceName || ''} ${item.shoeDescription || ''}`.toLowerCase();
      const isExtended = treatmentText.includes('unyellowing') || treatmentText.includes('repaint');
      const warrantyDays = isExtended ? 7 : 2;
      const expiresAt = isCompleted ? new Date(completedTime + warrantyDays * 24 * 60 * 60 * 1000).toISOString() : null;
      return {
        ...item,
        warranty: {
          days: warrantyDays,
          type: isExtended ? 'Unyellowing/Repaint' : 'Cuci',
          eligible: isCompleted && Date.now() <= new Date(expiresAt).getTime() && !item.warrantyClaim,
          expiresAt,
        },
      };
    });
    return { ...order, items };
  });
}

async function createWarrantyClaim(input) {
  if (!input.orderItemId) throw new Error('orderItemId wajib diisi.');
  if (!input.customerName) throw new Error('customerName wajib diisi.');
  if (!input.treatmentName) throw new Error('treatmentName wajib diisi.');
  if (!input.warrantyDays) throw new Error('warrantyDays wajib diisi.');

  await ensureWarrantyTables();

  const itemRows = await queryRows(`
    SELECT
      oi.id AS "itemId",
      oi.order_id AS "orderId",
      oi.shoe_description AS "shoeDescription",
      oi.item_status AS "itemStatus",
      o.completed_at AS "completedAt",
      o.customer_name AS "orderCustomerName",
      COALESCE(NULLIF(o.whatsapp_number, ''), m.whatsapp_number, '') AS "orderWhatsapp"
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    LEFT JOIN members m ON m.id = o.member_id
    WHERE oi.id = $1
  `, [input.orderItemId]);

  if (!itemRows.length) throw new Error('Item order tidak ditemukan.');

  const item = itemRows[0];
  if (!item.completedAt) throw new Error('Order belum selesai, garansi belum aktif.');

  const daysSinceCompleted = Math.floor((Date.now() - new Date(item.completedAt).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceCompleted > input.warrantyDays) throw new Error(`Masa garansi ${input.warrantyDays} hari telah berakhir.`);

  const existing = await queryRows('SELECT id FROM warranty_claims WHERE order_item_id = $1', [input.orderItemId]);
  if (existing.length) throw new Error('Klaim garansi untuk item ini sudah pernah diajukan.');

  const rows = await queryRows(`
    INSERT INTO warranty_claims (order_id, order_item_id, customer_name, whatsapp_number, treatment_name, warranty_days, reason)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, status, created_at
  `, [item.orderId, item.itemId, input.customerName, input.whatsappNumber || item.orderWhatsapp, input.treatmentName, input.warrantyDays, input.reason || '']);

  return { ok: true, claim: rows[0] };
}

async function publicApi(req, res, url, parts) {
  const resource = parts[1] || '';
  if (resource === 'services' && req.method === 'GET') return sendJson(res, await publicServices());
  if (resource === 'promos' && req.method === 'GET') return sendJson(res, await publicPromos());
  if (resource === 'member-benefits' && req.method === 'GET') return sendJson(res, await publicMemberBenefits());
  if (resource === 'gallery' && req.method === 'GET') return sendJson(res, await publicGallery());
  if (resource === 'members' && req.method === 'POST') return sendJson(res, await createPublicMember(await readJson(req)), 201);
  if (resource === 'member-photo' && req.method === 'POST') return uploadMemberPhoto(req, res);
  if (resource === 'pickup-requests' && req.method === 'POST') return sendJson(res, await createPublicPickup(await readJson(req)), 201);
  if (resource === 'chat' && url.pathname.endsWith('/identity') && req.method === 'POST') return sendJson(res, await publicChatIdentity((await readJson(req)).whatsappNumber));
  if (resource === 'chat' && url.pathname.endsWith('/templates') && req.method === 'GET') return sendJson(res, await publicChatTemplates());
  if (resource === 'chat' && req.method === 'GET') return sendJson(res, await publicChatThread(normalizeSessionId(url.searchParams.get('sessionId'))) || { messages: [] });
  if (resource === 'chat' && req.method === 'POST') return sendJson(res, await createPublicChatMessage(await readJson(req)), 201);
  if (resource === 'tracking' && req.method === 'GET') {
    return sendJson(res, await publicTracking(url.searchParams.get('type'), url.searchParams.get('value')));
  }
  if (resource === 'warranty-claim' && req.method === 'POST') {
    const body = await readJson(req);
    return sendJson(res, await createWarrantyClaim(body), 201);
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
  if (route === 'chat-templates' && req.method === 'GET') return sendJson(res, await getChatTemplates());
  if (route === 'chat-templates' && req.method === 'POST') return sendJson(res, await createChatTemplate(await readJson(req)), 201);
  if (route === 'chat-templates' && req.method === 'PATCH') return sendJson(res, await updateChatTemplate(await readJson(req)));
  if (route === 'chat-templates' && req.method === 'DELETE') {
    const id = url.searchParams.get('id');
    if (!id) throw new Error('Template ID wajib ada.');
    return sendJson(res, await deleteChatTemplate(id));
  }
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
  if (route === 'finance' && req.method === 'POST') {
    const body = await readJson(req);
    const type = body.transactionType === 'cost' ? 'cost' : 'revenue';
    const rows = await queryRows(`
      INSERT INTO cashflow_transactions (transaction_type, description, amount, quantity)
      VALUES ($1,$2,$3,$4) RETURNING *
    `, [type, body.description || '', num(body.amount), Math.max(1, num(body.quantity) || 1)]);
    return sendJson(res, rows[0], 201);
  }
  if (route === 'payment-status' && req.method === 'PATCH') return sendJson(res, await markCustomerOrdersPaid(await readJson(req)));
  if (route === 'cashflow' && req.method === 'POST') {
    const body = await readJson(req);
    const type = body.transactionType === 'pengeluaran' ? 'cost' : 'revenue';
    const rows = await queryRows(`
      INSERT INTO cashflow_transactions (transaction_type, description, amount, quantity)
      VALUES ($1,$2,$3,$4) RETURNING *
    `, [type, body.description || '', num(body.amount), Math.max(1, num(body.quantity) || 1)]);
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

async function parseMultipartUpload(req) {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.startsWith('multipart/form-data')) throw new Error('Content-Type harus multipart/form-data.');
  const boundary = contentType.match(/boundary=(.+)$/)?.[1];
  if (!boundary) throw new Error('Boundary tidak ditemukan.');

  const parts = [];
  let buffer = Buffer.alloc(0);
  for await (const chunk of req) {
    buffer = Buffer.concat([buffer, chunk]);
    if (buffer.length > MAX_UPLOAD_BYTES) throw Object.assign(new Error('File terlalu besar (maks 8MB).'), { status: 413 });
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
  return parts;
}

async function uploadMemberPhoto(req, res) {
  let parts;
  try { parts = await parseMultipartUpload(req); }
  catch (error) { return sendJson(res, { error: error.message }, error.status || 400); }

  const filePart = parts.find(p => p.name === 'photo');
  if (!filePart || !filePart.data?.length) return sendJson(res, { error: 'File foto wajib diisi.' }, 400);
  const ext = path.extname(filePart.filename).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) return sendJson(res, { error: 'Format tidak didukung (jpg, png, webp, avif).' }, 400);
  if (!String(filePart.contentType || '').startsWith('image/')) return sendJson(res, { error: 'File harus berupa gambar.' }, 400);

  const safeName = `member-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, safeName), filePart.data);
  return sendJson(res, { ok: true, url: `/uploads/${safeName}` }, 201);
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
