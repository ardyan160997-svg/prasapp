const STORE_LOCATION = Object.freeze({ latitude: -7.555535424233545, longitude: 110.7448938988555 });

function calculateDeliveryFee(distanceMeters, pickupUsed = false) {
  const distance = Number(distanceMeters);
  if (!Number.isFinite(distance) || distance < 0) throw new Error('Jarak rute tidak valid.');
  if (!pickupUsed) return 0;
  if (distance <= 2000) return 0;
  if (distance <= 5000) return 5000;
  return 10000;
}

function deliveryTier(distanceMeters) {
  const distance = Number(distanceMeters);
  if (!Number.isFinite(distance) || distance < 0) throw new Error('Jarak rute tidak valid.');
  if (distance <= 2000) return 'under_2km';
  if (distance <= 5000) return 'two_to_five_km';
  return 'over_5km';
}

function buildOsrmRouteUrl(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('Share location wajib valid.');
  return `https://router.project-osrm.org/route/v1/driving/${STORE_LOCATION.longitude},${STORE_LOCATION.latitude};${lon},${lat}?overview=false&alternatives=false&steps=false`;
}

async function routeDistanceFromStore(latitude, longitude, fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== 'function') throw new Error('OSRM fetch tidak tersedia.');
  const response = await fetchImpl(buildOsrmRouteUrl(latitude, longitude), { headers: { 'user-agent': 'Prashoes/1.0 delivery-distance' } });
  if (!response.ok) throw new Error('Estimasi jarak belum tersedia. Coba lagi beberapa saat.');
  const json = await response.json();
  const route = Array.isArray(json.routes) ? json.routes[0] : null;
  const distance = Number(route?.distance);
  const duration = Number(route?.duration || 0);
  if (!Number.isFinite(distance)) throw new Error('Estimasi jarak belum tersedia. Coba lagi beberapa saat.');
  return { distanceMeters: Math.round(distance), durationSeconds: Math.round(duration) };
}

module.exports = { STORE_LOCATION, calculateDeliveryFee, deliveryTier, buildOsrmRouteUrl, routeDistanceFromStore };
