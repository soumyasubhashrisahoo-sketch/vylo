/* Inline-handler functions (switchPrimaryTab, setTravelMode, ...) are exposed on window by src/legacy/vyloApp.js */
export default function MapPanel() {
  return (
    <>
    <section id="panel-map" className="view-panel hidden h-full w-full relative bg-[#111318]">
      <div id="vylo-map" className="w-full h-full bg-[#111318]"></div>
      {/* Top-Left Floating Laptop GPS Control Bar */}
      <div className="absolute top-3 left-14 z-20 flex flex-wrap items-center gap-2">
        <button onClick={(event) => { activateLaptopGPS(true, false); }} className="px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-xs hover:bg-blue-50 border border-gray-200 shadow-md text-xs font-bold text-gray-900 flex items-center gap-2 transition">
          <span id="map-gps-dot" className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>{' '}<span id="map-gps-status-text">Use Laptop GPS</span>
        </button>
        <button onClick={(event) => { enableMapPinDropGPS(); }} id="btn-drop-gps-pin" className="px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-xs hover:bg-emerald-50 border border-gray-200 shadow-md text-xs font-semibold text-gray-800 transition">📍 Tap Map to Set GPS</button>
        <button onClick={(event) => { recenterMapOnUserOrRoute(); }} className="px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-xs hover:bg-gray-50 border border-gray-200 shadow-md text-xs font-semibold text-gray-800 transition">Center</button>
        <button onClick={(event) => { toggleLiveWalkSimulation(); }} className="px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-xs hover:bg-gray-50 border border-gray-200 shadow-md text-xs font-semibold text-gray-800 transition">
          <span id="map-sim-label">Simulate GPS Move</span>
        </button>
      </div>
      {/* Top-Right Map Style Switcher & Infrastructure Legend */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2">
        <div className="flex items-center gap-1.5">
          <button onClick={(event) => { openMetroMapModal(); }} className="px-3 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md text-xs font-bold flex items-center gap-1.5 transition">
            <span>🚇 Metro Map</span>
          </button>
          <div className="bg-white/95 backdrop-blur-xs border border-gray-200 rounded-2xl p-1 shadow-md flex items-center gap-1 text-xs font-semibold">
            <button onClick={(event) => { setMapTileLayer('night'); }} id="tile-btn-night" className="tile-btn px-2.5 py-1.5 rounded-xl bg-gray-950 text-white transition">Night</button>
            <button onClick={(event) => { setMapTileLayer('esriStreet'); }} id="tile-btn-esriStreet" className="tile-btn px-2.5 py-1.5 rounded-xl text-gray-600 hover:bg-gray-100 transition">Street</button>
            <button onClick={(event) => { setMapTileLayer('esriSat'); }} id="tile-btn-esriSat" className="tile-btn px-2.5 py-1.5 rounded-xl text-gray-600 hover:bg-gray-100 transition">Satellite</button>
          </div>
        </div>
        {/* Dark Glass Legend for Route Pins & Mapped Surveillance Cameras */}
        <div className="hidden sm:block w-72 rounded-2xl bg-[#12151C]/95 backdrop-blur-md border border-white/15 p-3 shadow-xl text-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Route Infrastructure Pins</span>
            <button onClick={(event) => { toggleRouteInfraPins(); }} id="btn-toggle-infra" className="text-[10px] font-bold text-amber-300 hover:underline">Hide Pins</button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-extrabold flex items-center justify-center border border-white/80">A</span>
              <span className="text-gray-200 truncate">Start / GPS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-extrabold flex items-center justify-center border border-white/80">B</span>
              <span className="text-gray-200 truncate">Destination</span>
            </div>
            <button onClick={(event) => { toggleInfraCategory('shops'); }} id="legend-btn-shops" className="flex items-center gap-2 text-left hover:opacity-80">
              <span className="w-4 h-4 rounded-full bg-yellow-400 text-gray-950 text-[9px] font-black flex items-center justify-center">S</span>{' '}<span className="text-gray-200 truncate">Shops</span>
            </button>
            <button onClick={(event) => { toggleInfraCategory('pharmacies'); }} id="legend-btn-pharmacies" className="flex items-center gap-2 text-left hover:opacity-80">
              <span className="w-4 h-4 rounded-full bg-pink-400 text-gray-950 text-[10px] font-black flex items-center justify-center">+</span>{' '}<span className="text-gray-200 truncate">Pharmacies</span>
            </button>
            <button onClick={(event) => { toggleInfraCategory('hospitals'); }} id="legend-btn-hospitals" className="flex items-center gap-2 text-left hover:opacity-80">
              <span className="w-4 h-4 rounded-full bg-indigo-400 text-gray-950 text-[9px] font-black flex items-center justify-center">H</span>{' '}<span className="text-gray-200 truncate">Hospitals</span>
            </button>
            <button onClick={(event) => { toggleInfraCategory('fuel'); }} id="legend-btn-fuel" className="flex items-center gap-2 text-left hover:opacity-80">
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-gray-950 text-[9px] font-black flex items-center justify-center">F</span>{' '}<span className="text-gray-200 truncate">Petrol / CNG</span>
            </button>
            <button onClick={(event) => { toggleInfraCategory('cameras'); }} id="legend-btn-cameras" className="col-span-2 flex items-center justify-between px-2 py-1 rounded-lg bg-cyan-500/15 border border-cyan-400/30 hover:bg-cyan-500/25">
              <span className="flex items-center gap-1.5 text-cyan-200 font-semibold">
              <span>📹</span>{' '}<span>Mapped Cameras</span>
              </span>{' '}<span id="legend-camera-count" className="font-mono text-[10px] font-bold text-cyan-300">2,803 city</span>
            </button>
          </div>
        </div>
      </div>
      {/* Nearby Places Quick-Scan Bar & Results Drawer */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-2xl space-y-2 pointer-events-none">
        <div id="nearby-results-drawer" className="hidden pointer-events-auto bg-white/95 backdrop-blur-xs border border-gray-200 rounded-2xl p-3 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span id="nearby-drawer-title" className="text-xs font-extrabold text-gray-950">Nearby Places</span>
            </div>
            <button onClick={(event) => { clearNearbyPlaces(); }} className="text-[11px] font-bold text-gray-400 hover:text-gray-700 px-1.5">✕ Clear</button>
          </div>
          <div id="nearby-results-list" className="flex gap-2 overflow-x-auto panel-scroll pb-1"></div>
        </div>
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto panel-scroll py-0.5 px-1">
          <span className="px-2.5 py-1.5 rounded-xl bg-gray-950/95 text-white text-[11px] font-bold shrink-0 shadow-xs">Nearby:</span>
          <button onClick={(event) => { searchNearbyPlaces('cameras'); }} id="nearby-btn-cameras" className="nearby-cat-btn px-3 py-1.5 rounded-xl bg-white/95 hover:bg-cyan-50 border border-gray-200 text-xs font-bold text-gray-800 shadow-sm shrink-0 transition">📹 Cameras</button>
          <button onClick={(event) => { searchNearbyPlaces('police'); }} id="nearby-btn-police" className="nearby-cat-btn px-3 py-1.5 rounded-xl bg-white/95 hover:bg-blue-50 border border-gray-200 text-xs font-bold text-gray-800 shadow-sm shrink-0 transition">🚔 Police</button>
          <button onClick={(event) => { searchNearbyPlaces('hospital'); }} id="nearby-btn-hospital" className="nearby-cat-btn px-3 py-1.5 rounded-xl bg-white/95 hover:bg-red-50 border border-gray-200 text-xs font-bold text-gray-800 shadow-sm shrink-0 transition">🏥 Hospital</button>
          <button onClick={(event) => { searchNearbyPlaces('shops'); }} id="nearby-btn-shops" className="nearby-cat-btn px-3 py-1.5 rounded-xl bg-white/95 hover:bg-emerald-50 border border-gray-200 text-xs font-bold text-gray-800 shadow-sm shrink-0 transition">🏪 Shops &amp; Cafes</button>
          <button onClick={(event) => { searchNearbyPlaces('transit'); }} id="nearby-btn-transit" className="nearby-cat-btn px-3 py-1.5 rounded-xl bg-white/95 hover:bg-indigo-50 border border-gray-200 text-xs font-bold text-gray-800 shadow-sm shrink-0 transition">🚇 Metro / Bus</button>
          <button onClick={(event) => { searchNearbyPlaces('lamps'); }} id="nearby-btn-lamps" className="nearby-cat-btn px-3 py-1.5 rounded-xl bg-white/95 hover:bg-amber-50 border border-gray-200 text-xs font-bold text-gray-800 shadow-sm shrink-0 transition">💡 Street Lamps</button>
        </div>
      </div>
      {/* Bottom Floating Live Distance & ETA Navigation Pill */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-xl bg-white/95 backdrop-blur-xs border border-gray-200 rounded-3xl px-4 py-3 shadow-xl flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span id="map-bottom-distance" className="text-base sm:text-lg font-extrabold font-mono text-gray-950">8.6 km</span>
            <span className="text-gray-300">•</span>
            <span id="map-bottom-duration" className="text-sm sm:text-base font-extrabold font-mono text-emerald-700">12 min</span>
          </div>
          <p id="map-bottom-corridor" className="text-xs text-gray-600 truncate mt-0.5">Safest route (Lajpat Nagar → South Campus)</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={(event) => { openRateRouteModal(); }} className="px-2.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs font-extrabold transition">★ Rate Route</button>
          <button onClick={(event) => { switchPrimaryTab('routes'); }} className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 transition">Routes</button>
          <button onClick={(event) => { switchPrimaryTab('safety'); }} className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition">Score</button>
        </div>
      </div>
    </section>
    </>
  );
}
