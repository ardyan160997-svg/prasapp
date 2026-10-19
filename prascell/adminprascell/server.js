const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Pool } = require('pg');
const { normalizePhone, makeOrderCode, estimateTotal, requireFields, ORDER_STATUSES } = require('./domain');
const { toAvif } = require('../../shared/image-converter');

const PORT = Number(process.env.PORT || 3010);
const STATIC_DIR = path.join(__dirname, 'dist');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads', 'models');
const GUIDE_UPLOAD_DIR = process.env.GUIDE_UPLOAD_DIR || path.join(__dirname, 'uploads', 'guides');
const INVENTORY_UPLOAD_DIR = process.env.INVENTORY_UPLOAD_DIR || path.join(__dirname, 'uploads', 'inventory');
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

function normalizeSoftwareLinks(value) {
  const rows = Array.isArray(value)
    ? value
    : String(value || '').split(/\r?\n/).filter((line) => line.trim()).map((line) => {
      const divider = line.indexOf('|');
      return divider < 0 ? { label: 'Download', url: line.trim() } : { label: line.slice(0, divider).trim(), url: line.slice(divider + 1).trim() };
    });
  if (rows.length > 20) throw new Error('Link software maksimal 20 per model.');
  return rows.map((item) => {
    const label = String(item?.label || 'Download').trim().slice(0, 80) || 'Download';
    const url = String(item?.url || '').trim();
    let parsed;
    try { parsed = new URL(url); } catch { throw new Error(`Link software tidak valid: ${label}`); }
    if (parsed.protocol !== 'https:') throw new Error(`Link software harus memakai https: ${label}`);
    return { label, url };
  });
}

