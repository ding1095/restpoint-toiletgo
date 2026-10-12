const mirrors = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter'
];

const bbox = '13.6,100.3,13.9,100.8';
const q = `[out:json][timeout:15];node["amenity"="fuel"](${bbox});out 20;`;

for (const m of mirrors) {
  try {
    const t0 = Date.now();
    const res = await fetch(m + '?data=' + encodeURIComponent(q), {
      headers: { 'User-Agent': 'PooPoo-App/1.0' },
      signal: AbortSignal.timeout(10000)
    });
    const dt = Date.now() - t0;
    if (res.ok) {
      const data = await res.json();
      console.log(`Mirror OK: ${m} (${dt}ms) elements: ${data.elements?.length}`);
    } else {
      console.log(`Mirror Status ${res.status}: ${m} (${dt}ms)`);
    }
  } catch (e) {
    console.log(`Mirror Error: ${m} - ${e.message}`);
  }
}
