// app.js

const map = L.map('map').setView([39, -98], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let allFish = [];
let markers = [];

/* ---------------- LOAD FISH ---------------- */
async function loadFish() {
  const res = await fetch('/fish');
  allFish = await res.json();
  displayFish(allFish);
}

/* ---------------- DISPLAY TABLE + MAP ---------------- */
function displayFish(data) {
  const table = document.getElementById('fishTable');
  table.innerHTML = '';

  // Remove old markers
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  data.forEach(fish => {
    table.innerHTML += `
      <tr>
        <td>${fish.id}</td>
        <td>${fish.fish_type}</td>
        <td>${fish.lure_used}</td>
        <td>${fish.leader_length}</td>
        <td>${fish.city || ''}</td>
        <td>${fish.state || ''}</td>
        <td>${new Date(fish.caught_at).toLocaleString()}</td>
        <td><button onclick="deleteFish(${fish.id})">Delete</button></td>
      </tr>
    `;

    if (fish.latitude && fish.longitude) {
      const m = L.marker([fish.latitude, fish.longitude])
        .addTo(map)
        .bindPopup(`
          <strong>${fish.fish_type}</strong><br>
          ${fish.city || ''}, ${fish.state || ''}<br>
          Lure: ${fish.lure_used}<br>
          Leader: ${fish.leader_length} ft
        `);
      markers.push(m);
    }
  });

  if (markers.length) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.5));
  }
}

/* ---------------- GEOCODE FUNCTION ---------------- */
async function getCoordinates(city, state) {
  const query = `${city}, ${state}`;

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
  );

  const data = await response.json();

  if (data.length === 0) {
    return { latitude: null, longitude: null };
  }

  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon)
  };
}

/* ---------------- ADD FISH ---------------- */
document.getElementById('fishForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const city = document.getElementById('city').value;
  const state = document.getElementById('state').value;

  // Get coordinates from OpenStreetMap
  const coords = await getCoordinates(city, state);

  await fetch('/fish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fish_type: document.getElementById('fish_type').value,
      lure_used: document.getElementById('lure_used').value,
      leader_length: document.getElementById('leader_length').value,
      city: city,
      state: state,
      latitude: coords.latitude,
      longitude: coords.longitude
    })
  });

  document.getElementById('fishForm').reset();
  loadFish();
});

/* ---------------- DELETE FISH ---------------- */
async function deleteFish(id) {
  if (!confirm('Are you sure you want to delete this fish?')) return;

  await fetch(`/fish/${id}`, { method: 'DELETE' });
  loadFish();
}

/* ---------------- FILTERS ---------------- */
const filterForm = document.getElementById('filterForm');
const resetButton = document.getElementById('reset');

filterForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const lure = document.getElementById('filter_lure').value.toLowerCase();
  const min = document.getElementById('filter_min').value;
  const max = document.getElementById('filter_max').value;

  const minVal = min === "" ? null : parseFloat(min);
  const maxVal = max === "" ? null : parseFloat(max);

  const filtered = allFish.filter(f => {
    const lureMatch = lure === "" || f.lure_used.toLowerCase().includes(lure);
    const minMatch = minVal === null || f.leader_length >= minVal;
    const maxMatch = maxVal === null || f.leader_length <= maxVal;
    return lureMatch && minMatch && maxMatch;
  });

  displayFish(filtered);
});

resetButton.addEventListener('click', () => {
  document.getElementById('filter_lure').value = "";
  document.getElementById('filter_min').value = "";
  document.getElementById('filter_max').value = "";
  displayFish(allFish);
});

/* ---------------- INITIAL LOAD ---------------- */
loadFish();