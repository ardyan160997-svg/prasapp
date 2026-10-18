const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Pool } = require('pg');
const { normalizePhone, makeOrderCode, estimateTotal, requireFields, ORDER_STATUSES } = require('./domain');

const PORT = Number(process.env.PORT || 3010);
const STATIC_DIR = path.join(__dirname, 'dist');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads', 'models');
const GUIDE_UPLOAD_DIR = process.env.GUIDE_UPLOAD_DIR || path.join(__dirname, 'uploads', 'guides');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
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

function sendError(res, error, status = 400) {
  sendJson(res, { ok: false, error: error.message || String(error) }, status);
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 4 * 1024 * 1024) throw new Error('Payload terlalu besar.');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('JSON tidak valid.'); }
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

function requireDb() {
  if (!pool) throw new Error('DATABASE_URL belum diset.');
  return pool;
}

async function ensureSchema() {
  const db = requireDb();
  await db.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS members (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      member_code text NOT NULL UNIQUE DEFAULT ('PC-' || upper(substr(md5(random()::text), 1, 6))),
      full_name text NOT NULL,
      whatsapp_number text NOT NULL UNIQUE,
      email text,
      device_notes text NOT NULL DEFAULT '',
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS phone_models (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      brand text NOT NULL,
      model text NOT NULL,
      notes text NOT NULL DEFAULT '',
      image_url text NOT NULL DEFAULT '',
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (brand, model)
    )
  `);
  await db.query(`ALTER TABLE phone_models ADD COLUMN IF NOT EXISTS image_url text NOT NULL DEFAULT ''`);
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  await db.query(`
    CREATE TABLE IF NOT EXISTS repair_services (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      phone_model_id uuid REFERENCES phone_models(id) ON DELETE SET NULL,
      issue_category text NOT NULL DEFAULT 'hardware',
      issue_name text NOT NULL,
      symptoms text NOT NULL DEFAULT '',
      cause text NOT NULL DEFAULT '',
      repair_method text NOT NULL DEFAULT '',
      assembly_steps text NOT NULL DEFAULT '',
      tools text NOT NULL DEFAULT '',
      spare_parts text NOT NULL DEFAULT '',
      price_min integer NOT NULL DEFAULT 0,
      price_max integer NOT NULL DEFAULT 0,
      duration_estimate text NOT NULL DEFAULT '',
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.query(`ALTER TABLE repair_services ADD COLUMN IF NOT EXISTS issue_category text NOT NULL DEFAULT 'hardware'`);
  await db.query(`ALTER TABLE repair_services ADD COLUMN IF NOT EXISTS cause_image_url text NOT NULL DEFAULT ''`);
  await db.query(`ALTER TABLE repair_services ADD COLUMN IF NOT EXISTS repair_image_url text NOT NULL DEFAULT ''`);
  await db.query(`ALTER TABLE repair_services ADD COLUMN IF NOT EXISTS spare_part_image_url text NOT NULL DEFAULT ''`);
  await db.query(`ALTER TABLE repair_services ADD COLUMN IF NOT EXISTS disassembly_images jsonb NOT NULL DEFAULT '[]'::jsonb`);
  fs.mkdirSync(GUIDE_UPLOAD_DIR, { recursive: true });
  await db.query(`UPDATE repair_services SET issue_category = 'hardware' WHERE issue_category NOT IN ('software','hardware')`);
  await db.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'repair_services_issue_category_check') THEN
        ALTER TABLE repair_services ADD CONSTRAINT repair_services_issue_category_check CHECK (issue_category IN ('software','hardware'));
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'repair_services_price_check') THEN
        ALTER TABLE repair_services ADD CONSTRAINT repair_services_price_check CHECK (price_min >= 0 AND price_max >= price_min) NOT VALID;
      END IF;
    END $$
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS service_orders (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      order_code text NOT NULL UNIQUE,
      member_id uuid REFERENCES members(id) ON DELETE SET NULL,
      customer_name text NOT NULL,
      whatsapp_number text NOT NULL,
      phone_brand text NOT NULL DEFAULT '',
      phone_model text NOT NULL DEFAULT '',
      issue_description text NOT NULL,
      status text NOT NULL DEFAULT 'baru',
      estimate_total integer NOT NULL DEFAULT 0,
      final_total integer NOT NULL DEFAULT 0,
      technician_notes text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT service_orders_status_check CHECK (status IN ('baru','dicek','menunggu_sparepart','dikerjakan','selesai','diambil','batal'))
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
      service_id uuid REFERENCES repair_services(id) ON DELETE SET NULL,
      item_name text NOT NULL,
      price integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS chat_threads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id text NOT NULL UNIQUE,
      member_id uuid REFERENCES members(id) ON DELETE SET NULL,
      customer_name text NOT NULL DEFAULT '',
      whatsapp_number text NOT NULL DEFAULT '',
      status text NOT NULL DEFAULT 'open',
      last_message_at timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      thread_id uuid NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
      sender_type text NOT NULL,
      message text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT chat_messages_sender_type_check CHECK (sender_type IN ('public','admin'))
    )
  `);

  const defaults = await db.query('SELECT count(*) FROM repair_services');
  if (Number(defaults.rows[0]?.count || 0) === 0) {
    const model = await db.query(
      `INSERT INTO phone_models (brand, model, notes)
       VALUES ('Umum', 'Android', 'Template umum untuk estimasi awal')
       ON CONFLICT (brand, model) DO UPDATE SET notes = EXCLUDED.notes
       RETURNING id`
    );
    const modelId = model.rows[0].id;
    const seed = [
      ['Ganti LCD', 'Layar pecah, bergaris, blank, atau touch tidak responsif.', 'Panel LCD rusak, fleksibel longgar, atau efek benturan.', 'Tes display, lepas frame, pindahkan komponen kecil, pasang LCD baru, lalu cek touch dan warna.', 'Matikan HP. Panaskan frame secukupnya. Buka backdoor. Lepas konektor baterai. Lepas konektor LCD. Angkat modul layar dengan suction dan pick. Bersihkan lem lama. Pasang LCD baru dan test sebelum dilem permanen.', 'Hot air, suction cup, opening pick, obeng presisi, lem B7000/T7000', 'LCD sesuai model, adhesive', 250000, 900000, '1–3 jam'],
      ['Ganti Baterai', 'Baterai boros, drop, menggelembung, atau mati mendadak.', 'Umur baterai, IC charging bermasalah, atau kabel fleksibel longgar.', 'Cek health, arus charger, ganti baterai bila cell rusak, lalu kalibrasi.', 'Buka backdoor. Lepas konektor baterai. Angkat baterai perlahan tanpa menusuk cell. Bersihkan sisa adhesive. Pasang baterai baru dan cek pengisian.', 'Opening pick, spudger, obeng presisi, alkohol IPA', 'Baterai sesuai model, adhesive baterai', 150000, 450000, '30–90 menit'],
      ['Port Charger Bermasalah', 'Tidak bisa cas, cas putus nyambung, atau harus ditekan.', 'Port kotor, konektor aus, fleksibel charger rusak, atau jalur charging bermasalah.', 'Bersihkan port, cek arus, ganti fleksibel/port bila aus, cek IC bila tetap gagal.', 'Buka backdoor. Lepas konektor baterai. Lepas board bawah/fleksibel charger. Bersihkan area port. Pasang part baru. Test charging dan transfer data.', 'Pinset, brush, contact cleaner, obeng presisi, multimeter USB', 'Fleksibel charger/port charging', 100000, 350000, '1–2 jam'],
    ];
    for (const item of seed) {
      await db.query(
        `INSERT INTO repair_services (phone_model_id, issue_name, symptoms, cause, repair_method, assembly_steps, tools, spare_parts, price_min, price_max, duration_estimate)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [modelId, ...item]
      );
    }
  }
  const iphoneModels = [
    'iPhone 8', 'iPhone 8 Plus', 'iPhone X', 'iPhone XR', 'iPhone XS', 'iPhone XS Max',
    'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max', 'iPhone SE (2020)',
    'iPhone 12 mini', 'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max',
    'iPhone 13 mini', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 'iPhone SE (2022)',
    'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
    'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
    'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max',
  ];
  for (const model of iphoneModels) {
    await db.query(
      `INSERT INTO phone_models (brand, model, notes) VALUES ('Apple',$1,'Model iPhone') ON CONFLICT (brand, model) DO NOTHING`,
      [model]
    );
  }
}

