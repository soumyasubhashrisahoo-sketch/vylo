/* Inline-handler functions (switchPrimaryTab, setTravelMode, ...) are exposed on window by src/legacy/vyloApp.js */
export default function SafetyPanel() {
  return (
    <>
    <section id="panel-safety" className="view-panel hidden h-full overflow-y-auto panel-scroll bg-[#FAFAFA] p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Night & Day Activity Score Comparison Cards */}
        <div className="bg-[#121316] text-white rounded-3xl border border-gray-800 p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Time-of-Day Activity &amp; Women's Safety Index</span>
              <h2 className="text-base sm:text-lg font-extrabold text-white mt-0.5">Night Score vs. Day Score Comparison</h2>
            </div>
            <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/15 text-xs font-bold">
              <button onClick={(event) => { setTimeMode('night'); }} id="time-btn-night" className="time-mode-btn px-3 py-1.5 rounded-lg bg-white text-gray-950 shadow-2xs transition">Night Score</button>
              <button onClick={(event) => { setTimeMode('day'); }} id="time-btn-day" className="time-mode-btn px-3 py-1.5 rounded-lg text-gray-300 hover:text-white transition">Day Score</button>
            </div>
          </div>
          <div id="night-day-comparison-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
        </div>
        {/* Top Overall Safety Score Header Card */}
        <div className="bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span id="safety-route-pill" className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">Safest route</span>
              <span id="safety-women-badge" className="px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200 text-xs font-extrabold">♀ Recommended by 38 Women (4.8★)</span>
            </div>
            <h1 id="safety-corridor-title" className="text-lg sm:text-xl font-extrabold text-gray-950">Lajpat Nagar → South Campus</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Overall Safety</span>
              <span id="safety-total-score" className="text-3xl sm:text-4xl font-extrabold font-mono text-gray-950">
                86<span className="text-sm font-normal text-gray-400">/100</span>
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <button onClick={(event) => { openCloserLookModal(); }} className="px-3.5 py-2 rounded-xl bg-gray-950 hover:bg-gray-800 text-white text-xs font-bold transition">A closer look →</button>
              <button onClick={(event) => { openRateRouteModal(); }} className="px-3.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs font-bold transition">★ Rate This Route</button>
            </div>
          </div>
        </div>
        {/* Middle Grid: 5 Weighted Parameters + Blind-Spot Penalties & Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl border border-gray-200/90 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-gray-950">Weighted Safety &amp; Camera Coverage</h2>
                <button onClick={(event) => { runLiveOverpassScan(false); }} className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-800 transition">Refresh OSM Scan</button>
              </div>
              <div id="safety-weighted-bars" className="space-y-3 text-xs"></div>
            </div>
            {/* Blind-Spot & Risk Penalties Card */}
            <div className="bg-white rounded-3xl border border-gray-200/90 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Blind-Spot &amp; Hazard Deductions</span>
                  <h2 className="text-sm font-extrabold text-gray-950">Blind Spots &amp; Risk Penalties</h2>
                </div>
                <span id="penalty-total-badge" className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-xs font-extrabold">0 pts Penalty</span>
              </div>
              <div id="blindspot-penalties-list" className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs"></div>
            </div>
          </div>
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl border border-gray-200/90 p-5 shadow-2xs flex flex-col justify-between space-y-4">
              <div>
                <h2 className="text-sm font-extrabold text-gray-950">Safest vs. Fastest Comparison</h2>
                <p className="text-[11px] text-gray-500">5-axis infrastructure balance</p>
              </div>
              <div id="safety-radar-container" className="flex items-center justify-center"></div>
            </div>
            {/* Women Traveler Recommendations */}
            <div className="bg-white rounded-3xl border border-pink-200/80 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-pink-900">♀ Recommended by Women</span>
                <button onClick={(event) => { openRateRouteModal(); }} className="text-[11px] font-bold text-pink-700 hover:underline">+ Add Your Review</button>
              </div>
              <div id="women-reviews-list" className="space-y-2 text-xs"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
