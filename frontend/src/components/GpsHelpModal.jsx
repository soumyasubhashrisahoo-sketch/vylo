/* Inline-handler functions (switchPrimaryTab, setTravelMode, ...) are exposed on window by src/legacy/vyloApp.js */
export default function GpsHelpModal() {
  return (
    <>
    <div id="laptop-gps-help-modal" className="hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white text-gray-950 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Laptop Location Services</span>
            <h3 className="text-lg font-extrabold mt-0.5">Enable Your Laptop's GPS</h3>
          </div>
          <button onClick={(event) => { document.getElementById('laptop-gps-help-modal').classList.add('hidden'); }} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-950">✕</button>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">Your browser or preview frame blocked automatic hardware location access. You can enable it in two ways:</p>
        <div className="space-y-2 text-xs bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
          <p className="font-bold text-gray-950">1. Browser &amp; OS Location Permission:</p>
          <p className="text-gray-600">
            Click the <strong>Lock / Site Settings icon</strong> in your browser address bar → set <strong>Location</strong> to <strong>Allow</strong>, and ensure Windows/macOS <strong>Location Services</strong> are turned ON.
          </p>
          <p className="font-bold text-gray-950 pt-1.5">2. Instant Map Pin Lock:</p>
          <p className="text-gray-600">
            Open <strong>2. Live Map</strong> and click <strong>📍 Tap Map to Set GPS</strong> to click directly on your building or street.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={(event) => { document.getElementById('laptop-gps-help-modal').classList.add('hidden'); activateLaptopGPS(true, false); }} className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">Retry Laptop GPS</button>
          <button onClick={(event) => { document.getElementById('laptop-gps-help-modal').classList.add('hidden'); switchPrimaryTab('map'); enableMapPinDropGPS(); }} className="py-2.5 rounded-xl bg-gray-950 hover:bg-gray-800 text-white text-xs font-bold">Set Pin on Map →</button>
        </div>
      </div>
    </div>
    </>
  );
}
