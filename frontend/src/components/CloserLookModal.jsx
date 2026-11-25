/* Inline-handler functions (switchPrimaryTab, setTravelMode, ...) are exposed on window by src/legacy/vyloApp.js */
export default function CloserLookModal() {
  return (
    <>
    <div id="closer-look-modal" className="hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#121316] text-white border border-gray-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto panel-scroll">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <h3 className="text-lg font-extrabold">A closer look at this route</h3>
          <button onClick={(event) => { closeCloserLookModal(); }} className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center text-gray-300 hover:text-white">✕</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(event) => { switchCloserLookRoute('safe'); }} id="closer-btn-safe" className="flex-1 py-2 rounded-xl bg-white text-gray-950 text-xs font-bold">Safest route</button>
          <button onClick={(event) => { switchCloserLookRoute('unsafe'); }} id="closer-btn-unsafe" className="flex-1 py-2 rounded-xl bg-white/10 text-gray-300 text-xs font-bold">Fastest route</button>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white">What goes into this score</h4>
          <p className="text-xs text-gray-400 leading-relaxed">Activity &amp; infrastructure points along the journey. A lower score does not mean the road is unsafe.</p>
        </div>
        <div id="closer-look-rows" className="divide-y divide-gray-800 text-xs"></div>
      </div>
    </div>
    </>
  );
}
