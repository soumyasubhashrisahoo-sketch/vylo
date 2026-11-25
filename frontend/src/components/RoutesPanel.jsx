/* Inline-handler functions (switchPrimaryTab, setTravelMode, ...) are exposed on window by src/legacy/vyloApp.js */
export default function RoutesPanel() {
  return (
    <>
    <section id="panel-routes" className="view-panel h-full overflow-y-auto panel-scroll bg-[#FAFAFA] p-4 sm:p-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Where Are You Going? + Travel Mode */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Trip Planner</span>
              <h1 className="text-xl font-extrabold text-gray-950 tracking-tight mt-0.5">Where are you going?</h1>
              <p className="text-xs text-gray-500 mt-1">Search any destination or lock your laptop's live GPS.</p>
            </div>
          </div>
          {/* Laptop GPS Live Status Strip */}
          <div id="laptop-gps-card" className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span id="card-gps-dot" className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span id="card-gps-title" className="font-extrabold text-blue-950">Laptop GPS Ready</span>
              </div>
              <p id="card-gps-subtitle" className="text-[11px] font-mono text-blue-800/80 truncate mt-0.5">Click "Use Laptop GPS" to lock your coordinates</p>
            </div>
            <button type="button" onClick={(event) => { activateLaptopGPS(true, false); }} className="shrink-0 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-2xs transition">Detect Now</button>
          </div>
          {/* Pickup & Destination Inputs */}
          <div className="space-y-3">
            {/* Origin */}
            <div className="relative">
              <div className="flex items-center gap-3 rounded-2xl bg-gray-100/90 focus-within:bg-white focus-within:ring-2 focus-within:ring-gray-950 px-3.5 py-3 transition">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-950 shrink-0"></span>
                <input id="input-origin" type="text" defaultValue="Lajpat Nagar, New Delhi" onInput={(event) => { handlePlaceAutocomplete('origin', event.currentTarget.value); }} placeholder="Enter pickup location" className="w-full bg-transparent text-xs sm:text-sm font-semibold text-gray-950 focus:outline-hidden" />
                <button type="button" onClick={(event) => { activateLaptopGPS(true, false); }} className="shrink-0 px-2.5 py-1 rounded-xl bg-white hover:bg-blue-50 border border-gray-200 text-[11px] font-bold text-blue-700 shadow-2xs transition">Laptop GPS</button>
              </div>
              <div id="suggestions-origin" className="hidden absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden text-xs"></div>
            </div>
            {/* Destination */}
            <div className="relative">
              <div className="flex items-center gap-3 rounded-2xl bg-gray-100/90 focus-within:bg-white focus-within:ring-2 focus-within:ring-gray-950 px-3.5 py-3 transition">
                <span className="w-2.5 h-2.5 bg-gray-950 shrink-0"></span>
                <input id="input-dest" type="text" defaultValue="South Campus, Delhi University" onInput={(event) => { handlePlaceAutocomplete('dest', event.currentTarget.value); }} placeholder="Enter destination" className="w-full bg-transparent text-xs sm:text-sm font-semibold text-gray-950 focus:outline-hidden" />
                <button type="button" onClick={(event) => { clearDestinationInput(); }} title="Clear destination" className="shrink-0 w-6 h-6 rounded-full hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold transition">✕</button>
              </div>
              <div id="suggestions-dest" className="hidden absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden text-xs"></div>
            </div>
          </div>
          {/* Travel Mode Selector */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2.5">How do you want to go?</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button type="button" onClick={(event) => { setTravelMode('foot'); }} id="mode-btn-foot" className="travel-mode-btn p-2.5 rounded-2xl border-2 border-gray-950 bg-gray-50 text-left transition">
                <div className="flex items-center justify-between">
                  <span className="text-base">🚶</span>
                  <span id="mode-time-foot" className="text-[11px] font-mono font-bold text-gray-950">16m</span>
                </div>
                <p className="text-xs font-bold text-gray-950 mt-1">Walk</p>
                <p id="mode-dist-foot" className="text-[10px] font-mono text-gray-500">4.8 km</p>
              </button>
              <button type="button" onClick={(event) => { setTravelMode('metro'); }} id="mode-btn-metro" className="travel-mode-btn p-2.5 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 text-left transition">
                <div className="flex items-center justify-between">
                  <span className="text-base">🚇</span>
                  <span id="mode-time-metro" className="text-[11px] font-mono font-bold text-indigo-600">14m</span>
                </div>
                <p className="text-xs font-bold text-gray-950 mt-1">Delhi Metro</p>
                <p id="mode-dist-metro" className="text-[10px] font-mono text-gray-500">DMRC Rail</p>
              </button>
              <button type="button" onClick={(event) => { setTravelMode('bus'); }} id="mode-btn-bus" className="travel-mode-btn p-2.5 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 text-left transition">
                <div className="flex items-center justify-between">
                  <span className="text-base">🚌</span>
                  <span id="mode-time-bus" className="text-[11px] font-mono font-bold text-emerald-700">22m</span>
                </div>
                <p className="text-xs font-bold text-gray-950 mt-1">DTC Bus</p>
                <p id="mode-dist-bus" className="text-[10px] font-mono text-gray-500">AC / Low-Floor</p>
              </button>
              <button type="button" onClick={(event) => { setTravelMode('bike'); }} id="mode-btn-bike" className="travel-mode-btn p-2.5 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 text-left transition">
                <div className="flex items-center justify-between">
                  <span className="text-base">🛵</span>
                  <span id="mode-time-bike" className="text-[11px] font-mono font-bold text-gray-700">12m</span>
                </div>
                <p className="text-xs font-bold text-gray-950 mt-1">Bike</p>
                <p id="mode-dist-bike" className="text-[10px] font-mono text-gray-500">4.8 km</p>
              </button>
              <button type="button" onClick={(event) => { setTravelMode('driving'); }} id="mode-btn-driving" className="travel-mode-btn col-span-2 p-2.5 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 text-left transition">
                <div className="flex items-center justify-between">
                  <span className="text-base">🚕</span>
                  <span id="mode-time-driving" className="text-[11px] font-mono font-bold text-gray-700">10m</span>
                </div>
                <p className="text-xs font-bold text-gray-950 mt-1">Cab / Car</p>
                <p id="mode-dist-driving" className="text-[10px] font-mono text-gray-500">5.1 km</p>
              </button>
            </div>
          </div>
          {/* Search Button */}
          <button type="button" onClick={(event) => { searchRealRoutes(); }} id="btn-search-routes" className="w-full py-3.5 px-4 rounded-2xl bg-gray-950 hover:bg-gray-800 active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-sm transition flex items-center justify-center gap-2">
            <span>Find Routes &amp; Distance</span>{' '}<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"></path>
            </svg>
          </button>
          {/* Quick Corridors */}
          <div className="pt-2 border-t border-gray-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">Quick Places</span>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={(event) => { applyQuickRoute('Lajpat Nagar, New Delhi', [28.5677, 77.2433], 'South Campus, Delhi University', [28.5835, 77.1685]); }} className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[11px] font-semibold text-gray-800 transition">Lajpat Nagar → South Campus</button>
              <button type="button" onClick={(event) => { applyQuickRoute('Connaught Place, New Delhi', [28.6315, 77.2167], 'Hauz Khas Village, New Delhi', [28.5494, 77.2001]); }} className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[11px] font-semibold text-gray-800 transition">CP → Hauz Khas</button>
              <button type="button" onClick={(event) => { applyQuickRoute('Saket District Centre, New Delhi', [28.5245, 77.2166], 'AIIMS Main Gate, New Delhi', [28.5672, 77.2100]); }} className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[11px] font-semibold text-gray-800 transition">Saket → AIIMS</button>
            </div>
          </div>
        </div>
        {/* RIGHT COLUMN: Route Distance Results, Delhi Metro, DTC Bus & Ride-Hailing Check */}
        <div className="lg:col-span-7 space-y-4">
          {/* Trip Distance & ETA Banner */}
          <div className="bg-white rounded-3xl border border-gray-200/90 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span id="routes-mode-badge" className="px-2.5 py-0.5 rounded-full bg-gray-950 text-white text-[10px] font-bold uppercase tracking-wider">Walking Route</span>
                <span id="routes-straight-line" className="text-xs font-mono text-gray-500">Straight-line: 7.5 km</span>
              </div>
              <h2 id="routes-trip-heading" className="text-base sm:text-lg font-extrabold text-gray-950 mt-1.5">Lajpat Nagar → South Campus</h2>
            </div>
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-2">
                <span id="routes-primary-distance" className="text-2xl sm:text-3xl font-extrabold font-mono text-gray-950">8.6 km</span>
                <span id="routes-primary-duration" className="text-sm font-bold font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">12 min</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">Choose either Safest or Fastest path</p>
            </div>
          </div>
          {/* Safest vs. Fastest Route Cards */}
          <div id="routes-cards-container" className="space-y-3"></div>
          {/* 1. DEDICATED DELHI METRO RAIL (DMRC) SYSTEM CARD */}
          <div className="bg-white rounded-3xl border border-indigo-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-[11px] font-extrabold">🚇 DELHI METRO (DMRC)</span>
                <span id="metro-line-badge" className="px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-900 border border-pink-300 text-xs font-extrabold">Pink Line</span>
              </div>
              <div className="flex items-center gap-2">
                <span id="metro-stops-badge" className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">6 stops • 14 min</span>
                <span id="metro-fare-badge" className="font-mono text-xs font-extrabold text-gray-950">₹30 Token / ₹27 Card</span>
              </div>
            </div>
            <p id="metro-route-summary" className="text-xs text-gray-700 leading-relaxed">
              Board at <strong>Lajpat Nagar Metro (Pink Line)</strong> → Direct train to <strong>Durgabai Deshmukh South Campus Metro</strong>.
            </p>
            {/* Detailed Metro Station, Gate, Platform & Timings Grid */}
            <div id="metro-details-grid" className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200/80">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block">Boarding &amp; Gate</span>
                <span id="metro-board-info" className="font-bold text-gray-950 block truncate mt-0.5">Lajpat Nagar • Gate 2</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200/80">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block">Platform &amp; Coach</span>
                <span id="metro-platform-info" className="font-bold text-gray-950 block truncate mt-0.5">PF 1 • 1st Women Coach</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200/80">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block">Interchange</span>
                <span id="metro-interchange-info" className="font-bold text-gray-950 block truncate mt-0.5">Direct (No Change)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200/80">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block">First / Last Train</span>
                <span id="metro-timing-info" className="font-mono font-bold text-gray-950 block truncate mt-0.5">05:45 AM – 11:25 PM</span>
              </div>
            </div>
            {/* Station-by-Station Hop Strip */}
            <div id="metro-stations-strip" className="flex items-center gap-1.5 overflow-x-auto panel-scroll pt-1 text-[11px]"></div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-[11px]">
              <span className="text-gray-500">CISF security, CCTV &amp; dedicated Ladies Coach on every train</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={(event) => { openMetroMapModal(); }} className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition">🗺️ Open Delhi Metro Map</button>
                <button type="button" onClick={(event) => { viewMetroOnLiveMap(); }} className="px-3 py-1.5 rounded-xl bg-gray-950 hover:bg-gray-800 text-white font-bold transition">Plot Metro on Map →</button>
              </div>
            </div>
          </div>
          {/* 2. SEPARATE DTC / CLUSTER PUBLIC BUS CARD */}
          <div className="bg-white rounded-3xl border border-emerald-200/90 p-4 sm:p-5 shadow-2xs space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white text-[11px] font-extrabold">🚌 DTC / CLUSTER BUS</span>
                <span id="bus-routes-badge" className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold">Route 543 • 433CL • AC-729</span>
              </div>
              <span id="bus-fare-badge" className="font-mono text-xs font-extrabold text-gray-950">₹10–₹25 (Free Pink Ticket for Women)</span>
            </div>
            <p id="bus-route-summary" className="text-xs text-gray-700 leading-relaxed">
              Board at <strong>Lajpat Nagar Ring Road Bus Stand</strong> → Alight at <strong>South Campus / Moti Bagh Stop</strong> • Frequency: Every 8–10 mins • GPS-tracked low-floor bus with CCTV &amp; marshals.
            </p>
          </div>
          {/* Connect & Compare Uber, Ola & Rapido — Pickup & Safest Road */}
          <div className="bg-white rounded-3xl border border-gray-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ride-Hailing Safety Check</span>
                <h3 className="text-sm sm:text-base font-extrabold text-gray-950">Compare Uber, Ola &amp; Rapido — Pickup &amp; Safest Road</h3>
              </div>
              <button type="button" onClick={(event) => { toggleForceSafestRoad(); }} id="btn-force-safe-road" className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-2xs transition flex items-center gap-1.5">
                <span>✓ Safest Road Locked</span>
              </button>
            </div>
            {/* 1. Take From Where (Pickup Point Selector) */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold text-gray-800">1. Take From Where (Pickup Point)</span>
                <span id="ride-pickup-light-badge" className="text-[11px] font-bold text-emerald-700">💡 Well-Lit Main Road</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button type="button" onClick={(event) => { setRidePickupMode('safeMainRoad'); }} id="pickup-mode-safe" className="text-left p-2.5 rounded-xl border-2 border-emerald-600 bg-white transition">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-extrabold text-gray-950">Main Road Junction</span>
                    <span id="safe-pickup-walk-badge" className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold">55m walk</span>
                  </div>
                  <p id="safe-pickup-spot-name" className="text-[11px] text-gray-600 truncate mt-0.5">Lajpat Nagar Main Road Junction</p>
                </button>
                <button type="button" onClick={(event) => { setRidePickupMode('exactDoorstep'); }} id="pickup-mode-exact" className="text-left p-2.5 rounded-xl border border-gray-200 bg-white/70 hover:bg-white transition">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-extrabold text-gray-950">Exact Pin / Doorstep</span>
                    <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono text-[10px] font-bold">0m walk</span>
                  </div>
                  <p id="exact-pickup-spot-name" className="text-[11px] text-gray-600 truncate mt-0.5">Lajpat Nagar, New Delhi</p>
                </button>
              </div>
            </div>
            {/* 2. Provider Comparison Cards (Uber vs Ola vs Rapido) */}
            <div id="ride-comparison-cards" className="grid grid-cols-1 sm:grid-cols-3 gap-3"></div>
            <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
              <span>Pre-fills pickup &amp; safest corridor coordinates</span>
              <button type="button" onClick={(event) => { shareRidePlanWithParents(); }} className="font-bold text-emerald-700 hover:underline">Share Ride Plan with Parents ↗</button>
            </div>
          </div>
          {/* Direct Action Bar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-600">
              Selected: <strong id="routes-selected-name" className="text-gray-950">Safest route</strong>
            </p>
            <div className="flex items-center gap-2">
              <button onClick={(event) => { switchPrimaryTab('safety'); }} className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold transition">Inspect Safety Score →</button>
              <button onClick={(event) => { switchPrimaryTab('map'); }} className="px-4 py-2.5 rounded-xl bg-gray-950 hover:bg-gray-800 text-white text-xs font-bold transition flex items-center gap-1.5">
                <span>View on Live Map</span>{' '}<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
