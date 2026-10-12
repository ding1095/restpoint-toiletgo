const https = require('https');

const query = `[out:json][timeout:25];
area["ISO3166-1"="TH"]->.searchArea;
(
  node["amenity"="fuel"]["brand"~"PTT|Bangchak|Shell|Caltex|PT"](area.searchArea);
);
out center 10;
`;

const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);
console.log('Querying Overpass API...');

const req = https.get(url, { headers: { 'User-Agent': 'PooPoo-ToiletFinder/1.0' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Success! Elements returned:', json.elements ? json.elements.length : 0);
      if (json.elements && json.elements.length > 0) {
        console.log('Sample POI:', JSON.stringify(json.elements[0], null, 2));
      }
    } catch (e) {
      console.log('Response status:', res.statusCode, data.slice(0, 300));
    }
  });
});
req.on('error', err => console.error('Error:', err.message));
