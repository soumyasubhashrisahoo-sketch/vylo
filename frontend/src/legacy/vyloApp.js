/*
 * Vylo — original application logic, carried over verbatim from the source HTML <script>.
 * Only wiring changes:
 *   1. Leaflet is imported from npm (was a CDN <script>) and exposed as window.L.
 *   2. The DOMContentLoaded listener became the exported initVyloApp(), called once after React mounts.
 *   3. Functions/state referenced by inline handlers are exposed on window (as in a classic script).
 */
import L from 'leaflet';
window.L = L;

const MAP_TILE_PROVIDERS = {
  night: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    options: { maxZoom: 19, className: 'vylo-night-tiles', attribution: 'Tiles &copy; Esri &mdash; OpenStreetMap' }
  },
  esriStreet: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    options: { maxZoom: 19, attribution: 'Tiles &copy; Esri &mdash; OpenStreetMap' }
  },
  esriSat: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: { maxZoom: 19, attribution: 'Tiles &copy; Esri' }
  }
};

const APP_STATE = {
  theme: 'light',
  activeTab: 'routes',
  travelMode: 'foot',
  timeMode: 'night',
  selectedRouteKey: 'safe',
  closerLookRouteKey: 'safe',
  metroMapFilterLine: 'ALL',
  ratingStars: 5,
  selectedTags: ['Well-lit'],
  origin: {
    name: 'Lajpat Nagar, New Delhi',
    coords: [28.5677, 77.2433]
  },
  dest: {
    name: 'South Campus, Delhi University',
    coords: [28.5835, 77.1685]
  },
  routes: {
    safe: {
      key: 'safe',
      title: 'Safest route',
      via: 'Via Ring Road & South Ex Commercial Avenue',
      distanceKm: 8.6,
      durationMin: 12,
      lamps: 42,
      shops: 50,
      police: 1,
      cameras: 19,
      blindSpots: 0,
      liquorHazards: 0,
      crowdLabel: 'High Crowd',
      policeDistance: '320m away',
      nightActivityScore: 63,
      dayActivityScore: 89,
      womenEndorsements: 38,
      ratingAvg: 4.8,
      baseLights: 25,
      basePoliceShops: 22,
      baseCrowd: 18,
      baseCameras: 14,
      baseReports: 9,
      coords: [
        [28.5677, 77.2433],
        [28.5735, 77.2410],
        [28.5785, 77.2120],
        [28.5820, 77.1850],
        [28.5835, 77.1685]
      ],
      reviews: [
        { author: 'Ananya S. (Verified Woman)', rating: 5, text: 'Well-lit main avenue with open shops and police patrol near South Ex.' },
        { author: 'Priya M. (Verified Woman)', rating: 5, text: 'Preferred at night over the inner lane — steady foot traffic.' }
      ]
    },
    unsafe: {
      key: 'unsafe',
      title: 'Fastest route',
      via: 'Via Direct Inner Corridor',
      distanceKm: 7.5,
      durationMin: 10,
      lamps: 3,
      shops: 18,
      police: 0,
      cameras: 2,
      blindSpots: 4,
      liquorHazards: 2,
      crowdLabel: 'Isolated',
      policeDistance: '1.9km away',
      nightActivityScore: 27,
      dayActivityScore: 61,
      womenEndorsements: 4,
      ratingAvg: 2.9,
      baseLights: 6,
      basePoliceShops: 5,
      baseCrowd: 5,
      baseCameras: 3,
      baseReports: 4,
      coords: [
        [28.5677, 77.2433],
        [28.5605, 77.2395],
        [28.5625, 77.2065],
        [28.5695, 77.1755],
        [28.5835, 77.1685]
      ],
      reviews: [
        { author: 'Riya K. (Verified Woman)', rating: 2, text: '4 dark blind spots with closed shutters after 9 PM.' }
      ]
    }
  },
  rideCheck: {
    pickupMode: 'safeMainRoad',
    forceSafestRoad: true,
    safePickupSpot: {
      name: 'Lajpat Nagar Main Road Junction',
      walkMeters: 55
    }
  },
  infraVisibility: {
    all: true,
    shops: true,
    pharmacies: true,
    hospitals: true,
    fuel: true,
    cameras: true
  },
  gps: {
    active: false,
    watchId: null,
    coords: null,
    accuracy: null,
    marker: null,
    accuracyCircle: null,
    dropPinMode: false,
    source: 'none'
  },
  map: null,
  baseLayer: null,
  routeLayerGroup: null,
  infraLayerGroup: null,
  nearbyLayerGroup: null,
  activeTileKey: 'night',
  simTimer: null,
  simMarker: null,
  simIndex: 0,
  autocompleteTimers: { origin: null, dest: null },
  trustedContacts: [
    { id: 1, name: 'Mom', phone: '+91 98110 11223', relation: 'Parents' },
    { id: 2, name: 'Dad', phone: '+91 98110 44556', relation: 'Parents' }
  ],
  womenCirclePosts: [
    { alias: 'Member #412 (South Delhi Cluster)', time: '4m ago', text: 'Leaving Lajpat Nagar Metro Gate 2 — well-lit & crowded right now.' },
    { alias: 'Member #189 (South Campus Cluster)', time: '16m ago', text: 'Pink booth constable stationed near Satya Niketan main crossing.' }
  ],
  metroPlan: null,
  busPlan: null
};

// ==================== THEME SWITCHER ====================
function applyAppTheme(themeName) {
  APP_STATE.theme = themeName === 'dark' ? 'dark' : 'light';
  const isDark = APP_STATE.theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  try { localStorage.setItem('vylo_theme', APP_STATE.theme); } catch (e) {}

  const iconEl = document.getElementById('theme-toggle-icon');
  const labelEl = document.getElementById('theme-toggle-label');
  if (iconEl) iconEl.textContent = isDark ? '☀️' : '🌙';
  if (labelEl) labelEl.textContent = isDark ? 'Light' : 'Dark';

  if (APP_STATE.map) {
    setMapTileLayer(isDark ? 'night' : 'esriStreet');
  } else {
    APP_STATE.activeTileKey = isDark ? 'night' : 'esriStreet';
  }
}

