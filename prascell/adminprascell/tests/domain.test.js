const assert = require('node:assert/strict');
const { normalizePhone, makeOrderCode, estimateTotal, requireFields } = require('../domain');
const { serviceCategory, serviceValues } = require('../server');

assert.equal(normalizePhone('0812-3456-7890'), '6281234567890');
assert.equal(normalizePhone('81234567890'), '6281234567890');
assert.match(makeOrderCode(new Date('2026-10-12T00:00:00Z'), () => 0), /^CELL-261012-[A-F0-9]{6}$/);
assert.equal(estimateTotal([{ price: 150000 }, { price: '50000' }]), 200000);
assert.throws(() => requireFields({ name: '' }, ['name']), /Field wajib/);
assert.equal(serviceCategory('Software'), 'software');
assert.equal(serviceCategory('hardware'), 'hardware');
assert.throws(() => serviceCategory('jaringan'), /Software atau Hardware/);
assert.deepEqual(serviceValues({ phoneModelId: 'model-1', issueCategory: 'software', issueName: 'Bootloop', priceMin: '100000', priceMax: '250000' }).slice(0, 3), ['model-1', 'software', 'Bootloop']);
assert.throws(() => serviceValues({ phoneModelId: 'model-1', issueCategory: 'hardware', issueName: 'LCD', priceMin: '300000', priceMax: '100000' }), /Rentang harga/);
console.log('PrasCell domain tests passed');
