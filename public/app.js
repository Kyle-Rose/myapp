// ---------------- MAP SETUP ----------------
const map = L.map('map').setView([39, -98], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let allFish = [];
let markers = [];

// ---------------- LOAD FISH ----------------
async function loadFish() {
  const res = await fetch('/fish');
  allFish = await res.json();
  displayFish(allFish);
}

// ---------------- DISPLAY TABLE + MAP ----------------
function displayFish(data) {
  const table = document.getElementById('fishTable');
  table.innerHTML = '';

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
      const marker = L.marker([fish.latitude, fish.longitude])
        .addTo(map)
        .bindPopup(`
          <strong>${fish.fish_type}</strong><br>
          ${fish.city || ''}, ${fish.state || ''}<br>
          Lure: ${fish.lure_used}<br>
          Leader: ${fish.leader_length} ft
        `);

      markers.push(marker);
    }
  });

  if (markers.length > 0) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.5));
  }
}

// ---------------- GEOCODING ----------------
async function getCoordinates(city, state) {
  const query = `${city}, ${state}, USA`;

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
  );

  const data = await response.json();

  if (!data.length) {
    return { latitude: null, longitude: null };
  }

  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon)
  };
}

// ---------------- ADD FISH ----------------
document.getElementById('fishForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const city = document.getElementById('city').value;
  const state = document.getElementById('state').value;

  const coords = await getCoordinates(city, state);

  await fetch('/fish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fish_type: document.getElementById('fish_type').value,
      lure_used: document.getElementById('lure_used').value,
      leader_length: parseFloat(document.getElementById('leader_length').value),
      city,
      state,
      latitude: coords.latitude,
      longitude: coords.longitude
    })
  });

  document.getElementById('fishForm').reset();
  loadFish();
});

// ---------------- DELETE ----------------
async function deleteFish(id) {
  if (!confirm('Are you sure?')) return;

  await fetch(`/fish/${id}`, { method: 'DELETE' });
  loadFish();
}

// ---------------- FILTER ----------------
document.getElementById('filterForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const lure = document.getElementById('filter_lure').value.toLowerCase();
  const min = parseFloat(document.getElementById('filter_min').value);
  const max = parseFloat(document.getElementById('filter_max').value);

  const filtered = allFish.filter(f => {
    const lureMatch = !lure || f.lure_used.toLowerCase().includes(lure);
    const minMatch = !min || f.leader_length >= min;
    const maxMatch = !max || f.leader_length <= max;
    return lureMatch && minMatch && maxMatch;
  });

  displayFish(filtered);
});

// ---------------- RESET ----------------
document.getElementById('reset').addEventListener('click', () => {
  document.getElementById('filterForm').reset();
  displayFish(allFish);
});

// ---------------- INITIAL LOAD ----------------
loadFish();