function toggleAppTheme() {
  const next = APP_STATE.theme === 'dark' ? 'light' : 'dark';
  applyAppTheme(next);
  showToast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} Theme`);
}

// ==================== DELHI METRO (DMRC) DATA ====================
const DELHI_METRO_STATIONS = [
  { name: 'Rithala', lat: 28.7208, lon: 77.1072, lines: ['Red'], gate: 'Gate 1 (Rohini Sec-5)', firstTrain: '05:30 AM', lastTrain: '11:00 PM', sx: 145, sy: 65 },
  { name: 'Netaji Subhash Place', lat: 28.6958, lon: 77.1526, lines: ['Red', 'Pink'], gate: 'Gate 2 (Wazirpur Complex)', firstTrain: '05:38 AM', lastTrain: '11:12 PM', sx: 215, sy: 105 },
  { name: 'Inderlok', lat: 28.6732, lon: 77.1703, lines: ['Red', 'Green'], gate: 'Gate 1 (Main Market)', firstTrain: '05:42 AM', lastTrain: '11:18 PM', sx: 265, sy: 125 },
  { name: 'Kashmere Gate', lat: 28.6675, lon: 77.2282, lines: ['Yellow', 'Red', 'Violet'], gate: 'Gate 6 (ISBT Exit)', firstTrain: '05:30 AM', lastTrain: '11:30 PM', sx: 380, sy: 125 },
  { name: 'Chandni Chowk', lat: 28.6579, lon: 77.2301, lines: ['Yellow'], gate: 'Gate 5 (Town Hall)', firstTrain: '05:33 AM', lastTrain: '11:28 PM', sx: 380, sy: 155 },
  { name: 'New Delhi', lat: 28.6426, lon: 77.2207, lines: ['Yellow', 'Airport'], gate: 'Gate 2 (Ajmeri Gate)', firstTrain: '05:36 AM', lastTrain: '11:35 PM', sx: 380, sy: 185 },
  { name: 'Rajiv Chowk', lat: 28.6328, lon: 77.2197, lines: ['Yellow', 'Blue'], gate: 'Gate 7 (B-Block CP)', firstTrain: '05:40 AM', lastTrain: '11:40 PM', sx: 380, sy: 220 },
  { name: 'Mandi House', lat: 28.6258, lon: 77.2342, lines: ['Blue', 'Violet'], gate: 'Gate 3 (FICCI Auditorium)', firstTrain: '05:42 AM', lastTrain: '11:32 PM', sx: 435, sy: 220 },
  { name: 'Karol Bagh', lat: 28.6440, lon: 77.1885, lines: ['Blue'], gate: 'Gate 2 (Ajmal Khan Rd)', firstTrain: '05:35 AM', lastTrain: '11:25 PM', sx: 290, sy: 220 },
  { name: 'Rajouri Garden', lat: 28.6491, lon: 77.1225, lines: ['Blue', 'Pink'], gate: 'Gate 3 (Ring Road)', firstTrain: '05:30 AM', lastTrain: '11:18 PM', sx: 180, sy: 220 },
  { name: 'Dwarka Sec-21', lat: 28.5522, lon: 77.0583, lines: ['Blue', 'Airport'], gate: 'Gate 1 (Airport Link)', firstTrain: '05:25 AM', lastTrain: '11:05 PM', sx: 75, sy: 270 },
  { name: 'Noida City Centre', lat: 28.5747, lon: 77.3560, lines: ['Blue'], gate: 'Gate 2 (Sec-32)', firstTrain: '05:30 AM', lastTrain: '11:15 PM', sx: 645, sy: 245 },
  { name: 'Central Secretariat', lat: 28.6147, lon: 77.2119, lines: ['Yellow', 'Violet'], gate: 'Gate 1 (Rafi Marg)', firstTrain: '05:43 AM', lastTrain: '11:30 PM', sx: 380, sy: 260 },
  { name: 'Khan Market', lat: 28.6001, lon: 77.2270, lines: ['Violet'], gate: 'Gate 4 (Main Market)', firstTrain: '05:46 AM', lastTrain: '11:26 PM', sx: 445, sy: 285 },
  { name: 'Dilli Haat - INA', lat: 28.5744, lon: 77.2093, lines: ['Yellow', 'Pink'], gate: 'Gate 2 (Dilli Haat)', firstTrain: '05:48 AM', lastTrain: '11:24 PM', sx: 380, sy: 325 },
  { name: 'AIIMS', lat: 28.5689, lon: 77.2077, lines: ['Yellow'], gate: 'Gate 1 (OPD Main Gate)', firstTrain: '05:50 AM', lastTrain: '11:22 PM', sx: 380, sy: 355 },
  { name: 'Hauz Khas', lat: 28.5433, lon: 77.2066, lines: ['Yellow', 'Magenta'], gate: 'Gate 3 (Outer Ring Rd)', firstTrain: '05:53 AM', lastTrain: '11:18 PM', sx: 380, sy: 395 },
  { name: 'Saket', lat: 28.5206, lon: 77.2014, lines: ['Yellow'], gate: 'Gate 2 (Saidulajab)', firstTrain: '05:56 AM', lastTrain: '11:15 PM', sx: 380, sy: 435 },
  { name: 'HUDA City Centre', lat: 28.4593, lon: 77.0727, lines: ['Yellow'], gate: 'Gate 1 (Gurugram)', firstTrain: '05:30 AM', lastTrain: '11:00 PM', sx: 315, sy: 475 },
  { name: 'Lajpat Nagar', lat: 28.5700, lon: 77.2367, lines: ['Pink', 'Violet'], gate: 'Gate 2 (Central Market)', firstTrain: '05:45 AM', lastTrain: '11:25 PM', sx: 475, sy: 325 },
  { name: 'South Extension', lat: 28.5688, lon: 77.2212, lines: ['Pink'], gate: 'Gate 1 (Ring Road)', firstTrain: '05:47 AM', lastTrain: '11:23 PM', sx: 425, sy: 325 },
  { name: 'Sarojini Nagar', lat: 28.5745, lon: 77.1945, lines: ['Pink'], gate: 'Gate 1 (Main Market)', firstTrain: '05:50 AM', lastTrain: '11:20 PM', sx: 325, sy: 325 },
  { name: 'Durgabai Deshmukh South Campus', lat: 28.5889, lon: 77.1695, lines: ['Pink'], gate: 'Gate 1 (Benito Juarez Rd)', firstTrain: '05:53 AM', lastTrain: '11:17 PM', sx: 245, sy: 300 },
  { name: 'Dhaula Kuan', lat: 28.5918, lon: 77.1616, lines: ['Airport'], gate: 'Gate 2 (Skywalk Pink)', firstTrain: '05:35 AM', lastTrain: '11:20 PM', sx: 215, sy: 265 },
  { name: 'IGI Airport T3', lat: 28.5562, lon: 77.0999, lines: ['Airport'], gate: 'Arrival Concourse', firstTrain: '04:45 AM', lastTrain: '11:30 PM', sx: 135, sy: 305 },
  { name: 'Nehru Place', lat: 28.5515, lon: 77.2516, lines: ['Violet'], gate: 'Gate 2 (IT Market)', firstTrain: '05:50 AM', lastTrain: '11:20 PM', sx: 505, sy: 365 },
  { name: 'Kalkaji Mandir', lat: 28.5501, lon: 77.2588, lines: ['Violet', 'Magenta'], gate: 'Gate 1 (Mandir Marg)', firstTrain: '05:52 AM', lastTrain: '11:18 PM', sx: 530, sy: 395 },
  { name: 'IIT Delhi', lat: 28.5468, lon: 77.1932, lines: ['Magenta'], gate: 'Gate 3 (Main Gate)', firstTrain: '05:50 AM', lastTrain: '11:16 PM', sx: 315, sy: 395 },
  { name: 'Munirka', lat: 28.5579, lon: 77.1740, lines: ['Magenta'], gate: 'Gate 1 (JNU Road)', firstTrain: '05:48 AM', lastTrain: '11:14 PM', sx: 255, sy: 395 },
  { name: 'Botanical Garden', lat: 28.5641, lon: 77.3342, lines: ['Blue', 'Magenta'], gate: 'Gate 2 (Noida Sec-37)', firstTrain: '05:35 AM', lastTrain: '11:15 PM', sx: 615, sy: 395 }
];

const METRO_LINE_COLORS = {
  Yellow: { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300', hex: '#FACC15' },
  Pink: { bg: 'bg-pink-100', text: 'text-pink-900', border: 'border-pink-300', hex: '#F472B6' },
  Magenta: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-900', border: 'border-fuchsia-300', hex: '#E879F9' },
  Violet: { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300', hex: '#A78BFA' },
  Blue: { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300', hex: '#38BDF8' },
  Red: { bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-300', hex: '#F87171' },
  Airport: { bg: 'bg-orange-100', text: 'text-orange-900', border: 'border-orange-300', hex: '#FB923C' }
};

const METRO_LINE_SEQUENCES = {
  Yellow: ['Kashmere Gate', 'Chandni Chowk', 'New Delhi', 'Rajiv Chowk', 'Central Secretariat', 'Dilli Haat - INA', 'AIIMS', 'Hauz Khas', 'Saket', 'HUDA City Centre'],
  Pink: ['Netaji Subhash Place', 'Rajouri Garden', 'Durgabai Deshmukh South Campus', 'Sarojini Nagar', 'Dilli Haat - INA', 'South Extension', 'Lajpat Nagar'],
  Blue: ['Dwarka Sec-21', 'Rajouri Garden', 'Karol Bagh', 'Rajiv Chowk', 'Mandi House', 'Botanical Garden', 'Noida City Centre'],
  Magenta: ['Munirka', 'IIT Delhi', 'Hauz Khas', 'Kalkaji Mandir', 'Botanical Garden'],
  Violet: ['Kashmere Gate', 'Mandi House', 'Central Secretariat', 'Khan Market', 'Lajpat Nagar', 'Nehru Place', 'Kalkaji Mandir'],
  Red: ['Rithala', 'Netaji Subhash Place', 'Inderlok', 'Kashmere Gate'],
  Airport: ['New Delhi', 'Dhaula Kuan', 'IGI Airport T3', 'Dwarka Sec-21']
};

function getStationByName(name) {
  return DELHI_METRO_STATIONS.find(s => s.name === name) || DELHI_METRO_STATIONS[0];
}

function getLineSegmentStations(lineName, fromName, toName) {
  const seq = METRO_LINE_SEQUENCES[lineName] || [];
  const i1 = seq.indexOf(fromName);
  const i2 = seq.indexOf(toName);
  if (i1 === -1 || i2 === -1) return [getStationByName(fromName), getStationByName(toName)];
  const slice = i1 <= i2 ? seq.slice(i1, i2 + 1) : seq.slice(i2, i1 + 1).reverse();
  return slice.map(getStationByName);
}

function findNearestMetroStation(lat, lon) {
  let best = DELHI_METRO_STATIONS[0];
  let minDist = Infinity;
  for (const st of DELHI_METRO_STATIONS) {
    const d = haversineKm(lat, lon, st.lat, st.lon);
    if (d < minDist) {
      minDist = d;
      best = st;
    }
  }
  return { station: best, walkKm: minDist };
}

function computeDelhiMetroPlan(oCoords, dCoords) {
  const startInfo = findNearestMetroStation(oCoords[0], oCoords[1]);
  const endInfo = findNearestMetroStation(dCoords[0], dCoords[1]);
  const startSt = startInfo.station;
  const endSt = endInfo.station;

  const sharedLines = startSt.lines.filter(l => endSt.lines.includes(l));
  let primaryLine = sharedLines[0] || startSt.lines[0];
  let interchangeStation = null;
  let secondLine = null;
  let stationPath = [];

  if (sharedLines.length > 0) {
    stationPath = getLineSegmentStations(primaryLine, startSt.name, endSt.name);
  } else {
    const hub = DELHI_METRO_STATIONS.find(s =>
      s.lines.some(l => startSt.lines.includes(l)) && s.lines.some(l => endSt.lines.includes(l))
    );
    if (hub) {
      interchangeStation = hub;
      primaryLine = startSt.lines.find(l => hub.lines.includes(l)) || startSt.lines[0];
      secondLine = endSt.lines.find(l => hub.lines.includes(l)) || endSt.lines[0];
      const leg1 = getLineSegmentStations(primaryLine, startSt.name, hub.name);
      const leg2 = getLineSegmentStations(secondLine, hub.name, endSt.name).slice(1);
      stationPath = [...leg1, ...leg2];
    } else {
      secondLine = endSt.lines[0];
      stationPath = [startSt, endSt];
    }
  }

  const stopsCount = Math.max(1, stationPath.length - 1);
  const metroDistKm = Math.max(1.4, +(haversineKm(startSt.lat, startSt.lon, endSt.lat, endSt.lon) * 1.18).toFixed(1));
  const totalDistKm = +(metroDistKm + startInfo.walkKm + endInfo.walkKm).toFixed(1);
  const walkMins = Math.round(((startInfo.walkKm + endInfo.walkKm) / 5.0) * 60);
  const rideMins = Math.max(4, Math.round(stopsCount * 2.4) + (interchangeStation ? 5 : 0));
  const totalMins = Math.max(6, walkMins + rideMins);

  let fare = 10;
  if (metroDistKm > 32) fare = 60;
  else if (metroDistKm > 21) fare = 50;
  else if (metroDistKm > 12) fare = 40;
  else if (metroDistKm > 5) fare = 30;
  else if (metroDistKm > 2) fare = 20;

  const smartCardFare = Math.max(10, Math.round(fare * 0.9));
  const routeCoords = [oCoords, ...stationPath.map(s => [s.lat, s.lon]), dCoords];

  return {
    startSt,
    endSt,
    startWalkKm: startInfo.walkKm,
    endWalkKm: endInfo.walkKm,
    primaryLine,
    secondLine,
    interchangeStation,
    stationPath,
    stopsCount,
    metroDistKm,
    totalDistKm,
    totalMins,
    fare,
    smartCardFare,
    routeCoords
  };
}

function computeDelhiBusPlan(oName, dName, distKm) {
  const shortO = oName.split(',')[0];
  const shortD = dName.split(',')[0];
  const busRoutes = distKm > 12 ? 'Route 429 • 534 • AC-764' : distKm > 6 ? 'Route 543 • 433CL • AC-729' : 'Route 410 • 507 • Mudrika';
  const busMins = Math.max(10, Math.round((distKm / 19) * 60) + 5);
  const fareSlab = distKm > 10 ? '₹15–₹25' : '₹10–₹15';
  return {
    routes: busRoutes,
    durationMin: busMins,
    fareSlab,
    boardStop: `${shortO} Main Bus Stand`,
    dropStop: `${shortD} Bus Stop`
  };
}

function updateDelhiMetroUI(plan) {
  if (!plan) return;
  const lineBadge = document.getElementById('metro-line-badge');
  const stopsBadge = document.getElementById('metro-stops-badge');
  const fareBadge = document.getElementById('metro-fare-badge');
  const summaryEl = document.getElementById('metro-route-summary');
  const stripEl = document.getElementById('metro-stations-strip');

  const style = METRO_LINE_COLORS[plan.primaryLine] || METRO_LINE_COLORS.Yellow;
  if (lineBadge) {
    lineBadge.className = `px-2.5 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border} text-xs font-extrabold`;
    lineBadge.textContent = plan.interchangeStation
      ? `${plan.primaryLine} → ${plan.secondLine} Line`
      : `${plan.primaryLine} Line (Direct)`;
  }
  if (stopsBadge) stopsBadge.textContent = `${plan.stopsCount} stop${plan.stopsCount > 1 ? 's' : ''} • ${plan.totalMins} min`;
  if (fareBadge) fareBadge.textContent = `₹${plan.fare} Token / ₹${plan.smartCardFare} Card`;

  const boardEl = document.getElementById('metro-board-info');
  const pfEl = document.getElementById('metro-platform-info');
  const intEl = document.getElementById('metro-interchange-info');
  const timeEl = document.getElementById('metro-timing-info');
  if (boardEl) boardEl.textContent = `${plan.startSt.name} • ${plan.startSt.gate.split('(')[0].trim()}`;
  if (pfEl) pfEl.textContent = `PF 1 • 1st Coach (Women)`;
  if (intEl) intEl.textContent = plan.interchangeStation ? `Change @ ${plan.interchangeStation.name}` : 'Direct (No Change)';
  if (timeEl) timeEl.textContent = `${plan.startSt.firstTrain} – ${plan.startSt.lastTrain}`;

  if (summaryEl) {
    const walkText = plan.startWalkKm < 0.25 ? 'at station gate' : `${formatDistance(plan.startWalkKm)} walk to station`;
    if (plan.interchangeStation) {
      summaryEl.innerHTML = `Board at <strong>${plan.startSt.name} Metro (${plan.primaryLine} Line)</strong> (${walkText}) → Interchange at <strong>${plan.interchangeStation.name}</strong> to <strong>${plan.secondLine} Line</strong> → Exit at <strong>${plan.endSt.name}</strong>.`;
    } else {
      summaryEl.innerHTML = `Board at <strong>${plan.startSt.name} Metro (${plan.primaryLine} Line)</strong> (${walkText}) → Direct train to <strong>${plan.endSt.name} Metro</strong> (${plan.stopsCount} stops • No interchange).`;
    }
  }

  if (stripEl) {
    stripEl.innerHTML = plan.stationPath.map((st, idx) => {
      const isEnd = idx === 0 || idx === plan.stationPath.length - 1;
      const isHub = plan.interchangeStation && st.name === plan.interchangeStation.name;
      const chipClass = isEnd
        ? 'bg-gray-950 text-white font-bold'
        : isHub
          ? 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold'
          : 'bg-gray-100 text-gray-700 font-medium';
      const arrow = idx < plan.stationPath.length - 1 ? '<span class="text-gray-400 font-bold">→</span>' : '';
      return `<span class="px-2 py-1 rounded-lg ${chipClass} shrink-0">${st.name}</span>${arrow}`;
    }).join('');
  }
}

function updateDelhiBusUI(busPlan) {
  if (!busPlan) return;
  const badgeEl = document.getElementById('bus-routes-badge');
  const fareEl = document.getElementById('bus-fare-badge');
  const sumEl = document.getElementById('bus-route-summary');
  if (badgeEl) badgeEl.textContent = busPlan.routes;
  if (fareEl) fareEl.textContent = `${busPlan.fareSlab} (Free Pink Ticket for Women)`;
  if (sumEl) {
    sumEl.innerHTML = `Board at <strong>${busPlan.boardStop}</strong> → Alight at <strong>${busPlan.dropStop}</strong> (~${busPlan.durationMin} min) • Frequency: Every 8–10 mins • GPS-tracked low-floor DTC bus with CCTV &amp; marshals.`;
  }
}

// ==================== INTERACTIVE DELHI METRO SCHEMATIC MAP MODAL ====================
function openMetroMapModal() {
  const modal = document.getElementById('metro-map-modal');
  if (!modal) return;
  const corridorEl = document.getElementById('metro-modal-active-corridor');
  if (corridorEl && APP_STATE.metroPlan) {
    corridorEl.textContent = `${APP_STATE.metroPlan.startSt.name} → ${APP_STATE.metroPlan.endSt.name} (${APP_STATE.metroPlan.primaryLine} Line)`;
  }
  renderMetroSchematicSVG();
  if (APP_STATE.metroPlan?.startSt) {
    inspectMetroStation(APP_STATE.metroPlan.startSt.name);
  }
  modal.classList.remove('hidden');
}

function closeMetroMapModal() {
  document.getElementById('metro-map-modal')?.classList.add('hidden');
}

function filterMetroNetworkLine(lineName) {
  APP_STATE.metroMapFilterLine = lineName;
  document.querySelectorAll('.metro-line-filter').forEach(btn => {
    btn.classList.remove('ring-2', 'ring-indigo-500');
  });
  document.getElementById(`metro-filter-${lineName}`)?.classList.add('ring-2', 'ring-indigo-500');
  renderMetroSchematicSVG();
}

function renderMetroSchematicSVG() {
  const container = document.getElementById('delhi-metro-svg-container');
  if (!container) return;

  const filter = APP_STATE.metroMapFilterLine;
  const activeNames = new Set((APP_STATE.metroPlan?.stationPath || []).map(s => s.name));

  const linesSvg = Object.entries(METRO_LINE_SEQUENCES).map(([lineName, stNames]) => {
    const pts = stNames.map(n => getStationByName(n)).map(s => `${s.sx},${s.sy}`).join(' ');
    const color = (METRO_LINE_COLORS[lineName] || METRO_LINE_COLORS.Yellow).hex;
    const dimmed = filter !== 'ALL' && filter !== lineName;
    return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="${dimmed ? 3 : 6}" stroke-linecap="round" stroke-linejoin="round" opacity="${dimmed ? 0.18 : 0.92}" />`;
  }).join('');

  const stationsSvg = DELHI_METRO_STATIONS.map(st => {
    const isInterchange = st.lines.length > 1;
    const isInRoute = activeNames.has(st.name);
    const dimmed = filter !== 'ALL' && !st.lines.includes(filter);
    const mainColor = (METRO_LINE_COLORS[st.lines[0]] || METRO_LINE_COLORS.Yellow).hex;
    const safeName = st.name.replace(/'/g, "\\'");

    return `
      <g onclick="inspectMetroStation('${safeName}')" class="cursor-pointer" opacity="${dimmed ? 0.22 : 1}">
        ${isInRoute ? `<circle cx="${st.sx}" cy="${st.sy}" r="11" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="2,2" />` : ''}
        <circle cx="${st.sx}" cy="${st.sy}" r="${isInterchange ? 6.5 : 4.5}" fill="${isInterchange ? '#FFFFFF' : mainColor}" stroke="#0F1219" stroke-width="2" />
        <text x="${st.sx + 8}" y="${st.sy + 3}" fill="${isInRoute ? '#FDE68A' : '#E5E7EB'}" font-size="${isInRoute ? '9.5' : '8'}" font-weight="${isInRoute || isInterchange ? '700' : '500'}" font-family="Inter, sans-serif">${st.name.replace('Durgabai Deshmukh ', '')}</text>
      </g>
    `;
  }).join('');

  container.innerHTML = `
    <svg viewBox="0 0 740 510" class="w-full h-auto select-none">
      <rect width="740" height="510" fill="#0F1219" rx="14" />
      ${linesSvg}
      ${stationsSvg}
    </svg>
  `;
}

