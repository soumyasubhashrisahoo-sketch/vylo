/* Inline-handler functions (switchPrimaryTab, setTravelMode, ...) are exposed on window by src/legacy/vyloApp.js */
export default function Header() {
  return (
    <>
    <header className="h-14 shrink-0 bg-white border-b border-gray-200/90 px-3 sm:px-6 flex items-center justify-between gap-2 z-30">
      {/* Brand */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gray-950 text-white flex items-center justify-center shadow-2xs">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4"></path>
          </svg>
        </div>
        <div className="hidden sm:block">
          <span className="font-extrabold text-sm tracking-tight text-gray-950 block leading-none">Vylo</span>
          <span className="text-[10px] font-medium text-gray-400">Safety-First Navigation</span>
        </div>
      </div>
      {/* Primary Separated Workspace Tabs */}
      <nav className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/80 gap-1 overflow-x-auto panel-scroll">
        <button onClick={(event) => { switchPrimaryTab('routes'); }} id="tab-btn-routes" className="primary-tab-btn px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-gray-950 shadow-2xs transition flex items-center gap-1.5 whitespace-nowrap">
          <span>1. Routes</span>
        </button>
        <button onClick={(event) => { switchPrimaryTab('map'); }} id="tab-btn-map" className="primary-tab-btn px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-950 transition flex items-center gap-1.5 whitespace-nowrap">
          <span>2. Live Map</span>{' '}<span id="nav-gps-dot" className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
        </button>
        <button onClick={(event) => { switchPrimaryTab('safety'); }} id="tab-btn-safety" className="primary-tab-btn px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-950 transition flex items-center gap-1.5 whitespace-nowrap">
          <span>3. Safety Score</span>{' '}<span id="nav-score-badge" className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">86</span>
        </button>
        <button onClick={(event) => { switchPrimaryTab('panic'); }} id="tab-btn-panic" className="primary-tab-btn px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition flex items-center gap-1.5 whitespace-nowrap">
          <span>Panic SOS</span>
        </button>
      </nav>
      {/* Right Theme Toggle & Laptop Live GPS Status Pill */}
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={(event) => { toggleAppTheme(); }} id="theme-toggle-btn" title="Switch Light / Dark Theme" className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-800 text-xs font-bold transition flex items-center gap-1.5">
          <span id="theme-toggle-icon">🌙</span>{' '}<span id="theme-toggle-label" className="hidden md:inline">Dark</span>
        </button>
        <button onClick={(event) => { activateLaptopGPS(true, false); }} id="header-gps-btn" title="Use Laptop Hardware / Wi-Fi GPS" className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition flex items-center gap-1.5">
          <span id="header-gps-indicator" className="w-2 h-2 rounded-full bg-blue-600"></span>{' '}<span id="header-gps-label">Use Laptop GPS</span>
        </button>
      </div>
    </header>
    </>
  );
}