function normalizeSpecificationRows(value) {
  let rows = value;
  if (typeof rows === 'string') {
    try { rows = JSON.parse(rows || '[]'); } catch { throw new Error('Format tabel spesifikasi tidak valid.'); }
  }
  if (!Array.isArray(rows)) throw new Error('Tabel spesifikasi harus berupa daftar baris.');
  if (rows.length > 120) throw new Error('Spesifikasi maksimal 120 baris per model.');
  return rows.map((item) => ({
    category: String(item?.category || 'LAINNYA').trim().slice(0, 40).toUpperCase() || 'LAINNYA',
    label: String(item?.label || '').trim().slice(0, 80),
    value: String(item?.value || '').trim().slice(0, 2000),
  })).filter((item) => item.label || item.value);
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
      specification_rows jsonb NOT NULL DEFAULT '[]'::jsonb,
      software_links jsonb NOT NULL DEFAULT '[]'::jsonb,
      image_url text NOT NULL DEFAULT '',
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (brand, model)
    )
  `);
  await db.query(`ALTER TABLE phone_models ADD COLUMN IF NOT EXISTS image_url text NOT NULL DEFAULT ''`);
  await db.query(`ALTER TABLE phone_models ADD COLUMN IF NOT EXISTS specification_rows jsonb NOT NULL DEFAULT '[]'::jsonb`);
  await db.query(`ALTER TABLE phone_models ADD COLUMN IF NOT EXISTS software_links jsonb NOT NULL DEFAULT '[]'::jsonb`);
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
  await db.query(`ALTER TABLE repair_services ADD COLUMN IF NOT EXISTS warranty_enabled boolean NOT NULL DEFAULT false`);
  await db.query(`ALTER TABLE repair_services ADD COLUMN IF NOT EXISTS warranty_days integer NOT NULL DEFAULT 0`);
  await db.query(`ALTER TABLE repair_services ADD COLUMN IF NOT EXISTS warranty_scope text NOT NULL DEFAULT 'jasa'`);
  await db.query(`ALTER TABLE repair_services ADD COLUMN IF NOT EXISTS warranty_terms text NOT NULL DEFAULT ''`);
  await db.query(`ALTER TABLE repair_services ADD COLUMN IF NOT EXISTS warranty_exclusions text NOT NULL DEFAULT ''`);
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
  await db.query(`ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS repair_service_id uuid REFERENCES repair_services(id) ON DELETE SET NULL`);
  await db.query(`ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS warranty_code text UNIQUE`);
  await db.query(`ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS warranty_status text NOT NULL DEFAULT 'tidak_aktif'`);
  await db.query(`ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS warranty_started_at timestamptz`);
  await db.query(`ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS warranty_ends_at timestamptz`);
  await db.query(`ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS warranty_scope text NOT NULL DEFAULT ''`);
  await db.query(`ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS warranty_terms text NOT NULL DEFAULT ''`);
  await db.query(`ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS warranty_exclusions text NOT NULL DEFAULT ''`);
  await db.query(`ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS warranty_claim_notes text NOT NULL DEFAULT ''`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS warranty_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
      status text NOT NULL,
      notes text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
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
  await db.query(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      sku text NOT NULL DEFAULT '',
      category text NOT NULL DEFAULT 'Sparepart',
      quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
      minimum_stock integer NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
      buy_price integer NOT NULL DEFAULT 0 CHECK (buy_price >= 0),
      sell_price integer NOT NULL DEFAULT 0 CHECK (sell_price >= 0),
      location text NOT NULL DEFAULT '',
      notes text NOT NULL DEFAULT '',
      image_url text NOT NULL DEFAULT '',
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.query(`ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS image_url text NOT NULL DEFAULT ''`);
  fs.mkdirSync(INVENTORY_UPLOAD_DIR, { recursive: true });
  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS inventory_items_sku_unique ON inventory_items (upper(sku)) WHERE sku <> ''`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS cashflow_entries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      entry_type text NOT NULL CHECK (entry_type IN ('income','outcome')),
      amount integer NOT NULL CHECK (amount > 0),
      category text NOT NULL DEFAULT 'Lainnya',
      description text NOT NULL,
      source_type text NOT NULL DEFAULT 'manual',
      source_key text,
      order_id uuid REFERENCES service_orders(id) ON DELETE RESTRICT,
      inventory_item_id uuid REFERENCES inventory_items(id) ON DELETE RESTRICT,
      occurred_at timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS cashflow_entries_source_key_unique ON cashflow_entries (source_key) WHERE source_key IS NOT NULL`);
  await db.query(`ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'belum_lunas'`);
  await db.query(`ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS paid_at timestamptz`);
  await db.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_orders_payment_status_check') THEN
        ALTER TABLE service_orders ADD CONSTRAINT service_orders_payment_status_check CHECK (payment_status IN ('belum_lunas','lunas'));
      END IF;
    END $$
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
      quantity_before integer NOT NULL,
      quantity_change integer NOT NULL,
      quantity_after integer NOT NULL,
      notes text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.query(`ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS movement_type text NOT NULL DEFAULT 'adjustment'`);
  await db.query(`ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES service_orders(id) ON DELETE RESTRICT`);
  await db.query(`ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS unit_cost integer NOT NULL DEFAULT 0`);
  await db.query(`ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS cashflow_entry_id uuid REFERENCES cashflow_entries(id) ON DELETE RESTRICT`);
  await db.query(`ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS source_key text`);
  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS inventory_movements_source_key_unique ON inventory_movements (source_key) WHERE source_key IS NOT NULL`);
  await db.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_movements_type_check') THEN
        ALTER TABLE inventory_movements ADD CONSTRAINT inventory_movements_type_check CHECK (movement_type IN ('initial','purchase','adjustment','service','warranty'));
      END IF;
    END $$
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
    warrantyEnabled: Boolean(row.warranty_enabled),
    warrantyDays: Number(row.warranty_days || 0),
    warrantyScope: row.warranty_scope,
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
  const [members, models, services, orders, chats, inventory, cashflow] = await Promise.all([
    db.query(`SELECT * FROM members ORDER BY created_at DESC LIMIT 200`),
    db.query(`SELECT * FROM phone_models ORDER BY brand, model`),
    db.query(`SELECT rs.*, pm.brand, pm.model FROM repair_services rs LEFT JOIN phone_models pm ON pm.id = rs.phone_model_id ORDER BY rs.created_at DESC`),
    db.query(`SELECT so.*, COALESCE((SELECT jsonb_agg(we ORDER BY we.created_at) FROM warranty_events we WHERE we.order_id=so.id),'[]'::jsonb) AS warranty_history FROM service_orders so ORDER BY so.created_at DESC LIMIT 200`),
    db.query(`SELECT ct.*, (SELECT cm.sender_type FROM chat_messages cm WHERE cm.thread_id=ct.id ORDER BY cm.created_at DESC LIMIT 1) AS latest_sender FROM chat_threads ct ORDER BY ct.last_message_at DESC LIMIT 100`),
    db.query(`SELECT ii.*, COALESCE((SELECT jsonb_agg(im ORDER BY im.created_at DESC) FROM (SELECT * FROM inventory_movements WHERE item_id=ii.id ORDER BY created_at DESC LIMIT 20) im),'[]'::jsonb) AS movements FROM inventory_items ii ORDER BY ii.is_active DESC, ii.name`),
    db.query(`SELECT cf.*, so.order_code, ii.name AS inventory_name FROM cashflow_entries cf LEFT JOIN service_orders so ON so.id=cf.order_id LEFT JOIN inventory_items ii ON ii.id=cf.inventory_item_id ORDER BY cf.occurred_at DESC, cf.created_at DESC LIMIT 500`),
  ]);
  const normalizedOrders = orders.rows.map((order) => ({ ...order, warranty_status: effectiveWarrantyStatus(order) }));
  const notifications = {
    warranties: normalizedOrders.filter((order) => ['klaim', 'disetujui'].includes(order.warranty_status)).length,
    chats: chats.rows.filter((chat) => chat.latest_sender === 'public').length,
    orders: normalizedOrders.filter((order) => !['diambil', 'batal'].includes(order.status)).length,
    stock: inventory.rows.filter((item) => item.is_active && Number(item.quantity) <= Number(item.minimum_stock)).length,
    cashflow: normalizedOrders.filter((order) => order.payment_status !== 'lunas' && Number(order.final_total || order.estimate_total || 0) > 0).length,
  };
  notifications.home = notifications.warranties + notifications.chats + notifications.orders + notifications.stock;
  const cashflowSummary = cashflow.rows.reduce((summary, entry) => {
    const amount = Number(entry.amount || 0);
    if (entry.entry_type === 'income') summary.income += amount;
    else summary.outcome += amount;
    summary.balance = summary.income - summary.outcome;
    return summary;
  }, { income: 0, outcome: 0, balance: 0 });
  return { members: members.rows, models: models.rows, services: services.rows, orders: normalizedOrders, chats: chats.rows, inventory: inventory.rows, cashflow: cashflow.rows, cashflowSummary, notifications, statuses: ORDER_STATUSES };
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
  const db = requireDb();
  if (data.repairServiceId) {
    const service = await db.query(`SELECT 1 FROM repair_services WHERE id=$1 AND is_active=true`, [data.repairServiceId]);
    if (!service.rowCount) throw new Error('Layanan tidak ditemukan.');
  }
  const member = data.createMember ? await createMember({ fullName: data.customerName, whatsappNumber: phone, email: data.email || '', deviceNotes: `${data.phoneBrand || ''} ${data.phoneModel || ''}`.trim() }) : null;
  const result = await db.query(
    `INSERT INTO service_orders (order_code, member_id, customer_name, whatsapp_number, phone_brand, phone_model, issue_description, estimate_total, repair_service_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [makeOrderCode(), member?.id || null, data.customerName.trim(), phone, data.phoneBrand || '', data.phoneModel || '', data.issueDescription.trim(), Number(data.estimateTotal || 0), data.repairServiceId || null]
  );
  return result.rows[0];
}

async function upsertModel(data) {
  requireFields(data, ['brand', 'model']);
  const result = await requireDb().query(
    `INSERT INTO phone_models (brand, model, notes, specification_rows, software_links) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb)
     ON CONFLICT (brand, model) DO UPDATE SET notes = EXCLUDED.notes, specification_rows = EXCLUDED.specification_rows, software_links = EXCLUDED.software_links, is_active = true, updated_at = now()
     RETURNING *`,
    [data.brand.trim(), data.model.trim(), data.notes || '', JSON.stringify(normalizeSpecificationRows(data.specificationRows)), JSON.stringify(normalizeSoftwareLinks(data.softwareLinksText ?? data.softwareLinks))]
  );
  return result.rows[0];
}

async function updateModel(data) {
  requireFields(data, ['id', 'brand', 'model']);
  const result = await requireDb().query(
    `UPDATE phone_models SET brand=$2, model=$3, notes=$4, specification_rows=$5::jsonb, software_links=$6::jsonb, is_active=true, updated_at=now() WHERE id=$1 RETURNING *`,
    [data.id, data.brand.trim(), data.model.trim(), data.notes || '', JSON.stringify(normalizeSpecificationRows(data.specificationRows)), JSON.stringify(normalizeSoftwareLinks(data.softwareLinksText ?? data.softwareLinks))]
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
  const { buffer } = decodeImage(data);
  const db = requireDb();
  const current = await db.query(`SELECT image_url FROM phone_models WHERE id=$1`, [data.id]);
  if (!current.rowCount) throw new Error('Model HP tidak ditemukan.');
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const fileName = `${data.id}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.avif`;
  const converted = await toAvif(buffer, { mimeType: data.mimeType });
  fs.writeFileSync(path.join(UPLOAD_DIR, fileName), converted, { flag: 'wx' });
  const imageUrl = `/uploads/models/${fileName}`;
  const result = await db.query(`UPDATE phone_models SET image_url=$2, updated_at=now() WHERE id=$1 RETURNING *`, [data.id, imageUrl]);
  const oldUrl = current.rows[0].image_url || '';
  if (oldUrl.startsWith('/uploads/models/')) fs.rmSync(path.join(UPLOAD_DIR, path.basename(oldUrl)), { force: true });
  return result.rows[0];
}

async function uploadInventoryImage(data) {
  requireFields(data, ['id', 'mimeType', 'data']);
  const { buffer } = decodeImage(data);
  const db = requireDb();
  const current = await db.query(`SELECT image_url FROM inventory_items WHERE id=$1`, [data.id]);
  if (!current.rowCount) throw new Error('Barang tidak ditemukan.');
  fs.mkdirSync(INVENTORY_UPLOAD_DIR, { recursive: true });
  const fileName = `${data.id}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.avif`;
  const converted = await toAvif(buffer, { mimeType: data.mimeType });
  fs.writeFileSync(path.join(INVENTORY_UPLOAD_DIR, fileName), converted, { flag: 'wx' });
  const imageUrl = `/uploads/inventory/${fileName}`;
  const result = await db.query(`UPDATE inventory_items SET image_url=$2, updated_at=now() WHERE id=$1 RETURNING *`, [data.id, imageUrl]);
  const oldUrl = current.rows[0].image_url || '';
  if (oldUrl.startsWith('/uploads/inventory/')) fs.rmSync(path.join(INVENTORY_UPLOAD_DIR, path.basename(oldUrl)), { force: true });
  return result.rows[0];
}

function removeGuideFile(url) {
  if (String(url || '').startsWith('/uploads/guides/')) fs.rmSync(path.join(GUIDE_UPLOAD_DIR, path.basename(url)), { force: true });
}

async function uploadGuideImage(data) {
  requireFields(data, ['id', 'type', 'mimeType', 'data']);
  const type = data.type === 'disassembly' ? 'disassembly' : guideMediaField(data.type);
  const { buffer } = decodeImage(data);
  const db = requireDb();
  const current = await db.query(`SELECT * FROM repair_services WHERE id=$1`, [data.id]);
  if (!current.rowCount) throw new Error('Masalah servis tidak ditemukan.');
  fs.mkdirSync(GUIDE_UPLOAD_DIR, { recursive: true });
  const fileName = `${data.id}-${data.type}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.avif`;
  const converted = await toAvif(buffer, { mimeType: data.mimeType });
  fs.writeFileSync(path.join(GUIDE_UPLOAD_DIR, fileName), converted, { flag: 'wx' });
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

function warrantyEnd(startedAt, days) {
  const date = new Date(startedAt);
  date.setUTCDate(date.getUTCDate() + Math.max(0, Number(days || 0)));
  return date;
}

function effectiveWarrantyStatus(row, now = new Date()) {
  if (row.warranty_status === 'aktif' && row.warranty_ends_at && new Date(row.warranty_ends_at) < now) return 'kedaluwarsa';
  return row.warranty_status || 'tidak_aktif';
}

function warrantyTransitionAllowed(from, to) {
  const transitions = {
    aktif: ['klaim', 'dibatalkan'],
    klaim: ['disetujui', 'ditolak', 'dibatalkan'],
    disetujui: ['selesai', 'dibatalkan'],
    ditolak: [],
    selesai: [],
    dibatalkan: [],
  };
  return from === to || Boolean(transitions[from]?.includes(to));
}

function paymentTransitionAllowed(from, to) {
  return from === to || (from === 'belum_lunas' && to === 'lunas');
}

function cashflowValues(data) {
  const type = String(data.type || '');
  if (!['income', 'outcome'].includes(type)) throw new Error('Tipe cashflow tidak valid.');
  const amount = Math.floor(Number(data.amount || 0));
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Nominal harus lebih dari 0.');
  const description = String(data.description || '').trim();
  if (!description) throw new Error('Keterangan wajib diisi.');
  return { type, amount, category: String(data.category || 'Lainnya').trim() || 'Lainnya', description, occurredAt: data.occurredAt || null };
}

function inventoryUseValues(data) {
  const quantity = Math.floor(Number(data.quantity || 0));
  if (!data.itemId || !data.orderId) throw new Error('Barang dan order wajib dipilih.');
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Jumlah pemakaian harus lebih dari 0.');
  const usageType = String(data.usageType || 'service');
  if (!['service', 'warranty'].includes(usageType)) throw new Error('Jenis pemakaian tidak valid.');
  const operationId = String(data.operationId || '').trim();
  if (!operationId) throw new Error('ID operasi pemakaian wajib diisi.');
  return { itemId: data.itemId, orderId: data.orderId, quantity, usageType, notes: String(data.notes || '').trim(), operationId };
}

function stockValues(data) {
  const name = String(data.name || '').trim();
  if (!name) throw new Error('Nama barang wajib diisi.');
  const quantity = Number(data.quantity ?? 0);
  const minimumStock = Number(data.minimumStock ?? 0);
  const buyPrice = Number(data.buyPrice ?? 0);
  const sellPrice = Number(data.sellPrice ?? 0);
  if (![quantity, minimumStock, buyPrice, sellPrice].every(Number.isFinite) || [quantity, minimumStock, buyPrice, sellPrice].some((value) => value < 0)) throw new Error('Stok tidak valid.');
  return {
    name,
    sku: String(data.sku || '').trim().toUpperCase(),
    category: String(data.category || 'Sparepart').trim() || 'Sparepart',
    quantity: Math.floor(quantity),
    minimumStock: Math.floor(minimumStock),
    buyPrice: Math.floor(buyPrice),
    sellPrice: Math.floor(sellPrice),
    location: String(data.location || '').trim(),
    notes: String(data.notes || '').trim(),
    isActive: data.isActive !== false && data.isActive !== 'false',
  };
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
  const warrantyDays = Math.max(0, Number(data.warrantyDays || 0));
  const warrantyScope = String(data.warrantyScope || 'jasa');
  if (!Number.isFinite(priceMin) || !Number.isFinite(priceMax) || priceMin < 0 || priceMax < priceMin) throw new Error('Rentang harga tidak valid.');
  if (!Number.isInteger(warrantyDays) || warrantyDays > 365) throw new Error('Durasi garansi harus 0–365 hari.');
  if (!['jasa', 'sparepart', 'jasa_sparepart'].includes(warrantyScope)) throw new Error('Cakupan garansi tidak valid.');
  const warrantyEnabled = data.warrantyEnabled === true || data.warrantyEnabled === 'true' || data.warrantyEnabled === 1 || data.warrantyEnabled === '1';
  return [data.phoneModelId, serviceCategory(data.issueCategory), data.issueName.trim(), data.symptoms || '', data.cause || '', data.repairMethod || '', data.assemblySteps || '', data.tools || '', data.spareParts || '', priceMin, priceMax, data.durationEstimate || '', warrantyEnabled, warrantyDays, warrantyScope, data.warrantyTerms || '', data.warrantyExclusions || ''];
}

async function createService(data) {
  const result = await requireDb().query(
    `INSERT INTO repair_services (phone_model_id, issue_category, issue_name, symptoms, cause, repair_method, assembly_steps, tools, spare_parts, price_min, price_max, duration_estimate, warranty_enabled, warranty_days, warranty_scope, warranty_terms, warranty_exclusions)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
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
    durationEstimate: data.durationEstimate ?? row.duration_estimate,
    warrantyEnabled: data.warrantyEnabled ?? row.warranty_enabled,
    warrantyDays: data.warrantyDays ?? row.warranty_days,
    warrantyScope: data.warrantyScope ?? row.warranty_scope,
    warrantyTerms: data.warrantyTerms ?? row.warranty_terms,
    warrantyExclusions: data.warrantyExclusions ?? row.warranty_exclusions
  };
  const result = await db.query(
    `UPDATE repair_services SET phone_model_id=$2, issue_category=$3, issue_name=$4, symptoms=$5, cause=$6, repair_method=$7, assembly_steps=$8, tools=$9, spare_parts=$10, price_min=$11, price_max=$12, duration_estimate=$13, warranty_enabled=$14, warranty_days=$15, warranty_scope=$16, warranty_terms=$17, warranty_exclusions=$18, is_active=true, updated_at=now()
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
  const db = requireDb();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const locked = await client.query(`SELECT * FROM service_orders WHERE id=$1 FOR UPDATE`, [data.id]);
    if (!locked.rowCount) throw new Error('Order tidak ditemukan.');
    const previousOrder = locked.rows[0];
    const nextPaymentStatus = data.paymentStatus || previousOrder.payment_status || 'belum_lunas';
    if (!['belum_lunas', 'lunas'].includes(nextPaymentStatus) || !paymentTransitionAllowed(previousOrder.payment_status || 'belum_lunas', nextPaymentStatus)) throw new Error('Transisi status pembayaran tidak valid.');
    if (data.repairServiceId) {
      const service = await client.query(`SELECT 1 FROM repair_services WHERE id=$1 AND is_active=true`, [data.repairServiceId]);
      if (!service.rowCount) throw new Error('Layanan tidak ditemukan atau sudah tidak aktif.');
    }
    const result = await client.query(
      `UPDATE service_orders
       SET status=COALESCE($2,status), final_total=COALESCE($3,final_total), technician_notes=COALESCE($4,technician_notes), repair_service_id=COALESCE($5,repair_service_id), payment_status=$6, paid_at=CASE WHEN $6='lunas' THEN COALESCE(paid_at,now()) ELSE paid_at END, updated_at=now()
       WHERE id=$1 RETURNING *`,
      [data.id, data.status || null, data.finalTotal == null ? null : Number(data.finalTotal), data.technicianNotes == null ? null : data.technicianNotes, data.repairServiceId || null, nextPaymentStatus]
    );
    if ((previousOrder.payment_status || 'belum_lunas') !== 'lunas' && nextPaymentStatus === 'lunas') {
      const paidAmount = Number(result.rows[0].final_total || result.rows[0].estimate_total || 0);
      if (paidAmount <= 0) throw new Error('Total pembayaran harus lebih dari 0 sebelum ditandai Lunas.');
      await client.query(
        `INSERT INTO cashflow_entries (entry_type,amount,category,description,source_type,source_key,order_id,occurred_at) VALUES ('income',$1,'Servis',$2,'order_payment',$3,$4,now()) ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING`,
        [paidAmount, `Pembayaran order ${result.rows[0].order_code}`, `order-payment:${data.id}`, data.id]
      );
    }
    if (!result.rowCount) throw new Error('Order tidak ditemukan.');
    let order = result.rows[0];
    if (order.status === 'selesai' && order.warranty_status === 'tidak_aktif' && order.repair_service_id) {
      const service = await client.query(`SELECT * FROM repair_services WHERE id=$1`, [order.repair_service_id]);
      const warranty = service.rows[0];
      if (warranty?.warranty_enabled && Number(warranty.warranty_days) > 0) {
        const startedAt = new Date();
        const activated = await client.query(
          `UPDATE service_orders SET warranty_code=$2, warranty_status='aktif', warranty_started_at=$3, warranty_ends_at=$4, warranty_scope=$5, warranty_terms=$6, warranty_exclusions=$7, updated_at=now() WHERE id=$1 RETURNING *`,
          [order.id, `GAR-${order.order_code}`, startedAt, warrantyEnd(startedAt, warranty.warranty_days), warranty.warranty_scope, warranty.warranty_terms, warranty.warranty_exclusions]
        );
        order = activated.rows[0];
        await client.query(`INSERT INTO warranty_events (order_id,status,notes) VALUES ($1,'aktif',$2)`, [order.id, `Garansi otomatis aktif ${warranty.warranty_days} hari.`]);
      }
    }
    await client.query('COMMIT');
    return order;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

async function tracking(value) {
  const orderCode = String(value || '').trim().toUpperCase();
  if (!orderCode) throw new Error('Masukkan kode order.');
  const result = await requireDb().query(
    `SELECT * FROM service_orders WHERE order_code = $1 LIMIT 1`,
    [orderCode]
  );
  return result.rows.map((order) => ({ ...order, warranty_status: effectiveWarrantyStatus(order) }));
}

async function updateWarranty(data) {
  requireFields(data, ['id', 'status']);
  const statuses = ['aktif', 'klaim', 'disetujui', 'ditolak', 'selesai', 'dibatalkan'];
  if (!statuses.includes(data.status)) throw new Error('Status garansi tidak valid.');
  const db = requireDb();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query(`SELECT * FROM service_orders WHERE id=$1 AND warranty_code IS NOT NULL FOR UPDATE`, [data.id]);
    if (!current.rowCount) throw new Error('Garansi tidak ditemukan.');
    const warranty = current.rows[0];
    if (effectiveWarrantyStatus(warranty) === 'kedaluwarsa') throw new Error('Garansi sudah kedaluwarsa.');
    if (!warrantyTransitionAllowed(warranty.warranty_status, data.status)) throw new Error('Transisi status garansi tidak valid.');
    const result = await client.query(`UPDATE service_orders SET warranty_status=$2, warranty_claim_notes=$3, updated_at=now() WHERE id=$1 RETURNING *`, [data.id, data.status, data.notes || '']);
    await client.query(`INSERT INTO warranty_events (order_id,status,notes) VALUES ($1,$2,$3)`, [data.id, data.status, data.notes || '']);
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
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

async function upsertStock(data) {
  const values = stockValues(data);
  const db = requireDb();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    let before = 0;
    let result;
    if (data.id) {
      const current = await client.query(`SELECT * FROM inventory_items WHERE id=$1 FOR UPDATE`, [data.id]);
      if (!current.rowCount) throw new Error('Barang tidak ditemukan.');
      before = Number(current.rows[0].quantity);
      result = await client.query(
        `UPDATE inventory_items SET name=$2,sku=$3,category=$4,quantity=$5,minimum_stock=$6,buy_price=$7,sell_price=$8,location=$9,notes=$10,is_active=$11,updated_at=now() WHERE id=$1 RETURNING *`,
        [data.id, values.name, values.sku, values.category, values.quantity, values.minimumStock, values.buyPrice, values.sellPrice, values.location, values.notes, values.isActive]
      );
    } else {
      result = await client.query(
        `INSERT INTO inventory_items (name,sku,category,quantity,minimum_stock,buy_price,sell_price,location,notes,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [values.name, values.sku, values.category, values.quantity, values.minimumStock, values.buyPrice, values.sellPrice, values.location, values.notes, values.isActive]
      );
    }
    const item = result.rows[0];
    if (values.quantity !== before) {
      const quantityChange = values.quantity - before;
      const movementType = data.movementType || (data.id ? 'adjustment' : 'initial');
      if (!['initial', 'purchase', 'adjustment'].includes(movementType)) throw new Error('Jenis perubahan stok tidak valid.');
      if (movementType === 'purchase' && quantityChange <= 0) throw new Error('Purchasing harus menambah stok.');
      const movement = await client.query(
        `INSERT INTO inventory_movements (item_id,quantity_before,quantity_change,quantity_after,movement_type,unit_cost,notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [item.id, before, quantityChange, values.quantity, movementType, values.buyPrice, String(data.movementNotes || (data.id ? 'Penyesuaian stok' : 'Stok awal')).trim()]
      );
      if (movementType === 'purchase') {
        const amount = quantityChange * values.buyPrice;
        if (amount <= 0) throw new Error('Harga beli wajib diisi untuk purchasing.');
        const ledger = await client.query(
          `INSERT INTO cashflow_entries (entry_type,amount,category,description,source_type,source_key,inventory_item_id) VALUES ('outcome',$1,'Purchasing',$2,'inventory_purchase',$3,$4) RETURNING id`,
          [amount, `Pembelian ${quantityChange} × ${item.name}`, `inventory-purchase:${movement.rows[0].id}`, item.id]
        );
        await client.query(`UPDATE inventory_movements SET cashflow_entry_id=$2 WHERE id=$1`, [movement.rows[0].id, ledger.rows[0].id]);
      }
    }
    await client.query('COMMIT');
    return item;
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') throw new Error('SKU sudah digunakan.');
    throw error;
  } finally {
    client.release();
  }
}

async function createCashflow(data) {
  const values = cashflowValues(data);
  const result = await requireDb().query(
    `INSERT INTO cashflow_entries (entry_type,amount,category,description,source_type,occurred_at) VALUES ($1,$2,$3,$4,'manual',COALESCE($5::timestamptz,now())) RETURNING *`,
    [values.type, values.amount, values.category, values.description, values.occurredAt]
  );
  return result.rows[0];
}

async function useInventory(data) {
  const values = inventoryUseValues(data);
  const db = requireDb();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const sourceKey = `inventory-use:${values.operationId}`;
    const existing = await client.query(`SELECT * FROM inventory_movements WHERE source_key=$1`, [sourceKey]);
    if (existing.rowCount) {
      await client.query('COMMIT');
      return existing.rows[0];
    }
    const itemResult = await client.query(`SELECT * FROM inventory_items WHERE id=$1 AND is_active=true FOR UPDATE`, [values.itemId]);
    if (!itemResult.rowCount) throw new Error('Barang tidak ditemukan atau tidak aktif.');
    const orderResult = await client.query(`SELECT * FROM service_orders WHERE id=$1 FOR UPDATE`, [values.orderId]);
    if (!orderResult.rowCount) throw new Error('Order tidak ditemukan.');
    const item = itemResult.rows[0];
    const before = Number(item.quantity);
    if (before < values.quantity) throw new Error('Stok tidak mencukupi.');
    if (values.usageType === 'warranty' && !orderResult.rows[0].warranty_code) throw new Error('Order tidak memiliki garansi.');
    const after = before - values.quantity;
    await client.query(`UPDATE inventory_items SET quantity=$2,updated_at=now() WHERE id=$1`, [item.id, after]);
    const movement = await client.query(
      `INSERT INTO inventory_movements (item_id,quantity_before,quantity_change,quantity_after,movement_type,order_id,unit_cost,notes,source_key) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [item.id, before, -values.quantity, after, values.usageType, values.orderId, Number(item.buy_price || 0), values.notes, sourceKey]
    );
    await client.query('COMMIT');
    return movement.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
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
      if (url.pathname === '/api/admin/warranties' && req.method === 'PATCH') return sendJson(res, { ok: true, warranty: await updateWarranty(await readJson(req)) });
      if (url.pathname === '/api/admin/inventory' && ['POST', 'PATCH'].includes(req.method)) return sendJson(res, { ok: true, item: await upsertStock(await readJson(req)) });
      if (url.pathname === '/api/admin/inventory/image' && req.method === 'POST') return sendJson(res, { ok: true, item: await uploadInventoryImage(await readJson(req)) });
      if (url.pathname === '/api/admin/inventory/use' && req.method === 'POST') return sendJson(res, { ok: true, movement: await useInventory(await readJson(req)) });
      if (url.pathname === '/api/admin/cashflow' && req.method === 'POST') return sendJson(res, { ok: true, entry: await createCashflow(await readJson(req)) });
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
    if (req.method === 'GET' && url.pathname.startsWith('/uploads/inventory/')) {
      const fileName = path.basename(url.pathname);
      const filePath = path.join(INVENTORY_UPLOAD_DIR, fileName);
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

module.exports = { ensureSchema, route, normalizeSoftwareLinks, normalizeSpecificationRows, serviceCategory, serviceValues, guideMediaField, normalizeDisassembly, warrantyEnd, effectiveWarrantyStatus, warrantyTransitionAllowed, stockValues, paymentTransitionAllowed, cashflowValues, inventoryUseValues };