function inspectMetroStation(stationName) {
  const st = getStationByName(stationName);
  const box = document.getElementById('metro-station-inspector');
  if (!box || !st) return;

  const lineBadges = st.lines.map(l => {
    const c = METRO_LINE_COLORS[l] || METRO_LINE_COLORS.Yellow;
    return `<span class="px-2 py-0.5 rounded-full ${c.bg} ${c.text} border ${c.border} text-[10px] font-extrabold">${l} Line</span>`;
  }).join(' ');

  const safeName = st.name.replace(/'/g, "\\'");
  box.innerHTML = `
    <div class="flex items-center justify-between gap-2">
      <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Station Details</span>
      <span class="font-mono text-[10px] text-gray-500">${st.lat.toFixed(4)}, ${st.lon.toFixed(4)}</span>
    </div>
    <h4 class="text-base font-extrabold text-gray-950">${st.name} Metro</h4>
    <div class="flex flex-wrap gap-1">${lineBadges}</div>
    <div class="space-y-1 pt-1 text-[11px] text-gray-700">
      <p><strong>Recommended Exit:</strong> ${st.gate}</p>
      <p><strong>First / Last Train:</strong> ${st.firstTrain} – ${st.lastTrain}</p>
      <p><strong>Interchange:</strong> ${st.lines.length > 1 ? `Yes (${st.lines.join(' ↔ ')})` : 'Single-Line Station'}</p>
    </div>
    <div class="grid grid-cols-2 gap-1.5 pt-2">
      <button onclick="setStationAsRoutePoint('origin', '${safeName}')" class="py-1.5 px-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-950 text-[11px] font-bold transition">Set as Pickup</button>
      <button onclick="setStationAsRoutePoint('dest', '${safeName}')" class="py-1.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition">Set as Destination</button>
    </div>
  `;
}

function setStationAsRoutePoint(field, stationName) {
  const st = getStationByName(stationName);
  if (!st) return;
  const label = `${st.name} Metro Station, New Delhi`;
  APP_STATE[field] = { name: label, coords: [st.lat, st.lon] };
  document.getElementById(`input-${field}`).value = label;
  APP_STATE.travelMode = 'metro';
  setTravelMode('metro');
  closeMetroMapModal();
  showToast(`Updated ${field === 'origin' ? 'pickup' : 'destination'} to ${st.name} Metro`);
}

function viewMetroOnLiveMap() {
  APP_STATE.travelMode = 'metro';
  setTravelMode('metro');
  switchPrimaryTab('map');
}

// ==================== 1. PRIMARY TAB NAVIGATION ====================
function switchPrimaryTab(tabName) {
  APP_STATE.activeTab = tabName;
  document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));
  document.getElementById(`panel-${tabName}`)?.classList.remove('hidden');

  document.querySelectorAll('.primary-tab-btn').forEach(btn => {
    const isPanic = btn.id === 'tab-btn-panic';
    btn.className = isPanic
      ? 'primary-tab-btn px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition flex items-center gap-1.5 whitespace-nowrap'
      : 'primary-tab-btn px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-950 transition flex items-center gap-1.5 whitespace-nowrap';
  });

  const activeBtn = document.getElementById(`tab-btn-${tabName}`);
  if (activeBtn) {
    activeBtn.className = tabName === 'panic'
      ? 'primary-tab-btn px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white shadow-2xs transition flex items-center gap-1.5 whitespace-nowrap'
      : 'primary-tab-btn px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-gray-950 shadow-2xs transition flex items-center gap-1.5 whitespace-nowrap';
  }

  if (tabName === 'map') {
    if (!APP_STATE.map) {
      initLeafletMap();
    } else {
      setTimeout(() => {
        APP_STATE.map.invalidateSize();
        renderMapRoutes();
      }, 60);
    }
  } else if (tabName === 'safety') {
    renderSafetyPanel();
  } else if (tabName === 'panic') {
    renderTrustedContacts();
    renderWomenCircleFeed();
  }
}

