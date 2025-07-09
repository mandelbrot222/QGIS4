const bounds = [[702778.5362193923,1128740.1289492554],[703340.2985227177,1129681.980785934]];

const map = L.map('map', {
    crs: L.CRS.Simple,
    maxZoom: 5
});
L.imageOverlay('map.png', bounds).addTo(map);
map.fitBounds(bounds);

fetch('shapes.geojson')
  .then(r => r.json())
  .then(data => {
    L.geoJSON(data, {
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
  });