function publicServiceShape(row) {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    issueCategory: row.issue_category,
    issueName: row.issue_name,
    symptoms: row.symptoms,
    repairMethod: row.repair_method,
    priceMin: Number(row.price_min || 0),
    priceMax: Number(row.price_max || 0),
    durationEstimate: row.duration_estimate,
  };
}

async function listPublicServices() {
  const db = requireDb();
  const [services, models] = await Promise.all([
    db.query(`
      SELECT rs.*, pm.brand, pm.model
      FROM repair_services rs
      LEFT JOIN phone_models pm ON pm.id = rs.phone_model_id
      WHERE rs.is_active = true AND (pm.is_active = true OR rs.phone_model_id IS NULL)
      ORDER BY pm.brand NULLS LAST, pm.model NULLS LAST, rs.issue_category, rs.issue_name
    `),
    db.query(`SELECT id, brand, model, image_url FROM phone_models WHERE is_active = true ORDER BY brand, model`),
  ]);
  return { services: services.rows.map(publicServiceShape), models: models.rows };
}

async function dashboardData() {
  const db = requireDb();
  const [members, models, services, orders, chats] = await Promise.all([
    db.query(`SELECT * FROM members ORDER BY created_at DESC LIMIT 200`),
    db.query(`SELECT * FROM phone_models ORDER BY brand, model`),
    db.query(`SELECT rs.*, pm.brand, pm.model FROM repair_services rs LEFT JOIN phone_models pm ON pm.id = rs.phone_model_id ORDER BY rs.created_at DESC`),
    db.query(`SELECT * FROM service_orders ORDER BY created_at DESC LIMIT 200`),
    db.query(`SELECT * FROM chat_threads ORDER BY last_message_at DESC LIMIT 100`),
  ]);
  return { members: members.rows, models: models.rows, services: services.rows, orders: orders.rows, chats: chats.rows, statuses: ORDER_STATUSES };
}