// ==================== 2. LAPTOP GPS (HARDWARE / WI-FI / PERMISSIONS API / FALLBACK) ====================
async function applyResolvedUserLocation(lat, lon, accMeters, sourceLabel, setAsOrigin = true) {
  APP_STATE.gps.active = true;
  APP_STATE.gps.coords = [lat, lon];
  APP_STATE.gps.accuracy = accMeters;
  APP_STATE.gps.source = sourceLabel;

  const navDot = document.getElementById('nav-gps-dot');
  const headerInd = document.getElementById('header-gps-indicator');
  const mapDot = document.getElementById('map-gps-dot');
  const cardDot = document.getElementById('card-gps-dot');
  const headerLabel = document.getElementById('header-gps-label');
  const mapStatusText = document.getElementById('map-gps-status-text');
  const cardTitle = document.getElementById('card-gps-title');
  const cardSub = document.getElementById('card-gps-subtitle');

  if (navDot) navDot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-500';
  if (headerInd) headerInd.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-ping';
  if (mapDot) mapDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping';
  if (cardDot) cardDot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-ping';
  if (headerLabel) headerLabel.textContent = sourceLabel;
  if (mapStatusText) mapStatusText.textContent = `${sourceLabel} (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
  if (cardTitle) cardTitle.textContent = `✓ ${sourceLabel}`;
  if (cardSub) cardSub.textContent = `${lat.toFixed(5)}, ${lon.toFixed(5)} (±${accMeters}m)`;

  if (APP_STATE.map) {
    updateGPSMarkerOnMap();
    APP_STATE.map.setView([lat, lon], 15);
  }

  let place = `My Laptop GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
  try {
    const nom = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`).then(r => r.json());
    if (nom?.display_name) {
      place = nom.display_name.split(',').slice(0, 2).join(', ');
    }
  } catch (e) {}

  if (cardSub) cardSub.textContent = `${place} • ${lat.toFixed(4)}, ${lon.toFixed(4)}`;

  if (setAsOrigin) {
    APP_STATE.origin = { name: place, coords: [lat, lon] };
    const originInput = document.getElementById('input-origin');
    if (originInput) originInput.value = place;
    searchRealRoutes();
  }
  showToast(`Laptop GPS locked: ${place}`);
}

async function fallbackToLaptopNetworkLocation(setAsOrigin = false) {
  const endpoints = [
    async () => {
      const r = await fetch('https://ipapi.co/json/').then(res => res.json());
      if (typeof r.latitude === 'number' && typeof r.longitude === 'number') {
        return { lat: r.latitude, lon: r.longitude, city: r.city };
      }
      return null;
    },
    async () => {
      const r = await fetch('https://ipwho.is/').then(res => res.json());
      if (r.success && typeof r.latitude === 'number' && typeof r.longitude === 'number') {
        return { lat: r.latitude, lon: r.longitude, city: r.city };
      }
      return null;
    }
  ];

  for (const fn of endpoints) {
    try {
      const loc = await fn();
      if (loc) {
        await applyResolvedUserLocation(
          loc.lat,
          loc.lon,
          450,
          `Laptop Wi-Fi GPS (${loc.city || 'Detected'})`,
          setAsOrigin
        );
        return true;
      }
    } catch (e) {}
  }
  return false;
}

async function activateLaptopGPS(setAsOrigin = true, silentOnBlocked = false) {
  const headerLabel = document.getElementById('header-gps-label');
  const mapStatusText = document.getElementById('map-gps-status-text');
  const cardTitle = document.getElementById('card-gps-title');
  const cardSub = document.getElementById('card-gps-subtitle');

  if (headerLabel) headerLabel.textContent = 'Locating Laptop...';
  if (mapStatusText) mapStatusText.textContent = 'Requesting Laptop GPS...';
  if (cardTitle) cardTitle.textContent = 'Requesting Laptop GPS...';
  if (cardSub) cardSub.textContent = 'Allow browser location prompt if shown';

  // Check Permissions API if supported
  try {
    if (navigator.permissions?.query) {
      const perm = await navigator.permissions.query({ name: 'geolocation' });
      if (perm.state === 'denied' && !silentOnBlocked) {
        const recovered = await fallbackToLaptopNetworkLocation(setAsOrigin);
        if (!recovered) {
          document.getElementById('laptop-gps-help-modal')?.classList.remove('hidden');
        }
        return;
      }
    }
  } catch (e) {}

  if (!navigator.geolocation) {
    await fallbackToLaptopNetworkLocation(setAsOrigin);
    return;
  }

  if (APP_STATE.gps.watchId !== null) {
    navigator.geolocation.clearWatch(APP_STATE.gps.watchId);
  }

  let firstLock = false;
  const onGeoSuccess = async (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const acc = Math.round(pos.coords.accuracy || 20);

    if (!firstLock) {
      firstLock = true;
      await applyResolvedUserLocation(lat, lon, acc, `Laptop GPS (±${acc}m)`, setAsOrigin);
    } else {
      APP_STATE.gps.coords = [lat, lon];
      APP_STATE.gps.accuracy = acc;
      if (APP_STATE.map) updateGPSMarkerOnMap();
    }
  };

  const requestPosition = (highAccuracy) => {
    navigator.geolocation.getCurrentPosition(
      onGeoSuccess,
      async (err) => {
        if (highAccuracy && err.code !== 1) {
          // Retry with standard laptop Wi-Fi / OS positioning
          requestPosition(false);
          return;
        }
        const recovered = await fallbackToLaptopNetworkLocation(setAsOrigin);
        if (!recovered) {
          if (headerLabel) headerLabel.textContent = 'Enable Laptop GPS';
          if (mapStatusText) mapStatusText.textContent = 'GPS Blocked — Tap Map';
          if (cardTitle) cardTitle.textContent = 'Browser Blocked Hardware GPS';
          if (cardSub) cardSub.textContent = 'Click "Detect Now" for setup steps or tap map pin';
          if (!silentOnBlocked) {
            document.getElementById('laptop-gps-help-modal')?.classList.remove('hidden');
          }
        }
      },
      { enableHighAccuracy: highAccuracy, maximumAge: 0, timeout: 8000 }
    );

    APP_STATE.gps.watchId = navigator.geolocation.watchPosition(
      onGeoSuccess,
      () => {},
      { enableHighAccuracy: highAccuracy, maximumAge: 3000, timeout: 12000 }
    );
  };

  requestPosition(true);
}

function enableMapPinDropGPS() {
  if (!APP_STATE.map) initLeafletMap();
  APP_STATE.gps.dropPinMode = !APP_STATE.gps.dropPinMode;
  const btn = document.getElementById('btn-drop-gps-pin');
  if (APP_STATE.gps.dropPinMode) {
    if (btn) {
      btn.className = 'px-3 py-2 rounded-2xl bg-emerald-600 text-white border border-emerald-500 shadow-md text-xs font-bold transition';
      btn.textContent = '📍 Click Anywhere on Map...';
    }
    showToast('Click your exact spot on the map to lock your laptop GPS location.');
  } else {
    if (btn) {
      btn.className = 'px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-xs hover:bg-emerald-50 border border-gray-200 shadow-md text-xs font-semibold text-gray-800 transition';
      btn.textContent = '📍 Tap Map to Set GPS';
    }
  }
}

function updateGPSMarkerOnMap() {
  if (!APP_STATE.map || !APP_STATE.gps.coords) return;
  const [lat, lon] = APP_STATE.gps.coords;
  if (APP_STATE.gps.marker) {
    APP_STATE.gps.marker.setLatLng([lat, lon]);
  } else {
    const gpsIcon = L.divIcon({
      className: '',
      html: `<div class="relative flex items-center justify-center w-8 h-8"><span class="gps-pulse-ring absolute inset-0 rounded-full bg-blue-500/45"></span><span class="relative w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    APP_STATE.gps.marker = L.marker([lat, lon], { icon: gpsIcon, zIndexOffset: 1200 })
      .addTo(APP_STATE.map)
      .bindPopup(`<strong>Your Laptop Live GPS</strong><br/><span class="font-mono text-[11px]">${lat.toFixed(5)}, ${lon.toFixed(5)}</span>`);
  }

  if (APP_STATE.gps.accuracyCircle) {
    APP_STATE.gps.accuracyCircle.setLatLng([lat, lon]).setRadius(Math.min(APP_STATE.gps.accuracy || 25, 250));
  } else {
    APP_STATE.gps.accuracyCircle = L.circle([lat, lon], {
      radius: Math.min(APP_STATE.gps.accuracy || 25, 250),
      color: '#2563EB',
      weight: 1.5,
      fillColor: '#3B82F6',
      fillOpacity: 0.14
    }).addTo(APP_STATE.map);
  }
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function computeArrivalClock(durationMin) {
  return new Date(Date.now() + durationMin * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ==================== 3. ROUTES, AUTOCOMPLETE & RIDE COMPARISON ====================
function handlePlaceAutocomplete(field, query) {
  clearTimeout(APP_STATE.autocompleteTimers[field]);
  const dropdown = document.getElementById(`suggestions-${field}`);
  if (!dropdown) return;

  if (!query || query.trim().length < 3) {
    dropdown.classList.add('hidden');
    return;
  }

  APP_STATE.autocompleteTimers[field] = setTimeout(async () => {
    try {
      const bias = APP_STATE.gps.coords || APP_STATE.origin.coords;
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query.trim())}&lat=${bias[0]}&lon=${bias[1]}&limit=4`;
      const data = await fetch(url).then(r => r.json());
      const features = data?.features || [];
      if (!features.length) {
        dropdown.classList.add('hidden');
        return;
      }
      dropdown.innerHTML = features.map(f => {
        const props = f.properties || {};
        const name = props.name || props.street || 'Location';
        const sub = [props.city || props.district, props.state].filter(Boolean).join(', ');
        const fullLabel = sub ? `${name}, ${sub}` : name;
        const [lon, lat] = f.geometry.coordinates;
        const distKm = haversineKm(bias[0], bias[1], lat, lon);
        const safeLabel = fullLabel.replace(/'/g, "\\'");
        return `
          <button type="button" onclick="selectAutocompletePlace('${field}', '${safeLabel}', ${lat}, ${lon})" class="w-full text-left px-3.5 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between gap-2 transition">
            <div class="min-w-0">
              <p class="font-bold text-gray-950 truncate">${name}</p>
              ${sub ? `<p class="text-[11px] text-gray-500 truncate">${sub}</p>` : ''}
            </div>
            <span class="text-[11px] font-mono font-bold text-emerald-700 shrink-0">${formatDistance(distKm)}</span>
          </button>
        `;
      }).join('');
      dropdown.classList.remove('hidden');
    } catch (e) {
      dropdown.classList.add('hidden');
    }
  }, 260);
}

function selectAutocompletePlace(field, label, lat, lon) {
  document.getElementById(`input-${field}`).value = label;
  document.getElementById(`suggestions-${field}`).classList.add('hidden');
  APP_STATE[field] = { name: label, coords: [lat, lon] };
  searchRealRoutes();
}

function clearDestinationInput() {
  const el = document.getElementById('input-dest');
  if (el) {
    el.value = '';
    el.focus();
  }
}

function setTravelMode(mode) {
  APP_STATE.travelMode = mode;
  ['foot', 'metro', 'bus', 'bike', 'driving'].forEach(m => {
    const btn = document.getElementById(`mode-btn-${m}`);
    if (btn) {
      const spanClass = m === 'driving' ? 'col-span-2 ' : '';
      btn.className = m === mode
        ? `travel-mode-btn ${spanClass}p-2.5 rounded-2xl border-2 border-gray-950 bg-gray-50 text-left transition`
        : `travel-mode-btn ${spanClass}p-2.5 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 text-left transition`;
    }
  });
  searchRealRoutes();
}

function applyQuickRoute(oName, oCoords, dName, dCoords) {
  APP_STATE.origin = { name: oName, coords: oCoords };
  APP_STATE.dest = { name: dName, coords: dCoords };
  document.getElementById('input-origin').value = oName;
  document.getElementById('input-dest').value = dName;
  searchRealRoutes();
}

async function geocodeTypedAddress(queryText) {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(queryText)}&limit=1`;
  const res = await fetch(url).then(r => r.json());
  const feat = res?.features?.[0];
  if (!feat) return null;
  const [lon, lat] = feat.geometry.coordinates;
  const props = feat.properties || {};
  const name = props.name || queryText;
  const city = props.city || props.state || '';
  return { name: city ? `${name}, ${city}` : name, coords: [lat, lon] };
}

async function searchRealRoutes() {
  const btn = document.getElementById('btn-search-routes');
  if (btn) btn.disabled = true;

  try {
    const typedOrigin = document.getElementById('input-origin').value.trim();
    const typedDest = document.getElementById('input-dest').value.trim();

    if (typedOrigin && typedOrigin !== APP_STATE.origin.name) {
      const geoO = await geocodeTypedAddress(typedOrigin);
      if (geoO) APP_STATE.origin = geoO;
    }
    if (typedDest && typedDest !== APP_STATE.dest.name) {
      const geoD = await geocodeTypedAddress(typedDest);
      if (geoD) APP_STATE.dest = geoD;
    }

    const shortOrigin = APP_STATE.origin.name.split(',')[0];
    APP_STATE.rideCheck.safePickupSpot.name = `${shortOrigin} Main Road Junction`;
    document.getElementById('safe-pickup-spot-name').textContent = APP_STATE.rideCheck.safePickupSpot.name;
    document.getElementById('exact-pickup-spot-name').textContent = APP_STATE.origin.name;

    const [oLat, oLon] = APP_STATE.origin.coords;
    const [dLat, dLon] = APP_STATE.dest.coords;

    APP_STATE.metroPlan = computeDelhiMetroPlan([oLat, oLon], [dLat, dLon]);
    updateDelhiMetroUI(APP_STATE.metroPlan);

    const estStraightKm = Math.max(1.2, haversineKm(oLat, oLon, dLat, dLon) * 1.22);
    APP_STATE.busPlan = computeDelhiBusPlan(APP_STATE.origin.name, APP_STATE.dest.name, estStraightKm);
    updateDelhiBusUI(APP_STATE.busPlan);

    const osrmProfile = APP_STATE.travelMode === 'driving' ? 'driving' : APP_STATE.travelMode === 'bike' ? 'bike' : 'foot';
    const speedKmH = APP_STATE.travelMode === 'driving' ? 28 : APP_STATE.travelMode === 'bike' ? 20 : 5.2;

    const osrmUrl = `https://router.project-osrm.org/route/v1/${osrmProfile}/${oLon},${oLat};${dLon},${dLat}?alternatives=3&overview=full&geometries=geojson`;
    const osrmRes = await fetch(osrmUrl).then(r => r.json());

    if (osrmRes?.code === 'Ok' && osrmRes.routes?.length > 0) {
      const parsed = osrmRes.routes.map(r => ({
        dist: +(r.distance / 1000).toFixed(2),
        coords: r.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
        leg: r.legs?.[0]?.summary || ''
      })).sort((a, b) => a.dist - b.dist);

      const fastest = parsed[0];
      let safest = parsed.length > 1 ? parsed[parsed.length - 1] : null;

      if (!safest || safest.coords.length < 4) {
        const dLatVec = dLat - oLat;
        const dLonVec = dLon - oLon;
        const perpLat = (oLat + dLat) / 2 - dLonVec * 0.16;
        const perpLon = (oLon + dLon) / 2 + dLatVec * 0.16;

        try {
          const viaUrl = `https://router.project-osrm.org/route/v1/${osrmProfile}/${oLon},${oLat};${perpLon.toFixed(5)},${perpLat.toFixed(5)};${dLon},${dLat}?overview=full&geometries=geojson`;
          const viaRes = await fetch(viaUrl).then(r => r.json());
          if (viaRes?.code === 'Ok' && viaRes.routes?.[0]) {
            const vr = viaRes.routes[0];
            safest = {
              dist: +(vr.distance / 1000).toFixed(2),
              coords: vr.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
              leg: vr.legs?.map(l => l.summary).filter(Boolean).join(' & ') || 'Main Arterial Avenue'
            };
          }
        } catch (viaErr) {}
      }

      if (!safest) {
        safest = {
          dist: +(fastest.dist * 1.12).toFixed(2),
          coords: fastest.coords,
          leg: fastest.leg || 'Main Arterial Road'
        };
      }

      if (APP_STATE.travelMode === 'metro' && APP_STATE.metroPlan) {
        const mp = APP_STATE.metroPlan;
        APP_STATE.routes.safe.distanceKm = mp.totalDistKm;
        APP_STATE.routes.safe.durationMin = mp.totalMins;
        APP_STATE.routes.safe.via = `Delhi Metro (${mp.primaryLine}${mp.secondLine ? ' → ' + mp.secondLine : ''} Line) • ${mp.startSt.name} → ${mp.endSt.name}`;
        APP_STATE.routes.safe.coords = mp.routeCoords;

        APP_STATE.routes.unsafe.distanceKm = Math.max(0.3, fastest.dist);
        APP_STATE.routes.unsafe.durationMin = Math.max(4, Math.round((fastest.dist / 24) * 60));
        APP_STATE.routes.unsafe.via = fastest.leg ? `Road Alternative via ${fastest.leg}` : 'Direct Road Corridor';
        APP_STATE.routes.unsafe.coords = fastest.coords;
      } else if (APP_STATE.travelMode === 'bus' && APP_STATE.busPlan) {
        const bp = APP_STATE.busPlan;
        APP_STATE.routes.safe.distanceKm = Math.max(0.5, safest.dist);
        APP_STATE.routes.safe.durationMin = bp.durationMin;
        APP_STATE.routes.safe.via = `DTC Low-Floor Bus (${bp.routes}) • Main Ring Road`;
        APP_STATE.routes.safe.coords = safest.coords;

        APP_STATE.routes.unsafe.distanceKm = Math.max(0.4, fastest.dist);
        APP_STATE.routes.unsafe.durationMin = Math.max(6, bp.durationMin - 4);
        APP_STATE.routes.unsafe.via = `Cluster Bus Corridor via ${fastest.leg || 'Inner Arterial'}`;
        APP_STATE.routes.unsafe.coords = fastest.coords;
      } else {
        APP_STATE.routes.unsafe.distanceKm = Math.max(0.3, fastest.dist);
        APP_STATE.routes.unsafe.durationMin = Math.max(2, Math.round((fastest.dist / (speedKmH * 1.08)) * 60));
        APP_STATE.routes.unsafe.via = fastest.leg ? `Fastest via ${fastest.leg}` : 'Fastest Direct Road';
        APP_STATE.routes.unsafe.coords = fastest.coords;

        APP_STATE.routes.safe.distanceKm = Math.max(APP_STATE.routes.unsafe.distanceKm + 0.2, safest.dist);
        APP_STATE.routes.safe.durationMin = Math.max(APP_STATE.routes.unsafe.durationMin + 2, Math.round((APP_STATE.routes.safe.distanceKm / speedKmH) * 60));
        APP_STATE.routes.safe.via = safest.leg ? `Via ${safest.leg}` : 'Via Lit Main Road';
        APP_STATE.routes.safe.coords = safest.coords;
      }
    }

    renderRoutesPanel();
    renderSafetyPanel();
    if (APP_STATE.map) renderMapRoutes();
  } catch (e) {
    renderRoutesPanel();
  } finally {
    if (btn) btn.disabled = false;
  }
}

function renderRoutesPanel() {
  const { safe, unsafe } = APP_STATE.routes;
  const active = APP_STATE.routes[APP_STATE.selectedRouteKey];

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  const modeNames = {
    foot: 'Walking Route',
    metro: 'Delhi Metro Rail (DMRC)',
    bus: 'DTC / Cluster Bus',
    bike: 'Two-Wheeler Route',
    driving: 'Cab / Car Route'
  };
  setText('routes-mode-badge', modeNames[APP_STATE.travelMode] || 'Route');

  const straightKm = haversineKm(APP_STATE.origin.coords[0], APP_STATE.origin.coords[1], APP_STATE.dest.coords[0], APP_STATE.dest.coords[1]);
  setText('routes-straight-line', `Straight-line: ${formatDistance(straightKm)}`);

  const shortOrigin = APP_STATE.origin.name.split(',')[0];
  const shortDest = APP_STATE.dest.name.split(',')[0];
  setText('routes-trip-heading', `${shortOrigin} → ${shortDest}`);
  setText('routes-primary-distance', formatDistance(active.distanceKm));
  setText('routes-primary-duration', `${active.durationMin} min`);
  setText('routes-selected-name', active.title);

  const roadKm = (APP_STATE.travelMode === 'metro' || APP_STATE.travelMode === 'bus') ? unsafe.distanceKm : safe.distanceKm;
  setText('mode-dist-foot', formatDistance(roadKm));
  setText('mode-time-foot', `${Math.max(2, Math.round((roadKm / 5.2) * 60))}m`);
  if (APP_STATE.metroPlan) {
    setText('mode-time-metro', `${APP_STATE.metroPlan.totalMins}m`);
    setText('mode-dist-metro', `${APP_STATE.metroPlan.primaryLine} Line`);
  } else {
    setText('mode-time-metro', `${Math.max(5, Math.round((roadKm / 32) * 60) + 4)}m`);
  }
  if (APP_STATE.busPlan) {
    setText('mode-time-bus', `${APP_STATE.busPlan.durationMin}m`);
    setText('mode-dist-bus', APP_STATE.busPlan.routes.split('•')[0].trim());
  }
  setText('mode-dist-bike', formatDistance(roadKm));
  setText('mode-time-bike', `${Math.max(2, Math.round((roadKm / 20) * 60))}m`);
  const carKm = +(roadKm * 1.06).toFixed(2);
  setText('mode-dist-driving', formatDistance(carKm));
  setText('mode-time-driving', `${Math.max(2, Math.round((carKm / 28) * 60))}m`);

  setText('map-bottom-distance', formatDistance(active.distanceKm));
  setText('map-bottom-duration', `${active.durationMin} min`);
  setText('map-bottom-corridor', `${active.title} (${shortOrigin} → ${shortDest})`);

  updateRideAppEstimates(active.distanceKm);

  const cardsContainer = document.getElementById('routes-cards-container');
  if (!cardsContainer) return;

  cardsContainer.innerHTML = [safe, unsafe].map(r => {
    const isSafe = r.key === 'safe';
    const isSelected = APP_STATE.selectedRouteKey === r.key;
    const arrivalTime = computeArrivalClock(r.durationMin);
    const cardStyle = isSelected
      ? (isSafe ? 'border-2 border-gray-950 bg-amber-50/40 shadow-xs' : 'border-2 border-gray-950 bg-gray-50 shadow-xs')
      : 'border border-gray-200 bg-white hover:border-gray-300';
    const pillStyle = isSafe ? 'bg-gray-950 text-amber-300' : 'bg-gray-200 text-gray-800';
    const pillText = isSafe ? '✓ Safest route' : 'Fastest route';

    return `
      <div onclick="selectRouteOption('${r.key}')" class="cursor-pointer rounded-3xl p-4 sm:p-5 transition ${cardStyle}">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${pillStyle}">${pillText}</span>
              <span class="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200 text-[10px] font-bold">♀ ${r.womenEndorsements} Women (${r.ratingAvg}★)</span>
              <span class="text-[11px] font-mono text-gray-500">Arrive by ${arrivalTime}</span>
            </div>
            <h3 class="text-sm sm:text-base font-extrabold text-gray-950">${isSafe ? '✓ Safest route' : 'Fastest route'} · ${r.durationMin} min</h3>
            <p class="text-xs text-gray-500 truncate">${r.via}</p>
          </div>
          <div class="text-right shrink-0">
            <span class="text-lg sm:text-xl font-extrabold font-mono text-gray-950 block">${formatDistance(r.distanceKm)}</span>
            <span class="text-xs font-bold font-mono ${isSafe ? 'text-emerald-700' : 'text-gray-600'}">${r.durationMin} min</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function selectRouteOption(routeKey) {
  if (!APP_STATE.routes[routeKey]) return;
  APP_STATE.selectedRouteKey = routeKey;
  renderRoutesPanel();
  renderSafetyPanel();
  if (APP_STATE.map) renderMapRoutes();
  showToast(`Selected ${APP_STATE.routes[routeKey].title}`);
}

// ==================== 4. UBER, OLA & RAPIDO PICKUP & SAFEST ROAD CHECK ====================
function toggleForceSafestRoad() {
  APP_STATE.rideCheck.forceSafestRoad = !APP_STATE.rideCheck.forceSafestRoad;
  const btn = document.getElementById('btn-force-safe-road');
  if (btn) {
    btn.className = APP_STATE.rideCheck.forceSafestRoad
      ? 'px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-2xs transition flex items-center gap-1.5'
      : 'px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold transition flex items-center gap-1.5';
    btn.innerHTML = APP_STATE.rideCheck.forceSafestRoad ? '<span>✓ Safest Road Locked</span>' : '<span>Default App Routing</span>';
  }
  renderRoutesPanel();
}

function setRidePickupMode(mode) {
  APP_STATE.rideCheck.pickupMode = mode;
  const safeBtn = document.getElementById('pickup-mode-safe');
  const exactBtn = document.getElementById('pickup-mode-exact');
  const lightBadge = document.getElementById('ride-pickup-light-badge');

  if (mode === 'safeMainRoad') {
    safeBtn.className = 'text-left p-2.5 rounded-xl border-2 border-emerald-600 bg-white transition';
    exactBtn.className = 'text-left p-2.5 rounded-xl border border-gray-200 bg-white/70 hover:bg-white transition';
    lightBadge.textContent = '💡 Well-Lit Main Road';
    lightBadge.className = 'text-[11px] font-bold text-emerald-700';
  } else {
    safeBtn.className = 'text-left p-2.5 rounded-xl border border-gray-200 bg-white/70 hover:bg-white transition';
    exactBtn.className = 'text-left p-2.5 rounded-xl border-2 border-gray-950 bg-white transition';
    lightBadge.textContent = '📍 Doorstep / Inner Lane';
    lightBadge.className = 'text-[11px] font-bold text-gray-700';
  }
  renderRoutesPanel();
}

function updateRideAppEstimates(distanceKm) {
  const container = document.getElementById('ride-comparison-cards');
  if (!container) return;

  const { pickupMode, forceSafestRoad, safePickupSpot } = APP_STATE.rideCheck;
  const useSafeSpot = pickupMode === 'safeMainRoad';
  const pickupLocation = useSafeSpot ? safePickupSpot.name : APP_STATE.origin.name.split(',')[0];

  const safeRoadLabel = APP_STATE.routes.safe.via.replace(/^Via\s+/i, '');
  const shortcutRoadLabel = APP_STATE.routes.unsafe.via.replace(/^Fastest via\s+/i, '');
  const safeScoreVal = computeRouteSafety(APP_STATE.routes.safe).total;
  const unsafeScoreVal = computeRouteSafety(APP_STATE.routes.unsafe).total;

  const providers = [
    { id: 'uber', badge: 'Uber', badgeClass: 'bg-gray-950 text-white', vehicle: 'Uber Go / Premier', eta: useSafeSpot ? '3 min pickup' : '5 min pickup', fare: `₹${Math.round(52 + distanceKm * 14)}`, pickupFrom: pickupLocation, roadTaken: safeRoadLabel, isSafeRoad: true, score: safeScoreVal },
    { id: 'ola', badge: 'Ola', badgeClass: 'bg-lime-400 text-gray-950', vehicle: 'Ola Mini / Auto', eta: useSafeSpot ? '4 min pickup' : '6 min pickup', fare: `₹${Math.round(48 + distanceKm * 13)}`, pickupFrom: pickupLocation, roadTaken: safeRoadLabel, isSafeRoad: true, score: safeScoreVal },
    { id: 'rapido', badge: 'Rapido', badgeClass: 'bg-amber-400 text-gray-950', vehicle: 'Rapido Bike / Auto', eta: useSafeSpot ? '2 min pickup' : '3 min pickup', fare: `₹${Math.round(28 + distanceKm * 8)}`, pickupFrom: pickupLocation, roadTaken: forceSafestRoad ? safeRoadLabel : shortcutRoadLabel, isSafeRoad: forceSafestRoad, score: forceSafestRoad ? safeScoreVal : unsafeScoreVal }
  ];

  container.innerHTML = providers.map(p => {
    const roadBadgeClass = p.isSafeRoad ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-300';
    const roadStatusText = p.isSafeRoad ? `✓ Safest Road (${p.score}/100)` : `⚠ Shortcut (${p.score}/100)`;

    return `
      <div class="rounded-2xl border ${p.isSafeRoad ? 'border-gray-200 bg-gray-50/60' : 'border-amber-300 bg-amber-50/30'} p-3.5 flex flex-col justify-between gap-3">
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <span class="px-2.5 py-1 rounded-lg ${p.badgeClass} text-xs font-black tracking-tight">${p.badge}</span>
            <span class="text-xs font-mono font-extrabold text-gray-950">${p.fare}</span>
          </div>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Takes You From</p>
            <p class="text-xs font-bold text-gray-900 truncate" title="${p.pickupFrom}">📍 ${p.pickupFrom}</p>
            <p class="text-[10px] font-mono text-gray-500">${p.vehicle} • ${p.eta}</p>
          </div>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Road Corridor</p>
            <p class="text-[11px] font-semibold text-gray-800 truncate" title="${p.roadTaken}">${p.roadTaken}</p>
            <span class="inline-block mt-1 px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${roadBadgeClass}">${roadStatusText}</span>
          </div>
        </div>
        <button type="button" onclick="connectRideApp('${p.id}')" class="w-full py-2 px-3 rounded-xl bg-gray-950 hover:bg-gray-800 text-white text-xs font-bold transition flex items-center justify-center gap-1">
          <span>Book ${p.badge}</span>
          <span>↗</span>
        </button>
      </div>
    `;
  }).join('');
}

function connectRideApp(provider) {
  const [oLat, oLon] = APP_STATE.gps.coords || APP_STATE.origin.coords;
  const [dLat, dLon] = APP_STATE.dest.coords;
  const urls = {
    uber: `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${oLat}&pickup[longitude]=${oLon}&dropoff[latitude]=${dLat}&dropoff[longitude]=${dLon}`,
    ola: `https://book.olacabs.com/?lat=${oLat}&lng=${oLon}&drop_lat=${dLat}&drop_lng=${dLon}`,
    rapido: `https://www.rapido.bike/`
  };
  window.open(urls[provider] || urls.uber, '_blank', 'noopener,noreferrer');
  showToast(`Opening ${provider.toUpperCase()} with verified pickup & safest corridor.`);
}

function shareRidePlanWithParents() {
  const parent = APP_STATE.trustedContacts[0] || { name: 'Parent', phone: '+91 98110 11223' };
  const digits = parent.phone.replace(/[^0-9]/g, '');
  const waPhone = digits.length === 10 ? `91${digits}` : digits;
  const active = APP_STATE.routes[APP_STATE.selectedRouteKey];
  const msg = `VYLO RIDE PLAN: Taking ${active.title} (${active.via}) from ${APP_STATE.origin.name} to ${APP_STATE.dest.name} (${formatDistance(active.distanceKm)}, ~${active.durationMin} min).`;
  window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
}

// ==================== 5. LIVE MAP ENGINE, GLOWING ROUTES & INFRASTRUCTURE PINS ====================
function createResilientTileLayer(tileKey) {
  const spec = MAP_TILE_PROVIDERS[tileKey] || MAP_TILE_PROVIDERS.night;
  const layer = L.tileLayer(spec.url, spec.options);
  layer.on('tileerror', () => {
    if (APP_STATE.activeTileKey !== 'night') setMapTileLayer('night');
  });
  return layer;
}

function initLeafletMap() {
  const mapEl = document.getElementById('vylo-map');
  APP_STATE.map = L.map('vylo-map', { zoomControl: true }).setView(APP_STATE.origin.coords, 14);
  APP_STATE.baseLayer = createResilientTileLayer(APP_STATE.activeTileKey).addTo(APP_STATE.map);
  APP_STATE.routeLayerGroup = L.layerGroup().addTo(APP_STATE.map);
  APP_STATE.infraLayerGroup = L.layerGroup().addTo(APP_STATE.map);
  APP_STATE.nearbyLayerGroup = L.layerGroup().addTo(APP_STATE.map);

  APP_STATE.map.on('click', async (e) => {
    if (!APP_STATE.gps.dropPinMode) return;
    APP_STATE.gps.dropPinMode = false;
    const btn = document.getElementById('btn-drop-gps-pin');
    if (btn) {
      btn.className = 'px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-xs hover:bg-emerald-50 border border-gray-200 shadow-md text-xs font-semibold text-gray-800 transition';
      btn.textContent = '📍 Tap Map to Set GPS';
    }
    await applyResolvedUserLocation(e.latlng.lat, e.latlng.lng, 10, 'Pinned Laptop GPS (±10m)', true);
  });

  if (typeof ResizeObserver !== 'undefined' && mapEl) {
    new ResizeObserver(() => {
      if (APP_STATE.map) APP_STATE.map.invalidateSize();
    }).observe(mapEl);
  }

  renderMapRoutes();
  if (APP_STATE.gps.coords) updateGPSMarkerOnMap();
}

function setMapTileLayer(tileKey) {
  if (!APP_STATE.map || !MAP_TILE_PROVIDERS[tileKey]) return;
  APP_STATE.activeTileKey = tileKey;
  if (APP_STATE.baseLayer) APP_STATE.map.removeLayer(APP_STATE.baseLayer);
  APP_STATE.baseLayer = createResilientTileLayer(tileKey).addTo(APP_STATE.map);

  ['night', 'esriStreet', 'esriSat'].forEach(k => {
    const btn = document.getElementById(`tile-btn-${k}`);
    if (btn) {
      btn.className = k === tileKey
        ? 'tile-btn px-2.5 py-1.5 rounded-xl bg-gray-950 text-white transition'
        : 'tile-btn px-2.5 py-1.5 rounded-xl text-gray-600 hover:bg-gray-100 transition';
    }
  });
}

function getPolylineMidpoint(coords) {
  if (!Array.isArray(coords) || !coords.length) return [28.57, 77.20];
  if (coords.length === 1) return coords[0];
  const midIdx = Math.floor((coords.length - 1) / 2);
  const p1 = coords[midIdx];
  const p2 = coords[Math.min(coords.length - 1, midIdx + 1)];
  return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
}

function interpolateAlongPath(coords, fraction) {
  if (!Array.isArray(coords) || !coords.length) return [28.57, 77.20];
  if (coords.length === 1) return coords[0];
  const scaled = fraction * (coords.length - 1);
  const idx = Math.min(coords.length - 2, Math.floor(scaled));
  const t = scaled - idx;
  return [
    coords[idx][0] + (coords[idx + 1][0] - coords[idx][0]) * t,
    coords[idx][1] + (coords[idx + 1][1] - coords[idx][1]) * t
  ];
}

function toggleRouteInfraPins() {
  APP_STATE.infraVisibility.all = !APP_STATE.infraVisibility.all;
  const btn = document.getElementById('btn-toggle-infra');
  if (btn) btn.textContent = APP_STATE.infraVisibility.all ? 'Hide Pins' : 'Show Pins';
  renderRouteInfrastructurePins();
}

function toggleInfraCategory(cat) {
  APP_STATE.infraVisibility[cat] = !APP_STATE.infraVisibility[cat];
  const btn = document.getElementById(`legend-btn-${cat}`);
  if (btn) btn.classList.toggle('opacity-40', !APP_STATE.infraVisibility[cat]);
  renderRouteInfrastructurePins();
}

function renderRouteInfrastructurePins() {
  if (!APP_STATE.infraLayerGroup) return;
  APP_STATE.infraLayerGroup.clearLayers();
  if (!APP_STATE.infraVisibility.all) return;

  const { safe, unsafe } = APP_STATE.routes;
  const pins = [];

  if (APP_STATE.infraVisibility.shops) {
    [0.12, 0.25, 0.38, 0.52, 0.68, 0.84].forEach((f, i) => {
      pins.push({ pt: interpolateAlongPath(safe.coords, f), badge: 'S', bg: '#FACC15', fg: '#111827', title: `Open Commercial Store #${i + 1}`, sub: 'Open until 11:00 PM • Active footfall' });
    });
    [0.3, 0.72].forEach((f, i) => {
      pins.push({ pt: interpolateAlongPath(unsafe.coords, f), badge: 'S', bg: '#FACC15', fg: '#111827', title: `Corner Kiosk #${i + 1}`, sub: 'Limited evening visibility' });
    });
  }

  if (APP_STATE.infraVisibility.pharmacies) {
    pins.push({ pt: interpolateAlongPath(safe.coords, 0.44), badge: '+', bg: '#F472B6', fg: '#111827', title: '24×7 Apollo Pharmacy & Clinic', sub: 'Open medical help point on main avenue' });
  }

  if (APP_STATE.infraVisibility.hospitals) {
    pins.push({ pt: interpolateAlongPath(safe.coords, 0.62), badge: 'H', bg: '#818CF8', fg: '#111827', title: 'Emergency Care Hospital', sub: '24×7 emergency entrance & security desk' });
  }

  if (APP_STATE.infraVisibility.fuel) {
    pins.push({ pt: interpolateAlongPath(unsafe.coords, 0.18), badge: 'F', bg: '#10B981', fg: '#111827', title: '24×7 IndianOil Petrol / CNG Station', sub: 'Well-lit attendant station' });
  }

  if (APP_STATE.infraVisibility.cameras) {
    [0.18, 0.48, 0.78].forEach((f, i) => {
      pins.push({ pt: interpolateAlongPath(safe.coords, f), badge: '📹', bg: '#22D3EE', fg: '#083344', title: `Mapped Surveillance Camera #${i + 1}`, sub: 'Public traffic & junction camera coverage' });
    });
  }

  pins.forEach(p => {
    const icon = L.divIcon({
      className: '',
      html: `<div class="w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[10px] font-black" style="background:${p.bg};color:${p.fg};">${p.badge}</div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    L.marker(p.pt, { icon, zIndexOffset: 700 })
      .addTo(APP_STATE.infraLayerGroup)
      .bindPopup(`<div class="text-xs space-y-0.5"><p class="font-extrabold text-gray-950">${p.title}</p><p class="text-gray-600">${p.sub}</p></div>`);
  });
}

function renderMapRoutes() {
  if (!APP_STATE.map || !APP_STATE.routeLayerGroup) return;
  APP_STATE.routeLayerGroup.clearLayers();

  const { safe, unsafe } = APP_STATE.routes;
  const isSafeSelected = APP_STATE.selectedRouteKey === 'safe';

  L.polyline(unsafe.coords, {
    color: '#111827',
    weight: !isSafeSelected ? 9 : 7,
    opacity: 0.75,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(APP_STATE.routeLayerGroup);

  const fastestLine = L.polyline(unsafe.coords, {
    color: !isSafeSelected ? '#E5E7EB' : '#9CA3AF',
    weight: !isSafeSelected ? 5.5 : 4.5,
    opacity: !isSafeSelected ? 0.95 : 0.85,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(APP_STATE.routeLayerGroup);
  fastestLine.on('click', () => selectRouteOption('unsafe'));

  L.polyline(safe.coords, {
    color: '#FDE68A',
    weight: isSafeSelected ? 14 : 10,
    opacity: isSafeSelected ? 0.34 : 0.18,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(APP_STATE.routeLayerGroup);

  const safestCoreLine = L.polyline(safe.coords, {
    color: '#FFFBEB',
    weight: isSafeSelected ? 6 : 4.5,
    opacity: isSafeSelected ? 1 : 0.75,
    lineCap: 'round',
    lineJoin: 'round',
    className: isSafeSelected ? 'vylo-safe-route-core' : ''
  }).addTo(APP_STATE.routeLayerGroup);
  safestCoreLine.on('click', () => selectRouteOption('safe'));

  const safeMid = getPolylineMidpoint(safe.coords);
  const unsafeMid = getPolylineMidpoint(unsafe.coords);

  const safeCalloutIcon = L.divIcon({
    className: '',
    html: `<div onclick="selectRouteOption('safe')" class="vylo-route-callout ${isSafeSelected ? 'active' : ''}" style="transform: translate(-50%, -115%);"><span class="text-amber-300 font-extrabold">✓</span><span>Safest route</span><span class="opacity-60">·</span><span class="font-mono font-bold">${safe.durationMin} min</span></div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });

  const unsafeCalloutIcon = L.divIcon({
    className: '',
    html: `<div onclick="selectRouteOption('unsafe')" class="vylo-route-callout ${!isSafeSelected ? 'active' : ''}" style="transform: translate(-50%, 35%);">${!isSafeSelected ? '<span class="text-white font-extrabold">✓</span>' : ''}<span>Fastest route</span><span class="opacity-60">·</span><span class="font-mono font-bold">${unsafe.durationMin} min</span></div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });

  L.marker(safeMid, { icon: safeCalloutIcon, zIndexOffset: 900 }).addTo(APP_STATE.routeLayerGroup);
  L.marker(unsafeMid, { icon: unsafeCalloutIcon, zIndexOffset: 850 }).addTo(APP_STATE.routeLayerGroup);

  const shortOrigin = APP_STATE.origin.name.split(',')[0].toUpperCase();
  const shortDest = APP_STATE.dest.name.split(',')[0].toUpperCase();

  const originPin = L.divIcon({
    className: '',
    html: `<div class="relative flex items-center justify-center"><div class="vylo-endpoint-tag absolute bottom-9 left-1/2 -translate-x-1/2">A &nbsp;·&nbsp; ${shortOrigin}</div><div class="vylo-pin w-7 h-7 bg-blue-600 text-white text-[11px]">A</div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

  const destPin = L.divIcon({
    className: '',
    html: `<div class="relative flex items-center justify-center"><div class="vylo-endpoint-tag absolute bottom-9 left-1/2 -translate-x-1/2">B &nbsp;·&nbsp; ${shortDest}</div><div class="vylo-pin w-7 h-7 bg-red-600 text-white text-[11px]">B</div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

  L.marker(safe.coords[0], { icon: originPin, zIndexOffset: 1000 }).addTo(APP_STATE.routeLayerGroup);
  L.marker(safe.coords[safe.coords.length - 1], { icon: destPin, zIndexOffset: 1000 }).addTo(APP_STATE.routeLayerGroup);

  if (APP_STATE.travelMode === 'metro' && APP_STATE.metroPlan?.stationPath?.length > 1) {
    const lineColor = (METRO_LINE_COLORS[APP_STATE.metroPlan.primaryLine] || METRO_LINE_COLORS.Yellow).hex;
    APP_STATE.metroPlan.stationPath.forEach((st) => {
      const stIcon = L.divIcon({
        className: '',
        html: `<div class="px-2 py-0.5 rounded-full text-[10px] font-extrabold text-gray-950 border-2 border-white shadow-md whitespace-nowrap" style="background:${lineColor};">🚇 ${st.name}</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 12]
      });
      L.marker([st.lat, st.lon], { icon: stIcon, zIndexOffset: 960 })
        .addTo(APP_STATE.routeLayerGroup)
        .bindPopup(`<strong>${st.name} Metro Station</strong><br/>Lines: ${st.lines.join(', ')}<br/>Exit: ${st.gate}`);
    });
  }

  renderRouteInfrastructurePins();

  const bounds = L.latLngBounds([...safe.coords, ...unsafe.coords]);
  if (APP_STATE.gps.coords) bounds.extend(APP_STATE.gps.coords);
  APP_STATE.map.fitBounds(bounds, { padding: [75, 75], maxZoom: 15 });
}

function recenterMapOnUserOrRoute() {
  if (!APP_STATE.map) return;
  if (APP_STATE.gps.coords) {
    APP_STATE.map.setView(APP_STATE.gps.coords, 16);
  } else {
    renderMapRoutes();
  }
}

function toggleLiveWalkSimulation() {
  const label = document.getElementById('map-sim-label');
  if (APP_STATE.simTimer) {
    clearInterval(APP_STATE.simTimer);
    APP_STATE.simTimer = null;
    if (APP_STATE.simMarker && APP_STATE.map) {
      APP_STATE.map.removeLayer(APP_STATE.simMarker);
      APP_STATE.simMarker = null;
    }
    if (label) label.textContent = 'Simulate GPS Move';
    return;
  }

  if (!APP_STATE.map) initLeafletMap();
  const coords = APP_STATE.routes[APP_STATE.selectedRouteKey].coords;
  const samples = [];
  for (let i = 0; i <= 24; i++) samples.push(interpolateAlongPath(coords, i / 24));

  APP_STATE.simIndex = 0;
  const walkerIcon = L.divIcon({
    className: '',
    html: `<div class="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px]">🚶</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
  APP_STATE.simMarker = L.marker(samples[0], { icon: walkerIcon, zIndexOffset: 1300 }).addTo(APP_STATE.map);
  if (label) label.textContent = 'Stop GPS Sim';

  APP_STATE.simTimer = setInterval(() => {
    APP_STATE.simIndex++;
    if (APP_STATE.simIndex >= samples.length) {
      clearInterval(APP_STATE.simTimer);
      APP_STATE.simTimer = null;
      if (label) label.textContent = 'Simulate GPS Move';
      openRateRouteModal();
      return;
    }
    APP_STATE.simMarker?.setLatLng(samples[APP_STATE.simIndex]);
  }, 280);
}

// ==================== 6. NEARBY PLACES SCANNER ====================
async function searchNearbyPlaces(category) {
  if (!APP_STATE.map) initLeafletMap();
  const center = APP_STATE.gps.coords ? { lat: APP_STATE.gps.coords[0], lng: APP_STATE.gps.coords[1] } : APP_STATE.map.getCenter();
  const { lat, lng: lon } = center;

  document.querySelectorAll('.nearby-cat-btn').forEach(b => b.classList.remove('ring-2', 'ring-gray-950'));
  document.getElementById(`nearby-btn-${category}`)?.classList.add('ring-2', 'ring-gray-950');

  const configs = {
    cameras: { title: 'Nearby Surveillance Cameras', emoji: '📹', color: '#0891B2', filter: `node["man_made"="surveillance"](around:1200,${lat},${lon});` },
    police: { title: 'Nearby Police Stations', emoji: '🚔', color: '#2563EB', filter: `node["amenity"="police"](around:2200,${lat},${lon});` },
    hospital: { title: 'Nearby Hospitals & Clinics', emoji: '🏥', color: '#DC2626', filter: `node["amenity"~"hospital|clinic"](around:2000,${lat},${lon});` },
    shops: { title: 'Nearby Open Shops & Cafes', emoji: '🏪', color: '#059669', filter: `node["shop"](around:1000,${lat},${lon});node["amenity"~"cafe|restaurant|pharmacy"](around:1000,${lat},${lon});` },
    transit: { title: 'Nearby Delhi Metro & Bus Stops', emoji: '🚇', color: '#4F46E5', filter: `node["railway"="station"](around:1800,${lat},${lon});node["highway"="bus_stop"](around:1200,${lat},${lon});` },
    lamps: { title: 'Nearby Street Lamps', emoji: '💡', color: '#D97706', filter: `node["highway"="street_lamp"](around:700,${lat},${lon});` }
  };
  const cfg = configs[category];
  if (!cfg) return;

  const drawer = document.getElementById('nearby-results-drawer');
  const titleEl = document.getElementById('nearby-drawer-title');
  const listEl = document.getElementById('nearby-results-list');
  drawer.classList.remove('hidden');
  titleEl.textContent = `Scanning ${cfg.title}...`;
  listEl.innerHTML = `<div class="text-xs text-gray-500 py-1.5">Fetching live places around your location...</div>`;

  try {
    const query = `[out:json][timeout:8];(${cfg.filter});out body 20;`;
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`
    }).then(r => r.json());

    const items = (res?.elements || []).map((el, idx) => {
      const tags = el.tags || {};
      const rawName = tags.name || tags['name:en'] ||
        (category === 'cameras' ? `Public Surveillance Camera #${idx + 1}` :
         category === 'police' ? 'Local Police Post / Chowki' :
         category === 'hospital' ? '24×7 Medical Clinic / Hospital' :
         category === 'transit' ? (tags.railway ? 'Delhi Metro Station' : 'DTC Bus Stop') :
         category === 'lamps' ? `Street Lamp #${idx + 1}` :
         (tags.shop ? `${tags.shop.replace(/_/g, ' ')} Store` : 'Open Local Shop'));
      const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      return { name, lat: el.lat, lon: el.lon, distKm: haversineKm(lat, lon, el.lat, el.lon) };
    }).sort((a, b) => a.distKm - b.distKm).slice(0, 12);

    APP_STATE.nearbyLayerGroup.clearLayers();
    if (!items.length) {
      titleEl.textContent = `No ${category} entries found immediately nearby`;
      listEl.innerHTML = `<div class="text-xs text-gray-500 py-1">Pan the map slightly and tap again.</div>`;
      return;
    }

    titleEl.textContent = `${cfg.emoji} ${items.length} ${cfg.title}`;
    items.forEach(item => {
      const icon = L.divIcon({
        className: '',
        html: `<div class="w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center text-xs shadow-md" style="border-color:${cfg.color}">${cfg.emoji}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker([item.lat, item.lon], { icon }).addTo(APP_STATE.nearbyLayerGroup).bindPopup(`<strong>${item.name}</strong><br/>${formatDistance(item.distKm)} away`);
    });

    listEl.innerHTML = items.map(item => `
      <div class="shrink-0 w-44 p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between gap-1.5">
        <div>
          <p class="text-xs font-bold text-gray-950 truncate">${item.name}</p>
          <p class="text-[11px] font-mono text-emerald-700 font-semibold">${formatDistance(item.distKm)} away</p>
        </div>
        <button onclick="APP_STATE.map.setView([${item.lat}, ${item.lon}], 17)" class="py-1 px-2 rounded-lg bg-gray-950 text-white text-[11px] font-bold">
          Zoom Pin
        </button>
      </div>
    `).join('');
  } catch (e) {
    titleEl.textContent = 'Nearby scan busy — retry in a moment';
  }
}

function clearNearbyPlaces() {
  document.getElementById('nearby-results-drawer').classList.add('hidden');
  APP_STATE.nearbyLayerGroup?.clearLayers();
}

// ==================== 7. SAFETY SCORE, NIGHT/DAY SCORE, BLIND SPOTS & CLOSER LOOK ====================
function setTimeMode(mode) {
  APP_STATE.timeMode = mode;
  ['night', 'day'].forEach(m => {
    const btn = document.getElementById(`time-btn-${m}`);
    if (btn) {
      btn.className = m === mode
        ? 'time-mode-btn px-3 py-1.5 rounded-lg bg-white text-gray-950 shadow-2xs transition'
        : 'time-mode-btn px-3 py-1.5 rounded-lg text-gray-300 hover:text-white transition';
    }
  });
  renderSafetyPanel();
}

function computeRouteSafety(routeObj) {
  const timePts = APP_STATE.timeMode === 'day' ? 15 : 9;
  const penalty = (routeObj.blindSpots * 3) + (routeObj.liquorHazards * 4);
  const raw = routeObj.baseLights + routeObj.basePoliceShops + routeObj.baseCrowd + routeObj.baseCameras + timePts + routeObj.baseReports - penalty;
  const total = Math.min(99, Math.max(18, raw));
  return {
    total,
    lights: routeObj.baseLights,
    policeShops: routeObj.basePoliceShops,
    crowd: routeObj.baseCrowd,
    cameras: routeObj.baseCameras,
    daylight: timePts,
    penalty
  };
}

function renderSafetyPanel() {
  const active = APP_STATE.routes[APP_STATE.selectedRouteKey];
  const safe = APP_STATE.routes.safe;
  const unsafe = APP_STATE.routes.unsafe;
  const scoreObj = computeRouteSafety(active);

  document.getElementById('nav-score-badge').textContent = scoreObj.total;
  document.getElementById('safety-total-score').innerHTML = `${scoreObj.total}<span class="text-sm font-normal text-gray-400">/100</span>`;
  document.getElementById('safety-route-pill').textContent = active.title;
  document.getElementById('safety-women-badge').textContent = `♀ Recommended by ${active.womenEndorsements} Women (${active.ratingAvg}★)`;
  document.getElementById('safety-corridor-title').textContent = `${APP_STATE.origin.name.split(',')[0]} → ${APP_STATE.dest.name.split(',')[0]}`;

  const isNight = APP_STATE.timeMode === 'night';
  const labelTitle = isNight ? 'Night Activity Score' : 'Day Activity Score';
  const grid = document.getElementById('night-day-comparison-grid');
  if (grid) {
    grid.innerHTML = [safe, unsafe].map((r, idx) => {
      const val = isNight ? r.nightActivityScore : r.dayActivityScore;
      const isSel = APP_STATE.selectedRouteKey === r.key;
      const dashOffset = Math.round(176 - (176 * val) / 100);
      return `
        <div onclick="selectRouteOption('${r.key}')" class="cursor-pointer rounded-2xl p-4 border transition ${isSel ? 'border-white bg-white/10' : 'border-gray-800 bg-white/5 hover:border-gray-700'}">
          <div class="flex items-center justify-between text-xs font-bold mb-3">
            <span>${r.title} · Comparison rank ${idx + 1}</span>
            <span class="w-5 h-5 rounded-full flex items-center justify-center ${isSel ? 'bg-white text-gray-950' : 'border border-gray-600'}">${isSel ? '✓' : ''}</span>
          </div>
          <div class="flex items-center gap-4">
            <div class="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg class="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.15)" stroke-width="5" fill="none" />
                <circle cx="32" cy="32" r="28" stroke="${isSel ? '#FFFFFF' : '#9CA3AF'}" stroke-width="5" stroke-dasharray="176" stroke-dashoffset="${dashOffset}" stroke-linecap="round" fill="none" />
              </svg>
              <div class="absolute text-center">
                <span class="text-base font-extrabold font-mono block leading-none">${val}</span>
                <span class="text-[9px] text-gray-400">/ 100</span>
              </div>
            </div>
            <div>
              <p class="text-sm font-bold text-white">${labelTitle}</p>
              <p class="text-[11px] text-gray-400">Activity points · ${r.shops} open places along path</p>
              <p class="text-sm font-extrabold font-mono text-white mt-1">${r.durationMin} min <span class="text-xs font-normal text-gray-400">· ${formatDistance(r.distanceKm)}</span></p>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  const bars = [
    { label: '1. Street Lights Coverage', val: scoreObj.lights, max: 25, color: 'bg-amber-400', note: `${active.lamps} street lamps mapped` },
    { label: '2. Police + Open Shops', val: scoreObj.policeShops, max: 25, color: 'bg-emerald-500', note: `${active.shops} active places • ${active.police} police post` },
    { label: '3. Mapped Surveillance Cameras', val: scoreObj.cameras, max: 15, color: 'bg-cyan-500', note: `${active.cameras} public cameras along route` },
    { label: '4. Main Road + Crowd Activity', val: scoreObj.crowd, max: 20, color: 'bg-blue-500', note: active.crowdLabel },
    { label: '5. Daylight / Sunset Visibility', val: scoreObj.daylight, max: 15, color: 'bg-indigo-500', note: `Mode: ${APP_STATE.timeMode.toUpperCase()}` }
  ];
  document.getElementById('safety-weighted-bars').innerHTML = bars.map(b => `
    <div class="p-3 rounded-xl bg-gray-50 border border-gray-200/80">
      <div class="flex justify-between font-bold text-gray-900 mb-1">
        <span>${b.label}</span>
        <span class="font-mono">${b.val}/${b.max}</span>
      </div>
      <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div class="h-full ${b.color} rounded-full" style="width:${Math.round((b.val / b.max) * 100)}%"></div>
      </div>
      <p class="text-[11px] text-gray-500 mt-1">${b.note}</p>
    </div>
  `).join('');

  document.getElementById('penalty-total-badge').textContent = scoreObj.penalty === 0 ? '0 pts Penalty' : `-${scoreObj.penalty} pts Penalty`;
  document.getElementById('blindspot-penalties-list').innerHTML = `
    <div class="p-3 rounded-2xl bg-gray-50 border border-gray-200">
      <p class="text-[10px] font-bold uppercase text-gray-400">Unlit Blind Spots</p>
      <p class="text-sm font-extrabold font-mono text-gray-950 mt-0.5">${active.blindSpots} segments</p>
      <p class="text-[11px] text-gray-500">No cameras or open shops</p>
    </div>
    <div class="p-3 rounded-2xl bg-gray-50 border border-gray-200">
      <p class="text-[10px] font-bold uppercase text-gray-400">Liquor / Smoking Spots</p>
      <p class="text-sm font-extrabold font-mono text-gray-950 mt-0.5">${active.liquorHazards} zones</p>
      <p class="text-[11px] text-gray-500">Late-night loitering deduction</p>
    </div>
    <div class="p-3 rounded-2xl bg-gray-50 border border-gray-200">
      <p class="text-[10px] font-bold uppercase text-gray-400">Street Lamp Gaps</p>
      <p class="text-sm font-extrabold font-mono text-gray-950 mt-0.5">${active.key === 'safe' ? 'Low' : 'High'}</p>
      <p class="text-[11px] text-gray-500">Continuous illumination check</p>
    </div>
  `;

  document.getElementById('women-reviews-list').innerHTML = active.reviews.map(rev => `
    <div class="p-3 rounded-2xl bg-pink-50/50 border border-pink-100">
      <div class="flex items-center justify-between font-bold text-pink-950">
        <span>${rev.author}</span>
        <span class="text-amber-500">${'★'.repeat(rev.rating)}</span>
      </div>
      <p class="text-gray-700 mt-1">${rev.text}</p>
    </div>
  `).join('');

  renderSafetyRadar();
}

function renderSafetyRadar() {
  const container = document.getElementById('safety-radar-container');
  if (!container) return;
  const safe = computeRouteSafety(APP_STATE.routes.safe);
  const unsafe = computeRouteSafety(APP_STATE.routes.unsafe);

  const axes = [
    { label: 'Lights', s: safe.lights / 25, u: unsafe.lights / 25 },
    { label: 'Shops/Police', s: safe.policeShops / 25, u: unsafe.policeShops / 25 },
    { label: 'Cameras', s: safe.cameras / 15, u: unsafe.cameras / 15 },
    { label: 'Crowd', s: safe.crowd / 20, u: unsafe.crowd / 20 },
    { label: 'Daylight', s: safe.daylight / 15, u: unsafe.daylight / 15 }
  ];

  const cx = 115, cy = 110, rMax = 72;
  const pts = (key) => axes.map((a, i) => {
    const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    const r = rMax * Math.max(0.15, Math.min(1, a[key]));
    return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');

  const labelsSvg = axes.map((a, i) => {
    const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    const lx = cx + (rMax + 22) * Math.cos(angle);
    const ly = cy + (rMax + 16) * Math.sin(angle);
    return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" fill="#4B5563" font-size="9" font-weight="700">${a.label}</text>`;
  }).join('');

  container.innerHTML = `
    <svg viewBox="0 0 230 220" class="w-full max-w-[240px]">
      <circle cx="${cx}" cy="${cy}" r="${rMax}" fill="none" stroke="#E5E7EB" />
      <circle cx="${cx}" cy="${cy}" r="${rMax * 0.6}" fill="none" stroke="#E5E7EB" stroke-dasharray="3,3" />
      <polygon points="${pts('u')}" fill="rgba(239,68,68,0.16)" stroke="#EF4444" stroke-width="1.5" />
      <polygon points="${pts('s')}" fill="rgba(16,185,129,0.22)" stroke="#10B981" stroke-width="2" />
      ${labelsSvg}
    </svg>
  `;
}

function openCloserLookModal() {
  APP_STATE.closerLookRouteKey = APP_STATE.selectedRouteKey;
  renderCloserLookMetrics();
  document.getElementById('closer-look-modal').classList.remove('hidden');
}

function closeCloserLookModal() {
  document.getElementById('closer-look-modal').classList.add('hidden');
}

function switchCloserLookRoute(key) {
  APP_STATE.closerLookRouteKey = key;
  renderCloserLookMetrics();
}

function renderCloserLookMetrics() {
  const isSafe = APP_STATE.closerLookRouteKey === 'safe';
  document.getElementById('closer-btn-safe').className = isSafe ? 'flex-1 py-2 rounded-xl bg-white text-gray-950 text-xs font-bold' : 'flex-1 py-2 rounded-xl bg-white/10 text-gray-300 text-xs font-bold';
  document.getElementById('closer-btn-unsafe').className = !isSafe ? 'flex-1 py-2 rounded-xl bg-white text-gray-950 text-xs font-bold' : 'flex-1 py-2 rounded-xl bg-white/10 text-gray-300 text-xs font-bold';

  const rows = isSafe ? [
    { label: 'Open places along the route', score: '14.3 / 25 pts' },
    { label: 'Distance on main roads (84% arterial)', score: '12.0 / 15 pts' },
    { label: 'Open help points nearby', score: '7.9 / 15 pts' },
    { label: 'Fewer gaps between open places', score: '15.0 / 15 pts' },
    { label: 'Fewer turns', score: '8.2 / 10 pts' },
    { label: 'Transport locations listed open', score: '5.6 / 10 pts' }
  ] : [
    { label: 'Open places along the route', score: '4.8 / 25 pts' },
    { label: 'Distance on main roads (28% arterial)', score: '4.2 / 15 pts' },
    { label: 'Open help points nearby', score: '2.5 / 15 pts' },
    { label: 'Fewer gaps between open places', score: '5.0 / 15 pts' },
    { label: 'Fewer turns', score: '6.1 / 10 pts' },
    { label: 'Transport locations listed open', score: '2.0 / 10 pts' }
  ];

  document.getElementById('closer-look-rows').innerHTML = rows.map(r => `
    <div class="py-3 flex items-center justify-between gap-3">
      <span class="text-gray-300">${r.label}</span>
      <span class="font-mono font-bold text-white shrink-0">${r.score}</span>
    </div>
  `).join('');
}

async function runLiveOverpassScan(silent = false) {
  const [lat, lon] = APP_STATE.origin.coords;
  if (!silent) showToast('Scanning live OpenStreetMap cameras, lamps & shops...');
  try {
    const query = `[out:json][timeout:8];(node["man_made"="surveillance"](around:1500,${lat},${lon});node["highway"="street_lamp"](around:1000,${lat},${lon});node["shop"](around:1000,${lat},${lon}););out body 60;`;
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`
    }).then(r => r.json());

    const elements = res?.elements || [];
    const cams = elements.filter(e => e.tags?.man_made === 'surveillance').length;
    const lamps = elements.filter(e => e.tags?.highway === 'street_lamp').length;
    const shops = elements.filter(e => e.tags?.shop).length;

    if (cams > 0) APP_STATE.routes.safe.cameras = Math.max(12, cams);
    if (lamps > 0) APP_STATE.routes.safe.lamps = Math.max(25, lamps);
    if (shops > 0) APP_STATE.routes.safe.shops = Math.max(20, shops);
    renderSafetyPanel();
    if (!silent) showToast(`Synced ${APP_STATE.routes.safe.cameras} cameras & ${APP_STATE.routes.safe.lamps} street lamps.`);
  } catch (e) {}
}

// ==================== 8. POST-JOURNEY ROUTE RATING ====================
function openRateRouteModal() {
  document.getElementById('rate-route-modal').classList.remove('hidden');
}

function closeRateRouteModal() {
  document.getElementById('rate-route-modal').classList.add('hidden');
}

function setRatingStars(count) {
  APP_STATE.ratingStars = count;
  document.querySelectorAll('.star-btn').forEach((btn, idx) => {
    btn.className = idx < count ? 'star-btn text-3xl text-amber-400' : 'star-btn text-3xl text-gray-300';
  });
}

function toggleFeedbackTag(btn, tag) {
  const idx = APP_STATE.selectedTags.indexOf(tag);
  if (idx >= 0) {
    APP_STATE.selectedTags.splice(idx, 1);
    btn.className = 'fb-tag-btn px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-semibold';
  } else {
    APP_STATE.selectedTags.push(tag);
    btn.className = 'fb-tag-btn px-3 py-1.5 rounded-full bg-gray-950 text-white font-semibold';
  }
}

function submitRouteFeedback() {
  const active = APP_STATE.routes[APP_STATE.selectedRouteKey];
  const isWoman = document.getElementById('rate-woman-check').checked;
  const comment = document.getElementById('rate-comment-input').value.trim() || `Verified ${APP_STATE.selectedTags.join(', ') || 'smooth journey'}.`;

  if (isWoman) active.womenEndorsements += 1;
  active.ratingAvg = +((active.ratingAvg * 10 + APP_STATE.ratingStars) / 11).toFixed(1);
  active.reviews.unshift({
    author: isWoman ? 'You (Verified Woman)' : 'You (Verified Traveler)',
    rating: APP_STATE.ratingStars,
    text: comment
  });

  closeRateRouteModal();
  renderRoutesPanel();
  renderSafetyPanel();
  showToast('Thank you! Your route safety rating has been added.');
}

// ==================== 9. PANIC SOS, TRUSTED PARENTS & WOMEN CIRCLE ====================
function renderTrustedContacts() {
  const list = document.getElementById('trusted-contacts-list');
  const badge = document.getElementById('trusted-count-badge');
  if (badge) badge.textContent = `${APP_STATE.trustedContacts.length} Saved`;
  if (!list) return;

  list.innerHTML = APP_STATE.trustedContacts.map(c => `
    <div class="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-2">
      <div class="min-w-0">
        <div class="flex items-center gap-1.5">
          <span class="text-xs font-extrabold text-gray-950 truncate">${c.name}</span>
          <span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">${c.relation}</span>
        </div>
        <p class="text-[11px] font-mono text-gray-600 mt-0.5">${c.phone}</p>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <a href="tel:${c.phone.replace(/[^0-9+]/g, '')}" class="px-2.5 py-1.5 rounded-xl bg-gray-950 text-white text-[11px] font-bold">Call</a>
        <button onclick="sendWhatsAppGPSToContact('${c.phone}')" class="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold">GPS</button>
        <button onclick="removeTrustedContact(${c.id})" class="px-1.5 py-1 text-gray-400 hover:text-red-600 text-xs font-bold">✕</button>
      </div>
    </div>
  `).join('');
}

function addTrustedContact() {
  const name = document.getElementById('contact-name-input').value.trim();
  const phone = document.getElementById('contact-phone-input').value.trim();
  const relation = document.getElementById('contact-relation-input').value;
  if (!name || !phone) {
    showToast('Enter contact name and mobile number.', 'amber');
    return;
  }
  APP_STATE.trustedContacts.push({ id: Date.now(), name, phone, relation });
  document.getElementById('contact-name-input').value = '';
  document.getElementById('contact-phone-input').value = '';
  renderTrustedContacts();
  showToast(`Added ${name} (${relation}) to your Trusted SOS Circle.`);
}

function removeTrustedContact(id) {
  APP_STATE.trustedContacts = APP_STATE.trustedContacts.filter(c => c.id !== id);
  renderTrustedContacts();
}

function sendWhatsAppGPSToContact(phone) {
  const [lat, lon] = APP_STATE.gps.coords || APP_STATE.origin.coords;
  const digits = phone.replace(/[^0-9]/g, '');
  const waPhone = digits.length === 10 ? `91${digits}` : digits;
  const msg = `VYLO SOS LIVE GPS: I need assistance on ${APP_STATE.routes[APP_STATE.selectedRouteKey].title}. Live Pin: https://maps.google.com/?q=${lat},${lon}`;
  window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
}

function triggerFullSOS() {
  const [lat, lon] = APP_STATE.gps.coords || APP_STATE.origin.coords;
  const banner = document.getElementById('sos-dispatch-banner');
  const coordsEl = document.getElementById('sos-live-coords-text');
  const actionsEl = document.getElementById('sos-contacts-quick-actions');

  banner.classList.remove('hidden');
  coordsEl.textContent = `Live Laptop GPS: ${lat.toFixed(5)}, ${lon.toFixed(5)} • Corridor: ${APP_STATE.origin.name} → ${APP_STATE.dest.name}`;
  actionsEl.innerHTML = APP_STATE.trustedContacts.map(c => `
    <button onclick="sendWhatsAppGPSToContact('${c.phone}')" class="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold">
      Send Live GPS to ${c.name} ↗
    </button>
  `).join('');

  showToast('EMERGENCY SOS TRIGGERED — Police 112 & Parents Alerted!', 'red');
}

function renderWomenCircleFeed() {
  const feed = document.getElementById('women-circle-feed');
  if (!feed) return;
  feed.innerHTML = APP_STATE.womenCirclePosts.map(p => `
    <div class="p-3 rounded-2xl bg-white/5 border border-white/10">
      <div class="flex items-center justify-between text-[11px] text-pink-300 font-semibold">
        <span>${p.alias}</span>
        <span class="text-gray-400">${p.time}</span>
      </div>
      <p class="text-gray-200 mt-1">${p.text}</p>
    </div>
  `).join('');
}

function postWomenCircleUpdate() {
  const input = document.getElementById('women-circle-input');
  const text = input.value.trim();
  if (!text) return;
  APP_STATE.womenCirclePosts.unshift({
    alias: 'You (Masked Member • Local Cluster)',
    time: 'Just now',
    text
  });
  input.value = '';
  renderWomenCircleFeed();
  showToast('Posted anonymously to your locality Women Safety Circle.');
}

function triggerSilentCheckOnMe() {
  APP_STATE.womenCirclePosts.unshift({
    alias: 'Silent "Check on Me" • Member #704',
    time: 'Just now',
    text: `Walking along ${APP_STATE.routes[APP_STATE.selectedRouteKey].via} — nearby verified members notified.`
  });
  renderWomenCircleFeed();
  showToast('Silent "Check on Me" sent to nearby women in your cluster.');
}

function showToast(message, tone = 'dark') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  const bg = tone === 'red' ? 'bg-red-600 text-white' : tone === 'amber' ? 'bg-amber-500 text-gray-950' : 'bg-gray-950 text-white';
  el.className = `pointer-events-auto px-4 py-3 rounded-2xl shadow-xl text-xs font-bold border border-white/10 ${bg}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function initVyloApp() {
  try {
    const savedTheme = localStorage.getItem('vylo_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      applyAppTheme(savedTheme);
    }
  } catch (e) {}
  renderRoutesPanel();
  renderSafetyPanel();
  renderTrustedContacts();
  renderWomenCircleFeed();
  searchRealRoutes();
  activateLaptopGPS(true, true);
}

/* ---- expose globals (classic-script behaviour) so inline handlers keep working ---- */
Object.assign(window, {
  APP_STATE,
  applyAppTheme,
  toggleAppTheme,
  getStationByName,
  getLineSegmentStations,
  findNearestMetroStation,
  computeDelhiMetroPlan,
  computeDelhiBusPlan,
  updateDelhiMetroUI,
  updateDelhiBusUI,
  openMetroMapModal,
  closeMetroMapModal,
  filterMetroNetworkLine,
  renderMetroSchematicSVG,
  inspectMetroStation,
  setStationAsRoutePoint,
  viewMetroOnLiveMap,
  switchPrimaryTab,
  applyResolvedUserLocation,
  fallbackToLaptopNetworkLocation,
  activateLaptopGPS,
  enableMapPinDropGPS,
  updateGPSMarkerOnMap,
  haversineKm,
  formatDistance,
  computeArrivalClock,
  handlePlaceAutocomplete,
  selectAutocompletePlace,
  clearDestinationInput,
  setTravelMode,
  applyQuickRoute,
  geocodeTypedAddress,
  searchRealRoutes,
  renderRoutesPanel,
  selectRouteOption,
  toggleForceSafestRoad,
  setRidePickupMode,
  updateRideAppEstimates,
  connectRideApp,
  shareRidePlanWithParents,
  createResilientTileLayer,
  initLeafletMap,
  setMapTileLayer,
  getPolylineMidpoint,
  interpolateAlongPath,
  toggleRouteInfraPins,
  toggleInfraCategory,
  renderRouteInfrastructurePins,
  renderMapRoutes,
  recenterMapOnUserOrRoute,
  toggleLiveWalkSimulation,
  searchNearbyPlaces,
  clearNearbyPlaces,
  setTimeMode,
  computeRouteSafety,
  renderSafetyPanel,
  renderSafetyRadar,
  openCloserLookModal,
  closeCloserLookModal,
  switchCloserLookRoute,
  renderCloserLookMetrics,
  runLiveOverpassScan,
  openRateRouteModal,
  closeRateRouteModal,
  setRatingStars,
  toggleFeedbackTag,
  submitRouteFeedback,
  renderTrustedContacts,
  addTrustedContact,
  removeTrustedContact,
  sendWhatsAppGPSToContact,
  triggerFullSOS,
  renderWomenCircleFeed,
  postWomenCircleUpdate,
  triggerSilentCheckOnMe,
  showToast,
});

let __vyloStarted = false;
export function startVylo() {
  if (__vyloStarted) return;
  __vyloStarted = true;
  initVyloApp();
}
