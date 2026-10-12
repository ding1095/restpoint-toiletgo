const bbox = '13.0,99.8,14.2,101.2'; // Bangkok & nearby provinces

const query = `[out:json][timeout:25];
(
  node["amenity"="fuel"](${bbox});
  node["shop"~"mall|supermarket"](${bbox});
  node["amenity"="toilets"](${bbox});
  node["highway"~"rest_area|services"](${bbox});
);
out 100;
`;

const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);
console.log('Testing query on Bangkok tile...');
const start = Date.now();
const res = await fetch(url, { headers: { 'User-Agent': 'PooPoo-App/1.0' } });
console.log('Status:', res.status, 'Time taken:', (Date.now() - start), 'ms');
if (res.ok) {
  const json = await res.json();
  console.log('Elements found in tile:', json.elements?.length);
  const sample = json.elements.slice(0, 5).map(e => ({
    name: e.tags?.name || e.tags?.brand || e.tags?.amenity,
    type: e.tags?.amenity || e.tags?.shop || e.tags?.highway,
    lat: e.lat,
    lon: e.lon
  }));
  console.log('Samples:', sample);
}
