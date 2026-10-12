const query = `[out:json][timeout:25];
(
  node["amenity"="fuel"]["name"](13.3,99.8,14.5,101.2);
  node["shop"="mall"]["name"](13.3,99.8,14.5,101.2);
);
out 10;
`;

const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);
const res = await fetch(url, { headers: { 'User-Agent': 'PooPoo-App/1.0' } });
const data = await res.json();
console.log('Total found:', data.elements.length);
console.log('Samples:', data.elements.slice(0, 3).map(e => ({
  name: e.tags.name,
  name_en: e.tags['name:en'],
  brand: e.tags.brand,
  amenity: e.tags.amenity || e.tags.shop,
  lat: e.lat,
  lon: e.lon
})));