async function createMember(data) {
  requireFields(data, ['fullName', 'whatsappNumber']);
  const phone = normalizePhone(data.whatsappNumber);
  const result = await requireDb().query(
    `INSERT INTO members (full_name, whatsapp_number, email, device_notes)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (whatsapp_number) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, device_notes = EXCLUDED.device_notes, updated_at = now()
     RETURNING *`,
    [data.fullName.trim(), phone, data.email || null, data.deviceNotes || '']
  );
  return result.rows[0];
}

async function createOrder(data) {
  requireFields(data, ['customerName', 'whatsappNumber', 'issueDescription']);
  const phone = normalizePhone(data.whatsappNumber);
  const member = data.createMember ? await createMember({ fullName: data.customerName, whatsappNumber: phone, email: data.email || '', deviceNotes: `${data.phoneBrand || ''} ${data.phoneModel || ''}`.trim() }) : null;
  const result = await requireDb().query(
    `INSERT INTO service_orders (order_code, member_id, customer_name, whatsapp_number, phone_brand, phone_model, issue_description, estimate_total)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [makeOrderCode(), member?.id || null, data.customerName.trim(), phone, data.phoneBrand || '', data.phoneModel || '', data.issueDescription.trim(), Number(data.estimateTotal || 0)]
  );
  return result.rows[0];
}

async function upsertModel(data) {
  requireFields(data, ['brand', 'model']);
  const result = await requireDb().query(
    `INSERT INTO phone_models (brand, model, notes) VALUES ($1,$2,$3)
     ON CONFLICT (brand, model) DO UPDATE SET notes = EXCLUDED.notes, is_active = true, updated_at = now()
     RETURNING *`,
    [data.brand.trim(), data.model.trim(), data.notes || '']
  );
  return result.rows[0];
}

async function updateModel(data) {
  requireFields(data, ['id', 'brand', 'model']);
  const result = await requireDb().query(
    `UPDATE phone_models SET brand=$2, model=$3, notes=$4, is_active=true, updated_at=now() WHERE id=$1 RETURNING *`,
    [data.id, data.brand.trim(), data.model.trim(), data.notes || '']
  );
  if (!result.rowCount) throw new Error('Model HP tidak ditemukan.');
  return result.rows[0];
}

async function archiveModel(data) {
  requireFields(data, ['id']);
  const result = await requireDb().query(`UPDATE phone_models SET is_active=false, updated_at=now() WHERE id=$1 RETURNING *`, [data.id]);
  if (!result.rowCount) throw new Error('Model HP tidak ditemukan.');
  return result.rows[0];
}

function decodeImage(data) {
  requireFields(data, ['mimeType', 'data']);
  const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
  const extension = extensions[data.mimeType];
  if (!extension) throw new Error('Gambar harus JPG, PNG, atau WebP.');
  const buffer = Buffer.from(data.data, 'base64');
  if (!buffer.length || buffer.length > 2 * 1024 * 1024) throw new Error('Ukuran gambar maksimal 2 MB.');
  const valid = extension === '.jpg'
    ? buffer[0] === 0xff && buffer[1] === 0xd8
    : extension === '.png'
      ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
  if (!valid) throw new Error('Isi file gambar tidak valid.');
  return { buffer, extension };
}

async function uploadModelImage(data) {
  requireFields(data, ['id', 'mimeType', 'data']);
  const { buffer, extension } = decodeImage(data);
  const db = requireDb();
  const current = await db.query(`SELECT image_url FROM phone_models WHERE id=$1`, [data.id]);
  if (!current.rowCount) throw new Error('Model HP tidak ditemukan.');
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const fileName = `${data.id}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${extension}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, fileName), buffer, { flag: 'wx' });
  const imageUrl = `/uploads/models/${fileName}`;
  const result = await db.query(`UPDATE phone_models SET image_url=$2, updated_at=now() WHERE id=$1 RETURNING *`, [data.id, imageUrl]);
  const oldUrl = current.rows[0].image_url || '';
  if (oldUrl.startsWith('/uploads/models/')) fs.rmSync(path.join(UPLOAD_DIR, path.basename(oldUrl)), { force: true });
  return result.rows[0];
}

