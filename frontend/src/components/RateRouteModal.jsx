/* Inline-handler functions (switchPrimaryTab, setTravelMode, ...) are exposed on window by src/legacy/vyloApp.js */
export default function RateRouteModal() {
  return (
    <>
    <div id="rate-route-modal" className="hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white text-gray-950 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Destination Reached • Route Feedback</span>
            <h3 className="text-lg font-extrabold mt-0.5">How safe &amp; good was this route?</h3>
          </div>
          <button onClick={(event) => { closeRateRouteModal(); }} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-950">✕</button>
        </div>
        <div className="flex items-center justify-center gap-2 py-2" id="rate-stars-row">
          <button type="button" onClick={(event) => { setRatingStars(1); }} className="star-btn text-3xl text-amber-400">★</button>
          <button type="button" onClick={(event) => { setRatingStars(2); }} className="star-btn text-3xl text-amber-400">★</button>
          <button type="button" onClick={(event) => { setRatingStars(3); }} className="star-btn text-3xl text-amber-400">★</button>
          <button type="button" onClick={(event) => { setRatingStars(4); }} className="star-btn text-3xl text-amber-400">★</button>
          <button type="button" onClick={(event) => { setRatingStars(5); }} className="star-btn text-3xl text-amber-400">★</button>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <button type="button" onClick={(event) => { toggleFeedbackTag(event.currentTarget, 'Well-lit'); }} className="fb-tag-btn px-3 py-1.5 rounded-full bg-gray-950 text-white font-semibold">💡 Well-lit</button>
          <button type="button" onClick={(event) => { toggleFeedbackTag(event.currentTarget, 'Crowded & active'); }} className="fb-tag-btn px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-semibold">👥 Crowded &amp; active</button>
          <button type="button" onClick={(event) => { toggleFeedbackTag(event.currentTarget, 'Police visible'); }} className="fb-tag-btn px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-semibold">🚔 Police visible</button>
          <button type="button" onClick={(event) => { toggleFeedbackTag(event.currentTarget, 'Cameras present'); }} className="fb-tag-btn px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-semibold">📹 Cameras present</button>
        </div>
        <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-pink-50 border border-pink-200 cursor-pointer text-xs">
          <input id="rate-woman-check" type="checkbox" defaultChecked className="w-4 h-4 accent-pink-600" />
          <span className="font-bold text-pink-950">♀ Recommend this route as a Woman Traveler</span>
        </label>
        <textarea id="rate-comment-input" rows="2" placeholder="Optional note (e.g., Main road shops were open till 10:30 PM)..." className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 text-xs focus:outline-hidden"></textarea>
        <button type="button" onClick={(event) => { submitRouteFeedback(); }} className="w-full py-3 rounded-2xl bg-gray-950 hover:bg-gray-800 text-white text-xs font-bold transition">Submit Route Rating</button>
      </div>
    </div>
    </>
  );
}
