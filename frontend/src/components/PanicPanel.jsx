/* Inline-handler functions (switchPrimaryTab, setTravelMode, ...) are exposed on window by src/legacy/vyloApp.js */
export default function PanicPanel() {
  return (
    <>
    <section id="panel-panic" className="view-panel hidden h-full overflow-y-auto panel-scroll bg-[#FAFAFA] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="text-center space-y-1">
          <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold uppercase tracking-wider">Emergency Hub • One-Tap Dispatch</span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-950">Panic Mode — Police 112 + Parents Alert</h1>
          <p className="text-xs text-gray-500">One tap dials Police 112 and dispatches your laptop's live GPS coordinates &amp; route to your Parents.</p>
        </div>
        {/* Emergency Cards + Center SOS Button */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="space-y-3">
            <a href="tel:112" onClick={(event) => { showToast('Dialing Police Emergency 112...'); }} className="block p-4 rounded-2xl bg-white border-2 border-gray-900 hover:bg-gray-50 transition shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-base font-extrabold text-gray-950">Police 112</span>
                <span className="px-2 py-0.5 rounded-lg bg-gray-950 text-white text-[10px] font-bold">CALL</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">National Emergency Police Response</p>
            </a>
            <a href="tel:181" onClick={(event) => { showToast('Dialing Women Helpline 181...'); }} className="block p-4 rounded-2xl bg-white border-2 border-gray-900 hover:bg-gray-50 transition shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-base font-extrabold text-gray-950">Women Helpline 181</span>
                <span className="px-2 py-0.5 rounded-lg bg-gray-950 text-white text-[10px] font-bold">24×7</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Dedicated 24×7 Women Safety Support</p>
            </a>
          </div>
          <div className="flex flex-col items-center justify-center py-3">
            <button onClick={(event) => { triggerFullSOS(); }} className="relative w-36 h-36 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-xl flex flex-col items-center justify-center transition">
              <span className="sos-pulse-ring absolute inset-0 rounded-full border-4 border-red-500"></span>{' '}<span className="text-3xl font-black tracking-wider">SOS</span>{' '}<span className="text-[10px] font-semibold uppercase tracking-widest mt-1 text-red-100">Police + Parents</span>
            </button>
          </div>
          <div className="space-y-3">
            <a href="tel:108" onClick={(event) => { showToast('Dialing Ambulance 108...'); }} className="block p-4 rounded-2xl bg-white border-2 border-gray-900 hover:bg-gray-50 transition shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-base font-extrabold text-gray-950">Ambulance 108</span>
                <span className="px-2 py-0.5 rounded-lg bg-gray-950 text-white text-[10px] font-bold">MEDICAL</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Emergency Medical &amp; Trauma Dispatch</p>
            </a>
            <div className="p-4 rounded-2xl bg-white border-2 border-emerald-600 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-gray-950">Trusted Parents Circle</span>
                <span id="trusted-count-badge" className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold">2 Saved</span>
              </div>
              <p className="text-[11px] text-gray-500">Receives instant live GPS + route on SOS</p>
            </div>
          </div>
        </div>
        {/* Important People in Your Life */}
        <div className="bg-white rounded-3xl border border-gray-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Emergency Contacts</span>
              <h2 className="text-base font-extrabold text-gray-950">Important People in Your Life</h2>
            </div>
            <span className="text-[11px] text-gray-500">Alerted automatically alongside Police 112</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <input id="contact-name-input" type="text" placeholder="Name (e.g., Mom, Dad)" className="sm:col-span-4 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold" />
            <input id="contact-phone-input" type="tel" placeholder="Phone (+91 98110...)" className="sm:col-span-4 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-mono font-semibold" />
            <select id="contact-relation-input" className="sm:col-span-2 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-2 text-xs font-semibold">
              <option value="Parents">Parents</option>
              <option value="Family">Family</option>
              <option value="Partner">Partner</option>
              <option value="Friend">Friend</option>
            </select>
            <button onClick={(event) => { addTrustedContact(); }} className="sm:col-span-2 py-2 px-3 rounded-xl bg-gray-950 hover:bg-gray-800 text-white text-xs font-bold transition">+ Add</button>
          </div>
          <div id="trusted-contacts-list" className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"></div>
        </div>
        {/* Locality-Based Women-Only Masked Community Circle */}
        <div className="bg-[#121316] text-white rounded-3xl border border-gray-800 p-5 shadow-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/30 text-[10px] font-bold">♀ GOVT-ID VERIFIED • MASKED IDENTITY</span>
              </div>
              <h2 className="text-base font-extrabold text-white mt-1">Locality Women-Only Safety Circle</h2>
              <p className="text-xs text-gray-400">Your name &amp; phone stay masked to members. Local Women Constables receive GPS only if SOS is triggered.</p>
            </div>
            <button onClick={(event) => { triggerSilentCheckOnMe(); }} className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition">Silent "Check on Me"</button>
          </div>
          <div className="flex gap-2">
            <input id="women-circle-input" type="text" placeholder="Post masked alert (e.g., Leaving office — walking toward Metro)..." className="flex-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-hidden" />
            <button onClick={(event) => { postWomenCircleUpdate(); }} className="px-4 py-2 rounded-xl bg-white text-gray-950 text-xs font-bold hover:bg-gray-100 transition">Post</button>
          </div>
          <div id="women-circle-feed" className="space-y-2 text-xs"></div>
        </div>
        {/* Active SOS Live Dispatch Banner */}
        <div id="sos-dispatch-banner" className="hidden p-4 rounded-2xl bg-red-50 border-2 border-red-500 text-xs space-y-2">
          <p className="font-extrabold text-red-800">● SOS Active — Calling Police 112 &amp; Sharing Live GPS with Parents</p>
          <p id="sos-live-coords-text" className="font-mono text-red-700"></p>
          <div id="sos-contacts-quick-actions" className="flex flex-wrap gap-2 pt-1"></div>
        </div>
      </div>
    </section>
    </>
  );
}