function removeGuideFile(url) {
  if (String(url || '').startsWith('/uploads/guides/')) fs.rmSync(path.join(GUIDE_UPLOAD_DIR, path.basename(url)), { force: true });
}

async function uploadGuideImage(data) {
  requireFields(data, ['id', 'type', 'mimeType', 'data']);
  const type = data.type === 'disassembly' ? 'disassembly' : guideMediaField(data.type);
  const { buffer, extension } = decodeImage(data);
  const db = requireDb();
  const current = await db.query(`SELECT * FROM repair_services WHERE id=$1`, [data.id]);
  if (!current.rowCount) throw new Error('Masalah servis tidak ditemukan.');
  fs.mkdirSync(GUIDE_UPLOAD_DIR, { recursive: true });
  const fileName = `${data.id}-${data.type}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${extension}`;
  fs.writeFileSync(path.join(GUIDE_UPLOAD_DIR, fileName), buffer, { flag: 'wx' });
  const imageUrl = `/uploads/guides/${fileName}`;
  if (data.type === 'disassembly') {
    const images = normalizeDisassembly(current.rows[0].disassembly_images);
    if (images.length >= 12) { removeGuideFile(imageUrl); throw new Error('Foto disassembly maksimal 12 langkah.'); }
    images.push({ url: imageUrl, caption: String(data.caption || '').trim() });
    const result = await db.query(`UPDATE repair_services SET disassembly_images=$2::jsonb, updated_at=now() WHERE id=$1 RETURNING *`, [data.id, JSON.stringify(images)]);
    return result.rows[0];
  }
  const field = type;
  const oldUrl = current.rows[0][field] || '';
  const result = await db.query(`UPDATE repair_services SET ${field}=$2, updated_at=now() WHERE id=$1 RETURNING *`, [data.id, imageUrl]);
  removeGuideFile(oldUrl);
  return result.rows[0];
}

