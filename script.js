const bounds = [[702778.5362193923,1128740.1289492554],[703340.2985227177,1129681.980785934]];

const map = L.map('map', {
    crs: L.CRS.Simple,
    maxZoom: 5
});
L.imageOverlay('map.png', bounds).addTo(map);
map.fitBounds(bounds);

const MOVE_STEP = 2;
const ROTATE_STEP = 1;
const SCALE_STEP = 0.05; // 5%

let geojsonData = null;
let geoLayer = null;

function draw() {
  if (geoLayer) map.removeLayer(geoLayer);
  geoLayer = L.geoJSON(geojsonData, {
    style: {
      color: '#ff7800',
      weight: 1,
      fillOpacity: 0.5
    },
    onEachFeature: function(feature, layer) {
      let props = feature.properties;
      let content = Object.keys(props).map(k => `<strong>${k}:</strong> ${props[k]}`).join('<br>');
      layer.bindPopup(content);
    }
  }).addTo(map);
}

function forEachCoord(geometry, cb) {
  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach(ring => ring.forEach(pt => cb(pt)));
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(poly => poly.forEach(ring => ring.forEach(pt => cb(pt))));
  }
}

function transformCoords(geometry, fn) {
  if (geometry.type === 'Polygon') {
    geometry.coordinates = geometry.coordinates.map(ring => ring.map(fn));
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates = geometry.coordinates.map(poly => poly.map(ring => ring.map(fn)));
  }
}

function getCenter(data) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  data.features.forEach(f => {
    forEachCoord(f.geometry, pt => {
      const [x, y] = pt;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });
  });
  return [(minX + maxX) / 2, (minY + maxY) / 2];
}

function translate(dx, dy) {
  geojsonData.features.forEach(f => {
    transformCoords(f.geometry, ([x, y]) => [x + dx, y + dy]);
  });
  draw();
}

function rotate(angle) {
  const [cx, cy] = getCenter(geojsonData);
  const rad = angle * Math.PI / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  geojsonData.features.forEach(f => {
    transformCoords(f.geometry, ([x, y]) => {
      const nx = cos * (x - cx) - sin * (y - cy) + cx;
      const ny = sin * (x - cx) + cos * (y - cy) + cy;
      return [nx, ny];
    });
  });
  draw();
}

function scale(factor) {
  const [cx, cy] = getCenter(geojsonData);
  geojsonData.features.forEach(f => {
    transformCoords(f.geometry, ([x, y]) => [cx + factor * (x - cx), cy + factor * (y - cy)]);
  });
  draw();
}

function download() {
  const dataStr = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geojsonData, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', 'transformed_shapes.geojson');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

fetch('shapes.geojson')
  .then(r => r.json())
  .then(data => {
    geojsonData = data;
    draw();
  });

document.getElementById('up').addEventListener('click', () => translate(0, -MOVE_STEP));
document.getElementById('down').addEventListener('click', () => translate(0, MOVE_STEP));
document.getElementById('left').addEventListener('click', () => translate(-MOVE_STEP, 0));
document.getElementById('right').addEventListener('click', () => translate(MOVE_STEP, 0));
document.getElementById('rotLeft').addEventListener('click', () => rotate(-ROTATE_STEP));
document.getElementById('rotRight').addEventListener('click', () => rotate(ROTATE_STEP));
document.getElementById('scaleDown').addEventListener('click', () => scale(1 - SCALE_STEP));
document.getElementById('scaleUp').addEventListener('click', () => scale(1 + SCALE_STEP));
document.getElementById('save').addEventListener('click', download);
