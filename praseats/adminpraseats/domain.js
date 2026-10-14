const ORDER_STATUSES = ['baru','diterima','dimasak','siap','diantar','selesai','batal'];
const PAYMENT_METHODS = ['qris','transfer','cod'];
const FULFILLMENT_TYPES = ['delivery','pickup'];
function normalizePhone(value='') { const digits=String(value).replace(/\D/g,''); if(!digits) return ''; if(digits.startsWith('62')) return digits; if(digits.startsWith('0')) return `62${digits.slice(1)}`; return digits; }
function rupiahNumber(value) { const n=Number(value||0); return Number.isFinite(n) && n>0 ? Math.round(n) : 0; }
function makeOrderCode(date=new Date()) { const stamp=date.toISOString().slice(2,10).replace(/-/g,''); const rand=Math.random().toString(36).slice(2,6).toUpperCase(); return `PE-${stamp}-${rand}`; }
function calculateCart(items=[], deliveryFee=0) { const subtotal=items.reduce((sum,item)=>sum+rupiahNumber(item.price)*Math.max(1,Number(item.qty||1)),0); const fee=rupiahNumber(deliveryFee); return { subtotal, deliveryFee: fee, total: subtotal+fee }; }
function requireFields(body, fields) { const missing=fields.filter((field)=>!String(body[field]??'').trim()); if(missing.length) throw new Error(`Field wajib: ${missing.join(', ')}`); }
module.exports={ ORDER_STATUSES, PAYMENT_METHODS, FULFILLMENT_TYPES, normalizePhone, rupiahNumber, makeOrderCode, calculateCart, requireFields };