async function updateGuideImages(data) {
  requireFields(data, ['id']);
  const images = normalizeDisassembly(data.disassemblyImages);
  const db = requireDb();
  const current = await db.query(`SELECT disassembly_images FROM repair_services WHERE id=$1`, [data.id]);
  if (!current.rowCount) throw new Error('Masalah servis tidak ditemukan.');
  const kept = new Set(images.map((item) => item.url));
  normalizeDisassembly(current.rows[0].disassembly_images).filter((item) => !kept.has(item.url)).forEach((item) => removeGuideFile(item.url));
  const result = await db.query(`UPDATE repair_services SET disassembly_images=$2::jsonb, updated_at=now() WHERE id=$1 RETURNING *`, [data.id, JSON.stringify(images)]);
  return result.rows[0];
}

function serviceCategory(value) {
  const category = String(value || '').toLowerCase();
  if (!['software', 'hardware'].includes(category)) throw new Error('Kategori masalah harus Software atau Hardware.');
  return category;
}

function guideMediaField(value) {
  const fields = {
    cause: 'cause_image_url',
    repair: 'repair_image_url',
    sparePart: 'spare_part_image_url',
  };
  if (!fields[value]) throw new Error('Tipe media panduan tidak valid.');
  return fields[value];
}

function normalizeDisassembly(value) {
  let items = value || [];
  if (typeof items === 'string') {
    try { items = JSON.parse(items || '[]'); }
    catch { throw new Error('Urutan disassembly tidak valid.'); }
  }
  if (!Array.isArray(items)) throw new Error('Urutan disassembly tidak valid.');
  if (items.length > 12) throw new Error('Foto disassembly maksimal 12 langkah.');
  return items
    .filter((item) => item && String(item.url || '').trim())
    .map((item) => ({ url: String(item.url).trim(), caption: String(item.caption || '').trim() }));
}

function serviceValues(data) {
  requireFields(data, ['phoneModelId', 'issueCategory', 'issueName']);
  const priceMin = Number(data.priceMin || 0);
  const priceMax = Number(data.priceMax || 0);
  if (!Number.isFinite(priceMin) || !Number.isFinite(priceMax) || priceMin < 0 || priceMax < priceMin) throw new Error('Rentang harga tidak valid.');
  return [data.phoneModelId, serviceCategory(data.issueCategory), data.issueName.trim(), data.symptoms || '', data.cause || '', data.repairMethod || '', data.assemblySteps || '', data.tools || '', data.spareParts || '', priceMin, priceMax, data.durationEstimate || ''];
}

