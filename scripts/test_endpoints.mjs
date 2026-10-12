const endpoints = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
];

const bbox = '13.7,100.5,13.8,100.6';
const q = `[out:json][timeout:15];node["amenity"="fuel"](${bbox});out 10;`;

for (const ep of endpoints) {
  try {
    const t0 = Date.now();
    const res = await fetch(ep + '?data=' + encodeURIComponent(q), {
      headers: { 'User-Agent': 'PooPoo-App/1.0' },
      signal: AbortSignal.timeout(8000)
    });
    const dt = Date.now() - t0;
    if (res.ok) {
      const data = await res.json();
      console.log(`Endpoint OK: ${ep} (${dt}ms) elements: ${data.elements?.length}`);
    } else {
      console.log(`Endpoint HTTP ${res.status}: ${ep} (${dt}ms)`);
    }
  } catch (e) {
    console.log(`Endpoint Error: ${ep} - ${e.message}`);
  }
}
