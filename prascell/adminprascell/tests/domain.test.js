const assert = require('node:assert/strict');
const { normalizePhone, makeOrderCode, estimateTotal, requireFields } = require('../domain');

assert.equal(normalizePhone('0812-3456-7890'), '6281234567890');
assert.equal(normalizePhone('81234567890'), '6281234567890');
assert.match(makeOrderCode(new Date('2026-10-12T00:00:00Z'), () => 0), /^CELL-261012-[A-F0-9]{6}$/);
assert.equal(estimateTotal([{ price: 150000 }, { price: '50000' }]), 200000);
assert.throws(() => requireFields({ name: '' }, ['name']), /Field wajib/);
console.log('PrasCell domain tests passed');
