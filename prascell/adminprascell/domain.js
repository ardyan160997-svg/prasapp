function normalizePhone(value) {
  const digits = String(value || '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

function makeOrderCode(date = new Date(), random = Math.random) {
  const y = String(date.getFullYear()).slice(2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const suffix = Math.floor(random() * 0xffffff).toString(16).padStart(6, '0').toUpperCase();
  return `CELL-${y}${m}${d}-${suffix}`;
}

function estimateTotal(items = []) {
  return items.reduce((sum, item) => sum + Number(item?.price || 0), 0);
}

function requireFields(data, fields) {
  const missing = fields.filter((field) => !String(data?.[field] || '').trim());
  if (missing.length) throw new Error(`Field wajib: ${missing.join(', ')}`);
}

const ORDER_STATUSES = ['baru', 'dicek', 'menunggu_sparepart', 'dikerjakan', 'selesai', 'diambil', 'batal'];

module.exports = { normalizePhone, makeOrderCode, estimateTotal, requireFields, ORDER_STATUSES };
