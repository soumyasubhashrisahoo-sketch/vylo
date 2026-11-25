/* Inline-handler functions (switchPrimaryTab, setTravelMode, ...) are exposed on window by src/legacy/vyloApp.js */
export default function MetroMapModal() {
  return (
    <>
    <div id="metro-map-modal" className="hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-[#13161F] text-gray-950 border border-gray-200 rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto panel-scroll">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider">DMRC Live Corridor Guide</span>
              <span id="metro-modal-active-corridor" className="text-xs font-mono font-bold text-indigo-600">Lajpat Nagar → South Campus</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold mt-0.5">Delhi Metro Network Map &amp; Line Directory</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={(event) => { viewMetroOnLiveMap(); closeMetroMapModal(); }} className="px-3.5 py-2 rounded-xl bg-gray-950 text-white text-xs font-bold hover:bg-gray-800 transition">Show on GPS Map →</button>
            <button onClick={(event) => { closeMetroMapModal(); }} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-950 font-bold">✕</button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto panel-scroll pb-1 text-xs font-bold">
          <button onClick={(event) => { filterMetroNetworkLine('ALL'); }} id="metro-filter-ALL" className="metro-line-filter px-3 py-1.5 rounded-xl bg-gray-950 text-white shrink-0">All Lines (7)</button>
          <button onClick={(event) => { filterMetroNetworkLine('Yellow'); }} id="metro-filter-Yellow" className="metro-line-filter px-3 py-1.5 rounded-xl bg-amber-100 text-amber-950 border border-amber-300 shrink-0">● Yellow Line</button>
          <button onClick={(event) => { filterMetroNetworkLine('Pink'); }} id="metro-filter-Pink" className="metro-line-filter px-3 py-1.5 rounded-xl bg-pink-100 text-pink-950 border border-pink-300 shrink-0">● Pink Line</button>
          <button onClick={(event) => { filterMetroNetworkLine('Blue'); }} id="metro-filter-Blue" className="metro-line-filter px-3 py-1.5 rounded-xl bg-blue-100 text-blue-950 border border-blue-300 shrink-0">● Blue Line</button>
          <button onClick={(event) => { filterMetroNetworkLine('Magenta'); }} id="metro-filter-Magenta" className="metro-line-filter px-3 py-1.5 rounded-xl bg-fuchsia-100 text-fuchsia-950 border border-fuchsia-300 shrink-0">● Magenta Line</button>
          <button onClick={(event) => { filterMetroNetworkLine('Violet'); }} id="metro-filter-Violet" className="metro-line-filter px-3 py-1.5 rounded-xl bg-purple-100 text-purple-950 border border-purple-300 shrink-0">● Violet Line</button>
          <button onClick={(event) => { filterMetroNetworkLine('Red'); }} id="metro-filter-Red" className="metro-line-filter px-3 py-1.5 rounded-xl bg-red-100 text-red-950 border border-red-300 shrink-0">● Red Line</button>
          <button onClick={(event) => { filterMetroNetworkLine('Airport'); }} id="metro-filter-Airport" className="metro-line-filter px-3 py-1.5 rounded-xl bg-orange-100 text-orange-950 border border-orange-300 shrink-0">● Airport Express</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-8 rounded-2xl bg-[#0F1219] border border-gray-800 p-3 overflow-hidden">
            <div id="delhi-metro-svg-container" className="w-full"></div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-gray-400">
              <span>Click any station dot on the schematic to inspect gates, interchanges &amp; set as destination</span>
              <span className="font-mono text-amber-300">◎ Double-Ring = Interchange Hub</span>
            </div>
          </div>
          <div className="lg:col-span-4 space-y-3">
            <div id="metro-station-inspector" className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2.5 text-xs"></div>
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-2 text-xs">
              <p className="font-extrabold text-indigo-950">DMRC Smart Fare &amp; Safety Rules</p>
              <ul className="space-y-1 text-gray-700 text-[11px]">
                <li>
                  • <strong>First Coach:</strong> Reserved for Women on all trains
                </li>
                <li>
                  • <strong>Smart Card / QR:</strong> 10%–20% discount off-peak
                </li>
                <li>
                  • <strong>DMRC Helpline:</strong> 155370 (24×7 CISF Control)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
