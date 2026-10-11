const assert = require('node:assert/strict');
const { calculateDeliveryFee } = require('../delivery');

assert.equal(calculateDeliveryFee(1999, false), 0, 'delivery-only under 2 km is free');
assert.equal(calculateDeliveryFee(1999, true), 0, 'pickup + delivery under 2 km are both free');
assert.equal(calculateDeliveryFee(2001, false), 0, 'delivery-only over 2 km is the free service');
assert.equal(calculateDeliveryFee(2001, true), 5000, 'second service over 2–5 km costs Rp5.000');
assert.equal(calculateDeliveryFee(5000, true), 5000, '5 km boundary costs Rp5.000');
assert.equal(calculateDeliveryFee(5001, false), 0, 'delivery-only over 5 km remains the free service');
assert.equal(calculateDeliveryFee(5001, true), 10000, 'second service over 5 km costs Rp10.000');
assert.throws(() => calculateDeliveryFee(-1, false), /Jarak/);

console.log('delivery pricing tests passed');