async function createService(data) {
  const result = await requireDb().query(
    `INSERT INTO repair_services (phone_model_id, issue_category, issue_name, symptoms, cause, repair_method, assembly_steps, tools, spare_parts, price_min, price_max, duration_estimate)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    serviceValues(data)
  );
  return result.rows[0];
}

async function updateService(data) {
  requireFields(data, ['id']);
  const db = requireDb();
  const current = await db.query(`SELECT * FROM repair_services WHERE id=$1`, [data.id]);
  if (!current.rowCount) throw new Error('Masalah servis tidak ditemukan.');
  const row = current.rows[0];
  const merged = {
    phoneModelId: data.phoneModelId ?? row.phone_model_id,
    issueCategory: data.issueCategory ?? row.issue_category,
    issueName: data.issueName ?? row.issue_name,
    symptoms: data.symptoms ?? row.symptoms,
    cause: data.cause ?? row.cause,
    repairMethod: data.repairMethod ?? row.repair_method,
    assemblySteps: data.assemblySteps ?? row.assembly_steps,
    tools: data.tools ?? row.tools,
    spareParts: data.spareParts ?? row.spare_parts,
    priceMin: data.priceMin ?? row.price_min,
    priceMax: data.priceMax ?? row.price_max,
    durationEstimate: data.durationEstimate ?? row.duration_estimate
  };
  const result = await db.query(
    `UPDATE repair_services SET phone_model_id=$2, issue_category=$3, issue_name=$4, symptoms=$5, cause=$6, repair_method=$7, assembly_steps=$8, tools=$9, spare_parts=$10, price_min=$11, price_max=$12, duration_estimate=$13, is_active=true, updated_at=now()
     WHERE id=$1 RETURNING *`,
    [data.id, ...serviceValues(merged)]
  );
  return result.rows[0];
}

async function archiveService(data) {
  requireFields(data, ['id']);
  const result = await requireDb().query(`UPDATE repair_services SET is_active=false, updated_at=now() WHERE id=$1 RETURNING *`, [data.id]);
  if (!result.rowCount) throw new Error('Masalah servis tidak ditemukan.');
  return result.rows[0];
}

async function updateOrder(data) {
  requireFields(data, ['id']);
  if (data.status && !ORDER_STATUSES.includes(data.status)) throw new Error('Status tidak valid.');
  const result = await requireDb().query(
    `UPDATE service_orders
     SET status = COALESCE($2, status), final_total = COALESCE($3, final_total), technician_notes = COALESCE($4, technician_notes), updated_at = now()
     WHERE id = $1 RETURNING *`,
    [data.id, data.status || null, data.finalTotal == null ? null : Number(data.finalTotal), data.technicianNotes == null ? null : data.technicianNotes]
  );
  if (!result.rowCount) throw new Error('Order tidak ditemukan.');
  return result.rows[0];
}

async function tracking(value) {
  const q = String(value || '').trim();
  if (!q) throw new Error('Masukkan kode order, WhatsApp, atau kode member.');
  const phone = normalizePhone(q);
  const result = await requireDb().query(
    `SELECT * FROM service_orders
     WHERE order_code = $1 OR whatsapp_number = $2
     ORDER BY created_at DESC LIMIT 20`,
    [q.toUpperCase(), phone]
  );
  return result.rows;
}

async function publicChat(data) {
  requireFields(data, ['sessionId', 'message']);
  const db = requireDb();
  const thread = await db.query(
    `INSERT INTO chat_threads (session_id, customer_name, whatsapp_number)
     VALUES ($1,$2,$3)
     ON CONFLICT (session_id) DO UPDATE SET last_message_at = now()
     RETURNING *`,
    [data.sessionId, data.customerName || '', normalizePhone(data.whatsappNumber || '')]
  );
  await db.query(`INSERT INTO chat_messages (thread_id, sender_type, message) VALUES ($1,'public',$2)`, [thread.rows[0].id, data.message.trim()]);
  return thread.rows[0];
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'OPTIONS') return sendJson(res, { ok: true });
  try {
    if (url.pathname === '/api/health') return sendJson(res, { ok: true, service: 'prascell' });
    if (url.pathname === '/api/admin/login' && req.method === 'POST') {
      const body = await readJson(req);
      if (!ADMIN_PASSWORD || !ADMIN_SECRET || !safeEqual(body.password, ADMIN_PASSWORD)) return sendError(res, new Error('Password salah.'), 401);
      return sendJson(res, { ok: true, token: tokenFor(ADMIN_PASSWORD) });
    }
    if (url.pathname === '/api/public/services' && req.method === 'GET') return sendJson(res, { ok: true, ...(await listPublicServices()) });
    if (url.pathname === '/api/public/orders' && req.method === 'POST') return sendJson(res, { ok: true, order: await createOrder(await readJson(req)) });
    if (url.pathname === '/api/public/tracking' && req.method === 'GET') return sendJson(res, { ok: true, orders: await tracking(url.searchParams.get('q')) });
    if (url.pathname === '/api/public/chat' && req.method === 'POST') return sendJson(res, { ok: true, thread: await publicChat(await readJson(req)) });
    if (url.pathname.startsWith('/api/admin/')) {
      if (!isAuthed(req)) return sendError(res, new Error('Unauthorized'), 401);
      if (url.pathname === '/api/admin/dashboard' && req.method === 'GET') return sendJson(res, { ok: true, data: await dashboardData() });
      if (url.pathname === '/api/admin/models' && req.method === 'POST') return sendJson(res, { ok: true, model: await upsertModel(await readJson(req)) });
      if (url.pathname === '/api/admin/models' && req.method === 'PATCH') return sendJson(res, { ok: true, model: await updateModel(await readJson(req)) });
      if (url.pathname === '/api/admin/models' && req.method === 'DELETE') return sendJson(res, { ok: true, model: await archiveModel(await readJson(req)) });
      if (url.pathname === '/api/admin/models/image' && req.method === 'POST') return sendJson(res, { ok: true, model: await uploadModelImage(await readJson(req)) });
      if (url.pathname === '/api/admin/services' && req.method === 'POST') return sendJson(res, { ok: true, service: await createService(await readJson(req)) });
      if (url.pathname === '/api/admin/services' && req.method === 'PATCH') return sendJson(res, { ok: true, service: await updateService(await readJson(req)) });
      if (url.pathname === '/api/admin/services' && req.method === 'DELETE') return sendJson(res, { ok: true, service: await archiveService(await readJson(req)) });
      if (url.pathname === '/api/admin/services/image' && req.method === 'POST') return sendJson(res, { ok: true, service: await uploadGuideImage(await readJson(req)) });
      if (url.pathname === '/api/admin/services/images' && req.method === 'PATCH') return sendJson(res, { ok: true, service: await updateGuideImages(await readJson(req)) });
      if (url.pathname === '/api/admin/orders' && req.method === 'PATCH') return sendJson(res, { ok: true, order: await updateOrder(await readJson(req)) });
      if (url.pathname === '/api/admin/members' && req.method === 'POST') return sendJson(res, { ok: true, member: await createMember(await readJson(req)) });
    }
    if (req.method === 'GET' && url.pathname.startsWith('/uploads/models/')) {
      const fileName = path.basename(url.pathname);
      const filePath = path.join(UPLOAD_DIR, fileName);
      if (fileName && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.writeHead(200, { 'content-type': mime[path.extname(filePath)] || 'application/octet-stream', 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' });
        return fs.createReadStream(filePath).pipe(res);
      }
    }
    if (req.method === 'GET' && url.pathname.startsWith('/uploads/guides/')) {
      const fileName = path.basename(url.pathname);
      const filePath = path.join(GUIDE_UPLOAD_DIR, fileName);
      if (fileName && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.writeHead(200, { 'content-type': mime[path.extname(filePath)] || 'application/octet-stream', 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' });
        return fs.createReadStream(filePath).pipe(res);
      }
    }
    if (req.method === 'GET') {
      const filePath = path.join(STATIC_DIR, url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\//, ''));
      if (!filePath.startsWith(STATIC_DIR)) return sendError(res, new Error('Not found'), 404);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        res.writeHead(200, { 'content-type': mime[ext] || 'application/octet-stream', 'x-content-type-options': 'nosniff' });
        return fs.createReadStream(filePath).pipe(res);
      }
    }
    return sendError(res, new Error('Not found'), 404);
  } catch (error) {
    return sendError(res, error, error.message === 'Unauthorized' ? 401 : 400);
  }
}

if (require.main === module) {
  ensureSchema()
    .then(() => http.createServer(route).listen(PORT, () => console.log(`PrasCell admin/API listening on ${PORT}`)))
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = { ensureSchema, route, serviceCategory, serviceValues, guideMediaField, normalizeDisassembly };
