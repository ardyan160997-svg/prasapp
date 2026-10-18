const assert = require('node:assert/strict');
const { normalizePhone, makeOrderCode, estimateTotal, requireFields } = require('../domain');
const { normalizeSoftwareLinks, normalizeSpecificationRows, serviceCategory, serviceValues, guideMediaField, normalizeDisassembly, warrantyEnd, effectiveWarrantyStatus, warrantyTransitionAllowed, stockValues, paymentTransitionAllowed, cashflowValues, inventoryUseValues } = require('../server');

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
assert.equal(serviceValues({ phoneModelId: 'm1', issueCategory: 'hardware', issueName: 'LCD', priceMin: 100000, priceMax: 200000, warrantyEnabled: 'false' })[12], false);
assert.equal(guideMediaField('cause'), 'cause_image_url');
assert.equal(guideMediaField('repair'), 'repair_image_url');
assert.equal(guideMediaField('sparePart'), 'spare_part_image_url');
assert.throws(() => guideMediaField('tools'), /Tipe media panduan/);
assert.deepEqual(normalizeDisassembly('[{"url":"/uploads/guides/a.png","caption":"Buka baut"}]'), [{ url: '/uploads/guides/a.png', caption: 'Buka baut' }]);
assert.deepEqual(normalizeDisassembly([{ url: '/uploads/guides/a.png', caption: '  Buka baut  ' }, { url: '', caption: 'skip' }]), [{ url: '/uploads/guides/a.png', caption: 'Buka baut' }]);
assert.throws(() => normalizeDisassembly(Array.from({ length: 13 }, (_, i) => ({ url: `/x/${i}.png` }))), /maksimal 12/);
assert.equal(warrantyEnd('2026-10-18T10:00:00.000Z', 30).toISOString(), '2026-11-17T10:00:00.000Z');
assert.equal(effectiveWarrantyStatus({ warranty_status: 'aktif', warranty_ends_at: '2026-11-17T10:00:00.000Z' }, new Date('2026-11-01T00:00:00.000Z')), 'aktif');
assert.equal(effectiveWarrantyStatus({ warranty_status: 'aktif', warranty_ends_at: '2026-11-17T10:00:00.000Z' }, new Date('2026-11-18T00:00:00.000Z')), 'kedaluwarsa');
assert.equal(effectiveWarrantyStatus({ warranty_status: 'klaim', warranty_ends_at: '2026-10-01T00:00:00.000Z' }, new Date('2026-11-18T00:00:00.000Z')), 'klaim');
assert.equal(warrantyTransitionAllowed('aktif', 'klaim'), true);
assert.equal(warrantyTransitionAllowed('klaim', 'disetujui'), true);
assert.equal(warrantyTransitionAllowed('disetujui', 'selesai'), true);
assert.equal(warrantyTransitionAllowed('aktif', 'selesai'), false);
assert.equal(warrantyTransitionAllowed('ditolak', 'aktif'), false);
assert.deepEqual(stockValues({ name: '  LCD A55 ', sku: ' lcd-a55 ', quantity: '4', minimumStock: '2', buyPrice: '100000', sellPrice: '150000' }), {
  name: 'LCD A55', sku: 'LCD-A55', category: 'Sparepart', quantity: 4, minimumStock: 2, buyPrice: 100000, sellPrice: 150000, location: '', notes: '', isActive: true,
});
assert.throws(() => stockValues({ name: '', quantity: 1 }), /Nama barang wajib/);
assert.throws(() => stockValues({ name: 'LCD', quantity: -1 }), /Stok tidak valid/);
assert.equal(paymentTransitionAllowed('belum_lunas', 'lunas'), true);
assert.equal(paymentTransitionAllowed('lunas', 'belum_lunas'), false);
assert.deepEqual(cashflowValues({ type: 'income', amount: '150000', category: 'Servis', description: '  Ganti LCD ' }), { type: 'income', amount: 150000, category: 'Servis', description: 'Ganti LCD', occurredAt: null });
assert.throws(() => cashflowValues({ type: 'income', amount: 0, description: 'X' }), /Nominal/);
assert.deepEqual(inventoryUseValues({ itemId: 'item-1', orderId: 'order-1', quantity: '2', usageType: 'warranty', notes: ' LCD baru ', operationId: 'use-1' }), { itemId: 'item-1', orderId: 'order-1', quantity: 2, usageType: 'warranty', notes: 'LCD baru', operationId: 'use-1' });
assert.throws(() => inventoryUseValues({ itemId: 'x', orderId: 'y', quantity: 0, usageType: 'service', operationId: 'use-2' }), /Jumlah/);
assert.throws(() => inventoryUseValues({ itemId: 'x', orderId: 'y', quantity: 1, usageType: 'service' }), /ID operasi/);
assert.deepEqual(normalizeSoftwareLinks('Firmware Global | https://drive.google.com/file/d/123\nUSB Driver | https://example.com/driver.zip'), [
  { label: 'Firmware Global', url: 'https://drive.google.com/file/d/123' },
  { label: 'USB Driver', url: 'https://example.com/driver.zip' },
]);
assert.throws(() => normalizeSoftwareLinks('Firmware | http://example.com/file.zip'), /https/);
assert.throws(() => normalizeSoftwareLinks('bukan link'), /tidak valid/);
assert.deepEqual(normalizeSpecificationRows('[{"category":"platform","label":"Chipset","value":"XRing O3"}]'), [{ category: 'PLATFORM', label: 'Chipset', value: 'XRing O3' }]);
assert.deepEqual(normalizeSpecificationRows([{ category: '', label: 'RAM', value: '12 GB' }, { category: 'DISPLAY', label: '', value: '' }]), [{ category: 'LAINNYA', label: 'RAM', value: '12 GB' }]);
assert.throws(() => normalizeSpecificationRows('{bad json}'), /tidak valid/);
console.log('PrasCell domain tests passed');
