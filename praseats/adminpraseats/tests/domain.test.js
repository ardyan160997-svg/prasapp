const assert = require('node:assert/strict');
const { normalizePhone, calculateCart, requireFields, ORDER_STATUSES, PAYMENT_METHODS, FULFILLMENT_TYPES } = require('../domain');
assert.equal(normalizePhone('0812-3456'), '628123456');
assert.deepEqual(calculateCart([{ price: 12000, qty: 2 }, { price: 5000, qty: 1 }], 7000), { subtotal: 29000, deliveryFee: 7000, total: 36000 });
assert.throws(() => requireFields({ name: '' }, ['name']), /Field wajib/);
assert.ok(ORDER_STATUSES.includes('dimasak'));
assert.ok(PAYMENT_METHODS.includes('cod'));
assert.ok(FULFILLMENT_TYPES.includes('pickup'));
console.log('PrasEats domain tests passed');
